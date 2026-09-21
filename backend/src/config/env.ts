import "dotenv/config";

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Variável de ambiente obrigatória ausente: ${name}`);
  }
  return value;
}

export const env = {
  port: Number(process.env.PORT ?? 3333),
  databaseUrl: required("DATABASE_URL"),
  jwtSecretGestor: required("JWT_SECRET_GESTOR"),
  jwtSecretCliente: required("JWT_SECRET_CLIENTE"),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? "7d",
  lembreteAntecedenciaMinutos: Number(process.env.LEMBRETE_ANTECEDENCIA_MINUTOS ?? 120),
  // Atendente virtual (opcional): sem a chave, o módulo fica desativado e o resto da API funciona normalmente.
  anthropicApiKey: process.env.ANTHROPIC_API_KEY ?? "",
  atendenteModel: process.env.ATENDENTE_MODEL ?? "claude-sonnet-5",
};
