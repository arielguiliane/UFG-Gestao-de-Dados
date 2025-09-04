/**
 * Anomaly Detector
 * Sistema de alertas para detectar anomalias nos dados
 */

import { EventEmitter } from 'events';
import fs from 'fs/promises';
import { Logger } from '../../utils/logger.js';

export class AnomalyDetector extends EventEmitter {
    constructor() {
        super();
        this.logger = new Logger();
        this.regras = new Map();
        this.historico = [];
        this.alertas = [];
        this.configuracao = {
            limiteHistorico: 1000,
            intervaloVerificacao: 60000, // 1 minuto
            nivelSeveridade: {
                BAIXO: 1,
                MEDIO: 2,
                ALTO: 3,
                CRITICO: 4
            }
        };
        this.isMonitorando = false;
        this.intervalId = null;
    }

    async inicializar() {
        try {
            this.logger.info('🚨 Inicializando Anomaly Detector...');
            
            // Configura regras padrão
            this.configurarRegrasPadrao();
            
            // Configura eventos
            this.configurarEventos();
            
            this.logger.success('✅ Anomaly Detector inicializado');
            
        } catch (error) {
            this.logger.error('❌ Erro ao inicializar Anomaly Detector:', error);
            throw error;
        }
    }

    configurarRegrasPadrao() {
        // Regra para preços anômalos
        this.adicionarRegra('preco_anomalo', {
            tipo: 'outlier_estatistico',
            campo: 'preco',
            metodo: 'zscore',
            limiar: 3,
            severidade: 'MEDIO',
            descricao: 'Preço muito acima ou abaixo da média'
        });

        // Regra para temperatura extrema
        this.adicionarRegra('temperatura_extrema', {
            tipo: 'limite_fixo',
            campo: 'temperatura',
            min: -10,
            max: 50,
            severidade: 'ALTO',
            descricao: 'Temperatura fora do intervalo normal'
        });

        // Regra para dados ausentes
        this.adicionarRegra('dados_ausentes', {
            tipo: 'completude',
            camposObrigatorios: ['titulo', 'preco', 'categoria'],
            limiarCompletude: 0.8,
            severidade: 'BAIXO',
            descricao: 'Muitos campos obrigatórios ausentes'
        });

        // Regra para variação súbita
        this.adicionarRegra('variacao_subita', {
            tipo: 'variacao_temporal',
            campo: 'preco',
            janelaTempo: 24 * 60 * 60 * 1000, // 24 horas
            limiarVariacao: 0.3, // 30%
            severidade: 'MEDIO',
            descricao: 'Variação súbita de preços'
        });

        // Regra para volume anômalo
        this.adicionarRegra('volume_anomalo', {
            tipo: 'volume',
            janelaMinutos: 60,
            limiarMinimo: 5,
            limiarMaximo: 1000,
            severidade: 'MEDIO',
            descricao: 'Volume de dados anômalo'
        });
    }

    configurarEventos() {
        this.on('anomalia_detectada', (alerta) => {
            this.logger.warn(`🚨 Anomalia detectada: ${alerta.regra} - ${alerta.descricao}`);
            this.alertas.push(alerta);
            
            // Mantém apenas os últimos alertas
            if (this.alertas.length > this.configuracao.limiteHistorico) {
                this.alertas = this.alertas.slice(-this.configuracao.limiteHistorico);
            }
        });

        this.on('alerta_critico', (alerta) => {
            this.logger.error(`🔥 ALERTA CRÍTICO: ${alerta.regra} - ${alerta.descricao}`);
            // Aqui poderia integrar com sistemas de notificação externos
        });
    }

    adicionarRegra(nome, configuracao) {
        this.regras.set(nome, {
            ...configuracao,
            nome,
            criadaEm: new Date().toISOString(),
            ativa: true,
            totalDeteccoes: 0
        });
        
        this.logger.info(`📋 Regra adicionada: ${nome}`);
    }

    removerRegra(nome) {
        if (this.regras.delete(nome)) {
            this.logger.info(`🗑️ Regra removida: ${nome}`);
            return true;
        }
        return false;
    }

    ativarRegra(nome) {
        const regra = this.regras.get(nome);
        if (regra) {
            regra.ativa = true;
            this.logger.info(`✅ Regra ativada: ${nome}`);
            return true;
        }
        return false;
    }

    desativarRegra(nome) {
        const regra = this.regras.get(nome);
        if (regra) {
            regra.ativa = false;
            this.logger.info(`⏸️ Regra desativada: ${nome}`);
            return true;
        }
        return false;
    }

    async analisarDados(dados) {
        try {
            this.logger.info('🔍 Analisando dados para anomalias...');
            
            // Adiciona ao histórico
            this.adicionarAoHistorico(dados);
            
            const anomaliasDetectadas = [];
            
            // Executa cada regra ativa
            for (const [nome, regra] of this.regras) {
                if (!regra.ativa) continue;
                
                try {
                    const anomalias = await this.executarRegra(dados, regra);
                    anomaliasDetectadas.push(...anomalias);
                } catch (error) {
                    this.logger.error(`❌ Erro ao executar regra ${nome}:`, error);
                }
            }
            
            // Processa anomalias encontradas
            for (const anomalia of anomaliasDetectadas) {
                await this.processarAnomalia(anomalia);
            }
            
            this.logger.info(`🔍 Análise concluída: ${anomaliasDetectadas.length} anomalias detectadas`);
            return anomaliasDetectadas;
            
        } catch (error) {
            this.logger.error('❌ Erro na análise de anomalias:', error);
            throw error;
        }
    }

    async executarRegra(dados, regra) {
        const anomalias = [];
        
        switch (regra.tipo) {
            case 'outlier_estatistico':
                anomalias.push(...this.detectarOutliersEstatisticos(dados, regra));
                break;
            case 'limite_fixo':
                anomalias.push(...this.detectarLimitesFixos(dados, regra));
                break;
            case 'completude':
                anomalias.push(...this.detectarProblemasCompletude(dados, regra));
                break;
            case 'variacao_temporal':
                anomalias.push(...this.detectarVariacaoTemporal(dados, regra));
                break;
            case 'volume':
                anomalias.push(...this.detectarVolumeAnomalo(dados, regra));
                break;
            case 'personalizada':
                if (regra.funcao) {
                    anomalias.push(...regra.funcao(dados, regra));
                }
                break;
        }
        
        return anomalias;
    }

    detectarOutliersEstatisticos(dados, regra) {
        const anomalias = [];
        
        if (!Array.isArray(dados)) return anomalias;
        
        const valores = dados
            .map(item => parseFloat(item[regra.campo]))
            .filter(val => !isNaN(val));
        
        if (valores.length < 3) return anomalias;
        
        const media = valores.reduce((a, b) => a + b, 0) / valores.length;
        const desvio = Math.sqrt(valores.reduce((acc, val) => acc + Math.pow(val - media, 2), 0) / valores.length);
        
        dados.forEach((item, index) => {
            const valor = parseFloat(item[regra.campo]);
            if (isNaN(valor)) return;
            
            const zscore = Math.abs((valor - media) / desvio);
            
            if (zscore > regra.limiar) {
                anomalias.push({
                    regra: regra.nome,
                    tipo: regra.tipo,
                    severidade: regra.severidade,
                    descricao: regra.descricao,
                    item: item,
                    indice: index,
                    valor: valor,
                    zscore: zscore,
                    media: media,
                    desvio: desvio,
                    detectadoEm: new Date().toISOString()
                });
            }
        });
        
        return anomalias;
    }

    detectarLimitesFixos(dados, regra) {
        const anomalias = [];
        
        if (!Array.isArray(dados)) return anomalias;
        
        dados.forEach((item, index) => {
            const valor = parseFloat(item[regra.campo]);
            if (isNaN(valor)) return;
            
            if (valor < regra.min || valor > regra.max) {
                anomalias.push({
                    regra: regra.nome,
                    tipo: regra.tipo,
                    severidade: regra.severidade,
                    descricao: regra.descricao,
                    item: item,
                    indice: index,
                    valor: valor,
                    limiteMin: regra.min,
                    limiteMax: regra.max,
                    detectadoEm: new Date().toISOString()
                });
            }
        });
        
        return anomalias;
    }

    detectarProblemasCompletude(dados, regra) {
        const anomalias = [];
        
        if (!Array.isArray(dados)) return anomalias;
        
        dados.forEach((item, index) => {
            const camposPreenchidos = regra.camposObrigatorios.filter(campo => 
                item[campo] !== null && item[campo] !== undefined && item[campo] !== ''
            ).length;
            
            const completude = camposPreenchidos / regra.camposObrigatorios.length;
            
            if (completude < regra.limiarCompletude) {
                anomalias.push({
                    regra: regra.nome,
                    tipo: regra.tipo,
                    severidade: regra.severidade,
                    descricao: regra.descricao,
                    item: item,
                    indice: index,
                    completude: completude,
                    camposAusentes: regra.camposObrigatorios.filter(campo => 
                        !item[campo] || item[campo] === ''
                    ),
                    detectadoEm: new Date().toISOString()
                });
            }
        });
        
        return anomalias;
    }

    detectarVariacaoTemporal(dados, regra) {
        const anomalias = [];
        
        if (!Array.isArray(dados) || dados.length < 2) return anomalias;
        
        // Ordena por data
        const dadosOrdenados = dados
            .filter(item => item.coletadoEm || item.data)
            .sort((a, b) => new Date(a.coletadoEm || a.data) - new Date(b.coletadoEm || b.data));
        
        for (let i = 1; i < dadosOrdenados.length; i++) {
            const atual = dadosOrdenados[i];
            const anterior = dadosOrdenados[i - 1];
            
            const valorAtual = parseFloat(atual[regra.campo]);
            const valorAnterior = parseFloat(anterior[regra.campo]);
            
            if (isNaN(valorAtual) || isNaN(valorAnterior)) continue;
            
            const variacao = Math.abs((valorAtual - valorAnterior) / valorAnterior);
            
            if (variacao > regra.limiarVariacao) {
                anomalias.push({
                    regra: regra.nome,
                    tipo: regra.tipo,
                    severidade: regra.severidade,
                    descricao: regra.descricao,
                    item: atual,
                    itemAnterior: anterior,
                    valorAtual: valorAtual,
                    valorAnterior: valorAnterior,
                    variacao: variacao,
                    detectadoEm: new Date().toISOString()
                });
            }
        }
        
        return anomalias;
    }

    detectarVolumeAnomalo(dados, regra) {
        const anomalias = [];
        
        if (!Array.isArray(dados)) return anomalias;
        
        const agora = new Date();
        const janelaInicio = new Date(agora.getTime() - (regra.janelaMinutos * 60 * 1000));
        
        const dadosRecentes = dados.filter(item => {
            const dataItem = new Date(item.coletadoEm || item.data || agora);
            return dataItem >= janelaInicio;
        });
        
        const volume = dadosRecentes.length;
        
        if (volume < regra.limiarMinimo || volume > regra.limiarMaximo) {
            anomalias.push({
                regra: regra.nome,
                tipo: regra.tipo,
                severidade: regra.severidade,
                descricao: regra.descricao,
                volume: volume,
                limiarMinimo: regra.limiarMinimo,
                limiarMaximo: regra.limiarMaximo,
                janelaMinutos: regra.janelaMinutos,
                detectadoEm: new Date().toISOString()
            });
        }
        
        return anomalias;
    }

    async processarAnomalia(anomalia) {
        // Atualiza contador da regra
        const regra = this.regras.get(anomalia.regra);
        if (regra) {
            regra.totalDeteccoes++;
        }
        
        // Emite evento baseado na severidade
        if (anomalia.severidade === 'CRITICO') {
            this.emit('alerta_critico', anomalia);
        } else {
            this.emit('anomalia_detectada', anomalia);
        }
        
        // Salva alerta se configurado
        await this.salvarAlerta(anomalia);
    }

    async salvarAlerta(anomalia) {
        try {
            const arquivo = `alerts/alert_${Date.now()}.json`;
            await fs.mkdir('alerts', { recursive: true });
            await fs.writeFile(arquivo, JSON.stringify(anomalia, null, 2));
        } catch (error) {
            this.logger.error('❌ Erro ao salvar alerta:', error);
        }
    }

    adicionarAoHistorico(dados) {
        const entrada = {
            timestamp: new Date().toISOString(),
            dados: Array.isArray(dados) ? dados.length : 1,
            amostra: Array.isArray(dados) ? dados.slice(0, 3) : dados
        };
        
        this.historico.push(entrada);
        
        // Mantém apenas o histórico recente
        if (this.historico.length > this.configuracao.limiteHistorico) {
            this.historico = this.historico.slice(-this.configuracao.limiteHistorico);
        }
    }

    iniciarMonitoramento() {
        if (this.isMonitorando) return;
        
        this.isMonitorando = true;
        this.intervalId = setInterval(() => {
            this.emit('verificacao_periodica');
        }, this.configuracao.intervaloVerificacao);
        
        this.logger.info('🔄 Monitoramento de anomalias iniciado');
    }

    pararMonitoramento() {
        if (!this.isMonitorando) return;
        
        this.isMonitorando = false;
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        
        this.logger.info('⏹️ Monitoramento de anomalias parado');
    }

    obterEstatisticas() {
        const totalRegras = this.regras.size;
        const regrasAtivas = Array.from(this.regras.values()).filter(r => r.ativa).length;
        const totalAlertas = this.alertas.length;
        const alertasPorSeveridade = {};
        
        this.alertas.forEach(alerta => {
            alertasPorSeveridade[alerta.severidade] = (alertasPorSeveridade[alerta.severidade] || 0) + 1;
        });
        
        return {
            totalRegras,
            regrasAtivas,
            totalAlertas,
            alertasPorSeveridade,
            isMonitorando: this.isMonitorando,
            ultimaVerificacao: this.historico.length > 0 ? this.historico[this.historico.length - 1].timestamp : null
        };
    }

    obterAlertas(filtros = {}) {
        let alertasFiltrados = [...this.alertas];
        
        if (filtros.severidade) {
            alertasFiltrados = alertasFiltrados.filter(a => a.severidade === filtros.severidade);
        }
        
        if (filtros.regra) {
            alertasFiltrados = alertasFiltrados.filter(a => a.regra === filtros.regra);
        }
        
        if (filtros.dataInicio) {
            const inicio = new Date(filtros.dataInicio);
            alertasFiltrados = alertasFiltrados.filter(a => new Date(a.detectadoEm) >= inicio);
        }
        
        if (filtros.limite) {
            alertasFiltrados = alertasFiltrados.slice(-filtros.limite);
        }
        
        return alertasFiltrados.sort((a, b) => new Date(b.detectadoEm) - new Date(a.detectadoEm));
    }

    async gerarRelatorioAnomalias() {
        const estatisticas = this.obterEstatisticas();
        const alertasRecentes = this.obterAlertas({ limite: 50 });
        
        const relatorio = {
            geradoEm: new Date().toISOString(),
            estatisticas,
            alertasRecentes,
            regrasConfiguridas: Array.from(this.regras.entries()).map(([nome, regra]) => ({
                nome,
                tipo: regra.tipo,
                ativa: regra.ativa,
                totalDeteccoes: regra.totalDeteccoes,
                severidade: regra.severidade
            }))
        };
        
        return relatorio;
    }
}

// Execução direta para testes
if (import.meta.url === `file://${process.argv[1]}`) {
    const detector = new AnomalyDetector();
    
    detector.inicializar()
        .then(() => {
            console.log('✅ Anomaly Detector pronto para uso!');
            console.log('📊 Estatísticas:', detector.obterEstatisticas());
        })
        .catch(error => console.error('❌ Erro:', error));
}
