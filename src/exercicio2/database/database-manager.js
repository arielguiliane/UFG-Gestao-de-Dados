/**
 * MCP Database Connector - Gerenciador Principal
 * Coordena conexões PostgreSQL e MongoDB
 */

import { PostgreSQLConnector } from './postgresql-connector.js';
import { MongoDBConnector } from './mongodb-connector.js';
import { DataValidator } from './data-validator.js';
import { Logger } from '../../utils/logger.js';

export class DatabaseManager {
    constructor() {
        this.logger = new Logger();
        this.postgresql = new PostgreSQLConnector();
        this.mongodb = new MongoDBConnector();
        this.validator = new DataValidator();
        this.isConnected = false;
    }

    async inicializar() {
        try {
            this.logger.info('🔌 Inicializando conexões com bancos de dados...');
            
            // Conecta PostgreSQL
            await this.postgresql.conectar();
            this.logger.success('✅ PostgreSQL conectado');
            
            // Conecta MongoDB
            await this.mongodb.conectar();
            this.logger.success('✅ MongoDB conectado');
            
            // Configura esquemas e índices
            await this.configurarEstrutura();
            
            this.isConnected = true;
            this.logger.success('🎉 Database Manager inicializado com sucesso!');
            
        } catch (error) {
            this.logger.error('❌ Erro ao inicializar Database Manager:', error);
            throw error;
        }
    }

    async configurarEstrutura() {
        this.logger.info('🏗️ Configurando estruturas de dados...');
        
        // Configura tabelas PostgreSQL
        await this.postgresql.criarTabelas();
        await this.postgresql.criarIndices();
        
        // Configura coleções MongoDB
        await this.mongodb.criarColecoes();
        await this.mongodb.criarIndices();
        
        this.logger.success('✅ Estruturas configuradas');
    }

    async salvarDadosColetados(dados) {
        try {
            if (!this.isConnected) {
                await this.inicializar();
            }

            this.logger.info('💾 Salvando dados coletados nos bancos...');
            
            // Valida dados antes de salvar
            const dadosValidados = await this.validator.validarDadosCompletos(dados);
            
            const resultados = {
                postgresql: {},
                mongodb: {},
                timestamp: new Date().toISOString()
            };

            // Salva produtos no PostgreSQL (dados estruturados)
            if (dadosValidados.produtos && dadosValidados.produtos.length > 0) {
                this.logger.info('📱 Salvando produtos no PostgreSQL...');
                resultados.postgresql.produtos = await this.postgresql.salvarProdutos(dadosValidados.produtos);
            }

            // Salva dados meteorológicos no PostgreSQL
            if (dadosValidados.meteorologia && dadosValidados.meteorologia.length > 0) {
                this.logger.info('🌤️ Salvando dados meteorológicos no PostgreSQL...');
                resultados.postgresql.meteorologia = await this.postgresql.salvarMeteorologicos(dadosValidados.meteorologia);
            }

            // Salva dados completos no MongoDB (documento flexível)
            this.logger.info('📄 Salvando documento completo no MongoDB...');
            resultados.mongodb.documento = await this.mongodb.salvarDocumentoCompleto(dadosValidados);

            // Salva logs de coleta
            resultados.mongodb.log = await this.mongodb.salvarLogColeta({
                timestamp: dadosValidados.timestamp,
                totalProdutos: dadosValidados.produtos?.length || 0,
                totalEstacoes: dadosValidados.meteorologia?.length || 0,
                status: 'sucesso'
            });

            this.logger.success('✅ Dados salvos com sucesso em ambos os bancos!');
            return resultados;

        } catch (error) {
            this.logger.error('❌ Erro ao salvar dados:', error);
            
            // Salva log de erro
            try {
                await this.mongodb.salvarLogColeta({
                    timestamp: new Date().toISOString(),
                    status: 'erro',
                    erro: error.message
                });
            } catch (logError) {
                this.logger.error('❌ Erro ao salvar log de erro:', logError);
            }
            
            throw error;
        }
    }

    // Operações CRUD - PostgreSQL
    async buscarProdutos(filtros = {}) {
        return await this.postgresql.buscarProdutos(filtros);
    }

    async buscarDadosMeteorologicos(filtros = {}) {
        return await this.postgresql.buscarDadosMeteorologicos(filtros);
    }

    async atualizarProduto(id, dados) {
        const dadosValidados = await this.validator.validarProduto(dados);
        return await this.postgresql.atualizarProduto(id, dadosValidados);
    }

    async deletarProduto(id) {
        return await this.postgresql.deletarProduto(id);
    }

    // Operações CRUD - MongoDB
    async buscarDocumentos(filtros = {}) {
        return await this.mongodb.buscarDocumentos(filtros);
    }

    async buscarLogsColeta(filtros = {}) {
        return await this.mongodb.buscarLogsColeta(filtros);
    }

    async atualizarDocumento(id, dados) {
        return await this.mongodb.atualizarDocumento(id, dados);
    }

    async deletarDocumento(id) {
        return await this.mongodb.deletarDocumento(id);
    }

    // Operações de análise
    async obterEstatisticas() {
        try {
            this.logger.info('📊 Gerando estatísticas dos dados...');
            
            const estatisticas = {
                postgresql: {
                    totalProdutos: await this.postgresql.contarProdutos(),
                    totalEstacoes: await this.postgresql.contarEstacoes(),
                    precoMedio: await this.postgresql.calcularPrecoMedio(),
                    temperaturaMedia: await this.postgresql.calcularTemperaturaMedia()
                },
                mongodb: {
                    totalDocumentos: await this.mongodb.contarDocumentos(),
                    totalLogs: await this.mongodb.contarLogs(),
                    ultimaColeta: await this.mongodb.obterUltimaColeta()
                }
            };

            this.logger.success('✅ Estatísticas geradas');
            return estatisticas;

        } catch (error) {
            this.logger.error('❌ Erro ao gerar estatísticas:', error);
            throw error;
        }
    }

    async finalizar() {
        try {
            this.logger.info('🔒 Fechando conexões com bancos de dados...');
            
            await this.postgresql.desconectar();
            await this.mongodb.desconectar();
            
            this.isConnected = false;
            this.logger.success('✅ Conexões fechadas');
            
        } catch (error) {
            this.logger.error('❌ Erro ao fechar conexões:', error);
            throw error;
        }
    }

    // Método para testar conexões
    async testarConexoes() {
        try {
            this.logger.info('🧪 Testando conexões com bancos de dados...');
            
            const testesPostgreSQL = await this.postgresql.testarConexao();
            const testesMongoDB = await this.mongodb.testarConexao();
            
            const resultados = {
                postgresql: testesPostgreSQL,
                mongodb: testesMongoDB,
                status: testesPostgreSQL.sucesso && testesMongoDB.sucesso ? 'sucesso' : 'falha'
            };
            
            if (resultados.status === 'sucesso') {
                this.logger.success('✅ Todos os testes de conexão passaram!');
            } else {
                this.logger.error('❌ Alguns testes de conexão falharam');
            }
            
            return resultados;
            
        } catch (error) {
            this.logger.error('❌ Erro durante testes de conexão:', error);
            throw error;
        }
    }
}

// Execução direta para testes
if (import.meta.url === `file://${process.argv[1]}`) {
    const manager = new DatabaseManager();
    
    manager.testarConexoes()
        .then(resultados => {
            console.log('\n📊 Resultados dos testes:');
            console.log('PostgreSQL:', resultados.postgresql.sucesso ? '✅' : '❌');
            console.log('MongoDB:', resultados.mongodb.sucesso ? '✅' : '❌');
        })
        .catch(error => console.error('Erro:', error))
        .finally(() => manager.finalizar());
}
