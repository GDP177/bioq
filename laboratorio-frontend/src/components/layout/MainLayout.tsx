import { Sidebar } from "./Sidebar";

export function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-gray-50 w-full overflow-x-hidden">
      {/* Sidebar fijo a la izquierda */}
      <Sidebar />
      
      {/* ✅ ÁREA DE CONTENIDO: ml-64 es el ancho del Sidebar. 
          flex-1 y w-full aseguran que ocupe todo el resto de la pantalla. */}
      <main className="flex-1 ml-64 min-h-screen w-full">
        {children}
      </main>
    </div>
  );
}