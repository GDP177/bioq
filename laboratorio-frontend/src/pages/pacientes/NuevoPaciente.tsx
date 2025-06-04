import React from 'react'
import Layout from '@/components/layout/Layout'

const NuevoPaciente = () => {
  return (
    <Layout>
      <h1>Nuevo Paciente</h1>
      <form>
        <label>
          Nombre:
          <input type="text" name="nombre" />
        </label>
        <br />
        <label>
          Edad:
          <input type="number" name="edad" />
        </label>
        <br />
        <button type="submit">Agregar Paciente</button>
      </form>
    </Layout>
  )
}

export default NuevoPaciente
