# Ello - Assistente de Logística Familiar Inteligente
# .cursorrules - Contexto para desenvolvimento com Cursor + Claude

## Sobre o Projeto
Ello é uma plataforma web (PWA) de organização familiar para casais e famílias. Transforma o caos logístico em tempo de qualidade. Tom de voz: "Secretária Executiva, mas Melhor Amiga" — calma, direta, útil, encorajadora.

## Stack Técnica
- **Frontend**: Next.js 14+ (App Router) com TypeScript
- **Styling**: Tailwind CSS + shadcn/ui (customizado com Synergy Palette)
- **Animações**: Framer Motion
- **Auth**: Supabase Auth (Magic Link + Google OAuth)
- **Database**: Supabase PostgreSQL com Row Level Security (RLS)
- **Realtime**: Supabase Realtime (WebSockets)
- **Storage**: Supabase Storage
- **AI**: Claude API (Haiku) via Supabase Edge Functions
- **Deploy**: Vercel
- **Cron**: Vercel Cron Functions
- **Pagamento**: Stripe (PIX + cartão)

## Design System - Synergy Palette

### Cores (CSS Variables)
```css
--color-indigo: #3D405B;      /* Estrutura, texto, Calendário Pai */
--color-rosa: #F49AC2;        /* Emoção, Calendário Mãe */
--color-amarelo: #FFC145;     /* Foco, botões secundários, Filho 1 */
--color-turquesa: #70D6E3;    /* CTA, conexão, Compartilhado */
--color-offwhite: #F9F9F7;    /* Background principal */
```

### Tipografia
- Títulos: `Tenor Sans` (Google Fonts)
- Body: `DM Sans` (Google Fonts)
- Fallback: `system-ui, -apple-system, sans-serif`

### Componentes
- Border radius padrão: `24px` (super-arredondado)
- Cards de evento herdam cor do membro atribuído
- Conflitos visuais: cards se sobrepõem com `mix-blend-mode`
- Animação de sucesso: pulso de luz em `--color-amarelo`
- Textos longos: `--color-indigo` com `opacity: 0.8`

## Estrutura de Pastas
```
ello/
├── .cursorrules
├── next.config.ts
├── tailwind.config.ts
├── package.json
├── supabase/
│   ├── migrations/
│   │   ├── 001_schema.sql
│   │   ├── 002_rls_policies.sql
│   │   ├── 003_functions.sql
│   │   └── 004_seed.sql
│   └── functions/
│       ├── ai-categorize/
│       ├── ai-notify/
│       └── ai-conflict/
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx              # Landing / Login
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx
│   │   │   ├── callback/route.ts
│   │   │   └── invite/[token]/page.tsx
│   │   ├── (app)/
│   │   │   ├── layout.tsx        # App shell com sidebar/nav
│   │   │   ├── calendario/page.tsx
│   │   │   ├── tarefas/page.tsx
│   │   │   ├── familia/page.tsx
│   │   │   ├── config/page.tsx
│   │   │   └── relatorio/page.tsx
│   │   └── api/
│   │       ├── stripe/webhook/route.ts
│   │       └── cron/
│   │           ├── morning-notification/route.ts
│   │           └── weekly-report/route.ts
│   ├── components/
│   │   ├── ui/                   # shadcn/ui customizados
│   │   ├── calendar/
│   │   │   ├── CalendarView.tsx
│   │   │   ├── DayView.tsx
│   │   │   ├── WeekView.tsx
│   │   │   ├── MonthView.tsx
│   │   │   ├── EventCard.tsx
│   │   │   ├── EventForm.tsx
│   │   │   └── ConflictOverlay.tsx
│   │   ├── tasks/
│   │   │   ├── TaskList.tsx
│   │   │   ├── TaskItem.tsx
│   │   │   └── TaskForm.tsx
│   │   ├── family/
│   │   │   ├── MemberList.tsx
│   │   │   ├── MemberAvatar.tsx
│   │   │   ├── InviteForm.tsx
│   │   │   └── ChildForm.tsx
│   │   ├── layout/
│   │   │   ├── AppShell.tsx
│   │   │   ├── BottomNav.tsx
│   │   │   ├── Header.tsx
│   │   │   └── MemberColorDot.tsx
│   │   └── shared/
│   │       ├── LoadingPulse.tsx
│   │       ├── EmptyState.tsx
│   │       └── SuccessPulse.tsx
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts         # Browser client
│   │   │   ├── server.ts         # Server client
│   │   │   ├── middleware.ts     # Auth middleware
│   │   │   └── types.ts          # Generated types
│   │   ├── stripe/
│   │   │   ├── client.ts
│   │   │   └── plans.ts
│   │   ├── utils/
│   │   │   ├── colors.ts         # Synergy Palette helpers
│   │   │   ├── dates.ts          # Date formatting/logic
│   │   │   ├── conflicts.ts      # Conflict detection client-side
│   │   │   └── notifications.ts  # Web Push helpers
│   │   └── hooks/
│   │       ├── useFamily.ts
│   │       ├── useEvents.ts
│   │       ├── useTasks.ts
│   │       ├── useMembers.ts
│   │       ├── useRealtime.ts
│   │       └── useSubscription.ts
│   ├── types/
│   │   ├── database.ts           # Supabase generated
│   │   ├── events.ts
│   │   ├── members.ts
│   │   └── tasks.ts
│   └── styles/
│       └── globals.css
└── public/
    ├── manifest.json             # PWA manifest
    ├── sw.js                     # Service Worker
    └── icons/
```

## Convenções de Código
1. **TypeScript strict** em todo o projeto
2. **Server Components por padrão** — usar `"use client"` somente quando necessário
3. **Naming**: PascalCase para componentes, camelCase para funções/variáveis, UPPER_SNAKE para constantes
4. **Imports**: absolutos com `@/` (ex: `@/components/calendar/EventCard`)
5. **Hooks customizados**: prefixo `use` + recurso (ex: `useEvents`, `useFamily`)
6. **Queries Supabase**: sempre via hooks em `src/lib/hooks/`
7. **Validação**: Zod para forms e API routes
8. **Erros**: sempre tratar com try/catch e feedback visual ao usuário
9. **Acessibilidade**: labels em todos os inputs, roles ARIA nos componentes interativos
10. **Mobile-first**: breakpoints `sm:` `md:` `lg:` — começar pelo mobile

## Regras de Negócio Importantes
- Cada família tem no máximo 6 membros (plano pago) ou 2 (grátis)
- Cada membro tem uma cor fixa da Synergy Palette
- Notificações: máximo 3/dia/membro, quiet hours 22h-7h
- Eventos pertencem a um membro mas são visíveis por toda a família
- RLS garante isolamento total por family_id
- Filhos são perfis gerenciados (sem auth próprio)
- Plano grátis: 50 eventos/mês, 1 lista de tarefas
- Plano família: R$ 24/mês ou R$ 229/ano

## Contexto para IA (Claude API)
- Usar modelo `claude-haiku` para custo baixo
- Categorias de evento: saude, lazer, escola, trabalho, outro
- UX Writing: gerar mensagens com tom caloroso e contextual
- Detecção de conflitos: comparar tsrange entre eventos da mesma família
- Janela de Qualidade: identificar gaps comuns em todas as agendas
