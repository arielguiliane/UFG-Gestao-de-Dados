/**
 * MCP Database Connector - PostgreSQL
 * Conector para banco relacional PostgreSQL
 */

import pg from 'pg';
import { Logger } from '../../utils/logger.js';

const { Pool } = pg;

export class PostgreSQLConnector {
    constructor() {
        this.logger = new Logger();
        this.pool = null;
        this.config = {
            host: process.env.POSTGRES_HOST || 'localhost',
            port: process.env.POSTGRES_PORT || 5432,
            database: process.env.POSTGRES_DB || 'coleta_dados',
            user: process.env.POSTGRES_USER || 'postgres',
            password: process.env.POSTGRES_PASSWORD || 'postgres',
            max: 20,
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 2000,
        };
    }

    async conectar() {
        try {
            this.logger.info('🐘 Conectando ao PostgreSQL...');
            
            this.pool = new Pool(this.config);
            
            // Testa a conexão
            const client = await this.pool.connect();
            await client.query('SELECT NOW()');
            client.release();
            
            this.logger.success('✅ PostgreSQL conectado com sucesso');
            
        } catch (error) {
            this.logger.error('❌ Erro ao conectar PostgreSQL:', error);
            throw error;
        }
    }

    async criarTabelas() {
        try {
            this.logger.info('🏗️ Criando tabelas PostgreSQL...');
            
            const client = await this.pool.connect();
            
            try {
                // Tabela de produtos (Magazine Luiza)
                await client.query(`
                    CREATE TABLE IF NOT EXISTS produtos (
                        id SERIAL PRIMARY KEY,
                        titulo VARCHAR(255) NOT NULL,
                        preco DECIMAL(10,2) NOT NULL,
                        preco_original DECIMAL(10,2),
                        desconto VARCHAR(50),
                        avaliacao VARCHAR(100),
                        categoria VARCHAR(100) NOT NULL,
                        loja VARCHAR(100) NOT NULL,
                        link TEXT,
                        imagem TEXT,
                        economia DECIMAL(10,2),
                        percentual_desconto DECIMAL(5,2),
                        faixa_preco VARCHAR(50),
                        coletado_em TIMESTAMP WITH TIME ZONE NOT NULL,
                        criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                        atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                    )
                `);

                // Tabela de estações meteorológicas
                await client.query(`
                    CREATE TABLE IF NOT EXISTS estacoes_meteorologicas (
                        id SERIAL PRIMARY KEY,
                        codigo VARCHAR(10) UNIQUE NOT NULL,
                        nome VARCHAR(100) NOT NULL,
                        uf CHAR(2) NOT NULL,
                        latitude DECIMAL(10,6),
                        longitude DECIMAL(10,6),
                        altitude INTEGER,
                        status VARCHAR(20) DEFAULT 'Ativa',
                        criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                        atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                    )
                `);

                // Tabela de dados meteorológicos
                await client.query(`
                    CREATE TABLE IF NOT EXISTS dados_meteorologicos (
                        id SERIAL PRIMARY KEY,
                        estacao_id INTEGER REFERENCES estacoes_meteorologicas(id),
                        data DATE NOT NULL,
                        hora TIME NOT NULL,
                        temperatura DECIMAL(5,2),
                        umidade INTEGER,
                        pressao DECIMAL(7,2),
                        velocidade_vento DECIMAL(5,2),
                        direcao_vento INTEGER,
                        precipitacao DECIMAL(6,2),
                        visibilidade DECIMAL(5,2),
                        condicao VARCHAR(100),
                        classificacao_temperatura VARCHAR(50),
                        classificacao_umidade VARCHAR(50),
                        indice_conforto VARCHAR(50),
                        coletado_em TIMESTAMP WITH TIME ZONE NOT NULL,
                        criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                    )
                `);

                // Tabela de logs de coleta
                await client.query(`
                    CREATE TABLE IF NOT EXISTS logs_coleta (
                        id SERIAL PRIMARY KEY,
                        timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
                        total_produtos INTEGER DEFAULT 0,
                        total_estacoes INTEGER DEFAULT 0,
                        status VARCHAR(20) NOT NULL,
                        erro TEXT,
                        duracao_segundos INTEGER,
                        criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                    )
                `);

                this.logger.success('✅ Tabelas PostgreSQL criadas');
                
            } finally {
                client.release();
            }
            
        } catch (error) {
            this.logger.error('❌ Erro ao criar tabelas:', error);
            throw error;
        }
    }

    async criarIndices() {
        try {
            this.logger.info('📊 Criando índices PostgreSQL...');
            
            const client = await this.pool.connect();
            
            try {
                // Índices para produtos
                await client.query('CREATE INDEX IF NOT EXISTS idx_produtos_categoria ON produtos(categoria)');
                await client.query('CREATE INDEX IF NOT EXISTS idx_produtos_preco ON produtos(preco)');
                await client.query('CREATE INDEX IF NOT EXISTS idx_produtos_coletado_em ON produtos(coletado_em)');
                await client.query('CREATE INDEX IF NOT EXISTS idx_produtos_loja ON produtos(loja)');

                // Índices para estações
                await client.query('CREATE INDEX IF NOT EXISTS idx_estacoes_codigo ON estacoes_meteorologicas(codigo)');
                await client.query('CREATE INDEX IF NOT EXISTS idx_estacoes_uf ON estacoes_meteorologicas(uf)');

                // Índices para dados meteorológicos
                await client.query('CREATE INDEX IF NOT EXISTS idx_dados_met_estacao ON dados_meteorologicos(estacao_id)');
                await client.query('CREATE INDEX IF NOT EXISTS idx_dados_met_data ON dados_meteorologicos(data)');
                await client.query('CREATE INDEX IF NOT EXISTS idx_dados_met_temperatura ON dados_meteorologicos(temperatura)');

                // Índices para logs
                await client.query('CREATE INDEX IF NOT EXISTS idx_logs_timestamp ON logs_coleta(timestamp)');
                await client.query('CREATE INDEX IF NOT EXISTS idx_logs_status ON logs_coleta(status)');

                this.logger.success('✅ Índices PostgreSQL criados');
                
            } finally {
                client.release();
            }
            
        } catch (error) {
            this.logger.error('❌ Erro ao criar índices:', error);
            throw error;
        }
    }

    async salvarProdutos(produtos) {
        try {
            this.logger.info(`💾 Salvando ${produtos.length} produtos no PostgreSQL...`);
            
            const client = await this.pool.connect();
            const produtosSalvos = [];
            
            try {
                for (const produto of produtos) {
                    const query = `
                        INSERT INTO produtos (
                            titulo, preco, preco_original, desconto, avaliacao, categoria, loja,
                            link, imagem, economia, percentual_desconto, faixa_preco, coletado_em
                        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
                        RETURNING id
                    `;
                    
                    const values = [
                        produto.titulo,
                        produto.preco,
                        produto.precoOriginal,
                        produto.desconto,
                        produto.avaliacao,
                        produto.categoria,
                        produto.loja,
                        produto.link,
                        produto.imagem,
                        produto.economia,
                        produto.percentualDesconto,
                        produto.faixaPreco,
                        produto.coletadoEm
                    ];
                    
                    const result = await client.query(query, values);
                    produtosSalvos.push({ id: result.rows[0].id, titulo: produto.titulo });
                }
                
                this.logger.success(`✅ ${produtosSalvos.length} produtos salvos no PostgreSQL`);
                return produtosSalvos;
                
            } finally {
                client.release();
            }
            
        } catch (error) {
            this.logger.error('❌ Erro ao salvar produtos:', error);
            throw error;
        }
    }

    async salvarMeteorologicos(estacoes) {
        try {
            this.logger.info(`🌤️ Salvando ${estacoes.length} dados meteorológicos no PostgreSQL...`);
            
            const client = await this.pool.connect();
            const dadosSalvos = [];
            
            try {
                for (const estacao of estacoes) {
                    // Primeiro, salva ou atualiza a estação
                    const estacaoQuery = `
                        INSERT INTO estacoes_meteorologicas (codigo, nome, uf, latitude, longitude, altitude, status)
                        VALUES ($1, $2, $3, $4, $5, $6, $7)
                        ON CONFLICT (codigo) DO UPDATE SET
                            nome = EXCLUDED.nome,
                            latitude = EXCLUDED.latitude,
                            longitude = EXCLUDED.longitude,
                            altitude = EXCLUDED.altitude,
                            status = EXCLUDED.status,
                            atualizado_em = NOW()
                        RETURNING id
                    `;
                    
                    const estacaoValues = [
                        estacao.codigo,
                        estacao.nome,
                        estacao.uf,
                        estacao.latitude,
                        estacao.longitude,
                        estacao.altitude,
                        estacao.status
                    ];
                    
                    const estacaoResult = await client.query(estacaoQuery, estacaoValues);
                    const estacaoId = estacaoResult.rows[0].id;
                    
                    // Depois, salva os dados meteorológicos
                    if (estacao.dadosMeteorologicos) {
                        const dados = estacao.dadosMeteorologicos;
                        
                        const dadosQuery = `
                            INSERT INTO dados_meteorologicos (
                                estacao_id, data, hora, temperatura, umidade, pressao,
                                velocidade_vento, direcao_vento, precipitacao, visibilidade,
                                condicao, classificacao_temperatura, classificacao_umidade,
                                indice_conforto, coletado_em
                            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
                            RETURNING id
                        `;
                        
                        const dadosValues = [
                            estacaoId,
                            dados.data,
                            dados.hora,
                            dados.temperatura,
                            dados.umidade,
                            dados.pressao,
                            dados.velocidadeVento,
                            dados.direcaoVento,
                            dados.precipitacao,
                            dados.visibilidade,
                            dados.condicao,
                            estacao.classificacaoTemperatura,
                            estacao.classificacaoUmidade,
                            estacao.indiceConforto,
                            dados.coletadoEm
                        ];
                        
                        const dadosResult = await client.query(dadosQuery, dadosValues);
                        dadosSalvos.push({ 
                            id: dadosResult.rows[0].id, 
                            estacao: estacao.nome,
                            temperatura: dados.temperatura 
                        });
                    }
                }
                
                this.logger.success(`✅ ${dadosSalvos.length} dados meteorológicos salvos no PostgreSQL`);
                return dadosSalvos;
                
            } finally {
                client.release();
            }
            
        } catch (error) {
            this.logger.error('❌ Erro ao salvar dados meteorológicos:', error);
            throw error;
        }
    }

    // Operações CRUD
    async buscarProdutos(filtros = {}) {
        const client = await this.pool.connect();
        
        try {
            let query = 'SELECT * FROM produtos WHERE 1=1';
            const values = [];
            let paramCount = 0;
            
            if (filtros.categoria) {
                query += ` AND categoria = $${++paramCount}`;
                values.push(filtros.categoria);
            }
            
            if (filtros.precoMin) {
                query += ` AND preco >= $${++paramCount}`;
                values.push(filtros.precoMin);
            }
            
            if (filtros.precoMax) {
                query += ` AND preco <= $${++paramCount}`;
                values.push(filtros.precoMax);
            }
            
            query += ' ORDER BY coletado_em DESC';
            
            if (filtros.limite) {
                query += ` LIMIT $${++paramCount}`;
                values.push(filtros.limite);
            }
            
            const result = await client.query(query, values);
            return result.rows;
            
        } finally {
            client.release();
        }
    }

    async buscarDadosMeteorologicos(filtros = {}) {
        const client = await this.pool.connect();
        
        try {
            let query = `
                SELECT dm.*, em.nome as estacao_nome, em.codigo as estacao_codigo
                FROM dados_meteorologicos dm
                JOIN estacoes_meteorologicas em ON dm.estacao_id = em.id
                WHERE 1=1
            `;
            const values = [];
            let paramCount = 0;
            
            if (filtros.estacao) {
                query += ` AND em.codigo = $${++paramCount}`;
                values.push(filtros.estacao);
            }
            
            if (filtros.dataInicio) {
                query += ` AND dm.data >= $${++paramCount}`;
                values.push(filtros.dataInicio);
            }
            
            if (filtros.dataFim) {
                query += ` AND dm.data <= $${++paramCount}`;
                values.push(filtros.dataFim);
            }
            
            query += ' ORDER BY dm.data DESC, dm.hora DESC';
            
            if (filtros.limite) {
                query += ` LIMIT $${++paramCount}`;
                values.push(filtros.limite);
            }
            
            const result = await client.query(query, values);
            return result.rows;
            
        } finally {
            client.release();
        }
    }

    async atualizarProduto(id, dados) {
        const client = await this.pool.connect();
        
        try {
            const query = `
                UPDATE produtos SET
                    titulo = $2, preco = $3, preco_original = $4, desconto = $5,
                    avaliacao = $6, categoria = $7, atualizado_em = NOW()
                WHERE id = $1
                RETURNING *
            `;
            
            const values = [id, dados.titulo, dados.preco, dados.precoOriginal, 
                          dados.desconto, dados.avaliacao, dados.categoria];
            
            const result = await client.query(query, values);
            return result.rows[0];
            
        } finally {
            client.release();
        }
    }

    async deletarProduto(id) {
        const client = await this.pool.connect();
        
        try {
            const result = await client.query('DELETE FROM produtos WHERE id = $1 RETURNING *', [id]);
            return result.rows[0];
            
        } finally {
            client.release();
        }
    }

    // Métodos de estatísticas
    async contarProdutos() {
        const client = await this.pool.connect();
        try {
            const result = await client.query('SELECT COUNT(*) as total FROM produtos');
            return parseInt(result.rows[0].total);
        } finally {
            client.release();
        }
    }

    async contarEstacoes() {
        const client = await this.pool.connect();
        try {
            const result = await client.query('SELECT COUNT(*) as total FROM estacoes_meteorologicas');
            return parseInt(result.rows[0].total);
        } finally {
            client.release();
        }
    }

    async calcularPrecoMedio() {
        const client = await this.pool.connect();
        try {
            const result = await client.query('SELECT AVG(preco) as media FROM produtos');
            return parseFloat(result.rows[0].media) || 0;
        } finally {
            client.release();
        }
    }

    async calcularTemperaturaMedia() {
        const client = await this.pool.connect();
        try {
            const result = await client.query('SELECT AVG(temperatura) as media FROM dados_meteorologicos WHERE temperatura IS NOT NULL');
            return parseFloat(result.rows[0].media) || 0;
        } finally {
            client.release();
        }
    }

    async testarConexao() {
        try {
            const client = await this.pool.connect();
            const result = await client.query('SELECT NOW() as timestamp, version() as version');
            client.release();
            
            return {
                sucesso: true,
                timestamp: result.rows[0].timestamp,
                versao: result.rows[0].version
            };
        } catch (error) {
            return {
                sucesso: false,
                erro: error.message
            };
        }
    }

    async desconectar() {
        if (this.pool) {
            await this.pool.end();
            this.logger.info('🔒 PostgreSQL desconectado');
        }
    }
}
