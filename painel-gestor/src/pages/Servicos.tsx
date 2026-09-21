import { FormEvent, useEffect, useState } from "react";
import { api, Servico } from "../services/api";
import { obterEstabelecimentoId } from "../services/estabelecimento";

export function Servicos() {
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [nome, setNome] = useState("");
  const [duracaoMinutos, setDuracaoMinutos] = useState(30);
  const [preco, setPreco] = useState(0);

  async function carregar() {
    const estabelecimentoId = await obterEstabelecimentoId();
    const { data } = await api.get<Servico[]>("/servicos", { params: { estabelecimentoId } });
    setServicos(data);
  }

  useEffect(() => {
    carregar();
  }, []);

  async function handleCriar(e: FormEvent) {
    e.preventDefault();
    await api.post("/servicos", { nome, duracaoMinutos, preco });
    setNome("");
    setDuracaoMinutos(30);
    setPreco(0);
    carregar();
  }

  async function handleRemover(id: string) {
    await api.delete(`/servicos/${id}`);
    carregar();
  }

  return (
    <div>
      <h1>Serviços</h1>

      <form onSubmit={handleCriar} className="form-inline">
        <input placeholder="Nome do serviço" value={nome} onChange={(e) => setNome(e.target.value)} required />
        <input
          type="number"
          placeholder="Duração (min)"
          value={duracaoMinutos}
          onChange={(e) => setDuracaoMinutos(Number(e.target.value))}
          min={5}
          required
        />
        <input
          type="number"
          placeholder="Preço (R$)"
          value={preco}
          onChange={(e) => setPreco(Number(e.target.value))}
          min={0}
          step="0.01"
          required
        />
        <button type="submit">Adicionar</button>
      </form>

      <table>
        <thead>
          <tr>
            <th>Nome</th>
            <th>Duração</th>
            <th>Preço</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {servicos.map((s) => (
            <tr key={s.id}>
              <td>{s.nome}</td>
              <td>{s.duracaoMinutos} min</td>
              <td>R$ {Number(s.preco).toFixed(2)}</td>
              <td>
                <button onClick={() => handleRemover(s.id)}>Remover</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
