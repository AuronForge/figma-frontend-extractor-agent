# Configuração de Deploy Automático no Vercel via GitHub Actions

## ⚠️ Problema Atual

```
Error: Input required and not supplied: vercel-token
```

O workflow do GitHub Actions está configurado, mas os **secrets necessários** não foram adicionados ao repositório.

## 🔐 Secrets Necessários

Você precisa configurar 3 secrets no GitHub:

1. **VERCEL_TOKEN** - Token de acesso do Vercel
2. **VERCEL_ORG_ID** - ID da organização/usuário no Vercel
3. **VERCEL_PROJECT_ID** - ID do projeto no Vercel

---

## 📝 Passo a Passo para Configurar

### 1. Obter o VERCEL_TOKEN

1. Acesse: https://vercel.com/account/tokens
2. Clique em **"Create Token"**
3. Dê um nome (ex: `github-actions-figma-extractor`)
4. Selecione o escopo apropriado
5. Clique em **"Create"**
6. **Copie o token** (você só verá uma vez!)

### 2. Obter VERCEL_ORG_ID e VERCEL_PROJECT_ID

Execute no terminal do projeto:

```bash
# Faça login no Vercel (se ainda não estiver logado)
npx vercel login

# Link o projeto (se ainda não estiver linkado)
npx vercel link

# Os IDs estarão no arquivo .vercel/project.json
cat .vercel/project.json
```

Você verá algo como:

```json
{
  "orgId": "team_xxxxxxxxxxxxxxxxxxxxxxxx",
  "projectId": "prj_xxxxxxxxxxxxxxxxxxxxxxxx"
}
```

**OU** obtenha via Vercel Dashboard:

- **VERCEL_ORG_ID**: Vai para Settings → General → encontre "Team ID" ou "User ID"
- **VERCEL_PROJECT_ID**: No dashboard do projeto → Settings → General → "Project ID"

### 3. Adicionar Secrets no GitHub

1. Vá para o repositório no GitHub
2. Clique em **Settings** (configurações do repositório)
3. No menu lateral, clique em **Secrets and variables** → **Actions**
4. Clique em **"New repository secret"**
5. Adicione cada secret:
   - **Nome**: `VERCEL_TOKEN`
     **Valor**: [cole o token do passo 1]

   - **Nome**: `VERCEL_ORG_ID`
     **Valor**: [cole o orgId do passo 2]

   - **Nome**: `VERCEL_PROJECT_ID`
     **Valor**: [cole o projectId do passo 2]

---

## 🚀 Testar o Deploy

Após configurar os secrets:

1. Faça um commit e push:

   ```bash
   git add .
   git commit -m "test: trigger deploy workflow"
   git push origin main
   ```

2. Acompanhe o workflow em:
   ```
   https://github.com/[seu-usuario]/figma-frontend-extractor-agent/actions
   ```

---

## 📋 Checklist de Configuração

- [ ] VERCEL_TOKEN criado no Vercel
- [ ] VERCEL_ORG_ID obtido
- [ ] VERCEL_PROJECT_ID obtido
- [ ] Todos os 3 secrets adicionados no GitHub
- [ ] Push feito para testar o workflow

---

## ℹ️ Informações Adicionais

### Workflow Atual

O arquivo `.github/workflows/deploy.yml` já está configurado para:

- ✅ Rodar testes automaticamente
- ✅ Verificar cobertura de testes (mínimo 70%)
- ✅ Deploy automático para Vercel em push para `main`

### Secrets Opcionais

- **CODECOV_TOKEN** - Para upload de cobertura de testes (opcional)

---

## 🔒 Segurança

- ⚠️ **NUNCA** commite os tokens diretamente no código
- ⚠️ **NUNCA** exponha os secrets em logs
- ✅ Use sempre GitHub Secrets para dados sensíveis
- ✅ Os secrets são criptografados pelo GitHub

---

## 🆘 Troubleshooting

### Erro: "Resource not found"

- Verifique se o VERCEL_PROJECT_ID está correto
- Certifique-se de que o projeto existe no Vercel

### Erro: "Forbidden"

- Verifique se o VERCEL_TOKEN tem permissões corretas
- Recrie o token com escopo adequado

### Erro: "Invalid token"

- O token pode ter expirado
- Gere um novo token no Vercel
