/**
 * Teste Rápido - Gera relatórios com dados de exemplo
 */

import { ReportGenerator } from './src/exercicio3/reports/report-generator.js';
import { PipelineManager } from './src/exercicio3/pipeline-manager.js';
import { Logger } from './src/utils/logger.js';

async function testeRapido() {
    const logger = new Logger();
    
    try {
        logger.info('🚀 Iniciando teste rápido...');
        
        // Dados de exemplo
        const dadosExemplo = [
            {
                titulo: 'Smartphone Samsung Galaxy A54',
                preco: 1299.99,
                precoOriginal: 1499.99,
                categoria: 'smartphone',
                loja: 'Magazine Luiza',
                coletadoEm: new Date().toISOString()
            },
            {
                titulo: 'Notebook Lenovo IdeaPad',
                preco: 2199.99,
                precoOriginal: 2499.99,
                categoria: 'notebook',
                loja: 'Magazine Luiza',
                coletadoEm: new Date().toISOString()
            },
            {
                titulo: 'TV Samsung 55" 4K',
                preco: 2999.99,
                precoOriginal: 3499.99,
                categoria: 'tv',
                loja: 'Magazine Luiza',
                coletadoEm: new Date().toISOString()
            },
            {
                codigo: 'A001',
                nome: 'Goiânia',
                uf: 'GO',
                temperatura: 28.5,
                umidade: 65,
                coletadoEm: new Date().toISOString()
            },
            {
                codigo: 'A002',
                nome: 'Brasília',
                uf: 'DF',
                temperatura: 26.2,
                umidade: 58,
                coletadoEm: new Date().toISOString()
            }
        ];
        
        logger.info(`📊 Processando ${dadosExemplo.length} registros de exemplo...`);
        
        // === TESTE 1: GERADOR DE RELATÓRIOS ===
        logger.info('\n📋 Teste 1: Gerador de Relatórios');
        
        const reportGenerator = new ReportGenerator();
        await reportGenerator.inicializar();
        
        const configRelatorio = {
            titulo: 'Relatório de Teste - Sistema de Coleta',
            subtitulo: 'Demonstração das funcionalidades do sistema',
            formatos: ['html', 'json'],
            secoes: [
                {
                    titulo: '📊 Estatísticas Gerais',
                    tipo: 'estatisticas'
                },
                {
                    titulo: '📱 Produtos Coletados',
                    tipo: 'tabela',
                    colunas: ['titulo', 'preco', 'categoria', 'loja'],
                    limite: 10
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
                    titulo: '📝 Resumo Executivo',
                    tipo: 'resumo'
                }
            ]
        };
        
        const relatorio = await reportGenerator.gerarRelatorio(dadosExemplo, configRelatorio);
        
        logger.success('✅ Relatório gerado com sucesso!');
        if (relatorio.arquivos?.html) {
            logger.info(`📄 Arquivo HTML: ${relatorio.arquivos.html}`);
        }
        if (relatorio.arquivos?.json) {
            logger.info(`📄 Arquivo JSON: ${relatorio.arquivos.json}`);
        }
        
        // === TESTE 2: DASHBOARD ===
        logger.info('\n📊 Teste 2: Dashboard');
        
        const dashboard = await reportGenerator.gerarDashboard(dadosExemplo, {
            colunas: ['titulo', 'preco', 'categoria', 'nome', 'temperatura']
        });
        
        logger.success('✅ Dashboard gerado com sucesso!');
        if (dashboard.arquivos?.html) {
            logger.info(`📊 Dashboard HTML: ${dashboard.arquivos.html}`);
        }
        
        // === TESTE 3: PIPELINE COMPLETO ===
        logger.info('\n🔄 Teste 3: Pipeline Completo');
        
        const pipeline = new PipelineManager();
        await pipeline.inicializar();
        
        const resultadoPipeline = await pipeline.executarPipelineCompleto(dadosExemplo, {
            limpeza: { ativo: true },
            normalizacao: { ativo: true },
            stream: { ativo: false },
            agregacao: { ativo: true },
            relatorios: {
                titulo: 'Pipeline - Relatório Automatizado',
                formatos: ['html', 'json']
            }
        });
        
        logger.success('✅ Pipeline executado com sucesso!');
        logger.info(`⏱️ Tempo de execução: ${resultadoPipeline.tempo.duracao}ms`);
        logger.info(`📊 Etapas executadas: ${Object.keys(resultadoPipeline.etapas).length}`);
        logger.info(`🚨 Anomalias detectadas: ${resultadoPipeline.etapas.anomalias?.totalAnomalias || 0}`);
        
        await pipeline.finalizar();
        
        // === RESUMO FINAL ===
        logger.info('\n🎉 TESTE CONCLUÍDO COM SUCESSO!');
        logger.info('\n📁 Arquivos gerados:');
        
        // Lista arquivos criados
        console.log('\n📋 Relatórios:');
        if (relatorio.arquivos?.html) console.log(`   - ${relatorio.arquivos.html}`);
        if (relatorio.arquivos?.json) console.log(`   - ${relatorio.arquivos.json}`);
        if (dashboard.arquivos?.html) console.log(`   - ${dashboard.arquivos.html}`);
        
        console.log('\n🔄 Pipeline:');
        if (resultadoPipeline.etapas.relatorios?.arquivos) {
            Object.values(resultadoPipeline.etapas.relatorios.arquivos).forEach(arquivo => {
                if (arquivo) console.log(`   - ${arquivo}`);
            });
        }
        
        console.log('\n🚀 Para abrir os relatórios HTML:');
        if (relatorio.arquivos?.html) {
            console.log(`   open "${relatorio.arquivos.html}"`);
        }
        if (dashboard.arquivos?.html) {
            console.log(`   open "${dashboard.arquivos.html}"`);
        }
        
        return {
            relatorio,
            dashboard,
            pipeline: resultadoPipeline
        };
        
    } catch (error) {
        logger.error('❌ Erro no teste:', error);
        throw error;
    }
}

// Execução
if (import.meta.url === `file://${process.argv[1]}`) {
    testeRapido()
        .then(resultado => {
            console.log('\n✅ Teste rápido concluído com sucesso!');
        })
        .catch(error => {
            console.error('❌ Erro:', error.message);
            process.exit(1);
        });
}
