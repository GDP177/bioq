import React from 'react';

interface Column {
  header: string;
  accessor: string;
  render?: (row: any) => React.ReactNode;
}

interface DataTableProps {
  columns: Column[];
  data: any[];
  isLoading?: boolean;
}

export const DataTable: React.FC<DataTableProps> = ({ columns, data, isLoading }) => {
  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200">
      <table className="w-full text-left border-collapse">
        <thead className="bg-indigo-900 text-white text-xs uppercase tracking-wider">
          <tr>
            {columns.map((col, i) => (
              <th key={i} className="p-4 font-bold">{col.header}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {isLoading ? (
            <tr>
              <td colSpan={columns.length} className="p-10 text-center text-gray-500 animate-pulse">
                Cargando datos...
              </td>
            </tr>
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="p-10 text-center text-gray-500 italic">
                No se encontraron registros.
              </td>
            </tr>
          ) : (
            data.map((row, rowIndex) => (
              <tr key={rowIndex} className="hover:bg-indigo-50 transition duration-150">
                {columns.map((col, colIndex) => (
                  <td key={colIndex} className="p-4 text-sm text-gray-700">
                    {col.render ? col.render(row) : row[col.accessor]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};