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

export function getConflictBlendColor(colorA: string, colorB: string): string {
  const hexToRgb = (hex: string) => ({
    r: parseInt(hex.slice(1, 3), 16),
    g: parseInt(hex.slice(3, 5), 16),
    b: parseInt(hex.slice(5, 7), 16),
  })
  const a = hexToRgb(colorA)
  const b = hexToRgb(colorB)
  const mix = {
    r: Math.round((a.r + b.r) / 2),
    g: Math.round((a.g + b.g) / 2),
    b: Math.round((a.b + b.b) / 2),
  }
  return `#${mix.r.toString(16).padStart(2, "0")}${mix.g.toString(16).padStart(2, "0")}${mix.b.toString(16).padStart(2, "0")}`
}
