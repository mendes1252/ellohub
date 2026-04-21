**Assistente de Logística Familiar Inteligente**
Sua família em sintonia

---
# 1. Visão Geral e Essência
O Ello não é apenas um calendário; é uma plataforma desenhada para harmonizar a vida moderna de casais e famílias, transformando o caos logístico em tempo de qualidade.
**Missão**: Harmonizar a rotina familiar através de organização inteligente e empática.
**Visão**: Ser a plataforma de organização familiar preferida do Brasil, expandindo para América Latina.
**Valores**: Empatia (carga mental), Simplicidade (facilidade de uso), Inteligência (antecipação de conflitos) e Segurança (privacidade sagrada)
# 2. Experiência do Usuário (UX) e Tom de Voz
A interface deve agir como uma "**Secretária Executiva, mas Melhor Amiga"**.
Personalidade: Calma, direta, útil, encorajadora e ocasionalmente bem-humorada.
Diretriz de Escrita: Evitar tons frios ou puramente corporativos. Linguagem acolhedora e contextual. Exemplo: ==*"Prepare os óculos! Aula de natação do Léo amanhã às 9h — não esqueça a toalha!"*==
###### 2.1. Implementação de UX Writing com IA
O tom de voz será implementado via Claude API (Haiku) em Edge Functions do Supabase. O sistema receberá o evento bruto e gerará a mensagem contextualizada seguindo o guia de personalidade definido acima
# 3. Identidade Visual e Design System
###### 3.1. Logotipo e Slogan
**Wordmark**: Letras "Ello" formadas por blocos orgânicos e interconectados. Tagline: "Sua família em sintonia" (Caixa Alta e Baixa para leveza). Área de Respiro: Margem de segurança igual à altura da letra "l".
###### 3.2. Paleta de Cores 
(The Synergy Palette)

| Cor               | Hex     | Uso Funcional                                    |
| ----------------- | ------- | ------------------------------------------------ |
| Indigo Profundo   | #3D405B | Estrutura, texto principal, Calendário Pai       |
| Rosa Chiclete     | #F49AC2 | Emoção, datas comemorativas, Calendário Mãe      |
| Amarelo Manga     | #FFC145 | Foco, botões secundários, Calendário Filho 1     |
| Turquesa Elétrico | #70D6E3 | Conexão, CTA principal, Calendário Compartilhado |
| Off-White         | #F9F9F7 | Cor de fundo principal (redução de fadig         |
###### 3.3. Tipografia
Títulos e Destaques: Tenor Sans (limpa, moderna e amigável). Textos e Listas: DM Sans (neutra e altamente legível). Fallback Web: system-ui, -apple-system, sans-serif.
# 4. Requisitos de Interface (UI)
**Geometria**: Cards de evento com bordas super-arredondadas (border-radius: 24px), refletindo os blocos da logo.
**Conflitos Visuais**: Em caso de conflito de agenda, cards se interseccionam visualmente com mix-blend-mode gerando tom de sobreposição.
**Microinterações**: Animações de sucesso com "pulso de luz" em Amarelo Manga (#FFC145) via Framer Motion.
**Legibilidade**: Textos longos em Indigo Profundo com 80% de opacidade. Responsividade: Mobile-first. PWA com suporte a instalação na home screen.

# 5. Requisitos Funcionais Inteligentes
###### 5.1. Motor de Sintonia (Fase 3)
O Motor de Sintonia é a inteligência central do Ello. Ele opera em três camadas:
**Detecção de Conflitos:** Comparação de intervalos de tempo entre eventos de todos os membros. Implementado como função PostgreSQL no Supabase (overlap de tsrange).
**Sugestão de Resolução:** Claude API analisa o conflito e sugere alternativa contextual (ex: "Mover aula de piano 15 min adiante?").
**Janela de Qualidade**: Query SQL que identifica gaps comuns em todas as agendas, seguida de sugestão de atividade via IA.
==Nota: Este módulo só entra na Fase 3 do roadmap. O MVP funciona sem IA.==

###### 5.2. Diferenciação Visual Automática
Cada membro da família recebe uma cor da Synergy Palette no momento do cadastro. Todos os eventos, tarefas e notificações daquele membro herdam automaticamente a cor atribuída.

# 6. Funcionalidades Detalhadas do Sistema
##### 6.1. Núcleo de Gestão (MVP — Fase 1)
**Calendário Familiar Visual:** Visão diária, semanal e mensal com eventos coloridos por membro. Componente customizado com shadcn/ui + Tailwind.
**CRUD de Eventos:** Criação, edição e exclusão com atribuição automática de cor. Dados persistidos no Supabase PostgreSQL.
**Convite Familiar**: Usuário admin convida parceiro(a) via Magic Link. Membro aceita e é vinculado à família automaticamente.
**Notificações Básicas**: Web Push via Vercel Cron + Supabase Edge Functions. Máximo 3 por dia por membro.

##### 6.2. Colaboração (Fase 2)
**Lista de Tarefas:** Checklists dinâmicas onde membros delegam tarefas com um toque. Sync em tempo real via Supabase Realtime.
**Import Google Calendar:** Importação unidirecional (somente leitura) via Google Calendar API. Sem iCloud ou Outlook na v1.
**Notificação Matinal:** "Bom dia! Hoje o Léo tem natação às 9h e você tem reunião às 14h." Gerada via template + dados do Supabase.

##### 6.3. Inteligência (Fase 3)
**Categorização Automática**: Claude API (Haiku) classifica eventos em Saúde, Lazer, Escola, Trabalho, aplicando a Synergy Palette.
**Relatório Semanal**: "Esta semana sua família passou 8h juntos — 2h a mais que na semana passada!" Gerado via Vercel Cron.
**UX Writing Dinâmico:** Notificações com personalidade geradas por IA, seguindo o guia de tom de voz.

##### 6.4. Funcionalidades Futuras (Backlog)
**Mural de Notas Visuais:** Fotos de recados escolares com OCR para transformar em evento. Confirmação de Leitura: Badge passivo (sem push) indicando que o parceiro visualizou a mudança.
**Sync Bidirecional:** Escrita de volta nos calendários externos. Considerar Nylas API. App Nativo: Empacotar PWA com Capacitor para iOS/Android após validação de mercado.

# 7. Framework Tecnológico (Stack Definitiva)
Stack otimizada para desenvolvimento ágil com IA (Cursor + Claude) e infraestrutura serverless

| Camada         | Tecnologia               | Justificativa                                         |
| -------------- | ------------------------ | ----------------------------------------------------- |
| Frontend       | Next.js 14+ (App Router) | SSR, RSC, PWA. Deploy nativo na Vercel.               |
| UI Library     | Tailwind CSS + shadcn/ui | Synergy Palette via CSS vars. Componentes acessíveis. |
| Animações      | Framer Motion            | Microinterações (pulso, transições de cards).         |
| Auth           | Supabase Auth            | Magic Link + Google OAuth. Zero senha.                |
| Banco de Dados | Supabase PostgreSQL      | RLS por family_id. Tipagem com Drizzle ORM.           |
| Realtime       | Supabase Realtime        | WebSockets nativo. Substitui Redis.                   |
| Storage        | Supabase Storage         | Avatares, fotos de recados (futuro OCR).              |
| AI / NLP       | Claude API (Haiku)       | Categorização, UX writing, resolução de conflitos.    |
| Deploy         | Vercel                   | Zero-config, preview por PR, Edge Functions.          |
| Cron Jobs      | Vercel Cron              | Notificações matinais e relatórios semanais.          |
| Dev AI         | Cursor + Claude          | .cursorrules com contexto do PRD e Design System.     |
# 8. Arquitetura de Dados (Supabase)
##### 8.1. Schema Principal
Todas as tabelas utilizam Row Level Security (RLS) com política baseada em family_id para isolamento total entre famílias.

| Tabela        | Campos-Chave                                                               | Descrição                                                              |
| ------------- | -------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| families      | id (uuid), name, created_by (fk user), subscription_status                 | Núcleo familiar. created_by é o admin.                                 |
| members       | id, family_id (fk), user_id (fk), role (enum), color, display_name         | Papel: admin, member, child. Cor da Synergy Palette.                   |
| events        | id, family_id, member_id, title, starts_at, ends_at, category, synced_from | Evento do calendário. category: saude, lazer, escola, trabalho, outro. |
| tasks         | id, family_id, assigned_to (fk), title, status (enum), due_date            | Tarefa compartilhada. status: pending, done.                           |
| invitations   | id, family_id, email, token (unique), status (enum)                        | Convites pendentes. status: pending, accepted, expired.                |
| notifications | id, member_id, type, message, read_at (nullable)                           | Log de notificações. Limite: 3/dia/membro via constraint.              |
##### 8.2. Autenticação e Convites
Fluxo de onboarding: (1) Usuário se cadastra via Magic Link ou Google OAuth. (2) Cria uma família e se torna admin. (3) Envia convite por email — gera registro na tabela invitations com token único. (4) Convidado clica no link, faz login e é automaticamente vinculado à família. (5) Filhos podem ser adicionados como perfis gerenciados (sem email próprio).

##### 8.3. Row Level Security (RLS)
Política padrão para todas as tabelas: o usuário autenticado só acessa registros onde family_id corresponde à família do seu próprio membro. Isso garante isolamento total sem lógica no frontend.

# 9. Modelo de Negócio
##### 9.1. Modelo Freemium

| Funcionalidade                 | Plano Grátis    | Plano Família               |
| ------------------------------ | --------------- | --------------------------- |
| Membros                        | Até 2           | Até 6                       |
| Calendários                    | 1 compartilhado | Individuais + compartilhado |
| Eventos/mês                    | 50              | Ilimitados                  |
| Import Google Calendar         | —               | ✓                           |
| Motor de Sintonia (IA)         | —               | ✓                           |
| Relatório Semanal              | —               | ✓                           |
| Notificações Inteligentes (IA) | —               | ✓                           |
| Listas de Tarefas              | 1 lista         | Ilimitadas                  |
##### 9.2. Pricing
**Plano Mensal:** R$ 24,00/mês
**Plano Anual:** R$ 229,00/ano (equivalente a R$ 19,08/mês — economia de 20%)
**Trial**: 14 dias grátis do Plano Família para novos cadastros. Implementação de pagamento via Stripe (suporte a PIX e cartão). Webhook do Stripe atualiza campo subscription_status na tabela families.

##### 9.3. Projeção de Receita (Cenário Conservador)

| Métrica           | Mês 3  | Mês 6    | Mês 12   |
| ----------------- | ------ | -------- | -------- |
| Famílias ativas   | 200    | 800      | 2.500    |
| Conversão paga    | 8%     | 12%      | 15%      |
| Famílias pagantes | 16     | 96       | 375      |
| MRR estimado      | R$ 384 | R$ 2.304 | R$ 9.000 |
# 10. Estratégia de Notificações
Notificações são críticas para engajamento mas destrutivas se em excesso. O Ello segue um budget rígido:
**Máximo**: 3 push notifications por dia por membro.
**Quiet Hours:** Sem notificações entre 22h e 7h (configurável).
**Confirmação de Leitura**: Badge passivo na UI (sem push). Nunca cobrar resposta. 
**Anti**-**repetição**: Nunca notificar sobre o mesmo evento duas vezes. Agrupamento: Múltiplos eventos no mesmo horário viram uma notificação única.

# 11. Jornada do Cliente
##### Fase 1: Descoberta e Onboarding ("O Alívio")
**Ponto de Contato:** Anúncios focados em "casais sobrecarregados" (Instagram Reels, TikTok). Ação: Usuário acessa o app (PWA), faz login via Magic Link e cria a família em menos de 2 minutos. **Sensação**: Alívio imediato ao ver a rotina organizada com as cores do Ello.
**Métrica**: Tempo de onboarding inferior a 3 minutos. Taxa de convite enviado acima de 50%

##### Fase 2: Engajamento ("A Sintonia")
**Ponto de Contato:** Notificação matinal personalizada. Ação: O casal interage com as tarefas e eventos do dia. 
**Sensação:** Segurança de que nada será esquecido.
**Métrica**: DAU/MAU acima de 40%. 2+ membros ativos por família.

##### Fase 3: Retenção ("A Harmonia")
**Ponto de Contato:** Relatório semanal de "Tempo de Qualidade".
**Ação**: App mostra quanto tempo a família passou junta. 
**Sensação**: Gratidão e percepção de que o Ello é essencial. Métrica: Retenção D30 acima de 25%. NPS acima de 50.

# 12. Métricas de Sucesso (KPIs)

##### 12.1. KPIs do MVP (Primeiros 90 dias)

| Métrica                             | Meta    | Ferramenta         |
| ----------------------------------- | ------- | ------------------ |
| Famílias ativas (2+ membros/semana) | 200     | Supabase + PostHog |
| DAU/MAU                             | > 40%   | PostHog            |
| NPS                                 | > 50    | Survey in-app      |
| Taxa de convite aceito              | > 60%   | Supabase           |
| Tempo de onboarding                 | < 3 min | PostHog            |
| Retenção D7                         | > 35%   | PostHog            |
| Retenção D30                        | > 25%   | PostHog            |

##### 12.2. KPIs de Produto (Pós-MVP)
**Redução de Conflitos:** Queda de 30% em sobreposições não resolvidas após ativar Motor de Sintonia.
**Conversão Free para Pago:** Meta de 12% em 6 meses. Churn Mensal: Inferior a 8% (benchmark SaaS B2C). LTV/CAC: Acima de 3x em 12 meses.

# 13. Roadmap de Desenvolvimento

| Fase             | Prazo      | Entregas                                                                                                                                            |
| ---------------- | ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0 — Fundação     | Sem. 1–2   | Setup Next.js + Supabase + Vercel. Schema com RLS. Auth Magic Link. Design System (cores, tipografia, componentes base). .cursorrules para Cursor.  |
| 1 — MVP Core     | Sem. 3–6   | Calendário visual (dia/semana/mês). CRUD eventos + cores automáticas. Convite de parceiro. Web Push básico. Highlight de conflitos. PWA instalável. |
| 2 — Colaboração  | Sem. 7–10  | Lista de tarefas compartilhadas. Import Google Calendar (leitura). Notificação matinal. Supabase Realtime. Stripe + planos pagos.                   |
| 3 — Inteligência | Sem. 11–14 | Claude API: categorização + UX writing + sugestões de conflito. Motor Janela de Qualidade. Relatório semanal. Refino de UI com animações.           |
# 14. Riscos e Mitigações

| Risco                           | Impact o | Mitigação                                                                                                         |
| ------------------------------- | -------- | ----------------------------------------------------------------------------------------------------------------- |
| Baixa adoção do segundo membro  | Alto     | Onboarding foca no convite imediato. Notificação lembrando de convidar. Valor só aparece com 2+ membros.          |
| Custo de API Claude escalar     | Médio    | Usar Haiku (mais barato). Cache de respostas similares. IA só no plano pago.                                      |
| Churn alto (app de hábito)      | Alto     | Plano anual com desconto agressivo. Relatório semanal como âncora emocional. Loop de notificação matinal.         |
| Privacidade e LGPD              | Alto     | RLS no Supabase. Criptografia em trânsito (HTTPS) e repouso. Política de privacidade clara. Dados nunca vendidos. |
| Concorrência (Cozi, FamilyWall) | Médio    | Diferencial: IA + tom emocional + design premium. Foco no mercado brasileiro (sem concorrente forte local).       |