"use client"

import { useState, useEffect } from "react"
import { Bell, BellOff, Loader2 } from "lucide-react"
import { subscribeToPush, unsubscribeFromPush } from "@/lib/actions/push"
import { cn } from "@/lib/utils/cn"

interface Props {
  memberId: string
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4)
  const b64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/")
  const raw = window.atob(b64)
  return new Uint8Array([...Array(raw.length)].map((_, i) => raw.charCodeAt(i)))
}

export function PushSubscription({ memberId }: Props) {
  const [subscribed, setSubscribed] = useState(false)
  const [loading, setLoading] = useState(false)
  const [supported, setSupported] = useState(false)
  const [permission, setPermission] = useState<NotificationPermission>("default")

  useEffect(() => {
    if (!("PushManager" in window) || !("serviceWorker" in navigator)) return
    setSupported(true)
    setPermission(Notification.permission)
    navigator.serviceWorker.ready
      .then(reg => reg.pushManager.getSubscription())
      .then(sub => setSubscribed(!!sub))
  }, [])

  if (!supported) return null

  const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  if (!vapidKey || vapidKey.startsWith("placeholder") || vapidKey === "") return null

  if (permission === "denied") {
    return (
      <p className="text-xs text-ello-indigo/40">
        Notificações bloqueadas no navegador. Habilite nas configurações do dispositivo.
      </p>
    )
  }

  async function toggle() {
    setLoading(true)
    try {
      const reg = await navigator.serviceWorker.ready
      if (subscribed) {
        const sub = await reg.pushManager.getSubscription()
        if (sub) {
          await sub.unsubscribe()
          await unsubscribeFromPush(sub.endpoint)
        }
        setSubscribed(false)
      } else {
        const perm = await Notification.requestPermission()
        setPermission(perm)
        if (perm !== "granted") return
        const sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidKey!),
        })
        const json = sub.toJSON()
        await subscribeToPush(memberId, {
          endpoint: sub.endpoint,
          keys: { p256dh: json.keys!.p256dh, auth: json.keys!.auth },
        })
        setSubscribed(true)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={cn(
        "flex items-center gap-2 text-sm font-medium transition-colors",
        subscribed
          ? "text-ello-turquesa-dark"
          : "text-ello-indigo/60 hover:text-ello-indigo"
      )}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : subscribed ? (
        <Bell className="h-4 w-4" />
      ) : (
        <BellOff className="h-4 w-4" />
      )}
      {subscribed ? "Notificações push ativas" : "Ativar notificações push"}
    </button>
  )
}
