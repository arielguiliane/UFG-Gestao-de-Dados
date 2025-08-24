# Gestão do Ciclo de Vida de Dados - Exercício 1

## 📋 Descrição do Projeto

Esta aplicação implementa o **ciclo completo de vida de dados** conforme solicitado no Exercício 1 da matéria de Gestão de Dados. O sistema processa dados de filmes em formato CSV e os integra em uma base de dados estruturada, seguindo as 5 fases principais:

```
Coleta → Armazenamento → Processamento → Uso → Retenção/Descarte
```

## 🎯 Objetivos

- Demonstrar o ciclo completo de vida dos dados
- Implementar coleta de dados não padronizados (CSV)
- Criar estrutura de banco de dados normalizada
- Processar e limpar dados inconsistentes
- Gerar relatórios e análises úteis
- Aplicar políticas de retenção e descarte

## 🏗️ Arquitetura da Solução

### Entrada de Dados
- **Arquivo CSV**: `movies.csv` com dados de filmes não padronizados
- **Arquivo SQL**: `database_structure.sql` com estrutura de tabelas

### Saída da Aplicação
- **Banco de dados**: `movies.db` (SQLite)
- **Relatórios**: `relatorios_filmes_*.json`
- **Backup**: `backup_movies_*.sql`
- **Log**: `data_lifecycle.log`

## 🔄 Fases do Ciclo de Vida

### 1. 📥 COLETA DE DADOS
- Leitura do arquivo CSV com dados brutos
- Identificação de campos e estrutura
- Detecção de dados faltantes
- Logging de estatísticas de coleta

### 2. 🗄️ ARMAZENAMENTO
- Criação de estrutura de banco normalizada
- Tabelas principais: `movies`, `genres`, `keywords`
- Tabelas de relacionamento (N:N)
- Índices para performance
- Sistema de auditoria

### 3. ⚙️ PROCESSAMENTO
- Limpeza de dados nulos e inconsistentes
- Padronização de datas e formatos
- Validação de dados numéricos
- Normalização de gêneros e palavras-chave
- Tratamento de campos complexos (JSON)

### 4. 📊 USO DOS DADOS
- **Estatísticas Gerais**: Total de filmes, médias, etc.
- **Top Filmes**: Ranking por receita e lucro
- **Análise por Gênero**: Performance por categoria
- **Tendências Temporais**: Evolução ao longo dos anos
- **Análise de Qualidade**: Completude e consistência

### 5. 🗂️ RETENÇÃO E DESCARTE
- Arquivamento de filmes antigos (antes de 1980)
- Limpeza de logs de auditoria antigos
- Backup automático dos dados
- Remoção de duplicatas
- Registro de atividades de retenção

## 📁 Estrutura de Arquivos

```
Ex 02/
├── movies.csv                    # Dados de entrada
├── data_lifecycle_app.py         # Aplicação principal
├── database_structure.sql        # Estrutura do banco
├── README.md                     # Este arquivo
├── movies.db                     # Banco de dados (gerado)
├── relatorios_filmes_*.json      # Relatórios (gerados)
├── backup_movies_*.sql           # Backup (gerado)
└── data_lifecycle.log            # Log de execução (gerado)
```

## 🚀 Como Executar

### Pré-requisitos
- Python 3.7+
- Bibliotecas: `pandas`, `sqlite3` (incluída), `json` (incluída)

### Instalação das Dependências
```bash
pip install pandas
```

### Execução
```bash
python data_lifecycle_app.py
```

## 📊 Estrutura do Banco de Dados

### Tabelas Principais

#### `movies` - Filmes
- `id`: Chave primária
- `title`: Título do filme
- `release_date`: Data de lançamento
- `budget`: Orçamento
- `revenue`: Receita
- `vote_average`: Nota média
- Outros campos...

#### `genres` - Gêneros (Normalizada)
- `id`: Chave primária
- `name`: Nome do gênero

#### `movie_genres` - Relacionamento N:N
- `movie_id`: FK para movies
- `genre_id`: FK para genres

#### `audit_log` - Auditoria
- Rastreia todas as operações
- Compliance e governança

### Views e Índices
- Views para relatórios otimizados
- Índices para consultas rápidas
- Triggers para auditoria automática

## 📈 Relatórios Gerados

### 1. Estatísticas Gerais
```json
{
  "total_filmes": 4803,
  "orcamento_medio": 29500000.0,
  "receita_media": 82000000.0,
  "nota_media": 6.2,
  "duracao_media": 106.9
}
```

### 2. Top Filmes por Receita
Lista dos filmes mais lucrativos com orçamento, receita e lucro.

### 3. Análise por Gênero
Performance de cada gênero cinematográfico.

### 4. Tendências Temporais
Evolução da indústria cinematográfica ao longo dos anos.

### 5. Análise de Qualidade
Completude e consistência dos dados coletados.

## 🔒 Governança e Compliance

### Auditoria
- Todas as operações são registradas
- Rastreabilidade completa
- Triggers automáticos

### Retenção
- Políticas automáticas de arquivamento
- Backup regular dos dados
- Limpeza de dados antigos

### Qualidade
- Validação de dados na entrada
- Detecção de inconsistências
- Métricas de completude

## 🛠️ Tecnologias Utilizadas

- **Python 3**: Linguagem principal
- **Pandas**: Manipulação de dados
- **SQLite**: Banco de dados
- **JSON**: Formato de relatórios
- **Logging**: Rastreamento de atividades

## 📝 Logs e Monitoramento

O sistema gera logs detalhados em `data_lifecycle.log`:
- Início e fim de cada fase
- Estatísticas de processamento
- Erros e exceções
- Atividades de retenção

## 🎓 Conceitos Aplicados

### Gestão de Dados
- Ciclo de vida completo
- Qualidade de dados
- Governança
- Compliance

### Engenharia de Dados
- ETL (Extract, Transform, Load)
- Normalização de banco
- Otimização de consultas
- Backup e recuperação

### Análise de Dados
- Estatísticas descritivas
- Análise temporal
- Segmentação por categoria
- Métricas de qualidade

## 🔍 Possíveis Extensões

1. **Interface Web**: Dashboard para visualização
2. **APIs REST**: Endpoints para consultas
3. **Machine Learning**: Modelos preditivos
4. **Big Data**: Integração com Spark/Hadoop
5. **Cloud**: Deploy em AWS/Azure/GCP

## 👥 Autor

**Exercício desenvolvido para a matéria de Gestão de Dados**
- Implementação completa do ciclo de vida de dados
- Foco em boas práticas e governança
- Código documentado e estruturado

---

*Este projeto demonstra a aplicação prática dos conceitos de gestão do ciclo de vida de dados, desde a coleta até o descarte, seguindo as melhores práticas da área.*
