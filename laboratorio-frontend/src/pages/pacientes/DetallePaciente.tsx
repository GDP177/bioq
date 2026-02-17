import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

// Componentes UI
import { Button } from "@/components/ui/button";
import { CustomCard } from "@/components/ui/CustomCard";
import { Toast, useToast } from "@/components/ui/Toast";

// Interfaz (Coincide con la respuesta de tu DB)
interface PacienteDetalle {
  nro_ficha: number;
  dni: number;
  nombre: string;
  apellido: string;
  fecha_nacimiento: string;
  edad: number;
  sexo: string;
  telefono: string | null;
  direccion: string | null;
  email: string | null;
  mutual: string;
  nro_afiliado: string | null;
  grupo_sanguineo: string;
  contacto_emergencia: string | null;
  telefono_emergencia: string | null;
  observaciones: string | null;
  fecha_alta: string;
}

// Componente Loading
const LoadingSpinner = () => (
  <div className="flex items-center justify-center h-64">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3"></div>
    <span className="text-gray-500">Cargando ficha del paciente...</span>
  </div>
);

// Helper para mostrar datos o guión si es nulo
const Dato = ({ label, valor }: { label: string, valor: string | number | null | undefined }) => (
  <div className="mb-4">
    <p className="text-sm font-medium text-gray-500">{label}</p>
    <p className="text-lg font-medium text-gray-900 mt-1">
      {valor !== null && valor !== undefined && valor !== "" ? valor : "-"}
    </p>
  </div>
);

export default function DetallePaciente(): JSX.Element {
  const { id } = useParams(); // Obtenemos el ID de la URL
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [paciente, setPaciente] = useState<PacienteDetalle | null>(null);
  
  // Hook de Toast simplificado para este ejemplo
  const [toast, setToast] = useState({ message: '', type: 'info' as 'success'|'error'|'info', isVisible: false });
  const showToast = (msg: string, type: 'success'|'error') => {
    setToast({ message: msg, type, isVisible: true });
    setTimeout(() => setToast(prev => ({ ...prev, isVisible: false })), 3000);
  };

  useEffect(() => {
    const fetchPaciente = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
        // Asumiendo que tu endpoint para obtener uno es GET /paciente/:id
        const response = await axios.get(`${apiUrl}/pacientes/${id}`);
        
        if (response.data.success) {
          setPaciente(response.data.data);
        } else {
            showToast("No se encontró el paciente", "error");
        }
      } catch (error) {
        console.error("Error cargando paciente:", error);
        showToast("Error al cargar los datos del paciente", "error");
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchPaciente();
  }, [id]);

  const formatearFecha = (fechaString: string) => {
    if (!fechaString) return "-";
    const fecha = new Date(fechaString);
    return fecha.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const getSexoLabel = (sexo: string) => {
      if (sexo === 'M') return 'Masculino';
      if (sexo === 'F') return 'Femenino';
      return 'Otro';
  };

  if (loading) return <LoadingSpinner />;
  if (!paciente) return <div className="p-8 text-center">Paciente no encontrado</div>;

  return (
    <div className="min-h-screen bg-blue-50 pb-10">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xl">
                    {paciente.nombre.charAt(0)}{paciente.apellido.charAt(0)}
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                        {paciente.apellido}, {paciente.nombre}
                    </h1>
                    <p className="text-sm text-gray-500">
                        Ficha N°: {paciente.nro_ficha} | DNI: {paciente.dni}
                    </p>
                </div>
            </div>
            
            <div className="flex space-x-3">
              <Button
                variant="secondary"
                onClick={() => navigate('/medico/pacientes')}
              >
                ← Volver al listado
              </Button>
              <Button
                onClick={() => navigate(`/medico/paciente/${id}/editar`)}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                ✎ Editar Datos
              </Button>
              <Button
                onClick={() => navigate(`/medico/nueva-solicitud?paciente=${id}`)}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                + Nueva Orden
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

        {/* Información Personal */}
        <CustomCard title="Información Personal">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Dato label="Fecha de Nacimiento" valor={formatearFecha(paciente.fecha_nacimiento)} />
            <Dato label="Edad" valor={`${paciente.edad} años`} />
            <Dato label="Sexo Biológico" valor={getSexoLabel(paciente.sexo)} />
          </div>
        </CustomCard>

        {/* Información de Contacto */}
        <CustomCard title="Información de Contacto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Dato label="Teléfono" valor={paciente.telefono} />
            <Dato label="Email" valor={paciente.email} />
            <div className="md:col-span-2">
                <Dato label="Dirección" valor={paciente.direccion} />
            </div>
          </div>
        </CustomCard>

        {/* Información Médica */}
        <CustomCard title="Cobertura Médica">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1">
                 <p className="text-sm font-medium text-gray-500 mb-1">Obra Social</p>
                 <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                    {paciente.mutual}
                 </span>
            </div>
            <Dato label="Número de Afiliado" valor={paciente.nro_afiliado} />
            <div className="md:col-span-1">
                 <p className="text-sm font-medium text-gray-500 mb-1">Grupo Sanguíneo</p>
                 <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                    {paciente.grupo_sanguineo}
                 </span>
            </div>
          </div>
        </CustomCard>

        {/* Emergencia y Observaciones */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <CustomCard title="Contacto de Emergencia">
                <Dato label="Nombre" valor={paciente.contacto_emergencia} />
                <Dato label="Teléfono" valor={paciente.telefono_emergencia} />
            </CustomCard>

            <CustomCard title="Observaciones">
                <div className="bg-yellow-50 p-4 rounded-md border border-yellow-100 h-full">
                    <p className="text-gray-700 italic">
                        {paciente.observaciones || "Sin observaciones registradas."}
                    </p>
                </div>
            </CustomCard>
        </div>

      </main>

      <Toast 
        message={toast.message}
        type={toast.type} 
        isVisible={toast.isVisible} 
        onClose={() => setToast(p => ({...p, isVisible: false}))} 
      />
    </div>
  );
}