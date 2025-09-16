-- =====================================================
-- Testes de Qualidade de Dados
-- =====================================================

-- 1. TESTE DE COMPLETUDE - Verificar valores nulos em campos obrigatórios
SELECT 'Teste de Completude - DIM_CLIENTE' as Teste;

SELECT
    'Clientes com nome nulo' as Problema,
    COUNT(*) as Quantidade
FROM DIM_CLIENTE
WHERE nome_cliente IS NULL OR nome_cliente = '';

SELECT
    'Clientes com segmento nulo' as Problema,
    COUNT(*) as Quantidade
FROM DIM_CLIENTE
WHERE segmento_cliente IS NULL OR segmento_cliente = '';

-- 2. TESTE DE CONSISTÊNCIA - Verificar dados inconsistentes
SELECT 'Teste de Consistência' as Teste;

SELECT
    'Produtos com preço negativo' as Problema,
    COUNT(*) as Quantidade
FROM DIM_PRODUTO
WHERE preco_sugerido < 0;

SELECT
    'Vendas com quantidade negativa' as Problema,
    COUNT(*) as Quantidade
FROM FATO_VENDAS
WHERE quantidade_vendida <= 0;

SELECT
    'Vendas com valor negativo' as Problema,
    COUNT(*) as Quantidade
FROM FATO_VENDAS
WHERE valor_total_item < 0;

-- 3. TESTE DE INTEGRIDADE REFERENCIAL
SELECT 'Teste de Integridade Referencial' as Teste;

SELECT
    'Vendas sem cliente válido' as Problema,
    COUNT(*) as Quantidade
FROM FATO_VENDAS f
LEFT JOIN DIM_CLIENTE c ON f.sk_cliente = c.sk_cliente
WHERE c.sk_cliente IS NULL;

SELECT
    'Vendas sem produto válido' as Problema,
    COUNT(*) as Quantidade
FROM FATO_VENDAS f
LEFT JOIN DIM_PRODUTO p ON f.sk_produto = p.sk_produto
WHERE p.sk_produto IS NULL;

SELECT
    'Vendas sem data válida' as Problema,
    COUNT(*) as Quantidade
FROM FATO_VENDAS f
LEFT JOIN DIM_TEMPO t ON f.sk_tempo = t.sk_tempo
WHERE t.sk_tempo IS NULL;

-- 4. TESTE DE DUPLICATAS
SELECT 'Teste de Duplicatas' as Teste;

SELECT
    'Clientes duplicados (mesmo email)' as Problema,
    COUNT(*) - COUNT(DISTINCT email) as Quantidade
FROM DIM_CLIENTE
WHERE email IS NOT NULL AND email != '';

SELECT
    'Produtos duplicados (mesmo código natural)' as Problema,
    COUNT(*) - COUNT(DISTINCT id_produto_natural) as Quantidade
FROM DIM_PRODUTO;
