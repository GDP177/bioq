import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/login/Login'
import MedicoDashboard from './pages/dashboard/MedicoDashboard'
import RegisterForm from './pages/login/RegisterForm'
import './App.css'

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<RegisterForm />} />
          <Route path="/MedicoDashboard" element={<MedicoDashboard />} />
          <Route path="/medico-dashboard" element={<MedicoDashboard />} />
          <Route path="/" element={<Navigate to="/login" replace />} />
        </Routes>
      </div>
    </Router>
  )
}

export default App