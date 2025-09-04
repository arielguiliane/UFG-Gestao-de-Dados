/**
 * MCP Database Connector - MongoDB
 * Conector para banco NoSQL MongoDB
 */

import { MongoClient, ObjectId } from 'mongodb';
import { Logger } from '../../utils/logger.js';

export class MongoDBConnector {
    constructor() {
        this.logger = new Logger();
        this.client = null;
        this.db = null;
        
        this.config = {
            url: process.env.MONGODB_URL || 'mongodb://localhost:27017',
            dbName: process.env.MONGODB_DB || 'coleta_dados',
            options: {
                maxPoolSize: 10,
                serverSelectionTimeoutMS: 5000,
                socketTimeoutMS: 45000,
            }
        };
        
        this.collections = {
            documentos: 'documentos_coleta',
            logs: 'logs_coleta',
            produtos: 'produtos_flexivel',
            meteorologia: 'meteorologia_flexivel'
        };
    }

    async conectar() {
        try {
            this.logger.info('🍃 Conectando ao MongoDB...');
            
            this.client = new MongoClient(this.config.url, this.config.options);
            await this.client.connect();
            
            this.db = this.client.db(this.config.dbName);
            
            // Testa a conexão
            await this.db.admin().ping();
            
            this.logger.success('✅ MongoDB conectado com sucesso');
            
        } catch (error) {
            this.logger.error('❌ Erro ao conectar MongoDB:', error);
            throw error;
        }
    }

    async criarColecoes() {
        try {
            this.logger.info('🏗️ Configurando coleções MongoDB...');
            
            // Cria coleções se não existirem
            const colecoes = await this.db.listCollections().toArray();
            const nomesColecoes = colecoes.map(c => c.name);
            
            for (const [key, nome] of Object.entries(this.collections)) {
                if (!nomesColecoes.includes(nome)) {
                    await this.db.createCollection(nome);
                    this.logger.info(`📄 Coleção ${nome} criada`);
                }
            }
            
            this.logger.success('✅ Coleções MongoDB configuradas');
            
        } catch (error) {
            this.logger.error('❌ Erro ao criar coleções:', error);
            throw error;
        }
    }

    async criarIndices() {
        try {
            this.logger.info('📊 Criando índices MongoDB...');
            
            // Índices para documentos de coleta
            await this.db.collection(this.collections.documentos).createIndexes([
                { key: { 'metadados.geradoEm': 1 } },
                { key: { 'metadados.fontes': 1 } },
                { key: { 'produtos.dados.categoria': 1 } },
                { key: { 'produtos.dados.preco': 1 } }
            ]);
            
            // Índices para logs
            await this.db.collection(this.collections.logs).createIndexes([
                { key: { timestamp: -1 } },
                { key: { status: 1 } },
                { key: { totalProdutos: 1 } }
            ]);
            
            // Índices para produtos flexível
            await this.db.collection(this.collections.produtos).createIndexes([
                { key: { categoria: 1 } },
                { key: { preco: 1 } },
                { key: { coletadoEm: -1 } },
                { key: { loja: 1 } }
            ]);
            
            // Índices para meteorologia flexível
            await this.db.collection(this.collections.meteorologia).createIndexes([
                { key: { 'estacao.codigo': 1 } },
                { key: { 'dadosMeteorologicos.data': -1 } },
                { key: { 'estacao.uf': 1 } },
                { key: { 'dadosMeteorologicos.temperatura': 1 } }
            ]);
            
            this.logger.success('✅ Índices MongoDB criados');
            
        } catch (error) {
            this.logger.error('❌ Erro ao criar índices:', error);
            throw error;
        }
    }

    async salvarDocumentoCompleto(dados) {
        try {
            this.logger.info('📄 Salvando documento completo no MongoDB...');
            
            const documento = {
                ...dados,
                _id: new ObjectId(),
                salvoEm: new Date(),
                versao: '1.0',
                fonte: 'sistema-coleta-dados'
            };
            
            const resultado = await this.db.collection(this.collections.documentos)
                .insertOne(documento);
            
            this.logger.success(`✅ Documento salvo no MongoDB: ${resultado.insertedId}`);
            return { id: resultado.insertedId, documento };
            
        } catch (error) {
            this.logger.error('❌ Erro ao salvar documento:', error);
            throw error;
        }
    }

    async salvarLogColeta(logData) {
        try {
            const log = {
                ...logData,
                _id: new ObjectId(),
                criadoEm: new Date()
            };
            
            const resultado = await this.db.collection(this.collections.logs)
                .insertOne(log);
            
            return { id: resultado.insertedId, log };
            
        } catch (error) {
            this.logger.error('❌ Erro ao salvar log:', error);
            throw error;
        }
    }

    async salvarProdutosFlexivel(produtos) {
        try {
            this.logger.info(`📱 Salvando ${produtos.length} produtos flexíveis no MongoDB...`);
            
            const produtosComId = produtos.map(produto => ({
                ...produto,
                _id: new ObjectId(),
                salvoEm: new Date()
            }));
            
            const resultado = await this.db.collection(this.collections.produtos)
                .insertMany(produtosComId);
            
            this.logger.success(`✅ ${resultado.insertedCount} produtos salvos no MongoDB`);
            return { ids: Object.values(resultado.insertedIds), count: resultado.insertedCount };
            
        } catch (error) {
            this.logger.error('❌ Erro ao salvar produtos flexíveis:', error);
            throw error;
        }
    }

    async salvarMeteorologiaFlexivel(estacoes) {
        try {
            this.logger.info(`🌤️ Salvando ${estacoes.length} dados meteorológicos flexíveis no MongoDB...`);
            
            const dadosComId = estacoes.map(estacao => ({
                ...estacao,
                _id: new ObjectId(),
                salvoEm: new Date()
            }));
            
            const resultado = await this.db.collection(this.collections.meteorologia)
                .insertMany(dadosComId);
            
            this.logger.success(`✅ ${resultado.insertedCount} dados meteorológicos salvos no MongoDB`);
            return { ids: Object.values(resultado.insertedIds), count: resultado.insertedCount };
            
        } catch (error) {
            this.logger.error('❌ Erro ao salvar dados meteorológicos flexíveis:', error);
            throw error;
        }
    }

    // Operações CRUD
    async buscarDocumentos(filtros = {}) {
        try {
            const query = {};
            
            if (filtros.dataInicio) {
                query['metadados.geradoEm'] = { $gte: new Date(filtros.dataInicio) };
            }
            
            if (filtros.dataFim) {
                query['metadados.geradoEm'] = { 
                    ...query['metadados.geradoEm'], 
                    $lte: new Date(filtros.dataFim) 
                };
            }
            
            if (filtros.fonte) {
                query['metadados.fontes'] = { $in: [filtros.fonte] };
            }
            
            const options = {
                sort: { 'metadados.geradoEm': -1 },
                limit: filtros.limite || 50
            };
            
            const documentos = await this.db.collection(this.collections.documentos)
                .find(query, options).toArray();
            
            return documentos;
            
        } catch (error) {
            this.logger.error('❌ Erro ao buscar documentos:', error);
            throw error;
        }
    }

    async buscarLogsColeta(filtros = {}) {
        try {
            const query = {};
            
            if (filtros.status) {
                query.status = filtros.status;
            }
            
            if (filtros.dataInicio) {
                query.timestamp = { $gte: new Date(filtros.dataInicio) };
            }
            
            if (filtros.dataFim) {
                query.timestamp = { 
                    ...query.timestamp, 
                    $lte: new Date(filtros.dataFim) 
                };
            }
            
            const options = {
                sort: { timestamp: -1 },
                limit: filtros.limite || 100
            };
            
            const logs = await this.db.collection(this.collections.logs)
                .find(query, options).toArray();
            
            return logs;
            
        } catch (error) {
            this.logger.error('❌ Erro ao buscar logs:', error);
            throw error;
        }
    }

    async buscarProdutos(filtros = {}) {
        try {
            const query = {};
            
            if (filtros.categoria) {
                query.categoria = filtros.categoria;
            }
            
            if (filtros.loja) {
                query.loja = filtros.loja;
            }
            
            if (filtros.precoMin || filtros.precoMax) {
                query.preco = {};
                if (filtros.precoMin) query.preco.$gte = filtros.precoMin;
                if (filtros.precoMax) query.preco.$lte = filtros.precoMax;
            }
            
            const options = {
                sort: { coletadoEm: -1 },
                limit: filtros.limite || 50
            };
            
            const produtos = await this.db.collection(this.collections.produtos)
                .find(query, options).toArray();
            
            return produtos;
            
        } catch (error) {
            this.logger.error('❌ Erro ao buscar produtos:', error);
            throw error;
        }
    }

    async buscarMeteorologicos(filtros = {}) {
        try {
            const query = {};
            
            if (filtros.estacao) {
                query['estacao.codigo'] = filtros.estacao;
            }
            
            if (filtros.uf) {
                query['estacao.uf'] = filtros.uf;
            }
            
            if (filtros.temperaturaMin || filtros.temperaturaMax) {
                query['dadosMeteorologicos.temperatura'] = {};
                if (filtros.temperaturaMin) query['dadosMeteorologicos.temperatura'].$gte = filtros.temperaturaMin;
                if (filtros.temperaturaMax) query['dadosMeteorologicos.temperatura'].$lte = filtros.temperaturaMax;
            }
            
            const options = {
                sort: { 'dadosMeteorologicos.data': -1 },
                limit: filtros.limite || 50
            };
            
            const dados = await this.db.collection(this.collections.meteorologia)
                .find(query, options).toArray();
            
            return dados;
            
        } catch (error) {
            this.logger.error('❌ Erro ao buscar dados meteorológicos:', error);
            throw error;
        }
    }

    async atualizarDocumento(id, dados) {
        try {
            const resultado = await this.db.collection(this.collections.documentos)
                .updateOne(
                    { _id: new ObjectId(id) },
                    { 
                        $set: { 
                            ...dados, 
                            atualizadoEm: new Date() 
                        } 
                    }
                );
            
            return resultado.modifiedCount > 0;
            
        } catch (error) {
            this.logger.error('❌ Erro ao atualizar documento:', error);
            throw error;
        }
    }

    async deletarDocumento(id) {
        try {
            const resultado = await this.db.collection(this.collections.documentos)
                .deleteOne({ _id: new ObjectId(id) });
            
            return resultado.deletedCount > 0;
            
        } catch (error) {
            this.logger.error('❌ Erro ao deletar documento:', error);
            throw error;
        }
    }

    // Métodos de estatísticas e agregação
    async contarDocumentos() {
        try {
            return await this.db.collection(this.collections.documentos).countDocuments();
        } catch (error) {
            this.logger.error('❌ Erro ao contar documentos:', error);
            return 0;
        }
    }

    async contarLogs() {
        try {
            return await this.db.collection(this.collections.logs).countDocuments();
        } catch (error) {
            this.logger.error('❌ Erro ao contar logs:', error);
            return 0;
        }
    }

    async obterUltimaColeta() {
        try {
            const ultimaColeta = await this.db.collection(this.collections.logs)
                .findOne({}, { sort: { timestamp: -1 } });
            
            return ultimaColeta ? ultimaColeta.timestamp : null;
        } catch (error) {
            this.logger.error('❌ Erro ao obter última coleta:', error);
            return null;
        }
    }

    async obterEstatisticasAvancadas() {
        try {
            const pipeline = [
                {
                    $group: {
                        _id: null,
                        totalDocumentos: { $sum: 1 },
                        mediaProdutos: { $avg: '$produtos.total' },
                        mediaEstacoes: { $avg: '$meteorologia.total' }
                    }
                }
            ];
            
            const resultado = await this.db.collection(this.collections.documentos)
                .aggregate(pipeline).toArray();
            
            return resultado[0] || {};
            
        } catch (error) {
            this.logger.error('❌ Erro ao gerar estatísticas avançadas:', error);
            return {};
        }
    }

    async testarConexao() {
        try {
            await this.db.admin().ping();
            const stats = await this.db.stats();
            
            return {
                sucesso: true,
                database: stats.db,
                collections: stats.collections,
                dataSize: stats.dataSize
            };
        } catch (error) {
            return {
                sucesso: false,
                erro: error.message
            };
        }
    }

    async desconectar() {
        if (this.client) {
            await this.client.close();
            this.logger.info('🔒 MongoDB desconectado');
        }
    }
}
