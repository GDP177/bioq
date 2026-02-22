import { useNavigate, useLocation } from "react-router-dom";
import {
  HomeIcon, UsersIcon, ClipboardDocumentListIcon,
  BeakerIcon, Cog6ToothIcon, 
  ArrowRightOnRectangleIcon, UserCircleIcon, 
  DocumentPlusIcon, InboxStackIcon
} from '@heroicons/react/24/outline';

export function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  
  const usuarioJson = localStorage.getItem("usuario");
  
  // 🔥 AQUÍ ESTÁ LA CORRECCIÓN CLAVE 🔥
  // Verificamos que no sea null, y que TAMPOCO sea el texto "undefined"
  const usuario = (usuarioJson && usuarioJson !== "undefined") 
    ? JSON.parse(usuarioJson) 
    : { username: "Invitado", rol: "invitado" };

  // Definimos el ítem común
  const configItem = { label: "Configuración", path: "/configuracion", icon: <Cog6ToothIcon className="w-5 h-5" /> };

  const menuConfig = {
    admin: [
      { label: "Dashboard", path: "/admin/dashboard", icon: <HomeIcon className="w-5 h-5" /> },
      { label: "Pacientes", path: "/admin/pacientes", icon: <UsersIcon className="w-5 h-5" /> },
      { label: "Usuarios", path: "/admin/usuarios", icon: <UserCircleIcon className="w-5 h-5" /> },
      { label: "Catálogo Análisis", path: "/admin/analisis", icon: <BeakerIcon className="w-5 h-5" /> },
      configItem
    ],
    medico: [
      { label: "Panel Inicio", path: "/medico/dashboard", icon: <HomeIcon className="w-5 h-5" /> },
      { label: "Nueva Solicitud", path: "/medico/nueva-solicitud", icon: <DocumentPlusIcon className="w-5 h-5" /> },
      { label: "Gestión Pacientes", path: "/medico/pacientes", icon: <UsersIcon className="w-5 h-5" /> },
      { label: "Órdenes Enviadas", path: "/medico/ordenes", icon: <ClipboardDocumentListIcon className="w-5 h-5" /> },
      configItem
    ],
    bioquimico: [
      { label: "Panel Central", path: "/bioquimico/dashboard", icon: <BeakerIcon className="w-5 h-5" /> },
      { label: "Órdenes Entrantes", path: "/bioquimico/ordenes-entrantes", icon: <InboxStackIcon className="w-5 h-5" /> },
      { label: "Consulta Técnicas", path: "/admin/analisis", icon: <ClipboardDocumentListIcon className="w-5 h-5" /> },
      configItem
    ]
  };

  const currentMenu = menuConfig[usuario.rol as keyof typeof menuConfig] || [];

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = "/login";
  };

  return (
    <aside className="w-64 bg-indigo-950 text-white h-screen fixed left-0 top-0 flex flex-col shadow-2xl z-[60]">
      <div className="p-6 border-b border-indigo-900/50">
        <div className="flex items-center gap-3">
          <UserCircleIcon className="w-10 h-10 text-indigo-400" />
          <div className="overflow-hidden">
            <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest leading-none mb-1">
              {usuario?.rol || "SIN ROL"}
            </p>
            <p className="text-sm font-bold truncate uppercase">
              {usuario?.username || "Usuario"}
            </p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-2 mt-4 overflow-y-auto">
        {currentMenu.map((item) => (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 ${
              location.pathname.includes(item.path)
                ? "bg-indigo-600 text-white shadow-lg"
                : "text-indigo-300 hover:bg-indigo-900/50 hover:text-white"
            }`}
          >
            {item.icon}
            <span className="text-sm font-bold">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-indigo-900/50">
        <button onClick={handleLogout} className="w-full flex items-center gap-4 px-4 py-3 text-red-400 hover:bg-red-500/10 rounded-xl transition-all font-black text-xs uppercase tracking-widest">
          <ArrowRightOnRectangleIcon className="w-5 h-5" />
          Cerrar Sesión
        </button>
      </div>
    </aside>
  );
}