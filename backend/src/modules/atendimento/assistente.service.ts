import Anthropic from "@anthropic-ai/sdk";
import { CanalAtendimento } from "@prisma/client";
import { env } from "../../config/env";
import { AppError } from "../../middlewares/errorHandler";
import { FERRAMENTAS, executarFerramenta } from "./ferramentas";
import * as conversaService from "./conversa.service";

const MAX_RODADAS_DE_FERRAMENTAS = 5;

function montarPromptSistema(dataHoraAtual: string) {
  return (
    "Você é o atendente virtual de um salão/barbearia, conversando pelo WhatsApp (ou outro canal de texto) com um cliente. " +
    "Seu objetivo é ajudar o cliente a conhecer os serviços, ver horários livres e marcar, remarcar ou cancelar um horário. " +
    "Seja breve, cordial e direto, como uma mensagem de WhatsApp — sem markdown, sem listas longas desnecessárias. " +
    "Sempre confirme com o cliente antes de criar ou cancelar um agendamento. " +
    "Se ainda não souber o nome do cliente, pergunte e use a ferramenta identificar_cliente antes de agendar. " +
    `A data e hora atuais são ${dataHoraAtual}. Nunca ofereça horários no passado.`
  );
}

let anthropicClient: Anthropic | null = null;
function obterClienteAnthropic(): Anthropic {
  if (!env.anthropicApiKey) {
    throw new AppError("Atendente virtual não configurado (ANTHROPIC_API_KEY ausente)", 503);
  }
  if (!anthropicClient) anthropicClient = new Anthropic({ apiKey: env.anthropicApiKey });
  return anthropicClient;
}

export async function responderMensagem(params: {
  estabelecimentoId: string;
  canal: CanalAtendimento;
  identificadorExterno: string;
  texto: string;
}): Promise<string> {
  const client = obterClienteAnthropic();

  const conversa = await conversaService.obterOuCriarConversa({
    estabelecimentoId: params.estabelecimentoId,
    canal: params.canal,
    identificadorExterno: params.identificadorExterno,
  });

  await conversaService.registrarMensagem(conversa.id, "CLIENTE", params.texto);
  const historico = await conversaService.carregarHistorico(conversa.id);

  const mensagens: Anthropic.MessageParam[] = historico.map((m) => ({
    role: m.remetente === "CLIENTE" ? "user" : "assistant",
    content: m.texto,
  }));

  let clienteId = conversa.clienteId;
  let textoFinal = "";

  for (let rodada = 0; rodada < MAX_RODADAS_DE_FERRAMENTAS; rodada++) {
    const resposta = await client.messages.create({
      model: env.atendenteModel,
      max_tokens: 1024,
      system: montarPromptSistema(new Date().toISOString()),
      tools: FERRAMENTAS,
      messages: mensagens,
    });

    const blocosDeFerramenta = resposta.content.filter(
      (bloco): bloco is Anthropic.ToolUseBlock => bloco.type === "tool_use",
    );
    const blocosDeTexto = resposta.content.filter((bloco): bloco is Anthropic.TextBlock => bloco.type === "text");
    textoFinal = blocosDeTexto.map((b) => b.text).join("\n").trim();

    if (resposta.stop_reason !== "tool_use" || blocosDeFerramenta.length === 0) {
      break;
    }

    mensagens.push({ role: "assistant", content: resposta.content });

    const resultadosFerramentas: Anthropic.ToolResultBlockParam[] = [];
    for (const bloco of blocosDeFerramenta) {
      const { resultado, novoClienteId } = await executarFerramenta(bloco.name, bloco.input as Record<string, unknown>, {
        conversaId: conversa.id,
        estabelecimentoId: params.estabelecimentoId,
        clienteId,
        identificadorExterno: params.identificadorExterno,
      });
      if (novoClienteId) clienteId = novoClienteId;

      resultadosFerramentas.push({
        type: "tool_result",
        tool_use_id: bloco.id,
        content: JSON.stringify(resultado),
      });
    }

    mensagens.push({ role: "user", content: resultadosFerramentas });
  }

  const textoParaEnviar = textoFinal || "Desculpe, não consegui processar sua mensagem agora. Pode tentar de novo?";
  await conversaService.registrarMensagem(conversa.id, "ATENDENTE", textoParaEnviar);
  return textoParaEnviar;
}
