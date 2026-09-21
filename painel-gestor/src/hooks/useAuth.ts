import { useCallback, useState } from "react";
import { api } from "../services/api";

interface Gestor {
  id: string;
  nome: string;
  email: string;
}

export function useAuth() {
  const [gestor, setGestor] = useState<Gestor | null>(null);
  const [carregando, setCarregando] = useState(false);

  const login = useCallback(async (email: string, senha: string) => {
    setCarregando(true);
    try {
      const { data } = await api.post("/auth/gestor/login", { email, senha });
      localStorage.setItem("gestor_token", data.token);
      setGestor(data.gestor);
      return data.gestor as Gestor;
    } finally {
      setCarregando(false);
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("gestor_token");
    setGestor(null);
  }, []);

  const autenticado = Boolean(localStorage.getItem("gestor_token"));

  return { gestor, login, logout, carregando, autenticado };
}
