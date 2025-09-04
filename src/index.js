/**
 * Sistema de Coleta de Dados - Exercício 1
 * Integração Magazine Luiza (Web Scraper) + INMET (API Client)
 */

import { MagaluScraper } from './exercicio1/scraper/magalu-scraper.js';
import { InmetClient } from './exercicio1/api/inmet-client.js';
import { DataProcessor } from './utils/data-processor.js';
import { DatabaseManager } from './exercicio2/database/database-manager.js';
import { PipelineManager } from './exercicio3/pipeline-manager.js';
import { Logger } from './utils/logger.js';

class SistemaColetaDados {
    constructor() {
        this.scraper = new MagaluScraper();
        this.inmetClient = new InmetClient();
        this.dataProcessor = new DataProcessor();
        this.databaseManager = new DatabaseManager();
        this.pipelineManager = new PipelineManager();
        this.logger = new Logger();
    }

    async executarColeta() {
        try {
            this.logger.info('🚀 Iniciando Sistema de Coleta de Dados');
            
            // Coleta dados do Magazine Luiza
            this.logger.info('📱 Coletando dados do Magazine Luiza...');
            const produtosMagalu = await this.scraper.coletarProdutos();
            
            // Coleta dados meteorológicos do INMET
            this.logger.info('🌤️  Coletando dados meteorológicos do INMET...');
            const dadosMeteorologicos = await this.inmetClient.obterDadosGoias();
            
            // Processa e salva os dados
            this.logger.info('💾 Processando e salvando dados...');
            const dadosProcessados = await this.dataProcessor.processar({
                produtos: produtosMagalu,
                meteorologia: dadosMeteorologicos,
                timestamp: new Date().toISOString()
            });

            // Salva nos bancos de dados
            this.logger.info('🗄️ Salvando dados nos bancos de dados...');
            const resultadoBanco = await this.databaseManager.salvarDadosColetados(dadosProcessados);

            // Executa pipeline de processamento avançado
            this.logger.info('🔄 Executando pipeline de processamento avançado...');
            const resultadoPipeline = await this.pipelineManager.executarPipelineCompleto(dadosProcessados, {
                limpeza: { ativo: true },
                normalizacao: { ativo: true },
                stream: { ativo: false }, // Desabilitado por padrão para não duplicar processamento
                agregacao: { ativo: true },
                relatorios: {
                    titulo: 'Relatório de Coleta Automatizada',
                    formatos: ['html', 'json']
                }
            });

            const resultado = {
                ...dadosProcessados,
                banco: resultadoBanco,
                pipeline: {
                    estatisticas: resultadoPipeline.estatisticas,
                    anomalias: resultadoPipeline.etapas.anomalias?.totalAnomalias || 0,
                    relatorios: resultadoPipeline.etapas.relatorios?.arquivos || {},
                    tempo: resultadoPipeline.tempo
                }
            };

            this.logger.success('✅ Coleta e processamento finalizados com sucesso!');
            return resultado;
            
        } catch (error) {
            this.logger.error('❌ Erro durante a coleta:', error);
            throw error;
        } finally {
            // Garante que as conexões sejam fechadas
            try {
                await this.databaseManager.finalizar();
                await this.pipelineManager.finalizar();
            } catch (error) {
                this.logger.warn('⚠️ Erro ao fechar conexões:', error);
            }
        }
    }
}

// Execução principal
if (import.meta.url === `file://${process.argv[1]}`) {
    const sistema = new SistemaColetaDados();
    sistema.executarColeta()
        .then(resultado => {
            console.log('\n📊 Resumo da Coleta:');
            console.log(`- Produtos coletados: ${resultado.produtos?.length || 0}`);
            console.log(`- Estações meteorológicas: ${resultado.meteorologia?.length || 0}`);
            console.log(`- Arquivo salvo: ${resultado.arquivo}`);
            console.log('\n🗄️ Resumo do Banco de Dados:');
            console.log(`- PostgreSQL produtos: ${resultado.banco?.postgresql?.produtos?.length || 0}`);
            console.log(`- PostgreSQL meteorologia: ${resultado.banco?.postgresql?.meteorologia?.length || 0}`);
            console.log(`- MongoDB documento: ${resultado.banco?.mongodb?.documento?.id ? 'Salvo' : 'Erro'}`);
            console.log('\n🔄 Resumo do Pipeline:');
            console.log(`- Tempo de processamento: ${resultado.pipeline?.tempo?.duracao || 0}ms`);
            console.log(`- Anomalias detectadas: ${resultado.pipeline?.anomalias || 0}`);
            console.log(`- Relatórios gerados: ${Object.keys(resultado.pipeline?.relatorios || {}).length}`);
        })
        .catch(error => {
            console.error('Falha na execução:', error.message);
            process.exit(1);
        });
}

export { SistemaColetaDados };
