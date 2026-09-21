import { Router } from "express";
import { z } from "zod";
import { CanalAtendimento } from "@prisma/client";
import { asyncHandler } from "../../middlewares/asyncHandler";
import { responderMensagem } from "./assistente.service";

export const atendimentoRouter = Router();

const mensagemSchema = z.object({
  estabelecimentoId: z.string().uuid(),
  canal: z.nativeEnum(CanalAtendimento),
  identificadorExterno: z.string().min(1),
  texto: z.string().min(1),
});

/**
 * Endpoint único e agnóstico de canal: quem chama é o adaptador do canal escolhido
 * (webhook do WhatsApp Cloud API, Baileys, webchat, etc.), que traduz o payload do
 * canal para este formato e envia a resposta de volta pelo canal de origem.
 */
atendimentoRouter.post(
  "/mensagens",
  asyncHandler(async (req, res) => {
    const input = mensagemSchema.parse(req.body);
    const resposta = await responderMensagem(input);
    res.json({ resposta });
  }),
);
