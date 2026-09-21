import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export function Login() {
  const { login, carregando } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErro(null);
    try {
      await login(email, senha);
      navigate("/agenda");
    } catch {
      setErro("E-mail ou senha inválidos");
    }
  }

  return (
    <div className="tela-centralizada">
      <form onSubmit={handleSubmit} className="card">
        <h1>Agendador — Painel do Gestor</h1>
        <label>
          E-mail
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>
        <label>
          Senha
          <input type="password" value={senha} onChange={(e) => setSenha(e.target.value)} required />
        </label>
        {erro && <p className="erro">{erro}</p>}
        <button type="submit" disabled={carregando}>
          {carregando ? "Entrando..." : "Entrar"}
        </button>
        <Link to="/registro">Cadastrar novo estabelecimento</Link>
      </form>
    </div>
  );
}
