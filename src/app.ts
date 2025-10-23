// src/app.ts
import express from "express";
import cors from "cors";
import "dotenv/config";

import autenticacao from "./rotas/autenticacao.js";
import restaurantes from "./rotas/restaurantes.js";
import itens from "./rotas/itens.js";
import pedidos from "./rotas/pedidos.js";
import avaliacoes from "./rotas/avaliacoes.js";
import analiticos from "./rotas/analiticos.js";

const app = express();
app.use(express.json());

// CORS — permita localhost e o domínio do front na Vercel
const allowed = [
  "http://localhost:5173",
  "https://edecio-delivery-front-v6-hilopd3zg.vercel.app", // ← troque pela URL real do front
];

app.use(
  cors({
    origin(origin, cb) {
      if (!origin || allowed.includes(origin)) return cb(null, true);
      return cb(new Error("CORS bloqueado"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.get("/", (_req, res) => res.json({ ok: true, nome: "API Edécio Delivery" }));
app.get("/saude", (_req, res) => res.json({ status: "ok" }));

app.use("/autenticacao", autenticacao);
app.use("/restaurantes", restaurantes);
app.use("/itens", itens);
app.use("/pedidos", pedidos);
app.use("/avaliacoes", avaliacoes);
app.use("/analiticos", analiticos);

export default app;
