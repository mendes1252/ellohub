"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { inviteMember } from "@/lib/actions/family"
import { SuccessPulse } from "@/components/shared/SuccessPulse"
import { Send, Copy, Check } from "lucide-react"

interface InviteFormProps {
  familyId: string
  onSuccess: () => void
}

export function InviteForm({ familyId, onSuccess }: InviteFormProps) {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [inviteToken, setInviteToken] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    setLoading(true)
    setError("")
    try {
      const result = await inviteMember(familyId, email.trim())
      setInviteToken(result.token)
      setSuccess(true)
      setTimeout(() => setSuccess(false), 600)
      onSuccess()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function copyLink() {
    if (!inviteToken) return
    const link = `${window.location.origin}/invite/${inviteToken}`
    await navigator.clipboard.writeText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-4">
      <SuccessPulse trigger={success}>
        <form onSubmit={handleSubmit} className="flex gap-2">
          <div className="flex-1">
            <Input
              type="email"
              placeholder="email@exemplo.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>
          <Button type="submit" loading={loading} size="icon" aria-label="Enviar convite">
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </SuccessPulse>

      {error && <p className="text-xs text-red-500">{error}</p>}

      {inviteToken && (
        <div className="bg-ello-offwhite rounded-ello-sm p-3 flex items-center gap-2">
          <p className="text-xs text-ello-indigo/60 flex-1 truncate">
            Link de convite gerado
          </p>
          <button
            onClick={copyLink}
            className="flex items-center gap-1 text-xs text-ello-turquesa-dark font-medium"
          >
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? "Copiado!" : "Copiar"}
          </button>
        </div>
      )}
    </div>
  )
}
