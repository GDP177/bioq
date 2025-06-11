// src/components/ui/input.tsx
import { type InputHTMLAttributes, forwardRef } from "react"
import { cva, type VariantProps } from "class-variance-authority"

const inputVariants = cva(
  "flex w-full rounded-md border bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      size: {
        default: "h-10", // Altura por defecto
        sm: "h-9",      // Altura pequeña
        lg: "h-11",     // Altura grande
      },
      variant: {
        default: "border-gray-300",
        error: "border-red-500 focus:ring-red-500", // Estilo para estado de error
      },
    },
    defaultVariants: {
      size: "default",
      variant: "default",
    },
  }
)

export interface InputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'>,
    VariantProps<typeof inputVariants> {
  // Propiedad para indicar si hay un error de validación
  isInvalid?: boolean
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, size, isInvalid, ...props }, ref) => {
    return (
      <input
        type={type}
        className={inputVariants({
          size,
          variant: isInvalid ? "error" : "default",
          className,
        })}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"