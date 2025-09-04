/**
 * Exemplo de Uso do Sistema Completo
 * Demonstra como usar os três exercícios integrados
 */

import { SistemaColetaDados } from './src/index.js';
import { PipelineManager } from './src/exercicio3/pipeline-manager.js';
import { Logger } from './src/utils/logger.js';

async function exemploCompleto() {
    const logger = new Logger();
    
    try {
        logger.info('🚀 Iniciando exemplo completo do sistema...');
        
        // === EXERCÍCIO 1 + 2: COLETA E ARMAZENAMENTO ===
        logger.info('\n📊 FASE 1: Coleta e Armazenamento de Dados');
        
        const sistema = new SistemaColetaDados();
        const resultadoColeta = await sistema.executarColeta();
        
        logger.info('✅ Dados coletados e armazenados:');
        logger.info(`   - Produtos: ${resultadoColeta.produtos?.length || 0}`);
        logger.info(`   - Estações meteorológicas: ${resultadoColeta.meteorologia?.length || 0}`);
        logger.info(`   - PostgreSQL: ${resultadoColeta.banco?.postgresql ? 'OK' : 'Erro'}`);
        logger.info(`   - MongoDB: ${resultadoColeta.banco?.mongodb ? 'OK' : 'Erro'}`);
        
        // === EXERCÍCIO 3: PIPELINE DE PROCESSAMENTO ===
        logger.info('\n🔄 FASE 2: Pipeline de Processamento Avançado');
        
        const pipeline = new PipelineManager();
        await pipeline.inicializar();
        
        // Configuração personalizada do pipeline
        const configuracaoPipeline = {
            limpeza: {
                ativo: true,
                regras: [
                    { tipo: 'removerNulos', campos: ['titulo', 'preco'] },
                    { tipo: 'trimTextos', campos: ['titulo', 'categoria'] },
                    { tipo: 'corrigirTipos', conversoes: [
                        { campo: 'preco', tipo: 'numero' },
                        { campo: 'temperatura', tipo: 'numero' }
                    ]}
                ]
            },
            normalizacao: {
                ativo: true,
                produtos: true,
                meteorologia: true,
                textos: ['titulo', 'categoria', 'nome'],
                numeros: [
                    { campo: 'preco', precisao: 2 },
                    { campo: 'temperatura', precisao: 1 }
                ]
            },
            stream: {
                ativo: true,
                filtros: {
                    preco: { min: 50, max: 10000 },
                    categorias: ['smartphone', 'notebook', 'tv']
                }
            },
            agregacao: {
                ativo: true,
                estatisticas_produtos: {
                    tipo: 'personalizado',
                    funcao: (dados) => {
                        const produtos = dados.filter(item => item.preco);
                        const precos = produtos.map(p => p.preco);
                        return {
                            totalProdutos: produtos.length,
                            precoMedio: precos.reduce((a, b) => a + b, 0) / precos.length,
                            precoMin: Math.min(...precos),
                            precoMax: Math.max(...precos)
                        };
                    }
                },
                por_categoria: {
                    tipo: 'agrupamento',
                    campo: 'categoria'
                }
            },
            relatorios: {
                titulo: 'Relatório Completo do Sistema',
                subtitulo: 'Análise integrada de produtos e dados meteorológicos',
                formatos: ['html', 'json'],
                secoes: [
                    {
                        titulo: '📊 Estatísticas Gerais',
                        tipo: 'estatisticas'
                    },
                    {
                        titulo: '📱 Top Produtos',
                        tipo: 'tabela',
                        colunas: ['titulo', 'preco', 'categoria', 'economia'],
                        limite: 20
                    },
                    {
                        titulo: '🌡️ Dados Meteorológicos',
                        tipo: 'tabela',
                        colunas: ['nome', 'temperatura', 'umidade', 'uf'],
                        limite: 10
                    },
                    {
                        titulo: '📈 Distribuição por Categoria',
                        tipo: 'grafico',
                        tipoGrafico: 'pizza',
                        campo: 'categoria'
                    },
                    {
                        titulo: '📝 Insights e Recomendações',
                        tipo: 'resumo'
                    }
                ]
            }
        };
        
        // Executa pipeline completo
        const resultadoPipeline = await pipeline.executarPipelineCompleto(
            [...(resultadoColeta.produtos || []), ...(resultadoColeta.meteorologia || [])],
            configuracaoPipeline
        );
        
        logger.info('✅ Pipeline executado com sucesso:');
        logger.info(`   - Tempo de execução: ${resultadoPipeline.tempo.duracao}ms`);
        logger.info(`   - Etapas executadas: ${Object.keys(resultadoPipeline.etapas).length}`);
        logger.info(`   - Anomalias detectadas: ${resultadoPipeline.etapas.anomalias?.totalAnomalias || 0}`);
        logger.info(`   - Relatórios gerados: ${Object.keys(resultadoPipeline.etapas.relatorios?.arquivos || {}).length}`);
        
        // === DEMONSTRAÇÃO DE FUNCIONALIDADES ESPECÍFICAS ===
        logger.info('\n🎯 FASE 3: Demonstração de Funcionalidades Específicas');
        
        // 1. Processamento de arquivo específico
        logger.info('\n📄 Processando arquivo de dados...');
        try {
            // Simula processamento de arquivo (se existir)
            const dadosExemplo = [
                { titulo: 'Produto Teste', preco: 199.99, categoria: 'teste' },
                { nome: 'Estação Teste', temperatura: 25.5, uf: 'GO' }
            ];
            
            const resultadoArquivo = await pipeline.fileProcessor.processarJSON('dados_exemplo.json', {
                transformacoes: [
                    { tipo: 'filtrar', criterio: { categoria: 'teste' } },
                    { tipo: 'ordenar', campo: 'preco', ordem: 'desc' }
                ]
            });
            
            logger.info('✅ Arquivo processado (simulação)');
            
        } catch (error) {
            logger.info('ℹ️ Processamento de arquivo pulado (arquivo não encontrado)');
        }
        
        // 2. Geração de dashboard personalizado
        logger.info('\n📊 Gerando dashboard personalizado...');
        const dashboard = await pipeline.gerarDashboard(
            [...(resultadoColeta.produtos || []), ...(resultadoColeta.meteorologia || [])],
            {
                colunas: ['titulo', 'preco', 'categoria', 'nome', 'temperatura'],
                filtros: { categoria: ['smartphone', 'notebook'] }
            }
        );
        
        logger.info('✅ Dashboard gerado');
        if (dashboard.arquivos?.html) {
            logger.info(`   - Arquivo HTML: ${dashboard.arquivos.html}`);
        }
        
        // 3. Análise de anomalias detalhada
        logger.info('\n🔍 Executando análise detalhada de anomalias...');
        
        // Adiciona regra personalizada
        pipeline.anomalyDetector.adicionarRegra('preco_muito_baixo', {
            tipo: 'limite_fixo',
            campo: 'preco',
            min: 10,
            max: 999999,
            severidade: 'MEDIO',
            descricao: 'Produto com preço suspeito (muito baixo)'
        });
        
        const anomalias = await pipeline.anomalyDetector.analisarDados(resultadoColeta.produtos || []);
        logger.info(`✅ Análise de anomalias concluída: ${anomalias.length} anomalias detectadas`);
        
        // 4. Estatísticas finais do sistema
        logger.info('\n📈 Estatísticas Finais do Sistema:');
        const statsGerais = pipeline.obterEstatisticasGerais();
        
        console.log('\n📊 RESUMO EXECUTIVO:');
        console.log('=====================================');
        console.log(`🔄 Pipelines executados: ${statsGerais.pipelinesExecutados}`);
        console.log(`📊 Dados processados: ${statsGerais.dadosProcessados}`);
        console.log(`📋 Relatórios gerados: ${statsGerais.relatoriosGerados}`);
        console.log(`🚨 Anomalias detectadas: ${statsGerais.anomaliasDetectadas}`);
        console.log(`⏱️ Sistema ativo desde: ${new Date(statsGerais.iniciadoEm).toLocaleString('pt-BR')}`);
        
        console.log('\n🧩 COMPONENTES ATIVOS:');
        console.log(`   - File Processor: ✅ (${statsGerais.componentes.fileProcessor.length} formatos)`);
        console.log(`   - Stream Processor: ✅ (${statsGerais.componentes.streamProcessor.transformadores} transformadores)`);
        console.log(`   - Anomaly Detector: ✅ (${statsGerais.componentes.anomalyDetector.totalRegras} regras)`);
        console.log(`   - Report Generator: ✅`);
        
        // === FINALIZAÇÃO ===
        logger.info('\n🔒 Finalizando sistema...');
        await pipeline.finalizar();
        
        logger.success('\n🎉 Exemplo completo executado com sucesso!');
        logger.info('\n📁 Arquivos gerados:');
        logger.info('   - data/processed/ (dados processados)');
        logger.info('   - reports/ (relatórios HTML/JSON/CSV)');
        logger.info('   - alerts/ (alertas de anomalias)');
        
        return {
            coleta: resultadoColeta,
            pipeline: resultadoPipeline,
            dashboard: dashboard,
            anomalias: anomalias.length,
            estatisticas: statsGerais
        };
        
    } catch (error) {
        logger.error('❌ Erro no exemplo completo:', error);
        throw error;
    }
}

// Exemplo de uso específico de cada exercício
async function exemplosPorExercicio() {
    const logger = new Logger();
    
    logger.info('📚 Exemplos específicos por exercício:');
    
    // Exercício 1: Apenas coleta
    logger.info('\n🔍 Exercício 1 - Coleta de Dados:');
    logger.info('   npm run scraper  # Apenas Magazine Luiza');
    logger.info('   npm run weather  # Apenas dados meteorológicos');
    
    // Exercício 2: Apenas banco de dados
    logger.info('\n🗄️ Exercício 2 - Armazenamento:');
    logger.info('   npm run setup-db    # Configurar bancos');
    logger.info('   npm run test-db     # Testar conexões');
    logger.info('   npm run database    # Gerenciar dados');
    
    // Exercício 3: Apenas pipeline
    logger.info('\n🔄 Exercício 3 - Processamento:');
    logger.info('   npm run pipeline           # Pipeline completo');
    logger.info('   npm run file-processor     # Processar arquivos');
    logger.info('   npm run stream-processor   # Processamento em stream');
    logger.info('   npm run reports           # Gerar relatórios');
    logger.info('   npm run anomaly-detector  # Detectar anomalias');
    
    // Sistema completo
    logger.info('\n🚀 Sistema Completo:');
    logger.info('   npm start           # Executa tudo integrado');
    logger.info('   npm test           # Testa todos os componentes');
    logger.info('   npm run test-pipeline  # Testa apenas pipeline');
}

// Execução
if (import.meta.url === `file://${process.argv[1]}`) {
    console.log('🎯 Sistema de Coleta, Armazenamento e Processamento de Dados');
    console.log('============================================================\n');
    
    if (process.argv.includes('--exemplos')) {
        exemplosPorExercicio();
    } else {
        exemploCompleto()
            .then(resultado => {
                console.log('\n✅ Exemplo executado com sucesso!');
                console.log(`📊 Resumo: ${resultado.coleta.produtos?.length || 0} produtos, ${resultado.anomalias} anomalias, ${resultado.pipeline.tempo.duracao}ms`);
            })
            .catch(error => {
                console.error('❌ Erro:', error.message);
                process.exit(1);
            });
    }
}
