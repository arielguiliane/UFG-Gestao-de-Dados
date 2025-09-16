# Arquitetura Técnica e Processos ETL

## 1. Arquitetura Geral do Data Warehouse

### 1.1 Visão Geral da Arquitetura

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   FONTES DE     │    │   STAGING       │    │   DATA          │
│     DADOS       │───▶│     AREA        │───▶│   WAREHOUSE     │
│                 │    │                 │    │                 │
│ • Sistema Vendas│    │ • Transformação │    │ • Modelo        │
│ • CRM           │    │ • Limpeza       │    │   Dimensional   │
│ • Estoque       │    │ • Validação     │    │ • Dados         │
│ • APIs Externas │    │ • Padronização  │    │   Históricos    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                                        │
                                               ┌─────────────────┐
                                               │   CAMADA DE     │
                                               │  APRESENTAÇÃO   │
                                               │                 │
                                               │ • Data Marts    │
                                               │ • Relatórios    │
                                               │ • Dashboards    │
                                               │ • Analytics     │
                                               └─────────────────┘
```

### 1.2 Componentes da Arquitetura

#### 1.2.1 Camada de Fontes de Dados
- **Sistemas OLTP**: Bancos transacionais (MySQL, PostgreSQL)
- **Arquivos**: CSV, Excel, XML, JSON
- **APIs**: REST APIs, Web Services
- **Dados Externos**: APIs públicas, feeds de dados

#### 1.2.2 Camada de Staging
- **Propósito**: Área temporária para processamento
- **Tecnologia**: Banco relacional (mesmo SGBD do DW)
- **Estrutura**: Tabelas temporárias espelhando fontes
- **Retenção**: Dados mantidos por período limitado

#### 1.2.3 Camada do Data Warehouse
- **Tecnologia**: MySQL/PostgreSQL/SQL Server
- **Modelo**: Dimensional (Star Schema)
- **Particionamento**: Por data para performance
- **Backup**: Estratégia de backup incremental

#### 1.2.4 Camada de Apresentação
- **Data Marts**: Subconjuntos especializados
- **Ferramentas BI**: Power BI, Tableau, Looker
- **Relatórios**: Crystal Reports, SSRS
- **Analytics**: Python/R para análises avançadas

## 2. Processos ETL (Extract, Transform, Load)

### 2.1 Estratégia Geral de ETL

#### 2.1.1 Frequência de Execução
- **Dados Transacionais**: Diário (batch noturno)
- **Dados de Estoque**: Diário
- **Dados de CRM**: Semanal
- **APIs Externas**: Conforme disponibilidade

#### 2.1.2 Janela de Processamento
- **Horário**: 02:00 às 06:00 (madrugada)
- **Duração Estimada**: 2-3 horas
- **Contingência**: Processo de recuperação automática

### 2.2 Processo de Extração (Extract)

#### 2.2.1 Fontes de Dados e Métodos
1. **Sistema de Vendas (MySQL)**
   - Método: Query incremental baseada em timestamp
   - Tabelas: pedidos, itens_pedido, pagamentos
   - Filtro: data_modificacao >= última_execução

2. **Sistema CRM (PostgreSQL)**
   - Método: Full load semanal
   - Tabelas: clientes, interacoes, segmentacao
   - Estratégia: Snapshot completo

3. **Sistema de Estoque (SQL Server)**
   - Método: Change Data Capture (CDC)
   - Tabelas: produtos, categorias, fornecedores
   - Monitoramento: Log de transações

4. **APIs Externas**
   - Método: REST API calls
   - Formato: JSON
   - Autenticação: API Keys/OAuth

#### 2.2.2 Controle de Qualidade na Extração
- Validação de conectividade
- Verificação de integridade dos dados
- Log de registros extraídos
- Alertas em caso de falha

### 2.3 Processo de Transformação (Transform)

#### 2.3.1 Regras de Transformação

**Padronização de Dados**:
- Conversão de encoding (UTF-8)
- Padronização de formatos de data
- Normalização de strings (trim, case)
- Conversão de tipos de dados

**Limpeza de Dados**:
- Remoção de duplicatas
- Tratamento de valores nulos
- Validação de domínios
- Correção de inconsistências

**Enriquecimento de Dados**:
- Cálculo de campos derivados
- Classificação de clientes
- Categorização de produtos
- Geocodificação de endereços