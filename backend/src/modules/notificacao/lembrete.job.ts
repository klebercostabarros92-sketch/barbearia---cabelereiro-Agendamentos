import cron from "node-cron";
import { prisma } from "../../config/prisma";
import { env } from "../../config/env";
import { enviarPush } from "./push.service";

/**
 * A cada minuto, procura agendamentos confirmados que entram na janela de antecedência
 * do lembrete e ainda não tiveram lembrete enviado, e dispara a notificação.
 */
export function iniciarJobDeLembretes() {
  cron.schedule("* * * * *", async () => {
    try {
      await processarLembretesPendentes();
    } catch (err) {
      console.error("Erro ao processar lembretes:", err);
    }
  });
}

export async function processarLembretesPendentes() {
  const agora = new Date();
  const limite = new Date(agora.getTime() + env.lembreteAntecedenciaMinutos * 60_000);

  const agendamentos = await prisma.agendamento.findMany({
    where: {
      status: "CONFIRMADO",
      dataHora: { gte: agora, lte: limite },
      lembrete: null,
    },
    include: { cliente: true, servico: true, profissional: true },
  });

  for (const agendamento of agendamentos) {
    await enviarPush({
      clienteId: agendamento.clienteId,
      titulo: "Lembrete de agendamento",
      corpo: `Seu horário de ${agendamento.servico.nome} com ${agendamento.profissional.nome} é em breve.`,
    });

    await prisma.lembrete.create({
      data: { agendamentoId: agendamento.id, enviadoEm: new Date() },
    });
  }
}
