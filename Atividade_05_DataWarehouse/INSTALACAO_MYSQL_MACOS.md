# Instalação MySQL no macOS - Guia Completo

## 🍺 Opção 1: Instalar via Homebrew (Recomendado)

### Passo 1: Verificar se Homebrew está instalado
```bash
brew --version
```

Se não estiver instalado, instale primeiro:
```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

### Passo 2: Instalar MySQL
```bash
# Instalar MySQL
brew install mysql

# Iniciar o serviço MySQL
brew services start mysql
```

### Passo 3: Configurar MySQL
```bash
# Executar configuração de segurança
mysql_secure_installation
```

**Durante a configuração:**
- Definir senha para root (anote essa senha!)
- Responder "Y" para remover usuários anônimos
- Responder "Y" para desabilitar login root remoto
- Responder "Y" para remover banco de teste
- Responder "Y" para recarregar privilégios

### Passo 4: Testar conexão
```bash
mysql -u root -p
```
Digite a senha que você criou. Se conectou, digite `exit;` para sair.

## 💾 Opção 2: Instalar via Download Oficial

### Passo 1: Baixar MySQL
1. Acesse: https://dev.mysql.com/downloads/mysql/
2. Escolha "macOS" como sistema operacional
3. Baixe o arquivo .dmg (MySQL Community Server)

### Passo 2: Instalar
1. Abra o arquivo .dmg baixado
2. Execute o instalador .pkg
3. Siga as instruções na tela
4. **IMPORTANTE**: Anote a senha temporária que aparece no final!

### Passo 3: Adicionar ao PATH
```bash
# Adicionar ao arquivo de configuração do shell
echo 'export PATH="/usr/local/mysql/bin:$PATH"' >> ~/.zshrc

# Recarregar configuração
source ~/.zshrc
```

### Passo 4: Iniciar MySQL
```bash
# Iniciar MySQL
sudo /usr/local/mysql/support-files/mysql.server start

# Ou usar System Preferences > MySQL > Start MySQL Server
```

### Passo 5: Alterar senha root
```bash
# Conectar com senha temporária
mysql -u root -p

# Alterar senha (substitua 'nova_senha' pela sua senha)
ALTER USER 'root'@'localhost' IDENTIFIED BY 'nova_senha';
exit;
```
