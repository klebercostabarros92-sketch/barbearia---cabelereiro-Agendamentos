import { Router } from "express";
import { z } from "zod";
import { asyncHandler } from "../../middlewares/asyncHandler";
import * as authService from "./auth.service";

export const authRouter = Router();

const registrarGestorSchema = z.object({
  nome: z.string().min(2),
  email: z.string().email(),
  senha: z.string().min(6),
  estabelecimentoNome: z.string().min(2),
});

const loginSchema = z.object({
  email: z.string().email(),
  senha: z.string().min(6),
});

const registrarClienteSchema = z.object({
  nome: z.string().min(2),
  email: z.string().email(),
  senha: z.string().min(6),
  telefone: z.string().optional(),
});

authRouter.post(
  "/gestor/registrar",
  asyncHandler(async (req, res) => {
    const input = registrarGestorSchema.parse(req.body);
    const { gestor, estabelecimento, token } = await authService.registrarGestor(input);
    res.status(201).json({
      token,
      gestor: { id: gestor.id, nome: gestor.nome, email: gestor.email },
      estabelecimento: { id: estabelecimento.id, nome: estabelecimento.nome },
    });
  }),
);

authRouter.post(
  "/gestor/login",
  asyncHandler(async (req, res) => {
    const { email, senha } = loginSchema.parse(req.body);
    const { gestor, token } = await authService.loginGestor(email, senha);
    res.json({ token, gestor: { id: gestor.id, nome: gestor.nome, email: gestor.email } });
  }),
);

authRouter.post(
  "/cliente/registrar",
  asyncHandler(async (req, res) => {
    const input = registrarClienteSchema.parse(req.body);
    const { cliente, token } = await authService.registrarCliente(input);
    res.status(201).json({ token, cliente: { id: cliente.id, nome: cliente.nome, email: cliente.email } });
  }),
);

authRouter.post(
  "/cliente/login",
  asyncHandler(async (req, res) => {
    const { email, senha } = loginSchema.parse(req.body);
    const { cliente, token } = await authService.loginCliente(email, senha);
    res.json({ token, cliente: { id: cliente.id, nome: cliente.nome, email: cliente.email } });
  }),
);
