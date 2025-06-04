// src/pages/dashboard/Dashboard.tsx

import React from "react";

const Dashboard: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="max-w-4xl w-full bg-white rounded-2xl shadow-md p-8 border border-gray-200">
        <h1 className="text-3xl font-semibold text-blue-700 mb-4">Panel de Control</h1>
        <p className="text-gray-600 text-lg">
          Bienvenido al sistema de laboratorio. Desde aquí podrás gestionar pacientes, estudios y más.
        </p>
      </div>
    </div>
  );
};

export default Dashboard;
