// src/components/ui/label.tsx
import type { LabelHTMLAttributes } from "react"

export interface LabelProps extends LabelHTMLAttributes<HTMLLabelElement> {
  // Puedes añadir variantes si en algún momento necesitas estilos diferentes para labels.
  // Por ahora, el estilo base es suficiente para la mayoría de los casos.
}

export function Label({ className, ...props }: LabelProps) {
  return (
    <label
      className={`block text-sm font-medium text-gray-700 mb-1 ${className || ""}`}
      {...props}
    />
  )
}