// src/pages/medico/GestionPacientes.tsx

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

// Componentes UI (Asegúrate de tenerlos, si no usa HTML estándar)
import { Button } from "@/components/ui/button"; 
// Si no tienes el componente Input o Button configurado, puedes cambiarlo por <input> y <button> HTML estándar.

// ==========================================
// INTERFACES
// ==========================================
interface Paciente {
  nro_ficha: number;
  nombre: string;
  apellido: string;
  dni: number;
  fecha_nacimiento: string;
  edad: number;
  sexo: string;
  
  // Datos de contacto y ubicación
  telefono?: string;
  direccion?: string;
  localidad?: string;
  provincia?: string;
  email?: string;
  
  // Datos médicos / administrativos
  mutual: string;
  nro_afiliado?: string;
  grupo_sanguineo?: string;
  factor?: string;
  antecedentes?: string;
  observaciones?: string;
  
  // Datos del listado
  estado: string;
  fecha_creacion: string;
  total_ordenes: number;
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
  
  // Estados de Datos
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
  const [totalPacientes, setTotalPacientes] = useState(0);
  
  // Modal y Detalles
  const [mostrarDetalles, setMostrarDetalles] = useState(false);
  const [pacienteSeleccionado, setPacienteSeleccionado] = useState<Paciente | null>(null);
  const [loadingDetalle, setLoadingDetalle] = useState(false);
  
  // Datos para filtros
  const [mutuales, setMutuales] = useState<string[]>([]);
  const [usuarioId, setUsuarioId] = useState<number | null>(null);

  // ==========================================
  // EFECTOS Y CARGA
  // ==========================================

  useEffect(() => {
    const usuario = localStorage.getItem("usuario");
    if (!usuario) {
      navigate("/login");
      return;
    }

    const parsedUsuario = JSON.parse(usuario);
    setUsuarioId(parsedUsuario.id);
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
        
        // Extraer mutuales únicas para filtro
        const mutualesUnicas = Array.from(new Set(response.data.pacientes.map(p => p.mutual)));
        setMutuales(mutualesUnicas);
      } else {
        setError("Error al cargar pacientes");
      }
    } catch (error: any) {
      console.error("Error al cargar pacientes:", error);
      setError("Error al cargar los pacientes");
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // LÓGICA DEL DETALLE (MODAL)
  // ==========================================

  const verDetallesPaciente = async (paciente: Paciente) => {
    setMostrarDetalles(true);
    setLoadingDetalle(true);
    // Primero mostramos lo que ya tenemos en la tabla
    setPacienteSeleccionado(paciente); 

    try {
      // Pedimos TODOS los datos al backend (incluyendo lo que no sale en la tabla)
      // Asegúrate de que tu backend tenga esta ruta: /api/paciente/ficha/:nro_ficha
      const response = await axios.get(
        `http://localhost:5000/api/paciente/ficha/${paciente.nro_ficha}`
      );
      
      if (response.data.success) {
        // Actualizamos con la info completa
        setPacienteSeleccionado(response.data.paciente);
      }
    } catch (error) {
      console.error("Error al obtener detalles completos:", error);
      // Si falla, al menos mostramos los datos básicos que ya teníamos
    } finally {
      setLoadingDetalle(false);
    }
  };

  const cerrarModal = () => {
    setMostrarDetalles(false);
    setPacienteSeleccionado(null);
  };

  // ==========================================
  // UTILIDADES
  // ==========================================

  const formatFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString('es-AR');
  };

  const navegarANuevaOrden = (paciente: Paciente) => {
    sessionStorage.setItem('paciente_preseleccionado', JSON.stringify(paciente));
    navigate('/medico/nueva-solicitud');
  };

  const verHistorialCompleto = (paciente: Paciente) => {
    navigate(`/medico/paciente/${paciente.nro_ficha}/historial`);
  };

  const limpiarFiltros = () => {
    setBusqueda("");
    setFiltroMutual("todos");
    setFiltroSexo("todos");
    setOrdenamiento("reciente");
    setPaginaActual(1);
  };

  const navigateBack = () => {
    navigate('/MedicoDashboard');
  };

  // ==========================================
  // RENDERIZADO
  // ==========================================

  return (
    <div className="min-h-screen bg-blue-50">
      
      {/* --- HEADER --- */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <button onClick={navigateBack} className="mr-4 p-2 text-gray-500 hover:text-blue-600 transition-colors">
                ← Volver
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">👥 Gestión de Pacientes</h1>
                <p className="text-gray-600 text-sm">Administrar pacientes y su historial clínico</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/medico/paciente/nuevo')}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors shadow-sm font-medium text-sm"
            >
              + Registrar Paciente
            </button>
          </div>
        </div>
      </div>

      {/* --- CONTENIDO PRINCIPAL --- */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6 flex items-center gap-2">
            <span>⚠️</span> {error}
          </div>
        )}

        {/* --- FILTROS --- */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            {/* Búsqueda */}
            <div className="md:col-span-4">
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Buscar</label>
              <input
                type="text"
                placeholder="Nombre, apellido, DNI..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Filtro Mutual */}
            <div className="md:col-span-3">
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Obra Social</label>
              <select
                value={filtroMutual}
                onChange={(e) => setFiltroMutual(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="todos">Todas</option>
                {mutuales.map(mutual => (
                  <option key={mutual} value={mutual}>{mutual}</option>
                ))}
              </select>
            </div>

            {/* Filtro Sexo */}
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Sexo</label>
              <select
                value={filtroSexo}
                onChange={(e) => setFiltroSexo(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="todos">Todos</option>
                <option value="M">Masculino</option>
                <option value="F">Femenino</option>
              </select>
            </div>

            {/* Ordenamiento */}
            <div className="md:col-span-3">
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Ordenar</label>
              <select
                value={ordenamiento}
                onChange={(e) => setOrdenamiento(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="reciente">Más reciente</option>
                <option value="nombre">Nombre A-Z</option>
                <option value="edad_desc">Mayor edad</option>
                <option value="edad_asc">Menor edad</option>
                <option value="mas_ordenes">Más órdenes</option>
              </select>
            </div>
          </div>

          <div className="flex justify-between items-center mt-4 border-t pt-3">
            <p className="text-xs text-gray-500">
              Mostrando <strong>{pacientes.length}</strong> de {totalPacientes} resultados
            </p>
            <button
              onClick={limpiarFiltros}
              className="text-blue-600 hover:text-blue-800 text-xs font-bold uppercase tracking-wide hover:underline"
            >
              Limpiar filtros
            </button>
          </div>
        </div>

        {/* --- TABLA DE PACIENTES --- */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {loading ? (
             <div className="p-12 text-center">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-500">Cargando datos...</p>
             </div>
          ) : (
            <div className="overflow-x-auto">
              {pacientes.length > 0 ? (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Paciente</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Detalles</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Cobertura</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Actividad</th>
                      <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Acciones</th>
                    </tr>
                  </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {pacientes.map((paciente) => {
                    // 🛡️ Lógica defensiva: Si 'nombre' viene vacío, intentamos leer 'Nombre_paciente' (formato BD)
                    const nombreReal = paciente.nombre || (paciente as any).Nombre_paciente || "Sin Nombre";
                    const apellidoReal = paciente.apellido || (paciente as any).Apellido_paciente || "";
                    const iniciales = `${nombreReal[0] || "?"}${apellidoReal[0] || "?"}`.toUpperCase();

                    return (
                      <tr key={paciente.nro_ficha} className="hover:bg-blue-50/50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                              {/* Avatar con iniciales seguras */}
                              <div className="h-10 w-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm mr-3 border border-blue-200">
                                {iniciales}
                              </div>
                              <div>
                                {/* Nombre completo seguro */}
                                <div className="text-sm font-bold text-gray-900">{nombreReal} {apellidoReal}</div>
                                <div className="text-xs text-gray-500">DNI: {paciente.dni}</div>
                              </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{paciente.edad} años</div>
                          <div className="text-xs text-gray-500">{paciente.sexo === 'M' ? 'Masculino' : 'Femenino'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                              {paciente.mutual || "Particular"}
                            </span>
                            {paciente.nro_afiliado && (
                              <div className="text-xs text-gray-400 mt-1">Af: {paciente.nro_afiliado}</div>
                            )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className="font-medium text-gray-900">{paciente.total_ordenes} órdenes</div>
                          {paciente.ultima_orden && (
                            <div className="text-xs">Última: {formatFecha(paciente.ultima_orden)}</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end gap-2">
                              <button
                                onClick={() => verDetallesPaciente(paciente)}
                                className="text-blue-600 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 p-2 rounded-lg transition-colors"
                                title="Ver Ficha Completa"
                              >
                                👁️
                              </button>
                              <button
                                onClick={() => navegarANuevaOrden(paciente)}
                                className="text-green-600 hover:text-green-900 bg-green-50 hover:bg-green-100 p-2 rounded-lg transition-colors"
                                title="Crear Nueva Orden"
                              >
                                🧪
                              </button>
                              <button
                                onClick={() => verHistorialCompleto(paciente)}
                                className="text-purple-600 hover:text-purple-900 bg-purple-50 hover:bg-purple-100 p-2 rounded-lg transition-colors"
                                title="Ver Historial"
                              >
                                📄
                              </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                </table>
              ) : (
                <div className="text-center py-16">
                  <div className="text-gray-300 text-6xl mb-4">🔍</div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No se encontraron pacientes</h3>
                  <p className="text-gray-500">Intenta cambiar los filtros de búsqueda o registra un nuevo paciente.</p>
                </div>
              )}
            </div>
          )}

          {/* Paginación */}
          {totalPaginas > 1 && (
            <div className="bg-gray-50 px-4 py-3 flex items-center justify-between border-t border-gray-200">
              <div className="flex-1 flex justify-between items-center">
                <button
                  onClick={() => setPaginaActual(prev => Math.max(prev - 1, 1))}
                  disabled={paginaActual === 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Anterior
                </button>
                <span className="text-sm text-gray-700">
                  Página <span className="font-bold">{paginaActual}</span> de {totalPaginas}
                </span>
                <button
                  onClick={() => setPaginaActual(prev => Math.min(prev + 1, totalPaginas))}
                  disabled={paginaActual === totalPaginas}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Siguiente
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ======================================================= */}
      {/* MODAL DE DETALLES DEL PACIENTE (NUEVO DISEÑO)           */}
      {/* ======================================================= */}
      {mostrarDetalles && pacienteSeleccionado && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
            
         {/* Header del Modal - VERSIÓN CORREGIDA Y SEGURA */}
            <div className="bg-blue-600 p-6 text-white flex justify-between items-start sticky top-0 z-10 shadow-md">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center text-2xl font-bold backdrop-blur-md border-2 border-white/30">
                    {/* LÓGICA SEGURA: Busca 'nombre' O 'Nombre_paciente' O usa '?' */}
                    {(() => {
                        const nombre = pacienteSeleccionado.nombre || (pacienteSeleccionado as any).Nombre_paciente || "?";
                        const apellido = pacienteSeleccionado.apellido || (pacienteSeleccionado as any).Apellido_paciente || "?";
                        return `${nombre[0] || ""}${apellido[0] || ""}`.toUpperCase();
                    })()}
                </div>
                <div>
                  <h2 className="text-2xl font-bold">
                    {loadingDetalle 
                        ? "Cargando..." 
                        : (() => {
                            const nombre = pacienteSeleccionado.nombre || (pacienteSeleccionado as any).Nombre_paciente || "Sin Nombre";
                            const apellido = pacienteSeleccionado.apellido || (pacienteSeleccionado as any).Apellido_paciente || "";
                            return `${nombre} ${apellido}`;
                          })()
                    }
                  </h2>
                  <p className="text-blue-100 opacity-90 text-sm">
                    Ficha N° {pacienteSeleccionado.nro_ficha} • DNI {pacienteSeleccionado.dni}
                  </p>
                </div>
              </div>
              <button onClick={cerrarModal} className="text-white/70 hover:text-white text-3xl font-bold leading-none">&times;</button>
            </div>

            {/* Contenido del Modal */}
            <div className="p-6 space-y-8 bg-gray-50/50 min-h-[400px]">
              
              {loadingDetalle ? (
                 <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                   <div className="animate-spin h-10 w-10 border-4 border-blue-600 border-t-transparent rounded-full mb-4"></div>
                   <p>Obteniendo ficha completa...</p>
                 </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    
                    {/* COLUMNA 1: Datos Biológicos */}
                    <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                      <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 border-b pb-2 flex items-center gap-2">
                        <span>🧬</span> Datos Biológicos
                      </h3>
                      <ul className="space-y-3 text-sm">
                          <li className="flex justify-between"><span className="text-gray-500">Edad:</span> <span className="font-semibold text-gray-800">{pacienteSeleccionado.edad} años</span></li>
                          <li className="flex justify-between"><span className="text-gray-500">Sexo:</span> <span className="font-semibold text-gray-800">{pacienteSeleccionado.sexo === 'M' ? 'Masculino' : 'Femenino'}</span></li>
                          <li className="flex justify-between"><span className="text-gray-500">Nacimiento:</span> <span className="font-semibold text-gray-800">{formatFecha(pacienteSeleccionado.fecha_nacimiento)}</span></li>
                          <li className="flex justify-between items-center">
                            <span className="text-gray-500">Sangre:</span> 
                            <span className="font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded border border-red-100">
                              {pacienteSeleccionado.grupo_sanguineo || "--"} {pacienteSeleccionado.factor}
                            </span>
                          </li>
                      </ul>
                    </div>

                    {/* COLUMNA 2: Contacto */}
                    <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                      <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 border-b pb-2 flex items-center gap-2">
                        <span>📞</span> Contacto
                      </h3>
                      <ul className="space-y-4 text-sm">
                          <li className="flex flex-col">
                              <span className="text-gray-400 text-xs uppercase">Teléfono</span>
                              <span className="font-semibold text-blue-600">{pacienteSeleccionado.telefono || "No registrado"}</span>
                          </li>
                          <li className="flex flex-col">
                              <span className="text-gray-400 text-xs uppercase">Email</span>
                              <span className="font-medium text-gray-800 truncate" title={pacienteSeleccionado.email}>{pacienteSeleccionado.email || "No registrado"}</span>
                          </li>
                          <li className="flex flex-col">
                              <span className="text-gray-400 text-xs uppercase">Domicilio</span>
                              <span className="font-medium text-gray-800">{pacienteSeleccionado.direccion || "Sin dirección"}</span>
                              <span className="text-xs text-gray-500">{pacienteSeleccionado.localidad} {pacienteSeleccionado.provincia}</span>
                          </li>
                      </ul>
                    </div>

                    {/* COLUMNA 3: Cobertura */}
                    <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                      <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 border-b pb-2 flex items-center gap-2">
                        <span>🏥</span> Cobertura
                      </h3>
                      <div className="text-center py-4 bg-indigo-50 rounded-lg border border-indigo-100">
                          <p className="text-xs text-indigo-500 mb-1 font-semibold uppercase">Obra Social Actual</p>
                          <p className="text-lg font-bold text-indigo-700">{pacienteSeleccionado.mutual || "PARTICULAR"}</p>
                      </div>
                      {pacienteSeleccionado.nro_afiliado && (
                          <div className="mt-4 flex justify-between items-center text-sm border-t pt-3">
                              <span className="text-gray-500">Nro. Afiliado:</span>
                              <span className="font-mono font-medium bg-gray-100 px-2 rounded">{pacienteSeleccionado.nro_afiliado}</span>
                          </div>
                      )}
                    </div>
                  </div>

                  {/* Observaciones y Antecedentes */}
                  {(pacienteSeleccionado.observaciones || pacienteSeleccionado.antecedentes) && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                          {pacienteSeleccionado.antecedentes && (
                             <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-200">
                                <h3 className="text-xs font-bold text-yellow-800 uppercase mb-2 flex items-center gap-2">⚠️ Antecedentes / Alertas</h3>
                                <p className="text-sm text-gray-800 leading-relaxed">{pacienteSeleccionado.antecedentes}</p>
                             </div>
                          )}
                          {pacienteSeleccionado.observaciones && (
                             <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
                                <h3 className="text-xs font-bold text-blue-800 uppercase mb-2 flex items-center gap-2">📝 Notas Generales</h3>
                                <p className="text-sm text-gray-800 leading-relaxed">{pacienteSeleccionado.observaciones}</p>
                             </div>
                          )}
                      </div>
                  )}

                  {/* Footer del Modal */}
                  <div className="flex justify-end gap-3 pt-6 border-t border-gray-200 mt-4">
                      <Button variant="ghost" onClick={cerrarModal} className="text-gray-500">
                          Cerrar
                      </Button>
                      <Button 
                        onClick={() => verHistorialCompleto(pacienteSeleccionado)}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white"
                      >
                          📄 Ver Historial Completo
                      </Button>
                      <Button 
                        onClick={() => navegarANuevaOrden(pacienteSeleccionado)}
                        className="bg-green-600 hover:bg-green-700 text-white shadow-md hover:shadow-lg transition-all"
                      >
                          + Nueva Orden
                      </Button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}