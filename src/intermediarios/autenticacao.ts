import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export interface CargaToken { id: number; papel: "USUARIO" | "ADMIN"; }

export function verificarToken(req: Request, res: Response, next: NextFunction) {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ erro: "Token ausente" });
  const token = auth.split(" ")[1];
  if (!token) return res.status(401).json({ erro: "Token inválido" });
  try {
    const segredo = process.env.JWT_SECRET || "dev";
    const carga = jwt.verify(token, segredo) as CargaToken;
    (req as any).usuario = carga;
    next();
  } catch {
    return res.status(401).json({ erro: "Token inválido" });
  }
}

export function exigirPapel(papel: "ADMIN" | "USUARIO") {
  return (req: Request, res: Response, next: NextFunction) => {
    const u = (req as any).usuario as CargaToken | undefined;
    if (!u) return res.status(401).json({ erro: "Não autenticado" });
    if (u.papel !== papel && u.papel !== "ADMIN") return res.status(403).json({ erro: "Sem permissão" });
    next();
  };
}
