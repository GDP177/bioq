// src/components/layout/Sidebar.tsx
import { SidebarItem } from '../ui/SidebarItem';
import { Button } from '../ui/button';

// ¡Importa desde @heroicons/react/24/outline para los iconos de 24x24px!
import {
  HomeIcon,
  UsersIcon,
  ClipboardDocumentListIcon, // <-- CAMBIO AQUÍ: Corrected from ClipboardListIcon
  BeakerIcon,
  ChartBarIcon,
  Cog6ToothIcon,             // <-- CAMBIO AQUÍ: Assuming you meant the gear icon (was CogIcon/CodIcon)
  ArrowRightOnRectangleIcon, // (Previously corrected)
} from '@heroicons/react/24/outline';

export function Sidebar() {
  return (
    <aside className="w-64 bg-white p-4 shadow-md border-r border-gray-200 flex flex-col justify-between">
      <nav>
        <div className="mb-6">
          <h3 className="text-xs font-semibold text-gray-400 uppercase mb-2">Menú Principal</h3>
          <ul>
            <li className="mb-1">
              <SidebarItem to="/dashboard" label="Dashboard" icon={<HomeIcon className="h-5 w-5" />} />
            </li>
            <li className="mb-1">
              <SidebarItem to="/patients" label="Pacientes" icon={<UsersIcon className="h-5 w-5" />} />
            </li>
            <li className="mb-1">
              <SidebarItem to="/orders" label="Órdenes de Laboratorio" icon={<ClipboardDocumentListIcon className="h-5 w-5" />} /> {/* <-- USO AQUÍ */}
            </li>
            <li className="mb-1">
              <SidebarItem to="/results" label="Resultados" icon={<BeakerIcon className="h-5 w-5" />} />
            </li>
            <li className="mb-1">
              <SidebarItem to="/reports" label="Reportes" icon={<ChartBarIcon className="h-5 w-5" />} />
            </li>
          </ul>
        </div>

        <div className="mb-6">
          <h3 className="text-xs font-semibold text-gray-400 uppercase mb-2">Gestión</h3>
          <ul>
            <li className="mb-1">
              <SidebarItem to="/settings" label="Configuración" icon={<Cog6ToothIcon className="h-5 w-5" />} /> {/* <-- USO AQUÍ */}
            </li>
          </ul>
        </div>
      </nav>

      <div className="mt-auto pt-4 border-t border-gray-200">
        <SidebarItem to="/logout" label="Cerrar Sesión" icon={<ArrowRightOnRectangleIcon className="h-5 w-5" />} />
      </div>
    </aside>
  );
}