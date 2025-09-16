# Guia Prático: Como Testar o Data Warehouse

## 🔧 Passo 1: Verificar Ambiente

### Testar conexão MySQL
```bash
# Testar se MySQL está rodando
mysql --version

# Conectar ao MySQL (vai pedir senha)
mysql -u root -p
```

Se conectou com sucesso, digite `exit;` para sair.

## 📁 Passo 2: Navegar até o Diretório do Projeto

```bash
# Navegar até o diretório do projeto
cd "/Users/arielguiliane/Desktop/UFG/Gestão de Dados/Atividade_05"

# Verificar se os arquivos estão lá
ls -la
```

Você deve ver os diretórios: `docs/`, `sql/`, `testes/`, etc.

## 🗄️ Passo 3: Criar o Banco de Dados

### Opção A: Via linha de comando
```bash
mysql -u root -p -e "CREATE DATABASE dw_ecommerce_test; SHOW DATABASES;"
```

### Opção B: Via interface MySQL
```bash
mysql -u root -p
```
Depois execute:
```sql
CREATE DATABASE dw_ecommerce_test;
USE dw_ecommerce_test;
SHOW TABLES;  -- Deve estar vazio
exit;
```

## 🏗️ Passo 4: Executar Scripts na Ordem Correta

### 4.1 Criar as Dimensões
```bash
mysql -u root -p dw_ecommerce_test < sql/ddl/01-create-dimensions.sql
```

### 4.2 Criar a Tabela Fato
```bash
mysql -u root -p dw_ecommerce_test < sql/ddl/02-create-fact-table.sql
```

### 4.3 Popular Dimensão Tempo
```bash
mysql -u root -p dw_ecommerce_test < sql/etl/01-load-dim-tempo.sql
```

### 4.4 Carregar Dados de Teste
```bash
mysql -u root -p dw_ecommerce_test < testes/dados/01-popular-dimensoes.sql
mysql -u root -p dw_ecommerce_test < testes/dados/02-popular-fato-vendas.sql
```

## ✅ Passo 5: Verificar se Funcionou

### Conectar e verificar dados
```bash
mysql -u root -p dw_ecommerce_test
```

### Executar consultas de verificação
```sql
-- Ver todas as tabelas criadas
SHOW TABLES;

-- Contar registros em cada tabela
SELECT 'DIM_TEMPO' as Tabela, COUNT(*) as Registros FROM DIM_TEMPO
UNION ALL SELECT 'DIM_CLIENTE', COUNT(*) FROM DIM_CLIENTE
UNION ALL SELECT 'DIM_PRODUTO', COUNT(*) FROM DIM_PRODUTO
UNION ALL SELECT 'DIM_CANAL_VENDA', COUNT(*) FROM DIM_CANAL_VENDA
UNION ALL SELECT 'DIM_PROMOCAO', COUNT(*) FROM DIM_PROMOCAO
UNION ALL SELECT 'FATO_VENDAS', COUNT(*) FROM FATO_VENDAS;

-- Ver alguns dados de exemplo
SELECT * FROM DIM_CLIENTE LIMIT 3;
SELECT * FROM DIM_PRODUTO LIMIT 3;
SELECT * FROM FATO_VENDAS LIMIT 5;
```

### Resultados esperados:
- DIM_TEMPO: ~2191 registros
- DIM_CLIENTE: 10 registros
- DIM_PRODUTO: 10 registros
- DIM_CANAL_VENDA: 6 registros
- DIM_PROMOCAO: 6 registros
- FATO_VENDAS: 18 registros

## 📊 Passo 6: Testar Consultas de Negócio

### Ainda conectado no MySQL, execute estas consultas:

```sql
-- 1. RECEITA TOTAL E MÉTRICAS BÁSICAS
SELECT
    CONCAT('R$ ', FORMAT(SUM(valor_total_item), 2)) as Receita_Total,
    CONCAT('R$ ', FORMAT(SUM(margem_bruta), 2)) as Margem_Total,
    CONCAT('R$ ', FORMAT(AVG(valor_total_item), 2)) as Ticket_Medio,
    SUM(quantidade_vendida) as Qtd_Total_Vendida
FROM FATO_VENDAS;

-- 2. VENDAS POR MÊS
SELECT
    t.nome_mes as Mês,
    COUNT(DISTINCT f.id_pedido) as Pedidos,
    SUM(f.quantidade_vendida) as Quantidade,
    CONCAT('R$ ', FORMAT(SUM(f.valor_total_item), 2)) as Receita
FROM FATO_VENDAS f
JOIN DIM_TEMPO t ON f.sk_tempo = t.sk_tempo
WHERE t.ano = 2024
GROUP BY t.mes, t.nome_mes
ORDER BY t.mes;

-- 3. TOP 5 CLIENTES
SELECT
    c.nome_cliente as Cliente,
    c.segmento_cliente as Segmento,
    COUNT(DISTINCT f.id_pedido) as Pedidos,
    CONCAT('R$ ', FORMAT(SUM(f.valor_total_item), 2)) as Receita_Total
FROM FATO_VENDAS f
JOIN DIM_CLIENTE c ON f.sk_cliente = c.sk_cliente
GROUP BY c.sk_cliente, c.nome_cliente, c.segmento_cliente
ORDER BY SUM(f.valor_total_item) DESC
LIMIT 5;

-- 4. TOP 5 PRODUTOS
SELECT
    p.nome_produto as Produto,
    p.categoria_nivel1 as Categoria,
    SUM(f.quantidade_vendida) as Qtd_Vendida,
    CONCAT('R$ ', FORMAT(SUM(f.valor_total_item), 2)) as Receita
FROM FATO_VENDAS f
JOIN DIM_PRODUTO p ON f.sk_produto = p.sk_produto
GROUP BY p.sk_produto, p.nome_produto, p.categoria_nivel1
ORDER BY SUM(f.valor_total_item) DESC
LIMIT 5;
```

## 🚀 Passo 7: Executar Testes Automatizados (Opcional)

### Sair do MySQL primeiro:
```sql
exit;
```

### Executar script automatizado:
```bash
# Dar permissão de execução
chmod +x testes/executar_todos_testes.sh

# Executar todos os testes
./testes/executar_todos_testes.sh
```

## ❌ Problemas Comuns e Soluções

### Erro: "mysql: command not found"
**Solução**: MySQL não está instalado ou não está no PATH
```bash
# No macOS com Homebrew
brew install mysql

# Ou adicionar ao PATH
export PATH="/usr/local/mysql/bin:$PATH"
```

### Erro: "Access denied for user 'root'"
**Solução**: Senha incorreta ou usuário não existe
```bash
# Resetar senha do root (se necessário)
sudo mysql_secure_installation
```

### Erro: "Can't connect to local MySQL server"
**Solução**: MySQL não está rodando
```bash
# No macOS
brew services start mysql

# Ou
sudo /usr/local/mysql/support-files/mysql.server start
```

### Erro: "Table already exists"
**Solução**: Banco já foi criado antes
```sql
-- Limpar e recriar
DROP DATABASE IF EXISTS dw_ecommerce_test;
CREATE DATABASE dw_ecommerce_test;
```

## 🎯 Resultados Esperados Finais

Se tudo funcionou corretamente, você deve ver:

1. **6 tabelas criadas**: 5 dimensões + 1 fato
2. **Dados carregados**: ~2.200 registros no total
3. **Receita total**: Aproximadamente R$ 18.000,00
4. **Melhor cliente**: Marcos Alves (Notebook Dell)
5. **Produto mais vendido**: Smartphones e Notebooks
6. **Consultas rápidas**: < 100ms para a maioria

## 📱 Usando Interface Gráfica (Alternativa)

Se preferir usar uma interface gráfica:

### MySQL Workbench:
1. Conectar ao servidor MySQL
2. Criar novo schema: `dw_ecommerce_test`
3. Abrir e executar cada arquivo SQL na ordem
4. Usar o Query Browser para testar consultas

### phpMyAdmin (se disponível):
1. Acessar via navegador
2. Criar banco `dw_ecommerce_test`
3. Importar arquivos SQL na ordem
4. Usar aba SQL para consultas

## 🏆 Pronto!

Agora você tem um Data Warehouse funcionando com:
- ✅ Estrutura dimensional completa
- ✅ Dados de teste realistas
- ✅ Consultas de negócio validadas
- ✅ Performance otimizada
- ✅ Documentação completa

**Próximo passo**: Use as consultas de exemplo para criar relatórios e análises para sua apresentação acadêmica!