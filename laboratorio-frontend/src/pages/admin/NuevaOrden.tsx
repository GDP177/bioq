// src/pages/admin/NuevaOrden.tsx

import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import axios, { AxiosError } from "axios";
import { MainLayout } from "../../components/layout/MainLayout";

// ==========================================
// COMPONENTES UI LOCALES (Para mantener el estilo limpio sin romper importaciones)
// ==========================================
const Button = ({ onClick, children, className, disabled, variant = 'primary' }: any) => {
    const baseStyle = "px-4 py-2 rounded-lg font-bold transition-all shadow-sm flex items-center justify-center gap-2 outline-none focus:ring-4";
    const variants: any = {
        primary: "bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-200",
        ghost: "bg-transparent text-slate-500 hover:bg-slate-100 hover:text-blue-600 shadow-none",
        success: "bg-green-600 hover:bg-green-700 text-white focus:ring-green-200"
    };
    return (
        <button onClick={onClick} disabled={disabled} className={`${baseStyle} ${variants[variant]} ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}>
            {children}
        </button>
    );
};

const CustomCard = ({ title, children, className }: any) => (
    <div className={`bg-white rounded-xl shadow-sm border border-slate-200 p-6 ${className}`}>
      {title && <h2 className="text-lg font-bold mb-6 text-slate-700 border-b pb-2">{title}</h2>}
      {children}
    </div>
);

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
  id_obra_social?: number;
}

interface Analisis {
  id_analisis: number;
  codigo: string;
  nombre: string;
  categoria: string;
  precio_estimado?: number;
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
    <div className="absolute z-10 w-full bg-white border border-slate-200 rounded-md shadow-lg mt-1 p-3 text-center">
      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mx-auto mb-2"></div>
      <span className="text-sm text-slate-500">Buscando...</span>
    </div>
  );

  if (pacientes.length === 0) return null;

  return (
    <div className="absolute z-10 w-full bg-white border border-slate-200 rounded-md shadow-lg mt-1 max-h-60 overflow-y-auto">
      {pacientes.map((paciente) => (
        <div key={paciente.nro_ficha} className="p-3 hover:bg-slate-50 cursor-pointer border-b border-slate-100 last:border-b-0 transition-colors" onClick={() => onSeleccionar(paciente)}>
          <div className="flex justify-between items-start">
            <div>
              <p className="font-medium text-slate-900">{paciente.nombre} {paciente.apellido}</p>
              <p className="text-xs text-slate-500">DNI: {paciente.dni} • {paciente.edad} años</p>
            </div>
            <span className="text-[10px] bg-blue-50 text-blue-700 px-2 py-1 rounded-md font-bold uppercase tracking-wider border border-blue-100">
              Ficha #{paciente.nro_ficha}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};

// ==========================================
// COMPONENTE PRINCIPAL (ADMIN)
// ==========================================
export default function NuevaOrdenAdmin() {
  const navigate = useNavigate();
  
  // Estados de pasos y carga
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  // Modal de éxito
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Búsqueda de paciente
  const [dniBusqueda, setDniBusqueda] = useState("");
  const [pacienteSeleccionado, setPacienteSeleccionado] = useState<Paciente | null>(null);
  const [buscandoPaciente, setBuscandoPaciente] = useState(false);
  const [sugerenciasPacientes, setSugerenciasPacientes] = useState<Paciente[]>([]);
  const [mostrarSugerencias, setMostrarSugerencias] = useState(false);
  
  // Análisis
  const [analisisDisponibles, setAnalisisDisponibles] = useState<Analisis[]>([]);
  const [seleccionados, setSeleccionados] = useState<Analisis[]>([]);
  const [filtroAnalisis, setFiltroAnalisis] = useState("");
  const [categoriaFiltro, setCategoriaFiltro] = useState("todos");
  
  // Opciones
  const [urgente, setUrgente] = useState(false);
  const [requiereAyuno, setRequiereAyuno] = useState(false);
  const [observaciones, setObservaciones] = useState("");
  
  // Usuario
  const [idMedicoLogueado, setIdMedicoLogueado] = useState<number | null>(null);

  // ============================================
  // 1. CARGA INICIAL
  // ============================================
  useEffect(() => {
    // A) Recuperar Médico Logueado
    const usuarioStr = localStorage.getItem('usuario');
    if (usuarioStr && usuarioStr !== "undefined") {
        try {
            const usuario = JSON.parse(usuarioStr);
            if (usuario && usuario.id) {
                setIdMedicoLogueado(usuario.id);
            }
        } catch (e) { console.error(e); }
    }

    // B) Cargar Catálogo
    cargarCatalogo();

    // C) Verificar si hay paciente preseleccionado (viene de "Gestión Pacientes")
    const pacienteGuardado = sessionStorage.getItem('paciente_preseleccionado');
    if (pacienteGuardado) {
      try {
        const p = JSON.parse(pacienteGuardado);
        seleccionarPaciente(p);
        sessionStorage.removeItem('paciente_preseleccionado'); // Limpiamos para que no se tranque
      } catch (e) { console.error(e); }
    }
  }, []);

  const cargarCatalogo = async () => {
    try {
      const res = await axios.get(`http://localhost:5000/api/ordenes/catalogo`);
      if (res.data.success) {
        const items = res.data.data || res.data.analisis;
        setAnalisisDisponibles(items.map((item: any) => ({
            id_analisis: item.id_analisis || item.codigo_practica,
            codigo: item.codigo || item.codigo_practica,
            nombre: item.nombre || item.descripcion_practica,
            categoria: item.categoria || item.TIPO || "General",
            precio_estimado: item.precio_estimado || item.HONORARIOS || 0
        })));
      }
    } catch (e) {
      setError("Error al cargar el catálogo de análisis. Verifique su conexión.");
    }
  };

  // ============================================
  // 2. PACIENTES
  // ============================================
  const buscarPacientesEnTiempoReal = async (dni: string) => {
    if (!dni.trim()) return;
    setBuscandoPaciente(true);
    try {
      const res = await axios.get(`http://localhost:5000/api/paciente/buscar-dni-parcial/${dni}`);
      if (res.data.success && res.data.pacientes) {
        setSugerenciasPacientes(res.data.pacientes);
        setMostrarSugerencias(true);
      } else setSugerenciasPacientes([]);
    } catch (error) { setSugerenciasPacientes([]); } 
    finally { setBuscandoPaciente(false); }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (dniBusqueda.trim().length >= 3) buscarPacientesEnTiempoReal(dniBusqueda);
      else { setSugerenciasPacientes([]); setMostrarSugerencias(false); }
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
    if (!dniBusqueda.trim()) { setError("Ingrese un DNI válido"); return; }
    setBuscandoPaciente(true); setError("");
    try {
        const res = await axios.get(`http://localhost:5000/api/paciente/buscar/${dniBusqueda}`);
        if (res.data.success && res.data.paciente) seleccionarPaciente(res.data.paciente);
        else setError("PACIENTE NO ENCONTRADO. Regístrelo en la sección 'Pacientes'.");
    } catch (error) {
        setError("PACIENTE NO ENCONTRADO. Regístrelo en la sección 'Pacientes'.");
    } finally { setBuscandoPaciente(false); }
  };

  // ============================================
  // 3. ANÁLISIS
  // ============================================
  const toggleAnalisis = (item: Analisis) => {
    const yaEsta = seleccionados.find(s => s.codigo === item.codigo);
    if (yaEsta) setSeleccionados(prev => prev.filter(s => s.codigo !== item.codigo));
    else setSeleccionados(prev => [...prev, item]);
  };

  const analisisFiltrados = useMemo(() => {
    return analisisDisponibles.filter(analisis => {
        const term = filtroAnalisis.toLowerCase();
        const coincide = analisis.nombre.toLowerCase().includes(term) || analisis.codigo.toString().toLowerCase().includes(term);
        const coincideCat = categoriaFiltro === "todos" || analisis.categoria?.toLowerCase() === categoriaFiltro.toLowerCase();
        return coincide && coincideCat;
    });
  }, [analisisDisponibles, filtroAnalisis, categoriaFiltro]);

  const categorias = useMemo(() => Array.from(new Set(analisisDisponibles.map(a => a.categoria).filter(Boolean))), [analisisDisponibles]);

  // ============================================
  // 4. CREAR SOLICITUD (SÚPER BLINDADO)
  // ============================================
  const crearSolicitud = async () => {
    if (!pacienteSeleccionado || seleccionados.length === 0) {
        setError("Complete todos los campos requeridos."); return;
    }

    setLoading(true);

    // 🔥 BLINDAJE DE DATOS: Enviamos las llaves necesarias para CUALQUIER VERSIÓN del backend (Medico o Admin)
    const payload = {
        nro_ficha_paciente: pacienteSeleccionado.nro_ficha, 
        id_paciente: pacienteSeleccionado.nro_ficha,        
        analisis_solicitados: seleccionados.map(s => s.codigo),
        analisis: seleccionados.map(s => s.codigo),             
        id_medico: idMedicoLogueado || 1, // Fallback si es superadmin
        urgente: urgente,
        requiere_ayuno: requiereAyuno,
        observaciones: observaciones.trim() || "Orden generada por Administrador"
    };

    try {
        const res = await axios.post("http://localhost:5000/api/ordenes", payload);
        if (res.data.success) {
            setShowSuccessModal(true);
        }
    } catch (err) {
        const axiosError = err as AxiosError<{ message: string }>;
        setError(axiosError.response?.data?.message || "Error al crear la solicitud en el servidor.");
    } finally {
        setLoading(false);
    }
  };

  const confirmarExito = () => {
      setShowSuccessModal(false);
      navigate(`/admin/pacientes`);
  };

  // ============================================
  // RENDERIZADO
  // ============================================
  return (
    <MainLayout>
      <div className="min-h-[calc(100vh-4rem)] bg-slate-50/50 p-6 relative">
        
        {/* Header Superior */}
        <div className="max-w-6xl mx-auto flex justify-between items-center mb-8">
            <div className="flex items-center gap-4">
                <Button variant="ghost" onClick={() => navigate('/admin/dashboard')} className="px-0">
                    ← Volver
                </Button>
                <div>
                    <h1 className="text-2xl font-black text-slate-800 tracking-tight">Nueva Orden</h1>
                    <p className="text-sm font-medium text-slate-500">Carga administrativa de estudios</p>
                </div>
            </div>
        </div>

        {/* Stepper Visual */}
        <div className="max-w-3xl mx-auto mb-10">
            <div className="flex justify-center items-center">
            {[1, 2, 3].map(i => (
                <div key={i} className="flex items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-black transition-all duration-300 ${step >= i ? 'bg-blue-600 text-white shadow-md ring-4 ring-blue-100' : 'bg-slate-200 text-slate-400'}`}>
                    {i}
                </div>
                {i < 3 && <div className={`w-16 sm:w-32 h-1.5 mx-2 rounded-full transition-colors duration-300 ${step > i ? 'bg-blue-600' : 'bg-slate-200'}`}></div>}
                </div>
            ))}
            </div>
            <div className="flex justify-center gap-[4.5rem] sm:gap-[9.5rem] mt-3 text-xs font-bold text-slate-400 uppercase tracking-wider">
                <span className={step >= 1 ? 'text-blue-600' : ''}>Paciente</span>
                <span className={step >= 2 ? 'text-blue-600' : ''}>Análisis</span>
                <span className={step >= 3 ? 'text-blue-600' : ''}>Confirmar</span>
            </div>
        </div>

        <div className="max-w-6xl mx-auto">
            {error && (
                <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-6 py-4 rounded-r-xl mb-6 shadow-sm flex items-center gap-3">
                    <span className="text-xl">⚠️</span>
                    <strong className="text-sm">{error}</strong>
                </div>
            )}

            {/* PASO 1: PACIENTE */}
            {step === 1 && (
            <CustomCard title="👤 Paso 1: Seleccionar Paciente" className="max-w-2xl mx-auto animate-in fade-in zoom-in-95 duration-300">
                <div className="relative">
                    <label className="block text-sm font-bold text-slate-700 mb-2">DNI del Paciente</label>
                    <div className="flex shadow-sm rounded-lg overflow-hidden border border-slate-300 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 transition-all">
                        <input 
                            placeholder="Ej: 35123456" 
                            value={dniBusqueda} 
                            onChange={(e) => setDniBusqueda(e.target.value.replace(/\D/g, ''))} 
                            className="w-full px-4 py-3 outline-none text-slate-700 font-medium"
                            onKeyPress={(e) => e.key === 'Enter' && buscarPacientePorDNICompleto()}
                            autoComplete="off"
                        />
                        <button 
                            onClick={buscarPacientePorDNICompleto} 
                            disabled={buscandoPaciente} 
                            className="bg-blue-600 hover:bg-blue-700 text-white px-6 font-bold transition-colors disabled:bg-slate-300"
                        >
                            {buscandoPaciente ? '...' : 'Buscar'}
                        </button>
                    </div>
                    {mostrarSugerencias && <SugerenciasPacientes pacientes={sugerenciasPacientes} onSeleccionar={seleccionarPaciente} loading={buscandoPaciente} />}
                </div>
                
                <div className="mt-8 bg-blue-50/50 p-4 rounded-xl border border-blue-100 flex gap-4 items-start">
                    <span className="text-2xl drop-shadow-sm">ℹ️</span>
                    <p className="text-sm font-medium text-blue-800 leading-relaxed">
                        Ingresa el DNI para buscar en la base de datos. Si vienes de la pantalla de "Gestión de Pacientes", este paso se saltará automáticamente.
                    </p>
                </div>
            </CustomCard>
            )}

            {/* PASO 2: ANÁLISIS */}
            {step === 2 && pacienteSeleccionado && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-300">
                <CustomCard className="bg-slate-800 text-white border-none shadow-md">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-full bg-white/20 flex items-center justify-center font-black text-xl">
                                {pacienteSeleccionado.nombre[0]}{pacienteSeleccionado.apellido[0]}
                            </div>
                            <div>
                                <p className="font-bold text-lg">{pacienteSeleccionado.apellido}, {pacienteSeleccionado.nombre}</p>
                                <p className="text-sm text-slate-300">DNI: {pacienteSeleccionado.dni} • {pacienteSeleccionado.mutual}</p>
                            </div>
                        </div>
                        <Button variant="ghost" onClick={() => setStep(1)} className="text-white hover:bg-white/10 hover:text-white border border-white/20">
                            Cambiar Paciente
                        </Button>
                    </div>
                </CustomCard>

                <CustomCard title="🧪 Paso 2: Seleccionar Análisis">
                    <div className="flex flex-col md:flex-row gap-4 mb-6 sticky top-0 bg-white z-10 pb-4 border-b border-slate-100">
                        <input 
                            placeholder="🔍 Buscar por nombre o código..." 
                            value={filtroAnalisis} 
                            onChange={(e) => setFiltroAnalisis(e.target.value)}
                            className="flex-1 border border-slate-300 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
                            autoFocus
                        />
                        <select 
                            value={categoriaFiltro} 
                            onChange={(e) => setCategoriaFiltro(e.target.value)} 
                            className="border border-slate-300 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 bg-white font-medium text-slate-700 w-full md:w-64"
                        >
                            <option value="todos">📂 Todas las categorías</option>
                            {categorias.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>

                    <div className="max-h-[350px] overflow-y-auto border border-slate-200 rounded-xl bg-slate-50 custom-scrollbar">
                        {analisisFiltrados.length > 0 ? (
                            analisisFiltrados.map((a) => {
                                const isSelected = seleccionados.some(s => s.codigo === a.codigo);
                                return (
                                    <div key={a.codigo} onClick={() => toggleAnalisis(a)}
                                        className={`flex items-center p-4 cursor-pointer border-b border-slate-200 last:border-0 transition-all ${isSelected ? 'bg-blue-50/80 border-l-4 border-l-blue-600' : 'hover:bg-white border-l-4 border-l-transparent'}`}
                                    >
                                        <div className={`w-5 h-5 rounded border mr-4 flex items-center justify-center transition-colors shadow-sm ${isSelected ? 'bg-blue-600 border-blue-600' : 'border-slate-300 bg-white'}`}>
                                            {isSelected && <span className="text-white text-xs font-bold">✓</span>}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3">
                                                <p className={`font-bold text-sm ${isSelected ? 'text-blue-900' : 'text-slate-700'}`}>{a.nombre}</p>
                                                <span className="text-[10px] bg-slate-200 text-slate-600 px-2 py-0.5 rounded font-mono font-bold tracking-wider">#{a.codigo}</span>
                                            </div>
                                            <p className="text-xs text-slate-400 mt-1 font-medium">{a.categoria}</p>
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="p-10 text-center text-slate-400 font-medium">No se encontraron resultados para la búsqueda.</div>
                        )}
                    </div>
                    
                    <div className="mt-6 flex justify-between items-center bg-slate-50 p-4 rounded-xl border border-slate-200">
                        <div>
                            <span className="text-sm font-bold text-slate-500 uppercase tracking-wider">Seleccionados:</span>
                            <span className="ml-3 text-2xl font-black text-blue-600">{seleccionados.length}</span>
                        </div>
                        <Button variant="primary" onClick={() => setStep(3)} disabled={seleccionados.length === 0} className="px-8 py-3">
                            Continuar al resumen →
                        </Button>
                    </div>
                </CustomCard>
            </div>
            )}

            {/* PASO 3: CONFIRMACIÓN */}
            {step === 3 && pacienteSeleccionado && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-300">
                <CustomCard title="📋 Paso 3: Confirmación Final">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    
                    {/* Columna Izquierda: Resumen */}
                    <div className="space-y-6">
                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 shadow-sm">
                            <h3 className="font-bold text-slate-400 text-xs uppercase tracking-wider mb-3">Paciente a Facturar</h3>
                            <p className="text-xl font-black text-slate-800 uppercase">{pacienteSeleccionado.nombre} {pacienteSeleccionado.apellido}</p>
                            <p className="text-slate-600 font-medium mt-1">DNI {pacienteSeleccionado.dni} • {pacienteSeleccionado.mutual}</p>
                        </div>

                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 shadow-sm">
                            <h3 className="font-bold text-slate-400 text-xs uppercase tracking-wider mb-3 border-b border-slate-200 pb-2">
                                Detalle de Análisis ({seleccionados.length})
                            </h3>
                            <ul className="max-h-48 overflow-y-auto space-y-3 custom-scrollbar pr-2 mt-3">
                                {seleccionados.map(a => (
                                    <li key={a.codigo} className="text-sm font-medium text-slate-700 flex justify-between items-center bg-white p-2 rounded-lg border border-slate-100 shadow-sm">
                                        <span>{a.nombre}</span>
                                        <span className="font-mono text-slate-400 bg-slate-100 px-2 py-1 rounded text-xs font-bold tracking-wider">#{a.codigo}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    {/* Columna Derecha: Opciones Administrativas */}
                    <div className="space-y-6">
                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 shadow-sm">
                            <h3 className="font-bold text-amber-800 text-xs uppercase tracking-wider mb-5">Etiquetas Especiales</h3>
                            
                            <label className="flex items-center gap-4 p-4 rounded-xl bg-white border border-amber-100 cursor-pointer hover:shadow-md transition-all mb-4 group">
                                <input type="checkbox" checked={urgente} onChange={(e) => setUrgente(e.target.checked)} className="w-5 h-5 text-red-600 rounded focus:ring-red-500" />
                                <div>
                                    <span className={`block font-black text-sm uppercase tracking-wide transition-colors ${urgente ? 'text-red-600' : 'text-slate-700 group-hover:text-red-500'}`}>Urgencia de Laboratorio</span>
                                    <span className="text-xs text-slate-500 font-medium">Prioridad alta en la cola de procesamiento</span>
                                </div>
                            </label>

                            <label className="flex items-center gap-4 p-4 rounded-xl bg-white border border-amber-100 cursor-pointer hover:shadow-md transition-all group">
                                <input type="checkbox" checked={requiereAyuno} onChange={(e) => setRequiereAyuno(e.target.checked)} className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500" />
                                <div>
                                    <span className={`block font-black text-sm uppercase tracking-wide transition-colors ${requiereAyuno ? 'text-blue-700' : 'text-slate-700 group-hover:text-blue-600'}`}>Condición: Ayuno</span>
                                    <span className="text-xs text-slate-500 font-medium">Etiqueta informativa para el extraccionista</span>
                                </div>
                            </label>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Notas Administrativas Internas</label>
                            <textarea 
                                placeholder="Escriba aquí diagnósticos, pedidos médicos o notas para el equipo..." 
                                value={observaciones} 
                                onChange={(e) => setObservaciones(e.target.value)} 
                                className="border border-slate-300 p-4 rounded-xl w-full text-sm font-medium text-slate-700 focus:ring-4 focus:ring-blue-100 outline-none shadow-sm min-h-[120px] resize-none transition-shadow" 
                            />
                        </div>
                    </div>
                </div>

                <div className="flex justify-between items-center mt-10 pt-6 border-t border-slate-200">
                    <Button variant="ghost" onClick={() => setStep(2)} disabled={loading} className="px-6 py-3 font-bold uppercase text-xs tracking-wider">
                        ← Revisar Análisis
                    </Button>
                    <Button variant="success" onClick={crearSolicitud} disabled={loading} className="px-10 py-4 text-sm uppercase tracking-wider shadow-lg hover:-translate-y-1 transition-transform">
                        {loading ? 'Procesando en BD...' : '✔️ Generar e Imprimir Orden'}
                    </Button>
                </div>
                </CustomCard>
            </div>
            )}

        </div>
      </div>

      {/* ================================================================= */}
      {/* 🔥 MODAL DE ÉXITO PERSONALIZADO (REEMPLAZA A WINDOW.ALERT) */}
      {/* ================================================================= */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-100 text-center">
            
            <div className="bg-green-50 p-8 flex flex-col items-center justify-center border-b border-green-100 relative overflow-hidden">
                <div className="absolute -right-4 -top-4 w-24 h-24 bg-white opacity-40 rounded-full blur-xl"></div>
                <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mb-4 shadow-lg shadow-green-200 relative z-10 animate-bounce">
                    <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" />
                    </svg>
                </div>
                <h3 className="text-2xl font-black text-slate-800 tracking-tight">¡Orden Creada!</h3>
            </div>
            
            <div className="p-8">
              <p className="text-slate-600 font-medium mb-8 leading-relaxed">
                La solicitud de laboratorio ingresó al sistema y ya está disponible para el equipo Bioquímico.
              </p>
              
              <button 
                onClick={confirmarExito}
                className="w-full px-4 py-4 bg-slate-900 text-white font-bold uppercase tracking-wider text-sm rounded-xl hover:bg-slate-800 transition-all shadow-md outline-none focus:ring-4 focus:ring-slate-300"
              >
                Volver a Pacientes
              </button>
            </div>

          </div>
        </div>
      )}
    </MainLayout>
  );
}