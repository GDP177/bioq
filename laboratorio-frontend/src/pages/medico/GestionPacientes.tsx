// src/pages/medico/GestionPacientes.tsx

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { MainLayout } from "../../components/layout/MainLayout"; 

// ==========================================
// INTERFACES
// ==========================================
interface Paciente {
  nro_ficha: number;
  dni: number;
  edad: number;
  sexo: string;
  mutual: string;
  // Soporte para variantes de nombres (DB vs Frontend)
  nombre?: string;
  Nombre?: string;
  Nombre_paciente?: string;
  apellido?: string;
  Apellido?: string;
  Apellido_paciente?: string;
  // Extras
  fecha_nacimiento?: string;
  telefono?: string;
  email?: string;
  direccion?: string;
  nro_afiliado?: string;
  grupo_sanguineo?: string;
  total_ordenes?: number;
  ultima_orden?: string;
}

interface PacientesResponse {
  success: boolean;
  pacientes: Paciente[];
  total: number;
  pagina_actual: number;
  total_paginas: number;
}

export default function GestionPacientes() {
  const navigate = useNavigate();
  
  // Estados
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Filtros
  const [busqueda, setBusqueda] = useState("");
  const [filtroMutual, setFiltroMutual] = useState("todos");
  const [filtroSexo, setFiltroSexo] = useState("todos");
  const [ordenamiento, setOrdenamiento] = useState("reciente");
  
  // Paginación
  const [paginaActual, setPaginaActual] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [mutuales, setMutuales] = useState<string[]>([]);

  // ==========================================
  // HELPER PARA NOMBRES (Evita "S/D")
  // ==========================================
  const getDatosSeguros = (p: any) => {
    if (!p) return { nombre: "Desconocido", apellido: "", completo: "Desconocido", iniciales: "??" };
    const nombre = p.nombre || p.Nombre || p.Nombre_paciente || p.nombre_paciente || "Sin Nombre";
    const apellido = p.apellido || p.Apellido || p.Apellido_paciente || p.apellido_paciente || "";
    const inicialN = nombre && nombre.length > 0 ? nombre[0] : "?";
    const inicialA = apellido && apellido.length > 0 ? apellido[0] : "";
    return {
        nombre,
        apellido,
        completo: `${apellido}, ${nombre}`.trim(),
        iniciales: `${inicialN}${inicialA}`.toUpperCase()
    };
  };

  // ==========================================
  // CARGA DE DATOS (ENDPOINT ADMIN)
  // ==========================================
  useEffect(() => {
    cargarPacientes();
  }, [busqueda, filtroMutual, filtroSexo, ordenamiento, paginaActual]);

  const cargarPacientes = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (busqueda) params.set('buscar', busqueda);
      if (filtroMutual !== 'todos') params.set('mutual', filtroMutual); // Envía ID o nombre según tu select
      if (filtroSexo !== 'todos') params.set('sexo', filtroSexo);
      params.set('orden', ordenamiento);
      params.set('pagina', paginaActual.toString());
      params.set('limite', '20');

      // ✅ Usamos el endpoint general que arreglamos en el controlador
      const response = await axios.get<PacientesResponse>(
        `http://localhost:5000/api/pacientes?${params.toString()}`
      );

      if (response.data.success) {
        setPacientes(response.data.pacientes);
        setTotalPaginas(response.data.total_paginas);
        
        // Extraer mutuales únicas para el filtro (opcional)
        const mutualesUnicas = Array.from(new Set(response.data.pacientes.map(p => p.mutual))).filter(Boolean);
        if (mutuales.length === 0 && mutualesUnicas.length > 0) {
            setMutuales(mutualesUnicas as string[]);
        }
      }
    } catch (error) {
      console.error("Error cargando pacientes:", error);
      setError("No se pudieron cargar los pacientes.");
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // ⚡ ACCIÓN CLAVE: IR A NUEVA ORDEN
  // ==========================================
  const irANuevaOrden = (p: Paciente) => {
    // 1. Guardamos el paciente seleccionado en memoria temporal
    sessionStorage.setItem('paciente_preseleccionado', JSON.stringify(p));
    
    // 2. Navegamos a la pantalla de creación
    // Asegúrate que esta ruta coincida con la de tu router para 'NuevaOrden.tsx'
    navigate('/medico/nueva-solicitud'); // ✅ CORREGIDO: Apuntar a la ruta de médico existente
  };

  const limpiarFiltros = () => {
    setBusqueda(""); setFiltroMutual("todos"); setFiltroSexo("todos"); setOrdenamiento("reciente"); setPaginaActual(1);
  };

  return (
    <MainLayout>
        <div className="min-h-screen bg-gray-50 p-6">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-800">👥 Gestión de Pacientes</h1>
                <p className="text-sm text-gray-500">Base de datos general de pacientes</p>
            </div>
            {/* ✅ CORREGIDO: Ruta actualizada a la que SÍ existe en App.tsx */}
            <button onClick={() => navigate('/medico/paciente/nuevo')} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium shadow-sm transition-all">
                + Registrar Paciente
            </button>
        </div>

        {/* Filtros */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 mb-6 grid grid-cols-1 md:grid-cols-12 gap-4">
            <div className="md:col-span-4">
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Buscar</label>
                <input 
                    type="text" 
                    placeholder="Nombre, Apellido, DNI..." 
                    value={busqueda} 
                    onChange={e => setBusqueda(e.target.value)} 
                    className="w-full border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                />
            </div>
            <div className="md:col-span-3">
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Obra Social</label>
                <select value={filtroMutual} onChange={e => setFiltroMutual(e.target.value)} className="w-full border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="todos">Todas</option>
                    {mutuales.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
            </div>
            <div className="md:col-span-2">
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Sexo</label>
                <select value={filtroSexo} onChange={e => setFiltroSexo(e.target.value)} className="w-full border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="todos">Todos</option>
                    <option value="M">Masculino</option>
                    <option value="F">Femenino</option>
                </select>
            </div>
            <div className="md:col-span-3 flex items-end justify-between">
                 <div className="w-full mr-2">
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Orden</label>
                    <select value={ordenamiento} onChange={e => setOrdenamiento(e.target.value)} className="w-full border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500">
                        <option value="reciente">Recientes</option>
                        <option value="nombre">Alfabetico</option>
                    </select>
                 </div>
                 <button onClick={limpiarFiltros} className="text-blue-600 text-xs font-bold mb-3 hover:underline">Limpiar</button>
            </div>
        </div>

        {/* TABLA */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {loading ? (
             <div className="p-12 text-center text-gray-500 font-medium">Cargando pacientes...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Paciente</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Detalles</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Cobertura</th>
                    <th className="px-6 py-3 text-center text-xs font-bold text-gray-500 uppercase">Acciones</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {pacientes.map((paciente) => {
                    const datos = getDatosSeguros(paciente);
                    return (
                      <tr key={paciente.nro_ficha} className="hover:bg-blue-50 transition-colors group">
                        
                        {/* COLUMNA PACIENTE */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                             <div className="h-10 w-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm mr-3 border border-indigo-200">
                                {datos.iniciales}
                             </div>
                             <div>
                                <div className="text-sm font-bold text-gray-900 group-hover:text-blue-700">{datos.completo}</div>
                                <div className="text-xs text-gray-500">DNI: {paciente.dni}</div>
                             </div>
                          </div>
                        </td>

                        {/* COLUMNA DETALLES */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 font-medium">{paciente.edad} años</div>
                          <div className="text-xs text-gray-500">{paciente.sexo === 'M' ? 'Masculino' : 'Femenino'}</div>
                        </td>

                        {/* COLUMNA COBERTURA */}
                        <td className="px-6 py-4 whitespace-nowrap">
                           <span className="px-2 py-1 text-xs font-bold rounded bg-green-50 text-green-700 border border-green-200">
                             {paciente.mutual || "Particular"}
                           </span>
                           {paciente.nro_afiliado && <div className="text-[10px] text-gray-400 mt-1">Af: {paciente.nro_afiliado}</div>}
                        </td>

                        {/* COLUMNA ACCIONES */}
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <div className="flex justify-center items-center gap-2">
                              <button 
                                onClick={() => navigate(`/medico/paciente/${paciente.nro_ficha}/editar`)}
                                className="text-blue-600 hover:text-blue-800 text-xs font-bold border border-blue-200 hover:bg-blue-50 px-3 py-1 rounded transition-colors"
                              >
                                Ver Ficha
                              </button>
                              
                              {/* 🔥 BOTÓN QUE CONECTA TODO */}
                              <button 
                                onClick={() => irANuevaOrden(paciente)}
                                className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-xs font-bold shadow-sm transition-transform active:scale-95 flex items-center gap-1"
                              >
                                <span>+</span> Nueva Orden
                              </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          
          {/* Paginación */}
          <div className="p-4 border-t flex justify-between items-center bg-gray-50">
             <button disabled={paginaActual===1} onClick={()=>setPaginaActual(p=>p-1)} className="px-3 py-1 bg-white border rounded disabled:opacity-50 text-xs font-medium hover:bg-gray-100">Anterior</button>
             <span className="text-xs text-gray-600 font-medium">Página {paginaActual} de {totalPaginas}</span>
             <button disabled={paginaActual===totalPaginas} onClick={()=>setPaginaActual(p=>p+1)} className="px-3 py-1 bg-white border rounded disabled:opacity-50 text-xs font-medium hover:bg-gray-100">Siguiente</button>
          </div>
        </div>
        </div>
    </MainLayout>
  );
}