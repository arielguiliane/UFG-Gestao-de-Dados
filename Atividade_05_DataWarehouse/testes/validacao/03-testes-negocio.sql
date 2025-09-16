-- =====================================================
-- Testes de Negócio - Validação de Métricas e KPIs
-- =====================================================

-- 1. TESTE DE MÉTRICAS BÁSICAS
SELECT 'Métricas Básicas de Vendas' as Teste;

SELECT
    'Receita Total' as Métrica,
    CONCAT('R$ ', FORMAT(SUM(valor_total_item), 2)) as Valor
FROM FATO_VENDAS

UNION ALL

SELECT
    'Margem Bruta Total',
    CONCAT('R$ ', FORMAT(SUM(margem_bruta), 2))
FROM FATO_VENDAS

UNION ALL

SELECT
    'Percentual de Margem Média',
    CONCAT(FORMAT((SUM(margem_bruta) / SUM(valor_total_item)) * 100, 2), '%')
FROM FATO_VENDAS

UNION ALL

SELECT
    'Ticket Médio',
    CONCAT('R$ ', FORMAT(AVG(valor_total_item), 2))
FROM FATO_VENDAS

UNION ALL

SELECT
    'Quantidade Total Vendida',
    FORMAT(SUM(quantidade_vendida), 0)
FROM FATO_VENDAS;

-- 2. ANÁLISE POR PERÍODO
SELECT 'Vendas por Mês - 2024' as Teste;

SELECT
    t.nome_mes as Mês,
    COUNT(DISTINCT f.id_pedido) as Total_Pedidos,
    SUM(f.quantidade_vendida) as Qtd_Vendida,
    CONCAT('R$ ', FORMAT(SUM(f.valor_total_item), 2)) as Receita,
    CONCAT('R$ ', FORMAT(AVG(f.valor_total_item), 2)) as Ticket_Médio
FROM FATO_VENDAS f
JOIN DIM_TEMPO t ON f.sk_tempo = t.sk_tempo
WHERE t.ano = 2024
GROUP BY t.mes, t.nome_mes
ORDER BY t.mes;

-- 3. ANÁLISE POR CLIENTE
SELECT 'Top 5 Clientes por Receita' as Teste;

SELECT
    c.nome_cliente as Cliente,
    c.segmento_cliente as Segmento,
    c.cidade as Cidade,
    COUNT(DISTINCT f.id_pedido) as Total_Pedidos,
    CONCAT('R$ ', FORMAT(SUM(f.valor_total_item), 2)) as Receita_Total
FROM FATO_VENDAS f
JOIN DIM_CLIENTE c ON f.sk_cliente = c.sk_cliente
GROUP BY c.sk_cliente, c.nome_cliente, c.segmento_cliente, c.cidade
ORDER BY SUM(f.valor_total_item) DESC
LIMIT 5;

-- 4. ANÁLISE POR PRODUTO
SELECT 'Top 5 Produtos por Receita' as Teste;

SELECT
    p.nome_produto as Produto,
    p.categoria_nivel1 as Categoria,
    p.marca as Marca,
    SUM(f.quantidade_vendida) as Qtd_Vendida,
    CONCAT('R$ ', FORMAT(SUM(f.valor_total_item), 2)) as Receita,
    CONCAT(FORMAT((SUM(f.margem_bruta) / SUM(f.valor_total_item)) * 100, 1), '%') as Margem_Perc
FROM FATO_VENDAS f
JOIN DIM_PRODUTO p ON f.sk_produto = p.sk_produto
GROUP BY p.sk_produto, p.nome_produto, p.categoria_nivel1, p.marca
ORDER BY SUM(f.valor_total_item) DESC
LIMIT 5;
