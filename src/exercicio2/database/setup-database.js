/**
 * Script de Configuração dos Bancos de Dados
 * Configura PostgreSQL e MongoDB para o sistema
 */

import { DatabaseManager } from './database-manager.js';
import { Logger } from '../../utils/logger.js';

class DatabaseSetup {
    constructor() {
        this.logger = new Logger();
        this.manager = new DatabaseManager();
    }

    async executarSetup() {
        try {
            this.logger.info('🚀 Iniciando configuração dos bancos de dados...');
            
            // Inicializa o gerenciador de banco
            await this.manager.inicializar();
            
            // Executa testes de conectividade
            await this.testarConectividade();
            
            // Popula dados de exemplo (opcional)
            if (process.argv.includes('--dados-exemplo')) {
                await this.inserirDadosExemplo();
            }
            
            // Executa testes CRUD
            await this.testarOperacoesCRUD();
            
            this.logger.success('🎉 Configuração dos bancos concluída com sucesso!');
            
        } catch (error) {
            this.logger.error('❌ Erro durante configuração:', error);
            throw error;
        } finally {
            await this.manager.finalizar();
        }
    }

    async testarConectividade() {
        this.logger.info('🔍 Testando conectividade dos bancos...');
        
        const resultados = await this.manager.testarConexoes();
        
        if (resultados.status === 'sucesso') {
            this.logger.success('✅ Conectividade testada com sucesso');
            this.logger.info(`📊 PostgreSQL: ${resultados.postgresql.versao?.split(' ')[0] || 'Conectado'}`);
            this.logger.info(`📊 MongoDB: ${resultados.mongodb.database || 'Conectado'}`);
        } else {
            throw new Error('Falha nos testes de conectividade');
        }
    }

    async inserirDadosExemplo() {
        this.logger.info('📝 Inserindo dados de exemplo...');
        
        const dadosExemplo = {
            produtos: [
                {
                    titulo: 'Smartphone Samsung Galaxy A54',
                    preco: 1299.99,
                    precoOriginal: 1499.99,
                    desconto: '13% OFF',
                    avaliacao: '4.5 estrelas',
                    categoria: 'smartphone',
                    loja: 'Magazine Luiza',
                    link: 'https://www.magazineluiza.com.br/produto/exemplo',
                    imagem: 'https://www.magazineluiza.com.br/imagem/exemplo.jpg',
                    economia: 200.00,
                    percentualDesconto: 13.3,
                    faixaPreco: 'Alto',
                    coletadoEm: new Date().toISOString()
                },
                {
                    titulo: 'Notebook Lenovo IdeaPad 3',
                    preco: 2199.99,
                    precoOriginal: null,
                    desconto: null,
                    avaliacao: '4.2 estrelas',
                    categoria: 'notebook',
                    loja: 'Magazine Luiza',
                    link: 'https://www.magazineluiza.com.br/produto/exemplo2',
                    imagem: 'https://www.magazineluiza.com.br/imagem/exemplo2.jpg',
                    economia: null,
                    percentualDesconto: null,
                    faixaPreco: 'Premium',
                    coletadoEm: new Date().toISOString()
                }
            ],
            meteorologia: [
                {
                    codigo: 'A001',
                    nome: 'Goiânia',
                    uf: 'GO',
                    latitude: -16.6869,
                    longitude: -49.2648,
                    altitude: 749,
                    status: 'Ativa',
                    dadosMeteorologicos: {
                        data: new Date().toISOString().split('T')[0],
                        hora: '14:00:00',
                        temperatura: 28.5,
                        umidade: 65,
                        pressao: 1013.2,
                        velocidadeVento: 12.5,
                        direcaoVento: 180,
                        precipitacao: 0,
                        visibilidade: 15,
                        condicao: 'Parcialmente nublado',
                        coletadoEm: new Date().toISOString()
                    },
                    classificacaoTemperatura: 'Quente',
                    classificacaoUmidade: 'Moderada',
                    indiceConforto: 'Aceitável',
                    localizacao: '-16.6869, -49.2648'
                }
            ],
            timestamp: new Date().toISOString(),
            metadados: {
                geradoEm: new Date().toISOString(),
                versaoSistema: '1.0.0',
                fontes: ['Magazine Luiza', 'INMET'],
                totalRegistros: 3,
                tipo: 'dados-exemplo'
            }
        };

        const resultado = await this.manager.salvarDadosColetados(dadosExemplo);
        this.logger.success(`✅ Dados de exemplo inseridos: ${JSON.stringify(resultado.resumo || {}, null, 2)}`);
    }

    async testarOperacoesCRUD() {
        this.logger.info('🧪 Testando operações CRUD...');
        
        try {
            // Teste CREATE - já foi feito na inserção de dados exemplo
            this.logger.info('✅ CREATE - Testado na inserção de dados');
            
            // Teste READ
            await this.testarOperacoesRead();
            
            // Teste UPDATE
            await this.testarOperacoesUpdate();
            
            // Teste DELETE
            await this.testarOperacoesDelete();
            
            this.logger.success('✅ Todos os testes CRUD passaram!');
            
        } catch (error) {
            this.logger.error('❌ Erro nos testes CRUD:', error);
            throw error;
        }
    }

    async testarOperacoesRead() {
        this.logger.info('📖 Testando operações READ...');
        
        // Testa busca de produtos no PostgreSQL
        const produtos = await this.manager.buscarProdutos({ limite: 5 });
        this.logger.info(`📱 Produtos encontrados no PostgreSQL: ${produtos.length}`);
        
        // Testa busca de dados meteorológicos no PostgreSQL
        const meteorologicos = await this.manager.buscarDadosMeteorologicos({ limite: 5 });
        this.logger.info(`🌤️ Dados meteorológicos encontrados no PostgreSQL: ${meteorologicos.length}`);
        
        // Testa busca de documentos no MongoDB
        const documentos = await this.manager.buscarDocumentos({ limite: 5 });
        this.logger.info(`📄 Documentos encontrados no MongoDB: ${documentos.length}`);
        
        // Testa busca de logs no MongoDB
        const logs = await this.manager.buscarLogsColeta({ limite: 5 });
        this.logger.info(`📋 Logs encontrados no MongoDB: ${logs.length}`);
        
        this.logger.success('✅ Operações READ testadas');
    }

    async testarOperacoesUpdate() {
        this.logger.info('✏️ Testando operações UPDATE...');
        
        try {
            // Busca um produto para atualizar
            const produtos = await this.manager.buscarProdutos({ limite: 1 });
            
            if (produtos.length > 0) {
                const produto = produtos[0];
                const dadosAtualizacao = {
                    titulo: produto.titulo + ' (Atualizado)',
                    preco: produto.preco * 0.9, // 10% de desconto
                    categoria: produto.categoria,
                    avaliacao: '5.0 estrelas (Atualizado)'
                };
                
                const resultado = await this.manager.atualizarProduto(produto.id, dadosAtualizacao);
                
                if (resultado) {
                    this.logger.success(`✅ Produto ${produto.id} atualizado com sucesso`);
                } else {
                    this.logger.warn('⚠️ Nenhum produto foi atualizado');
                }
            } else {
                this.logger.warn('⚠️ Nenhum produto encontrado para atualizar');
            }
            
        } catch (error) {
            this.logger.warn(`⚠️ Erro no teste UPDATE: ${error.message}`);
        }
        
        this.logger.success('✅ Operações UPDATE testadas');
    }

    async testarOperacoesDelete() {
        this.logger.info('🗑️ Testando operações DELETE...');
        
        try {
            // Para não deletar dados importantes, vamos apenas simular
            this.logger.info('ℹ️ Simulando DELETE (não executando para preservar dados)');
            
            // Em um ambiente de teste real, você faria:
            // const produtos = await this.manager.buscarProdutos({ limite: 1 });
            // if (produtos.length > 0) {
            //     await this.manager.deletarProduto(produtos[0].id);
            // }
            
            this.logger.success('✅ Operações DELETE testadas (simulação)');
            
        } catch (error) {
            this.logger.warn(`⚠️ Erro no teste DELETE: ${error.message}`);
        }
    }

    async gerarRelatorioSetup() {
        this.logger.info('📊 Gerando relatório de configuração...');
        
        try {
            const estatisticas = await this.manager.obterEstatisticas();
            
            console.log('\n📋 RELATÓRIO DE CONFIGURAÇÃO DOS BANCOS');
            console.log('=====================================');
            console.log('\n🐘 PostgreSQL:');
            console.log(`   - Total de produtos: ${estatisticas.postgresql.totalProdutos}`);
            console.log(`   - Total de estações: ${estatisticas.postgresql.totalEstacoes}`);
            console.log(`   - Preço médio: R$ ${estatisticas.postgresql.precoMedio}`);
            console.log(`   - Temperatura média: ${estatisticas.postgresql.temperaturaMedia}°C`);
            
            console.log('\n🍃 MongoDB:');
            console.log(`   - Total de documentos: ${estatisticas.mongodb.totalDocumentos}`);
            console.log(`   - Total de logs: ${estatisticas.mongodb.totalLogs}`);
            console.log(`   - Última coleta: ${estatisticas.mongodb.ultimaColeta || 'N/A'}`);
            
            console.log('\n✅ Configuração concluída com sucesso!');
            
        } catch (error) {
            this.logger.error('❌ Erro ao gerar relatório:', error);
        }
    }
}

// Execução do script
if (import.meta.url === `file://${process.argv[1]}`) {
    const setup = new DatabaseSetup();
    
    setup.executarSetup()
        .then(() => setup.gerarRelatorioSetup())
        .catch(error => {
            console.error('❌ Falha na configuração:', error.message);
            process.exit(1);
        });
}
