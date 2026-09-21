import { FormEvent, useEffect, useState } from "react";
import { api } from "../services/api";

export function Configuracoes() {
  const [nome, setNome] = useState("");
  const [endereco, setEndereco] = useState("");
  const [horaAbertura, setHoraAbertura] = useState("09:00");
  const [horaFechamento, setHoraFechamento] = useState("19:00");
  const [antecedenciaLembreteMin, setAntecedenciaLembreteMin] = useState(120);
  const [salvo, setSalvo] = useState(false);

  useEffect(() => {
    api.get("/estabelecimentos/me").then(({ data }) => {
      setNome(data.nome);
      setEndereco(data.endereco ?? "");
      setHoraAbertura(data.horaAbertura);
      setHoraFechamento(data.horaFechamento);
      setAntecedenciaLembreteMin(data.antecedenciaLembreteMin);
    });
  }, []);

  async function handleSalvar(e: FormEvent) {
    e.preventDefault();
    await api.put("/estabelecimentos/me", { nome, endereco, horaAbertura, horaFechamento, antecedenciaLembreteMin });
    setSalvo(true);
    setTimeout(() => setSalvo(false), 2000);
  }

  return (
    <div>
      <h1>Configurações</h1>
      <form onSubmit={handleSalvar} className="form-coluna">
        <label>
          Nome do estabelecimento
          <input value={nome} onChange={(e) => setNome(e.target.value)} required />
        </label>
        <label>
          Endereço
          <input value={endereco} onChange={(e) => setEndereco(e.target.value)} />
        </label>
        <label>
          Abertura
          <input type="time" value={horaAbertura} onChange={(e) => setHoraAbertura(e.target.value)} />
        </label>
        <label>
          Fechamento
          <input type="time" value={horaFechamento} onChange={(e) => setHoraFechamento(e.target.value)} />
        </label>
        <label>
          Antecedência do lembrete (minutos)
          <input
            type="number"
            min={0}
            value={antecedenciaLembreteMin}
            onChange={(e) => setAntecedenciaLembreteMin(Number(e.target.value))}
          />
        </label>
        <button type="submit">Salvar</button>
        {salvo && <p>Salvo com sucesso!</p>}
      </form>
    </div>
  );
}
