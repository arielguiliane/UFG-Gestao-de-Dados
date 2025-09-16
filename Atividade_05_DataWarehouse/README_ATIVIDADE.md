# 📊 Atividade 05 - Data Warehouse E-commerce

## 🎯 Objetivo da Atividade
Desenvolver uma proposta completa de Data Warehouse seguindo as características fundamentais e implementando uma solução estruturada para análise de dados de e-commerce.

## ✅ Características Fundamentais Implementadas

### 🎯 Subject-Oriented (Orientado por Assunto)
- **Domínio**: E-commerce
- **Assuntos**: Vendas, Clientes, Produtos, Canais, Promoções

### 🔗 Integrated (Integrado)
- **Fontes**: Sistemas OLTP, APIs externas, Arquivos CSV
- **Padronização**: Formatos, códigos e nomenclaturas unificadas

### 🔒 Non-Volatile (Não-Volátil)
- **Histórico**: Dados preservados com versionamento
- **SCD**: Slowly Changing Dimensions implementadas

### ⏰ Time-Variant (Variante no Tempo)
- **Dimensão Tempo**: 2020-2025 (2.192 registros)
- **Granularidade**: Diária com hierarquias

## 🏛️ Arquitetura Implementada

### 📊 Modelo Dimensional (Star Schema)
- **5 Dimensões**: Tempo, Cliente, Produto, Canal, Promoção
- **1 Tabela Fato**: Vendas
- **Chaves Surrogate**: Implementadas em todas as dimensões

### 🔍 Métricas e KPIs
- **Receita Total**: R$ 15.270,72
- **Margem Bruta**: R$ 4.510,72
- **Total de Pedidos**: 13
- **Ticket Médio**: R$ 1.174,67

## 🚀 Como Executar

### ⚡ Execução Rápida
```bash
# 1. Configurar MySQL
mysql -u root -p -e "CREATE DATABASE dw_ecommerce_test;"

# 2. Executar scripts
mysql -u root -p dw_ecommerce_test < sql/ddl/01-create-dimensions.sql
mysql -u root -p dw_ecommerce_test < sql/ddl/02-create-fact-table.sql
mysql -u root -p dw_ecommerce_test < sql/etl/01-load-dim-tempo.sql
mysql -u root -p dw_ecommerce_test < testes/dados/01-popular-dimensoes.sql
mysql -u root -p dw_ecommerce_test < testes/dados/02-popular-fato-vendas.sql

# 3. Abrir dashboard
open dashboard/dashboard.html
```

## 🛠️ Tecnologias Utilizadas
- **MySQL**: Banco de dados principal
- **HTML5/CSS3/JavaScript**: Interface web
- **Chart.js**: Gráficos interativos
- **Git/GitHub**: Controle de versão

## 📊 Resultados Obtidos
- **6 tabelas** criadas e populadas
- **2.200+ registros** carregados
- **Dashboard interativo** funcional
- **Testes automatizados** validados

## 👨‍🎓 Autor
**Ariel Guiliane** - UFG - Gestão de Dados - 2025
