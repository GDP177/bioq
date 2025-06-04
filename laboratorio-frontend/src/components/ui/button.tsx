// src/components/ui/button.tsx
import { cva, type VariantProps } from "class-variance-authority"
import { ButtonHTMLAttributes } from "react"

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none",
  {
    variants: {
      variant: {
        default: "bg-blue-600 text-white hover:bg-blue-700 focus-visible:ring-blue-600",
        outline: "border border-blue-600 text-blue-600 hover:bg-blue-50 focus-visible:ring-blue-600",
        destructive: "bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-600",
        ghost: "hover:bg-gray-100 text-gray-800 focus-visible:ring-gray-300",
        secondary: "bg-gray-200 text-gray-800 hover:bg-gray-300 focus-visible:ring-gray-300",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 px-3",
        lg: "h-11 px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export function Button({ className, variant, size, ...props }: ButtonProps) {
  return (
    <button className={buttonVariants({ variant, size, className })} {...props} />
  )
}