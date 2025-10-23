import { Router } from "express";
import { PrismaClient, StatusPedido } from "@prisma/client";
import { z } from "zod";
import { verificarToken } from "../intermediarios/autenticacao.js";

const prisma = new PrismaClient();
const rota = Router();

rota.get("/restaurante/:id", async (req, res) => {
  const id = Number(req.params.id);
  const avals = await prisma.avaliacao.findMany({
    where: { restaurante_id: id },
    include: { usuario: { select: { id: true, nome: true } } },
    orderBy: { criado_em: "desc" }
  });
  res.json(avals);
});

const esquema = z.object({ nota: z.number().int().min(1).max(5), comentario: z.string().optional() });

rota.post("/pedido/:pedidoId", verificarToken, async (req, res) => {
  const pedidoId = Number(req.params.pedidoId);
  const parsed = esquema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error.flatten());
  const pedido = await prisma.pedido.findUnique({ where: { id: pedidoId } });
  if (!pedido) return res.status(404).json({ erro: "Pedido não encontrado" });
  if (pedido.usuario_id !== (req as any).usuario.id) return res.status(403).json({ erro: "Sem permissão" });
  if (pedido.status !== StatusPedido.ENTREGUE) return res.status(400).json({ erro: "Só é possível avaliar pedidos entregues" });
  const ja = await prisma.avaliacao.findUnique({ where: { pedido_id: pedidoId } });
  if (ja) return res.status(400).json({ erro: "Pedido já avaliado" });
  const rv = await prisma.avaliacao.create({ data: { pedido_id: pedidoId, usuario_id: (req as any).usuario.id, restaurante_id: pedido.restaurante_id, nota: parsed.data.nota, comentario: parsed.data.comentario } });
  res.json(rv);
});

export default rota;
