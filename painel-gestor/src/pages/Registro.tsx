import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../services/api";

export function Registro() {
  const navigate = useNavigate();
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [estabelecimentoNome, setEstabelecimentoNome] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErro(null);
    setCarregando(true);
    try {
      const { data } = await api.post("/auth/gestor/registrar", { nome, email, senha, estabelecimentoNome });
      localStorage.setItem("gestor_token", data.token);
      navigate("/agenda");
    } catch (err: any) {
      setErro(err.response?.data?.error ?? "Não foi possível concluir o cadastro");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="tela-centralizada">
      <form onSubmit={handleSubmit} className="card">
        <h1>Cadastrar estabelecimento</h1>
        <label>
          Nome do estabelecimento
          <input value={estabelecimentoNome} onChange={(e) => setEstabelecimentoNome(e.target.value)} required />
        </label>
        <label>
          Seu nome
          <input value={nome} onChange={(e) => setNome(e.target.value)} required />
        </label>
        <label>
          E-mail
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>
        <label>
          Senha
          <input type="password" value={senha} onChange={(e) => setSenha(e.target.value)} minLength={6} required />
        </label>
        {erro && <p className="erro">{erro}</p>}
        <button type="submit" disabled={carregando}>
          {carregando ? "Cadastrando..." : "Cadastrar"}
        </button>
        <Link to="/login">Já tenho uma conta</Link>
      </form>
    </div>
  );
}
