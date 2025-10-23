import app from "./app.js";

const isVercel = process.env.VERCEL === "1";
const porta = process.env.PORT || 3333;

if (!isVercel) {
  app.listen(porta, () => console.log("API rodando em http://localhost:" + porta));
}

export default app;
