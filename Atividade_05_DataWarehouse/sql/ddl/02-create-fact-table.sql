-- =====================================================
-- Data Warehouse E-commerce - Criação da Tabela Fato
-- =====================================================

-- Tabela Fato Vendas
CREATE TABLE FATO_VENDAS (
    -- Chaves Estrangeiras (Dimensões)
    sk_tempo INTEGER NOT NULL,
    sk_cliente INTEGER NOT NULL,
    sk_produto INTEGER NOT NULL,
    sk_canal_venda INTEGER NOT NULL,
    sk_promocao INTEGER NOT NULL,

    -- Chaves de Negócio para Auditoria
    id_pedido VARCHAR(50) NOT NULL,
    numero_item INTEGER NOT NULL,

    -- Medidas (Fatos)
    quantidade_vendida INTEGER NOT NULL DEFAULT 0,
    valor_unitario DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    valor_total_item DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    custo_produto DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    margem_bruta DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    desconto_aplicado DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    peso_item DECIMAL(8,3) NOT NULL DEFAULT 0.000,

    -- Metadados de Controle
    data_carga TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    origem_sistema VARCHAR(50) DEFAULT 'SISTEMA_VENDAS',

    -- Chave Primária Composta
    PRIMARY KEY (sk_tempo, sk_cliente, sk_produto, sk_canal_venda, id_pedido, numero_item),

    -- Chaves Estrangeiras
    FOREIGN KEY (sk_tempo) REFERENCES DIM_TEMPO(sk_tempo),
    FOREIGN KEY (sk_cliente) REFERENCES DIM_CLIENTE(sk_cliente),
    FOREIGN KEY (sk_produto) REFERENCES DIM_PRODUTO(sk_produto),
    FOREIGN KEY (sk_canal_venda) REFERENCES DIM_CANAL_VENDA(sk_canal_venda),
    FOREIGN KEY (sk_promocao) REFERENCES DIM_PROMOCAO(sk_promocao),

    -- Índices para Performance
    INDEX idx_tempo (sk_tempo),
    INDEX idx_cliente (sk_cliente),
    INDEX idx_produto (sk_produto),
    INDEX idx_canal (sk_canal_venda),
    INDEX idx_pedido (id_pedido),
    INDEX idx_data_carga (data_carga),

    -- Índices Compostos para Consultas Comuns
    INDEX idx_tempo_cliente (sk_tempo, sk_cliente),
    INDEX idx_tempo_produto (sk_tempo, sk_produto),
    INDEX idx_cliente_produto (sk_cliente, sk_produto)
);
