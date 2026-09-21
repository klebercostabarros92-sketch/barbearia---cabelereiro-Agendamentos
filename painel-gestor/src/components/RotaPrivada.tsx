import { Navigate } from "react-router-dom";

export function RotaPrivada({ children }: { children: React.ReactNode }) {
  const autenticado = Boolean(localStorage.getItem("gestor_token"));
  if (!autenticado) return <Navigate to="/login" replace />;
  return <>{children}</>;
}
