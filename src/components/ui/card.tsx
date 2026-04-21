import { cn } from "@/lib/utils/cn"

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {}

function Card({ className, ...props }: CardProps) {
  return (
    <div
      className={cn("rounded-ello bg-white shadow-sm border border-ello-indigo/5", className)}
      {...props}
    />
  )
}

function CardHeader({ className, ...props }: CardProps) {
  return <div className={cn("p-5 pb-0", className)} {...props} />
}

function CardContent({ className, ...props }: CardProps) {
  return <div className={cn("p-5", className)} {...props} />
}

function CardFooter({ className, ...props }: CardProps) {
  return <div className={cn("p-5 pt-0 flex items-center gap-3", className)} {...props} />
}

function CardTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn("font-display text-lg text-ello-indigo", className)} {...props} />
}

function CardDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("text-sm text-ello-indigo/60", className)} {...props} />
}

export { Card, CardHeader, CardContent, CardFooter, CardTitle, CardDescription }
