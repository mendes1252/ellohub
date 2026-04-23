import type { Metadata, Viewport } from "next"
import "@/styles/globals.css"

export const metadata: Metadata = {
  title: "Ello — Sua família em sintonia",
  description: "Assistente de logística familiar inteligente. Organize a rotina da sua família com calendário compartilhado, tarefas e muito mais.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Ello",
  },
}

export const viewport: Viewport = {
  themeColor: "#3D405B",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        {children}
        <script
          dangerouslySetInnerHTML={{
            __html: `if("serviceWorker" in navigator){navigator.serviceWorker.register("/sw.js").catch(()=>{})}`,
          }}
        />
      </body>
    </html>
  )
}
