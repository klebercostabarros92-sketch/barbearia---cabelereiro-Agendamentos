import bcrypt from "bcryptjs";
import jwt, { SignOptions } from "jsonwebtoken";
import { prisma } from "../../config/prisma";
import { env } from "../../config/env";
import { AppError } from "../../middlewares/errorHandler";

const SALT_ROUNDS = 10;

export async function registrarGestor(input: {
  nome: string;
  email: string;
  senha: string;
  estabelecimentoNome: string;
}) {
  const existente = await prisma.gestor.findUnique({ where: { email: input.email } });
  if (existente) throw new AppError("E-mail já cadastrado", 409);

  const estabelecimento = await prisma.estabelecimento.create({
    data: { nome: input.estabelecimentoNome },
  });

  const senhaHash = await bcrypt.hash(input.senha, SALT_ROUNDS);
  const gestor = await prisma.gestor.create({
    data: {
      nome: input.nome,
      email: input.email,
      senhaHash,
      estabelecimentoId: estabelecimento.id,
    },
  });

  return { gestor, estabelecimento, token: gerarTokenGestor(gestor.id, estabelecimento.id) };
}

export async function loginGestor(email: string, senha: string) {
  const gestor = await prisma.gestor.findUnique({ where: { email } });
  if (!gestor) throw new AppError("Credenciais inválidas", 401);

  const senhaOk = await bcrypt.compare(senha, gestor.senhaHash);
  if (!senhaOk) throw new AppError("Credenciais inválidas", 401);

  return { gestor, token: gerarTokenGestor(gestor.id, gestor.estabelecimentoId) };
}

export async function registrarCliente(input: { nome: string; email: string; senha: string; telefone?: string }) {
  const existente = await prisma.cliente.findUnique({ where: { email: input.email } });
  if (existente) throw new AppError("E-mail já cadastrado", 409);

  const senhaHash = await bcrypt.hash(input.senha, SALT_ROUNDS);
  const cliente = await prisma.cliente.create({
    data: {
      nome: input.nome,
      email: input.email,
      senhaHash,
      telefone: input.telefone,
    },
  });

  return { cliente, token: gerarTokenCliente(cliente.id) };
}

export async function loginCliente(email: string, senha: string) {
  const cliente = await prisma.cliente.findUnique({ where: { email } });
  if (!cliente) throw new AppError("Credenciais inválidas", 401);

  const senhaOk = await bcrypt.compare(senha, cliente.senhaHash);
  if (!senhaOk) throw new AppError("Credenciais inválidas", 401);

  return { cliente, token: gerarTokenCliente(cliente.id) };
}

function gerarTokenGestor(gestorId: string, estabelecimentoId: string) {
  const payload = { sub: gestorId, estabelecimentoId, tipo: "gestor" as const };
  const options: SignOptions = { expiresIn: env.jwtExpiresIn as SignOptions["expiresIn"] };
  return jwt.sign(payload, env.jwtSecretGestor, options);
}

function gerarTokenCliente(clienteId: string) {
  const payload = { sub: clienteId, tipo: "cliente" as const };
  const options: SignOptions = { expiresIn: env.jwtExpiresIn as SignOptions["expiresIn"] };
  return jwt.sign(payload, env.jwtSecretCliente, options);
}
