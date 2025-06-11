// src/pages/medico/GestionPacientes.tsx

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

interface Paciente {
  nro_ficha: number;
  nombre: string;
  apellido: string;
  dni: number;
  fecha_nacimiento: string;
  edad: number;
  sexo: string;
  telefono?: string;
  direccion?: string;
  email?: string;
  mutual: string;
  nro_afiliado?: string;
  grupo_sanguineo?: string;
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
  
  // Modal
  const [mostrarDetalles, setMostrarDetalles] = useState(false);
  const [pacienteSeleccionado, setPacienteSeleccionado] = useState<Paciente | null>(null);
  
  // Datos para filtros
  const [mutuales, setMutuales] = useState<string[]>([]);

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

  const verDetallesPaciente = async (paciente: Paciente) => {
    try {
      const usuario = JSON.parse(localStorage.getItem("usuario") || "{}");
      const response = await axios.get(
        `http://localhost:5000/api/medico/${usuario.id}/paciente/${paciente.nro_ficha}/historial`
      );
      
      if (response.data.success) {
        setPacienteSeleccionado({
          ...paciente,
          ...response.data.detalles
        });
        setMostrarDetalles(true);
      }
    } catch (error) {
      console.error("Error al obtener detalles:", error);
      setPacienteSeleccionado(paciente);
      setMostrarDetalles(true);
    }
  };

  const formatFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString('es-AR');
  };

  const calcularEdad = (fechaNacimiento: string) => {
    const hoy = new Date();
    const nacimiento = new Date(fechaNacimiento);
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const mes = hoy.getMonth() - nacimiento.getMonth();
    
    if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
      edad--;
    }
    
    return edad;
  };

  const navegarANuevaOrden = (paciente: Paciente) => {
    // Guardar paciente en sessionStorage para usar en nueva solicitud
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

  if (loading && pacientes.length === 0) {
    return (
      <div className="min-h-screen bg-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando pacientes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-blue-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <button
                onClick={navigateBack}
                className="mr-4 p-2 text-gray-600 hover:text-gray-900"
              >
                ← Volver
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  👥 Gestión de Pacientes
                </h1>
                <p className="text-gray-600">
                  Administrar pacientes y su historial clínico
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate('/medico/paciente/nuevo')}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              + Registrar Paciente
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {/* Filtros */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {/* Búsqueda */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Buscar paciente
              </label>
              <input
                type="text"
                placeholder="Nombre, apellido, DNI..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Filtro Mutual */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Obra Social
              </label>
              <select
                value={filtroMutual}
                onChange={(e) => setFiltroMutual(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="todos">Todas</option>
                {mutuales.map(mutual => (
                  <option key={mutual} value={mutual}>{mutual}</option>
                ))}
              </select>
            </div>

            {/* Filtro Sexo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sexo
              </label>
              <select
                value={filtroSexo}
                onChange={(e) => setFiltroSexo(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="todos">Todos</option>
                <option value="M">Masculino</option>
                <option value="F">Femenino</option>
              </select>
            </div>

            {/* Ordenamiento */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ordenar por
              </label>
              <select
                value={ordenamiento}
                onChange={(e) => setOrdenamiento(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="reciente">Más reciente</option>
                <option value="nombre">Nombre A-Z</option>
                <option value="edad_desc">Mayor edad</option>
                <option value="edad_asc">Menor edad</option>
                <option value="mas_ordenes">Más órdenes</option>
              </select>
            </div>
          </div>

          <div className="flex justify-between items-center mt-4">
            <p className="text-sm text-gray-600">
              Mostrando {pacientes.length} de {totalPacientes} pacientes
            </p>
            <button
              onClick={limpiarFiltros}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              Limpiar filtros
            </button>
          </div>
        </div>

        {/* Tabla de Pacientes */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="overflow-x-auto">
            {pacientes.length > 0 ? (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Paciente
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Datos Personales
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Obra Social
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Historial
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {pacientes.map((paciente) => (
                    <tr key={paciente.nro_ficha} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {paciente.nombre} {paciente.apellido}
                          </div>
                          <div className="text-sm text-gray-500">
                            DNI: {paciente.dni} • Ficha: {paciente.nro_ficha}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm text-gray-900">
                            {paciente.edad} años • {paciente.sexo === 'M' ? 'Masculino' : 'Femenino'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {formatFecha(paciente.fecha_nacimiento)}
                          </div>
                          {paciente.telefono && (
                            <div className="text-sm text-gray-500">
                              Tel: {paciente.telefono}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {paciente.mutual}
                          </div>
                          {paciente.nro_afiliado && (
                            <div className="text-sm text-gray-500">
                              N° {paciente.nro_afiliado}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {paciente.total_ordenes} órdenes
                          </div>
                          {paciente.ultima_orden && (
                            <div className="text-sm text-gray-500">
                              Última: {formatFecha(paciente.ultima_orden)}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <button
                          onClick={() => verDetallesPaciente(paciente)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Ver detalles
                        </button>
                        <button
                          onClick={() => navegarANuevaOrden(paciente)}
                          className="text-green-600 hover:text-green-900"
                        >
                          Nueva orden
                        </button>
                        <button
                          onClick={() => verHistorialCompleto(paciente)}
                          className="text-purple-600 hover:text-purple-900"
                        >
                          Historial
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="text-center py-12">
                <div className="text-gray-400 text-6xl mb-4">👥</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No se encontraron pacientes
                </h3>
                <p className="text-gray-500 mb-4">
                  {busqueda || filtroMutual !== 'todos' || filtroSexo !== 'todos'
                    ? 'Intenta cambiar los filtros de búsqueda'
                    : 'Aún no hay pacientes registrados'}
                </p>
              </div>
            )}
          </div>

          {/* Paginación */}
          {totalPaginas > 1 && (
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200">
              <div className="flex justify-between items-center w-full">
                <div>
                  <p className="text-sm text-gray-700">
                    Página <span className="font-medium">{paginaActual}</span> de{' '}
                    <span className="font-medium">{totalPaginas}</span>
                  </p>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setPaginaActual(prev => Math.max(prev - 1, 1))}
                    disabled={paginaActual === 1}
                    className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 disabled:opacity-50"
                  >
                    Anterior
                  </button>
                  <button
                    onClick={() => setPaginaActual(prev => Math.min(prev + 1, totalPaginas))}
                    disabled={paginaActual === totalPaginas}
                    className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 disabled:opacity-50"
                  >
                    Siguiente
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal de Detalles del Paciente */}
      {mostrarDetalles && pacienteSeleccionado && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                Detalles del Paciente
              </h3>
              <button
                onClick={() => setMostrarDetalles(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Información Personal</h4>
                <div className="space-y-2 text-sm">
                  <p><span className="font-medium">Nombre:</span> {pacienteSeleccionado.nombre} {pacienteSeleccionado.apellido}</p>
                  <p><span className="font-medium">DNI:</span> {pacienteSeleccionado.dni}</p>
                  <p><span className="font-medium">Edad:</span> {pacienteSeleccionado.edad} años</p>
                  <p><span className="font-medium">Sexo:</span> {pacienteSeleccionado.sexo === 'M' ? 'Masculino' : 'Femenino'}</p>
                  <p><span className="font-medium">Fecha Nacimiento:</span> {formatFecha(pacienteSeleccionado.fecha_nacimiento)}</p>
                  {pacienteSeleccionado.grupo_sanguineo && (
                    <p><span className="font-medium">Grupo Sanguíneo:</span> {pacienteSeleccionado.grupo_sanguineo}</p>
                  )}
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Contacto y Obra Social</h4>
                <div className="space-y-2 text-sm">
                  {pacienteSeleccionado.telefono && (
                    <p><span className="font-medium">Teléfono:</span> {pacienteSeleccionado.telefono}</p>
                  )}
                  {pacienteSeleccionado.email && (
                    <p><span className="font-medium">Email:</span> {pacienteSeleccionado.email}</p>
                  )}
                  {pacienteSeleccionado.direccion && (
                    <p><span className="font-medium">Dirección:</span> {pacienteSeleccionado.direccion}</p>
                  )}
                  <p><span className="font-medium">Obra Social:</span> {pacienteSeleccionado.mutual}</p>
                  {pacienteSeleccionado.nro_afiliado && (
                    <p><span className="font-medium">N° Afiliado:</span> {pacienteSeleccionado.nro_afiliado}</p>
                  )}
                </div>
              </div>
            </div>
            
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => navegarANuevaOrden(pacienteSeleccionado)}
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
              >
                Nueva Orden
              </button>
              <button
                onClick={() => verHistorialCompleto(pacienteSeleccionado)}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
              >
                Ver Historial Completo
              </button>
              <button
                onClick={() => setMostrarDetalles(false)}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}