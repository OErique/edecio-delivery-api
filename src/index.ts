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
app.use(cors());
app.use(express.json());

app.get("/", (_req, res) => res.json({ ok: true, nome: "API Edécio Delivery" }));

app.use("/autenticacao", autenticacao);
app.use("/restaurantes", restaurantes);
app.use("/itens", itens);
app.use("/pedidos", pedidos);
app.use("/avaliacoes", avaliacoes);
app.use("/analiticos", analiticos);

const porta = process.env.PORT || 3333;
app.listen(porta, () => console.log("API em http://localhost:" + porta));
