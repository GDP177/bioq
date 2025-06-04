// src/pages/medico/NuevaSolicitud.tsx

import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectItem } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";

const NuevaSolicitud: React.FC = () => {
  const { register, handleSubmit } = useForm();
  
  const [paciente, setPaciente] = useState(null);
  const [analisis, setAnalisis] = useState<any[]>([]);
  const [seleccionados, setSeleccionados] = useState<number[]>([]);
  
  useEffect(() => {
    // Cargar listado de análisis
    fetch("/api/analisis") // endpoint backend
      .then((res) => res.json())
      .then(setAnalisis);
  }, []);

  const onSubmit = (data: any) => {
    const payload = {
      paciente: data,
      analisis: seleccionados,
      observaciones: data.observaciones
    };
    console.log("Solicitud enviada:", payload);
    // Aquí se enviaría a la API
  };

  const toggleSeleccion = (codigo: number) => {
    setSeleccionados((prev) =>
      prev.includes(codigo) ? prev.filter((c) => c !== codigo) : [...prev, codigo]
    );
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Nueva Solicitud de Análisis</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* 1. Datos del paciente */}
        <div className="border p-4 rounded-lg shadow">
          <h2 className="font-semibold mb-2">Datos del Paciente</h2>
          <Input placeholder="Buscar por DNI" {...register("dni")} />
          <Input placeholder="Nombre completo" {...register("nombre")} />
          <Select {...register("obra_social")}>
            <SelectItem value="OSDE">OSDE</SelectItem>
            <SelectItem value="Swiss Medical">Swiss Medical</SelectItem>
            <SelectItem value="Otra">Otra</SelectItem>
          </Select>
        </div>

        {/* 2. Selección de análisis */}
        <div className="border p-4 rounded-lg shadow">
          <h2 className="font-semibold mb-2">Selección de Análisis</h2>
          <Input placeholder="Buscar análisis..." />
          <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto border p-2 rounded">
            {analisis.map((a) => (
              <label key={a.codigo_practica} className="flex items-center space-x-2">
                <Checkbox
                  checked={seleccionados.includes(a.codigo_practica)}
                  onCheckedChange={() => toggleSeleccion(a.codigo_practica)}
                />
                <span>{a.descripcion_practica}</span>
              </label>
            ))}
          </div>
        </div>

        {/* 3. Observaciones */}
        <div className="border p-4 rounded-lg shadow">
          <h2 className="font-semibold mb-2">Observaciones</h2>
          <Textarea {...register("observaciones")} placeholder="Indicar observaciones si las hubiera" />
        </div>

        {/* Acciones */}
        <div className="flex justify-end space-x-4">
          <Button variant="outline">Cancelar</Button>
          <Button variant="secondary">Guardar Borrador</Button>
          <Button type="submit" variant="default">Enviar</Button>
        </div>
      </form>
    </div>
  );
};

export default NuevaSolicitud;
