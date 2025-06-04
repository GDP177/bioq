// src/components/ui/textarea.tsx
import  type { TextareaHTMLAttributes } from "react"
import {forwardRef} from "react"
import { cva, type VariantProps } from "class-variance-authority"

const textareaVariants = cva(
  "flex w-full rounded-md border bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "border-gray-300",
        error: "border-red-500 focus:ring-red-500", // Estilo para estado de error
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface TextareaProps
  extends TextareaHTMLAttributes<HTMLTextAreaElement>,
    VariantProps<typeof textareaVariants> {
  isInvalid?: boolean
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, isInvalid, ...props }, ref) => {
    return (
      <textarea
        className={textareaVariants({
          variant: isInvalid ? "error" : "default",
          className,
        })}
        ref={ref}
        {...props}
      />
    )
  }
)
Textarea.displayName = "Textarea"