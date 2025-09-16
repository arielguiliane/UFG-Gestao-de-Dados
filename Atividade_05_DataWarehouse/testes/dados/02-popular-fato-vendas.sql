-- =====================================================
-- Dados de Teste - Popular Tabela Fato Vendas
-- =====================================================

-- Popular FATO_VENDAS com dados sintéticos
INSERT INTO FATO_VENDAS (
    sk_tempo, sk_cliente, sk_produto, sk_canal_venda, sk_promocao,
    id_pedido, numero_item, quantidade_vendida, valor_unitario, valor_total_item,
    custo_produto, margem_bruta, desconto_aplicado, peso_item
) VALUES
-- Pedido 1 - João Silva - Janeiro 2024
(20240115, 1, 1, 1, 1, 'PED001', 1, 1, 2499.99, 2499.99, 1800.00, 699.99, 0.00, 0.168),
(20240115, 1, 6, 1, 1, 'PED001', 2, 1, 199.99, 199.99, 120.00, 79.99, 0.00, 0.160),

-- Pedido 2 - Maria Santos - Janeiro 2024 (Black Friday)
(20240120, 2, 2, 2, 2, 'PED002', 1, 1, 3299.99, 2309.99, 2200.00, 109.99, 990.00, 1.850),
(20240120, 2, 9, 2, 2, 'PED002', 2, 1, 449.99, 314.99, 280.00, 34.99, 135.00, 0.141),

-- Pedido 3 - Pedro Oliveira - Fevereiro 2024
(20240205, 3, 5, 3, 1, 'PED003', 1, 2, 89.90, 179.80, 60.00, 119.80, 0.00, 1.000),
(20240205, 3, 8, 3, 1, 'PED003', 2, 1, 149.99, 149.99, 90.00, 59.99, 0.00, 0.400),

-- Pedido 4 - Ana Costa - Fevereiro 2024
(20240210, 4, 3, 4, 5, 'PED004', 1, 3, 89.99, 169.97, 45.00, 124.97, 100.00, 0.600),
(20240210, 4, 4, 4, 5, 'PED004', 2, 1, 699.99, 599.99, 420.00, 179.99, 100.00, 0.350),

-- Pedido 5 - Carlos Ferreira - Março 2024
(20240315, 5, 7, 1, 1, 'PED005', 1, 1, 299.99, 299.99, 180.00, 119.99, 0.00, 2.300),
(20240315, 5, 10, 1, 1, 'PED005', 2, 2, 159.90, 319.80, 95.00, 224.80, 0.00, 0.600),

-- Pedido 6 - Lucia Mendes - Março 2024
(20240320, 6, 3, 5, 1, 'PED006', 1, 1, 89.99, 89.99, 45.00, 44.99, 0.00, 0.200),
(20240320, 6, 8, 5, 1, 'PED006', 2, 1, 149.99, 149.99, 90.00, 59.99, 0.00, 0.400),

-- Pedido 7 - Roberto Lima - Abril 2024
(20240410, 7, 1, 2, 1, 'PED007', 1, 1, 2499.99, 2499.99, 1800.00, 699.99, 0.00, 0.168),

-- Pedido 8 - Fernanda Rocha - Abril 2024
(20240415, 8, 6, 4, 1, 'PED008', 1, 1, 199.99, 199.99, 120.00, 79.99, 0.00, 0.160),
(20240415, 8, 9, 4, 1, 'PED008', 2, 1, 449.99, 449.99, 280.00, 169.99, 0.00, 0.141),

-- Pedido 9 - Marcos Alves - Maio 2024
(20240505, 9, 2, 1, 1, 'PED009', 1, 1, 3299.99, 3299.99, 2200.00, 1099.99, 0.00, 1.850),

-- Pedido 10 - Juliana Barbosa - Maio 2024
(20240510, 10, 4, 3, 1, 'PED010', 1, 1, 699.99, 699.99, 420.00, 279.99, 0.00, 0.350),
(20240510, 10, 7, 3, 1, 'PED010', 2, 1, 299.99, 299.99, 180.00, 119.99, 0.00, 2.300),

-- Pedidos adicionais para ter mais dados de teste
-- Junho 2024
(20240615, 1, 5, 1, 3, 'PED011', 1, 1, 89.90, 76.42, 60.00, 16.42, 13.48, 0.500),
(20240620, 2, 8, 2, 1, 'PED012', 1, 2, 149.99, 299.98, 180.00, 119.98, 0.00, 0.800),
(20240625, 3, 10, 4, 1, 'PED013', 1, 1, 159.90, 159.90, 95.00, 64.90, 0.00, 0.300);

-- Verificar dados inseridos na tabela fato
SELECT
    'Total de registros na FATO_VENDAS:' as Descrição,
    COUNT(*) as Quantidade
FROM FATO_VENDAS

UNION ALL

SELECT
    'Total de pedidos únicos:',
    COUNT(DISTINCT id_pedido)
FROM FATO_VENDAS

UNION ALL

SELECT
    'Receita total:',
    ROUND(SUM(valor_total_item), 2)
FROM FATO_VENDAS

UNION ALL

SELECT
    'Margem total:',
    ROUND(SUM(margem_bruta), 2)
FROM FATO_VENDAS;

-- Verificar integridade referencial
SELECT
    'Registros com problemas de integridade:' as Verificação,
    COUNT(*) as Problemas
FROM FATO_VENDAS f
LEFT JOIN DIM_TEMPO t ON f.sk_tempo = t.sk_tempo
LEFT JOIN DIM_CLIENTE c ON f.sk_cliente = c.sk_cliente
LEFT JOIN DIM_PRODUTO p ON f.sk_produto = p.sk_produto
LEFT JOIN DIM_CANAL_VENDA cv ON f.sk_canal_venda = cv.sk_canal_venda
LEFT JOIN DIM_PROMOCAO pr ON f.sk_promocao = pr.sk_promocao
WHERE t.sk_tempo IS NULL
   OR c.sk_cliente IS NULL
   OR p.sk_produto IS NULL
   OR cv.sk_canal_venda IS NULL
   OR pr.sk_promocao IS NULL;