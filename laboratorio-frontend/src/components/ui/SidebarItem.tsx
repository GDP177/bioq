// src/components/ui/SidebarItem.tsx
import type { ReactNode } from "react"
import { useNavigate } from "react-router-dom" // Necesitarás instalar react-router-dom si aún no lo has hecho

interface SidebarItemProps {
  icon?: ReactNode // Un icono opcional (puede ser un SVG, un componente de icono, etc.)
  label: string    // El texto que se mostrará en el elemento del menú
  to: string       // La ruta a la que navegará el elemento al hacer clic
}

export function SidebarItem({ icon, label, to }: SidebarItemProps) {
  const navigate = useNavigate() // Hook de React Router para la navegación programática

  return (
    <button
      onClick={() => navigate(to)} // Al hacer clic, navega a la ruta especificada
      // Clases de Tailwind CSS para el estilo del botón
      className="w-full flex items-center gap-3 text-left p-3 hover:bg-gray-100 rounded-lg text-sm transition-colors duration-200"
    >
      {icon && <div className="text-gray-500">{icon}</div>} {/* Renderiza el icono si se proporciona */}
      <span className="text-gray-700">{label}</span> {/* Renderiza la etiqueta de texto */}
    </button>
  )
}