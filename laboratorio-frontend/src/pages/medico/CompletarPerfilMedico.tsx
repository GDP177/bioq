// laboratorio-frontend/src/pages/medico/CompletarPerfilMedico.tsx

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface PerfilData {
  nombre_medico: string;
  apellido_medico: string;
  dni_medico: string;
  matricula_medica: string;
  especialidad: string;
  telefono: string;
  direccion: string;
}

interface Props {
  usuario: {
    id_usuario: number;
    email: string;
    username: string;
    rol: string;
  };
}

const CompletarPerfilMedico: React.FC<Props> = ({ usuario }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<PerfilData>({
    nombre_medico: '',
    apellido_medico: '',
    dni_medico: '',
    matricula_medica: '',
    especialidad: '',
    telefono: '',
    direccion: ''
  });

  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errors, setErrors] = useState<Partial<PerfilData>>({});

  const especialidades = [
    'Medicina General',
    'Medicina Interna',
    'Cardiología',
    'Neurología',
    'Pediatría',
    'Ginecología y Obstetricia',
    'Traumatología',
    'Dermatología',
    'Psiquiatría',
    'Radiología',
    'Anestesiología',
    'Cirugía General',
    'Urología',
    'Oftalmología',
    'Otorrinolaringología',
    'Oncología',
    'Endocrinología',
    'Gastroenterología',
    'Nefrología',
    'Reumatología',
    'Otra'
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Limpiar error del campo cuando se modifica
    if (errors[name as keyof PerfilData]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<PerfilData> = {};

    if (!formData.nombre_medico.trim()) {
      newErrors.nombre_medico = 'El nombre es requerido';
    }

    if (!formData.apellido_medico.trim()) {
      newErrors.apellido_medico = 'El apellido es requerido';
    }

    if (!formData.dni_medico.trim()) {
      newErrors.dni_medico = 'El DNI es requerido';
    } else if (!/^\d{7,8}$/.test(formData.dni_medico)) {
      newErrors.dni_medico = 'El DNI debe tener 7 u 8 dígitos';
    }

    if (!formData.matricula_medica.trim()) {
      newErrors.matricula_medica = 'La matrícula médica es requerida';
    }

    if (formData.telefono && !/^[\+]?[\d\s\-\(\)]+$/.test(formData.telefono)) {
      newErrors.telefono = 'Formato de teléfono inválido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      setMessage('Por favor corrija los errores antes de continuar');
      setIsSuccess(false);
      return;
    }

    setIsLoading(true);
    setMessage(null);

    try {
      const response = await fetch('http://localhost:5000/api/medico/completar-perfil', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id_usuario: usuario.id_usuario,
          ...formData
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `Error ${response.status}`);
      }

      if (data.success) {
        setMessage('Perfil completado exitosamente');
        setIsSuccess(true);
        
        // Guardar datos del médico en localStorage
        localStorage.setItem('usuario', JSON.stringify(data.medico));
        
        // Redirigir al dashboard después de 2 segundos
        setTimeout(() => {
          navigate(`/medico/dashboard`);
        }, 2000);
      } else {
        throw new Error(data.message || 'Error desconocido');
      }

    } catch (error: any) {
      console.error('Error al completar perfil:', error);
      setMessage(`Error: ${error.message}`);
      setIsSuccess(false);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full space-y-8">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="mx-auto h-16 w-16 bg-blue-600 rounded-full flex items-center justify-center mb-4">
              <span className="text-white text-2xl">👨‍⚕️</span>
            </div>
            <h2 className="text-3xl font-bold text-gray-900">Completar Perfil Médico</h2>
            <p className="mt-2 text-gray-600">
              Bienvenido/a <strong>{usuario.username}</strong>. Complete sus datos profesionales para acceder al sistema.
            </p>
          </div>

          {/* Mensaje de estado */}
          {message && (
            <div className={`mb-6 p-4 rounded-lg text-center font-medium ${
              isSuccess 
                ? 'bg-green-50 text-green-800 border border-green-200' 
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}>
              {message}
              {isSuccess && (
                <div className="mt-2 text-sm text-green-600">
                  Redirigiendo al dashboard...
                </div>
              )}
            </div>
          )}

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Datos Personales */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="nombre_medico" className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre *
                </label>
                <input
                  id="nombre_medico"
                  name="nombre_medico"
                  type="text"
                  required
                  value={formData.nombre_medico}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.nombre_medico ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Nombre"
                  disabled={isLoading}
                />
                {errors.nombre_medico && (
                  <p className="mt-1 text-sm text-red-600">{errors.nombre_medico}</p>
                )}
              </div>

              <div>
                <label htmlFor="apellido_medico" className="block text-sm font-medium text-gray-700 mb-2">
                  Apellido *
                </label>
                <input
                  id="apellido_medico"
                  name="apellido_medico"
                  type="text"
                  required
                  value={formData.apellido_medico}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.apellido_medico ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Apellido"
                  disabled={isLoading}
                />
                {errors.apellido_medico && (
                  <p className="mt-1 text-sm text-red-600">{errors.apellido_medico}</p>
                )}
              </div>
            </div>

            {/* DNI y Matrícula */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="dni_medico" className="block text-sm font-medium text-gray-700 mb-2">
                  DNI *
                </label>
                <input
                  id="dni_medico"
                  name="dni_medico"
                  type="text"
                  required
                  value={formData.dni_medico}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.dni_medico ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="12345678"
                  disabled={isLoading}
                />
                {errors.dni_medico && (
                  <p className="mt-1 text-sm text-red-600">{errors.dni_medico}</p>
                )}
              </div>

              <div>
                <label htmlFor="matricula_medica" className="block text-sm font-medium text-gray-700 mb-2">
                  Matrícula Médica *
                </label>
                <input
                  id="matricula_medica"
                  name="matricula_medica"
                  type="text"
                  required
                  value={formData.matricula_medica}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.matricula_medica ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="MP 12345"
                  disabled={isLoading}
                />
                {errors.matricula_medica && (
                  <p className="mt-1 text-sm text-red-600">{errors.matricula_medica}</p>
                )}
              </div>
            </div>

            {/* Especialidad */}
            <div>
              <label htmlFor="especialidad" className="block text-sm font-medium text-gray-700 mb-2">
                Especialidad
              </label>
              <select
                id="especialidad"
                name="especialidad"
                value={formData.especialidad}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isLoading}
              >
                <option value="">Seleccionar especialidad</option>
                {especialidades.map((esp) => (
                  <option key={esp} value={esp}>
                    {esp}
                  </option>
                ))}
              </select>
            </div>

            {/* Contacto */}
            <div>
              <label htmlFor="telefono" className="block text-sm font-medium text-gray-700 mb-2">
                Teléfono
              </label>
              <input
                id="telefono"
                name="telefono"
                type="tel"
                value={formData.telefono}
                onChange={handleChange}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.telefono ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="+54 9 11 1234-5678"
                disabled={isLoading}
              />
              {errors.telefono && (
                <p className="mt-1 text-sm text-red-600">{errors.telefono}</p>
              )}
            </div>

            {/* Dirección */}
            <div>
              <label htmlFor="direccion" className="block text-sm font-medium text-gray-700 mb-2">
                Dirección
              </label>
              <textarea
                id="direccion"
                name="direccion"
                rows={3}
                value={formData.direccion}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Dirección completa"
                disabled={isLoading}
              />
            </div>

            {/* Botón de envío */}
            <button
              type="submit"
              disabled={isLoading || isSuccess}
              className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
                isLoading || isSuccess
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
              } text-white`}
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Guardando...
                </div>
              ) : isSuccess ? (
                '✅ Perfil Completado'
              ) : (
                'Completar Perfil'
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-6 text-center text-sm text-gray-600">
            <p>* Campos obligatorios</p>
            <p className="mt-2">
              Una vez completado el perfil, tendrá acceso completo al sistema de laboratorio.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompletarPerfilMedico;