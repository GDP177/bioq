// src/pages/medico/NuevoPaciente.tsx

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

// Componentes UI reutilizables
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/ui/form-field";
import { CustomCard } from "@/components/ui/CustomCard";

interface NuevoPacienteData {
  dni: number;
  nombre: string;
  apellido: string;
  fecha_nacimiento: string;
  sexo: string;
  telefono?: string;
  direccion?: string;
  email?: string;
  mutual?: string;
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
}

// Componente Loading
const LoadingSpinner = () => (
  <div className="flex items-center justify-center p-4">
    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-3"></div>
    <span>Registrando paciente...</span>
  </div>
);

export default function NuevoPaciente() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  // Estado del formulario
  const [formData, setFormData] = useState<NuevoPacienteData>({
    dni: 0,
    nombre: "",
    apellido: "",
    fecha_nacimiento: "",
    sexo: "",
    telefono: "",
    direccion: "",
    email: "",
    mutual: "",
    nro_afiliado: "",
    grupo_sanguineo: "",
    contacto_emergencia: "",
    telefono_emergencia: "",
    observaciones: ""
  });

  // Estado de errores de validación
  const [errores, setErrores] = useState<ErroresValidacion>({});

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

  const handleInputChange = (field: keyof NuevoPacienteData, value: string | number) => {
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

    setError("");
    setSuccess("");
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
        nuevosErrores.email = "Email inválido";
      }
    }

    setErrores(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };

  const verificarDNIExistente = async (dni: number): Promise<boolean> => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const response = await axios.get(`${apiUrl}/paciente/buscar/${dni}`);
      return response.data.success; // Si encuentra el paciente, retorna true
    } catch (error: any) {
      if (error.response?.status === 404) {
        return false; // DNI no existe, está disponible
      }
      throw error; // Otro tipo de error
    }
  };

  const registrarPaciente = async () => {
    if (!validarFormulario()) {
      setError("Por favor corrija los errores en el formulario");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      // Verificar si el DNI ya existe
      const dniExiste = await verificarDNIExistente(formData.dni);
      if (dniExiste) {
        setError("Ya existe un paciente registrado con este DNI");
        setErrores(prev => ({ ...prev, dni: "DNI ya registrado" }));
        setLoading(false);
        return;
      }

      // Preparar datos para envío
      const datosEnvio = {
        ...formData,
        edad: calcularEdad(formData.fecha_nacimiento),
        nombre: formData.nombre.trim(),
        apellido: formData.apellido.trim(),
        telefono: formData.telefono?.trim() || null,
        direccion: formData.direccion?.trim() || null,
        email: formData.email?.trim() || null,
        mutual: formData.mutual?.trim() || null,
        nro_afiliado: formData.nro_afiliado?.trim() || null,
        grupo_sanguineo: formData.grupo_sanguineo || null,
        contacto_emergencia: formData.contacto_emergencia?.trim() || null,
        telefono_emergencia: formData.telefono_emergencia?.trim() || null,
        observaciones: formData.observaciones?.trim() || null
      };

      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const response = await axios.post(`${apiUrl}/paciente/registrar`, datosEnvio);

      if (response.data.success) {
        setSuccess("Paciente registrado exitosamente");
        
        // Mostrar mensaje de éxito por 2 segundos y luego redirigir
        setTimeout(() => {
          navigate('/medico/pacientes');
        }, 2000);
      } else {
        setError(response.data.message || "Error al registrar paciente");
      }
    } catch (error: any) {
      console.error("Error al registrar paciente:", error);
      if (error.response?.status === 400) {
        setError(error.response.data.message || "Datos inválidos");
      } else if (error.response?.status === 409) {
        setError("Ya existe un paciente con este DNI");
        setErrores(prev => ({ ...prev, dni: "DNI ya registrado" }));
      } else {
        setError("Error al registrar paciente. Intente nuevamente.");
      }
    } finally {
      setLoading(false);
    }
  };

  const limpiarFormulario = () => {
    setFormData({
      dni: 0,
      nombre: "",
      apellido: "",
      fecha_nacimiento: "",
      sexo: "",
      telefono: "",
      direccion: "",
      email: "",
      mutual: "",
      nro_afiliado: "",
      grupo_sanguineo: "",
      contacto_emergencia: "",
      telefono_emergencia: "",
      observaciones: ""
    });
    setErrores({});
    setError("");
    setSuccess("");
  };

  const navigateBack = () => {
    navigate('/medico/pacientes');
  };

  return (
    <div className="min-h-screen bg-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <Button
                variant="ghost"
                onClick={navigateBack}
                className="mr-4"
                aria-label="Volver a pacientes"
              >
                ← Volver
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  👥 Registrar Nuevo Paciente
                </h1>
                <p className="text-gray-600">
                  Agregar un nuevo paciente al sistema
                </p>
              </div>
            </div>
            <div className="flex space-x-3">
              <Button
                variant="secondary"
                onClick={limpiarFormulario}
                disabled={loading}
              >
                Limpiar
              </Button>
              <Button
                onClick={registrarPaciente}
                disabled={loading}
                className="bg-green-600 hover:bg-green-700"
              >
                {loading ? <LoadingSpinner /> : 'Registrar Paciente'}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Mensajes */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6" role="alert">
            <strong>Error:</strong> {error}
          </div>
        )}

        {success && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-6" role="alert">
            <div className="flex items-center">
              <span className="mr-2">✅</span>
              <strong>Éxito:</strong> {success}
            </div>
          </div>
        )}

        {/* Formulario Principal */}
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
                max={new Date().toISOString().split('T')[0]} // No permitir fechas futuras
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
                value={formData.telefono}
                onChange={(e) => handleInputChange('telefono', e.target.value)}
                isInvalid={!!errores.telefono}
              />
            </FormField>

            <FormField htmlFor="email" label="Email" errorMessage={errores.email}>
              <Input
                id="email"
                type="email"
                placeholder="juan.perez@email.com"
                value={formData.email}
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
                  value={formData.direccion}
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
                value={formData.mutual}
                onChange={(e) => handleInputChange('mutual', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Seleccionar...</option>
                {obrasSociales.map(obra => (
                  <option key={obra} value={obra}>{obra}</option>
                ))}
              </select>
            </FormField>

            <FormField htmlFor="nro_afiliado" label="Número de Afiliado">
              <Input
                id="nro_afiliado"
                type="text"
                placeholder="123456789"
                value={formData.nro_afiliado}
                onChange={(e) => handleInputChange('nro_afiliado', e.target.value)}
              />
            </FormField>

            <FormField htmlFor="grupo_sanguineo" label="Grupo Sanguíneo">
              <select
                id="grupo_sanguineo"
                value={formData.grupo_sanguineo}
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

        {/* Contacto de Emergencia */}
        <CustomCard title="Contacto de Emergencia" className="mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            <FormField htmlFor="contacto_emergencia" label="Nombre del Contacto">
              <Input
                id="contacto_emergencia"
                type="text"
                placeholder="María Pérez"
                value={formData.contacto_emergencia}
                onChange={(e) => handleInputChange('contacto_emergencia', e.target.value)}
              />
            </FormField>

            <FormField htmlFor="telefono_emergencia" label="Teléfono de Emergencia">
              <Input
                id="telefono_emergencia"
                type="tel"
                placeholder="(011) 9876-5432"
                value={formData.telefono_emergencia}
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
              value={formData.observaciones}
              onChange={(e) => handleInputChange('observaciones', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </FormField>
        </CustomCard>

        {/* Botones de Acción */}
        <div className="flex justify-between">
          <Button
            variant="secondary"
            onClick={navigateBack}
            disabled={loading}
          >
            Cancelar
          </Button>
          <div className="space-x-3">
            <Button
              variant="secondary"
              onClick={limpiarFormulario}
              disabled={loading}
            >
              Limpiar Formulario
            </Button>
            <Button
              onClick={registrarPaciente}
              disabled={loading}
              className="bg-green-600 hover:bg-green-700"
            >
              {loading ? <LoadingSpinner /> : 'Registrar Paciente'}
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}