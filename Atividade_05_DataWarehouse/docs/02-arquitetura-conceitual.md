# Arquitetura Conceitual - Data Warehouse E-commerce

## 1. Domínio de Negócio Escolhido: E-commerce

### 1.1 Justificativa da Escolha
- **Complexidade adequada**: Múltiplas entidades e relacionamentos
- **Dados variados**: Transacionais, comportamentais, geográficos
- **Métricas claras**: Vendas, conversão, satisfação do cliente
- **Fontes diversas**: Sistema de vendas, CRM, logística, marketing

### 1.2 Objetivos de Negócio
- Análise de performance de vendas
- Comportamento do cliente
- Eficiência operacional
- Análise de produtos e categorias
- Tendências de mercado

## 2. Identificação das Fontes de Dados

### 2.1 Sistemas Transacionais (OLTP)
1. **Sistema de Vendas**
   - Pedidos e itens
   - Pagamentos
   - Status de entrega

2. **Sistema de CRM**
   - Dados de clientes
   - Histórico de interações
   - Segmentação

3. **Sistema de Estoque**
   - Produtos e categorias
   - Níveis de estoque
   - Fornecedores

4. **Sistema de Logística**
   - Entregas
   - Transportadoras
   - Custos de frete

### 2.2 Fontes Externas
1. **APIs Públicas**
   - Dados econômicos (inflação, PIB)
   - Dados demográficos
   - Cotações de moeda

2. **Dados de Marketing**
   - Campanhas publicitárias
   - Métricas de redes sociais
   - Analytics web

## 3. Assuntos de Negócio (Subject Areas)

### 3.1 Vendas
- **Foco**: Transações de venda e performance
- **Métricas**: Receita, quantidade vendida, ticket médio
- **Dimensões**: Tempo, Cliente, Produto, Canal

### 3.2 Clientes
- **Foco**: Comportamento e perfil dos clientes
- **Métricas**: Lifetime value, frequência de compra, churn
- **Dimensões**: Demografia, Geografia, Segmento

### 3.3 Produtos
- **Foco**: Performance e características dos produtos
- **Métricas**: Margem, giro de estoque, popularidade
- **Dimensões**: Categoria, Fornecedor, Marca

### 3.4 Logística
- **Foco**: Eficiência operacional e custos
- **Métricas**: Tempo de entrega, custo de frete, taxa de devolução
- **Dimensões**: Região, Transportadora, Tipo de entrega

## 4. Requisitos de Negócio

### 4.1 Perguntas de Negócio a Responder
1. **Vendas**
   - Qual a evolução das vendas por período?
   - Quais produtos têm melhor performance?
   - Qual o impacto das promoções nas vendas?

2. **Clientes**
   - Qual o perfil dos melhores clientes?
   - Como está a retenção de clientes?
   - Quais segmentos são mais lucrativos?

3. **Produtos**
   - Quais produtos têm maior margem?
   - Como está o giro de estoque?
   - Quais categorias crescem mais?

4. **Operacional**
   - Qual a eficiência da logística?
   - Onde estão os gargalos operacionais?
   - Como otimizar custos de entrega?