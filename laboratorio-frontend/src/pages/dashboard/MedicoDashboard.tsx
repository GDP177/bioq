// src/pages/medico/MedicoDashboard.tsx

import { Card, CardContent } from "@/components/ui/card"
import { Bell, LogOut, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useNavigate } from "react-router-dom"

export default function MedicoDashboard() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-gray-100 text-gray-800 flex">
      
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-md p-4 flex flex-col">
        <div className="text-xl font-semibold mb-6">Panel Médico</div>
        <nav className="space-y-3">
          <Button variant="ghost" onClick={() => navigate("/medico/pacientes")}>
            Mis Pacientes
          </Button>
          <Button variant="ghost" onClick={() => navigate("/medico/solicitud-nueva")}>
            Nueva Solicitud
          </Button>
          <Button variant="ghost" onClick={() => navigate("/medico/resultados")}>
            Resultados
          </Button>
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 p-6">
        
        {/* Header */}
        <header className="flex items-center justify-between mb-8">
          <div className="text-2xl font-semibold flex items-center gap-2">
            <User className="w-6 h-6" />
            Dra. Ana García
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost">
              <Bell className="w-5 h-5" />
            </Button>
            <Button variant="outline" onClick={() => navigate("/logout")}>
              <LogOut className="w-4 h-4 mr-1" /> Salir
            </Button>
          </div>
        </header>

        {/* Dashboard Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="shadow-sm bg-white">
            <CardContent className="p-4">
              <h3 className="text-lg font-semibold">Solicitudes Pendientes</h3>
              <p className="text-2xl font-bold text-blue-600">8</p>
            </CardContent>
          </Card>
          <Card className="shadow-sm bg-white">
            <CardContent className="p-4">
              <h3 className="text-lg font-semibold">Resultados Listos</h3>
              <p className="text-2xl font-bold text-green-600">12</p>
            </CardContent>
          </Card>
          <Card className="shadow-sm bg-white">
            <CardContent className="p-4">
              <h3 className="text-lg font-semibold">Pacientes Recientes</h3>
              <p className="text-2xl font-bold text-purple-600">5</p>
            </CardContent>
          </Card>
        </div>

        {/* Lista de Pacientes Recientes */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-3">Pacientes Recientes</h2>
          <div className="bg-white shadow-sm rounded-lg p-4">
            <ul className="space-y-2">
              <li className="flex justify-between border-b pb-2">
                <span>Ana López</span>
                <span className="text-sm text-gray-500">02/06/2025</span>
              </li>
              <li className="flex justify-between border-b pb-2">
                <span>Julián Méndez</span>
                <span className="text-sm text-gray-500">01/06/2025</span>
              </li>
              <li className="flex justify-between border-b pb-2">
                <span>Camila Torres</span>
                <span className="text-sm text-gray-500">30/05/2025</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Notificaciones */}
        <div>
          <h2 className="text-xl font-semibold mb-3">Notificaciones</h2>
          <div className="bg-white shadow-sm rounded-lg p-4 space-y-2">
            <p className="text-sm">🧪 Resultados listos para Juan Pérez - Glucemia.</p>
            <p className="text-sm">📄 Nueva solicitud enviada por la Dra. Sosa.</p>
          </div>
        </div>

      </div>
    </div>
  )
}
