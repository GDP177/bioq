// src/components/ui/radio-group.tsx
import { InputHTMLAttributes, ReactNode, createContext, useContext, useId } from "react"
import { cva, type VariantProps } from "class-variance-authority"

interface RadioGroupContextType {
  name?: string
  selectedValue: string | undefined
  onChange: (value: string) => void
  isInvalid?: boolean
}

const RadioGroupContext = createContext<RadioGroupContextType | undefined>(undefined)

interface RadioGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  name: string
  value?: string
  onValueChange: (value: string) => void
  children: ReactNode
  isInvalid?: boolean
}

export function RadioGroup({
  name,
  value,
  onValueChange,
  children,
  isInvalid,
  ...props
}: RadioGroupProps) {
  return (
    <RadioGroupContext.Provider
      value={{ name, selectedValue: value, onChange: onValueChange, isInvalid }}
    >
      <div role="radiogroup" {...props}>
        {children}
      </div>
    </RadioGroupContext.Provider>
  )
}

const radioItemVariants = cva(
  "h-4 w-4 rounded-full border border-gray-300 text-blue-600 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "border-gray-300",
        error: "border-red-500 text-red-600 focus:ring-red-500", // Estilo para estado de error
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface RadioGroupItemProps extends InputHTMLAttributes<HTMLInputElement> {
  value: string
  children?: ReactNode
}

export function RadioGroupItem({
  value,
  children,
  className,
  ...props
}: RadioGroupItemProps) {
  const context = useContext(RadioGroupContext)
  if (!context) {
    throw new Error("RadioGroupItem must be used within a RadioGroup")
  }

  const { name, selectedValue, onChange, isInvalid } = context
  const id = useId() // Genera un ID único para el input y el label

  const isChecked = selectedValue === value

  return (
    <div className="flex items-center space-x-2">
      <input
        type="radio"
        id={id}
        name={name}
        value={value}
        checked={isChecked}
        onChange={() => onChange(value)}
        className={radioItemVariants({ variant: isInvalid ? "error" : "default", className })}
        {...props}
      />
      {children && (
        <label htmlFor={id} className="text-sm font-medium text-gray-700 cursor-pointer">
          {children}
        </label>
      )}
    </div>
  )
}

// Ejemplo de uso:
/*
<RadioGroup name="gender" value="male" onValueChange={(val) => console.log(val)} isInvalid={false}>
  <RadioGroupItem value="male">Masculino</RadioGroupItem>
  <RadioGroupItem value="female">Femenino</RadioGroupItem>
  <RadioGroupItem value="other">Otro</RadioGroupItem>
</RadioGroup>
*/