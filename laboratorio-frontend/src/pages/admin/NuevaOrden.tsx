import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { MainLayout } from "../../components/layout/MainLayout";

// Interfaces locales
interface Paciente {
  nro_ficha: number;
  nombre: string;
  apellido: string;
  dni: number;
  mutual: string;
  id_obra_social?: number;
  edad: number;
  sexo: string;
}

interface Analisis {
  id_analisis: number;
  codigo: string;
  nombre: string;
  categoria: string;
  precio_estimado?: number;
}

export default function NuevaOrdenAdmin() {
  const navigate = useNavigate();

  // Estados de Datos
  const [paciente, setPaciente] = useState<Paciente | null>(null);
  const [catalogo, setCatalogo] = useState<Analisis[]>([]);
  const [seleccionados, setSeleccionados] = useState<Analisis[]>([]);
  
  // 🔥 NUEVO: Estado para el ID del médico logueado
  const [idMedicoLogueado, setIdMedicoLogueado] = useState<number | null>(null);

  // Estados de UI
  const [busqueda, setBusqueda] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [loadingCatalogo, setLoadingCatalogo] = useState(true);

  // 1. Cargar Paciente, Catálogo y USUARIO LOGUEADO
  useEffect(() => {
    // A) Recuperar paciente
    const pacienteGuardado = sessionStorage.getItem('paciente_preseleccionado');
    if (pacienteGuardado) {
      try {
        const p = JSON.parse(pacienteGuardado);
        setPaciente(p);
        cargarCatalogo(p.id_obra_social);
      } catch (e) { console.error(e); }
    } else {
        navigate('/admin/pacientes');
    }

    // B) 🔥 Recuperar Médico Logueado del LocalStorage
    const usuarioStr = localStorage.getItem('usuario');
    if (usuarioStr) {
        try {
            const usuario = JSON.parse(usuarioStr);
            // Asumimos que el objeto usuario tiene un campo 'id'
            if (usuario && usuario.id) {
                setIdMedicoLogueado(usuario.id);
                console.log("👨‍⚕️ Médico detectado ID:", usuario.id);
            }
        } catch (e) {
            console.error("Error al leer usuario:", e);
        }
    }
  }, []);

  const cargarCatalogo = async (idObraSocial?: number) => {
    try {
      setLoadingCatalogo(true);
      const url = `http://localhost:5000/api/ordenes/catalogo`;
      const res = await axios.get(url);
      if (res.data.success) {
        const items = res.data.data || res.data.analisis;
        setCatalogo(items.map((item: any) => ({
            id_analisis: item.id_analisis || item.codigo_practica,
            codigo: item.codigo || item.codigo_practica,
            nombre: item.nombre || item.descripcion_practica,
            categoria: item.categoria || item.TIPO || "General",
            precio_estimado: item.precio_estimado || 0
        })));
      }
    } catch (e) {
      console.error("Error catálogo", e);
    } finally {
      setLoadingCatalogo(false);
    }
  };

  const resultadosBusqueda = useMemo(() => {
    if (!busqueda) return catalogo;
    const term = busqueda.toLowerCase();
    return catalogo.filter(a => 
      (a.nombre && a.nombre.toLowerCase().includes(term)) || 
      (a.codigo && a.codigo.toString().toLowerCase().includes(term))
    );
  }, [busqueda, catalogo]);

  const toggleSeleccion = (item: Analisis) => {
    const yaEsta = seleccionados.find(s => s.codigo === item.codigo);
    if (yaEsta) setSeleccionados(prev => prev.filter(s => s.codigo !== item.codigo));
    else setSeleccionados(prev => [...prev, item]);
  };

  const quitarSeleccionado = (codigo: string) => {
    setSeleccionados(prev => prev.filter(s => s.codigo !== codigo));
  };

  // 5. Guardar Orden
  const handleGuardarOrden = async () => {
    if (!paciente) return;
    if (seleccionados.length === 0) return alert("Seleccione al menos una práctica.");
    
    // 🔥 Validación de Médico
    if (!idMedicoLogueado) {
        return alert("Error: No se identificó al médico logueado. Por favor inicie sesión nuevamente.");
    }

    try {
      setEnviando(true);
      
      const payload = {
        id_paciente: paciente.nro_ficha,
        id_medico: idMedicoLogueado, // ✅ ENVIAMOS EL ID DEL USUARIO LOGUEADO
        analisis: seleccionados.map(a => a.codigo),
        observaciones: "Orden generada por Sistema"
      };

      console.log("Enviando:", payload);

      const response = await axios.post("http://localhost:5000/api/ordenes", payload);

      if (response.data.success) {
        alert("✅ Orden creada exitosamente");
        sessionStorage.removeItem('paciente_preseleccionado');
        navigate('/admin/pacientes');
      }

    } catch (error: any) {
      console.error("Error:", error);
      alert("Error al crear la orden: " + (error.response?.data?.message || error.message));
    } finally {
      setEnviando(false);
    }
  };

  if (!paciente) return null;

  return (
    <MainLayout>
      <div className="min-h-screen bg-slate-50 p-6">
        {/* Header */}
        <div className="max-w-6xl mx-auto mb-6 bg-white p-4 rounded-xl shadow-sm border border-blue-100 flex justify-between items-center">
            <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-lg">
                    {paciente.apellido?.[0]}{paciente.nombre?.[0]}
                </div>
                <div>
                    <h2 className="text-lg font-bold text-slate-800">{paciente.apellido}, {paciente.nombre}</h2>
                    <div className="text-sm text-slate-500">DNI: {paciente.dni} • {paciente.mutual}</div>
                </div>
            </div>
            <div className="flex flex-col items-end">
                <span className="text-xs text-slate-400 uppercase font-bold">Médico Resp.</span>
                <span className="text-sm font-medium text-blue-600">ID: {idMedicoLogueado || "..."}</span>
            </div>
        </div>

        {/* Paneles de Selección */}
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6 h-[600px]">
            {/* Izquierda: Buscador */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col overflow-hidden">
                <div className="p-4 border-b bg-slate-50">
                    <h3 className="font-bold text-slate-700 mb-2">🔍 Buscar Práctica</h3>
                    <input autoFocus type="text" className="w-full border rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500" placeholder="Código o nombre..." value={busqueda} onChange={e => setBusqueda(e.target.value)} />
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
                    {loadingCatalogo ? <div className="p-10 text-center text-slate-400">Cargando...</div> : 
                        resultadosBusqueda.map((item, idx) => {
                            const isSelected = seleccionados.some(s => s.codigo === item.codigo);
                            return (
                                <div key={idx} onClick={() => toggleSeleccion(item)} className={`p-3 rounded-lg cursor-pointer border flex justify-between items-center ${isSelected ? 'bg-blue-50 border-blue-300' : 'hover:bg-slate-50 border-transparent'}`}>
                                    <div className="text-sm"><div className="font-bold text-slate-700">{item.nombre}</div><div className="text-xs text-slate-400">#{item.codigo}</div></div>
                                    {isSelected && <span className="text-blue-600 font-bold">✓</span>}
                                </div>
                            );
                        })
                    }
                </div>
            </div>

            {/* Derecha: Seleccionados */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col overflow-hidden">
                <div className="p-4 border-b bg-slate-50 flex justify-between"><h3 className="font-bold text-slate-700">Seleccionadas ({seleccionados.length})</h3></div>
                <div className="flex-1 overflow-y-auto p-2 space-y-2 bg-slate-50/50">
                    {seleccionados.map((item, idx) => (
                        <div key={idx} className="bg-white p-3 rounded-lg shadow-sm border border-slate-200 flex justify-between items-center">
                            <div className="text-sm"><div className="font-bold text-slate-700">{item.nombre}</div><div className="text-xs text-slate-400">#{item.codigo}</div></div>
                            <button onClick={() => quitarSeleccionado(item.codigo)} className="text-slate-300 hover:text-red-500 px-2">✕</button>
                        </div>
                    ))}
                </div>
                <div className="p-4 border-t bg-white">
                    <button onClick={handleGuardarOrden} disabled={enviando || seleccionados.length === 0} className={`w-full py-3 rounded-lg font-bold text-white shadow-md ${enviando || seleccionados.length === 0 ? 'bg-slate-300' : 'bg-green-600 hover:bg-green-700'}`}>
                        {enviando ? "Procesando..." : "Confirmar Orden"}
                    </button>
                </div>
            </div>
        </div>
      </div>
    </MainLayout>
  );
}