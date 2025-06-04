// src/components/ui/CustomCard.tsx
import type { ReactNode } from "react" // Asegúrate de importar ReactNode

interface CustomCardProps {
  title?: string
  children: ReactNode
  footer?: ReactNode
  className?: string
}

export function CustomCard({ title, children, footer, className }: CustomCardProps) {
  return (
    <div className={`bg-white rounded-2xl shadow-sm p-6 ${className || ""}`}>
      {title && <h3 className="text-lg font-semibold mb-3">{title}</h3>}
      <div>{children}</div>
      {footer && <div className="mt-4 border-t pt-3">{footer}</div>}
    </div>
  )
}