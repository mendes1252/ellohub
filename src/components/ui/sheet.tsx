"use client"

import { useEffect } from "react"
import { X } from "lucide-react"
import { cn } from "@/lib/utils/cn"

interface SheetProps {
  open: boolean
  onClose: () => void
  children: React.ReactNode
  title?: string
  className?: string
}

export function Sheet({ open, onClose, children, title, className }: SheetProps) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => { document.body.style.overflow = "" }
  }, [open])

  if (!open) return null

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-ello-indigo/30 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className={cn(
          "fixed bottom-0 left-0 right-0 z-50 rounded-t-ello-lg bg-white p-6 shadow-xl animate-slide-up",
          "max-h-[90vh] overflow-y-auto",
          className
        )}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="flex items-center justify-between mb-5">
          {title && <h2 className="font-display text-xl text-ello-indigo">{title}</h2>}
          <button
            onClick={onClose}
            className="ml-auto rounded-full p-2 hover:bg-ello-indigo/5 transition-colors"
            aria-label="Fechar"
          >
            <X className="h-5 w-5 text-ello-indigo/60" />
          </button>
        </div>
        {children}
      </div>
    </>
  )
}
