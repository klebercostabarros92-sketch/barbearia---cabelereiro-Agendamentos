import { Navigate, Route, Routes } from "react-router-dom";
import { Login } from "./pages/Login";
import { Registro } from "./pages/Registro";
import { Dashboard } from "./pages/Dashboard";
import { Agenda } from "./pages/Agenda";
import { Servicos } from "./pages/Servicos";
import { Profissionais } from "./pages/Profissionais";
import { Clientes } from "./pages/Clientes";
import { Configuracoes } from "./pages/Configuracoes";
import { Layout } from "./components/Layout";
import { RotaPrivada } from "./components/RotaPrivada";

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/registro" element={<Registro />} />
      <Route
        element={
          <RotaPrivada>
            <Layout />
          </RotaPrivada>
        }
      >
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/agenda" element={<Agenda />} />
        <Route path="/servicos" element={<Servicos />} />
        <Route path="/profissionais" element={<Profissionais />} />
        <Route path="/clientes" element={<Clientes />} />
        <Route path="/configuracoes" element={<Configuracoes />} />
      </Route>
      <Route path="*" element={<Navigate to="/agenda" replace />} />
    </Routes>
  );
}
