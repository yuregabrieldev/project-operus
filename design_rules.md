# Operus Design Rules & System

**Objective**: This document serves as the **SINGLE SOURCE OF TRUTH** for all design and UI implementation decisions in the Operus system. It maps the visual identity to code standards using Tailwind CSS and React.

---

## 1. 🎨 Sistema de Cores (Operus Blue Palette)

**Regra Absoluta**: Não invente cores. Use estritamente esta paleta. Para variações (backgrounds, borders), use a classe Tailwind correspondente.

| Nome Interno | Hex | Classe Tailwind | Aplicação Obrigatória |
| :--- | :--- | :--- | :--- |
| **Midnight Blue** | `#020617` | `bg-slate-950` | Fundo da Sidebar (Dark theme), Títulos H1/H2 em marketing pages. |
| **Deep Navy** | `#1E3A8A` | `text-blue-900` | Ícones ativos, Cabeçalhos de Tabela (TH), Texto de Badges Fortes. |
| **Royal Blue** | `#2563EB` | `bg-blue-600` | **COR PRIMÁRIA**. Botões de Ação (CTAs), Links, Focus Rings, Active Tabs. |
| **Ocean Blue** | `#3B82F6` | `hover:bg-blue-500` | Hover de botões primários, Loading states, Borders de inputs ativos. |
| **Ice Blue** | `#EFF6FF` | `bg-blue-50` | Fundo de linhas selecionadas, Badges de fundo suave, Áreas de Upload. |
| **Cool White** | `#F8FAFC` | `bg-slate-50` | **CANVAS**. O fundo geral da página (atrás dos Cards) na aplicação. |
| **Pure White** | `#FFFFFF` | `bg-white` | **CARDS**. Apenas para superfícies de conteúdo (Cards, Modais, Dropdowns). |

### Outras Cores Semânticas
*   **Success**: `text-emerald-600` / `bg-emerald-100` (Badges de "Ativo", "Lucro", "Confirmado")
*   **Warning**: `text-amber-600` / `bg-amber-100` (Badges de "Pendente", "Alerta", "Estoque Baixo")
*   **Destructive**: `text-red-600` / `bg-red-100` (Badges de "Cancelado", "Erro", "Crítico", Botões de Delete)
*   **Text**:
    *   Primary: `text-gray-900` (Títulos, Valores)
    *   Secondary: `text-gray-500` (Legendas, Labels, Metadados)
    *   Disabled: `text-gray-400`

---

## 2. ⚡ Motion & Animação

A "alma" do Operus é a fluidez. A interface deve parecer viva, mas profissional.

### Ferramentas
*   **Micro-interações**: `framer-motion` (para componentes React)
*   **Navegação**: View Transitions API (nativa do browser)

### Regras de Animação

#### 2.1 Animação de Página (View Transitions)
*   **Comportamento**: Ao trocar de aba/página, o conteúdo antigo deve fazer um leve *fade out* enquanto o novo faz *fade in* e *slide up* sutil.
*   **Implementação**: Use `document.startViewTransition()` no router.
*   **Fallback**: Se não suportado, use `animate-in fade-in duration-200` do Tailwind.

#### 2.2 Modais e Dialogs
*   **Entrada**:
    *   Scale: `0.95` -> `1.0`
    *   Opacity: `0` -> `1`
    *   Duration: `0.2s` `ease-out`
*   **Saída**:
    *   Scale: `1.0` -> `0.95`
    *   Opacity: `1` -> `0`
    *   Duration: `0.1s` `ease-in`

#### 2.3 Listas e Tabelas (Stagger)
*   Ao carregar uma lista (ex: Produtos, Transações), os itens não devem aparecer todos de uma vez.
*   Use `staggerChildren: 0.05` no container pai.
*   Item variants:
    ```javascript
    const item = {
      hidden: { opacity: 0, y: 20 },
      show: { opacity: 1, y: 0 }
    }
    ```

#### 2.4 Contexto e Remoção
*   Use `<AnimatePresence>` sempre que um item for removido do DOM (ex: fechar um toast, remover item da lista) para garantir a animação de saída (`exit`).

---

## 3. 🖌️ Integração Figma & Design System

### Fonte da Verdade
O Figma é a autoridade visual. O código é a autoridade funcional.
**Referência Principal**: Utilize o **Untitled UI Pro** para todos os elementos padrão. Se um componente existe no Untitled UI Pro, use-o como base para o design.

### Regra de Ouro (Untitled UI)
Ao traduzir do Figma para o Código:
1.  **NÃO copie CSS cru**: Nunca copie blocos gigantes de CSS do inspector do Figma.
2.  **Identifique o Componente**: Se no Figma tem um botão azul, não crie um `<div className="bg-blue-600 p-4 rounded...">`.
3.  **Use shadcn/ui**: Use `<Button variant="default">`. Personalize o *tema* do shadcn para bater com o Figma, não o componente individual.
4.  **Tokens, não Valores**: Se o Figma diz `24px` de padding, use `p-6` (Tailwind). Se diz `#2563EB`, use `bg-blue-600`.

### Componentes Obrigatórios
*   Utilize a biblioteca **shadcn/ui** como base para tudo.
*   Para ícones, use **Lucide React**.

---

## 4. 🔍 SEO & Acessibilidade

### Semântica HTML (Coding Standards)
*   **Estrutura**:
    *   Use `<main>` para o conteúdo principal.
    *   Use `<nav>` para sidebars e menus.
    *   Use `<header>` para o topo.
    *   Use `<article>` para cards de conteúdo independente (ex: um post, um produto).
*   **Interatividade**:
    *   Botão é `<button>`, Link é `<a>`.
    *   **NUNCA** use `<div onClick={...}>` para elementos interativos. Se precisar, adicione `role="button"` e `tabIndex={0}`, mas prefira a tag correta.

### Acessibilidade (a11y)
*   **Labels**: Todo botão que é apenas um ícone (ex: "Editar", "Excluir") **DEVE** ter `aria-label="Descrição da ação"`.
*   **Formulários**: Todos os inputs devem ter um `<Label>` associado via `htmlFor`.
*   **Contraste**: A paleta Operus Blue já é otimizada para WCAG AA. Não use texto cinza claro (`gray-300`) em fundo branco. Use no mínimo `gray-500`.

### Responsividade (Mobile-First)
*   Desenvolva pensando no Mobile vertical primeiro.
*   Use prefixos `sm:`, `md:`, `lg:`, `xl:` para expandir o layout.
*   **Padrão**:
    *   Mobile: Coluna única (`flex-col`, `grid-cols-1`).
    *   Desktop: Sidebar visível, Grids expandidos (`grid-cols-4`).
