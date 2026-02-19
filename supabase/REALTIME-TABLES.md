# Tabelas para ativar Realtime (notificações no sistema)

No **Supabase Dashboard**: **Database** → **Replication** → ative a replicação para as tabelas abaixo. Assim o sistema pode reagir em tempo real (sino de notificações, listas atualizadas, etc.).

## Obrigatórias para notificações atuais

| Tabela | Uso |
|--------|-----|
| **registration_requests** | Novas solicitações de "Criar Conta" → notificações no Header (developer) e lista Interessados. |

## Recomendadas para notificações em todo o sistema

| Tabela | Uso sugerido |
|--------|----------------|
| **registration_requests** | Ver acima. |
| **invoices** | Faturas novas/vencidas → alertas de pagamento (configurações: "overdue_description"). |
| **licenses** | Licenças a vencer → alertas de renovação ("licenseExpiryDesc"). |
| **inventory_items** | Alterações em níveis de stock → alertas de estoque baixo ("low_stock_alerts"). |
| **brands** | Nova marca (developer) → notificação "Nova marca". |
| **user_brands** | Novo utilizador associado a uma marca → notificação "Novo utilizador na marca". |
| **profiles** | Novo perfil ativado (ex.: após aprovação) → notificação. |
| **waste_records** | Novos registos de desperdício → alerta de desperdício (settings). |
| **checklist_executions** | Checklists por concluir/vencidos → "checklistDue" (settings). |

## Como ativar

1. Abre o projeto no [Supabase Dashboard](https://supabase.com/dashboard).
2. **Database** → **Replication** (ou **Publications** em versões antigas).
3. Clica em **Create a new publication** ou edita a publicação existente.
4. Marca as tabelas da lista acima que quiseres (mínimo: **registration_requests**).
5. Guarda. O front-end que já subscreve essas tabelas (ex.: Header para `registration_requests`) passa a receber eventos em tempo real.

## Nota

- Só precisas de ativar Realtime nas tabelas que o código subscreve com `supabase.channel().on('postgres_changes', ...)`.
- Atualmente só **registration_requests** está subscrita no Header. As outras tabelas ficam prontas para quando implementares mais notificações (ex.: alertas de faturas, licenças, stock).
