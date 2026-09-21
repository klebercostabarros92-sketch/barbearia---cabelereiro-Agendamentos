import { prisma } from "../../config/prisma";
import { AppError } from "../../middlewares/errorHandler";

export interface SlotLivre {
  inicio: string; // ISO 8601
  fim: string; // ISO 8601
}

function parseHora(hora: string): { h: number; m: number } {
  const [h, m] = hora.split(":").map(Number);
  return { h, m };
}

function combinarDataHora(data: Date, hora: { h: number; m: number }): Date {
  const combinado = new Date(data);
  combinado.setHours(hora.h, hora.m, 0, 0);
  return combinado;
}

/**
 * Calcula os slots livres de um profissional para um serviço em uma data específica,
 * cruzando o(s) horário(s) de trabalho do dia da semana com os agendamentos já confirmados.
 */
export async function calcularHorariosLivres(params: {
  profissionalId: string;
  servicoId: string;
  data: string; // "YYYY-MM-DD"
}): Promise<SlotLivre[]> {
  const { profissionalId, servicoId, data } = params;

  const [profissional, servico] = await Promise.all([
    prisma.profissional.findUnique({ where: { id: profissionalId } }),
    prisma.servico.findUnique({ where: { id: servicoId } }),
  ]);

  if (!profissional || !profissional.ativo) throw new AppError("Profissional não encontrado", 404);
  if (!servico || !servico.ativo) throw new AppError("Serviço não encontrado", 404);

  const dataBase = new Date(`${data}T00:00:00`);
  if (Number.isNaN(dataBase.getTime())) throw new AppError("Data inválida", 400);

  const diaSemana = dataBase.getDay();
  const horarios = await prisma.horarioDisponivel.findMany({
    where: { profissionalId, diaSemana },
  });
  if (horarios.length === 0) return [];

  const inicioDoDia = new Date(dataBase);
  const fimDoDia = new Date(dataBase);
  fimDoDia.setHours(23, 59, 59, 999);

  const agendamentosExistentes = await prisma.agendamento.findMany({
    where: {
      profissionalId,
      status: "CONFIRMADO",
      dataHora: { gte: inicioDoDia, lte: fimDoDia },
    },
    include: { servico: true },
  });

  const duracaoMs = servico.duracaoMinutos * 60_000;
  const agora = new Date();
  const slots: SlotLivre[] = [];

  for (const janela of horarios) {
    const inicioJanela = combinarDataHora(dataBase, parseHora(janela.horaInicio));
    const fimJanela = combinarDataHora(dataBase, parseHora(janela.horaFim));

    for (
      let inicioSlot = new Date(inicioJanela);
      inicioSlot.getTime() + duracaoMs <= fimJanela.getTime();
      inicioSlot = new Date(inicioSlot.getTime() + duracaoMs)
    ) {
      const fimSlot = new Date(inicioSlot.getTime() + duracaoMs);

      if (inicioSlot < agora) continue;

      const conflita = agendamentosExistentes.some((ag) => {
        const inicioAg = ag.dataHora;
        const fimAg = new Date(ag.dataHora.getTime() + ag.servico.duracaoMinutos * 60_000);
        return inicioSlot < fimAg && fimSlot > inicioAg;
      });

      if (!conflita) {
        slots.push({ inicio: inicioSlot.toISOString(), fim: fimSlot.toISOString() });
      }
    }
  }

  return slots;
}

export async function verificarConflito(profissionalId: string, inicio: Date, duracaoMinutos: number) {
  const fim = new Date(inicio.getTime() + duracaoMinutos * 60_000);
  const inicioDoDia = new Date(inicio);
  inicioDoDia.setHours(0, 0, 0, 0);
  const fimDoDia = new Date(inicio);
  fimDoDia.setHours(23, 59, 59, 999);

  const agendamentos = await prisma.agendamento.findMany({
    where: {
      profissionalId,
      status: "CONFIRMADO",
      dataHora: { gte: inicioDoDia, lte: fimDoDia },
    },
    include: { servico: true },
  });

  return agendamentos.some((ag) => {
    const inicioAg = ag.dataHora;
    const fimAg = new Date(ag.dataHora.getTime() + ag.servico.duracaoMinutos * 60_000);
    return inicio < fimAg && fim > inicioAg;
  });
}
