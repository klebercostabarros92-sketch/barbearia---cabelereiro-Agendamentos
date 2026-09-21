import { Router } from "express";
import { asyncHandler } from "../../middlewares/asyncHandler";
import { authCliente, authGestor } from "../../middlewares/auth";
import { prisma } from "../../config/prisma";

export const clienteRouter = Router();

clienteRouter.get(
  "/me",
  authCliente,
  asyncHandler(async (req, res) => {
    const cliente = await prisma.cliente.findUniqueOrThrow({
      where: { id: req.cliente!.sub },
      select: { id: true, nome: true, email: true, telefone: true },
    });
    res.json(cliente);
  }),
);

// Clientes que já agendaram com algum profissional do estabelecimento do gestor logado
clienteRouter.get(
  "/",
  authGestor,
  asyncHandler(async (req, res) => {
    const clientes = await prisma.cliente.findMany({
      where: { agendamentos: { some: { profissional: { estabelecimentoId: req.gestor!.estabelecimentoId } } } },
      include: {
        agendamentos: {
          where: { profissional: { estabelecimentoId: req.gestor!.estabelecimentoId } },
          include: { servico: true, profissional: true },
          orderBy: { dataHora: "desc" },
        },
      },
      orderBy: { nome: "asc" },
    });
    res.json(clientes);
  }),
);
