# 🔄 Plano de Redesign - Operus para Untitled UI Pro

## ✅ Conexão com Figma Estabelecida

- **Token**: Configurado com sucesso
- **Arquivo Figma**: `nxIn38V4kDP0F3HZJuZrA8` (Untitled UI Pro v4.0)
- **Status**: Estilos e componentes extraídos com sucesso

### Styles Encontrados no Figma

| Categoria          | Exemplos                                                                         |
| ------------------ | -------------------------------------------------------------------------------- |
| **Cores**          | Pink/50, Gray blue/100-200, Gray iron/100-900, Gray neutral/100-900, Warning/300 |
| **Shadows**        | shadow-xs, shadow-sm, shadow-md                                                  |
| **Focus Rings**    | ring-brand-shadow-xs, ring-brand-shadow-sm                                       |
| **Backdrop Blurs** | backdrop-blur-lg                                                                 |
| **Gradients**      | Linear/Gray true, Linear/Gray neutral, Linear/Color (múltiplas cores)            |
| **Avatares**       | Avatar user square, Avatar company logo                                          |

---

## 📋 FASE 1: Preparação e Configuração Base

### 1.1 Atualizar Variáveis CSS do Sistema de Cores

**Arquivo**: `src/index.css`

Mapeamento de cores baseado na paleta Operus + Figma:

| Nome          | Hex (Operus) | Tailwind          | Fonte            |
| ------------- | ------------ | ----------------- | ---------------- |
| Midnight Blue | #020617      | bg-slate-950      | Operus Spec      |
| Deep Navy     | #1E3A8A      | text-blue-900     | Operus Spec      |
| Royal Blue    | #2563EB      | bg-blue-600       | **COR PRIMÁRIA** |
| Ocean Blue    | #3B82F6      | hover:bg-blue-500 | Operus Spec      |
| Ice Blue      | #EFF6FF      | bg-blue-50        | Operus Spec      |
| Cool White    | #F8FAFC      | bg-slate-50       | Operus Spec      |
| Pure White    | #FFFFFF      | bg-white          | Operus Spec      |

### 1.2 Shadows do Untitled UI Pro

| Nome Figma        | Tailwind Equivalent |
| ----------------- | ------------------- |
| Shadows/shadow-xs | shadow-xs ou custom |
| Shadows/shadow-sm | shadow-sm           |
| Shadows/shadow-md | shadow-md           |

### 1.3 Configurar View Transitions API

- Implementar no router (react-router-dom)
- Fallback CSS para browsers não suportados

### 1.4 Configurar Framer Motion

- Hook personalizado para animações
- AnimatePresence globalmente

---

## 🎨 FASE 2: Componentes UI Base (Untitled UI Pro)

### 2.1 Button

- Aplicar paleta Operus Blue (Royal Blue #2563EB)
- Variantes: default, secondary, outline, ghost, destructive
- Estados: default, hover (Ocean Blue), active, disabled
- Animações Framer Motion (scale 1.02 no hover, 0.98 no click)

### 2.2 Card

- Fundo Pure White (#FFFFFF)
- Border radius consistente (8px conforme Figma)
- Sombras shadow-md do Untitled UI

### 2.3 Input

- Estados: default, focus (Royal Blue border), error, disabled
- Labels com Deep Navy
- Animações de transição

### 2.4 Badge

- Cores semânticas baseadas no Figma
- Variantes: default, secondary, outline, destructive
- Estados: default, hover

### 2.5 Dialog/Modal

- Animações scale + opacity (Framer Motion)
- Backdrop blur (backdrop-blur-lg do Figma)
- Close button estilizado

### 2.6 Table

- Header com Deep Navy (#1E3A8A)
- Linhas com hover Ice Blue (#EFF6FF)
- Animações stagger para itens

---

## 🧩 FASE 3: Layout e Componentes Estruturais

### 3.1 Sidebar

- Fundo Midnight Blue (#020617)
- Itens com hover Ocean Blue (#3B82F6)
- Ícones ativos Royal Blue (#2563EB)
- Animações de transição suaves

### 3.2 Header

- Fundo Pure White (#FFFFFF)
- Busca estilizada
- Notifications com badge
- User menu dropdown

### 3.3 Layout Principal

- Container com Cool White (#F8FAFC)
- Cards com Pure White (#FFFFFF)
- Espaçamentos mobile-first

---

## ⚡ FASE 4: Motion & Animações

### 4.1 Page Transitions

- View Transitions API no router
- Fade + slide up para mudanças de rota
- Fallback CSS (animate-in fade-in duration-200)

### 4.2 Lista/Table Stagger

- Framer Motion variants
- staggerChildren: 0.05s
- AnimatePresence para remoção de itens

### 4.3 Micro-interações

- Hover em botões (scale 1.02)
- Click feedback (scale 0.98)
- Loading spinners com cor Royal Blue
- Skeleton loaders

### 4.4 Modals/Dialogs

- Scale: 0.95 → 1.0
- Opacity: 0 → 1
- Duration: 0.2s ease-out (entrada)
- Duration: 0.1s ease-in (saída)

---

## 📄 FASE 5: Páginas Principais

### 5.1 Landing Page

- Hero com gradiente (Royal Blue → Indigo)
- Cards de funcionalidades
- Pricing section
- Footer

### 5.2 Dashboard

- KPI Cards estilizados
- Gráficos com tema azul
- Tabs operacional/financeiro

### 5.3 Inventory

- Tabela com filtros
- Cards de produtos
- Dialogs de formulário

### 5.4 Outras Páginas

- Operations, Transit, Purchases
- Cash Management
- Invoices, Licenses
- Users, Stores
- Checklists
- Settings

---

## ♿ FASE 6: SEO & Acessibilidade

### 6.1 Semântica HTML

- `<main>` para conteúdo principal
- `<nav>` para sidebars e menus
- `<header>` para topo
- `<article>` para cards independentes
- Buttons como `<button>`, links como `<a>`

### 6.2 Acessibilidade

- aria-label em botões de ícone
- htmlFor em labels de formulário
- Contraste WCAG (verificado na paleta)
- Focus rings Royal Blue (#2563EB)

### 6.3 Responsividade Mobile-First

- Prefixos sm:, md:, lg:, xl:
- Layout mobile: coluna única
- Desktop: sidebar + grids expandidos

---

## 📊 Mapa de Componentes a Atualizar

| Componente | Arquivo                         | Prioridade |
| ---------- | ------------------------------- | ---------- |
| Button     | components/ui/button.tsx        | 🔴 Alta    |
| Card       | components/ui/card.tsx          | 🔴 Alta    |
| Input      | components/ui/input.tsx         | 🔴 Alta    |
| Badge      | components/ui/badge.tsx         | 🔴 Alta    |
| Dialog     | components/ui/dialog.tsx        | 🔴 Alta    |
| Table      | components/ui/table.tsx         | 🔴 Alta    |
| Sidebar    | components/ui/sidebar.tsx       | 🔴 Alta    |
| Header     | components/Layout/Header.tsx    | 🔴 Alta    |
| Dropdown   | components/ui/dropdown-menu.tsx | 🟠 Média   |
| Select     | components/ui/select.tsx        | 🟠 Média   |
| Tabs       | components/ui/tabs.tsx          | 🟠 Média   |
| Toast      | components/ui/toast.tsx         | 🟠 Média   |
| Checkbox   | components/ui/checkbox.tsx      | 🟡 Baixa   |
| Radio      | components/ui/radio-group.tsx   | 🟡 Baixa   |
| Switch     | components/ui/switch.tsx        | 🟡 Baixa   |
| Progress   | components/ui/progress.tsx      | 🟡 Baixa   |

---

## 🚀 Ordem de Execução Sugerida

1. **Setup** → Variáveis CSS + Shadows + Framer Motion
2. **Componentes Base** → Button, Card, Input, Badge, Dialog
3. **Layout** → Sidebar, Header, Container
4. **Pages** → Landing, Dashboard, Inventory
5. **Pages Restantes** → Todas as outras páginas
6. **A11y** → Semântica + aria-labels
7. **Testes** → Verificar responsividade

---

## 📝 Recursos do Figma Utilizados

### Cores (do Figma Untitled UI Pro)

- Gray blue/100-200
- Gray iron/100-900
- Gray neutral/100-900
- Pink/50
- Warning/300
- Gradientes Lineares

### Effects (do Figma Untitled UI Pro)

- shadow-xs, shadow-sm, shadow-md
- ring-brand-shadow-xs, ring-brand-shadow-sm
- backdrop-blur-lg

---

## ⚠️ Notas Importantes

1. **Paleta de Cores**: Usar rigorosamente a paleta Operus Blue especificada pelo usuário
2. **Componentes shadcn/ui**: Já existem 53 componentes prontos para estilização
3. **Framer Motion**: Já está instalado no projeto
4. **Figma**: Dados extraídos com sucesso, pronto para referência visual
5. **Token Figma**: Configurado em `C:/Users/yureg/AppData/Roaming/Kilo-Code/MCP/settings.json`
