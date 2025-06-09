import { Link, Outlet } from 'react-router-dom'

const Layout = () => {
  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar */}
      <nav
        style={{
          width: '200px',
          backgroundColor: '#0070f3',
          color: 'white',
          padding: '1rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
        }}
      >
        <h2>Menú</h2>
        <Link to="/" style={{ color: 'white', textDecoration: 'none' }}>
          Dashboard
        </Link>
        <Link to="/pacientes" style={{ color: 'white', textDecoration: 'none' }}>
          Pacientes
        </Link>
        <Link to="/ordenes" style={{ color: 'white', textDecoration: 'none' }}>
          Órdenes
        </Link>
        <Link to="/analisis" style={{ color: 'white', textDecoration: 'none' }}>
          Análisis
        </Link>
        <Link to="/resultados" style={{ color: 'white', textDecoration: 'none' }}>
          Resultados
        </Link>
      </nav>

      {/* Main area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <header style={{ backgroundColor: '#005bb5', color: 'white', padding: '1rem' }}>
          <h1>Laboratorio Bioquímico</h1>
        </header>

        {/* Content */}
        <main style={{ flex: 1, padding: '1rem', backgroundColor: '#f5f5f5' }}>
          <Outlet />
        </main>

        {/* Footer */}
        <footer style={{ backgroundColor: '#222', color: 'white', padding: '1rem', textAlign: 'center' }}>
          © 2025 Laboratorio bioquímico
        </footer>
      </div>
    </div>
  )
}

export default Layout
