// laboratorio-frontend/src/pages/medico/CompletarPerfilMedico.tsx

import React, { useState, useEffect } from 'react';
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

const CompletarPerfilMedico: React.FC = () => {
  const navigate = useNavigate();
  const [usuario, setUsuario] = useState<any>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  
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

  useEffect(() => {
    const usuarioData = localStorage.getItem('usuario');
    if (usuarioData) {
      try {
        const parsedUser = JSON.parse(usuarioData);
        if (parsedUser.rol === 'medico') {
          setUsuario(parsedUser);
        } else {
          navigate('/login');
        }
      } catch (error) {
        navigate('/login');
      }
    } else {
      navigate('/login');
    }
    setIsLoadingUser(false);
  }, [navigate]);

  const especialidades = [
    'Medicina General', 'Medicina Interna', 'Cardiología', 'Neurología', 'Pediatría',
    'Ginecología y Obstetricia', 'Traumatología', 'Dermatología', 'Psiquiatría',
    'Radiología', 'Anestesiología', 'Cirugía General', 'Urología', 'Oftalmología',
    'Otorrinolaringología', 'Oncología', 'Endocrinología', 'Gastroenterología',
    'Nefrología', 'Reumatología', 'Otra'
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Limpiar error específico al escribir
    if (errors[name as keyof PerfilData]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
    // Limpiar mensaje global si el usuario intenta corregir algo
    if (message && !isSuccess) {
      setMessage(null);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<PerfilData> = {};
    if (!formData.nombre_medico.trim()) newErrors.nombre_medico = 'El nombre es requerido';
    if (!formData.apellido_medico.trim()) newErrors.apellido_medico = 'El apellido es requerido';
    
    if (!formData.dni_medico.trim()) {
      newErrors.dni_medico = 'El DNI es requerido';
    } else if (!/^\d{7,8}$/.test(formData.dni_medico)) {
      newErrors.dni_medico = 'El DNI debe tener 7 u 8 dígitos numéricos';
    }

    if (!formData.matricula_medica.trim()) newErrors.matricula_medica = 'La matrícula es requerida';
    
    if (formData.telefono && !/^[\d\s\+\-\(\)]+$/.test(formData.telefono)) {
      newErrors.telefono = 'Formato de teléfono inválido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      setMessage('Por favor corrija los errores marcados en rojo.');
      setIsSuccess(false);
      return;
    }

    setIsLoading(true);
    setMessage(null);

    try {
      console.log("📤 Enviando datos:", { id_usuario: usuario.id_usuario, ...formData });

      const response = await fetch('http://localhost:5000/api/medico/completar-perfil', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id_usuario: usuario.id_usuario,
          ...formData
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Aquí capturamos el mensaje específico del backend (ej: "DNI duplicado")
        throw new Error(data.message || `Error del servidor (${response.status})`);
      }

      if (data.success) {
        setMessage('✅ Perfil completado con éxito. Redirigiendo...');
        setIsSuccess(true);
        
        const updatedUser = { ...usuario, ...data.usuario };
        localStorage.setItem('usuario', JSON.stringify(updatedUser));
        window.dispatchEvent(new Event('storage'));
        
        setTimeout(() => {
          navigate('/medico/dashboard');
        }, 1500);
      } else {
        throw new Error(data.message || 'La operación no se pudo completar.');
      }

    } catch (error: any) {
      console.error('❌ Error al completar perfil:', error);
      setMessage(error.message); // Mostramos el mensaje exacto del backend
      setIsSuccess(false);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoadingUser) return <div>Cargando...</div>;
  if (!usuario) return null;

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4 font-sans">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl overflow-hidden">
        
        <div className="bg-blue-600 p-8 text-center">
          <div className="mx-auto h-16 w-16 bg-white/20 rounded-full flex items-center justify-center mb-4 backdrop-blur-sm">
            <span className="text-3xl">👨‍⚕️</span>
          </div>
          <h2 className="text-3xl font-bold text-white">Completar Perfil</h2>
          <p className="mt-2 text-blue-100">Hola <strong>{usuario.username}</strong>, complete sus datos.</p>
        </div>

        <div className="p-8">
          {message && (
            <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 text-sm font-bold ${
              isSuccess ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
            }`}>
              <span>{isSuccess ? '🎉' : '⚠️'}</span>
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Nombre</label>
                <input 
                  name="nombre_medico" 
                  type="text" 
                  value={formData.nombre_medico} 
                  onChange={handleChange}
                  disabled={isLoading}
                  className={`w-full px-4 py-3 bg-gray-50 border rounded-lg ${errors.nombre_medico ? 'border-red-300' : 'border-gray-200'}`} 
                />
                {errors.nombre_medico && <p className="mt-1 text-xs text-red-500 font-bold">{errors.nombre_medico}</p>}
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Apellido</label>
                <input 
                  name="apellido_medico" 
                  type="text" 
                  value={formData.apellido_medico} 
                  onChange={handleChange}
                  disabled={isLoading}
                  className={`w-full px-4 py-3 bg-gray-50 border rounded-lg ${errors.apellido_medico ? 'border-red-300' : 'border-gray-200'}`} 
                />
                {errors.apellido_medico && <p className="mt-1 text-xs text-red-500 font-bold">{errors.apellido_medico}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">DNI (Sin puntos)</label>
                <input 
                  name="dni_medico" 
                  type="text" 
                  maxLength={8} 
                  value={formData.dni_medico} 
                  onChange={handleChange}
                  disabled={isLoading}
                  className={`w-full px-4 py-3 bg-gray-50 border rounded-lg ${errors.dni_medico ? 'border-red-300' : 'border-gray-200'}`} 
                />
                {errors.dni_medico && <p className="mt-1 text-xs text-red-500 font-bold">{errors.dni_medico}</p>}
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Matrícula Profesional</label>
                <input 
                  name="matricula_medica" 
                  type="text" 
                  value={formData.matricula_medica} 
                  onChange={handleChange}
                  disabled={isLoading}
                  className={`w-full px-4 py-3 bg-gray-50 border rounded-lg ${errors.matricula_medica ? 'border-red-300' : 'border-gray-200'}`} 
                />
                {errors.matricula_medica && <p className="mt-1 text-xs text-red-500 font-bold">{errors.matricula_medica}</p>}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Especialidad</label>
              <select 
                name="especialidad" 
                value={formData.especialidad} 
                onChange={handleChange} 
                disabled={isLoading}
                className="w-full px-4 py-3 bg-gray-50 border rounded-lg"
              >
                <option value="">Seleccione...</option>
                {especialidades.map((esp) => <option key={esp} value={esp}>{esp}</option>)}
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Teléfono</label>
                  <input 
                    name="telefono" 
                    type="tel" 
                    value={formData.telefono} 
                    onChange={handleChange} 
                    disabled={isLoading}
                    className="w-full px-4 py-3 bg-gray-50 border rounded-lg" 
                  />
                  {errors.telefono && <p className="mt-1 text-xs text-red-500 font-bold">{errors.telefono}</p>}
               </div>
               <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Dirección</label>
                  <input 
                    name="direccion" 
                    type="text" 
                    value={formData.direccion} 
                    onChange={handleChange} 
                    disabled={isLoading}
                    className="w-full px-4 py-3 bg-gray-50 border rounded-lg" 
                  />
               </div>
            </div>

            <button 
              type="submit" 
              disabled={isLoading || isSuccess} 
              className={`w-full py-4 rounded-xl font-bold text-white shadow-lg transition-all
                ${isLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 hover:shadow-xl active:transform active:scale-95'}
              `}
            >
              {isLoading ? 'Guardando...' : 'Guardar y Finalizar'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CompletarPerfilMedico;