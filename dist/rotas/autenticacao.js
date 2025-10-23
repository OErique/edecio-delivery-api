import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
const prisma = new PrismaClient();
const rota = Router();
const esquemaLogin = z.object({ email: z.string().email(), senha: z.string().min(6) });
rota.post("/login", async (req, res) => {
    const parsed = esquemaLogin.safeParse(req.body);
    if (!parsed.success)
        return res.status(400).json(parsed.error.flatten());
    const { email, senha } = parsed.data;
    const usuario = await prisma.usuario.findUnique({ where: { email } });
    if (!usuario)
        return res.status(401).json({ erro: "Credenciais inválidas" });
    const ok = await bcrypt.compare(senha, usuario.senha);
    if (!ok)
        return res.status(401).json({ erro: "Credenciais inválidas" });
    const token = jwt.sign({ id: usuario.id, papel: usuario.papel }, process.env.JWT_SECRET || "dev", { expiresIn: "7d" });
    res.json({ token, usuario: { id: usuario.id, nome: usuario.nome, email: usuario.email, papel: usuario.papel } });
});
export default rota;
//# sourceMappingURL=autenticacao.js.map