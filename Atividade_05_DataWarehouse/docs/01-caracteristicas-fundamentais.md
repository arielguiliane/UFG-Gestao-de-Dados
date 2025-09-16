# Características Fundamentais de um Data Warehouse

## 1. Definição e Conceitos Básicos

Um Data Warehouse (DW) é um repositório central de dados integrados de uma ou mais fontes díspares. É projetado especificamente para consulta e análise, não para processamento de transações online (OLTP).

## 2. Características Fundamentais (Inmon)

### 2.1 Orientado por Assunto (Subject-Oriented)
- **Definição**: Os dados são organizados em torno de temas de negócio específicos
- **Exemplo**: Vendas, Clientes, Produtos, Fornecedores
- **Diferença do OLTP**: Sistemas transacionais são orientados por aplicação

### 2.2 Integrado (Integrated)
- **Definição**: Dados de múltiplas fontes são consolidados em formato consistente
- **Aspectos**:
  - Padronização de nomenclaturas
  - Unificação de formatos de data
  - Conversão de unidades de medida
  - Resolução de conflitos de dados

### 2.3 Não-Volátil (Non-Volatile)
- **Definição**: Uma vez carregados, os dados não são alterados ou excluídos
- **Implicações**:
  - Dados históricos são preservados
  - Apenas operações de carga e consulta
  - Não há atualizações ou exclusões

### 2.4 Variante no Tempo (Time-Variant)
- **Definição**: Todos os dados possuem componente temporal
- **Características**:
  - Dados históricos são mantidos
  - Permite análise de tendências
  - Snapshots de dados em diferentes períodos

## 3. Arquitetura Conceitual

### 3.1 Camadas do Data Warehouse
1. **Camada de Fontes de Dados**
   - Sistemas OLTP
   - Arquivos externos
   - APIs e Web Services
   - Dados não estruturados

2. **Camada de Staging Area**
   - Área temporária para transformação
   - Limpeza e validação de dados
   - Aplicação de regras de negócio

3. **Camada de Data Warehouse**
   - Repositório central integrado
   - Modelo dimensional
   - Dados históricos consolidados

4. **Camada de Data Marts**
   - Subconjuntos especializados
   - Orientados por departamento
   - Otimizados para consultas específicas

5. **Camada de Apresentação**
   - Ferramentas de BI
   - Relatórios e dashboards
   - Análises ad-hoc

### 3.2 Processos ETL
- **Extract**: Extração de dados das fontes
- **Transform**: Transformação e limpeza
- **Load**: Carga no Data Warehouse

## 4. Benefícios do Data Warehouse

### 4.1 Para o Negócio
- Visão única e integrada dos dados
- Suporte à tomada de decisão
- Análises históricas e tendências
- Melhoria na qualidade dos dados

### 4.2 Técnicos
- Separação entre OLTP e OLAP
- Performance otimizada para consultas
- Escalabilidade
- Padronização de dados