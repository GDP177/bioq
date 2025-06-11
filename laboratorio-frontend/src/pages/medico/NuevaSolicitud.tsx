// src/pages/medico/NuevaSolicitud.tsx

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

interface Paciente {
  nro_ficha: number;
  nombre: string;
  apellido: string;
  dni: number;
  edad: number;
  sexo: string;
  mutual: string;
  nro_afiliado?: string;
  telefono?: string;
  email?: string;
}

interface Analisis {
  codigo: number;
  descripcion: string;
  tipo: string;
  codigo_modulo?: number;
  descripcion_modulo?: string;
  honorarios?: number;
  requiere_ayuno?: boolean;
}

interface NuevaSolicitudData {
  nro_ficha_paciente: number;
  analisis_solicitados: number[];
  urgente: boolean;
  requiere_ayuno: boolean;
  observaciones?: string;
  instrucciones_paciente?: string;
}

export default function NuevaSolicitud() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  // Estado para búsqueda de paciente
  const [dniBusqueda, setDniBusqueda] = useState("");
  const [pacienteSeleccionado, setPacienteSeleccionado] = useState<Paciente | null>(null);
  const [buscandoPaciente, setBuscandoPaciente] = useState(false);
  
  // Estado para análisis
  const [analisisDisponibles, setAnalisisDisponibles] = useState<Analisis[]>([]);
  const [analisisSeleccionados, setAnalisisSeleccionados] = useState<number[]>([]);
  const [filtroAnalisis, setFiltroAnalisis] = useState("");
  const [categoriaFiltro, setCategoriaFiltro] = useState("todos");
  
  // Estado para detalles de la orden
  const [urgente, setUrgente] = useState(false);
  const [requiereAyuno, setRequiereAyuno] = useState(false);
  const [observaciones, setObservaciones] = useState("");
  const [instruccionesPaciente, setInstruccionesPaciente] = useState("");

  // Obtener datos del médico logueado
  const [medicoId, setMedicoId] = useState<number | null>(null);

  useEffect(() => {
    const usuario = localStorage.getItem("usuario");
    if (!usuario) {
      navigate("/login");
      return;
    }

    const parsedUsuario = JSON.parse(usuario);
    setMedicoId(parsedUsuario.id);
    cargarAnalisisDisponibles();
  }, [navigate]);

  const cargarAnalisisDisponibles = async () => {
    try {
      const response = await axios.get(`http://localhost:5000/api/analisis`);
      if (response.data.success) {
        setAnalisisDisponibles(response.data.analisis);
      }
    } catch (error) {
      console.error("Error al cargar análisis:", error);
    }
  };

  const buscarPaciente = async () => {
    if (!dniBusqueda.trim()) {
      setError("Ingrese un DNI válido");
      return;
    }

    setBuscandoPaciente(true);
    setError("");

    try {
      const response = await axios.get(`http://localhost:5000/api/paciente/buscar/${dniBusqueda}`);
      
      if (response.data.success && response.data.paciente) {
        setPacienteSeleccionado(response.data.paciente);
        setStep(2);
      } else {
        setError("Paciente no encontrado. ¿Desea registrarlo?");
      }
    } catch (error: any) {
      if (error.response?.status === 404) {
        setError("Paciente no encontrado. ¿Desea registrarlo?");
      } else {
        setError("Error al buscar paciente");
      }
    } finally {
      setBuscandoPaciente(false);
    }
  };

  const toggleAnalisis = (codigoAnalisis: number) => {
    setAnalisisSeleccionados(prev => {
      if (prev.includes(codigoAnalisis)) {
        return prev.filter(codigo => codigo !== codigoAnalisis);
      } else {
        return [...prev, codigoAnalisis];
      }
    });
  };

  const analisisFiltrados = analisisDisponibles.filter(analisis => {
    const coincideBusqueda = analisis.descripcion.toLowerCase().includes(filtroAnalisis.toLowerCase()) ||
                           analisis.codigo.toString().includes(filtroAnalisis);
    
    const coincideCategoria = categoriaFiltro === "todos" || 
                             analisis.tipo?.toLowerCase().includes(categoriaFiltro.toLowerCase());
    
    return coincideBusqueda && coincideCategoria;
  });

  const categorias = Array.from(new Set(analisisDisponibles.map(a => a.tipo).filter(Boolean)));

  const crearSolicitud = async () => {
    if (!pacienteSeleccionado || analisisSeleccionados.length === 0 || !medicoId) {
      setError("Complete todos los campos requeridos");
      return;
    }

    setLoading(true);
    setError("");

    const solicitudData: NuevaSolicitudData = {
      nro_ficha_paciente: pacienteSeleccionado.nro_ficha,
      analisis_solicitados: analisisSeleccionados,
      urgente,
      requiere_ayuno: requiereAyuno,
      observaciones: observaciones.trim() || undefined,
      instrucciones_paciente: instruccionesPaciente.trim() || undefined
    };

    try {
      const response = await axios.post(
        `http://localhost:5000/api/medico/${medicoId}/nueva-solicitud`,
        solicitudData
      );

      if (response.data.success) {
        // Redirigir al detalle de la orden creada
        navigate(`/medico/orden/${response.data.orden_id}`);
      } else {
        setError(response.data.message || "Error al crear la solicitud");
      }
    } catch (error: any) {
      setError(error.response?.data?.message || "Error al crear la solicitud");
    } finally {
      setLoading(false);
    }
  };

  const calcularCostoTotal = () => {
    return analisisSeleccionados.reduce((total, codigo) => {
      const analisis = analisisDisponibles.find(a => a.codigo === codigo);
      return total + (analisis?.honorarios || 0);
    }, 0);
  };

  const navigateBack = () => {
    navigate('/MedicoDashboard');
  };

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
                  ➕ Nueva Solicitud de Análisis
                </h1>
                <p className="text-gray-600">
                  Crear nueva orden de análisis clínicos
                </p>
              </div>
            </div>
            
            {/* Indicador de pasos */}
            <div className="flex items-center space-x-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'
              }`}>
                1
              </div>
              <div className="w-8 h-1 bg-gray-300"></div>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'
              }`}>
                2
              </div>
              <div className="w-8 h-1 bg-gray-300"></div>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step >= 3 ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'
              }`}>
                3
              </div>
            </div>
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

        {/* Step 1: Selección de Paciente */}
        {step === 1 && (
          <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              👤 Paso 1: Seleccionar Paciente
            </h2>
            
            <div className="max-w-md">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                DNI del Paciente
              </label>
              <div className="flex">
                <input
                  type="text"
                  placeholder="Ingrese DNI..."
                  value={dniBusqueda}
                  onChange={(e) => setDniBusqueda(e.target.value)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onKeyPress={(e) => e.key === 'Enter' && buscarPaciente()}
                />
                <button
                  onClick={buscarPaciente}
                  disabled={buscandoPaciente}
                  className="bg-blue-600 text-white px-6 py-2 rounded-r-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {buscandoPaciente ? '🔍' : 'Buscar'}
                </button>
              </div>
              <p className="text-sm text-gray-500 mt-2">
                Ingrese el DNI del paciente para buscar en el sistema
              </p>
            </div>
          </div>
        )}

        {/* Step 2: Selección de Análisis */}
        {step === 2 && pacienteSeleccionado && (
          <div className="space-y-6">
            {/* Información del paciente seleccionado */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Paciente Seleccionado
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Nombre</p>
                  <p className="font-medium">{pacienteSeleccionado.nombre} {pacienteSeleccionado.apellido}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">DNI</p>
                  <p className="font-medium">{pacienteSeleccionado.dni}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Edad / Sexo</p>
                  <p className="font-medium">{pacienteSeleccionado.edad} años - {pacienteSeleccionado.sexo}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Obra Social</p>
                  <p className="font-medium">{pacienteSeleccionado.mutual}</p>
                </div>
              </div>
            </div>

            {/* Selección de análisis */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                🧪 Paso 2: Seleccionar Análisis
              </h3>
              
              {/* Filtros */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Buscar análisis
                  </label>
                  <input
                    type="text"
                    placeholder="Buscar por nombre o código..."
                    value={filtroAnalisis}
                    onChange={(e) => setFiltroAnalisis(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Categoría
                  </label>
                  <select
                    value={categoriaFiltro}
                    onChange={(e) => setCategoriaFiltro(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="todos">Todas las categorías</option>
                    {categorias.map(categoria => (
                      <option key={categoria} value={categoria}>{categoria}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Lista de análisis */}
              <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-lg">
                {analisisFiltrados.map((analisis) => (
                  <div key={analisis.codigo} className="border-b border-gray-100 last:border-b-0">
                    <label className="flex items-center p-4 hover:bg-gray-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={analisisSeleccionados.includes(analisis.codigo)}
                        onChange={() => toggleAnalisis(analisis.codigo)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <div className="ml-3 flex-1">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {analisis.descripcion}
                            </p>
                            <p className="text-sm text-gray-500">
                              {analisis.tipo} • Código: {analisis.codigo}
                            </p>
                          </div>
                          {analisis.honorarios && (
                            <div className="text-right">
                              <p className="text-sm font-medium text-gray-900">
                                ${analisis.honorarios.toFixed(2)}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </label>
                  </div>
                ))}
              </div>

              {/* Resumen de selección */}
              {analisisSeleccionados.length > 0 && (
                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium text-blue-900">
                        {analisisSeleccionados.length} análisis seleccionados
                      </p>
                      <p className="text-sm text-blue-700">
                        Costo estimado: ${calcularCostoTotal().toFixed(2)}
                      </p>
                    </div>
                    <button
                      onClick={() => setStep(3)}
                      className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
                    >
                      Continuar →
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 3: Detalles finales */}
        {step === 3 && (
          <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              📝 Paso 3: Detalles de la Solicitud
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Opciones */}
              <div className="space-y-6">
                <div className="flex items-center">
                  <input
                    id="urgente"
                    type="checkbox"
                    checked={urgente}
                    onChange={(e) => setUrgente(e.target.checked)}
                    className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                  />
                  <label htmlFor="urgente" className="ml-2 text-sm font-medium text-gray-700">
                    🚨 Marcar como URGENTE
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    id="ayuno"
                    type="checkbox"
                    checked={requiereAyuno}
                    onChange={(e) => setRequiereAyuno(e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="ayuno" className="ml-2 text-sm font-medium text-gray-700">
                    ⏰ Requiere ayuno
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Observaciones médicas
                  </label>
                  <textarea
                    value={observaciones}
                    onChange={(e) => setObservaciones(e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Información clínica relevante, antecedentes, etc."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Instrucciones para el paciente
                  </label>
                  <textarea
                    value={instruccionesPaciente}
                    onChange={(e) => setInstruccionesPaciente(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Preparación previa, horarios recomendados, etc."
                  />
                </div>
              </div>

              {/* Resumen */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">Resumen de la Solicitud</h3>
                
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">Paciente:</h4>
                  <p className="text-sm text-gray-600">
                    {pacienteSeleccionado?.nombre} {pacienteSeleccionado?.apellido} - DNI: {pacienteSeleccionado?.dni}
                  </p>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">
                    Análisis ({analisisSeleccionados.length}):
                  </h4>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {analisisSeleccionados.map(codigo => {
                      const analisis = analisisDisponibles.find(a => a.codigo === codigo);
                      return (
                        <p key={codigo} className="text-sm text-gray-600">
                          • {analisis?.descripcion}
                        </p>
                      );
                    })}
                  </div>
                </div>

                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-gray-900">Costo total estimado:</span>
                    <span className="text-lg font-bold text-blue-600">
                      ${calcularCostoTotal().toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="flex space-x-4 pt-4">
                  <button
                    onClick={() => setStep(2)}
                    className="flex-1 bg-gray-300 text-gray-700 px-6 py-3 rounded-md hover:bg-gray-400"
                  >
                    ← Volver
                  </button>
                  <button
                    onClick={crearSolicitud}
                    disabled={loading}
                    className="flex-1 bg-green-600 text-white px-6 py-3 rounded-md hover:bg-green-700 disabled:opacity-50"
                  >
                    {loading ? 'Creando...' : '✓ Crear Solicitud'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}