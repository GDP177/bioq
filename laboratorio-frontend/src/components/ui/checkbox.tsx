// src/components/ui/checkbox.tsx
import type { InputHTMLAttributes, forwardRef } from "react"

export interface CheckboxProps extends InputHTMLAttributes<HTMLInputElement> {
  // Para checkboxes, el error visual a menudo se maneja con un texto de error junto al checkbox
  // o a través de un componente FormItem que envuelva al checkbox y su label/error.
  // No añadimos 'isInvalid' directamente aquí para no sobrecomplicar la UI del checkbox mismo.
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, ...props }, ref) => {
    return (
      <input
        type="checkbox"
        className={`h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 ${
          className || ""
        }`}
        ref={ref}
        {...props}
      />
    )
  }
)
Checkbox.displayName = "Checkbox"