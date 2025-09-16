# Modelagem Dimensional - Data Warehouse E-commerce

## 1. Conceitos de Modelagem Dimensional

### 1.1 Modelo Estrela (Star Schema)
- **Estrutura**: Uma tabela fato central conectada a tabelas dimensão
- **Vantagens**: Simplicidade, performance de consulta, facilidade de entendimento
- **Uso**: Recomendado para a maioria dos casos

### 1.2 Tabelas Fato
- **Definição**: Contêm métricas quantitativas do negócio
- **Características**:
  - Chaves estrangeiras para dimensões
  - Medidas numéricas (fatos)
  - Granularidade específica
  - Grande volume de dados

### 1.3 Tabelas Dimensão
- **Definição**: Contêm atributos descritivos para análise
- **Características**:
  - Chave primária (surrogate key)
  - Atributos descritivos
  - Relativamente pequenas
  - Desnormalizadas

## 2. Identificação de Fatos e Dimensões

### 2.1 Processo de Negócio Principal: Vendas

#### Tabela Fato: FATO_VENDAS
**Granularidade**: Uma linha por item de pedido

**Medidas (Fatos)**:
- quantidade_vendida (INTEGER)
- valor_unitario (DECIMAL)
- valor_total_item (DECIMAL)
- custo_produto (DECIMAL)
- margem_bruta (DECIMAL)
- desconto_aplicado (DECIMAL)
- peso_item (DECIMAL)

**Chaves Estrangeiras**:
- sk_tempo (Surrogate Key para dimensão tempo)
- sk_cliente (Surrogate Key para dimensão cliente)
- sk_produto (Surrogate Key para dimensão produto)
- sk_canal_venda (Surrogate Key para dimensão canal)
- sk_promocao (Surrogate Key para dimensão promoção)

## 3. Especificação das Dimensões

### 3.1 Dimensão Tempo (DIM_TEMPO)
**Tipo**: Dimensão conformada
**Granularidade**: Dia

**Atributos**:
- sk_tempo (PK) - Surrogate Key
- data_completa (DATE)
- ano (INTEGER)
- mes (INTEGER)
- dia (INTEGER)
- trimestre (INTEGER)
- semestre (INTEGER)
- dia_semana (VARCHAR)
- nome_mes (VARCHAR)
- eh_feriado (BOOLEAN)
- eh_fim_semana (BOOLEAN)

### 3.2 Dimensão Cliente (DIM_CLIENTE)
**Tipo**: Dimensão que muda lentamente (SCD Tipo 2)

**Atributos**:
- sk_cliente (PK) - Surrogate Key
- id_cliente_natural (VARCHAR) - Business Key
- nome_cliente (VARCHAR)
- email (VARCHAR)
- telefone (VARCHAR)
- data_nascimento (DATE)
- genero (VARCHAR)
- estado_civil (VARCHAR)
- profissao (VARCHAR)
- renda_estimada (DECIMAL)
- segmento_cliente (VARCHAR)
- cidade (VARCHAR)
- estado (VARCHAR)
- cep (VARCHAR)
- data_inicio_vigencia (DATE)
- data_fim_vigencia (DATE)
- registro_ativo (BOOLEAN)

### 3.3 Dimensão Produto (DIM_PRODUTO)
**Tipo**: Dimensão que muda lentamente (SCD Tipo 1)

**Atributos**:
- sk_produto (PK) - Surrogate Key
- id_produto_natural (VARCHAR) - Business Key
- nome_produto (VARCHAR)
- descricao_produto (TEXT)
- categoria_nivel1 (VARCHAR)
- categoria_nivel2 (VARCHAR)
- categoria_nivel3 (VARCHAR)
- marca (VARCHAR)
- fornecedor (VARCHAR)
- cor (VARCHAR)
- tamanho (VARCHAR)
- peso (DECIMAL)
- preco_sugerido (DECIMAL)
- status_produto (VARCHAR)
### 3.4 Dimensão Canal de Venda (DIM_CANAL_VENDA)
**Tipo**: Dimensão estática

**Atributos**:
- sk_canal_venda (PK) - Surrogate Key
- id_canal_natural (VARCHAR) - Business Key
- nome_canal (VARCHAR)
- tipo_canal (VARCHAR) - Online, Loja Física, Mobile App
- descricao_canal (TEXT)
- comissao_canal (DECIMAL)

### 3.5 Dimensão Promoção (DIM_PROMOCAO)
**Tipo**: Dimensão que muda lentamente (SCD Tipo 1)

**Atributos**:
- sk_promocao (PK) - Surrogate Key
- id_promocao_natural (VARCHAR) - Business Key
- nome_promocao (VARCHAR)
- tipo_promocao (VARCHAR)
- percentual_desconto (DECIMAL)
- valor_desconto (DECIMAL)
- data_inicio (DATE)
- data_fim (DATE)
- status_promocao (VARCHAR)

## 4. Métricas e KPIs

### 4.1 Métricas Básicas
- **Receita Total**: SUM(valor_total_item)
- **Quantidade Vendida**: SUM(quantidade_vendida)
- **Ticket Médio**: AVG(valor_total_item)
- **Margem Bruta**: SUM(margem_bruta)
- **Percentual de Margem**: (SUM(margem_bruta) / SUM(valor_total_item)) * 100

### 4.2 KPIs de Vendas
- **Crescimento de Vendas**: Comparação período atual vs anterior
- **Vendas por Canal**: Distribuição de receita por canal
- **Top Produtos**: Produtos com maior receita/quantidade
- **Sazonalidade**: Padrões de venda por período

### 4.3 KPIs de Cliente
- **Novos Clientes**: Contagem de primeiras compras
- **Clientes Recorrentes**: Clientes com múltiplas compras
- **Valor Médio por Cliente**: Receita total / número de clientes únicos
- **Frequência de Compra**: Número médio de pedidos por cliente

## 5. Modelo Estrela - Diagrama Conceitual

```
        DIM_TEMPO
            |
            |
DIM_CLIENTE --- FATO_VENDAS --- DIM_PRODUTO
            |
            |
    DIM_CANAL_VENDA
            |
            |
      DIM_PROMOCAO
```