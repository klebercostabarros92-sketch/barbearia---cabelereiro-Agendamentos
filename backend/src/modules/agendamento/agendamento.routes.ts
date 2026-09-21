import { Router } from "express";
import { z } from "zod";
import { asyncHandler } from "../../middlewares/asyncHandler";
import { authGestor, authCliente } from "../../middlewares/auth";
import { AppError } from "../../middlewares/errorHandler";
import { calcularHorariosLivres } from "./agenda.service";
import * as agendamentoService from "./agendamento.service";

export const agendamentoRouter = Router();

const horariosLivresQuerySchema = z.object({
  profissionalId: z.string().uuid(),
  servicoId: z.string().uuid(),
  data: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

// Consulta pública de horários livres — usada pelo App do cliente
agendamentoRouter.get(
  "/horarios-livres",
  asyncHandler(async (req, res) => {
    const query = horariosLivresQuerySchema.parse(req.query);
    const slots = await calcularHorariosLivres(query);
    res.json(slots);
  }),
);

const criarAgendamentoClienteSchema = z.object({
  profissionalId: z.string().uuid(),
  servicoId: z.string().uuid(),
  dataHora: z.string().datetime(),
});

agendamentoRouter.post(
  "/",
  authCliente,
  asyncHandler(async (req, res) => {
    const input = criarAgendamentoClienteSchema.parse(req.body);
    const agendamento = await agendamentoService.criarAgendamento({
      clienteId: req.cliente!.sub,
      profissionalId: input.profissionalId,
      servicoId: input.servicoId,
      dataHora: new Date(input.dataHora),
    });
    res.status(201).json(agendamento);
  }),
);

agendamentoRouter.get(
  "/meus",
  authCliente,
  asyncHandler(async (req, res) => {
    const agendamentos = await agendamentoService.listarAgendamentosDoCliente(req.cliente!.sub);
    res.json(agendamentos);
  }),
);

agendamentoRouter.delete(
  "/:id",
  authCliente,
  asyncHandler(async (req, res) => {
    await agendamentoService.garantirAgendamentoDoCliente(req.params.id, req.cliente!.sub);
    const agendamento = await agendamentoService.cancelarAgendamento(req.params.id);
    res.json(agendamento);
  }),
);

const criarAgendamentoManualSchema = z.object({
  profissionalId: z.string().uuid(),
  servicoId: z.string().uuid(),
  dataHora: z.string().datetime(),
  cliente: z.object({
    nome: z.string().min(2),
    email: z.string().email(),
    telefone: z.string().optional(),
  }),
});

const listarAgendaQuerySchema = z.object({
  de: z.string().datetime().optional(),
  ate: z.string().datetime().optional(),
  profissionalId: z.string().uuid().optional(),
});

agendamentoRouter.get(
  "/",
  authGestor,
  asyncHandler(async (req, res) => {
    const query = listarAgendaQuerySchema.parse(req.query);
    const agendamentos = await agendamentoService.listarAgendamentosDoEstabelecimento({
      estabelecimentoId: req.gestor!.estabelecimentoId,
      de: query.de ? new Date(query.de) : undefined,
      ate: query.ate ? new Date(query.ate) : undefined,
      profissionalId: query.profissionalId,
    });
    res.json(agendamentos);
  }),
);

// Criação manual pelo gestor (Painel > Agenda), com cliente avulso encontrado/criado por e-mail
agendamentoRouter.post(
  "/manual",
  authGestor,
  asyncHandler(async (req, res) => {
    const input = criarAgendamentoManualSchema.parse(req.body);
    const cliente = await agendamentoService.buscarOuCriarClienteAvulso(input.cliente);
    const agendamento = await agendamentoService.criarAgendamento({
      clienteId: cliente.id,
      profissionalId: input.profissionalId,
      servicoId: input.servicoId,
      dataHora: new Date(input.dataHora),
    });
    res.status(201).json(agendamento);
  }),
);

agendamentoRouter.delete(
  "/:id/gestor",
  authGestor,
  asyncHandler(async (req, res) => {
    await agendamentoService.garantirAgendamentoDoEstabelecimento(req.params.id, req.gestor!.estabelecimentoId);
    const agendamento = await agendamentoService.cancelarAgendamento(req.params.id);
    res.json(agendamento);
  }),
);
