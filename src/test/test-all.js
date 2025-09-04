/**
 * Testes do Sistema de Coleta de Dados
 * Executa testes básicos de funcionalidade
 */

import { MagaluScraper } from '../exercicio1/scraper/magalu-scraper.js';
import { InmetClient } from '../exercicio1/api/inmet-client.js';
import { DataProcessor } from '../utils/data-processor.js';
import { Logger } from '../utils/logger.js';

class TestRunner {
    constructor() {
        this.logger = new Logger();
        this.testsPassed = 0;
        this.testsFailed = 0;
    }

    async runAllTests() {
        this.logger.info('🧪 Iniciando testes do sistema...');
        
        try {
            await this.testLogger();
            await this.testDataProcessor();
            await this.testInmetClient();
            // await this.testMagaluScraper(); // Comentado pois requer navegador
            
            this.showResults();
            
        } catch (error) {
            this.logger.error('❌ Erro durante execução dos testes:', error);
        }
    }

    async testLogger() {
        this.logger.info('📝 Testando sistema de logging...');
        
        try {
            const logger = new Logger();
            
            // Testa se os métodos existem
            this.assert(typeof logger.info === 'function', 'Logger.info deve ser uma função');
            this.assert(typeof logger.success === 'function', 'Logger.success deve ser uma função');
            this.assert(typeof logger.warn === 'function', 'Logger.warn deve ser uma função');
            this.assert(typeof logger.error === 'function', 'Logger.error deve ser uma função');
            
            // Testa formatação de timestamp
            const timestamp = logger.formatarTimestamp();
            this.assert(typeof timestamp === 'string', 'Timestamp deve ser string');
            this.assert(timestamp.length > 0, 'Timestamp não deve estar vazio');
            
            this.logger.success('✅ Testes do Logger passaram');
            
        } catch (error) {
            this.fail('Logger', error);
        }
    }

    async testDataProcessor() {
        this.logger.info('🔄 Testando processador de dados...');
        
        try {
            const processor = new DataProcessor();
            
            // Testa métodos auxiliares
            this.assert(processor.categorizarPreco(50) === 'Baixo', 'Categorização de preço baixo');
            this.assert(processor.categorizarPreco(300) === 'Médio', 'Categorização de preço médio');
            this.assert(processor.categorizarPreco(800) === 'Alto', 'Categorização de preço alto');
            this.assert(processor.categorizarPreco(1500) === 'Premium', 'Categorização de preço premium');
            
            this.assert(processor.classificarTemperatura(10) === 'Frio', 'Classificação temperatura fria');
            this.assert(processor.classificarTemperatura(20) === 'Ameno', 'Classificação temperatura amena');
            this.assert(processor.classificarTemperatura(28) === 'Quente', 'Classificação temperatura quente');
            this.assert(processor.classificarTemperatura(35) === 'Muito Quente', 'Classificação temperatura muito quente');
            
            this.assert(processor.classificarUmidade(25) === 'Baixa', 'Classificação umidade baixa');
            this.assert(processor.classificarUmidade(50) === 'Moderada', 'Classificação umidade moderada');
            this.assert(processor.classificarUmidade(70) === 'Alta', 'Classificação umidade alta');
            this.assert(processor.classificarUmidade(90) === 'Muito Alta', 'Classificação umidade muito alta');
            
            // Testa índice de conforto
            this.assert(processor.calcularIndiceConforto(23, 55) === 'Confortável', 'Índice de conforto ideal');
            this.assert(processor.calcularIndiceConforto(19, 75) === 'Aceitável', 'Índice de conforto aceitável');
            this.assert(processor.calcularIndiceConforto(35, 90) === 'Desconfortável', 'Índice de conforto ruim');
            
            this.logger.success('✅ Testes do DataProcessor passaram');
            
        } catch (error) {
            this.fail('DataProcessor', error);
        }
    }

    async testInmetClient() {
        this.logger.info('🌤️ Testando cliente INMET...');
        
        try {
            const client = new InmetClient();
            
            // Testa métodos auxiliares
            this.assert(client.obterNomeEstacao('A001') === 'Goiânia', 'Nome da estação A001');
            this.assert(client.obterNomeEstacao('A002') === 'Anápolis', 'Nome da estação A002');
            
            const coords = client.obterCoordenadas('A001');
            this.assert(typeof coords.lat === 'number', 'Latitude deve ser número');
            this.assert(typeof coords.lon === 'number', 'Longitude deve ser número');
            
            const temp = client.gerarTemperaturaRealista();
            this.assert(typeof temp === 'number', 'Temperatura deve ser número');
            this.assert(temp >= 15 && temp <= 40, 'Temperatura deve estar em faixa realista');
            
            const condicao = client.obterCondicaoTempo();
            this.assert(typeof condicao === 'string', 'Condição do tempo deve ser string');
            this.assert(condicao.length > 0, 'Condição do tempo não deve estar vazia');
            
            // Testa obtenção de estações
            const estacoes = await client.obterEstacoesGoias();
            this.assert(Array.isArray(estacoes), 'Estações deve ser um array');
            this.assert(estacoes.length > 0, 'Deve retornar pelo menos uma estação');
            
            this.logger.success('✅ Testes do InmetClient passaram');
            
        } catch (error) {
            this.fail('InmetClient', error);
        }
    }

    async testMagaluScraper() {
        this.logger.info('🛒 Testando scraper Magazine Luiza...');
        
        try {
            const scraper = new MagaluScraper();
            
            // Testa inicialização (sem executar para evitar dependências)
            this.assert(typeof scraper.inicializar === 'function', 'Método inicializar deve existir');
            this.assert(typeof scraper.coletarProdutos === 'function', 'Método coletarProdutos deve existir');
            this.assert(typeof scraper.finalizar === 'function', 'Método finalizar deve existir');
            
            this.logger.success('✅ Testes básicos do MagaluScraper passaram');
            
        } catch (error) {
            this.fail('MagaluScraper', error);
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
        this.logger.info('\n📊 Resultados dos Testes:');
        this.logger.success(`✅ Testes passaram: ${this.testsPassed}`);
        
        if (this.testsFailed > 0) {
            this.logger.error(`❌ Testes falharam: ${this.testsFailed}`);
        } else {
            this.logger.success('🎉 Todos os testes passaram!');
        }
        
        const total = this.testsPassed + this.testsFailed;
        const percentual = total > 0 ? ((this.testsPassed / total) * 100).toFixed(1) : 0;
        this.logger.info(`📈 Taxa de sucesso: ${percentual}%`);
    }
}

// Execução dos testes
if (import.meta.url === `file://${process.argv[1]}`) {
    const runner = new TestRunner();
    runner.runAllTests();
}
