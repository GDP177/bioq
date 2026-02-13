import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import axios, { AxiosError } from "axios";

// Componentes UI reutilizables
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
}

// Interfaz unificada con la versión de Admin
interface Analisis {
  id_analisis: number;
  codigo: string;     // Cambiado a string para mayor flexibilidad
  nombre: string;     // 'descripcion_practica' en BD
  categoria: string;
  precio_estimado?: number;
}

interface NuevaSolicitudData {
  nro_ficha_paciente: number;
  analisis_solicitados: string[]; // Enviamos códigos (strings)
  urgente: boolean;
  requiere_ayuno: boolean;
  observaciones?: string;
  email_usuario?: string; // ✅ NUEVO: Para vincular por email
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
  // Guardamos objetos completos para la UI, pero enviaremos códigos al backend
  const [seleccionados, setSeleccionados] = useState<Analisis[]>([]);
  
  const [filtroAnalisis, setFiltroAnalisis] = useState("");
  const [categoriaFiltro, setCategoriaFiltro] = useState("todos");
  
  // Estado para detalles de la orden
  const [urgente, setUrgente] = useState(false);
  const [requiereAyuno, setRequiereAyuno] = useState(false);
  const [observaciones, setObservaciones] = useState("");
  
  // Estados de Usuario / Médico
  const [medicoId, setMedicoId] = useState<number | null>(null);
  const [usuarioEmail, setUsuarioEmail] = useState<string>("");

  // ============================================
  // 1. CARGA INICIAL Y CATÁLOGO
  // ============================================

  useEffect(() => {
    const usuarioStr = localStorage.getItem("usuario");
    if (!usuarioStr) {
      navigate("/login");
      return;
    }
    try {
        const parsedUsuario = JSON.parse(usuarioStr);
        console.log("Debug Usuario:", parsedUsuario); 

        // 1. Buscar ID (para la URL)
        const idEncontrado = parsedUsuario.medico?.id || parsedUsuario.id || parsedUsuario.id_medico;
        
        // 2. Buscar Email (para la vinculación segura)
        // Intentamos varias rutas posibles según cómo guardes el login
        const emailEncontrado = parsedUsuario.email || parsedUsuario.medico?.email || parsedUsuario.usuario?.email;

        if (idEncontrado) {
            setMedicoId(idEncontrado);
            if (emailEncontrado) {
                setUsuarioEmail(emailEncontrado);
                console.log("Email recuperado para validación:", emailEncontrado);
            }
            cargarAnalisisDisponibles();
        } else {
            console.error("No se encontró ID de médico en sesión");
            setError("Error de sesión: No se identificó al médico. Por favor inicie sesión nuevamente.");
        }
    } catch (e) {
        console.error(e);
        navigate("/login");
    }
  }, [navigate]);

  const cargarAnalisisDisponibles = async () => {
    try {
      // ✅ Usamos el endpoint correcto del catálogo
      const response = await axios.get('http://localhost:5000/api/ordenes/catalogo');
      
      if (response.data.success) {
        const rawData = response.data.data || response.data.analisis || [];
        
        const mapeados: Analisis[] = rawData.map((item: any) => ({
            id_analisis: item.id_analisis || item.codigo_practica, 
            codigo: item.codigo || item.codigo_practica,
            nombre: item.nombre || item.descripcion_practica,
            categoria: item.categoria || item.TIPO || "General",
            precio_estimado: item.precio_estimado || item.HONORARIOS || 0
        }));
        
        setAnalisisDisponibles(mapeados);
      }
    } catch (error) {
      console.error("Error al cargar catálogo:", error);
      setError("Error al cargar el catálogo de análisis. Verifique la conexión.");
    }
  };

  // ============================================
  // 2. LÓGICA DE PACIENTES
  // ============================================

  const buscarPacientesEnTiempoReal = async (dni: string) => {
    if (!dni.trim()) return;
    setBuscandoPaciente(true);
    try {
      const response = await axios.get(`http://localhost:5000/api/paciente/buscar-dni-parcial/${dni}`);
      if (response.data.success && response.data.pacientes) {
        setSugerenciasPacientes(response.data.pacientes);
        setMostrarSugerencias(true);
      } else {
        setSugerenciasPacientes([]);
      }
    } catch (error) {
      setSugerenciasPacientes([]);
    } finally {
      setBuscandoPaciente(false);
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (dniBusqueda.trim().length >= 3) {
        buscarPacientesEnTiempoReal(dniBusqueda);
      } else {
        setSugerenciasPacientes([]);
        setMostrarSugerencias(false);
      }
    }, 400);
    return () => clearTimeout(timeoutId);
  }, [dniBusqueda]);

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
            setError("PACIENTE NO ENCONTRADO. Verifique el DNI.");
        }
    } catch (error) {
        setError("PACIENTE NO ENCONTRADO. ¿Desea registrarlo?");
    } finally {
        setBuscandoPaciente(false);
    }
  };

  // ============================================
  // 3. LÓGICA DE ANÁLISIS
  // ============================================

  const toggleAnalisis = (item: Analisis) => {
    const yaEsta = seleccionados.find(s => s.codigo === item.codigo);
    if (yaEsta) {
        setSeleccionados(prev => prev.filter(s => s.codigo !== item.codigo));
    } else {
        setSeleccionados(prev => [...prev, item]);
    }
  };

  const analisisFiltrados = useMemo(() => {
    return analisisDisponibles.filter(analisis => {
        const termino = filtroAnalisis.toLowerCase();
        const coincideBusqueda = 
            analisis.nombre.toLowerCase().includes(termino) ||
            analisis.codigo.toString().toLowerCase().includes(termino);
        
        const coincideCategoria = 
            categoriaFiltro === "todos" || 
            analisis.categoria?.toLowerCase() === categoriaFiltro.toLowerCase();
        
        return coincideBusqueda && coincideCategoria;
    });
  }, [analisisDisponibles, filtroAnalisis, categoriaFiltro]);

  const categorias = useMemo(() => {
      return Array.from(new Set(analisisDisponibles.map(a => a.categoria).filter(Boolean)));
  }, [analisisDisponibles]);

  // ============================================
  // 4. CREAR SOLICITUD
  // ============================================

  const crearSolicitud = async () => {
    if (!pacienteSeleccionado || seleccionados.length === 0) {
        setError("Complete todos los campos requeridos (Paciente y al menos un análisis).");
        return;
    }
    
    if (!medicoId) {
        setError("Error crítico: No se ha identificado al médico solicitante. Por favor, cierre sesión y vuelva a ingresar.");
        return;
    }

    setLoading(true);

    const solicitudData: NuevaSolicitudData = {
        nro_ficha_paciente: pacienteSeleccionado.nro_ficha,
        analisis_solicitados: seleccionados.map(s => s.codigo),
        urgente,
        requiere_ayuno: requiereAyuno,
        observaciones: observaciones.trim(),
        email_usuario: usuarioEmail // ✅ ENVIAMOS EL EMAIL
    };

    try {
        console.log(`📤 Enviando solicitud. Médico ID URL: ${medicoId}, Email: ${usuarioEmail}`);
        
        const response = await axios.post(
            `http://localhost:5000/api/medico/${medicoId}/nueva-solicitud`,
            solicitudData
        );

        if (response.data.success) {
            alert("✅ Solicitud creada correctamente");
            navigate(`/medico/orden/${response.data.orden_id}`);
        }
    } catch (err) {
        console.error(err);
        const axiosError = err as AxiosError<{ message: string }>;
        setError(axiosError.response?.data?.message || "Error al crear la solicitud.");
    } finally {
        setLoading(false);
    }
  };

  const navigateBack = () => navigate('/medico/dashboard');

  // ============================================
  // RENDERIZADO
  // ============================================

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      {/* Header */}
      <header className="bg-white shadow-sm border-b p-4 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center">
            <Button variant="ghost" onClick={navigateBack} className="mr-4 text-slate-500 hover:text-blue-600">
                ← Volver
            </Button>
            <div>
              <h1 className="text-xl font-bold text-slate-800">📋 Nueva Solicitud</h1>
              <p className="text-xs text-slate-500">Crear orden de laboratorio</p>
            </div>
          </div>
        </div>
      </header>

      {/* Stepper */}
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
          </div>
        )}

        {/* PASO 1: SELECCIÓN DE PACIENTE */}
        {step === 1 && (
          <CustomCard className="animate-in fade-in zoom-in-95 duration-300">
            <h2 className="text-lg font-bold mb-6 text-slate-700 border-b pb-2">👤 Paso 1: Buscar Paciente</h2>
            <div className="max-w-md relative mx-auto md:mx-0">
              <FormField htmlFor="dni-busqueda" label="DNI del Paciente">
                <div className="flex shadow-sm rounded-md">
                  <Input 
                    id="dni-busqueda" 
                    placeholder="Ej: 35123456" 
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
              
              {mostrarSugerencias && (
                <SugerenciasPacientes 
                    pacientes={sugerenciasPacientes} 
                    onSeleccionar={seleccionarPaciente} 
                    loading={buscandoPaciente} 
                />
              )}
            </div>
            
            <div className="mt-8 bg-blue-50 p-4 rounded-lg text-sm text-blue-800 border border-blue-100 flex gap-3">
                <span className="text-xl">ℹ️</span>
                <p>Ingrese el DNI del paciente para buscarlo. Si el paciente ya existe en el sistema, sus datos se cargarán automáticamente.</p>
            </div>
          </CustomCard>
        )}

        {/* PASO 2: SELECCIÓN DE ANÁLISIS */}
        {step === 2 && pacienteSeleccionado && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            {/* Tarjeta Resumen Paciente */}
            <CustomCard>
                <div className="flex justify-between items-center border-b pb-4 mb-4">
                    <h3 className="font-bold text-slate-700">Datos del Paciente</h3>
                    <Button variant="ghost" onClick={() => setStep(1)} className="text-xs text-blue-600 h-auto py-1">Cambiar</Button>
                </div>
                <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-lg">
                        {pacienteSeleccionado.nombre[0]}{pacienteSeleccionado.apellido[0]}
                    </div>
                    <div>
                        <p className="font-bold text-slate-800 text-lg">{pacienteSeleccionado.apellido}, {pacienteSeleccionado.nombre}</p>
                        <div className="text-sm text-slate-500 flex gap-3">
                            <span>DNI: {pacienteSeleccionado.dni}</span>
                            <span>•</span>
                            <span>{pacienteSeleccionado.edad} años</span>
                            <span>•</span>
                            <span className="text-blue-600 font-medium">{pacienteSeleccionado.mutual}</span>
                        </div>
                    </div>
                </div>
            </CustomCard>

            <CustomCard title="🧪 Paso 2: Seleccionar Análisis">
              <div className="flex flex-col md:flex-row gap-4 mb-6 sticky top-0 bg-white z-10 py-2 border-b">
                <Input 
                    placeholder="🔍 Buscar análisis por nombre o código..." 
                    value={filtroAnalisis} 
                    onChange={(e) => setFiltroAnalisis(e.target.value)}
                    className="flex-1"
                    autoFocus
                />
                <select 
                    value={categoriaFiltro} 
                    onChange={(e) => setCategoriaFiltro(e.target.value)} 
                    className="border border-gray-300 rounded-md px-3 py-2 bg-white text-sm focus:ring-2 focus:ring-blue-500 outline-none w-full md:w-64"
                >
                  <option value="todos">📂 Todas las categorías</option>
                  {categorias.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div className="max-h-[400px] overflow-y-auto border border-gray-100 rounded-lg bg-slate-50/50">
                {analisisFiltrados.length > 0 ? (
                    analisisFiltrados.map((a) => {
                        const isSelected = seleccionados.some(s => s.codigo === a.codigo);
                        return (
                            <div 
                                key={a.codigo} 
                                onClick={() => toggleAnalisis(a)}
                                className={`flex items-center p-3 cursor-pointer border-b border-gray-100 last:border-0 transition-colors 
                                ${isSelected ? 'bg-blue-50 border-blue-100' : 'hover:bg-white'}`}
                            >
                                <div className={`w-5 h-5 rounded border mr-4 flex items-center justify-center transition-colors
                                    ${isSelected ? 'bg-blue-600 border-blue-600' : 'border-gray-300 bg-white'}`}>
                                    {isSelected && <span className="text-white text-xs">✓</span>}
                                </div>
                                <div className="flex-1">
                                    <div className="flex justify-between items-start">
                                        <p className={`font-semibold text-sm ${isSelected ? 'text-blue-800' : 'text-gray-700'}`}>
                                            {a.nombre}
                                        </p>
                                        <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded font-mono ml-2">
                                            #{a.codigo}
                                        </span>
                                    </div>
                                    <p className="text-xs text-gray-400 mt-0.5">{a.categoria}</p>
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <div className="p-8 text-center text-gray-400">
                        No hay coincidencias.
                    </div>
                )}
              </div>
              
              <div className="mt-6 flex justify-between items-center bg-gray-50 p-4 rounded-lg border border-gray-200">
                <div>
                    <span className="text-sm font-medium text-gray-600">Seleccionados:</span>
                    <span className="ml-2 text-xl font-bold text-blue-600">{seleccionados.length}</span>
                </div>
                <Button 
                    onClick={() => setStep(3)} 
                    disabled={seleccionados.length === 0}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6"
                >
                    Continuar →
                </Button>
              </div>
            </CustomCard>
          </div>
        )}

        {/* PASO 3: CONFIRMACIÓN */}
        {step === 3 && pacienteSeleccionado && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <CustomCard title="📋 Paso 3: Confirmar y Enviar">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 {/* Resumen */}
                 <div className="space-y-4">
                    <div className="bg-white border rounded-xl p-4 shadow-sm">
                        <h3 className="font-bold text-slate-700 text-xs uppercase mb-3">Paciente</h3>
                        <p className="text-lg font-bold text-slate-800">{pacienteSeleccionado.nombre} {pacienteSeleccionado.apellido}</p>
                        <p className="text-slate-500 text-sm">{pacienteSeleccionado.mutual} - DNI {pacienteSeleccionado.dni}</p>
                    </div>

                    <div className="bg-white border rounded-xl p-4 shadow-sm">
                        <div className="flex justify-between items-center mb-3 border-b pb-2">
                            <h3 className="font-bold text-slate-700 text-xs uppercase">Análisis ({seleccionados.length})</h3>
                        </div>
                        <ul className="max-h-60 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                            {seleccionados.map(a => (
                                <li key={a.codigo} className="text-sm text-slate-600 flex justify-between">
                                    <span>{a.nombre}</span>
                                    <span className="font-mono text-slate-400 text-xs">#{a.codigo}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                 </div>

                 {/* Opciones */}
                 <div className="space-y-6">
                    <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-5">
                        <h3 className="font-bold text-yellow-800 text-xs uppercase mb-4">Opciones Adicionales</h3>
                        
                        <label className="flex items-center gap-3 p-3 rounded-lg bg-white border border-yellow-200 cursor-pointer hover:shadow-sm mb-3">
                            <input 
                                type="checkbox" 
                                checked={urgente} 
                                onChange={(e) => setUrgente(e.target.checked)} 
                                className="w-5 h-5 text-red-600 rounded focus:ring-red-500"
                            />
                            <div>
                                <span className={`block font-bold text-sm ${urgente ? 'text-red-600' : 'text-slate-700'}`}>MARCAR COMO URGENTE</span>
                                <span className="text-xs text-slate-500">Prioridad alta en laboratorio</span>
                            </div>
                        </label>

                        <label className="flex items-center gap-3 p-3 rounded-lg bg-white border border-yellow-200 cursor-pointer hover:shadow-sm">
                            <input 
                                type="checkbox" 
                                checked={requiereAyuno} 
                                onChange={(e) => setRequiereAyuno(e.target.checked)} 
                                className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                            />
                            <div>
                                <span className={`block font-bold text-sm ${requiereAyuno ? 'text-blue-700' : 'text-slate-700'}`}>REQUIERE AYUNO</span>
                                <span className="text-xs text-slate-500">Indicación para el paciente</span>
                            </div>
                        </label>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Observaciones / Diagnóstico</label>
                        <textarea 
                            placeholder="Escriba aquí cualquier observación clínica relevante..." 
                            value={observaciones} 
                            onChange={(e) => setObservaciones(e.target.value)} 
                            className="border border-gray-300 p-3 rounded-xl w-full text-sm focus:ring-2 focus:ring-blue-500 outline-none shadow-sm min-h-[100px]" 
                        />
                    </div>
                 </div>
              </div>

              <div className="flex justify-end gap-4 mt-8 border-t pt-6">
                <Button variant="ghost" onClick={() => setStep(2)} disabled={loading} className="text-gray-600">
                    Atrás
                </Button>
                <Button 
                    onClick={crearSolicitud} 
                    disabled={loading} 
                    className={`px-8 py-2 rounded-lg shadow-md transition-all font-bold text-white
                    ${loading ? 'bg-gray-400' : 'bg-green-600 hover:bg-green-700 hover:scale-105'}`}
                >
                    {loading ? 'Procesando...' : '✅ Confirmar Solicitud'}
                </Button>
              </div>
            </CustomCard>
          </div>
        )}
      </main>
    </div>
  );
}