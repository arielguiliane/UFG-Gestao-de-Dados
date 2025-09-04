/**
 * MCP File Processor
 * Processa arquivos CSV/JSON dos dados coletados
 */

import fs from 'fs/promises';
import path from 'path';
import { createReadStream, createWriteStream } from 'fs';
import { pipeline } from 'stream/promises';
import { Transform } from 'stream';
import { Logger } from '../../utils/logger.js';

export class FileProcessor {
    constructor() {
        this.logger = new Logger();
        this.supportedFormats = ['json', 'csv', 'txt'];
        this.outputDir = 'data/processed';
        this.inputDir = 'data/raw';
    }

    async inicializar() {
        try {
            this.logger.info('📁 Inicializando File Processor...');
            
            // Cria diretórios necessários
            await this.criarDiretorios();
            
            this.logger.success('✅ File Processor inicializado');
            
        } catch (error) {
            this.logger.error('❌ Erro ao inicializar File Processor:', error);
            throw error;
        }
    }

    async criarDiretorios() {
        const diretorios = [
            this.inputDir,
            this.outputDir,
            `${this.outputDir}/json`,
            `${this.outputDir}/csv`,
            `${this.outputDir}/reports`,
            `${this.outputDir}/transformed`
        ];

        for (const dir of diretorios) {
            try {
                await fs.mkdir(dir, { recursive: true });
                this.logger.debug(`📂 Diretório criado: ${dir}`);
            } catch (error) {
                if (error.code !== 'EEXIST') {
                    throw error;
                }
            }
        }
    }

    async processarArquivo(caminhoArquivo, opcoes = {}) {
        try {
            this.logger.info(`📄 Processando arquivo: ${caminhoArquivo}`);
            
            const stats = await fs.stat(caminhoArquivo);
            const extensao = path.extname(caminhoArquivo).toLowerCase().slice(1);
            
            if (!this.supportedFormats.includes(extensao)) {
                throw new Error(`Formato não suportado: ${extensao}`);
            }

            const resultado = {
                arquivo: caminhoArquivo,
                tamanho: stats.size,
                formato: extensao,
                processadoEm: new Date().toISOString(),
                dados: null,
                estatisticas: null,
                arquivoSaida: null
            };

            // Processa baseado no formato
            switch (extensao) {
                case 'json':
                    resultado.dados = await this.processarJSON(caminhoArquivo, opcoes);
                    break;
                case 'csv':
                    resultado.dados = await this.processarCSV(caminhoArquivo, opcoes);
                    break;
                case 'txt':
                    resultado.dados = await this.processarTXT(caminhoArquivo, opcoes);
                    break;
            }

            // Gera estatísticas
            resultado.estatisticas = await this.gerarEstatisticas(resultado.dados);

            // Salva resultado processado
            if (opcoes.salvarResultado !== false) {
                resultado.arquivoSaida = await this.salvarResultado(resultado, opcoes);
            }

            this.logger.success(`✅ Arquivo processado: ${caminhoArquivo}`);
            return resultado;

        } catch (error) {
            this.logger.error(`❌ Erro ao processar arquivo ${caminhoArquivo}:`, error);
            throw error;
        }
    }

    async processarJSON(caminhoArquivo, opcoes = {}) {
        try {
            const conteudo = await fs.readFile(caminhoArquivo, 'utf8');
            const dados = JSON.parse(conteudo);

            // Aplica transformações se especificadas
            if (opcoes.transformacoes) {
                return await this.aplicarTransformacoes(dados, opcoes.transformacoes);
            }

            return dados;

        } catch (error) {
            this.logger.error('❌ Erro ao processar JSON:', error);
            throw error;
        }
    }

    async processarCSV(caminhoArquivo, opcoes = {}) {
        try {
            const conteudo = await fs.readFile(caminhoArquivo, 'utf8');
            const linhas = conteudo.split('\n').filter(linha => linha.trim());
            
            if (linhas.length === 0) {
                return [];
            }

            // Primeira linha como cabeçalho
            const cabecalho = linhas[0].split(',').map(col => col.trim());
            const dados = [];

            for (let i = 1; i < linhas.length; i++) {
                const valores = linhas[i].split(',').map(val => val.trim());
                const objeto = {};
                
                cabecalho.forEach((col, index) => {
                    objeto[col] = valores[index] || null;
                });
                
                dados.push(objeto);
            }

            // Aplica transformações se especificadas
            if (opcoes.transformacoes) {
                return await this.aplicarTransformacoes(dados, opcoes.transformacoes);
            }

            return dados;

        } catch (error) {
            this.logger.error('❌ Erro ao processar CSV:', error);
            throw error;
        }
    }

    async processarTXT(caminhoArquivo, opcoes = {}) {
        try {
            const conteudo = await fs.readFile(caminhoArquivo, 'utf8');
            const linhas = conteudo.split('\n').filter(linha => linha.trim());

            const dados = {
                totalLinhas: linhas.length,
                conteudo: linhas,
                palavras: conteudo.split(/\s+/).length,
                caracteres: conteudo.length
            };

            return dados;

        } catch (error) {
            this.logger.error('❌ Erro ao processar TXT:', error);
            throw error;
        }
    }

    async aplicarTransformacoes(dados, transformacoes) {
        let dadosTransformados = dados;

        for (const transformacao of transformacoes) {
            switch (transformacao.tipo) {
                case 'filtrar':
                    dadosTransformados = this.filtrarDados(dadosTransformados, transformacao.criterio);
                    break;
                case 'mapear':
                    dadosTransformados = this.mapearDados(dadosTransformados, transformacao.mapeamento);
                    break;
                case 'agrupar':
                    dadosTransformados = this.agruparDados(dadosTransformados, transformacao.campo);
                    break;
                case 'ordenar':
                    dadosTransformados = this.ordenarDados(dadosTransformados, transformacao.campo, transformacao.ordem);
                    break;
                case 'limpar':
                    dadosTransformados = this.limparDados(dadosTransformados, transformacao.regras);
                    break;
            }
        }

        return dadosTransformados;
    }

    filtrarDados(dados, criterio) {
        if (!Array.isArray(dados)) return dados;
        
        return dados.filter(item => {
            for (const [campo, valor] of Object.entries(criterio)) {
                if (item[campo] !== valor) {
                    return false;
                }
            }
            return true;
        });
    }

    mapearDados(dados, mapeamento) {
        if (!Array.isArray(dados)) return dados;
        
        return dados.map(item => {
            const novoItem = {};
            for (const [novoNome, campoOriginal] of Object.entries(mapeamento)) {
                novoItem[novoNome] = item[campoOriginal];
            }
            return novoItem;
        });
    }

    agruparDados(dados, campo) {
        if (!Array.isArray(dados)) return dados;
        
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

    ordenarDados(dados, campo, ordem = 'asc') {
        if (!Array.isArray(dados)) return dados;
        
        return dados.sort((a, b) => {
            const valorA = a[campo];
            const valorB = b[campo];
            
            if (ordem === 'desc') {
                return valorB > valorA ? 1 : -1;
            }
            return valorA > valorB ? 1 : -1;
        });
    }

    limparDados(dados, regras) {
        if (!Array.isArray(dados)) return dados;
        
        return dados.map(item => {
            const itemLimpo = { ...item };
            
            for (const regra of regras) {
                switch (regra.tipo) {
                    case 'removerNulos':
                        Object.keys(itemLimpo).forEach(key => {
                            if (itemLimpo[key] === null || itemLimpo[key] === undefined) {
                                delete itemLimpo[key];
                            }
                        });
                        break;
                    case 'trimTexto':
                        Object.keys(itemLimpo).forEach(key => {
                            if (typeof itemLimpo[key] === 'string') {
                                itemLimpo[key] = itemLimpo[key].trim();
                            }
                        });
                        break;
                    case 'converterNumeros':
                        regra.campos?.forEach(campo => {
                            if (itemLimpo[campo] && !isNaN(itemLimpo[campo])) {
                                itemLimpo[campo] = parseFloat(itemLimpo[campo]);
                            }
                        });
                        break;
                }
            }
            
            return itemLimpo;
        });
    }

    async gerarEstatisticas(dados) {
        try {
            if (!dados) return null;

            const estatisticas = {
                tipo: Array.isArray(dados) ? 'array' : typeof dados,
                geradoEm: new Date().toISOString()
            };

            if (Array.isArray(dados)) {
                estatisticas.totalRegistros = dados.length;
                
                if (dados.length > 0) {
                    estatisticas.campos = Object.keys(dados[0]);
                    estatisticas.amostra = dados.slice(0, 3);
                    
                    // Estatísticas por campo
                    estatisticas.camposEstatisticas = {};
                    for (const campo of estatisticas.campos) {
                        const valores = dados.map(item => item[campo]).filter(val => val !== null && val !== undefined);
                        
                        estatisticas.camposEstatisticas[campo] = {
                            totalValores: valores.length,
                            valoresUnicos: [...new Set(valores)].length,
                            tipo: typeof valores[0]
                        };
                        
                        if (typeof valores[0] === 'number') {
                            estatisticas.camposEstatisticas[campo].min = Math.min(...valores);
                            estatisticas.camposEstatisticas[campo].max = Math.max(...valores);
                            estatisticas.camposEstatisticas[campo].media = valores.reduce((a, b) => a + b, 0) / valores.length;
                        }
                    }
                }
            } else if (typeof dados === 'object') {
                estatisticas.campos = Object.keys(dados);
                estatisticas.totalCampos = estatisticas.campos.length;
            }

            return estatisticas;

        } catch (error) {
            this.logger.error('❌ Erro ao gerar estatísticas:', error);
            return null;
        }
    }

    async salvarResultado(resultado, opcoes = {}) {
        try {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const nomeBase = path.basename(resultado.arquivo, path.extname(resultado.arquivo));
            const nomeArquivo = `${nomeBase}_processado_${timestamp}.json`;
            const caminhoSaida = path.join(this.outputDir, 'json', nomeArquivo);

            await fs.writeFile(caminhoSaida, JSON.stringify(resultado, null, 2));
            
            this.logger.success(`💾 Resultado salvo: ${caminhoSaida}`);
            return caminhoSaida;

        } catch (error) {
            this.logger.error('❌ Erro ao salvar resultado:', error);
            throw error;
        }
    }

    async processarLote(diretorio, opcoes = {}) {
        try {
            this.logger.info(`📁 Processando lote de arquivos em: ${diretorio}`);
            
            const arquivos = await fs.readdir(diretorio);
            const resultados = [];

            for (const arquivo of arquivos) {
                const caminhoCompleto = path.join(diretorio, arquivo);
                const stats = await fs.stat(caminhoCompleto);
                
                if (stats.isFile()) {
                    try {
                        const resultado = await this.processarArquivo(caminhoCompleto, opcoes);
                        resultados.push(resultado);
                    } catch (error) {
                        this.logger.warn(`⚠️ Erro ao processar ${arquivo}: ${error.message}`);
                    }
                }
            }

            this.logger.success(`✅ Lote processado: ${resultados.length} arquivos`);
            return resultados;

        } catch (error) {
            this.logger.error('❌ Erro ao processar lote:', error);
            throw error;
        }
    }

    async criarPipelineStream(transformacoes = []) {
        const transforms = transformacoes.map(transformacao => {
            return new Transform({
                objectMode: true,
                transform(chunk, encoding, callback) {
                    try {
                        // Aplica transformação específica
                        const resultado = this.aplicarTransformacao(chunk, transformacao);
                        callback(null, resultado);
                    } catch (error) {
                        callback(error);
                    }
                }
            });
        });

        return transforms;
    }
}

// Execução direta para testes
if (import.meta.url === `file://${process.argv[1]}`) {
    const processor = new FileProcessor();
    
    processor.inicializar()
        .then(() => {
            console.log('✅ File Processor pronto para uso!');
            console.log('📁 Diretórios configurados:');
            console.log(`   - Input: ${processor.inputDir}`);
            console.log(`   - Output: ${processor.outputDir}`);
        })
        .catch(error => console.error('❌ Erro:', error));
}
