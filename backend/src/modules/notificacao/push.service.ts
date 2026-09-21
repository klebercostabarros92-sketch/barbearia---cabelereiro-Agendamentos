/**
 * Integração com Firebase Cloud Messaging.
 * Placeholder até a Fase 7 do plano: aqui entra o SDK firebase-admin,
 * usando o token de push do dispositivo (a ser armazenado no model Cliente
 * quando o App Android registrar o device na Fase 6).
 */
export async function enviarPush(params: { clienteId: string; titulo: string; corpo: string }) {
  console.log(`[push] cliente=${params.clienteId} título="${params.titulo}" corpo="${params.corpo}"`);
}
