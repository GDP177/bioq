import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

// ==========================================
// INTERFACES (Flexible para evitar errores)
// ==========================================
interface Paciente {
  nro_ficha: number;
  dni: number;
  edad: number;
  sexo: string;
  mutual: string;
  
  // Campos opcionales que pueden venir con distintos nombres según tu BD
  nombre?: string;
  Nombre?: string;
  Nombre_paciente?: string;
  
  apellido?: string;
  Apellido?: string;
  Apellido_paciente?: string;

  fecha_nacimiento?: string;
  telefono?: string;
  email?: string;
  direccion?: string;
  localidad?: string;
  provincia?: string;
  nro_afiliado?: string;
  grupo_sanguineo?: string;
  factor?: string;
  antecedentes?: string;
  observaciones?: string;
  
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
  
  // Paginación y Modales
  const [paginaActual, setPaginaActual] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [totalPacientes, setTotalPacientes] = useState(0);
  const [mostrarDetalles, setMostrarDetalles] = useState(false);
  const [pacienteSeleccionado, setPacienteSeleccionado] = useState<Paciente | null>(null);
  const [loadingDetalle, setLoadingDetalle] = useState(false);
  const [mutuales, setMutuales] = useState<string[]>([]);

  // ==========================================
  // HELPER "A PRUEBA DE BALAS" PARA NOMBRES
  // ==========================================
  const getDatosSeguros = (p: any) => {
    if (!p) return { nombre: "Desconocido", apellido: "", completo: "Desconocido", iniciales: "??" };

    // Busca el nombre en TODAS las variantes posibles que puede mandar tu Backend
    const nombre = p.nombre || p.Nombre || p.Nombre_paciente || p.nombre_paciente || "Sin Nombre";
    const apellido = p.apellido || p.Apellido || p.Apellido_paciente || p.apellido_paciente || "";
    
    // Iniciales seguras
    const inicialN = nombre && nombre.length > 0 ? nombre[0] : "?";
    const inicialA = apellido && apellido.length > 0 ? apellido[0] : "";

    return {
        nombre,
        apellido,
        completo: `${nombre} ${apellido}`.trim(),
        iniciales: `${inicialN}${inicialA}`.toUpperCase()
    };
  };

  // ==========================================
  // CARGA DE DATOS
  // ==========================================
  useEffect(() => {
    const usuario = localStorage.getItem("usuario");
    if (!usuario) {
      navigate("/login");
      return;
    }
    const parsedUsuario = JSON.parse(usuario);
    cargarPacientes(parsedUsuario.id);
  }, [navigate, busqueda, filtroMutual, filtroSexo, ordenamiento, paginaActual]);

  const cargarPacientes = async (medicoId: number) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (busqueda) params.set('buscar', busqueda);
      if (filtroMutual !== 'todos') params.set('mutual', filtroMutual);
      if (filtroSexo !== 'todos') params.set('sexo', filtroSexo);
      params.set('orden', ordenamiento);
      params.set('pagina', paginaActual.toString());
      params.set('limite', '20');

      const response = await axios.get<PacientesResponse>(
        `http://localhost:5000/api/medico/${medicoId}/pacientes?${params.toString()}`
      );

      if (response.data.success) {
        setPacientes(response.data.pacientes);
        setTotalPaginas(response.data.total_paginas);
        setTotalPacientes(response.data.total);
        const mutualesUnicas = Array.from(new Set(response.data.pacientes.map(p => p.mutual)));
        setMutuales(mutualesUnicas);
      }
    } catch (error) {
      console.error("Error cargando pacientes:", error);
      setError("No se pudieron cargar los pacientes.");
    } finally {
      setLoading(false);
    }
  };

  const verDetallesPaciente = async (paciente: Paciente) => {
    setPacienteSeleccionado(paciente);
    setMostrarDetalles(true);
    setLoadingDetalle(true);

    try {
      const response = await axios.get(`http://localhost:5000/api/paciente/ficha/${paciente.nro_ficha}`);
      if (response.data.success) {
        // Combinamos los datos de la lista con los datos nuevos
        setPacienteSeleccionado(prev => ({ ...prev, ...response.data.paciente }));
      }
    } catch (error) {
      console.error("Error cargando ficha completa", error);
    } finally {
      setLoadingDetalle(false);
    }
  };

  const cerrarModal = () => {
    setMostrarDetalles(false);
    setPacienteSeleccionado(null);
  };

  // Navegación
  const formatFecha = (f: string | undefined) => f ? new Date(f).toLocaleDateString('es-AR') : "-";
  
  const irANuevaOrden = (p: Paciente) => {
    sessionStorage.setItem('paciente_preseleccionado', JSON.stringify(p));
    navigate('/medico/nueva-solicitud');
  };

  const irAHistorial = (p: Paciente) => {
    navigate(`/medico/paciente/${p.nro_ficha}/historial`);
  };

  const limpiarFiltros = () => {
    setBusqueda(""); setFiltroMutual("todos"); setFiltroSexo("todos"); setOrdenamiento("reciente"); setPaginaActual(1);
  };

  // ==========================================
  // RENDERIZADO
  // ==========================================
  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
      
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-20 border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/MedicoDashboard')} className="text-gray-500 hover:text-blue-600 font-medium">← Volver</button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Gestión de Pacientes</h1>
              <p className="text-sm text-gray-500">Administración de fichas médicas</p>
            </div>
          </div>
          <button onClick={() => navigate('/medico/paciente/nuevo')} className="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-lg font-medium shadow-sm transition-all">
            + Nuevo Paciente
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        
        {/* Filtros */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 mb-6 grid grid-cols-1 md:grid-cols-12 gap-4">
            <div className="md:col-span-4">
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Buscar</label>
                <input type="text" placeholder="Nombre, DNI..." value={busqueda} onChange={e => setBusqueda(e.target.value)} className="w-full border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"/>
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
                 <button onClick={limpiarFiltros} className="text-blue-600 text-xs font-bold mb-3 hover:underline whitespace-nowrap">Limpiar</button>
            </div>
        </div>

        {/* TABLA */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {loading ? (
             <div className="p-12 text-center text-gray-500">Cargando pacientes...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Paciente</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Edad/Sexo</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Cobertura</th>
                    <th className="px-6 py-3 text-center text-xs font-bold text-gray-500 uppercase">Acciones</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {pacientes.map((paciente) => {
                    const datos = getDatosSeguros(paciente); // Usamos el helper seguro
                    return (
                      <tr key={paciente.nro_ficha} className="hover:bg-blue-50 transition-colors group">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                             <div className="h-10 w-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm mr-3 border border-blue-200">
                                {datos.iniciales}
                             </div>
                             <div>
                                <div className="text-sm font-bold text-gray-900 group-hover:text-blue-700">{datos.completo}</div>
                                <div className="text-xs text-gray-500">DNI: {paciente.dni} • Ficha: {paciente.nro_ficha}</div>
                             </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{paciente.edad} años</div>
                          <div className="text-xs text-gray-500">{paciente.sexo === 'M' ? 'Masculino' : 'Femenino'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                           <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800 border border-green-200">
                             {paciente.mutual || "Particular"}
                           </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <div className="flex justify-center items-center gap-2">
                              {/* BOTONES CON TEXTO */}
                              <button 
                                onClick={() => verDetallesPaciente(paciente)}
                                className="bg-white border border-blue-300 text-blue-700 hover:bg-blue-50 px-3 py-1.5 rounded text-xs font-semibold transition-colors shadow-sm"
                              >
                                Ver Ficha
                              </button>
                              <button 
                                onClick={() => irANuevaOrden(paciente)}
                                className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded text-xs font-semibold transition-colors shadow-sm"
                              >
                                Nueva Orden
                              </button>
                              <button 
                                onClick={() => irAHistorial(paciente)}
                                className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1.5 rounded text-xs font-semibold transition-colors shadow-sm"
                              >
                                Historial
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
          
          {/* Paginación simple */}
          <div className="p-4 border-t flex justify-between items-center bg-gray-50">
             <button disabled={paginaActual===1} onClick={()=>setPaginaActual(p=>p-1)} className="px-4 py-2 bg-white border rounded disabled:opacity-50 text-sm">Anterior</button>
             <span className="text-sm text-gray-600">Página {paginaActual} de {totalPaginas}</span>
             <button disabled={paginaActual===totalPaginas} onClick={()=>setPaginaActual(p=>p+1)} className="px-4 py-2 bg-white border rounded disabled:opacity-50 text-sm">Siguiente</button>
          </div>
        </div>
      </main>

      {/* MODAL DETALLES */}
      {mostrarDetalles && pacienteSeleccionado && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden animate-in zoom-in-95">
            <div className="bg-blue-600 p-6 text-white flex justify-between items-start">
                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center text-2xl font-bold border-2 border-white/30">
                        {getDatosSeguros(pacienteSeleccionado).iniciales}
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold">{getDatosSeguros(pacienteSeleccionado).completo}</h2>
                        <p className="text-blue-100 opacity-90 text-sm">Ficha #{pacienteSeleccionado.nro_ficha}</p>
                    </div>
                </div>
                <button onClick={cerrarModal} className="text-white/80 hover:text-white text-3xl font-bold">&times;</button>
            </div>
            
            <div className="p-8 bg-gray-50">
                {loadingDetalle ? (
                    <div className="text-center py-10">Cargando datos completos...</div>
                ) : (
                    <div className="grid md:grid-cols-2 gap-8">
                        <div className="bg-white p-6 rounded-xl shadow-sm border">
                            <h3 className="text-xs font-bold text-gray-400 uppercase mb-4 border-b pb-2">Información Personal</h3>
                            <div className="space-y-3 text-sm">
                                <p><span className="font-semibold">DNI:</span> {pacienteSeleccionado.dni}</p>
                                <p><span className="font-semibold">Nacimiento:</span> {formatFecha(pacienteSeleccionado.fecha_nacimiento)}</p>
                                <p><span className="font-semibold">Edad:</span> {pacienteSeleccionado.edad} años</p>
                                <p><span className="font-semibold">Sexo:</span> {pacienteSeleccionado.sexo}</p>
                                <p><span className="font-semibold">Grupo Sanguíneo:</span> {pacienteSeleccionado.grupo_sanguineo || "ND"}</p>
                            </div>
                        </div>
                        <div className="bg-white p-6 rounded-xl shadow-sm border">
                            <h3 className="text-xs font-bold text-gray-400 uppercase mb-4 border-b pb-2">Contacto y Obra Social</h3>
                            <div className="space-y-3 text-sm">
                                <p><span className="font-semibold">Teléfono:</span> {pacienteSeleccionado.telefono || "-"}</p>
                                <p><span className="font-semibold">Email:</span> {pacienteSeleccionado.email || "-"}</p>
                                <p><span className="font-semibold">Dirección:</span> {pacienteSeleccionado.direccion || "-"}</p>
                                <p><span className="font-semibold text-blue-600">Obra Social:</span> {pacienteSeleccionado.mutual}</p>
                                <p><span className="font-semibold">N° Afiliado:</span> {pacienteSeleccionado.nro_afiliado || "-"}</p>
                            </div>
                        </div>
                    </div>
                )}
                
                <div className="flex justify-end gap-3 mt-8 pt-6 border-t">
                    <button onClick={cerrarModal} className="px-4 py-2 border rounded-lg hover:bg-gray-100 text-sm font-medium">Cerrar</button>
                    <button onClick={() => irANuevaOrden(pacienteSeleccionado)} className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium">Nueva Orden</button>
                    <button onClick={() => irAHistorial(pacienteSeleccionado)} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium">Ver Historial Completo</button>
                </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}