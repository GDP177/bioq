import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios, { AxiosError } from "axios";

// Componentes UI reutilizables
// Asegúrate de que estas rutas existan en tu proyecto
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/ui/form-field";
import { CustomCard } from "@/components/ui/CustomCard";

// ==========================================
// INTERFACES
// ==========================================

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
  codigo: number;       // Mapeado desde codigo_practica
  descripcion: string;  // Mapeado desde descripcion_practica
  tipo: string;         // Mapeado desde TIPO
  honorarios?: number;
  requiere_ayuno?: boolean;
}

interface NuevaSolicitudData {
  nro_ficha_paciente: number;
  analisis_solicitados: number[];
  urgente: boolean;
  requiere_ayuno: boolean;
  observaciones?: string;
}

interface SugerenciasProps {
  pacientes: Paciente[];
  onSeleccionar: (paciente: Paciente) => void;
  loading: boolean;
}

// ==========================================
// SUB-COMPONENTE: SUGERENCIAS
// ==========================================

const SugerenciasPacientes = ({ pacientes, onSeleccionar, loading }: SugerenciasProps) => {
  if (loading) return (
    <div className="absolute z-10 w-full bg-white border border-gray-300 rounded-md shadow-lg mt-1 p-3 text-center">
      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mx-auto mb-2"></div>
      <span className="text-sm text-gray-500">Buscando...</span>
    </div>
  );

  if (pacientes.length === 0) return null;

  return (
    <div className="absolute z-10 w-full bg-white border border-gray-300 rounded-md shadow-lg mt-1 max-h-60 overflow-y-auto">
      {pacientes.map((paciente) => (
        <div
          key={paciente.nro_ficha}
          className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors"
          onClick={() => onSeleccionar(paciente)}
        >
          <div className="flex justify-between items-start">
            <div>
              <p className="font-medium text-gray-900">{paciente.nombre} {paciente.apellido}</p>
              <p className="text-xs text-gray-500">DNI: {paciente.dni} • {paciente.edad} años</p>
            </div>
            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full font-medium">
              Ficha #{paciente.nro_ficha}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};

// ==========================================
// COMPONENTE PRINCIPAL
// ==========================================

export default function NuevaSolicitud() {
  const navigate = useNavigate();
  
  // Estado de pasos y carga general
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  // Estado para búsqueda de paciente
  const [dniBusqueda, setDniBusqueda] = useState("");
  const [pacienteSeleccionado, setPacienteSeleccionado] = useState<Paciente | null>(null);
  const [buscandoPaciente, setBuscandoPaciente] = useState(false);
  const [sugerenciasPacientes, setSugerenciasPacientes] = useState<Paciente[]>([]);
  const [mostrarSugerencias, setMostrarSugerencias] = useState(false);
  
  // Estado para análisis
  const [analisisDisponibles, setAnalisisDisponibles] = useState<Analisis[]>([]);
  const [analisisSeleccionados, setAnalisisSeleccionados] = useState<number[]>([]);
  const [filtroAnalisis, setFiltroAnalisis] = useState("");
  const [categoriaFiltro, setCategoriaFiltro] = useState("todos");
  
  // Estado para detalles de la orden
  const [urgente, setUrgente] = useState(false);
  const [requiereAyuno, setRequiereAyuno] = useState(false);
  const [observaciones, setObservaciones] = useState("");
  const [medicoId, setMedicoId] = useState<number | null>(null);

  // ============================================
  // FUNCIONES DE CARGA Y BÚSQUEDA
  // ============================================

  const cargarAnalisisDisponibles = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/catalogo-analisis');
      if (response.data.success && Array.isArray(response.data.data)) {
        const mapeados: Analisis[] = response.data.data.map((a: any) => ({
          codigo: a.codigo_practica,
          descripcion: a.descripcion_practica,
          tipo: a.TIPO || 'General',
          honorarios: a.honorarios || 0 // Aseguramos que tenga un valor numérico
        }));
        setAnalisisDisponibles(mapeados);
      }
    } catch (error) {
      console.error("Error al cargar:", error);
      setError("Error al cargar el catálogo de análisis. Verifique la conexión.");
    }
  };

  const buscarPacientesEnTiempoReal = async (dni: string) => {
    if (!dni.trim()) return;
    setBuscandoPaciente(true);
    try {
      // Ajusta la URL si tu endpoint de búsqueda "live" es diferente
      const response = await axios.get(`http://localhost:5000/api/paciente/buscar-por-dni/${dni}`);
      if (response.data.success && response.data.pacientes) {
        setSugerenciasPacientes(response.data.pacientes);
        setMostrarSugerencias(true);
      } else {
        setSugerenciasPacientes([]);
      }
    } catch (error) {
      console.error("Error al buscar:", error);
      setSugerenciasPacientes([]);
    } finally {
      setBuscandoPaciente(false);
    }
  };

  const seleccionarPaciente = (paciente: Paciente) => {
    setPacienteSeleccionado(paciente);
    setDniBusqueda(paciente.dni.toString());
    setMostrarSugerencias(false);
    setStep(2);
    setError("");
  };

  const buscarPacientePorDNICompleto = async () => {
    if (!dniBusqueda.trim()) {
        setError("Ingrese un DNI válido");
        return;
    }
    setBuscandoPaciente(true);
    setError("");
    try {
        const response = await axios.get(`http://localhost:5000/api/paciente/buscar/${dniBusqueda}`);
        if (response.data.success && response.data.paciente) {
            seleccionarPaciente(response.data.paciente);
        } else {
            setError("PACIENTE NO ENCONTRADO. ¿DESEA REGISTRARLO?");
        }
    } catch (error) {
        setError("PACIENTE NO ENCONTRADO. ¿DESEA REGISTRARLO?");
    } finally {
        setBuscandoPaciente(false);
    }
  };

  // ============================================
  // EFECTOS (Hooks)
  // ============================================

  useEffect(() => {
    const usuario = localStorage.getItem("usuario");
    if (!usuario) {
      navigate("/login");
      return;
    }
    try {
        const parsedUsuario = JSON.parse(usuario);
        setMedicoId(parsedUsuario.id);
        cargarAnalisisDisponibles();
    } catch (e) {
        navigate("/login");
    }
  }, [navigate]);

  // Debounce para la búsqueda en tiempo real
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (dniBusqueda.trim().length >= 2) {
        buscarPacientesEnTiempoReal(dniBusqueda);
      } else {
        setSugerenciasPacientes([]);
        setMostrarSugerencias(false);
      }
    }, 400); // Aumenté un poco el tiempo para evitar llamadas excesivas
    return () => clearTimeout(timeoutId);
  }, [dniBusqueda]);

  // ============================================
  // MANEJADORES DE SOLICITUD
  // ============================================

  const toggleAnalisis = (codigoAnalisis: number) => {
    setAnalisisSeleccionados(prev => 
      prev.includes(codigoAnalisis) 
        ? prev.filter(codigo => codigo !== codigoAnalisis) 
        : [...prev, codigoAnalisis]
    );
  };

  const crearSolicitud = async () => {
    if (!pacienteSeleccionado || analisisSeleccionados.length === 0 || !medicoId) {
        setError("Complete todos los campos requeridos (Paciente y al menos un análisis).");
        return;
    }
    setLoading(true);

    const solicitudData: NuevaSolicitudData = {
        nro_ficha_paciente: pacienteSeleccionado.nro_ficha,
        analisis_solicitados: analisisSeleccionados,
        urgente,
        requiere_ayuno: requiereAyuno,
        observaciones: observaciones.trim()
    };

    try {
        const response = await axios.post(
            `http://localhost:5000/api/medico/${medicoId}/nueva-solicitud`,
            solicitudData
        );

        if (response.data.success) {
            // Redirige a la vista de la orden creada
            navigate(`/medico/orden/${response.data.orden_id}`);
        }
    } catch (err) {
        const axiosError = err as AxiosError<{ message: string }>;
        setError(axiosError.response?.data?.message || "Error al crear la solicitud. Intente nuevamente.");
    } finally {
        setLoading(false);
    }
  };

  // Filtros de análisis
  const analisisFiltrados = analisisDisponibles.filter(analisis => {
    const termino = filtroAnalisis.toLowerCase();
    const coincideBusqueda = 
        analisis.descripcion.toLowerCase().includes(termino) ||
        analisis.codigo.toString().includes(termino);
    
    const coincideCategoria = 
        categoriaFiltro === "todos" || 
        analisis.tipo?.toLowerCase().includes(categoriaFiltro.toLowerCase());
    
    return coincideBusqueda && coincideCategoria;
  });

  // Obtener categorías únicas para el select
  const categorias = Array.from(new Set(analisisDisponibles.map(a => a.tipo).filter(Boolean)));

  const navigateBack = () => navigate('/MedicoDashboard');

  // ============================================
  // RENDERIZADO
  // ============================================

  return (
    <div className="min-h-screen bg-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b p-4 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center">
            <Button variant="ghost" onClick={navigateBack} className="mr-4 text-gray-600 hover:text-blue-600">
                ← Volver
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">📋 Nueva Solicitud</h1>
              <p className="text-sm text-gray-500">Crear orden de laboratorio</p>
            </div>
          </div>
        </div>
      </header>

      {/* Stepper (Indicador de pasos) */}
      <div className="bg-white border-b py-4 shadow-sm">
        <div className="flex justify-center items-center space-x-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex items-center">
              <div 
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors duration-300
                ${step >= i ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-200 text-gray-500'}`}
              >
                {i}
              </div>
              {i < 3 && (
                  <div className={`w-12 h-1 mx-2 rounded ${step > i ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
              )}
            </div>
          ))}
        </div>
        <div className="text-center mt-2 text-xs font-medium text-gray-500">
            {step === 1 ? "Seleccionar Paciente" : step === 2 ? "Seleccionar Análisis" : "Confirmar"}
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Mensajes de Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl mb-6 flex justify-between items-center shadow-sm animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center gap-3">
              <span className="text-xl">⚠️</span>
              <strong className="text-sm font-semibold">{error}</strong>
            </div>
            {error.includes("NO ENCONTRADO") && (
              <Button 
                  onClick={() => navigate('/medico/paciente/nuevo')} 
                  className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-4 py-2 rounded-lg shadow-sm"
              >
                  + Registrar Paciente
              </Button>
            )}
          </div>
        )}

        {/* PASO 1: SELECCIÓN DE PACIENTE */}
        {step === 1 && (
          <CustomCard className="animate-in fade-in zoom-in-95 duration-300">
            <h2 className="text-xl font-semibold mb-6 text-gray-800 border-b pb-2">👤 Paso 1: Buscar Paciente</h2>
            <div className="max-w-md relative mx-auto md:mx-0">
              <FormField htmlFor="dni-busqueda" label="DNI del Paciente">
                <div className="flex shadow-sm rounded-md">
                  <Input 
                    id="dni-busqueda" 
                    placeholder="Ingrese DNI sin puntos (ej: 35123456)" 
                    value={dniBusqueda} 
                    onChange={(e) => setDniBusqueda(e.target.value.replace(/\D/g, ''))} 
                    className="rounded-r-none border-r-0 focus-visible:ring-0"
                    onKeyPress={(e) => e.key === 'Enter' && buscarPacientePorDNICompleto()}
                    autoComplete="off"
                  />
                  <Button 
                    onClick={buscarPacientePorDNICompleto} 
                    disabled={buscandoPaciente} 
                    className="rounded-l-none bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {buscandoPaciente ? '...' : 'Buscar'}
                  </Button>
                </div>
              </FormField>
              
              {/* Dropdown de sugerencias */}
              {mostrarSugerencias && (
                <SugerenciasPacientes 
                    pacientes={sugerenciasPacientes} 
                    onSeleccionar={seleccionarPaciente} 
                    loading={buscandoPaciente} 
                />
              )}
            </div>
            
            <div className="mt-8 bg-blue-50 p-4 rounded-lg text-sm text-blue-800 border border-blue-100">
                <p>ℹ️ <strong>Nota:</strong> Ingrese el DNI del paciente para buscarlo en la base de datos. Si no existe, el sistema le permitirá registrar uno nuevo.</p>
            </div>
          </CustomCard>
        )}

        {/* PASO 2: SELECCIÓN DE ANÁLISIS */}
        {step === 2 && pacienteSeleccionado && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            {/* Tarjeta Resumen Paciente */}
            <CustomCard title="Datos del Paciente">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="bg-gray-50 p-3 rounded border">
                    <p className="text-gray-500 text-xs uppercase tracking-wide">Nombre</p>
                    <p className="font-semibold text-gray-900">{pacienteSeleccionado.nombre} {pacienteSeleccionado.apellido}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded border">
                    <p className="text-gray-500 text-xs uppercase tracking-wide">DNI</p>
                    <p className="font-semibold text-gray-900">{pacienteSeleccionado.dni}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded border">
                    <p className="text-gray-500 text-xs uppercase tracking-wide">Edad / Sexo</p>
                    <p className="font-semibold text-gray-900">{pacienteSeleccionado.edad} años / {pacienteSeleccionado.sexo}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded border">
                    <p className="text-gray-500 text-xs uppercase tracking-wide">Cobertura</p>
                    <p className="font-semibold text-gray-900">{pacienteSeleccionado.mutual}</p>
                </div>
              </div>
              
              <div className="mt-4 flex justify-end">
                <Button 
                    variant="outline" 
                    onClick={() => setStep(1)} 
                    className="text-xs text-gray-600"
                >
                    Cambiar Paciente
                </Button>
              </div>
            </CustomCard>

            <CustomCard title="🧪 Paso 2: Seleccionar Análisis">
              <div className="flex flex-col md:flex-row gap-4 mb-6 sticky top-0 bg-white z-10 py-2">
                <Input 
                    placeholder="🔍 Buscar análisis por nombre o código..." 
                    value={filtroAnalisis} 
                    onChange={(e) => setFiltroAnalisis(e.target.value)}
                    className="flex-1"
                />
                <select 
                    value={categoriaFiltro} 
                    onChange={(e) => setCategoriaFiltro(e.target.value)} 
                    className="border border-gray-300 rounded-md px-3 py-2 bg-white text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="todos">📂 Todas las categorías</option>
                  {categorias.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div className="max-h-[500px] overflow-y-auto border border-gray-200 rounded-lg bg-white shadow-inner">
                {analisisFiltrados.length > 0 ? (
                    analisisFiltrados.map((a) => (
                    <label 
                        key={a.codigo} 
                        className={`flex items-center p-4 cursor-pointer border-b last:border-0 transition-colors duration-200 
                        ${analisisSeleccionados.includes(a.codigo) ? 'bg-blue-50 border-blue-100' : 'hover:bg-gray-50'}`}
                    >
                        <input 
                            type="checkbox" 
                            checked={analisisSeleccionados.includes(a.codigo)} 
                            onChange={() => toggleAnalisis(a.codigo)} 
                            className="h-5 w-5 text-blue-600 rounded focus:ring-blue-500 border-gray-300 mr-4" 
                        />
                        <div className="flex-1">
                        <div className="flex justify-between">
                            <p className="font-semibold text-gray-800 text-sm">{a.descripcion}</p>
                            {a.honorarios && a.honorarios > 0 && (
                                <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded font-mono">
                                    ${a.honorarios}
                                </span>
                            )}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                            Código: <span className="font-mono bg-gray-100 px-1 rounded">{a.codigo}</span> • 
                            <span className="ml-1 text-blue-600 font-medium">{a.tipo}</span>
                        </p>
                        </div>
                    </label>
                    ))
                ) : (
                    <div className="p-8 text-center text-gray-500">
                        No se encontraron análisis que coincidan con la búsqueda.
                    </div>
                )}
              </div>
              
              <div className="mt-6 flex justify-between items-center bg-gray-50 p-4 rounded-lg border">
                <div>
                    <span className="text-sm font-medium text-gray-600">Seleccionados:</span>
                    <span className="ml-2 text-xl font-bold text-blue-600">{analisisSeleccionados.length}</span>
                </div>
                <Button 
                    onClick={() => setStep(3)} 
                    disabled={analisisSeleccionados.length === 0}
                    className="px-8"
                >
                    Continuar al Resumen →
                </Button>
              </div>
            </CustomCard>
          </div>
        )}

        {/* PASO 3: CONFIRMACIÓN */}
        {step === 3 && pacienteSeleccionado && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <CustomCard title="📋 Paso 3: Confirmar y Enviar">
              
              <div className="flex flex-col md:flex-row gap-6">
                 {/* Columna Izquierda: Datos */}
                 <div className="flex-1 space-y-6">
                    <div className="bg-white border rounded-lg p-4 shadow-sm">
                        <h3 className="font-bold text-gray-700 border-b pb-2 mb-3 text-sm uppercase">Paciente</h3>
                        <p className="text-lg font-medium text-gray-900">{pacienteSeleccionado.nombre} {pacienteSeleccionado.apellido}</p>
                        <p className="text-gray-500">DNI {pacienteSeleccionado.dni} - {pacienteSeleccionado.mutual}</p>
                    </div>

                    <div className="bg-white border rounded-lg p-4 shadow-sm">
                        <h3 className="font-bold text-gray-700 border-b pb-2 mb-3 text-sm uppercase flex justify-between">
                            <span>Análisis Solicitados</span>
                            <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-xs">{analisisSeleccionados.length} prácticas</span>
                        </h3>
                        <div className="max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                            <ul className="space-y-2">
                                {analisisSeleccionados.map(c => (
                                    <li key={c} className="text-sm text-gray-700 flex items-start">
                                        <span className="text-blue-500 mr-2">•</span>
                                        {analisisDisponibles.find(a => a.codigo === c)?.descripcion || `Código ${c}`}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                 </div>

                 {/* Columna Derecha: Opciones y Observaciones */}
                 <div className="flex-1 space-y-6">
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-5">
                        <h3 className="font-bold text-yellow-800 border-b border-yellow-200 pb-2 mb-4 text-sm uppercase">Condiciones de la Orden</h3>
                        
                        <div className="space-y-4">
                            <label className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${urgente ? 'bg-red-50 border-red-300 shadow-sm' : 'bg-white border-gray-200'}`}>
                                <input 
                                    type="checkbox" 
                                    checked={urgente} 
                                    onChange={(e) => setUrgente(e.target.checked)} 
                                    className="w-5 h-5 text-red-600 rounded focus:ring-red-500"
                                />
                                <div>
                                    <span className={`block font-bold text-sm ${urgente ? 'text-red-700' : 'text-gray-700'}`}>MARCAR COMO URGENTE</span>
                                    <span className="text-xs text-gray-500">Prioridad alta en laboratorio</span>
                                </div>
                            </label>

                            <label className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${requiereAyuno ? 'bg-blue-50 border-blue-300 shadow-sm' : 'bg-white border-gray-200'}`}>
                                <input 
                                    type="checkbox" 
                                    checked={requiereAyuno} 
                                    onChange={(e) => setRequiereAyuno(e.target.checked)} 
                                    className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                                />
                                <div>
                                    <span className={`block font-bold text-sm ${requiereAyuno ? 'text-blue-700' : 'text-gray-700'}`}>REQUIERE AYUNO</span>
                                    <span className="text-xs text-gray-500">El paciente debe presentarse en ayunas</span>
                                </div>
                            </label>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Observaciones Clínicas / Diagnóstico Presuntivo</label>
                        <textarea 
                            placeholder="Escriba aquí cualquier observación relevante para el bioquímico..." 
                            value={observaciones} 
                            onChange={(e) => setObservaciones(e.target.value)} 
                            className="border border-gray-300 p-3 rounded-xl w-full text-sm focus:ring-2 focus:ring-blue-500 outline-none shadow-sm min-h-[120px]" 
                        />
                    </div>
                 </div>
              </div>

              <div className="flex justify-end gap-4 mt-8 border-t pt-6">
                <Button 
                    variant="ghost" 
                    onClick={() => setStep(2)}
                    disabled={loading}
                    className="text-gray-600"
                >
                    Atrás
                </Button>
                <Button 
                    onClick={crearSolicitud} 
                    disabled={loading} 
                    className={`px-10 py-6 rounded-xl shadow-lg transition-all text-base font-bold
                    ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700 text-white hover:scale-105'}`}
                >
                    {loading ? (
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            Procesando...
                        </div>
                    ) : '✅ Confirmar Solicitud'}
                </Button>
              </div>
            </CustomCard>
          </div>
        )}
      </main>
    </div>
  );
}