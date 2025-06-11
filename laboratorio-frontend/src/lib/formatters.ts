// src/lib/formatters.ts

export const formatearNombre = (nombre: string): string => {
  return nombre
    .trim()
    .split(' ')
    .map(palabra => 
      palabra.charAt(0).toUpperCase() + palabra.slice(1).toLowerCase()
    )
    .join(' ');
};

export const formatearDNI = (dni: string | number): string => {
  const dniStr = dni.toString();
  if (dniStr.length === 8) {
    return `${dniStr.slice(0, 2)}.${dniStr.slice(2, 5)}.${dniStr.slice(5)}`;
  } else if (dniStr.length === 7) {
    return `${dniStr.slice(0, 1)}.${dniStr.slice(1, 4)}.${dniStr.slice(4)}`;
  }
  return dniStr;
};

export const formatearTelefono = (telefono: string): string => {
  const numeroLimpio = telefono.replace(/\D/g, '');
  if (numeroLimpio.length === 10) {
    return `(${numeroLimpio.slice(0, 3)}) ${numeroLimpio.slice(3, 7)}-${numeroLimpio.slice(7)}`;
  } else if (numeroLimpio.length === 11) {
    return `(${numeroLimpio.slice(0, 4)}) ${numeroLimpio.slice(4, 8)}-${numeroLimpio.slice(8)}`;
  }
  return telefono;
};

export const calcularEdad = (fechaNacimiento: string): number => {
  const hoy = new Date();
  const nacimiento = new Date(fechaNacimiento);
  let edad = hoy.getFullYear() - nacimiento.getFullYear();
  const mes = hoy.getMonth() - nacimiento.getMonth();
  
  if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
    edad--;
  }
  
  return edad;
};

// ---
