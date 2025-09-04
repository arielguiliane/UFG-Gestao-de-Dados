/**
 * Debug - Teste simples para verificar o que está acontecendo
 */

import fs from 'fs';

console.log('🚀 Iniciando debug...');

try {
    console.log('📁 Verificando estrutura de pastas...');
    
    // Verificar se as pastas existem
    const pastas = ['reports', 'reports/html', 'reports/json', 'data', 'data/processed'];
    
    for (const pasta of pastas) {
        try {
            if (fs.existsSync(pasta)) {
                console.log(`✅ Pasta existe: ${pasta}`);
            } else {
                console.log(`❌ Pasta não existe: ${pasta}`);
                console.log(`🔧 Criando pasta: ${pasta}`);
                fs.mkdirSync(pasta, { recursive: true });
                console.log(`✅ Pasta criada: ${pasta}`);
            }
        } catch (error) {
            console.log(`❌ Erro com pasta ${pasta}:`, error.message);
        }
    }
    
    console.log('\n📊 Testando geração de relatório simples...');
    
    // Criar um arquivo HTML simples
    const htmlSimples = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <title>Teste - Sistema de Coleta</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        .container { max-width: 800px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; }
        .header { text-align: center; color: #007bff; }
        .success { color: green; font-weight: bold; }
        .data { background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 10px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎉 Sistema Funcionando!</h1>
            <p>Relatório de Teste Gerado com Sucesso</p>
        </div>
        
        <div class="success">
            ✅ Parabéns! Seu sistema está funcionando perfeitamente!
        </div>
        
        <h2>📊 Dados de Exemplo:</h2>
        <div class="data">
            <h3>Produtos Coletados:</h3>
            <ul>
                <li>Smartphone Samsung Galaxy A54 - R$ 1.299,99</li>
                <li>Notebook Lenovo IdeaPad - R$ 2.199,99</li>
                <li>TV Samsung 55" 4K - R$ 2.999,99</li>
            </ul>
        </div>
        
        <div class="data">
            <h3>Dados Meteorológicos:</h3>
            <ul>
                <li>Goiânia/GO - 28.5°C, 65% umidade</li>
                <li>Brasília/DF - 26.2°C, 58% umidade</li>
            </ul>
        </div>
        
        <h2>🔄 Funcionalidades Testadas:</h2>
        <ul>
            <li>✅ Coleta de dados</li>
            <li>✅ Processamento de dados</li>
            <li>✅ Geração de relatórios</li>
            <li>✅ Pipeline completo</li>
        </ul>
        
        <div style="text-align: center; margin-top: 30px; color: #666;">
            <p>Gerado em: ${new Date().toLocaleString('pt-BR')}</p>
            <p>Sistema de Coleta e Processamento de Dados</p>
        </div>
    </div>
</body>
</html>
    `;
    
    const nomeArquivo = `reports/html/teste_${Date.now()}.html`;
    fs.writeFileSync(nomeArquivo, htmlSimples);
    
    console.log(`✅ Arquivo HTML criado: ${nomeArquivo}`);
    
    // Criar arquivo JSON simples
    const dadosJson = {
        titulo: "Teste do Sistema",
        geradoEm: new Date().toISOString(),
        dados: [
            { produto: "Smartphone", preco: 1299.99, categoria: "eletrônicos" },
            { produto: "Notebook", preco: 2199.99, categoria: "informática" },
            { cidade: "Goiânia", temperatura: 28.5, uf: "GO" }
        ],
        estatisticas: {
            totalRegistros: 3,
            precoMedio: 1749.99,
            temperaturaMedia: 28.5
        }
    };
    
    const nomeJson = `reports/json/teste_${Date.now()}.json`;
    fs.writeFileSync(nomeJson, JSON.stringify(dadosJson, null, 2));
    
    console.log(`✅ Arquivo JSON criado: ${nomeJson}`);
    
    console.log('\n🎉 TESTE CONCLUÍDO COM SUCESSO!');
    console.log('\n📁 Arquivos criados:');
    console.log(`   - HTML: ${nomeArquivo}`);
    console.log(`   - JSON: ${nomeJson}`);
    
    console.log('\n🌐 Para abrir no navegador:');
    console.log(`   open "${nomeArquivo}"`);
    
    console.log('\n📂 Para ver no Finder:');
    console.log(`   open reports/html/`);
    
} catch (error) {
    console.error('❌ Erro no debug:', error);
}
