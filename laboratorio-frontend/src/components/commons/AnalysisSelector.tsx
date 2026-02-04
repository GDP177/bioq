import { useState, useEffect } from "react";
import axios from "axios";

interface Analisis {
  id_analisis: number;
  nombre: string;
  codigo: string;
  categoria?: string;
  es_hijo?: boolean; // Para saber si fue agregado automáticamente
}

interface Props {
  onSelectionChange: (seleccionados: Analisis[]) => void;
}

export default function AnalysisSelector({ onSelectionChange }: Props) {
  const [catalogo, setCatalogo] = useState<Analisis[]>([]);
  const [seleccionados, setSeleccionados] = useState<Analisis[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [loading, setLoading] = useState(true);
  const [procesandoSeleccion, setProcesandoSeleccion] = useState(false); // Spinner pequeño al seleccionar

  useEffect(() => {
    cargarCatalogo();
  }, []);

  useEffect(() => {
    onSelectionChange(seleccionados);
  }, [seleccionados, onSelectionChange]);

  const cargarCatalogo = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/catalogo-analisis");
      if (res.data.success) {
        setCatalogo(res.data.analisis || []);
      }
    } catch (error) {
      console.error("Error cargando catálogo", error);
      setCatalogo([]);
    } finally {
      setLoading(false);
    }
  };

  // 🧠 LÓGICA INTELIGENTE: Verificar hijos al seleccionar
  const handleSelectAnalisis = async (item: Analisis) => {
    // 1. Si ya está seleccionado, lo quitamos (y a sus posibles hijos si fuera necesario, por ahora simple)
    const yaEsta = seleccionados.some(s => s.id_analisis === item.id_analisis);
    if (yaEsta) {
      setSeleccionados(prev => prev.filter(a => a.id_analisis !== item.id_analisis));
      return;
    }

    // 2. Si no está, verificamos si tiene hijos en el backend
    setProcesandoSeleccion(true);
    try {
      const res = await axios.get(`http://localhost:5000/api/analisis/${item.codigo}/hijos`);
      
      const hijos = res.data.hijos || [];

      if (hijos.length > 0) {
        // CASO A: TIENE HIJOS (Ej: Hemograma) -> Agregamos los hijos
        const nuevosHijos = hijos.map((h: Analisis) => ({ ...h, es_hijo: true }));
        
        // Filtramos para no duplicar si ya estaban
        const hijosParaAgregar = nuevosHijos.filter((h: Analisis) => 
            !seleccionados.some(s => s.id_analisis === h.id_analisis)
        );

        setSeleccionados(prev => [...prev, ...hijosParaAgregar]);
        // Opcional: ¿Quieres agregar también al Padre (Hemograma) o solo a los hijos?
        // Si quieres al padre también, descomenta la linea de abajo:
        // setSeleccionados(prev => [...prev, item]); 

      } else {
        // CASO B: NO TIENE HIJOS (Ej: Glucemia) -> Agregamos el item normal
        setSeleccionados(prev => [...prev, item]);
      }

    } catch (error) {
      // Si falla la verificación de hijos, lo agregamos normal por seguridad
      setSeleccionados(prev => [...prev, item]);
    } finally {
      setProcesandoSeleccion(false);
    }
  };

  const filtrados = (catalogo || []).filter(a => 
    (a.nombre || "").toLowerCase().includes(busqueda.toLowerCase()) || 
    (a.codigo || "").toString().includes(busqueda)
  );

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden flex flex-col h-[500px]">
      
      {/* Buscador */}
      <div className="p-4 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
        <span className="text-xl">🔍</span>
        <input
          type="text"
          placeholder="Buscar por Nombre o Código (ej: 660022)"
          className="w-full bg-transparent outline-none text-gray-700 placeholder-gray-400"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
        {procesandoSeleccion && <div className="animate-spin h-4 w-4 border-2 border-blue-600 rounded-full border-t-transparent"></div>}
      </div>

      <div className="flex flex-1 overflow-hidden">
        
        {/* COLUMNA IZQUIERDA: Catálogo */}
        <div className="w-1/2 overflow-y-auto p-2 border-r border-gray-100">
          <h4 className="text-xs font-bold text-gray-400 uppercase mb-2 sticky top-0 bg-white py-1">Catálogo Disponible</h4>
          {filtrados.length === 0 ? (
            <p className="text-gray-400 text-sm text-center mt-4">No hay resultados</p>
          ) : (
            <div className="space-y-1">
              {filtrados.map((item) => {
                const isSelected = seleccionados.some(s => s.id_analisis === item.id_analisis);
                return (
                  <div 
                    key={item.id_analisis}
                    onClick={() => handleSelectAnalisis(item)}
                    className={`
                      cursor-pointer p-2 rounded border text-sm flex justify-between items-center hover:bg-blue-50 transition-colors
                      ${isSelected ? "border-blue-500 bg-blue-50 text-blue-700" : "border-gray-100"}
                    `}
                  >
                    <span className="truncate flex-1" title={item.nombre}>{item.nombre}</span>
                    <span className="text-xs text-gray-400 ml-2 font-mono bg-gray-100 px-1 rounded">{item.codigo}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* COLUMNA DERECHA: Seleccionados */}
        <div className="w-1/2 overflow-y-auto p-2 bg-gray-50/50">
          <div className="flex justify-between items-center mb-2 sticky top-0 bg-gray-50 py-1">
            <h4 className="text-xs font-bold text-blue-600 uppercase">Seleccionados ({seleccionados.length})</h4>
            {seleccionados.length > 0 && (
                <button onClick={() => setSeleccionados([])} className="text-xs text-red-500 hover:underline">Borrar todo</button>
            )}
          </div>
          
          <div className="space-y-1">
            {seleccionados.map((item, index) => (
              <div key={`${item.id_analisis}-${index}`} className="bg-white p-2 rounded border border-blue-200 shadow-sm flex justify-between items-center animate-in slide-in-from-right-2 duration-200">
                <div>
                   <div className="text-sm font-medium text-gray-800">{item.nombre}</div>
                   {item.es_hijo && <span className="text-[10px] text-green-600 bg-green-50 px-1 rounded border border-green-100">Incluido en paquete</span>}
                </div>
                <button 
                  onClick={() => setSeleccionados(prev => prev.filter(x => x.id_analisis !== item.id_analisis))}
                  className="text-gray-400 hover:text-red-500 px-2"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}