# 🎬 Exercício 1 - Gestão do Ciclo de Vida de Dados

## 🎯 Objetivo
Implementar uma aplicação completa que demonstre todas as **5 fases do ciclo de vida dos dados**:
1. **Coleta** - Importação de dados de filmes
2. **Armazenamento** - Estruturação em banco SQLite
3. **Processamento** - Limpeza e transformação
4. **Uso** - Geração de relatórios e consultas
5. **Retenção/Descarte** - Políticas de backup e arquivamento

## 📁 Arquivos do Exercício 1

### 🐍 **Código Principal**
- **`data_lifecycle_app.py`** - Aplicação principal (5 fases implementadas)
- **`database_structure.sql`** - Estrutura do banco de dados
- **`demo_consultas.py`** - Demonstração de consultas SQL

### 📊 **Dados**
- **`movies.csv`** - Dataset original de filmes
- **`movies.db`** - Banco SQLite gerado

### 📋 **Relatórios Gerados**
- **`relatorios_filmes_*.json`** - Relatórios analíticos
- **`backup_movies_*.sql`** - Backup do banco
- **`data_lifecycle.log`** - Log de execução

## 🚀 Como Executar

### Pré-requisitos
```bash
pip install pandas sqlite3
```

### Execução
```bash
python3 data_lifecycle_app.py
```

### Demonstração de Consultas
```bash
python3 demo_consultas.py
```

## 📊 Resultados Obtidos

### ✅ **Dados Processados**
- **4.803 filmes** importados
- **4.551 registros** válidos após limpeza
- **22 gêneros** únicos catalogados
- **4.393 palavras-chave** processadas

### 📈 **Relatórios Gerados**
- **Estatísticas gerais** do dataset
- **Top 10 filmes** por receita e nota
- **Análise por gênero** e década
- **Métricas de qualidade** dos dados

### 🔄 **Fases Implementadas**
1. ✅ **Coleta**: Importação CSV com validação
2. ✅ **Armazenamento**: Banco normalizado (6 tabelas)
3. ✅ **Processamento**: Limpeza e transformação
4. ✅ **Uso**: 15+ consultas analíticas
5. ✅ **Retenção**: Backup e arquivamento automático

## 🏗️ Estrutura do Banco

### 📋 **Tabelas Criadas**
- **`movies`** - Dados principais dos filmes
- **`genres`** - Catálogo de gêneros
- **`keywords`** - Catálogo de palavras-chave
- **`movie_genres`** - Relacionamento filme-gênero
- **`movie_keywords`** - Relacionamento filme-palavra-chave
- **`audit_log`** - Log de auditoria

## 🎯 Conceitos Aplicados

### 📊 **Gestão de Dados**
- ✅ Ciclo de vida completo implementado
- ✅ Normalização de banco de dados
- ✅ Limpeza e validação de dados
- ✅ Políticas de retenção e backup

### 🔍 **Qualidade de Dados**
- ✅ Validação de tipos e formatos
- ✅ Tratamento de valores nulos
- ✅ Padronização de campos
- ✅ Detecção de inconsistências

### 📈 **Análise de Dados**
- ✅ Consultas SQL complexas
- ✅ Agregações e estatísticas
- ✅ Análises temporais
- ✅ Relatórios estruturados

## 🏆 Principais Funcionalidades

### 🔄 **Processamento Automático**
- Importação inteligente de CSV
- Limpeza automática de dados
- Normalização de relacionamentos
- Validação de integridade

### 📊 **Análises Implementadas**
- Filmes mais lucrativos
- Distribuição por gênero
- Evolução temporal
- Métricas de qualidade

### 🛡️ **Auditoria e Controle**
- Log completo de operações
- Backup automático
- Políticas de retenção
- Rastreabilidade total

---

**🎯 EXERCÍCIO 1 - CICLO DE VIDA DE DADOS**  
*Implementação completa das 5 fases fundamentais*  
*Gestão de Dados - UFG - 2025*
