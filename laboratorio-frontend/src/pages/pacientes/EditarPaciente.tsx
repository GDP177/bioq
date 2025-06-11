// src/pages/pacientes/EditarPaciente.tsx

import { useState, useEffect, useCallback } from "react";

// Componentes UI básicos (los mismos que en NuevoPaciente)
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

const Input = ({ 
  id, 
  type = "text", 
  placeholder = "", 
  value, 
  onChange, 
  isInvalid = false,
  max,
  disabled = false
}: {
  id: string;
  type?: string;
  placeholder?: string;
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isInvalid?: boolean;
  max?: string;
  disabled?: boolean;
}) => (
  <input
    id={id}
    type={type}
    placeholder={placeholder}
    value={value}
    onChange={onChange}
    disabled={disabled}
    max={max}
    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500 ${
      isInvalid ? 'border-red-500' : 'border-gray-300'
    }`}
  />
);

const FormField = ({ 
  htmlFor, 
  label, 
  children, 
  errorMessage 
}: {
  htmlFor: string;
  label: string;
  children: React.ReactNode;
  errorMessage?: string;
}) => (
  <div className="space-y-1">
    <label htmlFor={htmlFor} className="block text-sm font-medium text-gray-700">
      {label}
    </label>
    {children}
    {errorMessage && (
      <p className="text-sm text-red-600">{errorMessage}</p>
    )}
  </div>
);

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

const Toast = ({ 
  message, 
  type, 
  isVisible, 
  onClose 
}: {
  message: string;
  type: 'success' | 'error' | 'info';
  isVisible: boolean;
  onClose: () => void;
}) => {
  if (!isVisible) return null;

  const colors = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    info: 'bg-blue-500'
  };

  return (
    <div className="fixed top-4 right-4 z-50">
      <div className={`${colors[type]} text-white px-6 py-3 rounded-lg shadow-lg flex items-center space-x-3`}>
        <span>{message}</span>
        <button onClick={onClose} className="text-white hover:text-gray-200">
          ✕
        </button>
      </div>
    </div>
  );
};

// Interfaces
interface PacienteData {
  dni: number;
  nombre: string;
  apellido: string;
  fecha_nacimiento: string;
  sexo: string;
  telefono?: string;
  direccion?: string;
  email?: string;
  mutual?: string;
  mutual_personalizada?: string;
  nro_afiliado?: string;
  grupo_sanguineo?: string;
  contacto_emergencia?: string;
  telefono_emergencia?: string;
  observaciones?: string;
}

interface ErroresValidacion {
  dni?: string;
  nombre?: string;
  apellido?: string;
  fecha_nacimiento?: string;
  sexo?: string;
  telefono?: string;
  email?: string;
  mutual_personalizada?: string;
}

interface ToastState {
  message: string;
  type: 'success' | 'error' | 'info';
  isVisible: boolean;
}

// Componente de sugerencias para obras sociales
const SugerenciasObraSocial = ({ 
  sugerencias, 
  onSeleccionar, 
  loading 
}: {
  sugerencias: string[];
  onSeleccionar: (obraSocial: string) => void;
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

  if (sugerencias.length === 0) {
    return null;
  }

  return (
    <div className="absolute z-10 w-full bg-white border border-gray-300 rounded-md shadow-lg mt-1 max-h-40 overflow-y-auto">
      {sugerencias.map((sugerencia, index) => (
        <div
          key={index}
          className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
          onClick={() => onSeleccionar(sugerencia)}
        >
          <div className="flex items-center">
            <span className="text-blue-600 mr-2">🏥</span>
            <span className="text-gray-900">{sugerencia}</span>
          </div>
        </div>
      ))}
    </div>
  );
};

// Componente Loading
const LoadingSpinner = () => (
  <div className="flex items-center justify-center">
    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
    <span>Guardando cambios...</span>
  </div>
);

// Hook personalizado para el toast
const useToastCustom = () => {
  const [toast, setToast] = useState<ToastState>({
    message: '',
    type: 'info',
    isVisible: false
  });

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type, isVisible: true });
    setTimeout(() => {
      setToast(prev => ({ ...prev, isVisible: false }));
    }, 4000);
  }, []);

  const hideToast = useCallback(() => {
    setToast(prev => ({ ...prev, isVisible: false }));
  }, []);

  return { toast, showToast, hideToast };
};

export default function EditarPaciente(): JSX.Element {
  const [nroFicha, setNroFicha] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const { toast, showToast, hideToast } = useToastCustom();

  // Estado del formulario
  const [formData, setFormData] = useState<PacienteData>({
    dni: 0,
    nombre: "",
    apellido: "",
    fecha_nacimiento: "",
    sexo: "",
    telefono: "",
    direccion: "",
    email: "",
    mutual: "",
    mutual_personalizada: "",
    nro_afiliado: "",
    grupo_sanguineo: "",
    contacto_emergencia: "",
    telefono_emergencia: "",
    observaciones: ""
  });

  // Estado de errores de validación
  const [errores, setErrores] = useState<ErroresValidacion>({});

  // Estados para obras sociales personalizadas
  const [mostrarCampoPersonalizado, setMostrarCampoPersonalizado] = useState(false);
  const [sugerenciasObraSocial, setSugerenciasObraSocial] = useState<string[]>([]);
  const [mostrarSugerencias, setMostrarSugerencias] = useState(false);
  const [buscandoSugerencias, setBuscandoSugerencias] = useState(false);

  // Lista de obras sociales comunes
  const obrasSociales = [
    "OSDE",
    "Swiss Medical",
    "Galeno",
    "Medicus",
    "IOMA",
    "PAMI",
    "OSECAC",
    "OSPLAD",
    "Accord Salud",
    "Sancor Salud",
    "Particular",
    "Otra"
  ];

  // Lista de grupos sanguíneos
  const gruposSanguineos = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

  // Obtener número de ficha de la URL y cargar datos
  useEffect(() => {
    const pathParts = window.location.pathname.split('/');
    const fichaIndex = pathParts.indexOf('paciente') + 1;
    
    if (fichaIndex > 0 && pathParts[fichaIndex]) {
      const ficha = pathParts[fichaIndex];
      setNroFicha(ficha);
      cargarDatosPaciente(ficha);
    } else {
      showToast("Número de ficha no válido", 'error');
      setLoadingData(false);
    }
  }, []);

  // Función para cargar datos del paciente
  const cargarDatosPaciente = async (nroFicha: string) => {
    try {
      setLoadingData(true);
      console.log('🔍 Cargando datos del paciente con ficha:', nroFicha);
      
      const apiUrl = import.meta.env?.VITE_API_URL || 'http://localhost:5000/api';
      const response = await fetch(`${apiUrl}/paciente/buscar/ficha/${nroFicha}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('📋 Respuesta del servidor:', data);

      if (data.success && data.paciente) {
        const paciente = data.paciente;
        console.log('✅ Datos del paciente obtenidos:', paciente);
        
        // Formatear fecha para input type="date"
        const fechaFormateada = paciente.fecha_nacimiento ? 
          new Date(paciente.fecha_nacimiento).toISOString().split('T')[0] : '';

        const datosFormateados = {
          dni: paciente.dni || 0,
          nombre: paciente.nombre || "",
          apellido: paciente.apellido || "",
          fecha_nacimiento: fechaFormateada,
          sexo: paciente.sexo || "",
          telefono: paciente.telefono ? paciente.telefono.toString() : "",
          direccion: paciente.direccion || "",
          email: paciente.email || "",
          mutual: paciente.mutual || "",
          mutual_personalizada: "",
          nro_afiliado: paciente.nro_afiliado ? paciente.nro_afiliado.toString() : "",
          grupo_sanguineo: paciente.grupo_sanguineo || "",
          contacto_emergencia: paciente.contacto_emergencia || "",
          telefono_emergencia: paciente.telefono_emergencia || "",
          observaciones: paciente.observaciones || ""
        };

        console.log('📝 Datos formateados para el formulario:', datosFormateados);
        setFormData(datosFormateados);

        // Verificar si es obra social personalizada
        if (paciente.mutual && !obrasSociales.includes(paciente.mutual)) {
          console.log('🏥 Obra social personalizada detectada:', paciente.mutual);
          setMostrarCampoPersonalizado(true);
          setFormData(prev => ({
            ...prev,
            mutual: "Otra",
            mutual_personalizada: paciente.mutual
          }));
        }

        showToast("Datos del paciente cargados correctamente", 'success');
      } else {
        console.error('❌ Error en respuesta:', data);
        showToast(data.message || "No se encontró el paciente", 'error');
      }
    } catch (error) {
      console.error("💥 Error al cargar datos del paciente:", error);
      showToast("Error al cargar los datos del paciente", 'error');
    } finally {
      setLoadingData(false);
    }
  };

  // Efecto para buscar sugerencias de obras sociales personalizadas
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (formData.mutual_personalizada && formData.mutual_personalizada.trim().length >= 2) {
        buscarSugerenciasObraSocial(formData.mutual_personalizada);
      } else {
        setSugerenciasObraSocial([]);
        setMostrarSugerencias(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [formData.mutual_personalizada]);

  const buscarSugerenciasObraSocial = async (texto: string) => {
    if (!texto.trim()) return;

    setBuscandoSugerencias(true);

    try {
      const apiUrl = import.meta.env?.VITE_API_URL || 'http://localhost:5000/api';
      const response = await fetch(`${apiUrl}/obras-sociales/buscar/${encodeURIComponent(texto)}`);
      const data = await response.json();
      
      if (data.success && data.obras_sociales) {
        setSugerenciasObraSocial(data.obras_sociales);
        setMostrarSugerencias(true);
      } else {
        setSugerenciasObraSocial([]);
        setMostrarSugerencias(false);
      }
    } catch (error: any) {
      console.error("Error al buscar sugerencias de obras sociales:", error);
      setSugerenciasObraSocial([]);
      setMostrarSugerencias(false);
    } finally {
      setBuscandoSugerencias(false);
    }
  };

  const handleInputChange = (field: keyof PacienteData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Limpiar error del campo cuando se modifica
    if (errores[field as keyof ErroresValidacion]) {
      setErrores(prev => ({
        ...prev,
        [field]: undefined
      }));
    }
  };

  const handleObraSocialChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      mutual: value,
      mutual_personalizada: "" // Limpiar campo personalizado
    }));

    // Mostrar/ocultar campo personalizado
    setMostrarCampoPersonalizado(value === "Otra");
    setMostrarSugerencias(false);
    setSugerenciasObraSocial([]);

    // Limpiar errores
    if (errores.mutual_personalizada) {
      setErrores(prev => ({
        ...prev,
        mutual_personalizada: undefined
      }));
    }
  };

  const handleObraSocialPersonalizadaChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      mutual_personalizada: value
    }));

    if (errores.mutual_personalizada) {
      setErrores(prev => ({
        ...prev,
        mutual_personalizada: undefined
      }));
    }
  };

  const seleccionarSugerenciaObraSocial = (obraSocial: string) => {
    setFormData(prev => ({
      ...prev,
      mutual_personalizada: obraSocial
    }));
    setMostrarSugerencias(false);
    setSugerenciasObraSocial([]);
  };

  const calcularEdad = (fechaNacimiento: string): number => {
    if (!fechaNacimiento) return 0;
    
    const hoy = new Date();
    const nacimiento = new Date(fechaNacimiento);
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const mes = hoy.getMonth() - nacimiento.getMonth();
    
    if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
      edad--;
    }
    
    return edad;
  };

  const validarFormulario = (): boolean => {
    const nuevosErrores: ErroresValidacion = {};

    // Validar DNI
    if (!formData.dni || formData.dni <= 0) {
      nuevosErrores.dni = "El DNI es obligatorio";
    } else if (formData.dni.toString().length < 7 || formData.dni.toString().length > 8) {
      nuevosErrores.dni = "El DNI debe tener entre 7 y 8 dígitos";
    }

    // Validar nombre
    if (!formData.nombre.trim()) {
      nuevosErrores.nombre = "El nombre es obligatorio";
    } else if (formData.nombre.trim().length < 2) {
      nuevosErrores.nombre = "El nombre debe tener al menos 2 caracteres";
    }

    // Validar apellido
    if (!formData.apellido.trim()) {
      nuevosErrores.apellido = "El apellido es obligatorio";
    } else if (formData.apellido.trim().length < 2) {
      nuevosErrores.apellido = "El apellido debe tener al menos 2 caracteres";
    }

    // Validar fecha de nacimiento
    if (!formData.fecha_nacimiento) {
      nuevosErrores.fecha_nacimiento = "La fecha de nacimiento es obligatoria";
    } else {
      const edad = calcularEdad(formData.fecha_nacimiento);
      if (edad < 0 || edad > 120) {
        nuevosErrores.fecha_nacimiento = "Fecha de nacimiento inválida";
      }
    }

    // Validar sexo
    if (!formData.sexo) {
      nuevosErrores.sexo = "El sexo es obligatorio";
    }

    // Validar obra social personalizada
    if (formData.mutual === "Otra" && !formData.mutual_personalizada?.trim()) {
      nuevosErrores.mutual_personalizada = "Debe especificar el nombre de la obra social";
    } else if (formData.mutual_personalizada && formData.mutual_personalizada.trim().length < 2) {
      nuevosErrores.mutual_personalizada = "El nombre de la obra social debe tener al menos 2 caracteres";
    }

    // Validar teléfono (opcional pero con formato)
    if (formData.telefono && formData.telefono.trim()) {
      const telefonoLimpio = formData.telefono.replace(/\D/g, '');
      if (telefonoLimpio.length < 8) {
        nuevosErrores.telefono = "El teléfono debe tener al menos 8 dígitos";
      }
    }

    // Validar email (opcional pero con formato)
    if (formData.email && formData.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        nuevosErrores.email = "El formato del email no es válido";
      }
    }

    setErrores(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };

  const guardarCambios = async () => {
    if (!validarFormulario()) {
      showToast("Por favor, corrija los errores en el formulario", 'error');
      return;
    }

    setLoading(true);

    try {
      // Preparar datos para enviar
      const datosEnvio = {
        ...formData,
        mutual: formData.mutual === "Otra" ? formData.mutual_personalizada : formData.mutual,
        telefono: formData.telefono || null,
        direccion: formData.direccion || null,
        email: formData.email || null,
        nro_afiliado: formData.nro_afiliado || null,
        grupo_sanguineo: formData.grupo_sanguineo || null,
        contacto_emergencia: formData.contacto_emergencia || null,
        telefono_emergencia: formData.telefono_emergencia || null,
        observaciones: formData.observaciones || null,
      };

      // Eliminar mutual_personalizada del objeto a enviar
      delete (datosEnvio as any).mutual_personalizada;

      const apiUrl = import.meta.env?.VITE_API_URL || 'http://localhost:5000/api';
      const response = await fetch(`${apiUrl}/paciente/actualizar/${nroFicha}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(datosEnvio)
      });

      const data = await response.json();

      if (data.success) {
        showToast("Datos del paciente actualizados exitosamente", 'success');
        
        // Redireccionar a página de éxito con datos actualizados
        setTimeout(() => {
          window.location.href = `/pacientes/registro-exitoso?nro_ficha=${nroFicha}&updated=true`;
        }, 2000);
      } else {
        throw new Error(data.message || 'Error al actualizar el paciente');
      }

    } catch (error: any) {
      console.error("Error al actualizar paciente:", error);
      showToast("Error al actualizar el paciente. Intente nuevamente.", 'error');
    } finally {
      setLoading(false);
    }
  };

  const navigateBack = () => {
    window.location.href = '/medico/pacientes';
  };

  const navigateToDashboard = () => {
    window.location.href = '/medico/dashboard';
  };

  // Pantalla de carga inicial
  if (loadingData) {
    return (
      <div className="min-h-screen bg-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando datos del paciente...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">✏️ Editar Paciente</h1>
              <p className="mt-1 text-sm text-gray-500">
                Modificar datos del paciente - Ficha #{nroFicha}
              </p>
            </div>
            <div className="flex space-x-3">
              <Button
                variant="secondary"
                onClick={navigateBack}
                disabled={loading}
              >
                ← Volver a Pacientes
              </Button>
              <Button
                onClick={guardarCambios}
                disabled={loading}
                className="bg-green-600 hover:bg-green-700"
              >
                {loading ? <LoadingSpinner /> : '💾 Guardar Cambios'}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Información del paciente */}
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <div className="text-yellow-400 text-xl">⚠️</div>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                <strong>Editando paciente:</strong> {formData.nombre} {formData.apellido} (DNI: {formData.dni})
              </p>
              <p className="text-xs text-yellow-600 mt-1">
                Los cambios se guardarán permanentemente en la base de datos.
              </p>
            </div>
          </div>
        </div>

        {/* Formulario Principal - IGUAL QUE NUEVO PACIENTE PERO CON DATOS PRECARGADOS */}
        <CustomCard title="Información Personal" className="mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            <FormField htmlFor="dni" label="DNI" errorMessage={errores.dni}>
              <Input
                id="dni"
                type="number"
                placeholder="12345678"
                value={formData.dni || ''}
                onChange={(e) => handleInputChange('dni', parseInt(e.target.value) || 0)}
                isInvalid={!!errores.dni}
              />
            </FormField>

            <div className="grid grid-cols-2 gap-3">
              <FormField htmlFor="nombre" label="Nombre" errorMessage={errores.nombre}>
                <Input
                  id="nombre"
                  type="text"
                  placeholder="Juan"
                  value={formData.nombre}
                  onChange={(e) => handleInputChange('nombre', e.target.value)}
                  isInvalid={!!errores.nombre}
                />
              </FormField>

              <FormField htmlFor="apellido" label="Apellido" errorMessage={errores.apellido}>
                <Input
                  id="apellido"
                  type="text"
                  placeholder="Pérez"
                  value={formData.apellido}
                  onChange={(e) => handleInputChange('apellido', e.target.value)}
                  isInvalid={!!errores.apellido}
                />
              </FormField>
            </div>

            <FormField htmlFor="fecha_nacimiento" label="Fecha de Nacimiento" errorMessage={errores.fecha_nacimiento}>
              <Input
                id="fecha_nacimiento"
                type="date"
                value={formData.fecha_nacimiento}
                onChange={(e) => handleInputChange('fecha_nacimiento', e.target.value)}
                isInvalid={!!errores.fecha_nacimiento}
                max={new Date().toISOString().split('T')[0]}
              />
              {formData.fecha_nacimiento && (
                <p className="text-sm text-gray-500 mt-1">
                  Edad: {calcularEdad(formData.fecha_nacimiento)} años
                </p>
              )}
            </FormField>

            <FormField htmlFor="sexo" label="Sexo" errorMessage={errores.sexo}>
              <select
                id="sexo"
                value={formData.sexo}
                onChange={(e) => handleInputChange('sexo', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errores.sexo ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Seleccionar...</option>
                <option value="M">Masculino</option>
                <option value="F">Femenino</option>
                <option value="X">Otro</option>
              </select>
            </FormField>

          </div>
        </CustomCard>

        {/* Información de Contacto */}
        <CustomCard title="Información de Contacto" className="mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            <FormField htmlFor="telefono" label="Teléfono" errorMessage={errores.telefono}>
              <Input
                id="telefono"
                type="tel"
                placeholder="(011) 1234-5678"
                value={formData.telefono || ''}
                onChange={(e) => handleInputChange('telefono', e.target.value)}
                isInvalid={!!errores.telefono}
              />
            </FormField>

            <FormField htmlFor="email" label="Email" errorMessage={errores.email}>
              <Input
                id="email"
                type="email"
                placeholder="juan.perez@email.com"
                value={formData.email || ''}
                onChange={(e) => handleInputChange('email', e.target.value)}
                isInvalid={!!errores.email}
              />
            </FormField>

            <div className="md:col-span-2">
              <FormField htmlFor="direccion" label="Dirección">
                <Input
                  id="direccion"
                  type="text"
                  placeholder="Av. Corrientes 1234, CABA"
                  value={formData.direccion || ''}
                  onChange={(e) => handleInputChange('direccion', e.target.value)}
                />
              </FormField>
            </div>

          </div>
        </CustomCard>

        {/* Información Médica y Obra Social */}
        <CustomCard title="Información Médica" className="mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            <FormField htmlFor="mutual" label="Obra Social">
              <select
                id="mutual"
                value={formData.mutual || ''}
                onChange={(e) => handleObraSocialChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Seleccionar...</option>
                {obrasSociales.map(obra => (
                  <option key={obra} value={obra}>{obra}</option>
                ))}
              </select>
            </FormField>

            {/* Campo personalizado para "Otra" obra social */}
            {mostrarCampoPersonalizado && (
              <div className="relative">
                <FormField htmlFor="mutual_personalizada" label="Especificar Obra Social" errorMessage={errores.mutual_personalizada}>
                  <Input
                    id="mutual_personalizada"
                    type="text"
                    placeholder="Nombre de la obra social..."
                    value={formData.mutual_personalizada || ''}
                    onChange={(e) => handleObraSocialPersonalizadaChange(e.target.value)}
                    isInvalid={!!errores.mutual_personalizada}
                  />
                </FormField>
                
                {/* Sugerencias */}
                {mostrarSugerencias && (
                  <SugerenciasObraSocial
                    sugerencias={sugerenciasObraSocial}
                    onSeleccionar={seleccionarSugerenciaObraSocial}
                    loading={buscandoSugerencias}
                  />
                )}
              </div>
            )}

            <FormField htmlFor="nro_afiliado" label="Número de Afiliado">
              <Input
                id="nro_afiliado"
                type="text"
                placeholder="123456789"
                value={formData.nro_afiliado || ''}
                onChange={(e) => handleInputChange('nro_afiliado', e.target.value)}
              />
            </FormField>

            <FormField htmlFor="grupo_sanguineo" label="Grupo Sanguíneo">
              <select
                id="grupo_sanguineo"
                value={formData.grupo_sanguineo || ''}
                onChange={(e) => handleInputChange('grupo_sanguineo', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Seleccionar...</option>
                {gruposSanguineos.map(grupo => (
                  <option key={grupo} value={grupo}>{grupo}</option>
                ))}
              </select>
            </FormField>

          </div>
        </CustomCard>

        {/* Contactos de Emergencia */}
        <CustomCard title="Contacto de Emergencia" className="mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            <FormField htmlFor="contacto_emergencia" label="Nombre del Contacto">
              <Input
                id="contacto_emergencia"
                type="text"
                placeholder="María Pérez"
                value={formData.contacto_emergencia || ''}
                onChange={(e) => handleInputChange('contacto_emergencia', e.target.value)}
              />
            </FormField>

            <FormField htmlFor="telefono_emergencia" label="Teléfono de Emergencia">
              <Input
                id="telefono_emergencia"
                type="tel"
                placeholder="(011) 9876-5432"
                value={formData.telefono_emergencia || ''}
                onChange={(e) => handleInputChange('telefono_emergencia', e.target.value)}
              />
            </FormField>

          </div>
        </CustomCard>

        {/* Observaciones */}
        <CustomCard title="Observaciones" className="mb-6">
          <FormField htmlFor="observaciones" label="Observaciones Adicionales">
            <textarea
              id="observaciones"
              rows={4}
              placeholder="Información adicional sobre el paciente, alergias, condiciones especiales, etc."
              value={formData.observaciones || ''}
              onChange={(e) => handleInputChange('observaciones', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </FormField>
        </CustomCard>

        {/* Botones de Acción */}
        <div className="flex justify-between">
          <div className="space-x-3">
            <Button
              variant="secondary"
              onClick={navigateBack}
              disabled={loading}
            >
              ← Cancelar
            </Button>
            <Button
              variant="secondary"
              onClick={navigateToDashboard}
              disabled={loading}
            >
              🏠 Dashboard
            </Button>
          </div>
          <Button
            onClick={guardarCambios}
            disabled={loading}
            className="bg-green-600 hover:bg-green-700"
          >
            {loading ? <LoadingSpinner /> : '💾 Guardar Cambios'}
          </Button>
        </div>
      </main>

      {/* Toast Component */}
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={hideToast}
      />
    </div>
  );
}