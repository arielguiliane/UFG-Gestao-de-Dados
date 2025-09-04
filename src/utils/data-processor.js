/**
 * Processador de Dados
 * Utilitário para processar, validar e salvar dados coletados
 */

import fs from 'fs/promises';
import path from 'path';
import { Logger } from './logger.js';

export class DataProcessor {
    constructor() {
        this.logger = new Logger();
        this.outputDir = 'dados-coletados';
    }

    async processar(dados) {
        try {
            this.logger.info('🔄 Iniciando processamento dos dados...');
            
            // Cria diretório de saída se não existir
            await this.criarDiretorio();
            
            // Valida os dados
            const dadosValidados = await this.validarDados(dados);
            
            // Processa produtos do Magazine Luiza
            const produtosProcessados = await this.processarProdutos(dadosValidados.produtos);
            
            // Processa dados meteorológicos do INMET
            const meteorologiaProcessada = await this.processarMeteorologicos(dadosValidados.meteorologia);
            
            // Gera relatório consolidado
            const relatorio = await this.gerarRelatorio({
                produtos: produtosProcessados,
                meteorologia: meteorologiaProcessada,
                timestamp: dadosValidados.timestamp
            });
            
            // Salva os dados
            const arquivoSalvo = await this.salvarDados(relatorio);
            
            this.logger.success('✅ Processamento concluído com sucesso!');
            
            return {
                produtos: produtosProcessados,
                meteorologia: meteorologiaProcessada,
                arquivo: arquivoSalvo,
                resumo: this.gerarResumo(relatorio)
            };
            
        } catch (error) {
            this.logger.error('❌ Erro durante processamento:', error);
            throw error;
        }
    }

    async criarDiretorio() {
        try {
            await fs.mkdir(this.outputDir, { recursive: true });
            this.logger.info(`📁 Diretório ${this.outputDir} preparado`);
        } catch (error) {
            this.logger.error('❌ Erro ao criar diretório:', error);
            throw error;
        }
    }

    async validarDados(dados) {
        this.logger.info('✅ Validando dados recebidos...');
        
        const dadosValidados = {
            produtos: Array.isArray(dados.produtos) ? dados.produtos : [],
            meteorologia: Array.isArray(dados.meteorologia) ? dados.meteorologia : [],
            timestamp: dados.timestamp || new Date().toISOString()
        };
        
        this.logger.info(`📦 ${dadosValidados.produtos.length} produtos para processar`);
        this.logger.info(`🌤️ ${dadosValidados.meteorologia.length} estações meteorológicas para processar`);
        
        return dadosValidados;
    }

    async processarProdutos(produtos) {
        this.logger.info('📱 Processando dados do Magazine Luiza...');
        
        const produtosProcessados = produtos.map(produto => ({
            ...produto,
            // Calcula economia se houver preço original
            economia: produto.precoOriginal ? 
                (produto.precoOriginal - produto.preco).toFixed(2) : null,
            percentualDesconto: produto.precoOriginal ? 
                (((produto.precoOriginal - produto.preco) / produto.precoOriginal) * 100).toFixed(1) : null,
            // Categoriza por faixa de preço
            faixaPreco: this.categorizarPreco(produto.preco),
            // Limpa e padroniza título
            tituloLimpo: produto.titulo?.substring(0, 100).trim()
        }));
        
        // Ordena por preço
        produtosProcessados.sort((a, b) => a.preco - b.preco);
        
        this.logger.success(`✅ ${produtosProcessados.length} produtos processados`);
        return produtosProcessados;
    }

    async processarMeteorologicos(estacoes) {
        this.logger.info('🌤️ Processando dados meteorológicos do INMET...');
        
        const meteorologiaProcessada = estacoes.map(estacao => ({
            ...estacao,
            // Adiciona classificações
            classificacaoTemperatura: this.classificarTemperatura(estacao.dadosMeteorologicos?.temperatura),
            classificacaoUmidade: this.classificarUmidade(estacao.dadosMeteorologicos?.umidade),
            indiceConforto: this.calcularIndiceConforto(
                estacao.dadosMeteorologicos?.temperatura,
                estacao.dadosMeteorologicos?.umidade
            ),
            // Converte coordenadas para formato mais legível
            localizacao: `${estacao.latitude?.toFixed(4)}, ${estacao.longitude?.toFixed(4)}`
        }));
        
        this.logger.success(`✅ ${meteorologiaProcessada.length} estações processadas`);
        return meteorologiaProcessada;
    }

    async gerarRelatorio(dados) {
        this.logger.info('📊 Gerando relatório consolidado...');
        
        const relatorio = {
            metadados: {
                geradoEm: dados.timestamp,
                versaoSistema: '1.0.0',
                fontes: ['Magazine Luiza', 'INMET'],
                totalRegistros: dados.produtos.length + dados.meteorologia.length
            },
            produtos: {
                total: dados.produtos.length,
                dados: dados.produtos,
                estatisticas: this.calcularEstatisticasProdutos(dados.produtos)
            },
            meteorologia: {
                total: dados.meteorologia.length,
                dados: dados.meteorologia,
                estatisticas: this.calcularEstatisticasMeteorologicas(dados.meteorologia)
            }
        };
        
        return relatorio;
    }

    async salvarDados(relatorio) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const nomeArquivo = `coleta-dados-${timestamp}.json`;
        const caminhoArquivo = path.join(this.outputDir, nomeArquivo);
        
        try {
            await fs.writeFile(
                caminhoArquivo, 
                JSON.stringify(relatorio, null, 2), 
                'utf8'
            );
            
            this.logger.success(`💾 Dados salvos em: ${caminhoArquivo}`);
            return caminhoArquivo;
            
        } catch (error) {
            this.logger.error('❌ Erro ao salvar arquivo:', error);
            throw error;
        }
    }

    // Métodos auxiliares
    categorizarPreco(preco) {
        if (preco < 100) return 'Baixo';
        if (preco < 500) return 'Médio';
        if (preco < 1000) return 'Alto';
        return 'Premium';
    }

    classificarTemperatura(temp) {
        if (!temp) return 'N/A';
        if (temp < 15) return 'Frio';
        if (temp < 25) return 'Ameno';
        if (temp < 30) return 'Quente';
        return 'Muito Quente';
    }

    classificarUmidade(umidade) {
        if (!umidade) return 'N/A';
        if (umidade < 30) return 'Baixa';
        if (umidade < 60) return 'Moderada';
        if (umidade < 80) return 'Alta';
        return 'Muito Alta';
    }

    calcularIndiceConforto(temp, umidade) {
        if (!temp || !umidade) return 'N/A';
        
        // Índice simplificado de conforto térmico
        if (temp >= 20 && temp <= 26 && umidade >= 40 && umidade <= 70) {
            return 'Confortável';
        } else if (temp >= 18 && temp <= 28 && umidade >= 30 && umidade <= 80) {
            return 'Aceitável';
        } else {
            return 'Desconfortável';
        }
    }

    calcularEstatisticasProdutos(produtos) {
        if (!produtos.length) return {};
        
        const precos = produtos.map(p => p.preco).filter(p => p > 0);
        
        return {
            precoMedio: (precos.reduce((a, b) => a + b, 0) / precos.length).toFixed(2),
            precoMinimo: Math.min(...precos).toFixed(2),
            precoMaximo: Math.max(...precos).toFixed(2),
            totalComDesconto: produtos.filter(p => p.desconto).length,
            categoriasMaisComuns: this.contarCategorias(produtos)
        };
    }

    calcularEstatisticasMeteorologicas(estacoes) {
        if (!estacoes.length) return {};
        
        const temperaturas = estacoes
            .map(e => e.dadosMeteorologicos?.temperatura)
            .filter(t => t !== undefined);
        
        return {
            temperaturaMedia: temperaturas.length ? 
                (temperaturas.reduce((a, b) => a + b, 0) / temperaturas.length).toFixed(1) : 'N/A',
            temperaturaMinima: temperaturas.length ? Math.min(...temperaturas) : 'N/A',
            temperaturaMaxima: temperaturas.length ? Math.max(...temperaturas) : 'N/A',
            estacoesAtivas: estacoes.filter(e => e.status === 'Ativa').length
        };
    }

    contarCategorias(produtos) {
        const contagem = {};
        produtos.forEach(produto => {
            const categoria = produto.categoria || 'Outros';
            contagem[categoria] = (contagem[categoria] || 0) + 1;
        });
        return contagem;
    }

    gerarResumo(relatorio) {
        return {
            totalProdutos: relatorio.produtos.total,
            totalEstacoes: relatorio.meteorologia.total,
            precoMedio: relatorio.produtos.estatisticas.precoMedio,
            temperaturaMedia: relatorio.meteorologia.estatisticas.temperaturaMedia
        };
    }
}
