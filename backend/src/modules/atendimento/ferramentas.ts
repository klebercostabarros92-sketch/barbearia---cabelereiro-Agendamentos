import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "../../config/prisma";
import { calcularHorariosLivres } from "../agendamento/agenda.service";
import * as agendamentoService from "../agendamento/agendamento.service";
import * as conversaService from "./conversa.service";

export const FERRAMENTAS: Anthropic.Tool[] = [
  {
    name: "listar_servicos",
    description: "Lista os serviços ativos oferecidos pelo estabelecimento, com duração e preço.",
    input_schema: { type: "object", properties: {} },
  },
  {
    name: "listar_profissionais",
    description: "Lista os profissionais ativos. Se servicoId for informado, filtra só quem presta aquele serviço.",
    input_schema: {
      type: "object",
      properties: { servicoId: { type: "string", description: "UUID do serviço (opcional)" } },
    },
  },
  {
    name: "listar_horarios_livres",
    description: "Lista os horários livres de um profissional para um serviço em uma data específica.",
    input_schema: {
      type: "object",
      properties: {
        profissionalId: { type: "string" },
        servicoId: { type: "string" },
        data: { type: "string", description: "Data no formato YYYY-MM-DD" },
      },
      required: ["profissionalId", "servicoId", "data"],
    },
  },
  {
    name: "identificar_cliente",
    description:
      "Registra o nome do cliente para esta conversa, criando ou reaproveitando o cadastro dele pelo telefone. " +
      "Chame antes de criar um agendamento, caso ainda não saiba o nome do cliente.",
    input_schema: {
      type: "object",
      properties: { nome: { type: "string" } },
      required: ["nome"],
    },
  },
  {
    name: "criar_agendamento",
    description: "Cria um agendamento confirmado para o cliente desta conversa. Requer identificar_cliente antes.",
    input_schema: {
      type: "object",
      properties: {
        profissionalId: { type: "string" },
        servicoId: { type: "string" },
        dataHora: { type: "string", description: "Data e hora ISO 8601, ex: 2026-09-22T14:00:00-03:00" },
      },
      required: ["profissionalId", "servicoId", "dataHora"],
    },
  },
  {
    name: "listar_meus_agendamentos",
    description: "Lista os agendamentos futuros do cliente desta conversa.",
    input_schema: { type: "object", properties: {} },
  },
  {
    name: "cancelar_agendamento",
    description: "Cancela um agendamento do cliente desta conversa, pelo id.",
    input_schema: {
      type: "object",
      properties: { agendamentoId: { type: "string" } },
      required: ["agendamentoId"],
    },
  },
];

interface ContextoExecucao {
  conversaId: string;
  estabelecimentoId: string;
  clienteId: string | null;
  identificadorExterno: string;
}

export async function executarFerramenta(
  nome: string,
  input: Record<string, unknown>,
  contexto: ContextoExecucao,
): Promise<{ resultado: unknown; novoClienteId?: string }> {
  switch (nome) {
    case "listar_servicos": {
      const servicos = await prisma.servico.findMany({
        where: { estabelecimentoId: contexto.estabelecimentoId, ativo: true },
        select: { id: true, nome: true, duracaoMinutos: true, preco: true },
      });
      return { resultado: servicos };
    }

    case "listar_profissionais": {
      const servicoId = input.servicoId as string | undefined;
      const profissionais = await prisma.profissional.findMany({
        where: {
          estabelecimentoId: contexto.estabelecimentoId,
          ativo: true,
          ...(servicoId ? { servicos: { some: { servicoId } } } : {}),
        },
        select: { id: true, nome: true },
      });
      return { resultado: profissionais };
    }

    case "listar_horarios_livres": {
      const slots = await calcularHorariosLivres({
        profissionalId: input.profissionalId as string,
        servicoId: input.servicoId as string,
        data: input.data as string,
      });
      return { resultado: slots };
    }

    case "identificar_cliente": {
      const cliente = await agendamentoService.buscarOuCriarClientePorTelefone({
        nome: input.nome as string,
        telefone: contexto.identificadorExterno,
      });
      await conversaService.vincularCliente(contexto.conversaId, cliente.id);
      return { resultado: { clienteId: cliente.id, nome: cliente.nome }, novoClienteId: cliente.id };
    }

    case "criar_agendamento": {
      if (!contexto.clienteId) {
        return { resultado: { erro: "Cliente ainda não identificado. Chame identificar_cliente primeiro." } };
      }
      try {
        const agendamento = await agendamentoService.criarAgendamento({
          clienteId: contexto.clienteId,
          profissionalId: input.profissionalId as string,
          servicoId: input.servicoId as string,
          dataHora: new Date(input.dataHora as string),
        });
        return { resultado: { id: agendamento.id, dataHora: agendamento.dataHora, status: agendamento.status } };
      } catch (err: any) {
        return { resultado: { erro: err.message ?? "Não foi possível criar o agendamento" } };
      }
    }

    case "listar_meus_agendamentos": {
      if (!contexto.clienteId) return { resultado: [] };
      const agendamentos = await agendamentoService.listarAgendamentosDoCliente(contexto.clienteId);
      return {
        resultado: agendamentos
          .filter((a) => a.status === "CONFIRMADO")
          .map((a) => ({ id: a.id, dataHora: a.dataHora, servico: a.servico.nome, profissional: a.profissional.nome })),
      };
    }

    case "cancelar_agendamento": {
      if (!contexto.clienteId) return { resultado: { erro: "Cliente ainda não identificado." } };
      try {
        await agendamentoService.garantirAgendamentoDoCliente(input.agendamentoId as string, contexto.clienteId);
        const agendamento = await agendamentoService.cancelarAgendamento(input.agendamentoId as string);
        return { resultado: { id: agendamento.id, status: agendamento.status } };
      } catch (err: any) {
        return { resultado: { erro: err.message ?? "Não foi possível cancelar o agendamento" } };
      }
    }

    default:
      return { resultado: { erro: `Ferramenta desconhecida: ${nome}` } };
  }
}
