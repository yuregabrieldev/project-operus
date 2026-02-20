# Como publicar a Edge Function "create-user" no Supabase

## 1. Instalar a Supabase CLI

No PowerShell (como administrador, se precisar):

```powershell
# Opção A: com npm (recomendado)
npm install -g supabase

# Opção B: com scoop (Windows)
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase
```

Ou use **npx** sem instalar globalmente (veja o passo 4).

---

## 2. Fazer login no Supabase

No terminal, na pasta do projeto:

```bash
npx supabase login
```

Vai abrir o browser para fazer login na tua conta Supabase. Autoriza e volta ao terminal.

---

## 3. Ligar o projeto à tua conta (só na primeira vez)

Se ainda não ligaste esta pasta ao teu projeto no Supabase:

```bash
npx supabase link --project-ref TEU_PROJECT_REF
```

**Onde está o Project Ref?**

1. Entra em [supabase.com/dashboard](https://supabase.com/dashboard)
2. Abre o teu projeto
3. Vai em **Project Settings** (ícone de engrenagem)
4. Na secção **General** vês **Reference ID** — é esse valor (ex: `abcdefghijklmnop`)

Ou está no URL: `https://supabase.com/dashboard/project/TEU_PROJECT_REF`

---

## 4. Publicar a Edge Function

Na raiz do projeto (onde está o `package.json`):

```bash
npx supabase functions deploy create-user
```

Se não tiveste a fazer `link`, a CLI pode pedir o project ref; usa o mesmo valor do passo 3.

---

## 5. Confirmar que está no ar

1. No dashboard: **Edge Functions** no menu lateral
2. Deves ver **create-user** na lista
3. Ao criar um novo utilizador na app, a função será chamada automaticamente

---

## Resumo rápido (quando já tens login e link feitos)

```bash
npx supabase functions deploy create-user
```

---

## Problemas comuns

- **"Project not linked"** → Faz o passo 3 (`supabase link`).
- **"Not logged in"** → Faz o passo 2 (`supabase login`).
- **Erro de permissão na função** → A app chama a função com o token do utilizador; só utilizadores com perfil **admin** ou **developer** podem criar utilizadores.
