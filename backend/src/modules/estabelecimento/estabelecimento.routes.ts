import { Router } from "express";
import { z } from "zod";
import { asyncHandler } from "../../middlewares/asyncHandler";
import { authGestor } from "../../middlewares/auth";
import { prisma } from "../../config/prisma";

export const estabelecimentoRouter = Router();

const updateSchema = z.object({
  nome: z.string().min(2).optional(),
  endereco: z.string().optional(),
  horaAbertura: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  horaFechamento: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  antecedenciaLembreteMin: z.number().int().min(0).optional(),
});

estabelecimentoRouter.get(
  "/me",
  authGestor,
  asyncHandler(async (req, res) => {
    const estabelecimento = await prisma.estabelecimento.findUniqueOrThrow({
      where: { id: req.gestor!.estabelecimentoId },
    });
    res.json(estabelecimento);
  }),
);

estabelecimentoRouter.put(
  "/me",
  authGestor,
  asyncHandler(async (req, res) => {
    const data = updateSchema.parse(req.body);
    const estabelecimento = await prisma.estabelecimento.update({
      where: { id: req.gestor!.estabelecimentoId },
      data,
    });
    res.json(estabelecimento);
  }),
);

// Consulta pública (App do cliente): dados básicos do estabelecimento (v1 = fixo em um único estabelecimento)
estabelecimentoRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const estabelecimento = await prisma.estabelecimento.findUniqueOrThrow({
      where: { id: req.params.id },
      select: { id: true, nome: true, endereco: true, horaAbertura: true, horaFechamento: true },
    });
    res.json(estabelecimento);
  }),
);
