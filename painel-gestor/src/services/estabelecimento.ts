import { api } from "./api";

let cacheId: string | null = null;

export async function obterEstabelecimentoId(): Promise<string> {
  if (cacheId) return cacheId;
  const { data } = await api.get("/estabelecimentos/me");
  cacheId = data.id;
  return data.id;
}
