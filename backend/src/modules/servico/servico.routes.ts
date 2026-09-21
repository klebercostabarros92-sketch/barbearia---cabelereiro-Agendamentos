import { Router } from "express";
import { z } from "zod";
import { asyncHandler } from "../../middlewares/asyncHandler";
import { authGestor } from "../../middlewares/auth";
import { AppError } from "../../middlewares/errorHandler";
import { prisma } from "../../config/prisma";

export const servicoRouter = Router();

const createSchema = z.object({
  nome: z.string().min(2),
  duracaoMinutos: z.number().int().positive(),
  preco: z.number().nonnegative(),
});

const updateSchema = createSchema.partial().extend({
  ativo: z.boolean().optional(),
});

// Lista pública: usada pelo App do cliente
servicoRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const estabelecimentoId = req.query.estabelecimentoId as string | undefined;
    if (!estabelecimentoId) throw new AppError("estabelecimentoId é obrigatório", 400);

    const servicos = await prisma.servico.findMany({
      where: { estabelecimentoId, ativo: true },
      orderBy: { nome: "asc" },
    });
    res.json(servicos);
  }),
);

servicoRouter.post(
  "/",
  authGestor,
  asyncHandler(async (req, res) => {
    const input = createSchema.parse(req.body);
    const servico = await prisma.servico.create({
      data: { ...input, estabelecimentoId: req.gestor!.estabelecimentoId },
    });
    res.status(201).json(servico);
  }),
);

servicoRouter.put(
  "/:id",
  authGestor,
  asyncHandler(async (req, res) => {
    const input = updateSchema.parse(req.body);
    await garantirServicoDoGestor(req.params.id, req.gestor!.estabelecimentoId);
    const servico = await prisma.servico.update({ where: { id: req.params.id }, data: input });
    res.json(servico);
  }),
);

servicoRouter.delete(
  "/:id",
  authGestor,
  asyncHandler(async (req, res) => {
    await garantirServicoDoGestor(req.params.id, req.gestor!.estabelecimentoId);
    await prisma.servico.update({ where: { id: req.params.id }, data: { ativo: false } });
    res.status(204).send();
  }),
);

async function garantirServicoDoGestor(id: string, estabelecimentoId: string) {
  const servico = await prisma.servico.findUnique({ where: { id } });
  if (!servico || servico.estabelecimentoId !== estabelecimentoId) {
    throw new AppError("Serviço não encontrado", 404);
  }
}
