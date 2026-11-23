Enciclopédia de Digimon.

## Como rodar

Precisa do Node.js 20 ou mais novo.

Na primeira vez, instale as dependências, crie o `.env` e monte o banco:

```bash
npm install
cp .env.example .env
npm run setup
```

O `npm run setup` cria o banco SQLite (`dev.db`), grava os dados iniciais e importa os Digimon e as imagens da DigiAPI, então precisa de internet e leva alguns minutos.

Depois disso, para abrir o site:

```bash
npm run dev
```

O site fica em http://localhost:3000.

Para testar a versão de produção:

```bash
npm run preview
```

O site fica em http://localhost:3001.

## Outros comandos

| Comando | O que faz |
| --- | --- |
| `npm run db:reset` | Apaga o banco e monta tudo de novo |
| `npm run db:seed` | Grava só os dados iniciais |
| `npm run db:import` | Baixa e importa os Digimon da DigiAPI |
| `npm run db:images` | Importa as imagens |
| `npm run lint` | Confere os tipos do TypeScript |
