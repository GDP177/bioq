// src/pages/pacientes/PacienteRegistroExitoso.tsx

import React, { useState, useEffect } from "react";

// Componentes UI básicos
const Button = ({ 
  onClick, 
  children, 
  variant = "primary", 
  className = "",
  disabled = false 
}: {
  onClick: () => void;
  children: React.ReactNode;
  variant?: "primary" | "secondary";
  className?: string;
  disabled?: boolean;
}) => {
  const baseClasses = "px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed";
  const variants = {
    primary: "bg-blue-600 text-white hover:bg-blue-700",
    secondary: "bg-gray-200 text-gray-800 hover:bg-gray-300"
  };
  
  return (
    <button 
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
};

const CustomCard = ({ 
  title, 
  children, 
  className = "" 
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) => (
  <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}>
    <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
    {children}
  </div>
);

// Interfaces
interface PacienteData {
  nro_ficha: number;
  dni: number;
  nombre: string;
  apellido: string;
  edad: number;
  sexo: string;
  telefono?: number;
  direccion?: string;
  mutual?: string;
  nro_afiliado?: number;
  grupo_sanguineo?: string;
  fecha_alta: string;
}

export default function PacienteRegistroExitoso(): JSX.Element {
  const [paciente, setPaciente] = useState<PacienteData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Función para cargar datos del paciente por número de ficha
  const cargarDatosPaciente = async (nroFicha: string) => {
    try {
      setLoading(true);
      console.log('🔍 Cargando datos del paciente con ficha:', nroFicha);
      
      const apiUrl = import.meta.env?.VITE_API_URL || 'http://localhost:5000/api';
      const response = await fetch(`${apiUrl}/paciente/buscar/ficha/${nroFicha}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('📋 Respuesta del servidor:', data);

      if (data.success && data.paciente) {
        const pacienteData = data.paciente;
        console.log('✅ Datos del paciente obtenidos:', pacienteData);
        
        setPaciente({
          nro_ficha: pacienteData.nro_ficha,
          dni: pacienteData.dni,
          nombre: pacienteData.nombre,
          apellido: pacienteData.apellido,
          edad: pacienteData.edad,
          sexo: pacienteData.sexo,
          telefono: pacienteData.telefono,
          direccion: pacienteData.direccion,
          mutual: pacienteData.mutual,
          nro_afiliado: pacienteData.nro_afiliado,
          grupo_sanguineo: pacienteData.grupo_sanguineo,
          fecha_alta: pacienteData.fecha_alta || new Date().toISOString()
        });
      } else {
        console.error('❌ Error en respuesta:', data);
        setError(data.message || "No se encontró el paciente");
      }
    } catch (error: any) {
      console.error("💥 Error al cargar datos del paciente:", error);
      setError("Error al cargar los datos del paciente");
    } finally {
      setLoading(false);
    }
  };

  // Obtener datos del paciente al cargar el componente
  useEffect(() => {
    // Obtener número de ficha desde los parámetros URL
    const urlParams = new URLSearchParams(window.location.search);
    const nroFichaParam = urlParams.get('nro_ficha');
    
    if (nroFichaParam) {
      cargarDatosPaciente(nroFichaParam);
    } else {
      // Si no hay parámetro, usar datos de ejemplo para demostración
      console.log('⚠️ No se encontró nro_ficha en URL, usando datos de ejemplo');
      const pacienteEjemplo: PacienteData = {
        nro_ficha: 1234,
        dni: 38965412,
        nombre: "Laura",
        apellido: "Gómez", 
        edad: 38,
        sexo: "F",
        telefono: 1143218765,
        direccion: "Calle Florida 567, CABA",
        mutual: "Saludtotal",
        nro_afiliado: 987654321,
        grupo_sanguineo: "A+",
        fecha_alta: new Date().toISOString()
      };

      setTimeout(() => {
        setPaciente(pacienteEjemplo);
        setLoading(false);
      }, 1000);
    }
  }, []);

  const navigateToDashboard = () => {
    window.location.href = '/medico/dashboard';
  };

  const navigateToEditarPaciente = () => {
    if (paciente) {
      window.location.href = `/medico/paciente/${paciente.nro_ficha}/editar`;
    }
  };

  const navigateToNuevaOrden = () => {
    if (paciente) {
      window.location.href = '/medico/nueva-solicitud';
    }
  };

  const navigateToHistorialPaciente = () => {
    if (paciente) {
      window.location.href = `/medico/paciente/${paciente.nro_ficha}/historial`;
    }
  };

  const navigateToListaPacientes = () => {
    window.location.href = '/medico/pacientes';
  };

  const navigateToRegistrarOtroPaciente = () => {
    window.location.href = '/medico/paciente/nuevo';
  };

  const formatFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getSexoCompleto = (sexo: string) => {
    switch (sexo) {
      case 'M': return 'Masculino';
      case 'F': return 'Femenino';
      case 'X': return 'Otro';
      default: return sexo;
    }
  };

  const formatTelefono = (telefono: number) => {
    return telefono.toString().replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando datos del paciente...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Error al cargar datos</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="space-x-3">
            <Button onClick={navigateToDashboard} variant="secondary">
              Ir al Dashboard
            </Button>
            <Button onClick={navigateToListaPacientes}>
              Ver Lista de Pacientes
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!paciente) {
    return (
      <div className="min-h-screen bg-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-500 text-6xl mb-4">❓</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">No se encontraron datos</h2>
          <p className="text-gray-600 mb-6">No se pudieron cargar los datos del paciente</p>
          <div className="space-x-3">
            <Button onClick={navigateToDashboard} variant="secondary">
              Ir al Dashboard
            </Button>
            <Button onClick={navigateToListaPacientes}>
              Ver Lista de Pacientes
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-blue-50">
      {/* Header de éxito */}
      <header className="bg-green-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <div className="text-6xl mb-4">✅</div>
            <h1 className="text-3xl font-bold mb-2">¡Paciente Registrado Exitosamente!</h1>
            <p className="text-green-100 text-lg">
              El paciente {paciente.nombre} {paciente.apellido} ha sido registrado con éxito
            </p>
            <p className="text-green-200 mt-2">
              Número de ficha: <span className="font-semibold">#{paciente.nro_ficha}</span>
            </p>
          </div>
        </div>
      </header>

      {/* Contenido principal */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Datos del paciente registrado */}
        <CustomCard title="Datos del Paciente Registrado" className="mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* Información Personal */}
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-900 border-b pb-2">Información Personal</h4>
              
              <div>
                <label className="text-sm font-medium text-gray-500">Nombre Completo</label>
                <p className="text-lg font-semibold text-gray-900">
                  {paciente.nombre} {paciente.apellido}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500">DNI</label>
                <p className="text-gray-900 font-mono">{paciente.dni?.toLocaleString()}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Edad</label>
                  <p className="text-gray-900">{paciente.edad} años</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Sexo</label>
                  <p className="text-gray-900">{getSexoCompleto(paciente.sexo || '')}</p>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500">Fecha de Registro</label>
                <p className="text-gray-900">{formatFecha(paciente.fecha_alta || '')}</p>
              </div>
            </div>

            {/* Información de Contacto */}
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-900 border-b pb-2">Contacto</h4>
              
              <div>
                <label className="text-sm font-medium text-gray-500">Teléfono</label>
                <p className="text-gray-900">
                  {paciente.telefono ? 
                    formatTelefono(paciente.telefono) : 
                    'No especificado'
                  }
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500">Dirección</label>
                <p className="text-gray-900">{paciente.direccion || 'No especificada'}</p>
              </div>
            </div>

            {/* Información Médica */}
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-900 border-b pb-2">Información Médica</h4>
              
              <div>
                <label className="text-sm font-medium text-gray-500">Obra Social</label>
                <p className="text-gray-900">{paciente.mutual || 'Particular'}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500">Nº de Afiliado</label>
                <p className="text-gray-900">
                  {paciente.nro_afiliado || 'No especificado'}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500">Grupo Sanguíneo</label>
                <p className="text-gray-900 font-semibold text-red-600">
                  {paciente.grupo_sanguineo || 'No determinado'}
                </p>
              </div>
            </div>
          </div>
        </CustomCard>

        {/* Acciones disponibles */}
        <CustomCard title="¿Qué deseas hacer ahora?" className="mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Crear nueva orden */}
            <div 
              onClick={navigateToNuevaOrden}
              className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 cursor-pointer hover:bg-blue-100 transition-colors"
            >
              <div className="text-center">
                <div className="text-3xl mb-2">🧪</div>
                <h5 className="font-semibold text-blue-900 mb-1">Nueva Orden</h5>
                <p className="text-sm text-blue-700">Solicitar análisis para este paciente</p>
              </div>
            </div>

            {/* Editar datos del paciente */}
            <div 
              onClick={navigateToEditarPaciente}
              className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4 cursor-pointer hover:bg-yellow-100 transition-colors"
            >
              <div className="text-center">
                <div className="text-3xl mb-2">✏️</div>
                <h5 className="font-semibold text-yellow-900 mb-1">Editar Datos</h5>
                <p className="text-sm text-yellow-700">Modificar información del paciente</p>
              </div>
            </div>

            {/* Ver historial */}
            <div 
              onClick={navigateToHistorialPaciente}
              className="bg-green-50 border-2 border-green-200 rounded-lg p-4 cursor-pointer hover:bg-green-100 transition-colors"
            >
              <div className="text-center">
                <div className="text-3xl mb-2">📋</div>
                <h5 className="font-semibold text-green-900 mb-1">Ver Historial</h5>
                <p className="text-sm text-green-700">Consultar historial médico</p>
              </div>
            </div>

            {/* Registrar otro paciente */}
            <div 
              onClick={navigateToRegistrarOtroPaciente}
              className="bg-purple-50 border-2 border-purple-200 rounded-lg p-4 cursor-pointer hover:bg-purple-100 transition-colors"
            >
              <div className="text-center">
                <div className="text-3xl mb-2">👤</div>
                <h5 className="font-semibold text-purple-900 mb-1">Otro Paciente</h5>
                <p className="text-sm text-purple-700">Registrar un nuevo paciente</p>
              </div>
            </div>
          </div>
        </CustomCard>

        {/* Botones de navegación principales */}
        <div className="flex flex-wrap justify-center gap-4">
          <Button 
            onClick={navigateToDashboard}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            🏠 Ir al Dashboard
          </Button>
          
          <Button 
            onClick={navigateToListaPacientes}
            variant="secondary"
          >
            👥 Ver Lista de Pacientes
          </Button>
          
          <Button 
            onClick={navigateToNuevaOrden}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            🧪 Crear Nueva Orden
          </Button>
        </div>

        {/* Información adicional */}
        <div className="mt-8 text-center text-gray-500">
          <p className="text-sm">
            El paciente ha sido registrado exitosamente en el sistema.
            Puedes crear órdenes de análisis, consultar su historial o modificar sus datos cuando sea necesario.
          </p>
        </div>
      </main>
    </div>
  );
}