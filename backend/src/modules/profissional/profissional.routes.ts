import { Router } from "express";
import { z } from "zod";
import { asyncHandler } from "../../middlewares/asyncHandler";
import { authGestor } from "../../middlewares/auth";
import { AppError } from "../../middlewares/errorHandler";
import { prisma } from "../../config/prisma";

export const profissionalRouter = Router();

const horarioSchema = z.object({
  diaSemana: z.number().int().min(0).max(6),
  horaInicio: z.string().regex(/^\d{2}:\d{2}$/),
  horaFim: z.string().regex(/^\d{2}:\d{2}$/),
});

const createSchema = z.object({
  nome: z.string().min(2),
  foto: z.string().url().optional(),
  servicoIds: z.array(z.string().uuid()).default([]),
  horarios: z.array(horarioSchema).default([]),
});

const updateSchema = createSchema.partial().extend({
  ativo: z.boolean().optional(),
});

// Lista pública: usada pelo App do cliente para exibir profissionais de um serviço/estabelecimento
profissionalRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const estabelecimentoId = req.query.estabelecimentoId as string | undefined;
    const servicoId = req.query.servicoId as string | undefined;

    if (!estabelecimentoId) {
      throw new AppError("estabelecimentoId é obrigatório", 400);
    }

    const profissionais = await prisma.profissional.findMany({
      where: {
        estabelecimentoId,
        ativo: true,
        ...(servicoId ? { servicos: { some: { servicoId } } } : {}),
      },
      include: { servicos: { include: { servico: true } } },
      orderBy: { nome: "asc" },
    });

    res.json(profissionais);
  }),
);

profissionalRouter.post(
  "/",
  authGestor,
  asyncHandler(async (req, res) => {
    const input = createSchema.parse(req.body);
    const profissional = await prisma.profissional.create({
      data: {
        nome: input.nome,
        foto: input.foto,
        estabelecimentoId: req.gestor!.estabelecimentoId,
        servicos: { create: input.servicoIds.map((servicoId) => ({ servicoId })) },
        horariosDisponiveis: { create: input.horarios },
      },
      include: { servicos: true, horariosDisponiveis: true },
    });
    res.status(201).json(profissional);
  }),
);

profissionalRouter.put(
  "/:id",
  authGestor,
  asyncHandler(async (req, res) => {
    const input = updateSchema.parse(req.body);
    await garantirProfissionalDoGestor(req.params.id, req.gestor!.estabelecimentoId);

    const profissional = await prisma.$transaction(async (tx) => {
      if (input.servicoIds) {
        await tx.profissionalServico.deleteMany({ where: { profissionalId: req.params.id } });
        await tx.profissionalServico.createMany({
          data: input.servicoIds.map((servicoId) => ({ profissionalId: req.params.id, servicoId })),
        });
      }
      if (input.horarios) {
        await tx.horarioDisponivel.deleteMany({ where: { profissionalId: req.params.id } });
        await tx.horarioDisponivel.createMany({
          data: input.horarios.map((h) => ({ ...h, profissionalId: req.params.id })),
        });
      }
      return tx.profissional.update({
        where: { id: req.params.id },
        data: {
          nome: input.nome,
          foto: input.foto,
          ativo: input.ativo,
        },
        include: { servicos: true, horariosDisponiveis: true },
      });
    });

    res.json(profissional);
  }),
);

profissionalRouter.delete(
  "/:id",
  authGestor,
  asyncHandler(async (req, res) => {
    await garantirProfissionalDoGestor(req.params.id, req.gestor!.estabelecimentoId);
    await prisma.profissional.update({ where: { id: req.params.id }, data: { ativo: false } });
    res.status(204).send();
  }),
);

async function garantirProfissionalDoGestor(id: string, estabelecimentoId: string) {
  const profissional = await prisma.profissional.findUnique({ where: { id } });
  if (!profissional || profissional.estabelecimentoId !== estabelecimentoId) {
    throw new AppError("Profissional não encontrado", 404);
  }
}
