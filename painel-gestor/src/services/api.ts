import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:3333",
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("gestor_token");
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("gestor_token");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  },
);

export interface Servico {
  id: string;
  nome: string;
  duracaoMinutos: number;
  preco: string;
  ativo: boolean;
}

export interface Profissional {
  id: string;
  nome: string;
  foto?: string | null;
  ativo: boolean;
  servicos: { servicoId: string }[];
  horariosDisponiveis: { id: string; diaSemana: number; horaInicio: string; horaFim: string }[];
}

export interface Agendamento {
  id: string;
  dataHora: string;
  status: "CONFIRMADO" | "CANCELADO" | "CONCLUIDO";
  servico: Servico;
  profissional: Profissional;
  cliente: { id: string; nome: string; email: string; telefone?: string | null };
}
