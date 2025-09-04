/**
 * Pipeline Manager
 * Gerenciador principal do pipeline de processamento (Exercício 3)
 */

import { FileProcessor } from './file-processor/file-processor.js';
import { StreamProcessor } from './stream-processor/stream-processor.js';
import { DataTransformer } from './transformations/data-transformer.js';
import { ReportGenerator } from './reports/report-generator.js';
import { AnomalyDetector } from './alerts/anomaly-detector.js';
import { Logger } from '../utils/logger.js';

export class PipelineManager {
    constructor() {
        this.logger = new Logger();
        this.fileProcessor = new FileProcessor();
        this.streamProcessor = new StreamProcessor();
        this.dataTransformer = new DataTransformer();
        this.reportGenerator = new ReportGenerator();
        this.anomalyDetector = new AnomalyDetector();
        this.isInitialized = false;
        this.pipelines = new Map();
        this.estatisticas = {
            pipelinesExecutados: 0,
            dadosProcessados: 0,
            relatoriosGerados: 0,
            anomaliasDetectadas: 0,
            iniciadoEm: null
        };
    }

    async inicializar() {
        try {
            this.logger.info('🚀 Inicializando Pipeline Manager...');
            
            // Inicializa todos os componentes
            await this.fileProcessor.inicializar();
            await this.streamProcessor.inicializar();
            await this.reportGenerator.inicializar();
            await this.anomalyDetector.inicializar();
            
            // Configura eventos
            this.configurarEventos();
            
            this.isInitialized = true;
            this.estatisticas.iniciadoEm = new Date().toISOString();
            
            this.logger.success('✅ Pipeline Manager inicializado com sucesso!');
            
        } catch (error) {
            this.logger.error('❌ Erro ao inicializar Pipeline Manager:', error);
            throw error;
        }
    }

    configurarEventos() {
        // Eventos do Stream Processor
        this.streamProcessor.on('dados', (dados) => {
            this.estatisticas.dadosProcessados++;
        });

        // Eventos do Anomaly Detector
        this.anomalyDetector.on('anomalia_detectada', (anomalia) => {
            this.estatisticas.anomaliasDetectadas++;
            this.logger.warn(`🚨 Anomalia: ${anomalia.regra}`);
        });

        this.anomalyDetector.on('alerta_critico', (alerta) => {
            this.logger.error(`🔥 CRÍTICO: ${alerta.regra} - ${alerta.descricao}`);
        });
    }

    async executarPipelineCompleto(dados, configuracao = {}) {
        try {
            this.logger.info('🔄 Executando pipeline completo de processamento...');
            
            if (!this.isInitialized) {
                await this.inicializar();
            }

            const resultado = {
                entrada: {
                    tipo: Array.isArray(dados) ? 'array' : typeof dados,
                    tamanho: Array.isArray(dados) ? dados.length : 1,
                    timestamp: new Date().toISOString()
                },
                etapas: {},
                saida: null,
                estatisticas: null,
                tempo: {
                    inicio: Date.now(),
                    fim: null,
                    duracao: null
                }
            };

            // ETAPA 1: Limpeza e Transformação
            this.logger.info('🧹 Etapa 1: Limpeza e transformação dos dados...');
            resultado.etapas.limpeza = await this.executarLimpeza(dados, configuracao.limpeza);

            // ETAPA 2: Normalização
            this.logger.info('📏 Etapa 2: Normalização dos dados...');
            resultado.etapas.normalizacao = await this.executarNormalizacao(
                resultado.etapas.limpeza, 
                configuracao.normalizacao
            );

            // ETAPA 3: Processamento em Stream
            this.logger.info('🌊 Etapa 3: Processamento em stream...');
            resultado.etapas.stream = await this.executarStreamProcessing(
                resultado.etapas.normalizacao, 
                configuracao.stream
            );

            // ETAPA 4: Agregação
            this.logger.info('📊 Etapa 4: Agregação dos dados...');
            resultado.etapas.agregacao = await this.executarAgregacao(
                resultado.etapas.stream || resultado.etapas.normalizacao, 
                configuracao.agregacao
            );

            // ETAPA 5: Detecção de Anomalias
            this.logger.info('🔍 Etapa 5: Detecção de anomalias...');
            resultado.etapas.anomalias = await this.executarDeteccaoAnomalias(
                resultado.etapas.agregacao || resultado.etapas.normalizacao
            );

            // ETAPA 6: Geração de Relatórios
            this.logger.info('📋 Etapa 6: Geração de relatórios...');
            resultado.etapas.relatorios = await this.executarGeracaoRelatorios(
                resultado.etapas.agregacao || resultado.etapas.normalizacao,
                configuracao.relatorios
            );

            // Finaliza resultado
            resultado.tempo.fim = Date.now();
            resultado.tempo.duracao = resultado.tempo.fim - resultado.tempo.inicio;
            resultado.saida = resultado.etapas.agregacao || resultado.etapas.normalizacao;
            resultado.estatisticas = this.gerarEstatisticasPipeline(resultado);

            this.estatisticas.pipelinesExecutados++;
            
            this.logger.success(`✅ Pipeline completo executado em ${resultado.tempo.duracao}ms`);
            return resultado;

        } catch (error) {
            this.logger.error('❌ Erro no pipeline completo:', error);
            throw error;
        }
    }

    async executarLimpeza(dados, configuracao = {}) {
        const regrasLimpeza = configuracao.regras || [
            { tipo: 'removerNulos', campos: null },
            { tipo: 'trimTextos', campos: null },
            { tipo: 'removerDuplicados', chave: null },
            { 
                tipo: 'corrigirTipos', 
                conversoes: [
                    { campo: 'preco', tipo: 'numero' },
                    { campo: 'temperatura', tipo: 'numero' },
                    { campo: 'umidade', tipo: 'inteiro' }
                ]
            }
        ];

        return await this.dataTransformer.limparDados(dados, regrasLimpeza);
    }

    async executarNormalizacao(dados, configuracao = {}) {
        const configNormalizacao = {
            produtos: true,
            meteorologia: true,
            textos: ['titulo', 'categoria', 'nome'],
            numeros: [
                { campo: 'preco', precisao: 2 },
                { campo: 'temperatura', precisao: 1 },
                { campo: 'umidade', precisao: 0 }
            ],
            ...configuracao
        };

        return await this.dataTransformer.normalizarDados(dados, configNormalizacao);
    }

    async executarStreamProcessing(dados, configuracao = {}) {
        if (!configuracao.ativo) {
            return dados; // Pula processamento em stream se não configurado
        }

        // Cria transformadores
        this.streamProcessor.criarTransformadorLimpeza();
        this.streamProcessor.criarTransformadorNormalizacao();

        // Cria filtros
        if (configuracao.filtros?.preco) {
            this.streamProcessor.criarFiltroPreco(
                configuracao.filtros.preco.min || 0,
                configuracao.filtros.preco.max || 999999
            );
        }

        if (configuracao.filtros?.categorias) {
            this.streamProcessor.criarFiltroCategoria(configuracao.filtros.categorias);
        }

        // Cria agregadores
        this.streamProcessor.criarAgregadorEstatisticas();

        // Configura pipeline
        const pipelineConfig = {
            transformadores: ['limpeza', 'normalizacao'],
            filtros: configuracao.filtros ? Object.keys(configuracao.filtros) : [],
            agregadores: ['estatisticas']
        };

        // Processa dados
        await this.streamProcessor.processarDados(dados, pipelineConfig);

        return dados; // Retorna dados originais (processamento em stream é para análise)
    }

    async executarAgregacao(dados, configuracao = {}) {
        const configAgregacao = {
            estatisticas_gerais: {
                tipo: 'personalizado',
                funcao: (dados) => this.calcularEstatisticasGerais(dados)
            },
            por_categoria: {
                tipo: 'agrupamento',
                campo: 'categoria'
            },
            precos: {
                tipo: 'personalizado',
                funcao: (dados) => this.calcularEstatisticasPrecos(dados)
            },
            meteorologia: {
                tipo: 'personalizado',
                funcao: (dados) => this.calcularEstatisticasMeteorologicas(dados)
            },
            ...configuracao
        };

        return await this.dataTransformer.agregarDados(dados, configAgregacao);
    }

    async executarDeteccaoAnomalias(dados) {
        const anomalias = await this.anomalyDetector.analisarDados(dados);
        
        return {
            totalAnomalias: anomalias.length,
            anomalias: anomalias,
            relatorio: await this.anomalyDetector.gerarRelatorioAnomalias()
        };
    }

    async executarGeracaoRelatorios(dados, configuracao = {}) {
        const configRelatorio = {
            titulo: 'Relatório de Processamento de Dados',
            subtitulo: 'Análise completa dos dados coletados e processados',
            formatos: ['html', 'json'],
            secoes: [
                {
                    titulo: '📊 Estatísticas Gerais',
                    tipo: 'estatisticas'
                },
                {
                    titulo: '📋 Dados Processados',
                    tipo: 'tabela',
                    limite: 50
                },
                {
                    titulo: '📈 Análise por Categoria',
                    tipo: 'grafico',
                    tipoGrafico: 'pizza',
                    campo: 'categoria'
                },
                {
                    titulo: '📝 Resumo Executivo',
                    tipo: 'resumo'
                }
            ],
            ...configuracao
        };

        const relatorio = await this.reportGenerator.gerarRelatorio(dados, configRelatorio);
        this.estatisticas.relatoriosGerados++;

        return relatorio;
    }

    // Métodos auxiliares para cálculos específicos
    calcularEstatisticasGerais(dados) {
        if (!Array.isArray(dados)) return {};

        return {
            totalRegistros: dados.length,
            camposUnicos: dados.length > 0 ? Object.keys(dados[0]).length : 0,
            periodoAnalise: {
                inicio: this.obterDataMinima(dados),
                fim: this.obterDataMaxima(dados)
            },
            completude: this.calcularCompletude(dados)
        };
    }

    calcularEstatisticasPrecos(dados) {
        if (!Array.isArray(dados)) return {};

        const precos = dados
            .map(item => parseFloat(item.preco))
            .filter(preco => !isNaN(preco));

        if (precos.length === 0) return {};

        return {
            total: precos.length,
            minimo: Math.min(...precos),
            maximo: Math.max(...precos),
            media: precos.reduce((a, b) => a + b, 0) / precos.length,
            mediana: this.calcularMediana(precos),
            desvio: this.calcularDesvioPadrao(precos)
        };
    }

    calcularEstatisticasMeteorologicas(dados) {
        if (!Array.isArray(dados)) return {};

        const temperaturas = dados
            .map(item => parseFloat(item.temperatura))
            .filter(temp => !isNaN(temp));

        const umidades = dados
            .map(item => parseInt(item.umidade))
            .filter(umid => !isNaN(umid));

        return {
            temperatura: temperaturas.length > 0 ? {
                total: temperaturas.length,
                minima: Math.min(...temperaturas),
                maxima: Math.max(...temperaturas),
                media: temperaturas.reduce((a, b) => a + b, 0) / temperaturas.length
            } : {},
            umidade: umidades.length > 0 ? {
                total: umidades.length,
                minima: Math.min(...umidades),
                maxima: Math.max(...umidades),
                media: umidades.reduce((a, b) => a + b, 0) / umidades.length
            } : {}
        };
    }

    // Métodos utilitários
    obterDataMinima(dados) {
        const datas = dados
            .map(item => new Date(item.coletadoEm || item.data || Date.now()))
            .filter(data => !isNaN(data.getTime()));
        
        return datas.length > 0 ? new Date(Math.min(...datas)).toISOString() : null;
    }

    obterDataMaxima(dados) {
        const datas = dados
            .map(item => new Date(item.coletadoEm || item.data || Date.now()))
            .filter(data => !isNaN(data.getTime()));
        
        return datas.length > 0 ? new Date(Math.max(...datas)).toISOString() : null;
    }

    calcularCompletude(dados) {
        if (!Array.isArray(dados) || dados.length === 0) return 0;

        const campos = Object.keys(dados[0]);
        let totalCelulas = 0;
        let celulasPreenchidas = 0;

        dados.forEach(item => {
            campos.forEach(campo => {
                totalCelulas++;
                if (item[campo] !== null && item[campo] !== undefined && item[campo] !== '') {
                    celulasPreenchidas++;
                }
            });
        });

        return totalCelulas > 0 ? Math.round((celulasPreenchidas / totalCelulas) * 100) : 0;
    }

    calcularMediana(valores) {
        const ordenados = [...valores].sort((a, b) => a - b);
        const meio = Math.floor(ordenados.length / 2);
        
        if (ordenados.length % 2 === 0) {
            return (ordenados[meio - 1] + ordenados[meio]) / 2;
        }
        return ordenados[meio];
    }

    calcularDesvioPadrao(valores) {
        const media = valores.reduce((a, b) => a + b, 0) / valores.length;
        const variancia = valores.reduce((acc, val) => acc + Math.pow(val - media, 2), 0) / valores.length;
        return Math.sqrt(variancia);
    }

    gerarEstatisticasPipeline(resultado) {
        return {
            tempoExecucao: resultado.tempo.duracao,
            etapasExecutadas: Object.keys(resultado.etapas).length,
            dadosEntrada: resultado.entrada.tamanho,
            dadosSaida: Array.isArray(resultado.saida) ? resultado.saida.length : 1,
            anomaliasDetectadas: resultado.etapas.anomalias?.totalAnomalias || 0,
            relatoriosGerados: resultado.etapas.relatorios ? 1 : 0
        };
    }

    obterEstatisticasGerais() {
        return {
            ...this.estatisticas,
            componentes: {
                fileProcessor: this.fileProcessor.supportedFormats,
                streamProcessor: this.streamProcessor.obterEstatisticas(),
                anomalyDetector: this.anomalyDetector.obterEstatisticas(),
                reportGenerator: { outputDir: this.reportGenerator.outputDir }
            },
            isInitialized: this.isInitialized
        };
    }

    async processarArquivo(caminhoArquivo, configuracao = {}) {
        try {
            this.logger.info(`📄 Processando arquivo: ${caminhoArquivo}`);
            
            // Processa arquivo
            const resultadoArquivo = await this.fileProcessor.processarArquivo(caminhoArquivo, configuracao);
            
            // Executa pipeline nos dados do arquivo
            const resultadoPipeline = await this.executarPipelineCompleto(resultadoArquivo.dados, configuracao);
            
            return {
                arquivo: resultadoArquivo,
                pipeline: resultadoPipeline
            };
            
        } catch (error) {
            this.logger.error(`❌ Erro ao processar arquivo ${caminhoArquivo}:`, error);
            throw error;
        }
    }

    async gerarDashboard(dados, configuracao = {}) {
        return await this.reportGenerator.gerarDashboard(dados, configuracao);
    }

    async finalizar() {
        try {
            this.logger.info('🔒 Finalizando Pipeline Manager...');
            
            await this.streamProcessor.finalizar();
            this.anomalyDetector.pararMonitoramento();
            
            this.logger.success('✅ Pipeline Manager finalizado');
            
        } catch (error) {
            this.logger.error('❌ Erro ao finalizar Pipeline Manager:', error);
            throw error;
        }
    }
}

// Execução direta para testes
if (import.meta.url === `file://${process.argv[1]}`) {
    const manager = new PipelineManager();
    
    manager.inicializar()
        .then(() => {
            console.log('✅ Pipeline Manager pronto para uso!');
            console.log('📊 Estatísticas:', manager.obterEstatisticasGerais());
        })
        .catch(error => console.error('❌ Erro:', error));
}
