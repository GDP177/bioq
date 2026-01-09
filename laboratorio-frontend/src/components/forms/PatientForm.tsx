import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface PatientFormProps {
  onClose: () => void;
  onSuccess: () => void;
  pacienteAEditar?: any; // Si viene este prop, es modo edición
}

export const PatientForm: React.FC<PatientFormProps> = ({ onClose, onSuccess, pacienteAEditar }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    dni: '',
    nombre: '',
    apellido: '',
    fecha_nacimiento: '',
    sexo: 'M',
    telefono: '',
    direccion: '',
    mutual: 'Particular',
    nro_afiliado: '',
    grupo_sanguineo: 'ND'
  });

  useEffect(() => {
    if (pacienteAEditar) {
      const fecha = pacienteAEditar.fecha_nacimiento ? new Date(pacienteAEditar.fecha_nacimiento).toISOString().split('T')[0] : '';
      setFormData({
        dni: pacienteAEditar.dni || '',
        nombre: pacienteAEditar.nombre || '',
        apellido: pacienteAEditar.apellido || '',
        fecha_nacimiento: fecha,
        sexo: pacienteAEditar.sexo || 'M',
        telefono: pacienteAEditar.telefono || '',
        direccion: pacienteAEditar.direccion || '',
        mutual: pacienteAEditar.mutual || 'Particular',
        nro_afiliado: pacienteAEditar.nro_afiliado || '',
        grupo_sanguineo: pacienteAEditar.grupo_sanguineo || 'ND'
      });
    }
  }, [pacienteAEditar]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (pacienteAEditar) {
        await axios.put(`http://localhost:5000/api/pacientes/actualizar/${pacienteAEditar.nro_ficha}`, {
          ...formData,
          dni: parseInt(formData.dni.toString())
        });
      } else {
        await axios.post('http://localhost:5000/api/pacientes/registrar', {
          ...formData,
          dni: parseInt(formData.dni.toString())
        });
      }
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.message || "Error al procesar la solicitud");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100] p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <header className={`${pacienteAEditar ? 'bg-blue-800' : 'bg-indigo-900'} text-white p-6`}>
          <h2 className="text-xl font-bold uppercase tracking-tight">
            {pacienteAEditar ? '✏️ Editar Ficha' : '➕ Nuevo Paciente'}
          </h2>
        </header>

        <form onSubmit={handleSubmit} className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6 bg-white">
          {error && <div className="md:col-span-2 bg-red-100 text-red-700 p-3 rounded-lg text-sm text-center font-bold">{error}</div>}
          
          <div className="space-y-1">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">DNI</label>
            <input name="dni" type="number" required value={formData.dni} className="w-full border-b-2 border-gray-100 focus:border-indigo-500 outline-none py-2" onChange={handleChange} />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Sexo</label>
            <select name="sexo" value={formData.sexo} className="w-full border-b-2 border-gray-100 focus:border-indigo-500 outline-none py-2 bg-white" onChange={handleChange}>
              <option value="M">Masculino</option>
              <option value="F">Femenino</option>
              <option value="X">Otro</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Apellido</label>
            <input name="apellido" type="text" required value={formData.apellido} className="w-full border-b-2 border-gray-100 focus:border-indigo-500 outline-none py-2" onChange={handleChange} />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Nombre</label>
            <input name="nombre" type="text" required value={formData.nombre} className="w-full border-b-2 border-gray-100 focus:border-indigo-500 outline-none py-2" onChange={handleChange} />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Fecha Nacimiento</label>
            <input name="fecha_nacimiento" type="date" required value={formData.fecha_nacimiento} className="w-full border-b-2 border-gray-100 focus:border-indigo-500 outline-none py-2" onChange={handleChange} />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Obra Social</label>
            <input name="mutual" type="text" value={formData.mutual} className="w-full border-b-2 border-gray-100 focus:border-indigo-500 outline-none py-2" onChange={handleChange} />
          </div>

          <footer className="md:col-span-2 flex justify-end gap-4 mt-8 pt-4 border-t border-gray-50">
            <button type="button" onClick={onClose} className="px-6 py-2 text-gray-400 font-bold hover:text-gray-600 uppercase text-[10px] tracking-widest transition">Cancelar</button>
            <button type="submit" disabled={loading} className={`px-10 py-3 rounded-xl font-bold shadow-xl transition-all uppercase text-[10px] tracking-widest ${pacienteAEditar ? 'bg-blue-700 hover:bg-blue-800' : 'bg-indigo-600 hover:bg-indigo-700'} text-white`}>
              {loading ? "Procesando..." : pacienteAEditar ? "Guardar Cambios" : "Registrar Paciente"}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
};