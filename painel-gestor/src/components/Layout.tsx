import { NavLink, Outlet, useNavigate } from "react-router-dom";

export function Layout() {
  const navigate = useNavigate();

  function handleLogout() {
    localStorage.removeItem("gestor_token");
    navigate("/login");
  }

  return (
    <div className="layout">
      <nav className="sidebar">
        <h2>Agendador</h2>
        <NavLink to="/dashboard">Dashboard</NavLink>
        <NavLink to="/agenda">Agenda</NavLink>
        <NavLink to="/servicos">Serviços</NavLink>
        <NavLink to="/profissionais">Profissionais</NavLink>
        <NavLink to="/clientes">Clientes</NavLink>
        <NavLink to="/configuracoes">Configurações</NavLink>
        <button onClick={handleLogout}>Sair</button>
      </nav>
      <main className="conteudo">
        <Outlet />
      </main>
    </div>
  );
}
