# 🚀 Configuração Rápida - Deploy Automático no Vercel

## ⚠️ Erro Atual

```
Error: Input required and not supplied: vercel-token
```

## ✅ Solução Rápida

Você precisa adicionar **3 secrets** no GitHub. Os valores já estão prontos abaixo!

---

## 📋 Secrets para Adicionar no GitHub

Acesse: `https://github.com/[SEU-USUARIO]/figma-frontend-extractor-agent/settings/secrets/actions`

Clique em **"New repository secret"** e adicione:

### 1️⃣ VERCEL_TOKEN

**Nome**: `VERCEL_TOKEN`  
**Valor**: [Você precisa criar em https://vercel.com/account/tokens]

### 2️⃣ VERCEL_ORG_ID

**Nome**: `VERCEL_ORG_ID`  
**Valor**: `team_fIfJ5ABLF77tVVuldFNkfPhR`

### 3️⃣ VERCEL_PROJECT_ID

**Nome**: `VERCEL_PROJECT_ID`  
**Valor**: `prj_66kzdw0IUvhndSjJjgMrQTXwhBbe`

---

## 🔑 Como Obter o VERCEL_TOKEN

1. Acesse: https://vercel.com/account/tokens
2. Clique em **"Create Token"**
3. Nome: `github-actions-figma-extractor`
4. Escopo: **Full Account**
5. Copie o token gerado
6. Cole no GitHub Secret `VERCEL_TOKEN`

---

## ✅ Após Configurar

Faça um push para testar:

```bash
git add .
git commit -m "chore: configure vercel deploy secrets"
git push origin main
```

Acompanhe o workflow em:

```
https://github.com/[SEU-USUARIO]/figma-frontend-extractor-agent/actions
```

---

## 📚 Documentação Completa

Para mais detalhes, veja: [docs/VERCEL_DEPLOY_SETUP.md](./VERCEL_DEPLOY_SETUP.md)
