// src/pages/medico/NuevaSolicitud.tsx

import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

// Componentes UI reutilizables
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/ui/form-field";
import { CustomCard } from "@/components/ui/CustomCard";

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

// Componente de sugerencias de pacientes
const SugerenciasPacientes = ({ 
  pacientes, 
  onSeleccionar, 
  loading 
}: {
  pacientes: Paciente[];
  onSeleccionar: (paciente: Paciente) => void;
  loading: boolean;
}) => {
  if (loading) {
    return (
      <div className="absolute z-10 w-full bg-white border border-gray-300 rounded-md shadow-lg mt-1">
        <div className="p-3 text-center text-gray-500">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mx-auto mb-2"></div>
          Buscando...
        </div>
      </div>
    );
  }

  if (pacientes.length === 0) {
    return null;
  }

  return (
    <div className="absolute z-10 w-full bg-white border border-gray-300 rounded-md shadow-lg mt-1 max-h-60 overflow-y-auto">
      {pacientes.map((paciente) => (
        <div
          key={paciente.nro_ficha}
          className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
          onClick={() => onSeleccionar(paciente)}
        >
          <div className="flex justify-between items-start">
            <div>
              <p className="font-medium text-gray-900">
                {paciente.nombre} {paciente.apellido}
              </p>
              <p className="text-sm text-gray-500">
                DNI: {paciente.dni} • {paciente.edad} años
              </p>
              {paciente.mutual && (
                <p className="text-xs text-gray-400">{paciente.mutual}</p>
              )}
            </div>
            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
              Ficha #{paciente.nro_ficha}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default function NuevaSolicitud() {
  const navigate = useNavigate();
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

  // Debounce para la búsqueda de pacientes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (dniBusqueda.trim().length >= 2) {
        buscarPacientesEnTiempoReal(dniBusqueda);
      } else {
        setSugerenciasPacientes([]);
        setMostrarSugerencias(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [dniBusqueda]);

  const cargarAnalisisDisponibles = async () => {
    try {
      // Endpoint corregido para evitar 404
      const response = await axios.get('http://localhost:5000/api/admin/analisis'); 
      if (response.data.success) {
        setAnalisisDisponibles(response.data.analisis);
      }
    } catch (error) {
      console.error("Error al cargar análisis:", error);
    }
  };

  const buscarPacientesEnTiempoReal = async (dni: string) => {
    if (!dni.trim()) return;

    setBuscandoPaciente(true);
    setError("");

    try {
      const apiUrl = 'http://localhost:5000/api';
      // Ruta unificada para búsqueda parcial
      const response = await axios.get(`${apiUrl}/paciente/buscar-por-dni/${dni}`);
      
      if (response.data.success && response.data.pacientes) {
        setSugerenciasPacientes(response.data.pacientes);
        setMostrarSugerencias(true);
      } else {
        setSugerenciasPacientes([]);
        setMostrarSugerencias(false);
      }
    } catch (error: any) {
      console.error("Error al buscar pacientes:", error);
      setSugerenciasPacientes([]);
      setMostrarSugerencias(false);
    } finally {
      setBuscandoPaciente(false);
    }
  };

  const seleccionarPaciente = (paciente: Paciente) => {
    setPacienteSeleccionado(paciente);
    setDniBusqueda(paciente.dni.toString());
    setMostrarSugerencias(false);
    setSugerenciasPacientes([]);
    setStep(2);
    setError("");
  };

  // Dentro del componente NuevaSolicitud...

const buscarPacientePorDNICompleto = async () => {
    if (!dniBusqueda.trim()) {
        setError("Ingrese un DNI válido");
        return;
    }

    setBuscandoPaciente(true);
    setError("");

    try {
        // Usamos el endpoint configurado en singular
        const response = await axios.get(`http://localhost:5000/api/paciente/buscar/${dniBusqueda}`);
        
        if (response.data.success && response.data.paciente) {
            seleccionarPaciente(response.data.paciente);
        } else {
            setError("PACIENTE NO ENCONTRADO. ¿DESEA REGISTRARLO?");
        }
    } catch (error: any) {
        // Manejamos el 404 para mostrar el botón de registro
        setError("PACIENTE NO ENCONTRADO. ¿DESEA REGISTRARLO?");
    } finally {
        setBuscandoPaciente(false);
    }
};

// ... en el return, el bloque de error actualizado según tu diseño
{error && (
  <div className="bg-red-50 border-2 border-red-200 text-red-700 px-8 py-5 rounded-[2rem] mb-8 flex justify-between items-center shadow-sm">
    <div className="flex items-center gap-4">
      <span className="text-xl">⚠️</span>
      <strong className="font-black uppercase text-[11px] tracking-widest">{error}</strong>
    </div>
    
    {error.includes("NO ENCONTRADO") && (
      <button
        onClick={() => navigate('/medico/pacientes')}
        className="bg-red-600 hover:bg-red-700 text-white font-black uppercase text-[10px] px-6 py-3 rounded-xl shadow-lg transition-all active:scale-95"
      >
        + Registrar Paciente Nuevo
      </button>
    )}
  </div>
)}

  const handleDniChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    if (value.length <= 8) {
      setDniBusqueda(value);
      setError("");
      if (pacienteSeleccionado) {
        setPacienteSeleccionado(null);
      }
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
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <Button
                variant="ghost"
                onClick={navigateBack}
                className="mr-4"
                aria-label="Volver al dashboard"
              >
                ← Volver
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  📋 Nueva Solicitud de Análisis
                </h1>
                <p className="text-gray-600">
                  Crear nueva orden de análisis clínicos
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-center">
            <div className="flex items-center space-x-4">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'
              }`}>1</div>
              <div className="w-8 h-1 bg-gray-300"></div>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'
              }`}>2</div>
              <div className="w-8 h-1 bg-gray-300"></div>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step >= 3 ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'
              }`}>3</div>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* BLOQUE DE ERROR DINÁMICO CON BOTÓN DE REGISTRO */}
        {error && (
          <div className="bg-red-50 border-2 border-red-200 text-red-700 px-6 py-4 rounded-3xl mb-6 flex flex-col md:flex-row justify-between items-center gap-4" role="alert">
            <div className="flex items-center gap-3">
              <span className="text-xl">⚠️</span>
              <strong className="font-black uppercase text-xs tracking-tight">{error}</strong>
            </div>
            
            {error.includes("no encontrado") && (
              <Button
                onClick={() => navigate('/medico/GestionPacientes')}
                className="bg-red-600 hover:bg-red-700 text-white font-black uppercase text-[10px] px-6 py-2 rounded-xl shadow-lg transition-all active:scale-95"
              >
                + Registrar Paciente Nuevo
              </Button>
            )}
          </div>
        )}

        {step === 1 && (
          <CustomCard>
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              👤 Paso 1: Seleccionar Paciente
            </h2>
            
            <div className="max-w-md relative">
              <FormField htmlFor="dni-busqueda" label="DNI del Paciente">
                <div className="flex">
                  <Input
                    id="dni-busqueda"
                    type="text"
                    placeholder="Ingrese DNI (ej: 12345678)"
                    value={dniBusqueda}
                    onChange={handleDniChange}
                    className="flex-1 rounded-r-none"
                    onKeyPress={(e) => e.key === 'Enter' && buscarPacientePorDNICompleto()}
                  />
                  <Button
                    onClick={buscarPacientePorDNICompleto}
                    disabled={buscandoPaciente || dniBusqueda.length < 7}
                    className="rounded-l-none"
                  >
                    {buscandoPaciente ? '🔍' : 'Buscar'}
                  </Button>
                </div>
              </FormField>
              
              <p className="text-sm text-gray-500 mt-2">
                Ingrese el DNI del paciente para buscar en el sistema.
                {dniBusqueda.length >= 2 && " Se mostrarán sugerencias automáticamente."}
              </p>

              {mostrarSugerencias && (
                <SugerenciasPacientes
                  pacientes={sugerenciasPacientes}
                  onSeleccionar={seleccionarPaciente}
                  loading={buscandoPaciente}
                />
              )}
            </div>
          </CustomCard>
        )}

        {step === 2 && pacienteSeleccionado && (
          <div className="space-y-6">
            <CustomCard title="Paciente Seleccionado">
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
              <div className="mt-4 flex space-x-3">
                <Button variant="secondary" onClick={() => setStep(1)}>Cambiar Paciente</Button>
                <Button onClick={() => setStep(3)} disabled={analisisSeleccionados.length === 0}>
                  Continuar ({analisisSeleccionados.length} análisis)
                </Button>
              </div>
            </CustomCard>

            <CustomCard title="🧪 Paso 2: Seleccionar Análisis">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <FormField htmlFor="filtro-analisis" label="Buscar análisis">
                  <Input
                    id="filtro-analisis"
                    type="text"
                    placeholder="Buscar por nombre o código..."
                    value={filtroAnalisis}
                    onChange={(e) => setFiltroAnalisis(e.target.value)}
                  />
                </FormField>
                <FormField htmlFor="categoria-filtro" label="Categoría">
                  <select
                    id="categoria-filtro"
                    value={categoriaFiltro}
                    onChange={(e) => setCategoriaFiltro(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="todos">Todas las categorías</option>
                    {categorias.map(categoria => (
                      <option key={categoria} value={categoria}>{categoria}</option>
                    ))}
                  </select>
                </FormField>
              </div>

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
                            <p className="text-sm font-medium text-gray-900">{analisis.descripcion}</p>
                            <p className="text-sm text-gray-500">Código: {analisis.codigo} • {analisis.tipo}</p>
                          </div>
                          {analisis.honorarios && (
                            <span className="text-sm font-medium text-green-600">${analisis.honorarios}</span>
                          )}
                        </div>
                      </div>
                    </label>
                  </div>
                ))}
              </div>

              {analisisSeleccionados.length > 0 && (
                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium text-blue-900">{analisisSeleccionados.length} análisis seleccionados</p>
                      <p className="text-sm text-blue-700">Costo total estimado: ${calcularCostoTotal().toFixed(2)}</p>
                    </div>
                    <Button onClick={() => setStep(3)}>Continuar</Button>
                  </div>
                </div>
              )}
            </CustomCard>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <CustomCard title="📋 Paso 3: Confirmar Solicitud">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Paciente</h4>
                  <p>{pacienteSeleccionado?.nombre} {pacienteSeleccionado?.apellido}</p>
                  <p className="text-sm text-gray-500">DNI: {pacienteSeleccionado?.dni}</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Análisis ({analisisSeleccionados.length})</h4>
                  <div className="max-h-32 overflow-y-auto">
                    {analisisSeleccionados.map(codigo => {
                      const analisis = analisisDisponibles.find(a => a.codigo === codigo);
                      return <p key={codigo} className="text-sm text-gray-600">• {analisis?.descripcion}</p>;
                    })}
                  </div>
                </div>
              </div>
            </CustomCard>

            <CustomCard title="Opciones Adicionales">
              <div className="space-y-4">
                <div className="flex items-center">
                  <input type="checkbox" id="urgente" checked={urgente} onChange={(e) => setUrgente(e.target.checked)} className="h-4 w-4 text-blue-600" />
                  <label htmlFor="urgente" className="ml-2 text-sm text-gray-700">Marcar como urgente</label>
                </div>
                <div className="flex items-center">
                  <input type="checkbox" id="ayuno" checked={requiereAyuno} onChange={(e) => setRequiereAyuno(e.target.checked)} className="h-4 w-4 text-blue-600" />
                  <label htmlFor="ayuno" className="ml-2 text-sm text-gray-700">Requiere ayuno</label>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                <FormField htmlFor="observaciones" label="Observaciones">
                  <textarea id="observaciones" rows={3} value={observaciones} onChange={(e) => setObservaciones(e.target.value)} className="w-full px-3 py-2 border rounded-md" />
                </FormField>
                <FormField htmlFor="instrucciones" label="Instrucciones para el paciente">
                  <textarea id="instrucciones" rows={3} value={instruccionesPaciente} onChange={(e) => setInstruccionesPaciente(e.target.value)} className="w-full px-3 py-2 border rounded-md" />
                </FormField>
              </div>
            </CustomCard>

            <div className="flex justify-between">
              <Button variant="secondary" onClick={() => setStep(2)}>← Volver</Button>
              <div className="space-x-3">
                <Button variant="secondary" onClick={navigateBack}>Cancelar</Button>
                <Button onClick={crearSolicitud} disabled={loading} className="bg-green-600 hover:bg-green-700">
                  {loading ? 'Creando...' : 'Crear Solicitud'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}