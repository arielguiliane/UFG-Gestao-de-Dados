-- =====================================================
-- Consultas de Exemplo - Data Warehouse E-commerce
-- =====================================================

-- 1. ANÁLISE DE VENDAS POR PERÍODO
-- Receita mensal dos últimos 12 meses
SELECT
    t.ano,
    t.mes,
    t.nome_mes,
    SUM(f.valor_total_item) as receita_total,
    SUM(f.quantidade_vendida) as quantidade_total,
    COUNT(DISTINCT f.id_pedido) as total_pedidos,
    AVG(f.valor_total_item) as ticket_medio
FROM FATO_VENDAS f
JOIN DIM_TEMPO t ON f.sk_tempo = t.sk_tempo
WHERE t.data_completa >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
GROUP BY t.ano, t.mes, t.nome_mes
ORDER BY t.ano DESC, t.mes DESC;

-- 2. TOP 10 PRODUTOS POR RECEITA
-- Produtos com maior faturamento no último trimestre
SELECT
    p.nome_produto,
    p.categoria_nivel1,
    p.marca,
    SUM(f.valor_total_item) as receita_total,
    SUM(f.quantidade_vendida) as quantidade_vendida,
    SUM(f.margem_bruta) as margem_total,
    ROUND((SUM(f.margem_bruta) / SUM(f.valor_total_item)) * 100, 2) as percentual_margem
FROM FATO_VENDAS f
JOIN DIM_PRODUTO p ON f.sk_produto = p.sk_produto
JOIN DIM_TEMPO t ON f.sk_tempo = t.sk_tempo
WHERE t.data_completa >= DATE_SUB(CURDATE(), INTERVAL 3 MONTH)
GROUP BY p.sk_produto, p.nome_produto, p.categoria_nivel1, p.marca
ORDER BY receita_total DESC
LIMIT 10;

-- 3. ANÁLISE DE CLIENTES
-- Segmentação de clientes por valor
SELECT
    c.segmento_cliente,
    c.estado,
    COUNT(DISTINCT c.sk_cliente) as total_clientes,
    SUM(f.valor_total_item) as receita_total,
    AVG(f.valor_total_item) as ticket_medio,
    COUNT(f.id_pedido) as total_compras,
    ROUND(COUNT(f.id_pedido) / COUNT(DISTINCT c.sk_cliente), 2) as frequencia_compra
FROM FATO_VENDAS f
JOIN DIM_CLIENTE c ON f.sk_cliente = c.sk_cliente
JOIN DIM_TEMPO t ON f.sk_tempo = t.sk_tempo
WHERE t.data_completa >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
  AND c.registro_ativo = TRUE
GROUP BY c.segmento_cliente, c.estado
ORDER BY receita_total DESC;
