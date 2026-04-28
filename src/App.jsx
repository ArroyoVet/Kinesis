import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Login from "./pages/Login";
import Home from "./pages/Home";
import Agenda from "./pages/Agenda";
import Pacientes from "./pages/Pacientes";
import NuevoPaciente from "./pages/NuevoPaciente";
import DetallePaciente from "./pages/DetallePaciente";
import Reportes from "./pages/Reportes";
import NuevoEpisodio from "./pages/NuevoEpisodio";
import DetalleEpisodio from "./pages/DetalleEpisodio";
import NuevaSesion from "./pages/NuevaSesion";
import DetalleSesion from "./pages/DetalleSesion";
import NuevaCita from "./pages/NuevaCita";
import EditarPaciente from "./pages/EditarPaciente";

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? children : <Navigate to="/login" />;
}

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<PrivateRoute><Home /></PrivateRoute>} />
        <Route path="/agenda" element={<PrivateRoute><Agenda /></PrivateRoute>} />
        <Route path="/pacientes" element={<PrivateRoute><Pacientes /></PrivateRoute>} />
        <Route path="/pacientes/:id" element={<PrivateRoute><DetallePaciente /></PrivateRoute>} />
        <Route path="/pacientes/nuevo" element={<PrivateRoute><NuevoPaciente /></PrivateRoute>} />
        <Route path="/pacientes/:id/editar" element={<PrivateRoute><EditarPaciente /></PrivateRoute>} />
        <Route path="/pacientes/:id/nuevo-episodio" element={<PrivateRoute><NuevoEpisodio /></PrivateRoute>} />
        <Route path="/pacientes/:id/episodios/:epId" element={<PrivateRoute><DetalleEpisodio /></PrivateRoute>} />
        <Route path="/pacientes/:id/episodios/:epId/nueva-sesion" element={<PrivateRoute><NuevaSesion /></PrivateRoute>} />
        <Route path="/pacientes/:id/episodios/:epId/sesiones/:sesId" element={<PrivateRoute><DetalleSesion /></PrivateRoute>} />
        <Route path="/pacientes/:id/episodios/:epId/sesiones/:sesId/editar" element={<PrivateRoute><NuevaSesion /></PrivateRoute>} />
        <Route path="/reportes" element={<PrivateRoute><Reportes /></PrivateRoute>} />
        <Route path="/nueva-cita" element={<PrivateRoute><NuevaCita /></PrivateRoute>} />
        <Route path="/pacientes/:id/editar" element={<PrivateRoute><EditarPaciente /></PrivateRoute>} />
      </Routes>
    </AuthProvider>
  );
}

export default App;