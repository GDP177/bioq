import React from 'react'
import Layout from '@/components/layout/Layout'
import { useNavigate } from 'react-router-dom'

const NotFound = () => {
  const navigate = useNavigate()

  return (
    <Layout>
      <h1>404 - Página no encontrada</h1>
      <p>La página que buscas no existe.</p>
      <button onClick={() => navigate('/')}>Volver al inicio</button>
    </Layout>
  )
}

export default NotFound
