import { useEffect, useState } from "react";
import { Agendamento, api } from "../services/api";

interface ClienteComHistorico {
  id: string;
  nome: string;
  email: string;
  telefone?: string | null;
  agendamentos: Agendamento[];
}

export function Clientes() {
  const [clientes, setClientes] = useState<ClienteComHistorico[]>([]);

  useEffect(() => {
    api.get<ClienteComHistorico[]>("/clientes").then(({ data }) => setClientes(data));
  }, []);

  return (
    <div>
      <h1>Clientes</h1>
      {clientes.map((c) => (
        <details key={c.id} className="card">
          <summary>
            {c.nome} — {c.agendamentos.length} agendamento(s)
          </summary>
          <p>
            {c.email} {c.telefone && `· ${c.telefone}`}
          </p>
          <ul>
            {c.agendamentos.map((a) => (
              <li key={a.id}>
                {new Date(a.dataHora).toLocaleString("pt-BR")} — {a.servico.nome} com {a.profissional.nome} (
                {a.status})
              </li>
            ))}
          </ul>
        </details>
      ))}
    </div>
  );
}
