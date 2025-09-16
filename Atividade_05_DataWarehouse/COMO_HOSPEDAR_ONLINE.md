# 🌐 Como Hospedar o Dashboard Online

## 🚀 Opção 1: GitHub Pages (GRATUITO e Mais Fácil)

### Passo 1: Criar Repositório no GitHub
1. Acesse: https://github.com
2. Clique em "New repository"
3. Nome: `data-warehouse-ecommerce`
4. Marque "Public"
5. Clique "Create repository"

### Passo 2: Fazer Upload dos Arquivos
```bash
# No terminal, dentro da pasta do projeto:
git init
git add .
git commit -m "Data Warehouse Dashboard"
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/data-warehouse-ecommerce.git
git push -u origin main
```

### Passo 3: Ativar GitHub Pages
1. No repositório, vá em "Settings"
2. Role até "Pages"
3. Em "Source", selecione "Deploy from a branch"
4. Escolha "main" branch
5. Clique "Save"

### 🎉 Resultado:
**Link público:** `https://SEU_USUARIO.github.io/data-warehouse-ecommerce/`

---

## 🚀 Opção 2: Netlify (GRATUITO e Instantâneo)

### Passo 1: Acessar Netlify
1. Vá para: https://netlify.com
2. Clique "Sign up" (pode usar GitHub)

### Passo 2: Deploy Manual
1. Clique "Sites" > "Add new site" > "Deploy manually"
2. Arraste a pasta do projeto inteira
3. Aguarde o deploy

### 🎉 Resultado:
**Link público:** `https://NOME-ALEATORIO.netlify.app/`

---

## 🚀 Opção 3: Vercel (GRATUITO e Rápido)

### Passo 1: Acessar Vercel
1. Vá para: https://vercel.com
2. Clique "Sign up" (pode usar GitHub)

### Passo 2: Deploy
1. Clique "New Project"
2. Se tiver GitHub conectado, selecione o repositório
3. Ou faça upload manual da pasta

### 🎉 Resultado:
**Link público:** `https://NOME-PROJETO.vercel.app/`

---

## 🎯 Recomendação: GitHub Pages

### ✅ Vantagens:
- **100% gratuito**
- **Link profissional** (github.io)
- **Fácil de atualizar**
- **Boa para portfólio acadêmico**
- **SSL automático** (https)

### 📋 Passos Resumidos:
1. Criar conta no GitHub
2. Criar repositório público
3. Fazer upload dos arquivos
4. Ativar Pages nas configurações
5. **Pronto!** Link público funcionando

### 🔗 Exemplo de Link Final:
`https://arielguiliane.github.io/data-warehouse-ecommerce/`

---

## 💡 Dicas Importantes:

### 🔒 Segurança:
- **Não inclua** senhas do MySQL nos arquivos
- **Use dados fictícios** para demonstração
- **Dashboard é apenas visualização** (não conecta ao banco real)

### 📊 Funcionalidades Online:
- ✅ **Gráficos interativos** funcionam
- ✅ **Interface responsiva** funciona
- ✅ **Dados estáticos** são exibidos
- ❌ **Conexão com MySQL** não funciona (apenas local)

### 🎓 Para Apresentação:
- **Link público** para mostrar na aula
- **Código no GitHub** para demonstrar técnica
- **Dashboard local** para demonstração com dados reais
