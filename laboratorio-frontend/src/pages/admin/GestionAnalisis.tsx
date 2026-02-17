import { useState, useEffect } from "react";
import axios from "axios";

// Componentes UI reutilizables
const Button = ({ onClick, children, className, variant = 'primary' }: any) => (
  <button 
    onClick={onClick} 
    className={`px-4 py-2 rounded-md font-bold transition-all shadow-sm ${className} ${variant === 'ghost' ? 'bg-gray-100 text-gray-600 hover:bg-gray-200' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
  >
    {children}
  </button>
);

const Input = ({ value, onChange, placeholder, type = "text", className }: any) => (
  <input
    type={type}
    value={value || ""}
    onChange={onChange}
    placeholder={placeholder}
    className={`w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 outline-none ${className}`}
  />
);

// Interfaz adaptada a la Base de Datos real
interface Practica {
  codigo_practica: number;
  descripcion_practica: string;
  codigo_modulo: number;
  descripcion_modulo: string;
  inicio_vigencia: string;
  HONORARIOS: number;
  GASTOS: number;
  TIPO: string;
  URGENCIA: string; // 'U' o null/vacío
  REFERENCIA: string;
  UNIDAD_BIOQUIMICA: string;
  FRECUENCIA: string;
  valor_referencia_rango: string;
}

export default function GestionAnalisis() {
  const [practicas, setPracticas] = useState<Practica[]>([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  const [editando, setEditando] = useState<number | null>(null);
  const [formEdicion, setFormEdicion] = useState<Partial<Practica>>({});

  useEffect(() => {
    cargarCatalogo();
  }, []);

  const cargarCatalogo = async () => {
    try {
      setLoading(true);
      console.log('🔍 Cargando catálogo completo...');
      // Llamamos a la ruta de admin que trae todas las columnas
      const response = await axios.get('http://localhost:5000/api/analisis/admin/catalogo');
      if (response.data.success) {
        setPracticas(response.data.data);
      }
    } catch (error) {
      console.error('❌ Error al cargar catálogo:', error);
    } finally {
      setLoading(false);
    }
  };

  const iniciarEdicion = (practica: Practica) => {
    setEditando(practica.codigo_practica);
    setFormEdicion({ ...practica });
  };

  const cancelarEdicion = () => {
    setEditando(null);
    setFormEdicion({});
  };

  const guardarCambios = async (codigo: number) => {
    try {
      console.log('💾 Guardando cambios:', formEdicion);
      const response = await axios.put(`http://localhost:5000/api/analisis/${codigo}`, formEdicion);

      if (response.data.success) {
        setPracticas(prev => prev.map(p => p.codigo_practica === codigo ? { ...p, ...formEdicion } : p));
        setEditando(null);
        console.log('✅ Editado con éxito');
      }
    } catch (error) {
      console.error('❌ Error guardando:', error);
      alert("No se pudo guardar los cambios.");
    }
  };

  const practicasFiltradas = practicas.filter(p => 
    p.descripcion_practica?.toLowerCase().includes(busqueda.toLowerCase()) ||
    p.codigo_practica?.toString().includes(busqueda)
  );

  const Money = ({ val }: { val: number }) => (
    <span className="font-mono">{new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(val || 0)}</span>
  );

  if (loading) return <div className="p-10 text-center text-gray-500">Cargando catálogo...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-[1920px] mx-auto">
        <header className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Catálogo Maestro de Análisis</h1>
          {/* Botón eliminado a pedido */}
        </header>

        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6">
          <input 
            type="text" 
            placeholder="🔍 Buscar práctica..." 
            className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-xs">
            <thead className="bg-gray-800 text-white">
              <tr>
                <th className="px-3 py-3 text-left font-bold uppercase w-20">Cód.</th>
                <th className="px-3 py-3 text-left font-bold uppercase w-1/4">Determinación</th>
                <th className="px-3 py-3 text-left font-bold uppercase">Módulo</th>
                <th className="px-3 py-3 text-left font-bold uppercase w-24">Unidad</th>
                <th className="px-3 py-3 text-left font-bold uppercase w-1/6">Referencia</th>
                <th className="px-3 py-3 text-right font-bold uppercase w-24">Honorarios</th>
                <th className="px-3 py-3 text-right font-bold uppercase w-24">Gastos</th>
                <th className="px-3 py-3 text-center font-bold uppercase w-20">Tipo</th>
                <th className="px-3 py-3 text-center font-bold uppercase w-24">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {practicasFiltradas.map((p) => {
                const isEditing = editando === p.codigo_practica;
                return (
                  <tr key={p.codigo_practica} className={`hover:bg-blue-50 transition-colors ${isEditing ? 'bg-blue-50' : ''}`}>
                    
                    {/* Código */}
                    <td className="px-3 py-3 font-mono font-bold text-blue-600">{p.codigo_practica}</td>

                    {/* Descripción */}
                    <td className="px-3 py-3 font-medium text-gray-900">
                      {isEditing ? (
                        <Input value={formEdicion.descripcion_practica} onChange={(e: any) => setFormEdicion({...formEdicion, descripcion_practica: e.target.value})} />
                      ) : (
                        <>
                          {p.descripcion_practica}
                          {p.URGENCIA === 'U' && <span className="ml-2 text-[9px] bg-red-100 text-red-600 px-1 rounded border border-red-200">URG</span>}
                        </>
                      )}
                    </td>

                    {/* Módulo */}
                    <td className="px-3 py-3 text-gray-500">{p.descripcion_modulo}</td>

                    {/* Unidad (Editable) */}
                    <td className="px-3 py-3">
                      {isEditing ? (
                        <Input value={formEdicion.UNIDAD_BIOQUIMICA} onChange={(e: any) => setFormEdicion({...formEdicion, UNIDAD_BIOQUIMICA: e.target.value})} />
                      ) : (
                        <span className="font-bold text-gray-700">{p.UNIDAD_BIOQUIMICA}</span>
                      )}
                    </td>

                    {/* Referencia (Editable) */}
                    <td className="px-3 py-3">
                      {isEditing ? (
                        <Input value={formEdicion.REFERENCIA} onChange={(e: any) => setFormEdicion({...formEdicion, REFERENCIA: e.target.value})} />
                      ) : (
                        <span className="text-gray-600 italic">{p.REFERENCIA}</span>
                      )}
                    </td>

                    {/* Honorarios (Editable) */}
                    <td className="px-3 py-3 text-right">
                      {isEditing ? (
                        <Input type="number" value={formEdicion.HONORARIOS} onChange={(e: any) => setFormEdicion({...formEdicion, HONORARIOS: parseFloat(e.target.value)})} className="text-right" />
                      ) : (
                        <Money val={p.HONORARIOS} />
                      )}
                    </td>

                    {/* Gastos (Editable) */}
                    <td className="px-3 py-3 text-right">
                      {isEditing ? (
                        <Input type="number" value={formEdicion.GASTOS} onChange={(e: any) => setFormEdicion({...formEdicion, GASTOS: parseFloat(e.target.value)})} className="text-right" />
                      ) : (
                        <span className="text-gray-400"><Money val={p.GASTOS} /></span>
                      )}
                    </td>

                    {/* Tipo */}
                    <td className="px-3 py-3 text-center">
                      <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-[9px] uppercase font-bold">{p.TIPO}</span>
                    </td>

                    {/* Acciones */}
                    <td className="px-3 py-3 text-center">
                      {isEditing ? (
                        <div className="flex gap-2 justify-center">
                          <button onClick={() => guardarCambios(p.codigo_practica)} className="text-green-600 hover:text-green-800 text-lg">💾</button>
                          <button onClick={cancelarEdicion} className="text-red-600 hover:text-red-800 text-lg">❌</button>
                        </div>
                      ) : (
                        <button onClick={() => iniciarEdicion(p)} className="text-blue-600 hover:text-blue-800 text-lg">✏️</button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}