# Ello - Especificação de Componentes Frontend

## 1. Design Tokens (`tailwind.config.ts`)

```typescript
import type { Config } from "tailwindcss"

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ello: {
          indigo: "#3D405B",
          rosa: "#F49AC2",
          amarelo: "#FFC145",
          turquesa: "#70D6E3",
          offwhite: "#F9F9F7",
        },
        // Variações para hover/active
        "ello-indigo": {
          DEFAULT: "#3D405B",
          light: "#5A5D7A",
          dark: "#2A2D42",
        },
        "ello-turquesa": {
          DEFAULT: "#70D6E3",
          light: "#A3E5ED",
          dark: "#4BBFCF",
        },
      },
      fontFamily: {
        display: ["Tenor Sans", "system-ui", "sans-serif"],
        body: ["DM Sans", "system-ui", "sans-serif"],
      },
      borderRadius: {
        ello: "24px",     // Super-arredondado padrão
        "ello-sm": "16px",
        "ello-lg": "32px",
      },
      animation: {
        "pulse-success": "pulseSuccess 0.6s ease-out",
        "slide-up": "slideUp 0.3s ease-out",
        "fade-in": "fadeIn 0.2s ease-out",
      },
      keyframes: {
        pulseSuccess: {
          "0%": { boxShadow: "0 0 0 0 rgba(255, 193, 69, 0.7)" },
          "70%": { boxShadow: "0 0 0 20px rgba(255, 193, 69, 0)" },
          "100%": { boxShadow: "0 0 0 0 rgba(255, 193, 69, 0)" },
        },
        slideUp: {
          "0%": { transform: "translateY(10px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}

export default config
```

---

## 2. Globals CSS (`src/styles/globals.css`)

```css
@import url("https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&family=Tenor+Sans&display=swap");

@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --color-indigo: 61 64 91;
    --color-rosa: 244 154 194;
    --color-amarelo: 255 193 69;
    --color-turquesa: 112 214 227;
    --color-offwhite: 249 249 247;
    --radius: 24px;
  }

  body {
    @apply bg-ello-offwhite text-ello-indigo font-body antialiased;
  }

  h1, h2, h3, h4 {
    @apply font-display;
  }

  /* Texto longo com opacidade reduzida */
  .text-body-soft {
    @apply text-ello-indigo/80;
  }
}

@layer utilities {
  /* Cor de membro dinâmica via CSS variable */
  .member-color {
    background-color: var(--member-color);
  }
  .member-color-text {
    color: var(--member-color);
  }
  .member-color-border {
    border-color: var(--member-color);
  }
}
```

---

## 3. Mapa de Cores por Membro (`src/lib/utils/colors.ts`)

```typescript
export const SYNERGY_PALETTE = {
  indigo: "#3D405B",
  rosa: "#F49AC2",
  amarelo: "#FFC145",
  turquesa: "#70D6E3",
} as const

export const MEMBER_COLORS = [
  { key: "indigo", hex: "#3D405B", label: "Indigo Profundo", bg: "bg-ello-indigo", text: "text-white" },
  { key: "rosa", hex: "#F49AC2", label: "Rosa Chiclete", bg: "bg-ello-rosa", text: "text-ello-indigo" },
  { key: "amarelo", hex: "#FFC145", label: "Amarelo Manga", bg: "bg-ello-amarelo", text: "text-ello-indigo" },
  { key: "turquesa", hex: "#70D6E3", label: "Turquesa Elétrico", bg: "bg-ello-turquesa", text: "text-ello-indigo" },
] as const

export function getMemberColor(hex: string) {
  return MEMBER_COLORS.find(c => c.hex === hex) ?? MEMBER_COLORS[0]
}

export function getNextAvailableColor(usedColors: string[]): string {
  const available = MEMBER_COLORS.filter(c => !usedColors.includes(c.hex))
  return available[0]?.hex ?? MEMBER_COLORS[0].hex
}

// Gera cor de sobreposição para conflitos
export function getConflictBlendColor(colorA: string, colorB: string): string {
  const hexToRgb = (hex: string) => {
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)
    return { r, g, b }
  }
  const a = hexToRgb(colorA)
  const b = hexToRgb(colorB)
  const mix = {
    r: Math.round((a.r + b.r) / 2),
    g: Math.round((a.g + b.g) / 2),
    b: Math.round((a.b + b.b) / 2),
  }
  return `#${mix.r.toString(16).padStart(2,"0")}${mix.g.toString(16).padStart(2,"0")}${mix.b.toString(16).padStart(2,"0")}`
}
```

---

## 4. Componentes Principais

### 4.1. EventCard

```
Arquivo: src/components/calendar/EventCard.tsx
Tipo: Client Component ("use client")
Props:
  - event: Event (id, title, starts_at, ends_at, category, member)
  - compact?: boolean (para visão mensal)
  - onClick: (event) => void

Comportamento:
  - Borda esquerda 4px com cor do membro
  - Border-radius: 24px (rounded-ello)
  - Background: cor do membro com 10% opacidade
  - Ao clicar: abre EventForm em modo edição
  - Animação de entrada: slideUp com Framer Motion
  - Se evento é "agora": pulso sutil na borda

Variantes:
  - compact: altura menor, só título e horário
  - expanded: título, horário, local, categoria
  - conflict: borda tracejada, fundo com mix-blend-mode

Tailwind classes base:
  "rounded-ello p-4 border-l-4 cursor-pointer
   transition-all duration-200 hover:shadow-md
   animate-slide-up"
```

### 4.2. CalendarView

```
Arquivo: src/components/calendar/CalendarView.tsx
Tipo: Client Component
Props:
  - familyId: string
  - view: "day" | "week" | "month"
  - date: Date
  - onDateChange: (date: Date) => void
  - onViewChange: (view) => void

Comportamento:
  - Header com setas de navegação e seletor de view
  - Filtro por membro (toggle chips coloridos)
  - Renderiza DayView, WeekView ou MonthView
  - Usa useEvents hook para dados
  - Usa useRealtime para updates em tempo real
  - FAB (floating action button) para criar evento

Sub-componentes:
  - DayView: timeline vertical 7h-22h, eventos posicionados
  - WeekView: 7 colunas, eventos como blocos
  - MonthView: grid 7x5/6, dots coloridos por evento
```

### 4.3. ConflictOverlay

```
Arquivo: src/components/calendar/ConflictOverlay.tsx
Tipo: Client Component
Props:
  - conflicts: Conflict[] (da função detect_conflicts)
  - onResolve: (conflictId, suggestion) => void

Comportamento:
  - Overlay semi-transparente na área de sobreposição
  - Cor: mix das cores dos dois membros
  - Badge "Conflito" com ícone de alerta
  - Ao clicar: bottom sheet com sugestões de resolução
  - No plano pago: sugestão gerada por IA

Design:
  - Background: getConflictBlendColor() com opacity 0.3
  - Border: dashed 2px na cor mais escura
  - mix-blend-mode: multiply no background
```

### 4.4. TaskList / TaskItem

```
Arquivo: src/components/tasks/TaskList.tsx
Tipo: Client Component
Props:
  - familyId: string
  - listName: string

TaskItem Props:
  - task: Task
  - members: Member[]
  - onToggle: (taskId) => void
  - onDelete: (taskId) => void

Comportamento TaskList:
  - Header com nome da lista e contagem
  - Input inline para nova tarefa (press Enter para criar)
  - Drag-and-drop para reordenar (futuro)
  - Realtime: atualiza quando outro membro muda

Comportamento TaskItem:
  - Checkbox customizado com cor do membro atribuído
  - Ao marcar como done: animação pulse-success
  - Swipe left para deletar (mobile)
  - Avatar do membro atribuído no canto direito
  - Texto riscado quando status = done
```

### 4.5. AppShell / BottomNav

```
Arquivo: src/components/layout/AppShell.tsx
Tipo: Client Component
Props:
  - children: ReactNode

Estrutura:
  - Header fixo: logo Ello + nome da família + sino de notificações + avatar
  - Conteúdo scrollável: {children}
  - BottomNav fixo: 4 tabs

BottomNav tabs:
  1. Calendário (ícone: calendar) - /calendario
  2. Tarefas (ícone: check-square) - /tarefas
  3. Família (ícone: users) - /familia
  4. Config (ícone: settings) - /config

Design:
  - Header: bg-white shadow-sm h-14
  - BottomNav: bg-white border-t h-16
  - Tab ativo: cor turquesa, ícone preenchido
  - Tab inativo: cor indigo com opacity 0.4
  - Safe area padding para notch/home indicator
```

### 4.6. MemberAvatar

```
Arquivo: src/components/family/MemberAvatar.tsx
Tipo: Server Component (pode ser)
Props:
  - member: { display_name, color, avatar_url }
  - size?: "sm" | "md" | "lg" (default: "md")
  - showName?: boolean

Comportamento:
  - Se avatar_url: exibir imagem circular
  - Se não: círculo com inicial do nome na cor do membro
  - Borda 2px na cor do membro
  - showName: nome abaixo do avatar

Sizes:
  - sm: w-8 h-8, text-xs
  - md: w-10 h-10, text-sm
  - lg: w-14 h-14, text-base
```

### 4.7. SuccessPulse

```
Arquivo: src/components/shared/SuccessPulse.tsx
Tipo: Client Component
Props:
  - trigger: boolean
  - children: ReactNode

Comportamento:
  - Quando trigger = true: aplica animação pulse-success
  - Glow amarelo manga que expande e desaparece
  - Duração: 600ms
  - Usa Framer Motion para controle

Implementação:
  <motion.div
    animate={trigger ? { scale: [1, 1.02, 1] } : {}}
    className={trigger ? "animate-pulse-success" : ""}
  >
    {children}
  </motion.div>
```

### 4.8. InviteForm

```
Arquivo: src/components/family/InviteForm.tsx
Tipo: Client Component
Props:
  - familyId: string
  - onSuccess: () => void

Comportamento:
  - Input de email com validação
  - Botão "Convidar" com loading state
  - Chama server action inviteMember
  - Sucesso: toast "Convite enviado!" + SuccessPulse
  - Erro: toast com mensagem (limite atingido, etc.)
  - Mostrar lista de convites pendentes abaixo
```

---

## 5. Hooks Customizados (`src/lib/hooks/`)

### 5.1. useFamily

```typescript
// Retorna dados da família atual do usuário
// Inclui membros, subscription status, etc.
// Cache com React Query / SWR

interface UseFamily {
  family: Family | null
  members: Member[]
  currentMember: Member | null
  isAdmin: boolean
  isPaid: boolean
  isLoading: boolean
  error: Error | null
}
```

### 5.2. useEvents

```typescript
// Retorna eventos filtrados por data e membro
// Suporta range de datas para views de semana/mês

interface UseEvents {
  events: Event[]
  conflicts: Conflict[]
  isLoading: boolean
  createEvent: (data) => Promise<void>
  updateEvent: (id, data) => Promise<void>
  deleteEvent: (id) => Promise<void>
}

// Parâmetros
useEvents({
  familyId: string
  startDate: Date
  endDate: Date
  memberIds?: string[] // filtro por membro
})
```

### 5.3. useTasks

```typescript
interface UseTasks {
  tasks: Task[]
  lists: string[] // nomes únicos de listas
  isLoading: boolean
  createTask: (data) => Promise<void>
  toggleTask: (id) => Promise<void>
  deleteTask: (id) => Promise<void>
}
```

### 5.4. useRealtime

```typescript
// Subscreve a mudanças em tempo real via Supabase Realtime
// Invalida cache quando detecta INSERT/UPDATE/DELETE

useRealtime({
  table: "events" | "tasks" | "notifications"
  familyId: string
  onInsert?: (payload) => void
  onUpdate?: (payload) => void
  onDelete?: (payload) => void
})
```

### 5.5. useSubscription

```typescript
interface UseSubscription {
  status: SubscriptionStatus
  isPaid: boolean
  isTrial: boolean
  trialDaysLeft: number | null
  canUseFeature: (feature: PaidFeature) => boolean
  openCheckout: () => Promise<void>
  openPortal: () => Promise<void>
}

type PaidFeature =
  | "unlimited_events"
  | "google_calendar_sync"
  | "ai_categorization"
  | "ai_notifications"
  | "weekly_report"
  | "unlimited_lists"
  | "extra_members"
```

---

## 6. Páginas

### 6.1. `/calendario` (página principal)

```
Layout: AppShell
Componentes: CalendarView + EventForm (sheet)
Dados: useEvents + useFamily + useRealtime("events")
Estado: view (day/week/month), selectedDate, selectedEvent

Fluxo:
1. Carrega eventos da semana atual
2. Renderiza CalendarView com filtros
3. FAB "+" abre EventForm em sheet
4. Click em evento abre EventForm em modo edição
5. Realtime atualiza quando parceiro cria/edita evento
```

### 6.2. `/tarefas`

```
Layout: AppShell
Componentes: TaskList + TaskForm (inline)
Dados: useTasks + useFamily + useRealtime("tasks")

Fluxo:
1. Tabs por lista (se plano pago: múltiplas listas)
2. Input inline no topo para criar tarefa rápida
3. Checkbox para marcar como feita
4. Atribuir membro via avatar picker
5. Realtime sincroniza entre membros
```

### 6.3. `/familia`

```
Layout: AppShell
Componentes: MemberList + InviteForm + ChildForm
Dados: useFamily

Seções:
1. Lista de membros com avatar, nome, cor e role
2. Botão "Convidar parceiro(a)" (se admin)
3. Botão "Adicionar filho" (se admin)
4. Convites pendentes
5. Se plano grátis: banner de upgrade
```

### 6.4. `/config`

```
Layout: AppShell

Seções:
1. Perfil do membro (nome, avatar)
2. Notificações (quiet hours, máximo diário)
3. Plano/Assinatura (status, upgrade, gerenciar)
4. Google Calendar (conectar/desconectar) [Fase 2]
5. Sobre o Ello
6. Sair
```

---

## 7. PWA Config (`public/manifest.json`)

```json
{
  "name": "Ello - Logística Familiar",
  "short_name": "Ello",
  "description": "Sua família em sintonia",
  "start_url": "/calendario",
  "display": "standalone",
  "background_color": "#F9F9F7",
  "theme_color": "#3D405B",
  "orientation": "portrait",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" },
    { "src": "/icons/icon-maskable.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
  ]
}
```
