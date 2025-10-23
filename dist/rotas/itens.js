import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";
import { verificarToken, exigirPapel } from "../intermediarios/autenticacao.js";
const prisma = new PrismaClient();
const rota = Router();
rota.get("/restaurante/:restauranteId", async (req, res) => {
    const restauranteId = Number(req.params.restauranteId);
    const destaque = req.query.destaque === 'true';
    const itens = await prisma.itemCardapio.findMany({ where: { restaurante_id: restauranteId, ...(destaque ? { destaque: true } : {}) }, orderBy: { nome: "asc" } });
    res.json(itens);
});
const esquema = z.object({
    nome: z.string().min(2),
    descricao: z.string().optional(),
    preco_centavos: z.number().int().positive(),
    imagem_url: z.string().optional(),
    restaurante_id: z.number().int().positive(),
    destaque: z.boolean().optional(),
});
rota.post("/", verificarToken, exigirPapel("ADMIN"), async (req, res) => {
    const parsed = esquema.safeParse(req.body);
    if (!parsed.success)
        return res.status(400).json(parsed.error.flatten());
    res.json(await prisma.itemCardapio.create({ data: parsed.data }));
});
rota.put("/:id", verificarToken, exigirPapel("ADMIN"), async (req, res) => {
    const id = Number(req.params.id);
    const parsed = esquema.partial().safeParse(req.body);
    if (!parsed.success)
        return res.status(400).json(parsed.error.flatten());
    res.json(await prisma.itemCardapio.update({ where: { id }, data: parsed.data }));
});
rota.delete("/:id", verificarToken, exigirPapel("ADMIN"), async (req, res) => {
    const id = Number(req.params.id);
    await prisma.itemCardapio.delete({ where: { id } });
    res.json({ ok: true });
});
export default rota;
//# sourceMappingURL=itens.js.map