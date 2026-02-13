import { Request } from 'express';
import { pool } from '../routes/db';

interface QueryOptions {
    baseQuery: string;      
    countQuery?: string;    
    defaultTable: string;   
    searchColumns: string[];
    queryParams: any;       
    whereConditions?: string[]; 
    params?: any[];         
    orderByClause?: string; // ✅ NUEVO: Parámetro explícito para el orden
}

export const executePaginatedQuery = async (options: QueryOptions) => {
    const { 
        baseQuery, 
        countQuery, 
        defaultTable, 
        searchColumns, 
        queryParams, 
        whereConditions = [], 
        params = [],
        orderByClause 
    } = options;

    const pagina = parseInt(queryParams.pagina as string) || 1;
    const limite = parseInt(queryParams.limite as string) || 20;
    const offset = (pagina - 1) * limite;
    const buscar = (queryParams.buscar as string || '').trim();
    // const orden = queryParams.orden as string || 'reciente'; // (Ya no lo calculamos aquí si viene de fuera)

    // 1. Construir Filtros de Búsqueda
    if (buscar) {
        const searchQuery = searchColumns.map(col => `${col} LIKE ?`).join(' OR ');
        whereConditions.push(`(${searchQuery})`);
        searchColumns.forEach(() => params.push(`%${buscar}%`));
    }

    // 2. Construir WHERE clause
    const whereClause = whereConditions.length > 0 
        ? 'WHERE ' + whereConditions.join(' AND ') 
        : 'WHERE 1=1';

    // 3. Obtener Total de registros (para paginación)
    const finalCountQuery = countQuery 
        ? `${countQuery} ${whereClause}` 
        : `SELECT COUNT(*) as total FROM ${defaultTable} ${whereClause}`;

    const countParams = [...params]; 

    // 4. Ordenamiento
    // Si pasamos un orderByClause específico, lo usamos. Si no, fallback por defecto.
    let finalOrderBy = orderByClause || `ORDER BY ${defaultTable}.nro_ficha DESC`; 

    // 5. Query Final (ESTRUCTURA CORREGIDA: WHERE antes de ORDER BY)
    const finalQuery = `${baseQuery} ${whereClause} ${finalOrderBy} LIMIT ? OFFSET ?`;
    
    // Agregamos params de paginación
    params.push(limite, offset);

    try {
        const [rows]: any = await pool.query(finalQuery, params);
        const [totalResult]: any = await pool.query(finalCountQuery, countParams);
        
        return {
            success: true,
            data: rows,
            meta: {
                total: totalResult[0]?.total || 0,
                pagina_actual: pagina,
                total_paginas: Math.ceil((totalResult[0]?.total || 0) / limite),
                por_pagina: limite
            }
        };
    } catch (error: any) {
        console.error("SQL Error en executePaginatedQuery:", error.message); // Log mejorado
        throw new Error(error.message);
    }
};