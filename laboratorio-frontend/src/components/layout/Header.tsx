// src/components/layout/Header.tsx
import { CustomCard } from '../ui/CustomCard'; // Ajusta la ruta si es necesario
import { NotificationItem } from '../ui/NotificationItem'; // Ajusta la ruta si es necesario
import { Button } from '../ui/button'; // Ajusta la ruta si es necesario

export function Header() {
  return (
    <header className="bg-white p-4 shadow-sm flex justify-between items-center border-b border-gray-200">
      <div className="flex items-center">
        {/* Aquí puedes poner un logo o icono de tu laboratorio */}
        <span className="text-2xl font-bold text-blue-600 mr-3">🔬</span>
        <h1 className="text-xl font-semibold text-gray-800">BioLab Dashboard</h1>
      </div>

      <div className="flex items-center space-x-4">
        {/* Área de Notificaciones (ejemplo simple) */}
        <div className="relative group">
          <Button variant="ghost" size="icon">
            {/* Ícono de campana para notificaciones, puedes usar una librería de iconos */}
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-red-100 bg-red-600 rounded-full">3</span> {/* Número de notificaciones */}
          </Button>
          {/* Dropdown de notificaciones (oculto por defecto, se muestra al hover) */}
          <CustomCard className="absolute right-0 mt-2 w-72 p-0 shadow-lg hidden group-hover:block z-10">
            <div className="p-4 border-b">
              <h4 className="font-semibold text-gray-800">Últimas Notificaciones</h4>
            </div>
            <div className="p-2 max-h-60 overflow-y-auto">
              <NotificationItem message="Nuevo resultado disponible para Ana López." />
              <NotificationItem message="Recordatorio: Mantenimiento de equipo en Sala 3." />
              <NotificationItem message="Solicitud de análisis urgente de Pedro Díaz." />
              <NotificationItem message="Revisión de stock de reactivos: Nivel bajo de Glucosa." />
            </div>
            <div className="p-4 border-t">
              <Button variant="ghost" className="w-full">Ver todas las notificaciones</Button>
            </div>
          </CustomCard>
        </div>

        {/* Información del Usuario */}
        <div className="flex items-center space-x-2">
          <div className="h-8 w-8 rounded-full bg-blue-200 flex items-center justify-center text-blue-800 font-semibold">
            JD
          </div>
          <span className="text-gray-700 text-sm hidden md:block">Dr. Juan Pérez</span>
          {/* Aquí podrías añadir un menú desplegable para perfil/cerrar sesión */}
        </div>
      </div>
    </header>
  );
}