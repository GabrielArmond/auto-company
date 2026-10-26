# auto-company

Web API para controle de utilização dos automóveis de uma empresa.
Node.js + TypeScript + Express 5, persistência no Firebase (Firestore) e testes com Jest + Supertest.

## Requisitos

- Node.js >= 22 (veja `.nvmrc`)
- Um projeto Firebase com Firestore habilitado

## Começando

```bash
npm install
cp .env.example .env   # preencha as variáveis FIREBASE_*
npm run dev            # http://localhost:3000 (reinicia ao salvar)
```

Os valores vêm da configuração do app web: Console do Firebase → Configurações do projeto →
Seus apps → App da Web → `firebaseConfig`. **Não versione o `.env`.**

A conexão usa o SDK cliente do Firebase, então o acesso ao Firestore passa pelas
**Security Rules** do projeto: elas precisam permitir leitura/escrita nas coleções usadas pela API.

## Scripts

| Script                  | Descrição                                   |
| ----------------------- | ------------------------------------------- |
| `npm run dev`           | Sobe com `tsx watch`                        |
| `npm run build`         | Compila para `dist/`                        |
| `npm start`             | Sobe a versão compilada                     |
| `npm run typecheck`     | Checa tipos (src + tests)                   |
| `npm test`              | Roda os testes                              |
| `npm run test:watch`    | Testes em modo watch                        |
| `npm run test:coverage` | Testes com relatório de cobertura           |
| `npm run lint`          | ESLint                                      |

## Estrutura

```
src/
  app.ts            # cria o app Express a partir dos services (sem listen)
  server.ts         # ponto de entrada: monta o container + listen
  container.ts      # liga repositórios do Firestore aos services
  config/           # variáveis de ambiente e inicialização do Firebase
  models/           # tipos das entidades
  validators/       # validação/normalização da entrada
  services/         # regras de negócio
  repositories/     # contratos + implementação Firestore
  controllers/      # camada HTTP
  routes/           # definição das rotas (/api/...)
  middlewares/      # 404 e tratamento de erros
tests/
  support/          # repositórios em memória (substituem o Firestore nos testes)
  unit/             # validators e services
  integration/      # rotas HTTP com supertest
```

## Endpoints

### Automóveis

| Método | Rota                   | Descrição                                      |
| ------ | ---------------------- | ---------------------------------------------- |
| GET    | `/api/automoveis`      | Lista (filtros opcionais: `?cor=` e `?marca=`) |
| GET    | `/api/automoveis/:id`  | Busca por id                                   |
| POST   | `/api/automoveis`      | Cadastra `{ placa, cor, marca }`               |
| PUT    | `/api/automoveis/:id`  | Atualiza `{ placa, cor, marca }`               |
| DELETE | `/api/automoveis/:id`  | Exclui                                         |

A placa é normalizada (`abc-1d23` → `ABC1D23`), aceita os padrões antigo e Mercosul e deve ser única (409 se repetida).
Os filtros comparam o valor exato (diferenciam maiúsculas de minúsculas).

### Erros

Respostas de erro seguem o formato `{ "error": "mensagem", "details": ["..."] }`
(400 validação, 404 não encontrado, 409 conflito).
