# Proposta de Data Warehouse - Atividade 05
## Gestão de Dados - Pós-Graduação

### Objetivo
Desenvolver uma proposta completa de Data Warehouse seguindo as características fundamentais de um DW, considerando aspectos teóricos e práticos da disciplina.

### Domínios Disponíveis
- **E-commerce** (produtos e preços)
- **Meteorologia** (dados climáticos)
- **APIs públicas**

### Estrutura do Projeto

```
├── docs/
│   ├── 01-caracteristicas-fundamentais.md
│   ├── 02-arquitetura-conceitual.md
│   ├── 03-modelagem-dimensional.md
│   ├── 04-arquitetura-tecnica.md
│   └── 05-implementacao.md
├── sql/
│   ├── ddl/
│   ├── etl/
│   └── queries/
├── diagramas/
└── apresentacao/
```

### Cronograma de Desenvolvimento

1. **Análise e Planejamento** - Definição de características e domínio
2. **Modelagem Dimensional** - Criação do modelo estrela/floco de neve
3. **Arquitetura Técnica** - Definição de tecnologias e processos ETL
4. **Implementação** - Scripts SQL e documentação técnica

### Próximos Passos
1. Definir domínio de negócio específico
2. Mapear características fundamentais do DW
3. Criar arquitetura conceitual
4. Desenvolver modelo dimensional
## Como Testar a Funcionalidade

### 🚀 Execução Automatizada (Recomendado)
```bash
# Dar permissão de execução
chmod +x testes/executar_todos_testes.sh

# Executar todos os testes
./testes/executar_todos_testes.sh
```

### 📋 Execução Manual
1. **Criar banco de dados**:
   ```sql
   CREATE DATABASE dw_ecommerce_test;
   USE dw_ecommerce_test;
   ```

2. **Executar scripts na ordem**:
   ```bash
   # Criar estruturas
   mysql -u root -p dw_ecommerce_test < sql/ddl/01-create-dimensions.sql
   mysql -u root -p dw_ecommerce_test < sql/ddl/02-create-fact-table.sql

   # Popular dimensão tempo
   mysql -u root -p dw_ecommerce_test < sql/etl/01-load-dim-tempo.sql

   # Carregar dados de teste
   mysql -u root -p dw_ecommerce_test < testes/dados/01-popular-dimensoes.sql
   mysql -u root -p dw_ecommerce_test < testes/dados/02-popular-fato-vendas.sql

   # Executar validações
   mysql -u root -p dw_ecommerce_test < testes/validacao/01-testes-estruturais.sql
   mysql -u root -p dw_ecommerce_test < testes/validacao/02-testes-qualidade-dados.sql
   mysql -u root -p dw_ecommerce_test < testes/validacao/03-testes-negocio.sql
   mysql -u root -p dw_ecommerce_test < testes/performance/01-testes-performance.sql
   ```

### 📊 Resultados Esperados
- **10 clientes** com perfis variados
- **10 produtos** de diferentes categorias
- **18 transações** de venda (13 pedidos)
- **Receita Total**: ~R$ 18.000,00
- **Performance**: Consultas < 100ms

### 📖 Documentação Completa
Consulte `testes/GUIA_DE_TESTES.md` para instruções detalhadas, troubleshooting e extensões dos testes.
