import { prisma } from "../../config/prisma";
import { AppError } from "../../middlewares/errorHandler";
import { verificarConflito } from "./agenda.service";

export async function criarAgendamento(params: {
  clienteId: string;
  profissionalId: string;
  servicoId: string;
  dataHora: Date;
}) {
  const { clienteId, profissionalId, servicoId, dataHora } = params;

  if (dataHora.getTime() < Date.now()) {
    throw new AppError("Não é possível agendar em uma data/hora passada", 400);
  }

  const servico = await prisma.servico.findUnique({ where: { id: servicoId } });
  if (!servico || !servico.ativo) throw new AppError("Serviço não encontrado", 404);

  const profissional = await prisma.profissional.findUnique({ where: { id: profissionalId } });
  if (!profissional || !profissional.ativo) throw new AppError("Profissional não encontrado", 404);

  const conflita = await verificarConflito(profissionalId, dataHora, servico.duracaoMinutos);
  if (conflita) throw new AppError("Horário indisponível para este profissional", 409);

  return prisma.agendamento.create({
    data: { clienteId, profissionalId, servicoId, dataHora },
    include: { servico: true, profissional: true, cliente: true },
  });
}

export async function cancelarAgendamento(id: string) {
  const agendamento = await prisma.agendamento.findUnique({ where: { id } });
  if (!agendamento) throw new AppError("Agendamento não encontrado", 404);
  if (agendamento.status !== "CONFIRMADO") throw new AppError("Agendamento já não está confirmado", 400);

  return prisma.agendamento.update({ where: { id }, data: { status: "CANCELADO" } });
}

export async function listarAgendamentosDoCliente(clienteId: string) {
  return prisma.agendamento.findMany({
    where: { clienteId },
    include: { servico: true, profissional: true },
    orderBy: { dataHora: "desc" },
  });
}

export async function listarAgendamentosDoEstabelecimento(params: {
  estabelecimentoId: string;
  de?: Date;
  ate?: Date;
  profissionalId?: string;
}) {
  return prisma.agendamento.findMany({
    where: {
      profissional: { estabelecimentoId: params.estabelecimentoId },
      profissionalId: params.profissionalId,
      dataHora: {
        gte: params.de,
        lte: params.ate,
      },
    },
    include: { servico: true, profissional: true, cliente: true },
    orderBy: { dataHora: "asc" },
  });
}

export async function garantirAgendamentoDoEstabelecimento(id: string, estabelecimentoId: string) {
  const agendamento = await prisma.agendamento.findUnique({
    where: { id },
    include: { profissional: true },
  });
  if (!agendamento || agendamento.profissional.estabelecimentoId !== estabelecimentoId) {
    throw new AppError("Agendamento não encontrado", 404);
  }
  return agendamento;
}

export async function garantirAgendamentoDoCliente(id: string, clienteId: string) {
  const agendamento = await prisma.agendamento.findUnique({ where: { id } });
  if (!agendamento || agendamento.clienteId !== clienteId) {
    throw new AppError("Agendamento não encontrado", 404);
  }
  return agendamento;
}

const SENHA_HASH_PLACEHOLDER = "!"; // cliente avulso cadastrado pelo gestor não tem login por senha

export async function buscarOuCriarClienteAvulso(input: { nome: string; telefone?: string; email: string }) {
  const existente = await prisma.cliente.findUnique({ where: { email: input.email } });
  if (existente) return existente;

  return prisma.cliente.create({
    data: { nome: input.nome, telefone: input.telefone, email: input.email, senhaHash: SENHA_HASH_PLACEHOLDER },
  });
}

/**
 * Usado pelo atendente virtual: o canal (WhatsApp etc.) só fornece o telefone,
 * então o e-mail é um placeholder derivado dele só para satisfazer o campo único do Cliente.
 */
export async function buscarOuCriarClientePorTelefone(input: { nome: string; telefone: string }) {
  const emailPlaceholder = `tel-${input.telefone.replace(/\D/g, "")}@sem-email.local`;

  const existentePorTelefone = await prisma.cliente.findFirst({ where: { telefone: input.telefone } });
  if (existentePorTelefone) return existentePorTelefone;

  return buscarOuCriarClienteAvulso({ nome: input.nome, telefone: input.telefone, email: emailPlaceholder });
}
