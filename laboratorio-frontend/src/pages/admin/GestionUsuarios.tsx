import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { MainLayout } from '../../components/layout/MainLayout';

export default function GestionUsuarios() {
    const [usuarios, setUsuarios] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [filtro, setFiltro] = useState("");
    
    const [formData, setFormData] = useState({
        id_usuario: null as number | null,
        username: '',
        email: '',
        rol: 'medico',
        activo: 1,
        password: ''
    });

    const fetchUsuarios = async () => {
        try {
            const res = await axios.get('http://localhost:5000/api/admin/usuarios');
            if (res.data.success) {
                // Sincronizado con la clave 'usuarios' de tu API
                setUsuarios(res.data.usuarios || []);
            }
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchUsuarios(); }, []);

    // Función para blanquear contraseña
    const handleResetPassword = async (id: number, username: string) => {
        if (window.confirm(`¿Restablecer contraseña de "${username}" a "123456"?`)) {
            try {
                await axios.post(`http://localhost:5000/api/admin/usuarios/reset-password/${id}`);
                alert("Clave restablecida con éxito");
            } catch (err) { alert("Error al restablecer"); }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
        // ✅ Preparamos los datos básicos
        const payload: any = {
            username: formData.username,
            email: formData.email,
            rol: formData.rol,
            activo: Number(formData.activo)
        };

        if (isEditing && formData.id_usuario) {
            // ✅ MODO EDICIÓN: Usamos PUT y el ID en la URL
            await axios.put(`http://localhost:5000/api/admin/usuarios/${formData.id_usuario}`, payload);
        } else {
            // ✅ MODO CREACIÓN: Usamos POST y agregamos el password
            // No incluimos 'id_usuario' para que la DB use AUTO_INCREMENT
            payload.password = formData.password;
            await axios.post('http://localhost:5000/api/admin/usuarios', payload);
        }
        
        setShowModal(false);
        fetchUsuarios();
        resetForm();
        alert(isEditing ? "Usuario actualizado" : "Usuario creado con éxito");
    } catch (err: any) { 
        // Captura el error de entrada duplicada del servidor
        console.error(err);
        alert("Error al procesar: " + (err.response?.data?.message || "Error interno")); 
    }
};

    const resetForm = () => {
        setFormData({ id_usuario: null, username: '', email: '', rol: 'medico', activo: 1, password: '' });
        setIsEditing(false);
    };

    const handleEdit = (user: any) => {
        setFormData({ ...user, password: '' });
        setIsEditing(true);
        setShowModal(true);
    };

    const filtrados = (usuarios || []).filter(u => 
        u.username?.toLowerCase().includes(filtro.toLowerCase()) || 
        u.email?.toLowerCase().includes(filtro.toLowerCase())
    );

    return (
        <MainLayout>
            <div className="w-full px-10 py-8 bg-gray-50/30 min-h-screen">
                <header className="flex justify-between items-center mb-10">
                    <div>
                        <h2 className="text-4xl font-black text-indigo-950 uppercase tracking-tighter">Personal del Sistema</h2>
                        <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mt-1">Control de acceso y perfiles</p>
                    </div>
                    <button onClick={() => { resetForm(); setShowModal(true); }} className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black uppercase text-xs shadow-xl active:scale-95 transition-all">+ Nuevo Usuario</button>
                </header>

                <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 mb-8 flex items-center gap-4">
                    <span className="text-gray-400">🔍</span>
                    <input className="w-full outline-none font-bold text-gray-600 bg-transparent" placeholder="Filtrar por nombre de usuario o correo..." value={filtro} onChange={(e) => setFiltro(e.target.value)} />
                </div>

                <div className="bg-white rounded-[2.5rem] shadow-2xl border border-gray-100 overflow-hidden">
                    <table className="w-full table-auto">
                        <thead className="bg-indigo-950 text-white text-[10px] uppercase tracking-widest">
                            <tr>
                                <th className="px-10 py-6 text-left">Usuario</th>
                                <th className="px-10 py-6 text-left">Email</th>
                                <th className="px-10 py-6 text-center">Estado</th>
                                <th className="px-10 py-6 text-center">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filtrados.map((user) => (
                                <tr key={user.id_usuario} className="hover:bg-indigo-50/30 transition-colors">
                                    <td className="px-10 py-6 font-black text-indigo-950 uppercase">{user.username}</td>
                                    <td className="px-10 py-6 font-bold text-gray-500 text-sm">{user.email}</td>
                                    <td className="px-10 py-6 text-center">
                                        <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase ${user.activo ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                                            {user.activo ? 'Activo' : 'Bloqueado'}
                                        </span>
                                    </td>
                                    <td className="px-10 py-6 text-center space-x-3">
                                        <button onClick={() => handleEdit(user)} className="text-indigo-600 font-black text-[10px] uppercase hover:underline">Editar</button>
                                        <button onClick={() => handleResetPassword(user.id_usuario, user.username)} className="text-orange-600 font-black text-[10px] uppercase" title="Resetear Password">🔑 Reset</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {showModal && (
                    <div className="fixed inset-0 bg-indigo-950/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
                        <form onSubmit={handleSubmit} className="bg-white rounded-[3rem] shadow-2xl w-full max-w-lg p-10 space-y-6">
                            <h3 className="text-3xl font-black text-indigo-950 uppercase tracking-tighter">{isEditing ? 'Actualizar Perfil' : 'Registro Manual'}</h3>
                            <div className="space-y-4">
                                <input className="w-full p-4 bg-gray-50 rounded-2xl border-none font-bold" placeholder="Username" required value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} />
                                <input className="w-full p-4 bg-gray-50 rounded-2xl border-none font-bold" placeholder="Email" type="email" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                                {!isEditing && <input className="w-full p-4 bg-gray-50 rounded-2xl border-none font-bold border-2 border-indigo-100" placeholder="Contraseña Inicial" type="password" required value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />}
                                <div className="grid grid-cols-2 gap-4">
                                    <select className="w-full p-4 bg-gray-50 rounded-2xl border-none font-bold" value={formData.rol} onChange={e => setFormData({...formData, rol: e.target.value})}>
                                        <option value="admin">Admin</option>
                                        <option value="bioquimico">Bioquímico</option>
                                        <option value="medico">Médico</option>
                                    </select>
                                    <select className="w-full p-4 bg-gray-50 rounded-2xl border-none font-bold" value={formData.activo} onChange={e => setFormData({...formData, activo: parseInt(e.target.value)})}>
                                        <option value={1}>Activo</option>
                                        <option value={0}>Bloqueado</option>
                                    </select>
                                </div>
                            </div>
                            <div className="flex gap-4 pt-4">
                                <button type="button" onClick={() => setShowModal(false)} className="flex-1 p-5 font-black uppercase text-xs text-gray-400">Descartar</button>
                                <button type="submit" className="flex-1 p-5 bg-indigo-600 text-white rounded-2xl font-black uppercase text-xs shadow-lg">{isEditing ? 'Guardar' : 'Crear'}</button>
                            </div>
                        </form>
                    </div>
                )}
            </div>
        </MainLayout>
    );
}