// src/pages/admin/NuevaOrden.tsx

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import AnalysisSelector from "../../components/commons/AnalysisSelector";
interface Paciente {
  nro_ficha: number;
  nombre: string;
  apellido: string;
  dni: number;
  mutual: string;
  edad: number;
  sexo: string;
}

export default function NuevaOrdenAdmin() {
  const navigate = useNavigate();

  // Estados
  const [paciente, setPaciente] = useState<Paciente | null>(null);
  const [analisisSeleccionados, setAnalisisSeleccionados] = useState<any[]>([]);
  const [idMedicoSolicitante, setIdMedicoSolicitante] = useState(""); 
  const [medicos, setMedicos] = useState<any[]>([]); // Lista de médicos para el dropdown
  
  // Estados de UI
  const [busquedaDNI, setBusquedaDNI] = useState("");
  const [loading, setLoading] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });

  // 1. Cargar Paciente de memoria y Lista de Médicos
  useEffect(() => {
    // Recuperar paciente
    const pacienteGuardado = sessionStorage.getItem('paciente_preseleccionado');
    if (pacienteGuardado) {
      try {
        setPaciente(JSON.parse(pacienteGuardado));
      } catch (e) { console.error(e); }
    }

    // Cargar médicos para el dropdown (Necesario para crear la orden)
    cargarMedicos();
  }, []);

  const cargarMedicos = async () => {
    try {
      // Asumimos que existe un endpoint o usamos uno genérico. 
      // Si no tienes endpoint de medicos, comenta esto y usa un ID fijo temporalmente.
      const res = await axios.get("http://localhost:5000/api/admin/medicos"); 
      if(res.data.success) setMedicos(res.data.medicos);
    } catch (e) {
      console.log("No se pudo cargar médicos, usaré input manual o lista vacía");
    }
  };

  const buscarPaciente = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!busquedaDNI) return;
    try {
      setLoading(true);
      const response = await axios.get(`http://localhost:5000/api/paciente/buscar/${busquedaDNI}`);
      if (response.data.success) {
        setPaciente(response.data.paciente);
        setMensaje({ tipo: '', texto: '' });
      }
    } catch (error) {
      setPaciente(null);
      setMensaje({ tipo: 'error', texto: 'Paciente no encontrado' });
    } finally {
      setLoading(false);
    }
  };

  const handleGuardarOrden = async () => {
    // Validaciones
    if (!paciente) return alert("Falta el paciente");
    if (analisisSeleccionados.length === 0) return alert("Debes seleccionar al menos un análisis");
    if (!idMedicoSolicitante) return alert("Selecciona el médico solicitante");

    try {
      setEnviando(true);
      
      // Construimos el objeto que espera el Backend
      const payload = {
        id_paciente: paciente.nro_ficha,
        id_medico: idMedicoSolicitante,
        analisis: analisisSeleccionados.map(a => a.id_analisis), // Solo enviamos IDs
        observaciones: "Orden generada desde Admin"
      };

      // ENVIAR AL BACKEND (Asegúrate que esta ruta exista en tu backend)
      const response = await axios.post("http://localhost:5000/api/ordenes", payload);

      if (response.data.success) {
        alert("✅ ¡Orden creada exitosamente!");
        sessionStorage.removeItem('paciente_preseleccionado');
        navigate('/admin/pacientes');
      }

    } catch (error: any) {
      console.error("Error al crear orden:", error);
      alert("❌ Error al crear la orden: " + (error.response?.data?.message || "Error de servidor"));
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      
      {/* HEADER */}
      <div className="max-w-5xl mx-auto mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">📝 Nueva Orden (Admin)</h1>
          <p className="text-gray-500 text-sm">Creación completa de orden</p>
        </div>
        <button 
          onClick={() => navigate('/admin/pacientes')} 
          className="text-gray-500 hover:text-blue-600 font-medium"
        >
          Cancelar y Volver
        </button>
      </div>

      <div className="max-w-5xl mx-auto grid grid-cols-1 gap-6">

        {/* 1. DATOS DEL PACIENTE */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xs font-bold text-gray-400 uppercase mb-4 border-b pb-2">1. Datos del Paciente</h2>
          
          {paciente ? (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex flex-wrap justify-between items-center gap-4">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-lg">
                  {paciente.nombre?.[0]}{paciente.apellido?.[0]}
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">{paciente.nombre} {paciente.apellido}</h3>
                  <div className="text-sm text-gray-600 flex gap-3">
                    <span>🆔 {paciente.dni}</span>
                    <span>🏥 {paciente.mutual}</span>
                  </div>
                </div>
              </div>
              <button onClick={() => setPaciente(null)} className="text-red-500 text-sm font-medium hover:underline">
                Cambiar
              </button>
            </div>
          ) : (
            <form onSubmit={buscarPaciente} className="flex gap-2">
              <input 
                className="flex-1 border p-2 rounded" 
                placeholder="Buscar por DNI..." 
                value={busquedaDNI}
                onChange={e => setBusquedaDNI(e.target.value)}
              />
              <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">
                {loading ? "..." : "Buscar"}
              </button>
            </form>
          )}
        </div>

        {/* 2. DATOS DE LA ORDEN (Médico) */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xs font-bold text-gray-400 uppercase mb-4 border-b pb-2">2. Datos de Solicitud</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Médico Solicitante</label>
              <select 
                className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                value={idMedicoSolicitante}
                onChange={(e) => setIdMedicoSolicitante(e.target.value)}
              >
                <option value="">-- Seleccionar Médico --</option>
                {medicos.length > 0 ? (
                  medicos.map(m => (
                    <option key={m.id} value={m.id}>{m.apellido}, {m.nombre} ({m.especialidad})</option>
                  ))
                ) : (
                  // Opción de respaldo si no carga la lista
                  <option value="1">Médico General (Default)</option>
                )}
              </select>
              <p className="text-xs text-gray-400 mt-1">
                 * Requerido para facturación.
              </p>
            </div>
          </div>
        </div>

        {/* 3. SELECCIÓN DE ANÁLISIS (Aquí usamos el componente nuevo) */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex justify-between items-end mb-4 border-b pb-2">
            <h2 className="text-xs font-bold text-gray-400 uppercase">3. Análisis Solicitados</h2>
            <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded">
              Total: {analisisSeleccionados.length}
            </span>
          </div>
          
          {/* COMPONENTE SELECTOR */}
          <AnalysisSelector onSelectionChange={setAnalisisSeleccionados} />
        </div>

        {/* BOTONES FINALES */}
        <div className="flex justify-end gap-3 pt-4 pb-10">
            <button 
                onClick={handleGuardarOrden}
                disabled={enviando || !paciente}
                className={`
                  px-8 py-3 rounded-lg font-bold text-white shadow-md transition-all
                  ${enviando || !paciente 
                    ? "bg-gray-400 cursor-not-allowed" 
                    : "bg-green-600 hover:bg-green-700 hover:scale-105 shadow-green-200"}
                `}
            >
                {enviando ? "⏳ Procesando..." : "✅ Confirmar Orden"}
            </button>
        </div>

      </div>
    </div>
  );
}