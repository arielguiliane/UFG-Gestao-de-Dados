/**
 * MCP Stream Processor
 * Processamento em tempo real com transformações e agregações
 */

import { EventEmitter } from 'events';
import { Transform, Writable, pipeline } from 'stream';
import { Logger } from '../../utils/logger.js';

export class StreamProcessor extends EventEmitter {
    constructor() {
        super();
        this.logger = new Logger();
        this.streams = new Map();
        this.agregadores = new Map();
        this.filtros = new Map();
        this.transformadores = new Map();
        this.isRunning = false;
        this.estatisticas = {
            processados: 0,
            erros: 0,
            iniciadoEm: null,
            ultimoProcessamento: null
        };
    }

    async inicializar() {
        try {
            this.logger.info('🌊 Inicializando Stream Processor...');
            
            this.configurarEventos();
            this.isRunning = true;
            this.estatisticas.iniciadoEm = new Date().toISOString();
            
            this.logger.success('✅ Stream Processor inicializado');
            
        } catch (error) {
            this.logger.error('❌ Erro ao inicializar Stream Processor:', error);
            throw error;
        }
    }

    configurarEventos() {
        this.on('dados', (dados) => {
            this.estatisticas.processados++;
            this.estatisticas.ultimoProcessamento = new Date().toISOString();
        });

        this.on('erro', (erro) => {
            this.estatisticas.erros++;
            this.logger.error('❌ Erro no stream:', erro);
        });
    }

    criarTransformador(nome, funcaoTransformacao) {
        const transformador = new Transform({
            objectMode: true,
            transform(chunk, encoding, callback) {
                try {
                    const resultado = funcaoTransformacao(chunk);
                    callback(null, resultado);
                } catch (error) {
                    callback(error);
                }
            }
        });

        this.transformadores.set(nome, transformador);
        this.logger.info(`🔄 Transformador criado: ${nome}`);
        return transformador;
    }

    criarFiltro(nome, criterio) {
        const filtro = new Transform({
            objectMode: true,
            transform(chunk, encoding, callback) {
                try {
                    const passou = typeof criterio === 'function' 
                        ? criterio(chunk) 
                        : this.avaliarCriterio(chunk, criterio);
                    
                    if (passou) {
                        callback(null, chunk);
                    } else {
                        callback(); // Não passa o chunk adiante
                    }
                } catch (error) {
                    callback(error);
                }
            }
        });

        this.filtros.set(nome, filtro);
        this.logger.info(`🔍 Filtro criado: ${nome}`);
        return filtro;
    }

    criarAgregador(nome, configuracao) {
        const agregador = {
            dados: [],
            configuracao,
            ultimaAgregacao: null,
            
            processar(item) {
                this.dados.push(item);
                
                // Verifica se deve agregar
                if (this.deveAgregar()) {
                    return this.agregar();
                }
                return null;
            },
            
            deveAgregar() {
                const config = this.configuracao;
                
                if (config.tamanhoLote && this.dados.length >= config.tamanhoLote) {
                    return true;
                }
                
                if (config.intervaloTempo && this.ultimaAgregacao) {
                    const agora = Date.now();
                    const tempoDecorrido = agora - this.ultimaAgregacao;
                    return tempoDecorrido >= config.intervaloTempo;
                }
                
                return false;
            },
            
            agregar() {
                const resultado = this.executarAgregacao();
                this.dados = [];
                this.ultimaAgregacao = Date.now();
                return resultado;
            },
            
            executarAgregacao() {
                const config = this.configuracao;
                const dados = [...this.dados];
                
                switch (config.tipo) {
                    case 'soma':
                        return dados.reduce((acc, item) => acc + (item[config.campo] || 0), 0);
                    case 'media':
                        const valores = dados.map(item => item[config.campo]).filter(v => v !== null);
                        return valores.length > 0 ? valores.reduce((a, b) => a + b, 0) / valores.length : 0;
                    case 'contagem':
                        return dados.length;
                    case 'agrupamento':
                        return this.agruparPorCampo(dados, config.campo);
                    case 'personalizado':
                        return config.funcao(dados);
                    default:
                        return dados;
                }
            },
            
            agruparPorCampo(dados, campo) {
                const grupos = {};
                dados.forEach(item => {
                    const chave = item[campo];
                    if (!grupos[chave]) {
                        grupos[chave] = [];
                    }
                    grupos[chave].push(item);
                });
                return grupos;
            }
        };

        const streamAgregador = new Transform({
            objectMode: true,
            transform(chunk, encoding, callback) {
                try {
                    const resultado = agregador.processar(chunk);
                    if (resultado !== null) {
                        callback(null, {
                            tipo: 'agregacao',
                            nome: nome,
                            resultado: resultado,
                            timestamp: new Date().toISOString()
                        });
                    } else {
                        callback(); // Não emite nada ainda
                    }
                } catch (error) {
                    callback(error);
                }
            }
        });

        this.agregadores.set(nome, { agregador, stream: streamAgregador });
        this.logger.info(`📊 Agregador criado: ${nome}`);
        return streamAgregador;
    }

    criarPipeline(configuracao) {
        const streams = [];
        
        // Adiciona transformadores
        if (configuracao.transformadores) {
            configuracao.transformadores.forEach(nome => {
                if (this.transformadores.has(nome)) {
                    streams.push(this.transformadores.get(nome));
                }
            });
        }
        
        // Adiciona filtros
        if (configuracao.filtros) {
            configuracao.filtros.forEach(nome => {
                if (this.filtros.has(nome)) {
                    streams.push(this.filtros.get(nome));
                }
            });
        }
        
        // Adiciona agregadores
        if (configuracao.agregadores) {
            configuracao.agregadores.forEach(nome => {
                if (this.agregadores.has(nome)) {
                    streams.push(this.agregadores.get(nome).stream);
                }
            });
        }
        
        // Adiciona stream de saída
        const saidaStream = new Writable({
            objectMode: true,
            write(chunk, encoding, callback) {
                this.emit('dados', chunk);
                callback();
            }
        });
        
        streams.push(saidaStream);
        
        return streams;
    }

    async processarDados(dados, configuracaoPipeline) {
        try {
            this.logger.info('🌊 Iniciando processamento em stream...');
            
            const streams = this.criarPipeline(configuracaoPipeline);
            
            // Cria stream de entrada
            const entradaStream = new Transform({
                objectMode: true,
                transform(chunk, encoding, callback) {
                    callback(null, chunk);
                }
            });
            
            // Configura pipeline
            const pipelineCompleto = [entradaStream, ...streams];
            
            // Executa pipeline
            await pipeline(...pipelineCompleto);
            
            // Processa dados
            if (Array.isArray(dados)) {
                for (const item of dados) {
                    entradaStream.write(item);
                }
            } else {
                entradaStream.write(dados);
            }
            
            entradaStream.end();
            
            this.logger.success('✅ Processamento em stream concluído');
            
        } catch (error) {
            this.logger.error('❌ Erro no processamento em stream:', error);
            this.emit('erro', error);
            throw error;
        }
    }

    // Transformações pré-definidas
    criarTransformadorLimpeza() {
        return this.criarTransformador('limpeza', (dados) => {
            if (typeof dados !== 'object') return dados;
            
            const dadosLimpos = {};
            
            Object.keys(dados).forEach(key => {
                let valor = dados[key];
                
                // Remove espaços em branco
                if (typeof valor === 'string') {
                    valor = valor.trim();
                }
                
                // Remove valores nulos/vazios se configurado
                if (valor !== null && valor !== undefined && valor !== '') {
                    dadosLimpos[key] = valor;
                }
            });
            
            return dadosLimpos;
        });
    }

    criarTransformadorNormalizacao() {
        return this.criarTransformador('normalizacao', (dados) => {
            if (typeof dados !== 'object') return dados;
            
            const dadosNormalizados = { ...dados };
            
            // Normaliza preços
            if (dadosNormalizados.preco) {
                dadosNormalizados.preco = parseFloat(dadosNormalizados.preco);
            }
            
            // Normaliza datas
            if (dadosNormalizados.data || dadosNormalizados.coletadoEm) {
                const campoData = dadosNormalizados.data || dadosNormalizados.coletadoEm;
                dadosNormalizados.dataProcessamento = new Date(campoData).toISOString();
            }
            
            // Normaliza textos
            Object.keys(dadosNormalizados).forEach(key => {
                if (typeof dadosNormalizados[key] === 'string') {
                    dadosNormalizados[key] = dadosNormalizados[key]
                        .toLowerCase()
                        .replace(/\s+/g, ' ')
                        .trim();
                }
            });
            
            return dadosNormalizados;
        });
    }

    criarFiltroPreco(precoMin, precoMax) {
        return this.criarFiltro('preco', (dados) => {
            const preco = parseFloat(dados.preco);
            return preco >= precoMin && preco <= precoMax;
        });
    }

    criarFiltroCategoria(categoriasPermitidas) {
        return this.criarFiltro('categoria', (dados) => {
            return categoriasPermitidas.includes(dados.categoria);
        });
    }

    criarAgregadorEstatisticas() {
        return this.criarAgregador('estatisticas', {
            tipo: 'personalizado',
            tamanhoLote: 100,
            funcao: (dados) => {
                const precos = dados.map(item => parseFloat(item.preco)).filter(p => !isNaN(p));
                const categorias = dados.map(item => item.categoria).filter(c => c);
                
                return {
                    totalItens: dados.length,
                    precoMedio: precos.length > 0 ? precos.reduce((a, b) => a + b, 0) / precos.length : 0,
                    precoMin: precos.length > 0 ? Math.min(...precos) : 0,
                    precoMax: precos.length > 0 ? Math.max(...precos) : 0,
                    categorias: [...new Set(categorias)],
                    totalCategorias: [...new Set(categorias)].length
                };
            }
        });
    }

    avaliarCriterio(dados, criterio) {
        for (const [campo, valor] of Object.entries(criterio)) {
            if (dados[campo] !== valor) {
                return false;
            }
        }
        return true;
    }

    obterEstatisticas() {
        return {
            ...this.estatisticas,
            streamsAtivos: this.streams.size,
            transformadores: this.transformadores.size,
            filtros: this.filtros.size,
            agregadores: this.agregadores.size,
            isRunning: this.isRunning
        };
    }

    async finalizar() {
        try {
            this.logger.info('🔒 Finalizando Stream Processor...');
            
            this.isRunning = false;
            
            // Força agregação final
            for (const [nome, { agregador }] of this.agregadores) {
                if (agregador.dados.length > 0) {
                    const resultado = agregador.agregar();
                    this.emit('dados', {
                        tipo: 'agregacao_final',
                        nome: nome,
                        resultado: resultado,
                        timestamp: new Date().toISOString()
                    });
                }
            }
            
            this.logger.success('✅ Stream Processor finalizado');
            
        } catch (error) {
            this.logger.error('❌ Erro ao finalizar Stream Processor:', error);
            throw error;
        }
    }
}

// Execução direta para testes
if (import.meta.url === `file://${process.argv[1]}`) {
    const processor = new StreamProcessor();
    
    processor.inicializar()
        .then(() => {
            console.log('✅ Stream Processor pronto para uso!');
            console.log('📊 Estatísticas:', processor.obterEstatisticas());
        })
        .catch(error => console.error('❌ Erro:', error));
}
