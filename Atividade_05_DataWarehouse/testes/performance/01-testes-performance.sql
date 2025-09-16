-- =====================================================
-- Testes de Performance - Consultas Otimizadas
-- =====================================================

-- 1. TESTE DE PERFORMANCE - Consulta simples com índice
SELECT 'Teste 1: Consulta por data (usando índice)' as Teste;

SET @start_time = NOW(6);

SELECT
    COUNT(*) as total_vendas,
    SUM(valor_total_item) as receita_total
FROM FATO_VENDAS f
JOIN DIM_TEMPO t ON f.sk_tempo = t.sk_tempo
WHERE t.data_completa BETWEEN '2024-01-01' AND '2024-06-30';

SET @end_time = NOW(6);
SELECT CONCAT('Tempo de execução: ', TIMESTAMPDIFF(MICROSECOND, @start_time, @end_time) / 1000, ' ms') as Performance;

-- 2. TESTE DE PERFORMANCE - Consulta complexa com múltiplos JOINs
SELECT 'Teste 2: Consulta complexa com múltiplos JOINs' as Teste;

SET @start_time = NOW(6);

SELECT
    c.segmento_cliente,
    p.categoria_nivel1,
    cv.tipo_canal,
    COUNT(*) as total_transacoes,
    SUM(f.valor_total_item) as receita,
    AVG(f.valor_total_item) as ticket_medio
FROM FATO_VENDAS f
JOIN DIM_CLIENTE c ON f.sk_cliente = c.sk_cliente
JOIN DIM_PRODUTO p ON f.sk_produto = p.sk_produto
JOIN DIM_CANAL_VENDA cv ON f.sk_canal_venda = cv.sk_canal_venda
JOIN DIM_TEMPO t ON f.sk_tempo = t.sk_tempo
WHERE t.ano = 2024
GROUP BY c.segmento_cliente, p.categoria_nivel1, cv.tipo_canal
ORDER BY receita DESC;

SET @end_time = NOW(6);
SELECT CONCAT('Tempo de execução: ', TIMESTAMPDIFF(MICROSECOND, @start_time, @end_time) / 1000, ' ms') as Performance;

-- 3. TESTE DE PERFORMANCE - Agregação por período
SELECT 'Teste 3: Agregação mensal (usando índices temporais)' as Teste;

SET @start_time = NOW(6);

SELECT
    t.ano,
    t.mes,
    t.nome_mes,
    COUNT(DISTINCT f.id_pedido) as pedidos,
    SUM(f.quantidade_vendida) as quantidade,
    SUM(f.valor_total_item) as receita,
    SUM(f.margem_bruta) as margem
FROM FATO_VENDAS f
JOIN DIM_TEMPO t ON f.sk_tempo = t.sk_tempo
WHERE t.ano = 2024
GROUP BY t.ano, t.mes, t.nome_mes
ORDER BY t.ano, t.mes;

SET @end_time = NOW(6);
SELECT CONCAT('Tempo de execução: ', TIMESTAMPDIFF(MICROSECOND, @start_time, @end_time) / 1000, ' ms') as Performance;

-- 4. ANÁLISE DE PLANO DE EXECUÇÃO
SELECT 'Teste 4: Análise do plano de execução' as Teste;

EXPLAIN FORMAT=JSON
SELECT
    c.nome_cliente,
    p.nome_produto,
    SUM(f.valor_total_item) as receita_total
FROM FATO_VENDAS f
JOIN DIM_CLIENTE c ON f.sk_cliente = c.sk_cliente
JOIN DIM_PRODUTO p ON f.sk_produto = p.sk_produto
JOIN DIM_TEMPO t ON f.sk_tempo = t.sk_tempo
WHERE t.ano = 2024
  AND c.segmento_cliente = 'Premium'
GROUP BY c.sk_cliente, c.nome_cliente, p.sk_produto, p.nome_produto
ORDER BY receita_total DESC
LIMIT 10;
