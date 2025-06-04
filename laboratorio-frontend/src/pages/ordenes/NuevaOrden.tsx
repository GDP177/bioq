import React from 'react'
import Layout from '@/components/layout/Layout'

const NuevaOrden = () => {
  return (
    <Layout>
      <h1>Nueva Orden</h1>
      <form>
        <label>
          Paciente:
          <input type="text" name="paciente" />
        </label>
        <br />
        <label>
          Tipo de análisis:
          <input type="text" name="analisis" />
        </label>
        <br />
        <button type="submit">Crear Orden</button>
      </form>
    </Layout>
  )
}

export default NuevaOrden
