import { FormEvent, useEffect, useState } from "react";
import { Agendamento, api, Profissional, Servico } from "../services/api";
import { obterEstabelecimentoId } from "../services/estabelecimento";

function inicioDoDia(data: string) {
  return new Date(`${data}T00:00:00`).toISOString();
}
function fimDoDia(data: string) {
  return new Date(`${data}T23:59:59`).toISOString();
}

export function Agenda() {
  const hoje = new Date().toISOString().slice(0, 10);
  const [data, setData] = useState(hoje);
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [profissionais, setProfissionais] = useState<Profissional[]>([]);
  const [servicos, setServicos] = useState<Servico[]>([]);

  const [novoProfissionalId, setNovoProfissionalId] = useState("");
  const [novoServicoId, setNovoServicoId] = useState("");
  const [novaHora, setNovaHora] = useState("09:00");
  const [clienteNome, setClienteNome] = useState("");
  const [clienteEmail, setClienteEmail] = useState("");
  const [clienteTelefone, setClienteTelefone] = useState("");
  const [erro, setErro] = useState<string | null>(null);

  async function carregarAgenda() {
    const { data: lista } = await api.get<Agendamento[]>("/agendamentos", {
      params: { de: inicioDoDia(data), ate: fimDoDia(data) },
    });
    setAgendamentos(lista);
  }

  async function carregarCadastros() {
    const estabelecimentoId = await obterEstabelecimentoId();
    const [resProfissionais, resServicos] = await Promise.all([
      api.get<Profissional[]>("/profissionais", { params: { estabelecimentoId } }),
      api.get<Servico[]>("/servicos", { params: { estabelecimentoId } }),
    ]);
    setProfissionais(resProfissionais.data);
    setServicos(resServicos.data);
  }

  useEffect(() => {
    carregarCadastros();
  }, []);

  useEffect(() => {
    carregarAgenda();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  async function handleCriar(e: FormEvent) {
    e.preventDefault();
    setErro(null);
    try {
      await api.post("/agendamentos/manual", {
        profissionalId: novoProfissionalId,
        servicoId: novoServicoId,
        dataHora: new Date(`${data}T${novaHora}:00`).toISOString(),
        cliente: { nome: clienteNome, email: clienteEmail, telefone: clienteTelefone || undefined },
      });
      setClienteNome("");
      setClienteEmail("");
      setClienteTelefone("");
      carregarAgenda();
    } catch (err: any) {
      setErro(err.response?.data?.error ?? "Não foi possível criar o agendamento");
    }
  }

  async function handleCancelar(id: string) {
    await api.delete(`/agendamentos/${id}/gestor`);
    carregarAgenda();
  }

  return (
    <div>
      <h1>Agenda</h1>

      <input type="date" value={data} onChange={(e) => setData(e.target.value)} />

      <table>
        <thead>
          <tr>
            <th>Horário</th>
            <th>Profissional</th>
            <th>Serviço</th>
            <th>Cliente</th>
            <th>Status</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {agendamentos.map((a) => (
            <tr key={a.id}>
              <td>{new Date(a.dataHora).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</td>
              <td>{a.profissional.nome}</td>
              <td>{a.servico.nome}</td>
              <td>{a.cliente.nome}</td>
              <td>{a.status}</td>
              <td>
                {a.status === "CONFIRMADO" && <button onClick={() => handleCancelar(a.id)}>Cancelar</button>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2>Novo agendamento manual</h2>
      <form onSubmit={handleCriar} className="form-coluna">
        <select value={novoProfissionalId} onChange={(e) => setNovoProfissionalId(e.target.value)} required>
          <option value="">Profissional...</option>
          {profissionais.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nome}
            </option>
          ))}
        </select>
        <select value={novoServicoId} onChange={(e) => setNovoServicoId(e.target.value)} required>
          <option value="">Serviço...</option>
          {servicos.map((s) => (
            <option key={s.id} value={s.id}>
              {s.nome}
            </option>
          ))}
        </select>
        <input type="time" value={novaHora} onChange={(e) => setNovaHora(e.target.value)} required />
        <input placeholder="Nome do cliente" value={clienteNome} onChange={(e) => setClienteNome(e.target.value)} required />
        <input
          type="email"
          placeholder="E-mail do cliente"
          value={clienteEmail}
          onChange={(e) => setClienteEmail(e.target.value)}
          required
        />
        <input
          placeholder="Telefone (opcional)"
          value={clienteTelefone}
          onChange={(e) => setClienteTelefone(e.target.value)}
        />
        {erro && <p className="erro">{erro}</p>}
        <button type="submit">Criar agendamento</button>
      </form>
    </div>
  );
}
