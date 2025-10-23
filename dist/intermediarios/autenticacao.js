import jwt from "jsonwebtoken";
export function verificarToken(req, res, next) {
    const auth = req.headers.authorization;
    if (!auth)
        return res.status(401).json({ erro: "Token ausente" });
    const token = auth.split(" ")[1];
    if (!token)
        return res.status(401).json({ erro: "Token inválido" });
    try {
        const segredo = process.env.JWT_SECRET || "dev";
        const carga = jwt.verify(token, segredo);
        req.usuario = carga;
        next();
    }
    catch {
        return res.status(401).json({ erro: "Token inválido" });
    }
}
export function exigirPapel(papel) {
    return (req, res, next) => {
        const u = req.usuario;
        if (!u)
            return res.status(401).json({ erro: "Não autenticado" });
        if (u.papel !== papel && u.papel !== "ADMIN")
            return res.status(403).json({ erro: "Sem permissão" });
        next();
    };
}
//# sourceMappingURL=autenticacao.js.map