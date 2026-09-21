import { useEffect, useState } from "react";
import { Agendamento, api } from "../services/api";

function inicioDoDia() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}
function fimDoDia() {
  const d = new Date();
  d.setHours(23, 59, 59, 999);
  return d.toISOString();
}

export function Dashboard() {
  const [agendamentosHoje, setAgendamentosHoje] = useState<Agendamento[]>([]);

  useEffect(() => {
    api
      .get<Agendamento[]>("/agendamentos", { params: { de: inicioDoDia(), ate: fimDoDia() } })
      .then(({ data }) => setAgendamentosHoje(data));
  }, []);

  const confirmados = agendamentosHoje.filter((a) => a.status === "CONFIRMADO");
  const cancelados = agendamentosHoje.filter((a) => a.status === "CANCELADO");

  return (
    <div>
      <h1>Dashboard</h1>
      <div className="cards-resumo">
        <div className="card">
          <strong>{confirmados.length}</strong>
          <span>Agendamentos hoje</span>
        </div>
        <div className="card">
          <strong>{cancelados.length}</strong>
          <span>Cancelados hoje</span>
        </div>
      </div>

      <h2>Próximos horários de hoje</h2>
      <ul>
        {confirmados
          .sort((a, b) => a.dataHora.localeCompare(b.dataHora))
          .map((a) => (
            <li key={a.id}>
              {new Date(a.dataHora).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })} —{" "}
              {a.cliente.nome} com {a.profissional.nome} ({a.servico.nome})
            </li>
          ))}
      </ul>
    </div>
  );
}
