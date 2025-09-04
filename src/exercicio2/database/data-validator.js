/**
 * Validador de Dados
 * Valida dados antes da inserção nos bancos de dados
 */

import { Logger } from '../../utils/logger.js';

export class DataValidator {
    constructor() {
        this.logger = new Logger();
    }

    async validarDadosCompletos(dados) {
        try {
            this.logger.info('✅ Validando dados completos...');
            
            const dadosValidados = {
                produtos: [],
                meteorologia: [],
                timestamp: dados.timestamp || new Date().toISOString(),
                metadados: dados.metadados || {}
            };

            // Valida produtos
            if (dados.produtos && Array.isArray(dados.produtos)) {
                for (const produto of dados.produtos) {
                    try {
                        const produtoValidado = await this.validarProduto(produto);
                        if (produtoValidado) {
                            dadosValidados.produtos.push(produtoValidado);
                        }
                    } catch (error) {
                        this.logger.warn(`⚠️ Produto inválido ignorado: ${error.message}`);
                    }
                }
            }

            // Valida dados meteorológicos
            if (dados.meteorologia && Array.isArray(dados.meteorologia)) {
                for (const estacao of dados.meteorologia) {
                    try {
                        const estacaoValidada = await this.validarEstacaoMeteorologica(estacao);
                        if (estacaoValidada) {
                            dadosValidados.meteorologia.push(estacaoValidada);
                        }
                    } catch (error) {
                        this.logger.warn(`⚠️ Dados meteorológicos inválidos ignorados: ${error.message}`);
                    }
                }
            }

            this.logger.success(`✅ Validação concluída: ${dadosValidados.produtos.length} produtos, ${dadosValidados.meteorologia.length} estações`);
            return dadosValidados;

        } catch (error) {
            this.logger.error('❌ Erro durante validação:', error);
            throw error;
        }
    }

    async validarProduto(produto) {
        // Campos obrigatórios
        if (!produto.titulo || typeof produto.titulo !== 'string') {
            throw new Error('Título do produto é obrigatório e deve ser string');
        }

        if (!produto.preco || typeof produto.preco !== 'number' || produto.preco <= 0) {
            throw new Error('Preço do produto é obrigatório e deve ser número positivo');
        }

        if (!produto.categoria || typeof produto.categoria !== 'string') {
            throw new Error('Categoria do produto é obrigatória');
        }

        if (!produto.loja || typeof produto.loja !== 'string') {
            throw new Error('Loja do produto é obrigatória');
        }

        if (!produto.coletadoEm) {
            throw new Error('Data de coleta é obrigatória');
        }

        // Validações de formato
        const produtoValidado = {
            titulo: this.sanitizarTexto(produto.titulo, 255),
            preco: this.validarNumero(produto.preco, 0, 999999.99),
            precoOriginal: produto.precoOriginal ? this.validarNumero(produto.precoOriginal, 0, 999999.99) : null,
            desconto: produto.desconto ? this.sanitizarTexto(produto.desconto, 50) : null,
            avaliacao: produto.avaliacao ? this.sanitizarTexto(produto.avaliacao, 100) : null,
            categoria: this.sanitizarTexto(produto.categoria, 100),
            loja: this.sanitizarTexto(produto.loja, 100),
            link: produto.link ? this.validarURL(produto.link) : null,
            imagem: produto.imagem ? this.validarURL(produto.imagem) : null,
            economia: produto.economia ? this.validarNumero(produto.economia, 0, 999999.99) : null,
            percentualDesconto: produto.percentualDesconto ? this.validarNumero(produto.percentualDesconto, 0, 100) : null,
            faixaPreco: produto.faixaPreco ? this.sanitizarTexto(produto.faixaPreco, 50) : null,
            coletadoEm: this.validarData(produto.coletadoEm)
        };

        return produtoValidado;
    }

    async validarEstacaoMeteorologica(estacao) {
        // Campos obrigatórios da estação
        if (!estacao.codigo || typeof estacao.codigo !== 'string') {
            throw new Error('Código da estação é obrigatório');
        }

        if (!estacao.nome || typeof estacao.nome !== 'string') {
            throw new Error('Nome da estação é obrigatório');
        }

        if (!estacao.uf || typeof estacao.uf !== 'string' || estacao.uf.length !== 2) {
            throw new Error('UF da estação é obrigatório e deve ter 2 caracteres');
        }

        // Valida dados meteorológicos se existirem
        let dadosMeteorologicosValidados = null;
        if (estacao.dadosMeteorologicos) {
            dadosMeteorologicosValidados = await this.validarDadosMeteorologicos(estacao.dadosMeteorologicos);
        }

        const estacaoValidada = {
            codigo: this.sanitizarTexto(estacao.codigo, 10),
            nome: this.sanitizarTexto(estacao.nome, 100),
            uf: estacao.uf.toUpperCase(),
            latitude: estacao.latitude ? this.validarNumero(estacao.latitude, -90, 90) : null,
            longitude: estacao.longitude ? this.validarNumero(estacao.longitude, -180, 180) : null,
            altitude: estacao.altitude ? this.validarNumero(estacao.altitude, -500, 9000) : null,
            status: estacao.status ? this.sanitizarTexto(estacao.status, 20) : 'Ativa',
            dadosMeteorologicos: dadosMeteorologicosValidados,
            classificacaoTemperatura: estacao.classificacaoTemperatura ? this.sanitizarTexto(estacao.classificacaoTemperatura, 50) : null,
            classificacaoUmidade: estacao.classificacaoUmidade ? this.sanitizarTexto(estacao.classificacaoUmidade, 50) : null,
            indiceConforto: estacao.indiceConforto ? this.sanitizarTexto(estacao.indiceConforto, 50) : null,
            localizacao: estacao.localizacao ? this.sanitizarTexto(estacao.localizacao, 100) : null
        };

        return estacaoValidada;
    }

    async validarDadosMeteorologicos(dados) {
        if (!dados.data) {
            throw new Error('Data dos dados meteorológicos é obrigatória');
        }

        if (!dados.hora) {
            throw new Error('Hora dos dados meteorológicos é obrigatória');
        }

        if (!dados.coletadoEm) {
            throw new Error('Data de coleta dos dados meteorológicos é obrigatória');
        }

        const dadosValidados = {
            data: this.validarData(dados.data, 'YYYY-MM-DD'),
            hora: this.validarHora(dados.hora),
            temperatura: dados.temperatura ? this.validarNumero(dados.temperatura, -50, 60) : null,
            umidade: dados.umidade ? this.validarNumero(dados.umidade, 0, 100) : null,
            pressao: dados.pressao ? this.validarNumero(dados.pressao, 800, 1200) : null,
            velocidadeVento: dados.velocidadeVento ? this.validarNumero(dados.velocidadeVento, 0, 200) : null,
            direcaoVento: dados.direcaoVento ? this.validarNumero(dados.direcaoVento, 0, 360) : null,
            precipitacao: dados.precipitacao ? this.validarNumero(dados.precipitacao, 0, 1000) : null,
            visibilidade: dados.visibilidade ? this.validarNumero(dados.visibilidade, 0, 50) : null,
            condicao: dados.condicao ? this.sanitizarTexto(dados.condicao, 100) : null,
            coletadoEm: this.validarData(dados.coletadoEm)
        };

        return dadosValidados;
    }

    // Métodos auxiliares de validação
    sanitizarTexto(texto, maxLength = 255) {
        if (typeof texto !== 'string') {
            return String(texto);
        }
        
        return texto
            .trim()
            .substring(0, maxLength)
            .replace(/[<>]/g, '') // Remove caracteres perigosos
            .replace(/\s+/g, ' '); // Normaliza espaços
    }

    validarNumero(valor, min = -Infinity, max = Infinity) {
        const numero = typeof valor === 'string' ? parseFloat(valor) : valor;
        
        if (isNaN(numero)) {
            throw new Error(`Valor não é um número válido: ${valor}`);
        }
        
        if (numero < min || numero > max) {
            throw new Error(`Número fora do intervalo permitido (${min}-${max}): ${numero}`);
        }
        
        return numero;
    }

    validarData(data, formato = null) {
        let dataObj;
        
        if (data instanceof Date) {
            dataObj = data;
        } else if (typeof data === 'string') {
            dataObj = new Date(data);
        } else {
            throw new Error(`Data inválida: ${data}`);
        }
        
        if (isNaN(dataObj.getTime())) {
            throw new Error(`Data inválida: ${data}`);
        }
        
        // Verifica se a data não é muito antiga ou muito futura
        const agora = new Date();
        const umAnoAtras = new Date(agora.getFullYear() - 1, agora.getMonth(), agora.getDate());
        const umAnoFrente = new Date(agora.getFullYear() + 1, agora.getMonth(), agora.getDate());
        
        if (dataObj < umAnoAtras || dataObj > umAnoFrente) {
            this.logger.warn(`⚠️ Data suspeita (muito antiga ou futura): ${data}`);
        }
        
        if (formato === 'YYYY-MM-DD') {
            return dataObj.toISOString().split('T')[0];
        }
        
        return dataObj.toISOString();
    }

    validarHora(hora) {
        if (typeof hora !== 'string') {
            hora = String(hora);
        }
        
        // Aceita formatos HH:MM ou HH:MM:SS
        const regexHora = /^([0-1]?[0-9]|2[0-3]):([0-5][0-9])(:([0-5][0-9]))?$/;
        
        if (!regexHora.test(hora)) {
            throw new Error(`Formato de hora inválido: ${hora}`);
        }
        
        // Normaliza para HH:MM:SS
        const partes = hora.split(':');
        if (partes.length === 2) {
            hora += ':00';
        }
        
        return hora;
    }

    validarURL(url) {
        if (typeof url !== 'string') {
            return null;
        }
        
        try {
            new URL(url);
            return url.substring(0, 2000); // Limita tamanho da URL
        } catch (error) {
            this.logger.warn(`⚠️ URL inválida ignorada: ${url}`);
            return null;
        }
    }

    validarEmail(email) {
        if (typeof email !== 'string') {
            return null;
        }
        
        const regexEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        
        if (!regexEmail.test(email)) {
            throw new Error(`Email inválido: ${email}`);
        }
        
        return email.toLowerCase().trim();
    }

    // Validações específicas do domínio
    validarCategoriaProduto(categoria) {
        const categoriasValidas = [
            'smartphone', 'notebook', 'tv', 'eletrodomestico', 
            'eletroportatil', 'casa', 'moda', 'beleza', 'outros'
        ];
        
        const categoriaLower = categoria.toLowerCase();
        
        if (!categoriasValidas.includes(categoriaLower)) {
            this.logger.warn(`⚠️ Categoria não reconhecida: ${categoria}`);
            return 'outros';
        }
        
        return categoriaLower;
    }

    validarUF(uf) {
        const ufsValidas = [
            'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
            'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
            'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
        ];
        
        const ufUpper = uf.toUpperCase();
        
        if (!ufsValidas.includes(ufUpper)) {
            throw new Error(`UF inválida: ${uf}`);
        }
        
        return ufUpper;
    }
}
