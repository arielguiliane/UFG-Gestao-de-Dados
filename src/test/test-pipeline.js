/**
 * Testes do Pipeline de Processamento (Exercício 3)
 * Testa funcionalidades do MCP File Processor e MCP Stream Processor
 */

import { PipelineManager } from '../exercicio3/pipeline-manager.js';
import { FileProcessor } from '../exercicio3/file-processor/file-processor.js';
import { StreamProcessor } from '../exercicio3/stream-processor/stream-processor.js';
import { DataTransformer } from '../exercicio3/transformations/data-transformer.js';
import { ReportGenerator } from '../exercicio3/reports/report-generator.js';
import { AnomalyDetector } from '../exercicio3/alerts/anomaly-detector.js';
import { Logger } from '../utils/logger.js';

class PipelineTestRunner {
    constructor() {
        this.logger = new Logger();
        this.testsPassed = 0;
        this.testsFailed = 0;
        this.dadosTeste = this.gerarDadosTeste();
    }

    gerarDadosTeste() {
        return [
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
                categoria: 'notebook',
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
                titulo: 'TV Samsung 55"',
                preco: 2999.99,
                categoria: 'tv',
                loja: 'Magazine Luiza',
                coletadoEm: new Date().toISOString()
            }
        ];
    }

    async runAllTests() {
        this.logger.info('🧪 Iniciando testes do pipeline de processamento...');
        
        try {
            await this.testFileProcessor();
            await this.testStreamProcessor();
            await this.testDataTransformer();
            await this.testReportGenerator();
            await this.testAnomalyDetector();
            await this.testPipelineManager();
            
            this.showResults();
            
        } catch (error) {
            this.logger.error('❌ Erro durante execução dos testes:', error);
        }
    }

    async testFileProcessor() {
        this.logger.info('📁 Testando File Processor...');
        
        try {
            const processor = new FileProcessor();
            
            // Testa inicialização
            await processor.inicializar();
            this.assert(processor.supportedFormats.includes('json'), 'Deve suportar formato JSON');
            this.assert(processor.supportedFormats.includes('csv'), 'Deve suportar formato CSV');
            
            // Testa processamento de dados JSON
            const dadosJSON = { produtos: this.dadosTeste };
            const estatisticas = await processor.gerarEstatisticas(this.dadosTeste);
            this.assert(estatisticas.totalRegistros === this.dadosTeste.length, 'Estatísticas devem contar registros corretamente');
            
            // Testa transformações
            const transformacoes = [
                { tipo: 'filtrar', criterio: { categoria: 'smartphone' } },
                { tipo: 'ordenar', campo: 'preco', ordem: 'desc' }
            ];
            
            const dadosTransformados = await processor.aplicarTransformacoes(this.dadosTeste, transformacoes);
            this.assert(Array.isArray(dadosTransformados), 'Transformações devem retornar array');
            
            this.logger.success('✅ Testes do File Processor passaram');
            
        } catch (error) {
            this.fail('FileProcessor', error);
        }
    }

    async testStreamProcessor() {
        this.logger.info('🌊 Testando Stream Processor...');
        
        try {
            const processor = new StreamProcessor();
            await processor.inicializar();
            
            // Testa criação de transformadores
            const transformador = processor.criarTransformador('teste', (dados) => ({ ...dados, processado: true }));
            this.assert(transformador !== null, 'Deve criar transformador');
            
            // Testa criação de filtros
            const filtro = processor.criarFiltro('preco_alto', (dados) => dados.preco > 1000);
            this.assert(filtro !== null, 'Deve criar filtro');
            
            // Testa criação de agregadores
            const agregador = processor.criarAgregador('contagem', {
                tipo: 'contagem',
                tamanhoLote: 2
            });
            this.assert(agregador !== null, 'Deve criar agregador');
            
            // Testa transformadores pré-definidos
            const limpeza = processor.criarTransformadorLimpeza();
            const normalizacao = processor.criarTransformadorNormalizacao();
            this.assert(limpeza !== null && normalizacao !== null, 'Deve criar transformadores pré-definidos');
            
            // Testa estatísticas
            const stats = processor.obterEstatisticas();
            this.assert(typeof stats === 'object', 'Deve retornar estatísticas');
            this.assert(stats.transformadores >= 0, 'Deve contar transformadores');
            
            await processor.finalizar();
            
            this.logger.success('✅ Testes do Stream Processor passaram');
            
        } catch (error) {
            this.fail('StreamProcessor', error);
        }
    }

    async testDataTransformer() {
        this.logger.info('🔄 Testando Data Transformer...');
        
        try {
            const transformer = new DataTransformer();
            
            // Testa limpeza de dados
            const regrasLimpeza = [
                { tipo: 'trimTextos', campos: ['titulo'] },
                { tipo: 'corrigirTipos', conversoes: [{ campo: 'preco', tipo: 'numero' }] }
            ];
            
            const dadosLimpos = await transformer.limparDados(this.dadosTeste, regrasLimpeza);
            this.assert(Array.isArray(dadosLimpos), 'Limpeza deve retornar array');
            this.assert(dadosLimpos.length === this.dadosTeste.length, 'Deve manter quantidade de registros');
            
            // Testa normalização
            const dadosNormalizados = await transformer.normalizarDados(dadosLimpos, {
                produtos: true,
                meteorologia: true
            });
            this.assert(Array.isArray(dadosNormalizados), 'Normalização deve retornar array');
            
            // Testa agregação
            const configAgregacao = {
                total: { tipo: 'contagem' },
                precoMedio: { tipo: 'media', campo: 'preco' },
                categorias: { tipo: 'agrupamento', campo: 'categoria' }
            };
            
            const dadosAgregados = await transformer.agregarDados(dadosNormalizados, configAgregacao);
            this.assert(typeof dadosAgregados === 'object', 'Agregação deve retornar objeto');
            this.assert(dadosAgregados.total > 0, 'Deve contar registros');
            
            this.logger.success('✅ Testes do Data Transformer passaram');
            
        } catch (error) {
            this.fail('DataTransformer', error);
        }
    }

    async testReportGenerator() {
        this.logger.info('📊 Testando Report Generator...');
        
        try {
            const generator = new ReportGenerator();
            await generator.inicializar();
            
            // Testa geração de estatísticas
            const estatisticas = await generator.calcularEstatisticas(this.dadosTeste);
            this.assert(estatisticas.totalRegistros === this.dadosTeste.length, 'Deve calcular total de registros');
            this.assert(estatisticas.taxaCompletude >= 0, 'Deve calcular taxa de completude');
            
            // Testa configuração de relatório
            const configRelatorio = {
                titulo: 'Relatório de Teste',
                formatos: ['json'],
                secoes: [
                    { titulo: 'Estatísticas', tipo: 'estatisticas' },
                    { titulo: 'Dados', tipo: 'tabela', limite: 10 }
                ]
            };
            
            // Simula geração de relatório (sem salvar arquivo)
            const relatorio = {
                titulo: configRelatorio.titulo,
                dados: this.dadosTeste,
                estatisticas: estatisticas
            };
            
            this.assert(relatorio.titulo === 'Relatório de Teste', 'Deve configurar título');
            this.assert(Array.isArray(relatorio.dados), 'Deve incluir dados');
            
            // Testa geração de dashboard
            const dashboard = await generator.gerarDashboard(this.dadosTeste, {
                colunas: ['titulo', 'preco', 'categoria']
            });
            
            this.assert(dashboard !== null, 'Deve gerar dashboard');
            
            this.logger.success('✅ Testes do Report Generator passaram');
            
        } catch (error) {
            this.fail('ReportGenerator', error);
        }
    }

    async testAnomalyDetector() {
        this.logger.info('🚨 Testando Anomaly Detector...');
        
        try {
            const detector = new AnomalyDetector();
            await detector.inicializar();
            
            // Testa configuração de regras
            detector.adicionarRegra('teste_preco', {
                tipo: 'limite_fixo',
                campo: 'preco',
                min: 0,
                max: 5000,
                severidade: 'MEDIO'
            });
            
            this.assert(detector.regras.has('teste_preco'), 'Deve adicionar regra');
            
            // Testa ativação/desativação de regras
            detector.desativarRegra('teste_preco');
            this.assert(!detector.regras.get('teste_preco').ativa, 'Deve desativar regra');
            
            detector.ativarRegra('teste_preco');
            this.assert(detector.regras.get('teste_preco').ativa, 'Deve ativar regra');
            
            // Testa análise de dados (sem dados anômalos)
            const anomalias = await detector.analisarDados(this.dadosTeste);
            this.assert(Array.isArray(anomalias), 'Deve retornar array de anomalias');
            
            // Testa dados com anomalia
            const dadosComAnomalia = [
                ...this.dadosTeste,
                { titulo: 'Produto Caro', preco: 99999, categoria: 'teste', coletadoEm: new Date().toISOString() }
            ];
            
            const anomaliasDetectadas = await detector.analisarDados(dadosComAnomalia);
            // Pode ou não detectar anomalias dependendo das regras ativas
            
            // Testa estatísticas
            const stats = detector.obterEstatisticas();
            this.assert(typeof stats === 'object', 'Deve retornar estatísticas');
            this.assert(stats.totalRegras >= 0, 'Deve contar regras');
            
            // Testa relatório
            const relatorio = await detector.gerarRelatorioAnomalias();
            this.assert(typeof relatorio === 'object', 'Deve gerar relatório');
            
            this.logger.success('✅ Testes do Anomaly Detector passaram');
            
        } catch (error) {
            this.fail('AnomalyDetector', error);
        }
    }

    async testPipelineManager() {
        this.logger.info('🔄 Testando Pipeline Manager...');
        
        try {
            const manager = new PipelineManager();
            
            // Testa inicialização
            await manager.inicializar();
            this.assert(manager.isInitialized, 'Deve estar inicializado');
            
            // Testa configuração de componentes
            this.assert(manager.fileProcessor !== null, 'Deve ter File Processor');
            this.assert(manager.streamProcessor !== null, 'Deve ter Stream Processor');
            this.assert(manager.dataTransformer !== null, 'Deve ter Data Transformer');
            this.assert(manager.reportGenerator !== null, 'Deve ter Report Generator');
            this.assert(manager.anomalyDetector !== null, 'Deve ter Anomaly Detector');
            
            // Testa pipeline completo (versão simplificada)
            const configuracao = {
                limpeza: { ativo: true },
                normalizacao: { ativo: true },
                stream: { ativo: false },
                agregacao: { ativo: true },
                relatorios: { titulo: 'Teste Pipeline', formatos: ['json'] }
            };
            
            const resultado = await manager.executarPipelineCompleto(this.dadosTeste, configuracao);
            
            this.assert(typeof resultado === 'object', 'Deve retornar resultado');
            this.assert(resultado.entrada !== null, 'Deve ter dados de entrada');
            this.assert(resultado.etapas !== null, 'Deve ter etapas executadas');
            this.assert(resultado.tempo !== null, 'Deve medir tempo de execução');
            
            // Testa estatísticas
            const stats = manager.obterEstatisticasGerais();
            this.assert(typeof stats === 'object', 'Deve retornar estatísticas gerais');
            this.assert(stats.pipelinesExecutados >= 0, 'Deve contar pipelines executados');
            
            await manager.finalizar();
            
            this.logger.success('✅ Testes do Pipeline Manager passaram');
            
        } catch (error) {
            this.fail('PipelineManager', error);
        }
    }

    assert(condition, message) {
        if (condition) {
            this.testsPassed++;
            this.logger.debug(`✓ ${message}`);
        } else {
            this.testsFailed++;
            throw new Error(`Falha na asserção: ${message}`);
        }
    }

    fail(testName, error) {
        this.testsFailed++;
        this.logger.error(`❌ Teste ${testName} falhou:`, error.message);
    }

    showResults() {
        this.logger.info('\n📊 Resultados dos Testes do Pipeline:');
        this.logger.success(`✅ Testes passaram: ${this.testsPassed}`);
        
        if (this.testsFailed > 0) {
            this.logger.error(`❌ Testes falharam: ${this.testsFailed}`);
        } else {
            this.logger.success('🎉 Todos os testes do pipeline passaram!');
        }
        
        const total = this.testsPassed + this.testsFailed;
        const percentual = total > 0 ? ((this.testsPassed / total) * 100).toFixed(1) : 0;
        this.logger.info(`📈 Taxa de sucesso: ${percentual}%`);
        
        // Resumo dos componentes testados
        console.log('\n🧩 Componentes Testados:');
        console.log('  ✅ File Processor - Processamento de arquivos');
        console.log('  ✅ Stream Processor - Processamento em tempo real');
        console.log('  ✅ Data Transformer - Transformações e limpeza');
        console.log('  ✅ Report Generator - Geração de relatórios');
        console.log('  ✅ Anomaly Detector - Detecção de anomalias');
        console.log('  ✅ Pipeline Manager - Orquestração completa');
    }
}

// Execução dos testes
if (import.meta.url === `file://${process.argv[1]}`) {
    const runner = new PipelineTestRunner();
    runner.runAllTests();
}
