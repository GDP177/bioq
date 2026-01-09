import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { DataTable } from '../../components/commons/DataTable';
import { PatientForm } from '../../components/forms/PatientForm';

export default function GestionPacientesAdmin() {
  const navigate = useNavigate();
  const [pacientes, setPacientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtroDni, setFiltroDni] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [pacienteSeleccionado, setPacienteSeleccionado] = useState<any>(null);

  // ✅ FUNCIÓN DE CARGA DINÁMICA (Búsqueda en tiempo real)
  const fetchPacientes = async (dni: string = "") => {
    setLoading(true);
    try {
      // Si el DNI tiene 2 o más dígitos, usamos la búsqueda parcial del backend
      // Si está vacío, traemos el listado general administrativo
      const url = dni.trim().length >= 2 
        ? `http://localhost:5000/api/pacientes/buscar-dni/${dni}`
        : `http://localhost:5000/api/admin/pacientes`; 
      
      const res = await axios.get(url);
      
      // El controlador devuelve 'pacientes' en ambos casos tras la última actualización
      setPacientes(res.data.pacientes || []);
    } catch (err) {
      console.error("❌ Error al filtrar pacientes:", err);
    } finally {
      setLoading(false);
    }
  };

  // ✅ EFECTO DE BÚSQUEDA (Con debounce manual para no saturar el servidor)
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchPacientes(filtroDni);
    }, 300); // Espera 300ms después de que el usuario deja de escribir

    return () => clearTimeout(delayDebounceFn);
  }, [filtroDni]);

  const handleOpenModal = (paciente: any = null) => {
    setPacienteSeleccionado(paciente);
    setShowModal(true);
  };

  const columnas = [
    { 
      header: "Ficha", 
      accessor: "nro_ficha", 
      render: (row: any) => <span className="font-bold text-indigo-900">#{row.nro_ficha}</span> 
    },
    { header: "DNI", accessor: "dni" },
    { 
      header: "Paciente", 
      accessor: "apellido", 
      render: (row: any) => `${row.apellido}, ${row.nombre}` 
    },
    { 
      header: "Obra Social", 
      accessor: "mutual", 
      render: (row: any) => (
        <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-[10px] font-black uppercase">
          {row.mutual || 'PARTICULAR'}
        </span>
      )
    },
    { 
      header: "Acciones", 
      accessor: "id", 
      render: (row: any) => (
        <button 
          onClick={() => handleOpenModal(row)} 
          className="bg-indigo-100 text-indigo-700 hover:bg-indigo-600 hover:text-white px-3 py-1 rounded transition-all font-bold text-[10px] uppercase shadow-sm"
        >
          Editar Ficha
        </button>
      )
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar Superior estilo UME */}
      <nav className="bg-indigo-900 text-white p-4 shadow-lg flex justify-between items-center sticky top-0 z-50">
        <button 
          onClick={() => navigate('/admin/dashboard')} 
          className="text-xs font-bold hover:text-indigo-200 transition flex items-center gap-2"
        >
          <span>←</span> VOLVER AL PANEL
        </button>
        <h1 className="font-black tracking-widest text-xs uppercase opacity-80">Módulo de Gestión de Pacientes</h1>
        <div className="w-20"></div>
      </nav>

      <div className="max-w-7xl mx-auto p-8">
        <header className="flex justify-between items-end mb-8">
          <div>
            <h2 className="text-3xl font-black text-indigo-900 tracking-tight">PADRÓN DE PACIENTES</h2>
            <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">Base de datos centralizada de historias clínicas</p>
          </div>
          <button 
            onClick={() => handleOpenModal()} 
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-8 rounded-xl shadow-xl transition-all uppercase text-[10px] tracking-widest active:scale-95"
          >
            + Registrar Nuevo
          </button>
        </header>

        {/* Buscador Dinámico */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-8 relative group overflow-hidden">
          <div className="absolute left-0 top-0 w-1 h-full bg-indigo-500"></div>
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Búsqueda rápida por DNI</label>
          <div className="relative">
            <input 
              type="text" 
              placeholder="Ingrese al menos 2 dígitos para buscar..." 
              className="w-full px-0 py-2 border-b-2 border-gray-50 focus:border-indigo-400 outline-none transition text-xl font-bold text-gray-700 placeholder:text-gray-200 placeholder:font-medium"
              value={filtroDni}
              onChange={(e) => setFiltroDni(e.target.value)}
            />
            {filtroDni && (
              <button 
                onClick={() => setFiltroDni("")}
                className="absolute right-0 top-1/2 -translate-y-1/2 text-gray-300 hover:text-indigo-500 font-bold text-xs"
              >
                LIMPIAR ✕
              </button>
            )}
          </div>
        </div>

        {/* Tabla de Resultados */}
        <DataTable columns={columnas} data={pacientes} isLoading={loading} />

        {/* Modal de Formulario (Alta/Edición) */}
        {showModal && (
          <PatientForm 
            pacienteAEditar={pacienteSeleccionado} 
            onClose={() => { setShowModal(false); setPacienteSeleccionado(null); }} 
            onSuccess={() => { setShowModal(false); fetchPacientes(filtroDni); }} 
          />
        )}
      </div>
    </div>
  );
}