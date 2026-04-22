"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Globe } from "lucide-react"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState("")

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError("")
    const supabase = createClient()

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${location.origin}/auth/callback` },
    })

    setLoading(false)
    if (error) {
      setError(error.message)
    } else {
      setSent(true)
    }
  }

  async function handleGoogle() {
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${location.origin}/auth/callback` },
    })
  }

  return (
    <div className="min-h-screen bg-ello-offwhite flex flex-col items-center justify-center px-5">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <h1 className="font-display text-4xl text-ello-indigo mb-2">ello</h1>
          <p className="text-ello-indigo/60 font-body">Sua família em sintonia</p>
        </div>

        {sent ? (
          <div className="bg-white rounded-ello p-8 text-center shadow-sm">
            <div className="text-4xl mb-4">✉️</div>
            <h2 className="font-display text-xl text-ello-indigo mb-2">Confira seu email!</h2>
            <p className="text-sm text-ello-indigo/60">
              Enviamos um link mágico para <strong>{email}</strong>. Clique nele para entrar.
            </p>
            <button
              onClick={() => setSent(false)}
              className="mt-6 text-sm text-ello-turquesa-dark underline"
            >
              Usar outro email
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-ello p-8 shadow-sm space-y-5">
            <form onSubmit={handleMagicLink} className="space-y-4">
              <Input
                id="email"
                label="Email"
                type="email"
                placeholder="voce@exemplo.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete="email"
                error={error}
              />
              <Button type="submit" loading={loading} className="w-full">
                Entrar com Magic Link
              </Button>
            </form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-ello-indigo/10" />
              </div>
              <div className="relative flex justify-center text-xs text-ello-indigo/40">
                <span className="bg-white px-3">ou</span>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full gap-3"
              onClick={handleGoogle}
            >
              <Globe className="h-4 w-4" />
              Continuar com Google
            </Button>
          </div>
        )}

        <p className="text-center text-xs text-ello-indigo/40 mt-8">
          Ao entrar, você concorda com nossa{" "}
          <span className="underline cursor-pointer">Política de Privacidade</span>.
        </p>
      </div>
    </div>
  )
}
