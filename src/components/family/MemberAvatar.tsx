import Image from "next/image"
import { cn } from "@/lib/utils/cn"

interface MemberAvatarProps {
  member: {
    display_name: string
    color: string
    avatar_url?: string | null
  }
  size?: "sm" | "md" | "lg"
  showName?: boolean
  className?: string
}

const sizeClasses = {
  sm: { container: "w-8 h-8", text: "text-xs", nameText: "text-xs" },
  md: { container: "w-10 h-10", text: "text-sm", nameText: "text-xs" },
  lg: { container: "w-14 h-14", text: "text-base", nameText: "text-sm" },
}

export function MemberAvatar({ member, size = "md", showName, className }: MemberAvatarProps) {
  const { container, text, nameText } = sizeClasses[size]
  const initial = member.display_name.charAt(0).toUpperCase()

  return (
    <div className={cn("flex flex-col items-center gap-1", className)}>
      <div
        className={cn(
          "rounded-full flex items-center justify-center border-2 overflow-hidden font-medium",
          container
        )}
        style={{ borderColor: member.color, backgroundColor: `${member.color}20` }}
      >
        {member.avatar_url ? (
          <Image
            src={member.avatar_url}
            alt={member.display_name}
            width={56}
            height={56}
            className="object-cover w-full h-full"
          />
        ) : (
          <span className={cn(text, "font-display")} style={{ color: member.color }}>
            {initial}
          </span>
        )}
      </div>
      {showName && (
        <span className={cn(nameText, "text-ello-indigo/70 font-body text-center leading-tight")}>
          {member.display_name}
        </span>
      )}
    </div>
  )
}
