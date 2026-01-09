import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { MainLayout } from '../../components/layout/MainLayout';

interface Analisis {
    codigo_practica: string | number;
    descripcion_practica: string;
    REFERENCIA: string;
    UNIDAD_BIOQUIMICA: string;
    URGENCIA: string;
    cantidad_hijos: number;
}

export default function GestionAnalisis() {
    const [analisis, setAnalisis] = useState<Analisis[]>([]);
    const [loading, setLoading] = useState(true);
    const [filtro, setFiltro] = useState("");
    const [hijosVisibles, setHijosVisibles] = useState<Record<string, any[]>>({});

    const fetchCatalogo = async () => {
        setLoading(true);
        try {
            const res = await axios.get('http://localhost:5000/api/analisis/admin/catalogo');
            if (res.data.success) {
                setAnalisis(res.data.data);
            }
        } catch (err) {
            console.error("Error al cargar el catálogo:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCatalogo();
    }, []);

    const toggleHijos = async (codigo: string | number) => {
        const codigoStr = String(codigo);
        if (hijosVisibles[codigoStr]) {
            const copia = { ...hijosVisibles };
            delete copia[codigoStr];
            setHijosVisibles(copia);
            return;
        }

        try {
            const res = await axios.get(`http://localhost:5000/api/analisis/estructura/${codigoStr}`);
            if (res.data.success) {
                setHijosVisibles({ ...hijosVisibles, [codigoStr]: res.data.data });
            }
        } catch (err) {
            console.error("Error al cargar sub-análisis:", err);
        }
    };

    // ✅ BUSCADOR CORREGIDO: Maneja códigos numéricos y evita el crash
    const analisisFiltrados = analisis.filter(item => {
        const query = filtro.toLowerCase();
        const descripcion = item.descripcion_practica?.toLowerCase() || "";
        const codigo = String(item.codigo_practica || ""); // Conversión segura a String
        
        return descripcion.includes(query) || codigo.includes(query);
    });

    return (
        <MainLayout>
            {/* ✅ CONTENEDOR DE ANCHO TOTAL */}
            <div className="w-full min-h-screen bg-gray-50/30 overflow-x-hidden">
                <div className="w-full px-4 sm:px-10 py-8">
                    
                    <header className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 mb-10">
                        <div>
                            <h2 className="text-4xl font-black text-indigo-950 uppercase tracking-tighter">
                                Catálogo Técnico de Análisis
                            </h2>
                            <p className="text-gray-400 text-xs font-bold uppercase tracking-[0.3em] mt-1">
                                Gestión Integral de Prácticas y Perfiles Bioquímicos
                            </p>
                        </div>
                        <button className="whitespace-nowrap bg-indigo-600 hover:bg-indigo-700 text-white font-black py-4 px-10 rounded-2xl shadow-2xl transition-all uppercase text-xs tracking-widest active:scale-95">
                            + Registrar Nueva Práctica
                        </button>
                    </header>

                    {/* Buscador Ultra-Ancho */}
                    <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100 mb-10 flex items-center gap-6">
                        <span className="text-3xl opacity-30 grayscale">🔍</span>
                        <input 
                            type="text" 
                            placeholder="Buscar por código o descripción (Ej: 660005, Hemograma...)" 
                            className="w-full bg-transparent border-none outline-none text-2xl font-bold text-gray-700 placeholder:text-gray-200"
                            value={filtro}
                            onChange={(e) => setFiltro(e.target.value)}
                        />
                    </div>

                    {/* ✅ TABLA DE DATOS EXPANSIVA */}
                    <div className="bg-white rounded-[2.5rem] shadow-2xl border border-gray-100 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full table-auto border-collapse">
                                <thead className="bg-indigo-950 text-white text-[11px] uppercase tracking-[0.2em] font-black">
                                    <tr>
                                        <th className="px-10 py-8 text-left min-w-[150px]">Código</th>
                                        <th className="px-10 py-8 text-left min-w-[450px]">Determinación / Descripción Completa</th>
                                        <th className="px-10 py-8 text-left min-w-[250px]">Valor Referencia</th>
                                        <th className="px-10 py-8 text-left min-w-[150px]">Unidad</th>
                                        <th className="px-10 py-8 text-center min-w-[150px]">Estado</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {analisisFiltrados.map((item) => (
                                        <React.Fragment key={item.codigo_practica}>
                                            <tr 
                                                className={`group hover:bg-indigo-50/50 transition-all cursor-pointer ${hijosVisibles[String(item.codigo_practica)] ? 'bg-indigo-50/30' : ''}`}
                                                onClick={() => toggleHijos(item.codigo_practica)}
                                            >
                                                <td className="px-10 py-8">
                                                    <span className="font-black text-indigo-600 text-lg tracking-tighter">#{item.codigo_practica}</span>
                                                </td>
                                                <td className="px-10 py-8">
                                                    <p className="font-bold text-gray-800 uppercase text-md leading-tight group-hover:text-indigo-800 transition-colors break-words">
                                                        {item.descripcion_practica}
                                                    </p>
                                                    {item.cantidad_hijos > 0 && (
                                                        <div className="mt-3 flex items-center gap-3">
                                                            <span className="text-[9px] bg-indigo-600 text-white px-3 py-1 rounded-lg font-black uppercase tracking-widest">
                                                                PERFIL COMPUESTO
                                                            </span>
                                                            <span className="text-[9px] text-indigo-400 font-bold uppercase tracking-widest">
                                                                {hijosVisibles[String(item.codigo_practica)] ? '▼ Ocultar Componentes' : `▶ Ver ${item.cantidad_hijos} sub-análisis`}
                                                            </span>
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-10 py-8">
                                                    <span className="text-gray-500 font-medium italic text-sm">{item.REFERENCIA || 'N/A'}</span>
                                                </td>
                                                <td className="px-10 py-8">
                                                    <span className="font-black text-gray-400 text-sm tracking-tighter">{item.UNIDAD_BIOQUIMICA || '-'}</span>
                                                </td>
                                                <td className="px-10 py-8 text-center">
                                                    <span className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border ${
                                                        item.URGENCIA === 'U' ? 'bg-red-50 text-red-600 border-red-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                                                    }`}>
                                                        {item.URGENCIA === 'U' ? 'URGENTE' : 'RUTINA'}
                                                    </span>
                                                </td>
                                            </tr>
                                            
                                            {/* ✅ ESTRUCTURA DE HIJOS (INCLUYE) */}
                                            {hijosVisibles[String(item.codigo_practica)] && (
                                                <tr>
                                                    <td colSpan={5} className="bg-gray-100/30 p-0 border-y border-indigo-100">
                                                        <div className="ml-32 my-10 mr-12 bg-white rounded-[2rem] shadow-inner border border-indigo-50 overflow-hidden">
                                                            <table className="w-full table-auto">
                                                                <thead className="bg-gray-50 text-indigo-900/50 text-[9px] uppercase font-black border-b border-gray-100">
                                                                    <tr>
                                                                        <th className="px-10 py-6 text-left">Sub-Código</th>
                                                                        <th className="px-10 py-6 text-left">Determinación Componente</th>
                                                                        <th className="px-10 py-6 text-left">Ref. Técnico</th>
                                                                        <th className="px-10 py-6 text-left">Unidad</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody className="divide-y divide-gray-50 text-xs">
                                                                    {hijosVisibles[String(item.codigo_practica)].map((h, idx) => (
                                                                        <tr key={idx} className="hover:bg-blue-50/50 transition-colors">
                                                                            <td className="px-10 py-7 font-bold text-indigo-400">#{h.codigo_hijo}</td>
                                                                            <td className="px-10 py-7 font-black uppercase text-gray-700 tracking-tight">{h.descripcion_practica}</td>
                                                                            <td className="px-10 py-7 text-gray-500 italic">{h.REFERENCIA || 'V.R. no especificado'}</td>
                                                                            <td className="px-10 py-7 font-bold text-gray-400">{h.UNIDAD_BIOQUIMICA || '-'}</td>
                                                                        </tr>
                                                                    ))}
                                                                </tbody>
                                                            </table>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </React.Fragment>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </MainLayout>
    );
}