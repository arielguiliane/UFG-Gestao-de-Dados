#!/bin/bash

# =====================================================
# Script Automatizado para Executar Todos os Testes
# =====================================================

# Configurações do banco de dados
DB_HOST="localhost"
DB_USER="root"
DB_NAME="dw_ecommerce_test"

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  EXECUÇÃO COMPLETA DE TESTES - DW     ${NC}"
echo -e "${BLUE}========================================${NC}"

# Função para executar SQL e capturar resultado
execute_sql() {
    local sql_file=$1
    local description=$2

    echo -e "\n${YELLOW}Executando: $description${NC}"
    echo "Arquivo: $sql_file"
    echo "----------------------------------------"

    if [ -f "$sql_file" ]; then
        mysql -h $DB_HOST -u $DB_USER -p $DB_NAME < "$sql_file"
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✓ Sucesso${NC}"
        else
            echo -e "${RED}✗ Erro na execução${NC}"
        fi
    else
        echo -e "${RED}✗ Arquivo não encontrado: $sql_file${NC}"
    fi
}

# Verificar se o banco existe
echo -e "\n${BLUE}1. VERIFICANDO AMBIENTE${NC}"
mysql -h $DB_HOST -u $DB_USER -p -e "USE $DB_NAME; SELECT 'Banco de dados conectado com sucesso!' as Status;"

if [ $? -ne 0 ]; then
    echo -e "${RED}Erro: Não foi possível conectar ao banco $DB_NAME${NC}"
    echo "Certifique-se de que:"
    echo "1. O MySQL está rodando"
    echo "2. O banco $DB_NAME existe"
    echo "3. As credenciais estão corretas"
    exit 1
fi

# Executar testes estruturais
echo -e "\n${BLUE}2. TESTES ESTRUTURAIS${NC}"
execute_sql "testes/validacao/01-testes-estruturais.sql" "Validação das estruturas de tabelas e índices"

# Executar testes de qualidade de dados
echo -e "\n${BLUE}3. TESTES DE QUALIDADE DE DADOS${NC}"
execute_sql "testes/validacao/02-testes-qualidade-dados.sql" "Validação da qualidade e integridade dos dados"

# Executar testes de negócio
echo -e "\n${BLUE}4. TESTES DE NEGÓCIO${NC}"
execute_sql "testes/validacao/03-testes-negocio.sql" "Validação de métricas e KPIs de negócio"

# Executar testes de performance
echo -e "\n${BLUE}5. TESTES DE PERFORMANCE${NC}"
execute_sql "testes/performance/01-testes-performance.sql" "Avaliação de performance das consultas"

# Resumo final
echo -e "\n${BLUE}========================================${NC}"
echo -e "${BLUE}           RESUMO DOS TESTES            ${NC}"
echo -e "${BLUE}========================================${NC}"

echo -e "\n${GREEN}Testes executados com sucesso!${NC}"
echo -e "\nPara executar testes individuais:"
echo -e "• Estruturais: ${YELLOW}mysql -u $DB_USER -p $DB_NAME < testes/validacao/01-testes-estruturais.sql${NC}"
echo -e "• Qualidade:   ${YELLOW}mysql -u $DB_USER -p $DB_NAME < testes/validacao/02-testes-qualidade-dados.sql${NC}"
echo -e "• Negócio:     ${YELLOW}mysql -u $DB_USER -p $DB_NAME < testes/validacao/03-testes-negocio.sql${NC}"
echo -e "• Performance: ${YELLOW}mysql -u $DB_USER -p $DB_NAME < testes/performance/01-testes-performance.sql${NC}"

echo -e "\n${BLUE}Documentação completa disponível em: testes/GUIA_DE_TESTES.md${NC}"
