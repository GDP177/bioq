// src/components/Layout.tsx
import { Link, Outlet, useLocation } from "react-router-dom";

export default function Layout() {
  const { pathname } = useLocation();

  const isActive = (path: string) => pathname === path;

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-60 bg-blue-700 text-white p-6 flex flex-col gap-4">
        <h2 className="text-xl font-semibold mb-4">Menú</h2>
        <NavLink to="/" label="Dashboard" active={isActive("/")} />
        <NavLink to="/MedicoDashboard" label="Dashboard Médico" active={isActive("/MedicoDashboard")} />
        <NavLink to="/pacientes" label="Pacientes" active={isActive("/pacientes")} />
        <NavLink to="/ordenes" label="Órdenes" active={isActive("/ordenes")} />
        <NavLink to="/analisis" label="Análisis" active={isActive("/analisis")} />
        <NavLink to="/resultados" label="Resultados" active={isActive("/resultados")} />
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-blue-800 text-white py-4 px-6 shadow-md">
          <h1 className="text-2xl font-bold">Laboratorio Bioquímico</h1>
        </header>

        {/* Page Content */}
        <main className="flex-1 bg-gray-100 p-6">
          <Outlet />
        </main>

        {/* Footer */}
        <footer className="bg-gray-800 text-white py-4 text-center text-sm">
          © 2025 Laboratorio Bioquímico
        </footer>
      </div>
    </div>
  );
}

type NavLinkProps = {
  to: string;
  label: string;
  active: boolean;
};

function NavLink({ to, label, active }: NavLinkProps) {
  return (
    <Link
      to={to}
      className={`py-2 px-4 rounded-lg transition-colors duration-200 ${
        active ? "bg-yellow-400 text-blue-800 font-bold" : "hover:bg-blue-600"
      }`}
    >
      {label}
    </Link>
  );
}
