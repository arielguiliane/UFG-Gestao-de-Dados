# 🚀 Guia de Instalação - Sistema de Coleta de Dados

## Pré-requisitos

### 1. Instalar Node.js

**macOS (usando Homebrew):**
```bash
# Instalar Homebrew (se não tiver)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Instalar Node.js
brew install node
```

**macOS (Download direto):**
1. Acesse: https://nodejs.org/
2. Baixe a versão LTS (recomendada)
3. Execute o instalador

**Windows:**
1. Acesse: https://nodejs.org/
2. Baixe a versão LTS
3. Execute o instalador .msi

**Linux (Ubuntu/Debian):**
```bash
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### 2. Verificar Instalação

```bash
node --version
npm --version
```

## 🔧 Configuração do Projeto

### 1. Instalar Dependências

```bash
npm install
```

### 2. Configurar Variáveis de Ambiente

```bash
cp .env.example .env
```

### 3. Testar Instalação

```bash
# Teste básico do sistema
npm test

# Teste individual do scraper
npm run scraper

# Teste individual da API meteorológica
npm run weather
```

## 🎮 Execução

### Execução Completa
```bash
npm start
```

### Execução Individual

**Web Scraper (Magazine Luiza):**
```bash
npm run scraper
```

**API Client (INMET):**
```bash
npm run weather
```

## 📁 Estrutura Criada

Após a instalação, você terá:

```
Atividade_02/
├── package.json              # Configuração do projeto
├── README.md                 # Documentação principal
├── INSTALACAO.md            # Este arquivo
├── .env.example             # Exemplo de configuração
├── src/
│   ├── index.js             # Arquivo principal
│   ├── scraper/
│   │   └── magalu-scraper.js # Web Scraper Magazine Luiza
│   ├── api/
│   │   └── inmet-client.js   # API Client INMET
│   ├── utils/
│   │   ├── data-processor.js # Processamento de dados
│   │   └── logger.js         # Sistema de logs
│   └── test/
│       └── test-all.js       # Testes do sistema
└── dados-coletados/          # Pasta para arquivos de saída
```

## 🔍 Verificação de Funcionamento

### 1. Testes Básicos
```bash
npm test
```

### 2. Coleta de Dados Completa
```bash
npm start
```

### 3. Verificar Saída
Os dados coletados serão salvos em `dados-coletados/coleta-dados-[timestamp].json`

## ⚠️ Possíveis Problemas

### Node.js não encontrado
- Reinicie o terminal após instalar o Node.js
- Verifique se o PATH está configurado corretamente

### Erro de permissões (macOS/Linux)
```bash
sudo chown -R $(whoami) ~/.npm
```

### Puppeteer não instala
```bash
# Instalar dependências do sistema (Linux)
sudo apt-get install -y gconf-service libasound2 libatk1.0-0 libc6 libcairo2 libcups2 libdbus-1-3 libexpat1 libfontconfig1 libgcc1 libgconf-2-4 libgdk-pixbuf2.0-0 libglib2.0-0 libgtk-3-0 libnspr4 libpango-1.0-0 libpangocairo-1.0-0 libstdc++6 libx11-6 libx11-xcb1 libxcb1 libxcomposite1 libxcursor1 libxdamage1 libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 libxss1 libxtst6 ca-certificates fonts-liberation libappindicator1 libnss3 lsb-release xdg-utils wget
```

## 📞 Suporte

Se encontrar problemas:
1. Verifique se o Node.js está instalado corretamente
2. Execute `npm test` para verificar componentes básicos
3. Consulte os logs do sistema para detalhes dos erros

## 🎯 Próximos Passos

Após a instalação bem-sucedida:
1. Execute o sistema completo: `npm start`
2. Verifique os dados coletados na pasta `dados-coletados/`
3. Analise os logs para entender o processo de coleta
4. Prepare para commit no Git com as funcionalidades implementadas
