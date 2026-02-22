// laboratorio-frontend/src/pages/bioquimico/CompletarPerfilBioquimico.tsx

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface PerfilData {
  nombre_bq: string;
  apellido_bq: string;
  dni_bioquimico: string;
  matricula_profesional: string;
  telefono: string;
  direccion: string;
  fecha_habilitacion: string;
  fecha_vencimiento_matricula: string;
}

const CompletarPerfilBioquimico: React.FC = () => {
  const navigate = useNavigate();
  const [usuario, setUsuario] = useState<any>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [formData, setFormData] = useState<PerfilData>({
    nombre_bq: '',
    apellido_bq: '',
    dni_bioquimico: '',
    matricula_profesional: '',
    telefono: '',
    direccion: '',
    fecha_habilitacion: '',
    fecha_vencimiento_matricula: ''
  });

  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errors, setErrors] = useState<Partial<PerfilData>>({});

  // Obtener usuario del localStorage al cargar el componente
  useEffect(() => {
    const usuarioData = localStorage.getItem('usuario');
    if (usuarioData && usuarioData !== "undefined") {
      try {
        const parsedUser = JSON.parse(usuarioData);
        if (parsedUser.rol === 'bioquimico') {
          setUsuario(parsedUser);
        } else {
          console.error('❌ Usuario no es bioquímico:', parsedUser.rol);
          navigate('/login');
        }
      } catch (error) {
        console.error('❌ Error al parsear usuario:', error);
        navigate('/login');
      }
    } else {
      console.error('❌ No hay usuario en localStorage');
      navigate('/login');
    }
    setIsLoadingUser(false);
  }, [navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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

    if (!formData.nombre_bq.trim()) {
      newErrors.nombre_bq = 'El nombre es requerido';
    }

    if (!formData.apellido_bq.trim()) {
      newErrors.apellido_bq = 'El apellido es requerido';
    }

    if (!formData.dni_bioquimico.trim()) {
      newErrors.dni_bioquimico = 'El DNI es requerido';
    } else if (!/^\d{7,8}$/.test(formData.dni_bioquimico)) {
      newErrors.dni_bioquimico = 'El DNI debe tener 7 u 8 dígitos';
    }

    if (!formData.matricula_profesional.trim()) {
      newErrors.matricula_profesional = 'La matrícula profesional es requerida';
    }

    if (formData.telefono && !/^[\+]?[1-9][\d\s\-\(\)]{8,15}$/.test(formData.telefono)) {
      newErrors.telefono = 'Formato de teléfono inválido';
    }

    if (formData.fecha_habilitacion) {
      const fechaHabilitacion = new Date(formData.fecha_habilitacion);
      if (fechaHabilitacion > new Date()) {
        newErrors.fecha_habilitacion = 'La fecha de habilitación no puede ser futura';
      }
    }

    if (formData.fecha_vencimiento_matricula) {
      const fechaVencimiento = new Date(formData.fecha_vencimiento_matricula);
      if (fechaVencimiento < new Date()) {
        newErrors.fecha_vencimiento_matricula = 'La matrícula no puede estar vencida';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      setMessage('Por favor corrige los errores en el formulario');
      setIsSuccess(false);
      return;
    }

    setIsLoading(true);
    setMessage(null);

    try {
      const response = await fetch('http://localhost:5000/api/bioquimico/completar-perfil', {
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

      if (data.success) {
        setMessage('Perfil completado exitosamente');
        setIsSuccess(true);
        
        // 🔥 CORRECCIÓN CLAVE 🔥
        // En lugar de sobrescribir el usuario con algo que no existe (data.usuario),
        // simplemente le agregamos la nueva matrícula al usuario que ya teníamos guardado.
        const usuarioActualizado = {
            ...usuario,
            matricula: formData.matricula_profesional, // Le agregamos la matrícula
            perfil_completado: true // Opcional, buena práctica
        };
        localStorage.setItem('usuario', JSON.stringify(usuarioActualizado));
        
        console.log('✅ Perfil completado, redirigiendo al dashboard bioquímico...');
        
        // Redirigir al dashboard bioquímico después de 2 segundos
        setTimeout(() => {
          navigate('/bioquimico/dashboard');
        }, 2000);
        
      } else {
        setMessage(data.message || 'Error al completar el perfil');
        setIsSuccess(false);
      }
    } catch (error) {
      console.error('Error al completar perfil:', error);
      setMessage('Error de conexión. Intenta nuevamente.');
      setIsSuccess(false);
    } finally {
      setIsLoading(false);
    }
  };

  // Mostrar loading mientras carga el usuario
  if (isLoadingUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando perfil...</p>
        </div>
      </div>
    );
  }

  // Si no hay usuario válido, no renderizar nada (ya se redirigió)
  if (!usuario) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full bg-white rounded-xl shadow-lg overflow-hidden">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-green-700 px-8 py-6">
          <div className="flex items-center space-x-3">
            <div className="bg-white bg-opacity-20 rounded-full p-3">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Completar Perfil Bioquímico</h1>
              <p className="text-green-100 mt-1">
                Complete sus datos profesionales para acceder al sistema.
              </p>
            </div>
          </div>
        </div>

        <div className="px-8 py-8">
          {/* Información del usuario */}
          <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center space-x-2 text-blue-800">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="font-medium">Usuario: {usuario.username}</span>
              <span className="text-blue-600">({usuario.email})</span>
            </div>
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
                  Redirigiendo al dashboard bioquímico...
                </div>
              )}
            </div>
          )}

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Datos Personales */}
            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <svg className="w-5 h-5 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Datos Personales
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="nombre_bq" className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre *
                  </label>
                  <input
                    id="nombre_bq"
                    name="nombre_bq"
                    type="text"
                    required
                    value={formData.nombre_bq}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors ${
                      errors.nombre_bq ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Nombre"
                    disabled={isLoading}
                  />
                  {errors.nombre_bq && (
                    <p className="mt-1 text-sm text-red-600">{errors.nombre_bq}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="apellido_bq" className="block text-sm font-medium text-gray-700 mb-2">
                    Apellido *
                  </label>
                  <input
                    id="apellido_bq"
                    name="apellido_bq"
                    type="text"
                    required
                    value={formData.apellido_bq}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors ${
                      errors.apellido_bq ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Apellido"
                    disabled={isLoading}
                  />
                  {errors.apellido_bq && (
                    <p className="mt-1 text-sm text-red-600">{errors.apellido_bq}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="dni_bioquimico" className="block text-sm font-medium text-gray-700 mb-2">
                    DNI *
                  </label>
                  <input
                    id="dni_bioquimico"
                    name="dni_bioquimico"
                    type="text"
                    required
                    value={formData.dni_bioquimico}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors ${
                      errors.dni_bioquimico ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="12345678"
                    disabled={isLoading}
                  />
                  {errors.dni_bioquimico && (
                    <p className="mt-1 text-sm text-red-600">{errors.dni_bioquimico}</p>
                  )}
                </div>

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
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors ${
                      errors.telefono ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="+54 362 123456"
                    disabled={isLoading}
                  />
                  {errors.telefono && (
                    <p className="mt-1 text-sm text-red-600">{errors.telefono}</p>
                  )}
                </div>
              </div>

              <div className="mt-6">
                <label htmlFor="direccion" className="block text-sm font-medium text-gray-700 mb-2">
                  Dirección
                </label>
                <textarea
                  id="direccion"
                  name="direccion"
                  rows={3}
                  value={formData.direccion}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors resize-none"
                  placeholder="Dirección completa"
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Datos Profesionales */}
            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Datos Profesionales
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="matricula_profesional" className="block text-sm font-medium text-gray-700 mb-2">
                    Matrícula Profesional *
                  </label>
                  <input
                    id="matricula_profesional"
                    name="matricula_profesional"
                    type="text"
                    required
                    value={formData.matricula_profesional}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors ${
                      errors.matricula_profesional ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Ej: BQ-12345"
                    disabled={isLoading}
                  />
                  {errors.matricula_profesional && (
                    <p className="mt-1 text-sm text-red-600">{errors.matricula_profesional}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="fecha_habilitacion" className="block text-sm font-medium text-gray-700 mb-2">
                    Fecha de Habilitación
                  </label>
                  <input
                    id="fecha_habilitacion"
                    name="fecha_habilitacion"
                    type="date"
                    value={formData.fecha_habilitacion}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors ${
                      errors.fecha_habilitacion ? 'border-red-300' : 'border-gray-300'
                    }`}
                    disabled={isLoading}
                  />
                  {errors.fecha_habilitacion && (
                    <p className="mt-1 text-sm text-red-600">{errors.fecha_habilitacion}</p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label htmlFor="fecha_vencimiento_matricula" className="block text-sm font-medium text-gray-700 mb-2">
                    Fecha de Vencimiento de Matrícula
                  </label>
                  <input
                    id="fecha_vencimiento_matricula"
                    name="fecha_vencimiento_matricula"
                    type="date"
                    value={formData.fecha_vencimiento_matricula}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors ${
                      errors.fecha_vencimiento_matricula ? 'border-red-300' : 'border-gray-300'
                    }`}
                    disabled={isLoading}
                  />
                  {errors.fecha_vencimiento_matricula && (
                    <p className="mt-1 text-sm text-red-600">{errors.fecha_vencimiento_matricula}</p>
                  )}
                  <p className="mt-1 text-xs text-gray-500">
                    Esta fecha debe ser posterior a la fecha actual
                  </p>
                </div>
              </div>
            </div>

            {/* Botones de acción */}
            <div className="flex flex-col sm:flex-row gap-4 pt-6">
              <button
                type="submit"
                disabled={isLoading}
                className={`flex-1 sm:flex-none sm:min-w-[200px] px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white font-medium rounded-lg hover:from-green-700 hover:to-green-800 transition-all duration-200 flex items-center justify-center space-x-2 ${
                  isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-lg transform hover:-translate-y-0.5'
                }`}
              >
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Guardando...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                            d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Completar Perfil</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => navigate('/login')}
                disabled={isLoading}
                className="flex-1 sm:flex-none sm:min-w-[150px] px-6 py-3 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors duration-200 flex items-center justify-center space-x-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                        d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                </svg>
                <span>Volver al Login</span>
              </button>
            </div>

            {/* Nota informativa */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <svg className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="text-sm text-yellow-800">
                  <p className="font-medium mb-1">Información importante:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Los campos marcados con (*) son obligatorios.</li>
                    <li>La matrícula profesional debe ser única en el sistema.</li>
                    <li>Verifique que todos los datos sean correctos antes de enviar.</li>
                    <li>Una vez completado el perfil, podrá acceder al dashboard bioquímico.</li>
                  </ul>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CompletarPerfilBioquimico;