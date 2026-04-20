# Ello - Especificação de APIs e Server Actions

## Visão Geral
O Ello usa uma combinação de:
- **Server Actions** (Next.js) para mutações simples (CRUD)
- **API Routes** (Next.js) para webhooks e crons
- **Supabase Edge Functions** para lógica com IA (Claude API)

Todas as queries e mutações passam pelo Supabase Client com RLS ativo.

---

## 1. Server Actions (`src/lib/actions/`)

### 1.1. Família (`family.ts`)

```typescript
"use server"

import { createServerClient } from "@/lib/supabase/server"
import { z } from "zod"
import { revalidatePath } from "next/cache"

const CreateFamilySchema = z.object({
  name: z.string().min(1).max(50),
  displayName: z.string().min(1).max(30),
})

export async function createFamily(formData: FormData) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Não autenticado")

  const parsed = CreateFamilySchema.parse({
    name: formData.get("name"),
    displayName: formData.get("displayName"),
  })

  // 1. Criar família
  const { data: family, error: famErr } = await supabase
    .from("families")
    .insert({ name: parsed.name, created_by: user.id })
    .select()
    .single()
  if (famErr) throw famErr

  // 2. Criar membro admin
  const { error: memErr } = await supabase
    .from("members")
    .insert({
      family_id: family.id,
      user_id: user.id,
      role: "admin",
      display_name: parsed.displayName,
      color: "#3D405B", // Indigo = primeiro membro
    })
  if (memErr) throw memErr

  revalidatePath("/")
  return { familyId: family.id }
}

export async function inviteMember(familyId: string, email: string) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Não autenticado")

  // Verificar se é admin
  const { data: member } = await supabase
    .from("members")
    .select("id, role")
    .eq("family_id", familyId)
    .eq("user_id", user.id)
    .single()
  if (member?.role !== "admin") throw new Error("Sem permissão")

  // Verificar limite de membros (plano grátis = 2, pago = 6)
  const { count } = await supabase
    .from("members")
    .select("*", { count: "exact", head: true })
    .eq("family_id", familyId)
  
  const { data: family } = await supabase
    .from("families")
    .select("subscription_status")
    .eq("id", familyId)
    .single()
  
  const maxMembers = family?.subscription_status === "free" ? 2 : 6
  if ((count ?? 0) >= maxMembers) throw new Error("Limite de membros atingido")

  // Criar convite
  const { data: invitation, error } = await supabase
    .from("invitations")
    .insert({
      family_id: familyId,
      invited_by: member.id,
      email,
    })
    .select()
    .single()
  if (error) throw error

  // TODO: Enviar email com link do convite
  // await sendInviteEmail(email, invitation.token)

  revalidatePath("/familia")
  return { token: invitation.token }
}

export async function addChild(familyId: string, name: string) {
  const supabase = await createServerClient()
  
  // Cores disponíveis
  const { data: usedColors } = await supabase
    .from("members")
    .select("color")
    .eq("family_id", familyId)
  
  const palette = ["#3D405B", "#F49AC2", "#FFC145", "#70D6E3"]
  const used = usedColors?.map(m => m.color) ?? []
  const available = palette.filter(c => !used.includes(c))
  const color = available[0] ?? "#3D405B"

  const { error } = await supabase
    .from("members")
    .insert({
      family_id: familyId,
      user_id: null, // filho não tem auth
      role: "child",
      display_name: name,
      color,
    })
  if (error) throw error

  revalidatePath("/familia")
}
```

### 1.2. Eventos (`events.ts`)

```typescript
"use server"

import { createServerClient } from "@/lib/supabase/server"
import { z } from "zod"
import { revalidatePath } from "next/cache"

const EventSchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  memberId: z.string().uuid(),
  startsAt: z.string().datetime(),
  endsAt: z.string().datetime(),
  allDay: z.boolean().default(false),
  category: z.enum(["saude", "lazer", "escola", "trabalho", "outro"]).default("outro"),
  location: z.string().max(200).optional(),
})

export async function createEvent(familyId: string, data: z.infer<typeof EventSchema>) {
  const supabase = await createServerClient()
  const parsed = EventSchema.parse(data)

  // Verificar limite mensal (plano grátis = 50)
  const { data: family } = await supabase
    .from("families")
    .select("subscription_status")
    .eq("id", familyId)
    .single()

  if (family?.subscription_status === "free") {
    const { data: count } = await supabase.rpc("count_monthly_events", { p_family_id: familyId })
    if ((count ?? 0) >= 50) throw new Error("Limite mensal de eventos atingido. Faça upgrade para o Plano Família.")
  }

  // Buscar member_id do usuário atual para created_by
  const { data: { user } } = await supabase.auth.getUser()
  const { data: member } = await supabase
    .from("members")
    .select("id")
    .eq("family_id", familyId)
    .eq("user_id", user!.id)
    .single()

  const { data: event, error } = await supabase
    .from("events")
    .insert({
      family_id: familyId,
      member_id: parsed.memberId,
      created_by: member!.id,
      title: parsed.title,
      description: parsed.description,
      starts_at: parsed.startsAt,
      ends_at: parsed.endsAt,
      all_day: parsed.allDay,
      category: parsed.category,
      location: parsed.location,
      synced_from: "manual",
    })
    .select()
    .single()
  if (error) throw error

  revalidatePath("/calendario")
  return event
}

export async function updateEvent(eventId: string, data: Partial<z.infer<typeof EventSchema>>) {
  const supabase = await createServerClient()

  const updateData: Record<string, any> = {}
  if (data.title) updateData.title = data.title
  if (data.description !== undefined) updateData.description = data.description
  if (data.memberId) updateData.member_id = data.memberId
  if (data.startsAt) updateData.starts_at = data.startsAt
  if (data.endsAt) updateData.ends_at = data.endsAt
  if (data.allDay !== undefined) updateData.all_day = data.allDay
  if (data.category) updateData.category = data.category
  if (data.location !== undefined) updateData.location = data.location

  const { error } = await supabase
    .from("events")
    .update(updateData)
    .eq("id", eventId)
  if (error) throw error

  revalidatePath("/calendario")
}

export async function deleteEvent(eventId: string) {
  const supabase = await createServerClient()
  const { error } = await supabase
    .from("events")
    .delete()
    .eq("id", eventId)
  if (error) throw error

  revalidatePath("/calendario")
}
```

### 1.3. Tarefas (`tasks.ts`)

```typescript
"use server"

import { createServerClient } from "@/lib/supabase/server"
import { z } from "zod"
import { revalidatePath } from "next/cache"

const TaskSchema = z.object({
  title: z.string().min(1).max(200),
  notes: z.string().max(500).optional(),
  assignedTo: z.string().uuid().optional(),
  listName: z.string().max(50).default("Geral"),
  dueDate: z.string().optional(),
})

export async function createTask(familyId: string, data: z.infer<typeof TaskSchema>) {
  const supabase = await createServerClient()
  const parsed = TaskSchema.parse(data)

  const { data: { user } } = await supabase.auth.getUser()
  const { data: member } = await supabase
    .from("members")
    .select("id")
    .eq("family_id", familyId)
    .eq("user_id", user!.id)
    .single()

  // Verificar limite de listas (grátis = 1 lista)
  const { data: family } = await supabase
    .from("families")
    .select("subscription_status")
    .eq("id", familyId)
    .single()

  if (family?.subscription_status === "free" && parsed.listName !== "Geral") {
    const { data: lists } = await supabase
      .from("tasks")
      .select("list_name")
      .eq("family_id", familyId)
    const uniqueLists = new Set(lists?.map(t => t.list_name))
    if (uniqueLists.size >= 1 && !uniqueLists.has(parsed.listName)) {
      throw new Error("Plano grátis suporta apenas 1 lista. Faça upgrade.")
    }
  }

  const { error } = await supabase
    .from("tasks")
    .insert({
      family_id: familyId,
      created_by: member!.id,
      title: parsed.title,
      notes: parsed.notes,
      assigned_to: parsed.assignedTo,
      list_name: parsed.listName,
      due_date: parsed.dueDate,
    })
  if (error) throw error

  revalidatePath("/tarefas")
}

export async function toggleTask(taskId: string) {
  const supabase = await createServerClient()
  
  const { data: task } = await supabase
    .from("tasks")
    .select("status")
    .eq("id", taskId)
    .single()
  if (!task) throw new Error("Tarefa não encontrada")

  const newStatus = task.status === "pending" ? "done" : "pending"
  
  const { error } = await supabase
    .from("tasks")
    .update({ status: newStatus })
    .eq("id", taskId)
  if (error) throw error

  revalidatePath("/tarefas")
}

export async function deleteTask(taskId: string) {
  const supabase = await createServerClient()
  const { error } = await supabase.from("tasks").delete().eq("id", taskId)
  if (error) throw error
  revalidatePath("/tarefas")
}
```

### 1.4. Notificações (`notifications.ts`)

```typescript
"use server"

import { createServerClient } from "@/lib/supabase/server"

export async function markNotificationRead(notificationId: string) {
  const supabase = await createServerClient()
  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", notificationId)
  if (error) throw error
}

export async function markAllNotificationsRead(memberId: string) {
  const supabase = await createServerClient()
  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("member_id", memberId)
    .is("read_at", null)
  if (error) throw error
}
```

---

## 2. API Routes

### 2.1. Stripe Webhook (`src/app/api/stripe/webhook/route.ts`)

```typescript
import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { createClient } from "@supabase/supabase-js"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // service role para bypass RLS
)

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get("stripe-signature")!

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch {
    return NextResponse.json({ error: "Webhook inválido" }, { status: 400 })
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session
      const familyId = session.metadata?.family_id
      if (familyId) {
        await supabase
          .from("families")
          .update({
            subscription_status: "active",
            stripe_customer_id: session.customer as string,
            stripe_subscription_id: session.subscription as string,
          })
          .eq("id", familyId)
      }
      break
    }

    case "customer.subscription.updated": {
      const subscription = event.data.object as Stripe.Subscription
      const status = subscription.status === "active" ? "active" :
                     subscription.status === "past_due" ? "past_due" : "cancelled"
      await supabase
        .from("families")
        .update({ subscription_status: status })
        .eq("stripe_subscription_id", subscription.id)
      break
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription
      await supabase
        .from("families")
        .update({ subscription_status: "cancelled" })
        .eq("stripe_subscription_id", subscription.id)
      break
    }
  }

  return NextResponse.json({ received: true })
}
```

### 2.2. Cron: Notificação Matinal (`src/app/api/cron/morning-notification/route.ts`)

```typescript
import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(req: NextRequest) {
  // Verificar cron secret
  if (req.headers.get("Authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const today = new Date().toISOString().split("T")[0]

  // Buscar todas as famílias ativas
  const { data: families } = await supabase
    .from("families")
    .select("id")
    .in("subscription_status", ["active", "trial", "free"])

  for (const family of families ?? []) {
    // Buscar eventos de hoje
    const { data: events } = await supabase
      .from("events")
      .select("*, members(display_name, color)")
      .eq("family_id", family.id)
      .gte("starts_at", `${today}T00:00:00`)
      .lte("starts_at", `${today}T23:59:59`)
      .order("starts_at")

    if (!events?.length) continue

    // Buscar membros com notificações ativas
    const { data: members } = await supabase
      .from("members")
      .select("id, display_name, quiet_hours_start, quiet_hours_end, max_daily_notifications")
      .eq("family_id", family.id)
      .not("user_id", "is", null) // não notificar filhos

    for (const member of members ?? []) {
      // Verificar quiet hours
      const now = new Date()
      const currentHour = now.getHours()
      const quietStart = parseInt(member.quiet_hours_start?.split(":")[0] ?? "22")
      const quietEnd = parseInt(member.quiet_hours_end?.split(":")[0] ?? "7")
      if (currentHour >= quietStart || currentHour < quietEnd) continue

      // Verificar limite diário
      const { data: todayCount } = await supabase.rpc("count_today_notifications", { p_member_id: member.id })
      if ((todayCount ?? 0) >= member.max_daily_notifications) continue

      // Montar mensagem
      const eventList = events.map(e => {
        const time = new Date(e.starts_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
        return `${e.members?.display_name}: ${e.title} as ${time}`
      }).join("; ")

      const message = `Bom dia, ${member.display_name}! Hoje: ${eventList}`

      // Salvar notificação
      await supabase.from("notifications").insert({
        member_id: member.id,
        family_id: family.id,
        type: "morning_summary",
        title: "Bom dia!",
        message,
        data: { event_ids: events.map(e => e.id) },
      })

      // TODO: Enviar Web Push via push_subscriptions
    }
  }

  return NextResponse.json({ ok: true })
}
```

### 2.3. Vercel Cron Config (`vercel.json`)

```json
{
  "crons": [
    {
      "path": "/api/cron/morning-notification",
      "schedule": "0 7 * * *"
    },
    {
      "path": "/api/cron/weekly-report",
      "schedule": "0 9 * * 1"
    }
  ]
}
```

---

## 3. Supabase Edge Functions (IA)

### 3.1. Categorização Automática (`supabase/functions/ai-categorize/index.ts`)

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const CLAUDE_API_KEY = Deno.env.get("CLAUDE_API_KEY")!

serve(async (req) => {
  const { title, description, location } = await req.json()

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": CLAUDE_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 50,
      messages: [{
        role: "user",
        content: `Classifique este evento familiar em UMA categoria.
Categorias: saude, lazer, escola, trabalho, outro

Evento: "${title}"
${description ? `Descrição: "${description}"` : ""}
${location ? `Local: "${location}"` : ""}

Responda APENAS com a categoria, sem explicação.`,
      }],
    }),
  })

  const data = await response.json()
  const category = data.content[0].text.trim().toLowerCase()
  const valid = ["saude", "lazer", "escola", "trabalho", "outro"]
  
  return new Response(
    JSON.stringify({ category: valid.includes(category) ? category : "outro" }),
    { headers: { "Content-Type": "application/json" } }
  )
})
```

### 3.2. UX Writing (`supabase/functions/ai-notify/index.ts`)

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const CLAUDE_API_KEY = Deno.env.get("CLAUDE_API_KEY")!

serve(async (req) => {
  const { memberName, events, type } = await req.json()

  const prompt = type === "morning_summary"
    ? `Você é a Ello, assistente de logística familiar. Tom: secretária executiva mas melhor amiga. Calma, direta, útil, encorajadora e às vezes bem-humorada.

Gere uma mensagem matinal CURTA (máx 2 frases) para ${memberName}.
Eventos de hoje: ${JSON.stringify(events)}

Regras:
- Comece com saudação calorosa (varie: "Bom dia!", "Oi!", etc.)
- Mencione os eventos mais importantes
- Se tiver evento de criança, mencione com carinho
- Máximo 160 caracteres
- Sem emojis excessivos (máx 1)`
    : `Gere um lembrete amigável para ${memberName} sobre: ${JSON.stringify(events[0])}. Máx 100 caracteres. Tom caloroso.`

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": CLAUDE_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 200,
      messages: [{ role: "user", content: prompt }],
    }),
  })

  const data = await response.json()
  return new Response(
    JSON.stringify({ message: data.content[0].text.trim() }),
    { headers: { "Content-Type": "application/json" } }
  )
})
```


