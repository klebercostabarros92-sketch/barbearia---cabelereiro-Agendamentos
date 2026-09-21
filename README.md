# Agendador de Horários

Sistema de agendamento online para salões e barbearias. Ver documentação completa em [docs/](docs/).

## Estrutura

- `backend/` — API REST (Node.js + Express + TypeScript + Prisma + PostgreSQL)
- `painel-gestor/` — Painel web do gestor (React + Vite + TypeScript)
- `docker-compose.yml` — sobe PostgreSQL + backend em containers

## Como rodar localmente

### 1. Banco de dados + backend (via Docker)

```bash
docker compose up -d postgres
cd backend
cp .env.example .env
npm install
npm run prisma:migrate
npm run dev
```

Backend disponível em `http://localhost:3333` (`GET /health` para checar).

### 2. Painel do gestor

```bash
cd painel-gestor
cp .env.example .env
npm install
npm run dev
```

Painel disponível em `http://localhost:5173`.

### 3. Primeiro acesso

Acesse `http://localhost:5173/registro` para criar o primeiro estabelecimento e usuário gestor. Depois, cadastre serviços e profissionais para que a agenda comece a ter horários livres.

## Atendente virtual (opcional)

O backend tem um módulo de atendimento (`backend/src/modules/atendimento/`) que expõe `POST /atendimento/mensagens`
(`{ estabelecimentoId, canal, identificadorExterno, texto }` → `{ resposta }`). Ele usa a Claude API com tool use para
consultar serviços, profissionais e horários livres, identificar o cliente pelo telefone e criar/cancelar agendamentos
— chamando os mesmos services já usados pelo Painel e pelo App, sem depender de n8n ou de outro serviço rodando à parte.

Ele é **agnóstico de canal**: o endpoint não sabe nada sobre WhatsApp especificamente. Para ligar a um canal real, falta
escrever um pequeno adaptador (rota de webhook) que traduza o payload daquele canal para o formato acima e envie a
`resposta` de volta pela API do canal — por exemplo:

- **WhatsApp Cloud API (oficial)**: webhook recebe `{ from, text }`, chama `/atendimento/mensagens` com
  `canal: "WHATSAPP"` e `identificadorExterno: from`, e responde via `POST` na Graph API da Meta.
- **Baileys (não-oficial)**: mesmo fluxo, trocando a chamada de envio pela função de envio do Baileys.

Sem `ANTHROPIC_API_KEY` configurada, o módulo fica desativado (retorna 503) e o resto da API funciona normalmente.

## Status da implementação

Ver o plano de fases em [docs/](docs/). Implementado até aqui:

- [x] Fase 1 — Base do backend (API, Prisma, JWT do gestor)
- [x] Fase 2 — Painel: cadastros de Serviços e Profissionais
- [x] Fase 3 — Motor de agenda (`GET /agendamentos/horarios-livres`)
- [x] Fase 4 — Painel: tela de Agenda (visualização + criação/cancelamento manual)
- [x] Fase 5 — API do cliente (registro/login, listar serviços/profissionais, criar/cancelar agendamento)
- [ ] Fase 6 — App Android (MVP)
- [x] Fase 7 — Lembretes automáticos (job agendado pronto; integração real com Firebase Cloud Messaging pendente — ver `backend/src/modules/notificacao/push.service.ts`)
- [ ] Fase 8 — Testes e ajustes ponta a ponta
- [ ] Fase 9 — Deploy em produção (VPS Oracle Cloud)
- [ ] Fase 10 — Distribuição do APK
- [x] Extra — Atendente virtual via Claude API (backend pronto; falta plugar o canal — ver seção acima)

## Próximos passos sugeridos

1. No servidor: `docker compose up -d` (backend + Postgres) e `docker compose exec backend npm run prisma:migrate` para criar as tabelas.
2. Testar o fluxo ponta a ponta pelo Painel (registro → serviços → profissionais → agenda).
3. Iniciar o projeto Android separado (`agendador-app-android/`) na Fase 6, consumindo os endpoints já disponíveis em `backend/src/modules/agendamento` e `backend/src/modules/auth`.
4. Substituir o stub de `push.service.ts` pela integração real com Firebase Admin SDK.
5. Decidir o canal do atendente virtual (WhatsApp Cloud API oficial x não-oficial) e escrever o adaptador de webhook correspondente.
