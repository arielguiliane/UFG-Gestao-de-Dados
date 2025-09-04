/**
 * Report Generator
 * Gera relatórios automatizados e dashboards básicos
 */

import fs from 'fs/promises';
import path from 'path';
import { Logger } from '../../utils/logger.js';

export class ReportGenerator {
    constructor() {
        this.logger = new Logger();
        this.outputDir = 'reports';
        this.templates = new Map();
        this.configurarTemplates();
    }

    async inicializar() {
        try {
            this.logger.info('📊 Inicializando Report Generator...');
            
            // Cria diretório de relatórios
            await fs.mkdir(this.outputDir, { recursive: true });
            await fs.mkdir(`${this.outputDir}/html`, { recursive: true });
            await fs.mkdir(`${this.outputDir}/json`, { recursive: true });
            await fs.mkdir(`${this.outputDir}/csv`, { recursive: true });
            
            this.logger.success('✅ Report Generator inicializado');
            
        } catch (error) {
            this.logger.error('❌ Erro ao inicializar Report Generator:', error);
            throw error;
        }
    }

    configurarTemplates() {
        // Template HTML básico
        this.templates.set('html', `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{titulo}}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 2px solid #007bff; }
        .header h1 { color: #007bff; margin: 0; }
        .header p { color: #666; margin: 5px 0; }
        .section { margin: 20px 0; }
        .section h2 { color: #333; border-bottom: 1px solid #ddd; padding-bottom: 10px; }
        .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin: 20px 0; }
        .stat-card { background: #f8f9fa; padding: 15px; border-radius: 5px; text-align: center; border-left: 4px solid #007bff; }
        .stat-card h3 { margin: 0 0 10px 0; color: #007bff; font-size: 24px; }
        .stat-card p { margin: 0; color: #666; }
        .table { width: 100%; border-collapse: collapse; margin: 15px 0; }
        .table th, .table td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
        .table th { background: #007bff; color: white; }
        .table tr:hover { background: #f5f5f5; }
        .chart-placeholder { background: #f8f9fa; padding: 40px; text-align: center; color: #666; border: 2px dashed #ddd; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>{{titulo}}</h1>
            <p>{{subtitulo}}</p>
            <p><strong>Gerado em:</strong> {{dataGeracao}}</p>
        </div>
        {{conteudo}}
        <div class="footer">
            <p>Relatório gerado automaticamente pelo Sistema de Coleta de Dados</p>
        </div>
    </div>
</body>
</html>
        `);
    }

    async gerarRelatorio(dados, configuracao) {
        try {
            this.logger.info(`📋 Gerando relatório: ${configuracao.titulo}`);
            
            const relatorio = {
                titulo: configuracao.titulo,
                subtitulo: configuracao.subtitulo || '',
                dataGeracao: new Date().toLocaleString('pt-BR'),
                dados: dados,
                estatisticas: await this.calcularEstatisticas(dados),
                secoes: []
            };

            // Gera seções do relatório
            if (configuracao.secoes) {
                for (const secaoConfig of configuracao.secoes) {
                    const secao = await this.gerarSecao(dados, secaoConfig);
                    relatorio.secoes.push(secao);
                }
            }

            // Salva em diferentes formatos
            const arquivos = {};
            
            if (configuracao.formatos?.includes('html')) {
                arquivos.html = await this.salvarHTML(relatorio, configuracao);
            }
            
            if (configuracao.formatos?.includes('json')) {
                arquivos.json = await this.salvarJSON(relatorio, configuracao);
            }
            
            if (configuracao.formatos?.includes('csv')) {
                arquivos.csv = await this.salvarCSV(dados, configuracao);
            }

            this.logger.success(`✅ Relatório gerado: ${configuracao.titulo}`);
            return { relatorio, arquivos };

        } catch (error) {
            this.logger.error('❌ Erro ao gerar relatório:', error);
            throw error;
        }
    }

    async gerarSecao(dados, configuracao) {
        const secao = {
            titulo: configuracao.titulo,
            tipo: configuracao.tipo,
            conteudo: null
        };

        switch (configuracao.tipo) {
            case 'estatisticas':
                secao.conteudo = await this.gerarEstatisticasSecao(dados, configuracao);
                break;
            case 'tabela':
                secao.conteudo = await this.gerarTabelaSecao(dados, configuracao);
                break;
            case 'grafico':
                secao.conteudo = await this.gerarGraficoSecao(dados, configuracao);
                break;
            case 'resumo':
                secao.conteudo = await this.gerarResumoSecao(dados, configuracao);
                break;
            case 'personalizada':
                secao.conteudo = await configuracao.gerador(dados);
                break;
        }

        return secao;
    }

    async gerarEstatisticasSecao(dados, configuracao) {
        const estatisticas = await this.calcularEstatisticas(dados);
        
        return {
            cards: [
                { titulo: 'Total de Registros', valor: estatisticas.totalRegistros, icone: '📊' },
                { titulo: 'Última Atualização', valor: estatisticas.ultimaAtualizacao, icone: '🕒' },
                { titulo: 'Campos Únicos', valor: estatisticas.totalCampos, icone: '🏷️' },
                { titulo: 'Taxa de Completude', valor: `${estatisticas.taxaCompletude}%`, icone: '✅' }
            ]
        };
    }

    async gerarTabelaSecao(dados, configuracao) {
        if (!Array.isArray(dados)) return { linhas: [] };
        
        const colunas = configuracao.colunas || Object.keys(dados[0] || {});
        const limite = configuracao.limite || 50;
        
        return {
            colunas: colunas,
            linhas: dados.slice(0, limite).map(item => 
                colunas.map(coluna => item[coluna] || '-')
            )
        };
    }

    async gerarGraficoSecao(dados, configuracao) {
        // Placeholder para gráficos - em uma implementação real, 
        // integraria com bibliotecas como Chart.js ou D3.js
        return {
            tipo: configuracao.tipoGrafico || 'barra',
            dados: this.prepararDadosGrafico(dados, configuracao),
            placeholder: `Gráfico de ${configuracao.tipoGrafico || 'barras'} - ${configuracao.titulo}`
        };
    }

    async gerarResumoSecao(dados, configuracao) {
        const resumo = {
            pontosPrincipais: [],
            insights: [],
            recomendacoes: []
        };

        if (Array.isArray(dados) && dados.length > 0) {
            // Análise automática básica
            const estatisticas = await this.calcularEstatisticas(dados);
            
            resumo.pontosPrincipais.push(
                `Total de ${estatisticas.totalRegistros} registros analisados`,
                `Dados coletados entre ${estatisticas.periodoInicio} e ${estatisticas.periodoFim}`,
                `Taxa de completude dos dados: ${estatisticas.taxaCompletude}%`
            );

            // Insights baseados nos dados
            if (dados.some(item => item.preco)) {
                const precos = dados.map(item => parseFloat(item.preco)).filter(p => !isNaN(p));
                const precoMedio = precos.reduce((a, b) => a + b, 0) / precos.length;
                resumo.insights.push(`Preço médio dos produtos: R$ ${precoMedio.toFixed(2)}`);
            }

            if (dados.some(item => item.categoria)) {
                const categorias = [...new Set(dados.map(item => item.categoria))];
                resumo.insights.push(`${categorias.length} categorias diferentes identificadas`);
            }
        }

        return resumo;
    }

    prepararDadosGrafico(dados, configuracao) {
        if (!Array.isArray(dados)) return [];
        
        switch (configuracao.tipoGrafico) {
            case 'pizza':
                return this.agruparParaPizza(dados, configuracao.campo);
            case 'linha':
                return this.prepararParaLinha(dados, configuracao.campoX, configuracao.campoY);
            case 'barra':
            default:
                return this.agruparParaBarra(dados, configuracao.campo);
        }
    }

    agruparParaPizza(dados, campo) {
        const grupos = {};
        dados.forEach(item => {
            const valor = item[campo];
            grupos[valor] = (grupos[valor] || 0) + 1;
        });
        
        return Object.entries(grupos).map(([label, value]) => ({ label, value }));
    }

    agruparParaBarra(dados, campo) {
        return this.agruparParaPizza(dados, campo);
    }

    prepararParaLinha(dados, campoX, campoY) {
        return dados.map(item => ({
            x: item[campoX],
            y: parseFloat(item[campoY]) || 0
        })).sort((a, b) => new Date(a.x) - new Date(b.x));
    }

    async calcularEstatisticas(dados) {
        if (!Array.isArray(dados) || dados.length === 0) {
            return {
                totalRegistros: 0,
                totalCampos: 0,
                taxaCompletude: 0,
                ultimaAtualizacao: 'N/A',
                periodoInicio: 'N/A',
                periodoFim: 'N/A'
            };
        }

        const totalRegistros = dados.length;
        const campos = Object.keys(dados[0] || {});
        const totalCampos = campos.length;
        
        // Calcula taxa de completude
        let totalValores = 0;
        let valoresPreenchidos = 0;
        
        dados.forEach(item => {
            campos.forEach(campo => {
                totalValores++;
                if (item[campo] !== null && item[campo] !== undefined && item[campo] !== '') {
                    valoresPreenchidos++;
                }
            });
        });
        
        const taxaCompletude = totalValores > 0 ? Math.round((valoresPreenchidos / totalValores) * 100) : 0;
        
        // Encontra período dos dados
        const datasColeta = dados
            .map(item => item.coletadoEm || item.data || item.timestamp)
            .filter(data => data)
            .map(data => new Date(data))
            .sort((a, b) => a - b);
        
        const periodoInicio = datasColeta.length > 0 ? datasColeta[0].toLocaleDateString('pt-BR') : 'N/A';
        const periodoFim = datasColeta.length > 0 ? datasColeta[datasColeta.length - 1].toLocaleDateString('pt-BR') : 'N/A';
        const ultimaAtualizacao = periodoFim;

        return {
            totalRegistros,
            totalCampos,
            taxaCompletude,
            ultimaAtualizacao,
            periodoInicio,
            periodoFim
        };
    }

    async salvarHTML(relatorio, configuracao) {
        const template = this.templates.get('html');
        const conteudo = this.gerarConteudoHTML(relatorio);
        
        const html = template
            .replace(/{{titulo}}/g, relatorio.titulo)
            .replace(/{{subtitulo}}/g, relatorio.subtitulo)
            .replace(/{{dataGeracao}}/g, relatorio.dataGeracao)
            .replace(/{{conteudo}}/g, conteudo);
        
        const nomeArquivo = `${this.sanitizarNomeArquivo(configuracao.titulo)}_${Date.now()}.html`;
        const caminhoArquivo = path.join(this.outputDir, 'html', nomeArquivo);
        
        await fs.writeFile(caminhoArquivo, html);
        return caminhoArquivo;
    }

    gerarConteudoHTML(relatorio) {
        let html = '';
        
        // Seção de estatísticas gerais
        html += '<div class="section">';
        html += '<h2>📊 Estatísticas Gerais</h2>';
        html += '<div class="stats-grid">';
        
        const stats = relatorio.estatisticas;
        html += `<div class="stat-card"><h3>${stats.totalRegistros}</h3><p>Total de Registros</p></div>`;
        html += `<div class="stat-card"><h3>${stats.totalCampos}</h3><p>Campos Únicos</p></div>`;
        html += `<div class="stat-card"><h3>${stats.taxaCompletude}%</h3><p>Taxa de Completude</p></div>`;
        html += `<div class="stat-card"><h3>${stats.ultimaAtualizacao}</h3><p>Última Atualização</p></div>`;
        
        html += '</div></div>';
        
        // Seções personalizadas
        relatorio.secoes.forEach(secao => {
            html += `<div class="section">`;
            html += `<h2>${secao.titulo}</h2>`;
            
            switch (secao.tipo) {
                case 'tabela':
                    html += this.gerarTabelaHTML(secao.conteudo);
                    break;
                case 'grafico':
                    html += `<div class="chart-placeholder">${secao.conteudo.placeholder}</div>`;
                    break;
                case 'resumo':
                    html += this.gerarResumoHTML(secao.conteudo);
                    break;
                default:
                    html += '<p>Conteúdo não disponível</p>';
            }
            
            html += '</div>';
        });
        
        return html;
    }

    gerarTabelaHTML(conteudo) {
        if (!conteudo.linhas || conteudo.linhas.length === 0) {
            return '<p>Nenhum dado disponível</p>';
        }
        
        let html = '<table class="table">';
        
        // Cabeçalho
        html += '<thead><tr>';
        conteudo.colunas.forEach(coluna => {
            html += `<th>${coluna}</th>`;
        });
        html += '</tr></thead>';
        
        // Linhas
        html += '<tbody>';
        conteudo.linhas.forEach(linha => {
            html += '<tr>';
            linha.forEach(celula => {
                html += `<td>${celula}</td>`;
            });
            html += '</tr>';
        });
        html += '</tbody></table>';
        
        return html;
    }

    gerarResumoHTML(conteudo) {
        let html = '';
        
        if (conteudo.pontosPrincipais?.length > 0) {
            html += '<h3>Pontos Principais:</h3><ul>';
            conteudo.pontosPrincipais.forEach(ponto => {
                html += `<li>${ponto}</li>`;
            });
            html += '</ul>';
        }
        
        if (conteudo.insights?.length > 0) {
            html += '<h3>Insights:</h3><ul>';
            conteudo.insights.forEach(insight => {
                html += `<li>${insight}</li>`;
            });
            html += '</ul>';
        }
        
        return html;
    }

    async salvarJSON(relatorio, configuracao) {
        const nomeArquivo = `${this.sanitizarNomeArquivo(configuracao.titulo)}_${Date.now()}.json`;
        const caminhoArquivo = path.join(this.outputDir, 'json', nomeArquivo);
        
        await fs.writeFile(caminhoArquivo, JSON.stringify(relatorio, null, 2));
        return caminhoArquivo;
    }

    async salvarCSV(dados, configuracao) {
        if (!Array.isArray(dados) || dados.length === 0) {
            return null;
        }
        
        const colunas = Object.keys(dados[0]);
        let csv = colunas.join(',') + '\n';
        
        dados.forEach(item => {
            const linha = colunas.map(coluna => {
                const valor = item[coluna] || '';
                return typeof valor === 'string' && valor.includes(',') ? `"${valor}"` : valor;
            });
            csv += linha.join(',') + '\n';
        });
        
        const nomeArquivo = `${this.sanitizarNomeArquivo(configuracao.titulo)}_${Date.now()}.csv`;
        const caminhoArquivo = path.join(this.outputDir, 'csv', nomeArquivo);
        
        await fs.writeFile(caminhoArquivo, csv);
        return caminhoArquivo;
    }

    sanitizarNomeArquivo(nome) {
        return nome
            .toLowerCase()
            .replace(/[^a-z0-9]/g, '_')
            .replace(/_+/g, '_')
            .replace(/^_|_$/g, '');
    }

    async gerarDashboard(dados, configuracao = {}) {
        try {
            this.logger.info('📊 Gerando dashboard...');
            
            const dashboardConfig = {
                titulo: 'Dashboard - Sistema de Coleta de Dados',
                subtitulo: 'Visão geral dos dados coletados',
                formatos: ['html'],
                secoes: [
                    {
                        titulo: '📊 Estatísticas Gerais',
                        tipo: 'estatisticas'
                    },
                    {
                        titulo: '📋 Dados Recentes',
                        tipo: 'tabela',
                        colunas: configuracao.colunas || ['titulo', 'preco', 'categoria', 'coletadoEm'],
                        limite: 20
                    },
                    {
                        titulo: '📈 Análise por Categoria',
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
            
            const resultado = await this.gerarRelatorio(dados, dashboardConfig);
            
            this.logger.success('✅ Dashboard gerado com sucesso');
            return resultado;
            
        } catch (error) {
            this.logger.error('❌ Erro ao gerar dashboard:', error);
            throw error;
        }
    }
}

// Execução direta para testes
if (import.meta.url === `file://${process.argv[1]}`) {
    const generator = new ReportGenerator();
    
    generator.inicializar()
        .then(() => {
            console.log('✅ Report Generator pronto para uso!');
            console.log(`📁 Diretório de relatórios: ${generator.outputDir}`);
        })
        .catch(error => console.error('❌ Erro:', error));
}
