# Ello - Setup Supabase, Auth e Integrações

## 1. Supabase Client Setup

### 1.1. Browser Client (`src/lib/supabase/client.ts`)

```typescript
import { createBrowserClient } from "@supabase/ssr"
import type { Database } from "@/types/database"

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

### 1.2. Server Client (`src/lib/supabase/server.ts`)

```typescript
import { createServerClient as createSSRClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import type { Database } from "@/types/database"

export async function createServerClient() {
  const cookieStore = await cookies()

  return createSSRClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Server Component - ignore
          }
        },
      },
    }
  )
}
```

### 1.3. Middleware (`src/middleware.ts`)

```typescript
import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // Rotas protegidas
  const protectedPaths = ["/calendario", "/tarefas", "/familia", "/config", "/relatorio"]
  const isProtected = protectedPaths.some(p => request.nextUrl.pathname.startsWith(p))

  if (isProtected && !user) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  // Se logado e acessando login, redirecionar para app
  if (user && request.nextUrl.pathname === "/login") {
    return NextResponse.redirect(new URL("/calendario", request.url))
  }

  return response
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icons|manifest.json|sw.js).*)",
  ],
}
```

---

## 2. Fluxo de Autenticação

### 2.1. Login Page (`src/app/(auth)/login/page.tsx`)

```
Fluxo:
1. Usuário escolhe: Magic Link OU Google OAuth
2. Magic Link: input de email -> Supabase envia email -> redirect para /callback
3. Google OAuth: botão -> redirect Google -> callback Supabase -> /callback

Após primeiro login:
- Se usuário NÃO tem família: redirecionar para /onboarding
- Se usuário TEM família: redirecionar para /calendario
- Se veio de link de convite (/invite/[token]): processar convite primeiro
```

### 2.2. Auth Callback (`src/app/(auth)/callback/route.ts`)

```typescript
import { createServerClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const next = searchParams.get("next") ?? "/calendario"

  if (code) {
    const supabase = await createServerClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      // Verificar se usuário tem família
      const { data: { user } } = await supabase.auth.getUser()
      const { data: member } = await supabase
        .from("members")
        .select("family_id")
        .eq("user_id", user!.id)
        .limit(1)
        .single()

      if (!member) {
        // Primeiro acesso: onboarding
        return NextResponse.redirect(`${origin}/onboarding`)
      }

      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`)
}
```

### 2.3. Aceitar Convite (`src/app/(auth)/invite/[token]/page.tsx`)

```
Fluxo:
1. Página carrega com token do convite
2. Busca dados do convite (nome da família, quem convidou)
3. Se convite válido: mostra card "Fulano te convidou para a família X"
4. Botão "Aceitar e entrar" -> login (se necessário) -> accept_invitation RPC
5. Se convite expirado: mostra mensagem e link para pedir novo convite
6. Após aceitar: redirect para /calendario
```

---

## 3. Onboarding Flow (`src/app/(auth)/onboarding/page.tsx`)

```
Step 1: "Como podemos te chamar?"
  - Input: display_name
  - Já seleciona a primeira cor (Indigo por padrão)

Step 2: "Dê um nome para sua família"
  - Input: family_name (sugestão: "Família [Sobrenome]")

Step 3: "Convide quem divide a rotina com você"
  - Input: email do parceiro(a)
  - Botão "Pular por agora"

Step 4: "Pronto! Sua rotina agora tem um lar."
  - Animação de boas-vindas (Framer Motion)
  - CTA: "Criar primeiro evento" -> redirect /calendario

Implementação:
  - Wizard multi-step com estado local
  - No Step 2: chama createFamily server action
  - No Step 3: chama inviteMember server action
  - Barra de progresso no topo com cores da Synergy Palette
```

---

## 4. Google Calendar Integration (Fase 2)

### 4.1. Fluxo de Conexão

```
1. Usuário vai em Config > Google Calendar > "Conectar"
2. OAuth2 com Google (scope: calendar.readonly)
3. Salvar refresh_token criptografado no Supabase
4. Cron job periódico busca eventos e importa

Tabela adicional (migração futura):
  google_connections (
    id UUID PK,
    member_id UUID FK,
    access_token TEXT (criptografado),
    refresh_token TEXT (criptografado),
    calendar_ids TEXT[], -- quais calendários importar
    last_synced_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ
  )
```

### 4.2. Import Logic

```
- Frequência: a cada 15 minutos via Vercel Cron
- Somente leitura (import unidirecional)
- Eventos importados recebem synced_from = 'google_calendar'
- Deduplicação via external_id
- Não importar eventos recusados ou cancelados
- Categorização automática via Claude API (Fase 3)
```

---

## 5. Stripe Integration

### 5.1. Plans Config (`src/lib/stripe/plans.ts`)

```typescript
export const PLANS = {
  free: {
    name: "Grátis",
    price: 0,
    maxMembers: 2,
    maxEventsPerMonth: 50,
    maxLists: 1,
    features: {
      googleCalendarSync: false,
      aiCategorization: false,
      aiNotifications: false,
      weeklyReport: false,
    },
  },
  monthly: {
    name: "Família Mensal",
    priceId: process.env.STRIPE_PRICE_MONTHLY!, // R$ 24/mês
    price: 2400, // centavos
    maxMembers: 6,
    maxEventsPerMonth: Infinity,
    maxLists: Infinity,
    features: {
      googleCalendarSync: true,
      aiCategorization: true,
      aiNotifications: true,
      weeklyReport: true,
    },
  },
  yearly: {
    name: "Família Anual",
    priceId: process.env.STRIPE_PRICE_YEARLY!, // R$ 229/ano
    price: 22900,
    maxMembers: 6,
    maxEventsPerMonth: Infinity,
    maxLists: Infinity,
    features: {
      googleCalendarSync: true,
      aiCategorization: true,
      aiNotifications: true,
      weeklyReport: true,
    },
  },
} as const

export type PlanType = keyof typeof PLANS
```

### 5.2. Checkout Flow

```
1. Usuário clica "Upgrade" em qualquer paywall
2. Server action cria Stripe Checkout Session:
   - mode: "subscription"
   - metadata: { family_id }
   - success_url: /config?upgrade=success
   - cancel_url: /config
   - payment_method_types: ["card"] (PIX via Stripe)
   - allow_promotion_codes: true
3. Redirect para Stripe Checkout
4. Stripe envia webhook checkout.session.completed
5. Webhook atualiza families.subscription_status = "active"
6. Usuário volta para /config com toast de sucesso
```

---

## 6. Variáveis de Ambiente

### `.env.local`

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...
SUPABASE_SERVICE_ROLE_KEY=eyJhbG...

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_MONTHLY=price_...
STRIPE_PRICE_YEARLY=price_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...

# Claude API (usado nas Edge Functions)
CLAUDE_API_KEY=sk-ant-...

# Cron
CRON_SECRET=random-secret-string

# Google OAuth (Fase 2)
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...

# Web Push VAPID Keys
NEXT_PUBLIC_VAPID_PUBLIC_KEY=...
VAPID_PRIVATE_KEY=...
```

---

## 7. Package.json (dependências essenciais)

```json
{
  "dependencies": {
    "next": "^14.2",
    "@supabase/ssr": "^0.5",
    "@supabase/supabase-js": "^2.45",
    "stripe": "^16",
    "zod": "^3.23",
    "framer-motion": "^11",
    "date-fns": "^3",
    "lucide-react": "^0.400",
    "class-variance-authority": "^0.7",
    "clsx": "^2",
    "tailwind-merge": "^2",
    "web-push": "^3.6"
  },
  "devDependencies": {
    "typescript": "^5.5",
    "@types/node": "^20",
    "@types/react": "^18",
    "tailwindcss": "^3.4",
    "postcss": "^8",
    "autoprefixer": "^10",
    "supabase": "^1.190"
  }
}
```
