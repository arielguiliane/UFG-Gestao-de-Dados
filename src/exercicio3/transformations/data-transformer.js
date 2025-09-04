/**
 * Data Transformer
 * Sistema de transformações, limpeza e normalização de dados
 */

import { Logger } from '../../utils/logger.js';

export class DataTransformer {
    constructor() {
        this.logger = new Logger();
        this.transformacoes = new Map();
        this.regrasLimpeza = new Map();
        this.normalizadores = new Map();
        this.agregadores = new Map();
    }

    // === LIMPEZA DE DADOS ===
    
    async limparDados(dados, regras = []) {
        try {
            this.logger.info('🧹 Iniciando limpeza de dados...');
            
            let dadosLimpos = Array.isArray(dados) ? [...dados] : { ...dados };
            
            for (const regra of regras) {
                dadosLimpos = await this.aplicarRegraLimpeza(dadosLimpos, regra);
            }
            
            this.logger.success('✅ Limpeza de dados concluída');
            return dadosLimpos;
            
        } catch (error) {
            this.logger.error('❌ Erro na limpeza de dados:', error);
            throw error;
        }
    }

    async aplicarRegraLimpeza(dados, regra) {
        switch (regra.tipo) {
            case 'removerNulos':
                return this.removerValoresNulos(dados, regra.campos);
            case 'removerDuplicados':
                return this.removerDuplicados(dados, regra.chave);
            case 'trimTextos':
                return this.trimTextos(dados, regra.campos);
            case 'removerCaracteresEspeciais':
                return this.removerCaracteresEspeciais(dados, regra.campos);
            case 'validarFormatos':
                return this.validarFormatos(dados, regra.validacoes);
            case 'corrigirTipos':
                return this.corrigirTipos(dados, regra.conversoes);
            default:
                this.logger.warn(`⚠️ Regra de limpeza desconhecida: ${regra.tipo}`);
                return dados;
        }
    }

    removerValoresNulos(dados, campos = null) {
        if (Array.isArray(dados)) {
            return dados.map(item => {
                const itemLimpo = {};
                Object.keys(item).forEach(key => {
                    if (campos && !campos.includes(key)) {
                        itemLimpo[key] = item[key];
                        return;
                    }
                    
                    const valor = item[key];
                    if (valor !== null && valor !== undefined && valor !== '') {
                        itemLimpo[key] = valor;
                    }
                });
                return itemLimpo;
            });
        } else {
            const itemLimpo = {};
            Object.keys(dados).forEach(key => {
                if (campos && !campos.includes(key)) {
                    itemLimpo[key] = dados[key];
                    return;
                }
                
                const valor = dados[key];
                if (valor !== null && valor !== undefined && valor !== '') {
                    itemLimpo[key] = valor;
                }
            });
            return itemLimpo;
        }
    }

    removerDuplicados(dados, chave) {
        if (!Array.isArray(dados)) return dados;
        
        const vistos = new Set();
        return dados.filter(item => {
            const valorChave = chave ? item[chave] : JSON.stringify(item);
            if (vistos.has(valorChave)) {
                return false;
            }
            vistos.add(valorChave);
            return true;
        });
    }

    trimTextos(dados, campos = null) {
        const processarItem = (item) => {
            const itemProcessado = { ...item };
            Object.keys(itemProcessado).forEach(key => {
                if (campos && !campos.includes(key)) return;
                
                if (typeof itemProcessado[key] === 'string') {
                    itemProcessado[key] = itemProcessado[key].trim();
                }
            });
            return itemProcessado;
        };

        return Array.isArray(dados) 
            ? dados.map(processarItem)
            : processarItem(dados);
    }

    removerCaracteresEspeciais(dados, campos) {
        const processarItem = (item) => {
            const itemProcessado = { ...item };
            campos.forEach(campo => {
                if (typeof itemProcessado[campo] === 'string') {
                    itemProcessado[campo] = itemProcessado[campo]
                        .replace(/[^\w\s\-.,]/g, '')
                        .replace(/\s+/g, ' ')
                        .trim();
                }
            });
            return itemProcessado;
        };

        return Array.isArray(dados) 
            ? dados.map(processarItem)
            : processarItem(dados);
    }

    validarFormatos(dados, validacoes) {
        const processarItem = (item) => {
            const itemValidado = { ...item };
            
            validacoes.forEach(validacao => {
                const valor = itemValidado[validacao.campo];
                if (!valor) return;
                
                switch (validacao.tipo) {
                    case 'email':
                        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor)) {
                            delete itemValidado[validacao.campo];
                        }
                        break;
                    case 'url':
                        try {
                            new URL(valor);
                        } catch {
                            delete itemValidado[validacao.campo];
                        }
                        break;
                    case 'numero':
                        if (isNaN(parseFloat(valor))) {
                            delete itemValidado[validacao.campo];
                        }
                        break;
                    case 'data':
                        if (isNaN(Date.parse(valor))) {
                            delete itemValidado[validacao.campo];
                        }
                        break;
                }
            });
            
            return itemValidado;
        };

        return Array.isArray(dados) 
            ? dados.map(processarItem)
            : processarItem(dados);
    }

    corrigirTipos(dados, conversoes) {
        const processarItem = (item) => {
            const itemCorrigido = { ...item };
            
            conversoes.forEach(conversao => {
                const valor = itemCorrigido[conversao.campo];
                if (valor === null || valor === undefined) return;
                
                switch (conversao.tipo) {
                    case 'numero':
                        const numero = parseFloat(valor);
                        if (!isNaN(numero)) {
                            itemCorrigido[conversao.campo] = numero;
                        }
                        break;
                    case 'inteiro':
                        const inteiro = parseInt(valor);
                        if (!isNaN(inteiro)) {
                            itemCorrigido[conversao.campo] = inteiro;
                        }
                        break;
                    case 'booleano':
                        if (typeof valor === 'string') {
                            itemCorrigido[conversao.campo] = valor.toLowerCase() === 'true';
                        }
                        break;
                    case 'data':
                        const data = new Date(valor);
                        if (!isNaN(data.getTime())) {
                            itemCorrigido[conversao.campo] = data.toISOString();
                        }
                        break;
                }
            });
            
            return itemCorrigido;
        };

        return Array.isArray(dados) 
            ? dados.map(processarItem)
            : processarItem(dados);
    }

    // === NORMALIZAÇÃO DE DADOS ===

    async normalizarDados(dados, configuracao = {}) {
        try {
            this.logger.info('📏 Iniciando normalização de dados...');
            
            let dadosNormalizados = dados;
            
            // Normalização de produtos
            if (configuracao.produtos) {
                dadosNormalizados = this.normalizarProdutos(dadosNormalizados);
            }
            
            // Normalização meteorológica
            if (configuracao.meteorologia) {
                dadosNormalizados = this.normalizarMeteorologicos(dadosNormalizados);
            }
            
            // Normalização de textos
            if (configuracao.textos) {
                dadosNormalizados = this.normalizarTextos(dadosNormalizados, configuracao.textos);
            }
            
            // Normalização de números
            if (configuracao.numeros) {
                dadosNormalizados = this.normalizarNumeros(dadosNormalizados, configuracao.numeros);
            }
            
            this.logger.success('✅ Normalização concluída');
            return dadosNormalizados;
            
        } catch (error) {
            this.logger.error('❌ Erro na normalização:', error);
            throw error;
        }
    }

    normalizarProdutos(dados) {
        const processarProduto = (produto) => {
            const produtoNormalizado = { ...produto };
            
            // Normaliza preços
            if (produtoNormalizado.preco) {
                produtoNormalizado.preco = parseFloat(produtoNormalizado.preco);
            }
            if (produtoNormalizado.precoOriginal) {
                produtoNormalizado.precoOriginal = parseFloat(produtoNormalizado.precoOriginal);
            }
            
            // Calcula economia se não existir
            if (produtoNormalizado.preco && produtoNormalizado.precoOriginal && !produtoNormalizado.economia) {
                produtoNormalizado.economia = produtoNormalizado.precoOriginal - produtoNormalizado.preco;
                produtoNormalizado.percentualDesconto = 
                    (produtoNormalizado.economia / produtoNormalizado.precoOriginal) * 100;
            }
            
            // Normaliza categoria
            if (produtoNormalizado.categoria) {
                produtoNormalizado.categoria = produtoNormalizado.categoria.toLowerCase().trim();
            }
            
            // Classifica faixa de preço
            if (produtoNormalizado.preco) {
                produtoNormalizado.faixaPreco = this.classificarFaixaPreco(produtoNormalizado.preco);
            }
            
            return produtoNormalizado;
        };

        return Array.isArray(dados) 
            ? dados.map(processarProduto)
            : processarProduto(dados);
    }

    normalizarMeteorologicos(dados) {
        const processarMeteorologico = (item) => {
            const itemNormalizado = { ...item };
            
            // Normaliza temperatura
            if (itemNormalizado.temperatura !== undefined) {
                itemNormalizado.temperatura = parseFloat(itemNormalizado.temperatura);
                itemNormalizado.classificacaoTemperatura = this.classificarTemperatura(itemNormalizado.temperatura);
            }
            
            // Normaliza umidade
            if (itemNormalizado.umidade !== undefined) {
                itemNormalizado.umidade = parseInt(itemNormalizado.umidade);
                itemNormalizado.classificacaoUmidade = this.classificarUmidade(itemNormalizado.umidade);
            }
            
            // Calcula índice de conforto
            if (itemNormalizado.temperatura !== undefined && itemNormalizado.umidade !== undefined) {
                itemNormalizado.indiceConforto = this.calcularIndiceConforto(
                    itemNormalizado.temperatura, 
                    itemNormalizado.umidade
                );
            }
            
            return itemNormalizado;
        };

        return Array.isArray(dados) 
            ? dados.map(processarMeteorologico)
            : processarMeteorologico(dados);
    }

    normalizarTextos(dados, campos) {
        const processarItem = (item) => {
            const itemNormalizado = { ...item };
            
            campos.forEach(campo => {
                if (typeof itemNormalizado[campo] === 'string') {
                    itemNormalizado[campo] = itemNormalizado[campo]
                        .toLowerCase()
                        .trim()
                        .replace(/\s+/g, ' ')
                        .replace(/[^\w\s\-.,]/g, '');
                }
            });
            
            return itemNormalizado;
        };

        return Array.isArray(dados) 
            ? dados.map(processarItem)
            : processarItem(dados);
    }

    normalizarNumeros(dados, configuracao) {
        const processarItem = (item) => {
            const itemNormalizado = { ...item };
            
            configuracao.forEach(config => {
                const valor = itemNormalizado[config.campo];
                if (valor === null || valor === undefined) return;
                
                let valorNormalizado = parseFloat(valor);
                
                // Aplica escala se especificada
                if (config.escala) {
                    switch (config.escala) {
                        case 'minMax':
                            valorNormalizado = (valorNormalizado - config.min) / (config.max - config.min);
                            break;
                        case 'zScore':
                            valorNormalizado = (valorNormalizado - config.media) / config.desvio;
                            break;
                    }
                }
                
                // Aplica precisão
                if (config.precisao !== undefined) {
                    valorNormalizado = parseFloat(valorNormalizado.toFixed(config.precisao));
                }
                
                itemNormalizado[config.campo] = valorNormalizado;
            });
            
            return itemNormalizado;
        };

        return Array.isArray(dados) 
            ? dados.map(processarItem)
            : processarItem(dados);
    }

    // === AGREGAÇÃO DE DADOS ===

    async agregarDados(dados, configuracao) {
        try {
            this.logger.info('📊 Iniciando agregação de dados...');
            
            const resultados = {};
            
            for (const [nome, config] of Object.entries(configuracao)) {
                resultados[nome] = await this.executarAgregacao(dados, config);
            }
            
            this.logger.success('✅ Agregação concluída');
            return resultados;
            
        } catch (error) {
            this.logger.error('❌ Erro na agregação:', error);
            throw error;
        }
    }

    async executarAgregacao(dados, config) {
        if (!Array.isArray(dados)) return null;
        
        switch (config.tipo) {
            case 'contagem':
                return dados.length;
            case 'soma':
                return dados.reduce((acc, item) => acc + (parseFloat(item[config.campo]) || 0), 0);
            case 'media':
                const valores = dados.map(item => parseFloat(item[config.campo])).filter(v => !isNaN(v));
                return valores.length > 0 ? valores.reduce((a, b) => a + b, 0) / valores.length : 0;
            case 'mediana':
                return this.calcularMediana(dados, config.campo);
            case 'moda':
                return this.calcularModa(dados, config.campo);
            case 'minimo':
                const valoresMin = dados.map(item => parseFloat(item[config.campo])).filter(v => !isNaN(v));
                return valoresMin.length > 0 ? Math.min(...valoresMin) : null;
            case 'maximo':
                const valoresMax = dados.map(item => parseFloat(item[config.campo])).filter(v => !isNaN(v));
                return valoresMax.length > 0 ? Math.max(...valoresMax) : null;
            case 'agrupamento':
                return this.agruparPorCampo(dados, config.campo);
            case 'personalizado':
                return config.funcao(dados);
            default:
                return null;
        }
    }

    // === MÉTODOS AUXILIARES ===

    classificarFaixaPreco(preco) {
        if (preco < 100) return 'Baixo';
        if (preco < 500) return 'Médio';
        if (preco < 1000) return 'Alto';
        return 'Premium';
    }

    classificarTemperatura(temperatura) {
        if (temperatura < 15) return 'Frio';
        if (temperatura < 25) return 'Ameno';
        if (temperatura < 30) return 'Quente';
        return 'Muito Quente';
    }

    classificarUmidade(umidade) {
        if (umidade < 30) return 'Seco';
        if (umidade < 60) return 'Moderado';
        if (umidade < 80) return 'Úmido';
        return 'Muito Úmido';
    }

    calcularIndiceConforto(temperatura, umidade) {
        // Índice simplificado de conforto térmico
        const indice = temperatura - (0.55 - 0.0055 * umidade) * (temperatura - 14.5);
        
        if (indice < 21) return 'Desconfortável (Frio)';
        if (indice < 24) return 'Confortável';
        if (indice < 27) return 'Aceitável';
        return 'Desconfortável (Quente)';
    }

    calcularMediana(dados, campo) {
        const valores = dados.map(item => parseFloat(item[campo])).filter(v => !isNaN(v)).sort((a, b) => a - b);
        const meio = Math.floor(valores.length / 2);
        
        if (valores.length % 2 === 0) {
            return (valores[meio - 1] + valores[meio]) / 2;
        }
        return valores[meio];
    }

    calcularModa(dados, campo) {
        const frequencias = {};
        dados.forEach(item => {
            const valor = item[campo];
            frequencias[valor] = (frequencias[valor] || 0) + 1;
        });
        
        let moda = null;
        let maxFrequencia = 0;
        
        Object.entries(frequencias).forEach(([valor, freq]) => {
            if (freq > maxFrequencia) {
                maxFrequencia = freq;
                moda = valor;
            }
        });
        
        return moda;
    }

    agruparPorCampo(dados, campo) {
        const grupos = {};
        dados.forEach(item => {
            const chave = item[campo];
            if (!grupos[chave]) {
                grupos[chave] = [];
            }
            grupos[chave].push(item);
        });
        return grupos;
    }
}

// Execução direta para testes
if (import.meta.url === `file://${process.argv[1]}`) {
    const transformer = new DataTransformer();
    console.log('✅ Data Transformer pronto para uso!');
}
