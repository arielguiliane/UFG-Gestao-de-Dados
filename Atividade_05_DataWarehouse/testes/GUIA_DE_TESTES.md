# Guia Completo de Testes - Data Warehouse E-commerce

## 1. Preparação do Ambiente de Teste

### 1.1 Requisitos de Software
- **MySQL 8.0+** ou **PostgreSQL 13+**
- **MySQL Workbench** ou **pgAdmin** (interface gráfica)
- **Cliente de linha de comando** (mysql/psql)

### 1.2 Configuração do Banco de Dados

#### Para MySQL:
```sql
-- Criar database para testes
CREATE DATABASE dw_ecommerce_test;
USE dw_ecommerce_test;

-- Configurar charset
ALTER DATABASE dw_ecommerce_test CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

#### Para PostgreSQL:
```sql
-- Criar database para testes
CREATE DATABASE dw_ecommerce_test;
\c dw_ecommerce_test;

-- Configurar encoding
ALTER DATABASE dw_ecommerce_test SET client_encoding TO 'utf8';
```

### 1.3 Ordem de Execução dos Scripts

1. **Criar Estruturas**:
   ```bash
   # Executar na ordem:
   mysql -u root -p dw_ecommerce_test < sql/ddl/01-create-dimensions.sql
   mysql -u root -p dw_ecommerce_test < sql/ddl/02-create-fact-table.sql
   ```

2. **Popular Dimensão Tempo**:
   ```bash
   mysql -u root -p dw_ecommerce_test < sql/etl/01-load-dim-tempo.sql
   ```

3. **Carregar Dados de Teste**:
   ```bash
   mysql -u root -p dw_ecommerce_test < testes/dados/01-popular-dimensoes.sql
   mysql -u root -p dw_ecommerce_test < testes/dados/02-popular-fato-vendas.sql
   ```

## 2. Estratégia de Testes

### 2.1 Tipos de Teste
- **Testes Estruturais**: Verificar criação de tabelas e índices
- **Testes de Integridade**: Validar constraints e relacionamentos
- **Testes de Dados**: Verificar qualidade e consistência
- **Testes de Performance**: Avaliar tempo de resposta das consultas
- **Testes de Negócio**: Validar métricas e KPIs

### 2.2 Critérios de Sucesso
- ✅ Todas as tabelas criadas sem erro
- ✅ Dados carregados com integridade referencial
- ✅ Consultas retornam resultados esperados
- ✅ Performance dentro dos parâmetros aceitáveis
- ✅ Métricas de negócio consistentes

## 3. Execução Passo a Passo

### 3.1 Método Automatizado (Recomendado)

```bash
# Dar permissão de execução ao script
chmod +x testes/executar_todos_testes.sh

# Executar todos os testes
./testes/executar_todos_testes.sh
```

### 3.2 Método Manual

#### Passo 1: Criar e configurar o banco
```sql
CREATE DATABASE dw_ecommerce_test;
USE dw_ecommerce_test;
```

#### Passo 2: Criar estruturas
```bash
mysql -u root -p dw_ecommerce_test < sql/ddl/01-create-dimensions.sql
mysql -u root -p dw_ecommerce_test < sql/ddl/02-create-fact-table.sql
```

#### Passo 3: Popular dimensão tempo
```bash
mysql -u root -p dw_ecommerce_test < sql/etl/01-load-dim-tempo.sql
```

#### Passo 4: Carregar dados de teste
```bash
mysql -u root -p dw_ecommerce_test < testes/dados/01-popular-dimensoes.sql
mysql -u root -p dw_ecommerce_test < testes/dados/02-popular-fato-vendas.sql
```

#### Passo 5: Executar validações
```bash
mysql -u root -p dw_ecommerce_test < testes/validacao/01-testes-estruturais.sql
mysql -u root -p dw_ecommerce_test < testes/validacao/02-testes-qualidade-dados.sql
mysql -u root -p dw_ecommerce_test < testes/validacao/03-testes-negocio.sql
mysql -u root -p dw_ecommerce_test < testes/performance/01-testes-performance.sql
```

## 4. Resultados Esperados

### 4.1 Dados de Teste Carregados
- **10 clientes** com perfis variados
- **10 produtos** de diferentes categorias
- **6 canais** de venda
- **6 promoções** ativas e inativas
- **2.191 registros** na dimensão tempo (2020-2025)
- **18 transações** de venda (13 pedidos)

### 4.2 Métricas de Validação
- **Receita Total**: ~R$ 18.000,00
- **Margem Bruta**: ~R$ 5.500,00
- **Ticket Médio**: ~R$ 1.000,00
- **Produtos mais vendidos**: Smartphones e Notebooks
- **Melhor cliente**: Marcos Alves (Notebook Dell)

### 4.3 Performance Esperada
- **Consultas simples**: < 10ms
- **Consultas complexas**: < 50ms
- **Agregações**: < 100ms
- **Uso de índices**: Confirmado via EXPLAIN

## 5. Troubleshooting

### 5.1 Problemas Comuns

**Erro de conexão:**
```
ERROR 1045 (28000): Access denied for user 'root'@'localhost'
```
**Solução**: Verificar credenciais do MySQL

**Erro de banco não encontrado:**
```
ERROR 1049 (42000): Unknown database 'dw_ecommerce_test'
```
**Solução**: Criar o banco antes de executar os scripts

**Erro de chave estrangeira:**
```
ERROR 1452 (23000): Cannot add or update a child row
```
**Solução**: Executar scripts na ordem correta (dimensões antes da fato)

### 5.2 Verificações de Integridade

```sql
-- Verificar se todas as tabelas foram criadas
SHOW TABLES;

-- Verificar contagem de registros
SELECT 'DIM_TEMPO' as Tabela, COUNT(*) as Registros FROM DIM_TEMPO
UNION ALL SELECT 'DIM_CLIENTE', COUNT(*) FROM DIM_CLIENTE
UNION ALL SELECT 'DIM_PRODUTO', COUNT(*) FROM DIM_PRODUTO
UNION ALL SELECT 'FATO_VENDAS', COUNT(*) FROM FATO_VENDAS;

-- Verificar integridade referencial
SELECT COUNT(*) as Problemas_Integridade
FROM FATO_VENDAS f
LEFT JOIN DIM_TEMPO t ON f.sk_tempo = t.sk_tempo
WHERE t.sk_tempo IS NULL;
```

## 6. Extensões dos Testes

### 6.1 Testes com Mais Dados
Para testar com volume maior, execute:
```sql
-- Gerar mais dados sintéticos
CALL GerarDadosSinteticos(1000); -- 1000 transações adicionais
```

### 6.2 Testes de Stress
```sql
-- Teste de consulta pesada
SELECT * FROM FATO_VENDAS f
JOIN DIM_CLIENTE c ON f.sk_cliente = c.sk_cliente
JOIN DIM_PRODUTO p ON f.sk_produto = p.sk_produto
WHERE YEAR(STR_TO_DATE(f.sk_tempo, '%Y%m%d')) = 2024;
```

### 6.3 Monitoramento Contínuo
```sql
-- Verificar performance das consultas
SELECT * FROM performance_schema.events_statements_summary_by_digest
WHERE DIGEST_TEXT LIKE '%FATO_VENDAS%'
ORDER BY AVG_TIMER_WAIT DESC;
```