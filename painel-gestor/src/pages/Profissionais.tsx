import { FormEvent, useEffect, useState } from "react";
import { api, Profissional, Servico } from "../services/api";
import { obterEstabelecimentoId } from "../services/estabelecimento";

const DIAS_SEMANA = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

export function Profissionais() {
  const [profissionais, setProfissionais] = useState<Profissional[]>([]);
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [nome, setNome] = useState("");
  const [servicoIds, setServicoIds] = useState<string[]>([]);
  const [horarios, setHorarios] = useState(
    DIAS_SEMANA.map((_, diaSemana) => ({ diaSemana, ativo: false, horaInicio: "09:00", horaFim: "18:00" })),
  );

  async function carregar() {
    const estabelecimentoId = await obterEstabelecimentoId();
    const [resProfissionais, resServicos] = await Promise.all([
      api.get<Profissional[]>("/profissionais", { params: { estabelecimentoId } }),
      api.get<Servico[]>("/servicos", { params: { estabelecimentoId } }),
    ]);
    setProfissionais(resProfissionais.data);
    setServicos(resServicos.data);
  }

  useEffect(() => {
    carregar();
  }, []);

  function toggleServico(id: string) {
    setServicoIds((prev) => (prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]));
  }

  function toggleDia(diaSemana: number) {
    setHorarios((prev) => prev.map((h) => (h.diaSemana === diaSemana ? { ...h, ativo: !h.ativo } : h)));
  }

  function atualizarHorario(diaSemana: number, campo: "horaInicio" | "horaFim", valor: string) {
    setHorarios((prev) => prev.map((h) => (h.diaSemana === diaSemana ? { ...h, [campo]: valor } : h)));
  }

  async function handleCriar(e: FormEvent) {
    e.preventDefault();
    await api.post("/profissionais", {
      nome,
      servicoIds,
      horarios: horarios
        .filter((h) => h.ativo)
        .map(({ diaSemana, horaInicio, horaFim }) => ({ diaSemana, horaInicio, horaFim })),
    });
    setNome("");
    setServicoIds([]);
    setHorarios(DIAS_SEMANA.map((_, diaSemana) => ({ diaSemana, ativo: false, horaInicio: "09:00", horaFim: "18:00" })));
    carregar();
  }

  async function handleRemover(id: string) {
    await api.delete(`/profissionais/${id}`);
    carregar();
  }

  return (
    <div>
      <h1>Profissionais</h1>

      <form onSubmit={handleCriar} className="form-coluna">
        <input placeholder="Nome do profissional" value={nome} onChange={(e) => setNome(e.target.value)} required />

        <fieldset>
          <legend>Serviços prestados</legend>
          {servicos.map((s) => (
            <label key={s.id} className="checkbox-linha">
              <input type="checkbox" checked={servicoIds.includes(s.id)} onChange={() => toggleServico(s.id)} />
              {s.nome}
            </label>
          ))}
        </fieldset>

        <fieldset>
          <legend>Horários de trabalho</legend>
          {horarios.map((h) => (
            <div key={h.diaSemana} className="linha-horario">
              <label className="checkbox-linha">
                <input type="checkbox" checked={h.ativo} onChange={() => toggleDia(h.diaSemana)} />
                {DIAS_SEMANA[h.diaSemana]}
              </label>
              {h.ativo && (
                <>
                  <input
                    type="time"
                    value={h.horaInicio}
                    onChange={(e) => atualizarHorario(h.diaSemana, "horaInicio", e.target.value)}
                  />
                  <span>até</span>
                  <input
                    type="time"
                    value={h.horaFim}
                    onChange={(e) => atualizarHorario(h.diaSemana, "horaFim", e.target.value)}
                  />
                </>
              )}
            </div>
          ))}
        </fieldset>

        <button type="submit">Adicionar profissional</button>
      </form>

      <table>
        <thead>
          <tr>
            <th>Nome</th>
            <th>Serviços</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {profissionais.map((p) => (
            <tr key={p.id}>
              <td>{p.nome}</td>
              <td>{p.servicos.length} serviço(s)</td>
              <td>
                <button onClick={() => handleRemover(p.id)}>Remover</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
