import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env";

export interface GestorJwtPayload {
  sub: string;
  estabelecimentoId: string;
  tipo: "gestor";
}

export interface ClienteJwtPayload {
  sub: string;
  tipo: "cliente";
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      gestor?: GestorJwtPayload;
      cliente?: ClienteJwtPayload;
    }
  }
}

function extractToken(req: Request): string | null {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) return null;
  return header.slice("Bearer ".length);
}

export function authGestor(req: Request, res: Response, next: NextFunction) {
  const token = extractToken(req);
  if (!token) return res.status(401).json({ error: "Token não informado" });

  try {
    const payload = jwt.verify(token, env.jwtSecretGestor) as GestorJwtPayload;
    req.gestor = payload;
    return next();
  } catch {
    return res.status(401).json({ error: "Token inválido ou expirado" });
  }
}

export function authCliente(req: Request, res: Response, next: NextFunction) {
  const token = extractToken(req);
  if (!token) return res.status(401).json({ error: "Token não informado" });

  try {
    const payload = jwt.verify(token, env.jwtSecretCliente) as ClienteJwtPayload;
    req.cliente = payload;
    return next();
  } catch {
    return res.status(401).json({ error: "Token inválido ou expirado" });
  }
}
