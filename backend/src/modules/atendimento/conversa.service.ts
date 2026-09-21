import { prisma } from "../../config/prisma";
import { CanalAtendimento } from "@prisma/client";

const HISTORICO_MAX_MENSAGENS = 20;

export async function obterOuCriarConversa(params: {
  estabelecimentoId: string;
  canal: CanalAtendimento;
  identificadorExterno: string;
}) {
  return prisma.conversaAtendimento.upsert({
    where: {
      estabelecimentoId_canal_identificadorExterno: {
        estabelecimentoId: params.estabelecimentoId,
        canal: params.canal,
        identificadorExterno: params.identificadorExterno,
      },
    },
    update: {},
    create: params,
  });
}

export async function carregarHistorico(conversaId: string) {
  const mensagens = await prisma.mensagemAtendimento.findMany({
    where: { conversaId },
    orderBy: { createdAt: "desc" },
    take: HISTORICO_MAX_MENSAGENS,
  });
  return mensagens.reverse();
}

export async function registrarMensagem(conversaId: string, remetente: "CLIENTE" | "ATENDENTE", texto: string) {
  return prisma.mensagemAtendimento.create({ data: { conversaId, remetente, texto } });
}

export async function vincularCliente(conversaId: string, clienteId: string) {
  return prisma.conversaAtendimento.update({ where: { id: conversaId }, data: { clienteId } });
}
