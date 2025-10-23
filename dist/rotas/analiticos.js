import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { verificarToken, exigirPapel } from "../intermediarios/autenticacao.js";
const prisma = new PrismaClient();
const rota = Router();
rota.use(verificarToken, exigirPapel("ADMIN"));
rota.get("/pedidos-por-status", async (_req, res) => {
    const rows = await prisma.pedido.groupBy({ by: ["status"], _count: { status: true } });
    res.json(rows.map(r => ({ status: r.status, quantidade: r._count.status })));
});
rota.get("/faturamento-por-restaurante", async (_req, res) => {
    const rows = await prisma.pedido.groupBy({ by: ["restaurante_id"], _sum: { total_centavos: true } });
    const restaurantes = await prisma.restaurante.findMany({ select: { id: true, nome: true } });
    const nomePorId = Object.fromEntries(restaurantes.map(r => [r.id, r.nome]));
    res.json(rows.map(r => ({ restaurante_id: r.restaurante_id, restaurante: nomePorId[r.restaurante_id] || String(r.restaurante_id), total_centavos: r._sum.total_centavos || 0 })));
});
rota.get("/pedidos-por-dia", async (_req, res) => {
    const now = new Date();
    const inicio = new Date(now);
    inicio.setDate(now.getDate() - 13);
    const data = await prisma.pedido.findMany({ where: { criado_em: { gte: inicio } }, select: { criado_em: true } });
    const mapa = {};
    for (let i = 0; i < 14; i++) {
        const d = new Date(inicio);
        d.setDate(inicio.getDate() + i);
        mapa[d.toISOString().slice(0, 10)] = 0;
    }
    for (const o of data) {
        const key = o.criado_em.toISOString().slice(0, 10);
        if (mapa[key] != null)
            mapa[key]++;
    }
    res.json(Object.entries(mapa).map(([data, quantidade]) => ({ data, quantidade })));
});
export default rota;
//# sourceMappingURL=analiticos.js.map