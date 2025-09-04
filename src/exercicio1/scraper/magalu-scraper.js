/**
 * MCP Web Scraper - Magazine Luiza
 * Coleta dados de produtos e preços do e-commerce
 */

import puppeteer from 'puppeteer';
import { Logger } from '../../utils/logger.js';

export class MagaluScraper {
    constructor() {
        this.baseUrl = 'https://www.magazineluiza.com.br';
        this.logger = new Logger();
        this.browser = null;
        this.page = null;
    }

    async inicializar() {
        try {
            this.logger.info('🔧 Inicializando navegador...');
            this.browser = await puppeteer.launch({
                headless: 'new',
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-accelerated-2d-canvas',
                    '--no-first-run',
                    '--no-zygote',
                    '--disable-gpu'
                ]
            });
            
            this.page = await this.browser.newPage();
            
            // Configurações da página
            await this.page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
            await this.page.setViewport({ width: 1366, height: 768 });
            
            this.logger.success('✅ Navegador inicializado');
            
        } catch (error) {
            this.logger.error('❌ Erro ao inicializar navegador:', error);
            throw error;
        }
    }

    async coletarProdutos(categoria = 'smartphone', limite = 10) {
        try {
            if (!this.browser) await this.inicializar();
            
            const urlBusca = `${this.baseUrl}/busca/${categoria}`;
            this.logger.info(`🔍 Acessando: ${urlBusca}`);
            
            await this.page.goto(urlBusca, { 
                waitUntil: 'networkidle2',
                timeout: 30000 
            });

            // Aguarda carregamento dos produtos
            await this.page.waitForSelector('[data-testid="product-card"]', { timeout: 15000 });
            
            this.logger.info('📦 Extraindo dados dos produtos...');
            
            const produtos = await this.page.evaluate((limite) => {
                const cards = document.querySelectorAll('[data-testid="product-card"]');
                const produtosData = [];
                
                for (let i = 0; i < Math.min(cards.length, limite); i++) {
                    const card = cards[i];
                    
                    try {
                        // Extrai informações do produto
                        const titulo = card.querySelector('[data-testid="product-title"]')?.textContent?.trim();
                        const precoElement = card.querySelector('[data-testid="price-value"]');
                        const preco = precoElement?.textContent?.replace(/[^\d,]/g, '').replace(',', '.') || '0';
                        const precoOriginal = card.querySelector('[data-testid="price-original"]')?.textContent?.replace(/[^\d,]/g, '').replace(',', '.') || null;
                        const desconto = card.querySelector('[data-testid="discount-percentage"]')?.textContent?.trim() || null;
                        const avaliacao = card.querySelector('[data-testid="review"]')?.textContent?.trim() || null;
                        const link = card.querySelector('a')?.href || null;
                        const imagem = card.querySelector('img')?.src || null;
                        
                        if (titulo && preco) {
                            produtosData.push({
                                titulo,
                                preco: parseFloat(preco) || 0,
                                precoOriginal: precoOriginal ? parseFloat(precoOriginal) : null,
                                desconto,
                                avaliacao,
                                link,
                                imagem,
                                categoria: 'smartphone',
                                loja: 'Magazine Luiza',
                                coletadoEm: new Date().toISOString()
                            });
                        }
                    } catch (error) {
                        console.warn('Erro ao processar produto:', error);
                    }
                }
                
                return produtosData;
            }, limite);
            
            this.logger.success(`✅ ${produtos.length} produtos coletados`);
            return produtos;
            
        } catch (error) {
            this.logger.error('❌ Erro durante scraping:', error);
            throw error;
        }
    }

    async coletarCategorias(categorias = ['smartphone', 'notebook', 'tv'], limitePorCategoria = 5) {
        const todosProdutos = [];
        
        for (const categoria of categorias) {
            try {
                this.logger.info(`📱 Coletando categoria: ${categoria}`);
                const produtos = await this.coletarProdutos(categoria, limitePorCategoria);
                todosProdutos.push(...produtos);
                
                // Pausa entre categorias para evitar bloqueio
                await this.aguardar(2000);
                
            } catch (error) {
                this.logger.error(`❌ Erro na categoria ${categoria}:`, error);
            }
        }
        
        return todosProdutos;
    }

    async aguardar(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async finalizar() {
        if (this.browser) {
            await this.browser.close();
            this.logger.info('🔒 Navegador fechado');
        }
    }
}

// Execução direta para testes
if (import.meta.url === `file://${process.argv[1]}`) {
    const scraper = new MagaluScraper();
    
    scraper.coletarCategorias(['smartphone'], 5)
        .then(produtos => {
            console.log('\n📊 Produtos coletados:');
            produtos.forEach((produto, index) => {
                console.log(`${index + 1}. ${produto.titulo} - R$ ${produto.preco}`);
            });
        })
        .catch(error => console.error('Erro:', error))
        .finally(() => scraper.finalizar());
}
