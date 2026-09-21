import express from "express";
import cors from "cors";
import { env } from "./config/env";
import { errorHandler, notFoundHandler } from "./middlewares/errorHandler";
import { authRouter } from "./modules/auth/auth.routes";
import { estabelecimentoRouter } from "./modules/estabelecimento/estabelecimento.routes";
import { profissionalRouter } from "./modules/profissional/profissional.routes";
import { servicoRouter } from "./modules/servico/servico.routes";
import { agendamentoRouter } from "./modules/agendamento/agendamento.routes";
import { clienteRouter } from "./modules/cliente/cliente.routes";
import { atendimentoRouter } from "./modules/atendimento/atendimento.routes";
import { iniciarJobDeLembretes } from "./modules/notificacao/lembrete.job";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => res.json({ status: "ok" }));

app.use("/auth", authRouter);
app.use("/estabelecimentos", estabelecimentoRouter);
app.use("/profissionais", profissionalRouter);
app.use("/servicos", servicoRouter);
app.use("/agendamentos", agendamentoRouter);
app.use("/clientes", clienteRouter);
app.use("/atendimento", atendimentoRouter);

app.use(notFoundHandler);
app.use(errorHandler);

app.listen(env.port, () => {
  console.log(`Backend rodando em http://localhost:${env.port}`);
  iniciarJobDeLembretes();
});
