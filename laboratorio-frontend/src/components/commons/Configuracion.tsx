import React, { useState, useEffect } from "react";
import axios from "axios";
import { 
    UserCircleIcon, KeyIcon, DevicePhoneMobileIcon, 
    MapPinIcon, IdentificationIcon, EnvelopeIcon 
} from "@heroicons/react/24/outline";

export default function Configuracion() {
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState<{ tipo: 'success' | 'error', text: string } | null>(null);
  
  // Estado para datos personales
  const [formData, setFormData] = useState({
    id_usuario: 0,
    id_rol: 0, 
    rol: '',
    nombre: '',
    apellido: '',
    dni: '',
    matricula: '',
    email: '',
    telefono: '',
    direccion: ''
  });

  // Estado para cambio de contraseña
  const [passData, setPassData] = useState({
    changePassword: false,
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    const userStr = localStorage.getItem('usuario');
    if (userStr) {
      const user = JSON.parse(userStr);
      setFormData({
        id_usuario: user.id_usuario || 0,
        id_rol: user.id || 0,
        rol: user.rol || '',
        // Mapeo flexible para soportar diferentes nombres de campos en BD
        nombre: user.nombre || user.nombre_medico || user.nombre_bioquimico || '',
        apellido: user.apellido || user.apellido_medico || user.apellido_bioquimico || '',
        dni: user.dni || user.dni_medico || user.dni_bioquimico || '',
        matricula: user.matricula || user.matricula_medica || user.matricula_bioquimico || '',
        email: user.email || '',
        telefono: user.telefono || '',
        direccion: user.direccion || ''
      });
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePassChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassData({ ...passData, [e.target.name]: e.target.value });
  };

  // ✅ VALIDACIONES FRONTEND
  const validarFormulario = () => {
    if (!formData.nombre.trim() || !formData.apellido.trim() || !formData.email.trim()) {
        setMensaje({ tipo: 'error', text: 'Nombre, Apellido y Email son obligatorios.' });
        return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
        setMensaje({ tipo: 'error', text: 'El formato del correo electrónico no es válido.' });
        return false;
    }

    if (passData.changePassword) {
        if (!passData.currentPassword) {
            setMensaje({ tipo: 'error', text: 'Debe ingresar su contraseña actual para hacer cambios.' });
            return false;
        }
        if (passData.newPassword.length < 6) {
            setMensaje({ tipo: 'error', text: 'La nueva contraseña debe tener al menos 6 caracteres.' });
            return false;
        }
        if (passData.newPassword !== passData.confirmPassword) {
            setMensaje({ tipo: 'error', text: 'Las nuevas contraseñas no coinciden.' });
            return false;
        }
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMensaje(null);

    if (!validarFormulario()) return;

    setLoading(true);

    try {
      // 🚀 URL CORREGIDA: Coincide con tu index.ts + authRoutes.ts
      const endpoint = `http://localhost:5000/api/perfil/actualizar`; 

      const payload: any = { ...formData };
      if (passData.changePassword) {
          payload.currentPassword = passData.currentPassword;
          payload.newPassword = passData.newPassword;
      }

      const response = await axios.put(endpoint, payload);

      if (response.data.success) {
        setMensaje({ tipo: 'success', text: response.data.message });
        
        // Actualizar localStorage y mantener la sesión
        const currentUser = JSON.parse(localStorage.getItem('usuario') || '{}');
        const updatedUser = { ...currentUser, ...response.data.usuario };
        localStorage.setItem('usuario', JSON.stringify(updatedUser));

        // Limpiar campos de password
        setPassData({ changePassword: false, currentPassword: '', newPassword: '', confirmPassword: '' });
      }
    } catch (error: any) {
      console.error(error);
      const errorMsg = error.response?.data?.message || 'Error al conectar con el servidor.';
      setMensaje({ tipo: 'error', text: errorMsg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2">
          <UserCircleIcon className="w-8 h-8 text-indigo-600" />
          Configuración de Perfil
        </h1>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="bg-indigo-900 p-6 text-white">
            <h2 className="text-lg font-bold">Datos Personales</h2>
            <p className="text-indigo-200 text-sm">Mantenga su información actualizada.</p>
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-8">
            {mensaje && (
              <div className={`p-4 rounded-lg text-sm font-bold flex items-center gap-2 ${mensaje.tipo === 'success' ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-red-100 text-red-700 border border-red-200'}`}>
                <span>{mensaje.tipo === 'success' ? '✅' : '⚠️'}</span>
                {mensaje.text}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Nombre</label>
                <input type="text" name="nombre" value={formData.nombre} onChange={handleChange} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Apellido</label>
                <input type="text" name="apellido" value={formData.apellido} onChange={handleChange} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
              </div>
              
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1"><IdentificationIcon className="w-4 h-4"/> DNI</label>
                <input type="text" name="dni" value={formData.dni} onChange={handleChange} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1"><IdentificationIcon className="w-4 h-4"/> Matrícula</label>
                <input type="text" name="matricula" value={formData.matricula} onChange={handleChange} className="w-full px-4 py-2 border border-slate-300 rounded-lg bg-slate-50 text-slate-500 cursor-not-allowed" readOnly title="Contacte al admin para cambiar esto" />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1"><DevicePhoneMobileIcon className="w-4 h-4"/> Teléfono</label>
                <input type="text" name="telefono" value={formData.telefono} onChange={handleChange} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1"><EnvelopeIcon className="w-4 h-4"/> Email (Login)</label>
                <input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-yellow-50/30 border-yellow-200" />
                <p className="text-[10px] text-yellow-600 mt-1">* Cambiar esto modificará su acceso al sistema.</p>
              </div>
              
              <div className="md:col-span-2 space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1"><MapPinIcon className="w-4 h-4"/> Dirección</label>
                <input type="text" name="direccion" value={formData.direccion} onChange={handleChange} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
              </div>
            </div>

            <hr className="border-slate-200" />

            {/* SECCIÓN CAMBIO CONTRASEÑA */}
            <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                <div className="flex items-center gap-2 mb-4">
                    <input 
                        type="checkbox" 
                        id="changePass" 
                        checked={passData.changePassword} 
                        onChange={(e) => setPassData({...passData, changePassword: e.target.checked})}
                        className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                    />
                    <label htmlFor="changePass" className="text-sm font-bold text-slate-700 cursor-pointer select-none flex items-center gap-2">
                        <KeyIcon className="w-4 h-4"/> Quiero cambiar mi contraseña
                    </label>
                </div>

                {passData.changePassword && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-in slide-in-from-top-2 duration-300">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500 uppercase">Contraseña Actual</label>
                            <input type="password" name="currentPassword" value={passData.currentPassword} onChange={handlePassChange} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="******" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500 uppercase">Nueva Contraseña</label>
                            <input type="password" name="newPassword" value={passData.newPassword} onChange={handlePassChange} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="******" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500 uppercase">Confirmar Nueva</label>
                            <input type="password" name="confirmPassword" value={passData.confirmPassword} onChange={handlePassChange} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="******" />
                        </div>
                    </div>
                )}
            </div>

            <div className="pt-4 flex justify-end gap-4">
              <button type="submit" disabled={loading} className="px-8 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 active:scale-95 disabled:opacity-50">
                {loading ? 'Procesando...' : 'Guardar Todos los Cambios'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}