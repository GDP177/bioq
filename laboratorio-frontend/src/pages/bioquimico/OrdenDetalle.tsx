import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

export default function BioquimicoOrdenDetalle() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [orden, setOrden] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetalle = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/bioquimico/orden/${id}`);
        setOrden(res.data.orden);
      } catch (err) {
        console.error("Error al cargar protocolo");
      } finally {
        setLoading(false);
      }
    };
    fetchDetalle();
  }, [id]);

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50 text-indigo-600 font-bold">Cargando Protocolo...</div>;
  if (!orden) return <div className="p-10 text-center text-red-500">Protocolo no encontrado.</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8 font-sans">
      <div className="max-w-5xl mx-auto bg-white shadow-2xl rounded-3xl overflow-hidden border border-gray-100">
        
        {/* Cabecera Técnica */}
        <header className="bg-indigo-900 text-white p-8 flex justify-between items-center">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-3xl">🧬</span>
              <h1 className="text-2xl font-black tracking-tighter uppercase">ORDEN {orden.nro_orden}</h1>
            </div>
            <p className="text-indigo-200 text-xs font-bold uppercase tracking-widest opacity-80">
              Fecha de Ingreso: {new Date(orden.fecha_ingreso).toLocaleDateString('es-AR')}
            </p>
          </div>
          <div className="text-right">
            <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase ${orden.urgente ? 'bg-red-500 text-white animate-pulse' : 'bg-indigo-700 text-indigo-100'}`}>
              {orden.urgente ? '⚠️ PRIORIDAD: URGENTE' : 'Prioridad: Rutina'}
            </span>
            <p className="mt-2 text-xs font-bold opacity-60">Estado: {orden.estado.toUpperCase()}</p>
          </div>
        </header>

        {/* Sección del Paciente - Cuadrícula Limpia */}
        <section className="p-8 bg-gray-50/50 border-b border-gray-100 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Paciente</label>
            <p className="text-lg font-bold text-gray-800 uppercase">{orden.paciente.apellido}, {orden.paciente.nombre}</p>
          </div>
          <div>
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Documento / Ficha</label>
            <p className="text-md font-bold text-gray-700">DNI {orden.paciente.dni}</p>
          </div>
          <div>
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Obra Social / Mutual</label>
            <p className="text-md font-black text-green-600 uppercase">{orden.paciente.mutual || 'PARTICULAR'}</p>
          </div>
          <div>
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Edad</label>
            <p className="text-md font-bold text-gray-700">{orden.paciente.edad} años</p>
          </div>
          <div>
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Sexo</label>
            <p className="text-md font-bold text-gray-700">{orden.paciente.sexo === 'M' ? 'Masculino' : 'Femenino'}</p>
          </div>
        </section>

        {/* Listado de Determinaciones */}
        <main className="p-8">
          <h3 className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-6 flex items-center gap-2">
            <span>🧪</span> Determinaciones y Análisis Solicitados
          </h3>
          
          <div className="space-y-3">
            {orden.analisis.map((item: any) => (
              <div key={item.id} className="group bg-white border border-gray-100 rounded-2xl p-5 hover:shadow-lg transition-all duration-200 flex flex-wrap md:flex-nowrap justify-between items-center gap-4">
                <div className="flex-1 min-w-[200px]">
                  <p className="text-[9px] font-black text-indigo-400 uppercase mb-1">Cód: {item.codigo}</p>
                  <h4 className="text-md font-bold text-gray-800 group-hover:text-indigo-900 transition-colors uppercase">{item.descripcion}</h4>
                </div>

                <div className="flex items-center gap-10">
                  <div className="text-center min-w-[100px]">
                    <p className="text-[9px] font-black text-gray-400 uppercase mb-1">Valor Hallado</p>
                    <p className={`text-xl font-black ${item.resultado ? 'text-indigo-900' : 'text-gray-200'}`}>
                      {item.resultado || '--.--'} <span className="text-[10px] font-medium text-gray-400 uppercase">{item.unidad}</span>
                    </p>
                  </div>

                  <div className="text-center min-w-[120px] bg-gray-50 px-3 py-1 rounded-xl border border-gray-100">
                    <p className="text-[9px] font-black text-gray-400 uppercase mb-1 italic">Valores de Ref.</p>
                    <p className="text-xs font-bold text-gray-500 italic">{item.referencia}</p>
                  </div>

                  <button 
                    onClick={() => navigate(`/bioquimico/cargar-resultado/${item.id}`)}
                    className="bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white px-4 py-2 rounded-xl transition-all font-black text-[10px] uppercase tracking-tighter"
                  >
                    Cargar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </main>

        {/* Footer de Acciones */}
        <footer className="bg-gray-50 p-8 flex justify-between items-center border-t border-gray-100">
          <button onClick={() => navigate(-1)} className="text-xs font-bold text-gray-400 hover:text-indigo-600 uppercase transition">
            ✕ Cerrar Detalle
          </button>
          <div className="flex gap-3">
            <button className="bg-white border border-gray-200 text-gray-600 px-5 py-2 rounded-xl text-[10px] font-black uppercase hover:bg-gray-100 transition shadow-sm">
              🖨️ Imprimir
            </button>
            <button className="bg-indigo-600 text-white px-8 py-2 rounded-xl text-[10px] font-black uppercase hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition">
              ✅ Validar Protocolo
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}