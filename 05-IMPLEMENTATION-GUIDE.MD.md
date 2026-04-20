# Ello - Guia de Implementação por Fases

## Como usar este documento
Cada fase tem um checklist de tarefas ordenadas por dependência. Comece do topo.
Copie a fase atual para o Cursor como contexto junto com o `.cursorrules`.

---

## Fase 0 - Fundação (Semanas 1-2)

### Objetivo
Setup completo do projeto. Ao final, você terá: repo configurado, banco rodando, auth funcionando, e Design System aplicado.

### Checklist

```
[ ] 1. Criar projeto Next.js
      npx create-next-app@latest ello --typescript --tailwind --app --src-dir
      
[ ] 2. Instalar dependências
      npm install @supabase/ssr @supabase/supabase-js stripe zod
      npm install framer-motion date-fns lucide-react
      npm install class-variance-authority clsx tailwind-merge
      npm install -D supabase

[ ] 3. Configurar Supabase
      npx supabase init
      npx supabase link --project-ref <seu-ref>
      Criar .env.local com credenciais

[ ] 4. Aplicar Schema
      Copiar 001_schema.sql para supabase/migrations/
      Copiar 002_rls_policies.sql
      Copiar 003_functions.sql
      npx supabase db push

[ ] 5. Gerar tipos TypeScript
      npx supabase gen types typescript --linked > src/types/database.ts

[ ] 6. Setup Supabase Client
      Criar src/lib/supabase/client.ts (browser)
      Criar src/lib/supabase/server.ts (server)
      Criar src/middleware.ts (auth guard)

[ ] 7. Configurar Tailwind
      Aplicar tailwind.config.ts com Synergy Palette
      Aplicar src/styles/globals.css com fonts
      Criar src/lib/utils/colors.ts

[ ] 8. Setup shadcn/ui
      npx shadcn-ui@latest init
      Instalar componentes base:
        npx shadcn-ui@latest add button input label card sheet
        npx shadcn-ui@latest add dialog dropdown-menu toast tabs
      Customizar com cores Ello (border-radius: 24px)

[ ] 9. Criar Layout base
      src/app/layout.tsx (fonts, metadata, PWA)
      src/components/layout/AppShell.tsx
      src/components/layout/BottomNav.tsx
      src/components/layout/Header.tsx

[ ] 10. Setup Auth pages
       src/app/(auth)/login/page.tsx (Magic Link + Google)
       src/app/(auth)/callback/route.ts
       Testar login/logout

[ ] 11. Criar .cursorrules
       Copiar arquivo de specs para raiz do projeto

[ ] 12. PWA Config
       public/manifest.json
       Metadata no layout.tsx
       Ícones placeholder (192px, 512px)

[ ] 13. Deploy inicial na Vercel
       Conectar repo GitHub
       Configurar env vars na Vercel
       Testar deploy
```

### Critério de conclusão
- [ ] Login via Magic Link funciona
- [ ] Login via Google funciona
- [ ] Middleware protege rotas /calendario, /tarefas, etc.
- [ ] Design System visível (cores, fontes, bordas arredondadas)
- [ ] Deploy na Vercel acessível

---

## Fase 1 - MVP Core (Semanas 3-6)

### Objetivo
Calendário familiar funcional com CRUD de eventos, convite de parceiro e notificações básicas.

### Checklist

```
[ ] 1. Onboarding Flow
      src/app/(auth)/onboarding/page.tsx
      Step 1: Nome do usuário
      Step 2: Nome da família (cria family + member admin)
      Step 3: Convite do parceiro (opcional)
      Step 4: Tela de sucesso

[ ] 2. Server Actions - Family
      src/lib/actions/family.ts
      createFamily()
      inviteMember()
      addChild()

[ ] 3. Hooks - useFamily
      src/lib/hooks/useFamily.ts
      Retorna família, membros, currentMember, isAdmin, isPaid

[ ] 4. Página Família
      src/app/(app)/familia/page.tsx
      Lista de membros com avatares coloridos
      Formulário de convite (admin only)
      Formulário de adicionar filho

[ ] 5. Aceitar convite
      src/app/(auth)/invite/[token]/page.tsx
      Busca convite por token
      Login se necessário
      Chama accept_invitation RPC
      Redirect para /calendario

[ ] 6. Componentes de Calendário
      src/components/calendar/EventCard.tsx
      src/components/calendar/DayView.tsx
      src/components/calendar/WeekView.tsx
      src/components/calendar/MonthView.tsx
      src/components/calendar/CalendarView.tsx (orquestrador)

[ ] 7. Server Actions - Events
      src/lib/actions/events.ts
      createEvent()
      updateEvent()
      deleteEvent()

[ ] 8. Hooks - useEvents
      src/lib/hooks/useEvents.ts
      Query com filtro de data range e membro
      Inclui dados do membro (cor, nome)

[ ] 9. Formulário de Evento
      src/components/calendar/EventForm.tsx
      Campos: título, data/hora, membro, categoria, local
      Modo criação e edição
      Sheet/modal bottom (mobile-friendly)
      Validação com Zod

[ ] 10. Página Calendário
       src/app/(app)/calendario/page.tsx
       CalendarView com toggle dia/semana/mês
       Navegação por data (setas)
       Filtro por membro (chips coloridos)
       FAB "+" para novo evento

[ ] 11. Detecção de Conflitos (visual)
       Highlight de sobreposições no calendário
       Usar função detect_conflicts do banco
       ConflictOverlay com cores misturadas

[ ] 12. Componentes compartilhados
       MemberAvatar
       MemberColorDot
       SuccessPulse
       LoadingPulse
       EmptyState

[ ] 13. Notificações Web Push (básico)
       Service Worker (public/sw.js)
       Push subscription flow
       Salvar subscription no Supabase
       Testar envio manual

[ ] 14. Página Config (básica)
       src/app/(app)/config/page.tsx
       Editar perfil (nome, avatar)
       Logout
       Placeholder para futuras configs
```

### Critério de conclusão
- [ ] Usuário cria conta e família via onboarding
- [ ] Pode convidar parceiro(a) que aceita e entra na família
- [ ] Calendário exibe eventos com cores por membro
- [ ] CRUD completo de eventos funciona
- [ ] Conflitos de horário são visualmente indicados
- [ ] Views dia/semana/mês funcionam
- [ ] PWA instalável na home screen
- [ ] Deploy funcional na Vercel

---

## Fase 2 - Colaboração (Semanas 7-10)

### Checklist

```
[ ] 1. Supabase Realtime
      src/lib/hooks/useRealtime.ts
      Subscrever a changes em events, tasks
      Invalidar cache quando detecta mudança
      Testar: parceiro cria evento e aparece em tempo real

[ ] 2. Server Actions - Tasks
      src/lib/actions/tasks.ts
      createTask()
      toggleTask()
      deleteTask()
      reorderTasks() (drag-and-drop)

[ ] 3. Hooks - useTasks
      src/lib/hooks/useTasks.ts
      Query por família e lista
      Inclui membro atribuído

[ ] 4. Componentes de Tarefas
      TaskList (container com input inline)
      TaskItem (checkbox + avatar + swipe delete)
      TaskForm (criação com atribuição de membro)

[ ] 5. Página Tarefas
      src/app/(app)/tarefas/page.tsx
      Tabs por lista (Geral, + para nova lista no plano pago)
      Contador de pendentes por lista
      Realtime ativo

[ ] 6. Google Calendar Import
      OAuth2 com Google (calendar.readonly)
      Tabela google_connections (nova migration)
      Edge Function para importar eventos
      Deduplicação via external_id
      Config page: conectar/desconectar

[ ] 7. Vercel Cron - Notificação Matinal
      src/app/api/cron/morning-notification/route.ts
      Roda às 7h (configurar timezone)
      Respeita quiet hours e limite diário
      vercel.json com schedule

[ ] 8. Sistema de Notificações
      src/lib/hooks/useNotifications.ts
      Badge no Header com contagem de não lidas
      Dropdown/sheet com lista de notificações
      Mark as read individual e em massa
      Realtime para novas notificações

[ ] 9. Stripe Integration
      src/lib/stripe/client.ts
      src/lib/stripe/plans.ts
      src/app/api/stripe/webhook/route.ts
      Checkout flow (monthly + yearly)
      Portal do cliente (gerenciar assinatura)
      Paywalls nos limites (eventos, listas, membros)

[ ] 10. Paywall Component
       src/components/shared/Paywall.tsx
       Exibido quando limite é atingido
       Mostra benefícios do plano pago
       CTA para checkout
       Desconto anual destacado

[ ] 11. Config Expandida
       Quiet hours (editar horários)
       Máximo de notificações diárias
       Gerenciar assinatura (link para Stripe Portal)
       Google Calendar (conectar/status)
```

### Critério de conclusão
- [ ] Tarefas compartilhadas com realtime funcionam
- [ ] Google Calendar importa eventos (leitura)
- [ ] Notificação matinal é enviada via cron
- [ ] Stripe checkout funciona (mensal e anual)
- [ ] Paywalls bloqueiam features corretas no plano grátis
- [ ] Notificações aparecem em tempo real

---

## Fase 3 - Inteligência (Semanas 11-14)

### Checklist

```
[ ] 1. Edge Function - Categorização
      supabase/functions/ai-categorize/index.ts
      Integrar com Claude API (Haiku)
      Chamar ao criar evento (se plano pago)
      Atualizar categoria automaticamente

[ ] 2. Edge Function - UX Writing
      supabase/functions/ai-notify/index.ts
      Gerar mensagens matinais personalizadas
      Gerar lembretes contextuais
      Tom de voz "secretária executiva melhor amiga"

[ ] 3. Edge Function - Resolução de Conflitos
      supabase/functions/ai-conflict/index.ts
      Analisar conflito e sugerir resolução
      Input: dois eventos sobrepostos + contexto
      Output: sugestão textual + novo horário proposto

[ ] 4. Motor Janela de Qualidade
      Usar função find_quality_windows do banco
      UI: card "Tempo livre em família" no calendário
      Sugestões de atividade via Claude (se pago)
      Highlight dos gaps no CalendarView

[ ] 5. Relatório Semanal
      src/app/api/cron/weekly-report/route.ts
      Roda segundas às 9h
      Métricas: horas em família, eventos por categoria, conflitos resolvidos
      Notificação com resumo
      Página /relatorio com visualização

[ ] 6. Página Relatório
      src/app/(app)/relatorio/page.tsx
      Cards com métricas da semana
      Gráfico simples (barras por categoria)
      Comparação com semana anterior
      "Sua família passou X horas juntos!"

[ ] 7. Refino de Microinterações
      SuccessPulse em todas as ações de sucesso
      Transições de página com Framer Motion
      Skeleton loading nos cards
      Haptic feedback (navigator.vibrate) no mobile
      Pull-to-refresh no calendário

[ ] 8. Conflitos com IA
      ConflictOverlay: botão "Sugerir solução"
      Chama edge function ai-conflict
      Mostra sugestão em bottom sheet
      Botão "Aplicar sugestão" atualiza evento

[ ] 9. Analytics (PostHog)
      Instalar PostHog
      Eventos: signup, create_event, invite_sent, invite_accepted,
               task_created, upgrade_started, upgrade_completed
      Feature flags para rollout gradual da IA

[ ] 10. Polimento Final
       Testes em múltiplos dispositivos
       Performance audit (Lighthouse > 90)
       Acessibilidade audit (labels, ARIA, contraste)
       SEO da landing page
       Error boundaries e fallbacks
       Rate limiting nas Edge Functions
```

### Critério de conclusão
- [ ] IA categoriza eventos automaticamente
- [ ] Notificações matinais têm tom personalizado
- [ ] Conflitos podem ser resolvidos com sugestão de IA
- [ ] Janelas de qualidade aparecem no calendário
- [ ] Relatório semanal é enviado e visualizável
- [ ] Lighthouse score > 90 em todas as métricas
- [ ] PostHog tracking funcionando

---

## Comandos de Referência Rápida

```bash
# Dev local
npm run dev

# Supabase local
npx supabase start
npx supabase db push
npx supabase gen types typescript --linked > src/types/database.ts

# Deploy
git push origin main  # Vercel auto-deploy

# Stripe CLI (testar webhooks local)
stripe listen --forward-to localhost:3000/api/stripe/webhook

# Edge Functions
npx supabase functions serve ai-categorize --env-file .env.local
npx supabase functions deploy ai-categorize
```
