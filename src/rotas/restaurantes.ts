import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";
import { verificarToken, exigirPapel } from "../intermediarios/autenticacao.js";

const prisma = new PrismaClient();
const rota = Router();

rota.get("/", async (_req, res) => {
  const restaurantes = await prisma.restaurante.findMany({
    orderBy: { nome: "asc" },
    include: { avaliacoes: { select: { nota: true } } }
  });
  const comMedia = restaurantes.map((r:any) => ({
    ...r,
    media: r.avaliacoes.length ? (r.avaliacoes.reduce((s:number,x:any)=>s+x.nota,0)/r.avaliacoes.length) : null
  }));
  res.json(comMedia);
});

rota.get("/:id", async (req, res) => {
  const id = Number(req.params.id);
  const r = await prisma.restaurante.findUnique({ where: { id }, include: { itens: true } });
  if (!r) return res.status(404).json({ erro: "Restaurante não encontrado" });
  res.json(r);
});

const esquema = z.object({ nome: z.string().min(2), imagem_url: z.string().optional(), categoria: z.string().optional() });

rota.post("/", verificarToken, exigirPapel("ADMIN"), async (req, res) => {
  const parsed = esquema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error.flatten());
  res.json(await prisma.restaurante.create({ data: parsed.data as any }));
});

rota.put("/:id", verificarToken, exigirPapel("ADMIN"), async (req, res) => {
  const id = Number(req.params.id);
  const parsed = esquema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error.flatten());
  res.json(await prisma.restaurante.update({ where: { id }, data: parsed.data }));
});

rota.delete("/:id", verificarToken, exigirPapel("ADMIN"), async (req, res) => {
  const id = Number(req.params.id);
  await prisma.restaurante.delete({ where: { id } });
  res.json({ ok: true });
});

export default rota;
