import { Router } from "express";
import { PrismaClient, StatusPedido } from "@prisma/client";
import { z } from "zod";
import { verificarToken } from "../intermediarios/autenticacao.js";
const prisma = new PrismaClient();
const rota = Router();
const esquemaCriar = z.object({
    restaurante_id: z.number().int().positive(),
    endereco: z.string().min(5),
    itens: z.array(z.object({ item_id: z.number().int().positive(), quantidade: z.number().int().positive() })).min(1)
});
rota.post("/", verificarToken, async (req, res) => {
    const parsed = esquemaCriar.safeParse(req.body);
    if (!parsed.success)
        return res.status(400).json(parsed.error.flatten());
    const { restaurante_id, endereco, itens } = parsed.data;
    const db = await prisma.itemCardapio.findMany({ where: { id: { in: itens.map(i => i.item_id) } } });
    if (db.length !== itens.length)
        return res.status(400).json({ erro: "Item inválido" });
    const total = itens.reduce((s, i) => s + (db.find(d => d.id === i.item_id).preco_centavos * i.quantidade), 0);
    const pedido = await prisma.pedido.create({
        data: {
            usuario_id: req.usuario.id,
            restaurante_id,
            endereco,
            total_centavos: total,
            itens: { create: itens.map(i => ({ item_id: i.item_id, quantidade: i.quantidade, preco_centavos: db.find(d => d.id === i.item_id).preco_centavos })) }
        },
        include: { itens: { include: { item: true } }, restaurante: true, usuario: true, avaliacao: true }
    });
    res.json(pedido);
});
rota.get("/", verificarToken, async (req, res) => {
    const u = req.usuario;
    const where = u.papel === "ADMIN" ? {} : { usuario_id: u.id };
    const pedidos = await prisma.pedido.findMany({
        where,
        include: { itens: { include: { item: true } }, restaurante: true, usuario: true, avaliacao: true },
        orderBy: { criado_em: "desc" }
    });
    res.json(pedidos);
});
const esquemaStatus = z.object({ status: z.nativeEnum(StatusPedido) });
rota.patch("/:id/status", verificarToken, async (req, res) => {
    const u = req.usuario;
    if (u.papel !== "ADMIN")
        return res.status(403).json({ erro: "Sem permissão" });
    const id = Number(req.params.id);
    const parsed = esquemaStatus.safeParse(req.body);
    if (!parsed.success)
        return res.status(400).json(parsed.error.flatten());
    res.json(await prisma.pedido.update({ where: { id }, data: { status: parsed.data.status } }));
});
export default rota;
//# sourceMappingURL=pedidos.js.map