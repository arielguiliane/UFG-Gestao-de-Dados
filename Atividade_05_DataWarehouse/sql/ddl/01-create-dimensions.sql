-- =====================================================
-- Data Warehouse E-commerce - Criação das Dimensões
-- =====================================================

-- Dimensão Tempo
CREATE TABLE DIM_TEMPO (
    sk_tempo INTEGER PRIMARY KEY,
    data_completa DATE NOT NULL,
    ano INTEGER NOT NULL,
    mes INTEGER NOT NULL,
    dia INTEGER NOT NULL,
    trimestre INTEGER NOT NULL,
    semestre INTEGER NOT NULL,
    dia_semana VARCHAR(20) NOT NULL,
    nome_mes VARCHAR(20) NOT NULL,
    eh_feriado BOOLEAN DEFAULT FALSE,
    eh_fim_semana BOOLEAN DEFAULT FALSE,

    -- Índices para performance
    INDEX idx_data_completa (data_completa),
    INDEX idx_ano_mes (ano, mes),
    INDEX idx_trimestre (ano, trimestre)
);

-- Dimensão Cliente (SCD Tipo 2)
CREATE TABLE DIM_CLIENTE (
    sk_cliente INTEGER PRIMARY KEY AUTO_INCREMENT,
    id_cliente_natural VARCHAR(50) NOT NULL,
    nome_cliente VARCHAR(200) NOT NULL,
    email VARCHAR(200),
    telefone VARCHAR(20),
    data_nascimento DATE,
    genero VARCHAR(10),
    estado_civil VARCHAR(20),
    profissao VARCHAR(100),
    renda_estimada DECIMAL(12,2),
    segmento_cliente VARCHAR(50),
    cidade VARCHAR(100),
    estado VARCHAR(50),
    cep VARCHAR(10),
    data_inicio_vigencia DATE NOT NULL,
    data_fim_vigencia DATE,
    registro_ativo BOOLEAN DEFAULT TRUE,

    -- Índices para performance
    INDEX idx_cliente_natural (id_cliente_natural),
    INDEX idx_vigencia (data_inicio_vigencia, data_fim_vigencia),
    INDEX idx_ativo (registro_ativo),
    INDEX idx_segmento (segmento_cliente)
);

-- Dimensão Produto (SCD Tipo 1)
CREATE TABLE DIM_PRODUTO (
    sk_produto INTEGER PRIMARY KEY AUTO_INCREMENT,
    id_produto_natural VARCHAR(50) NOT NULL UNIQUE,
    nome_produto VARCHAR(300) NOT NULL,
    descricao_produto TEXT,
    categoria_nivel1 VARCHAR(100),
    categoria_nivel2 VARCHAR(100),
    categoria_nivel3 VARCHAR(100),
    marca VARCHAR(100),
    fornecedor VARCHAR(200),
    cor VARCHAR(50),
    tamanho VARCHAR(50),
    peso DECIMAL(8,3),
    preco_sugerido DECIMAL(10,2),
    status_produto VARCHAR(20) DEFAULT 'ATIVO',

    -- Índices para performance
    INDEX idx_produto_natural (id_produto_natural),
    INDEX idx_categoria1 (categoria_nivel1),
    INDEX idx_marca (marca),
    INDEX idx_status (status_produto)
);

-- Dimensão Canal de Venda
CREATE TABLE DIM_CANAL_VENDA (
    sk_canal_venda INTEGER PRIMARY KEY AUTO_INCREMENT,
    id_canal_natural VARCHAR(20) NOT NULL UNIQUE,
    nome_canal VARCHAR(100) NOT NULL,
    tipo_canal VARCHAR(50) NOT NULL,
    descricao_canal TEXT,
    comissao_canal DECIMAL(5,2),

    -- Índices para performance
    INDEX idx_canal_natural (id_canal_natural),
    INDEX idx_tipo_canal (tipo_canal)
);

-- Dimensão Promoção
CREATE TABLE DIM_PROMOCAO (
    sk_promocao INTEGER PRIMARY KEY AUTO_INCREMENT,
    id_promocao_natural VARCHAR(50) NOT NULL UNIQUE,
    nome_promocao VARCHAR(200) NOT NULL,
    tipo_promocao VARCHAR(50),
    percentual_desconto DECIMAL(5,2),
    valor_desconto DECIMAL(10,2),
    data_inicio DATE,
    data_fim DATE,
    status_promocao VARCHAR(20) DEFAULT 'ATIVA',

    -- Índices para performance
    INDEX idx_promocao_natural (id_promocao_natural),
    INDEX idx_periodo (data_inicio, data_fim),
    INDEX idx_status_promocao (status_promocao)
);