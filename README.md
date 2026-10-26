# Auto-company

Web API para controlar a utilização dos automóveis de uma empresa.

## Sobre o sistema

O Auto-company registra quais motoristas estão usando quais veículos da frota, quando e por quê.
Ele oferece três recursos:

- **Automóveis**: cadastro, atualização, exclusão, busca por id e listagem dos veículos, com
  filtros por cor e marca.
- **Motoristas**: cadastro, atualização, exclusão, busca por id e listagem dos motoristas, com
  filtro por nome.
- **Utilizações**: registro do início do uso de um automóvel por um motorista (data de início e
  motivo), finalização do uso (data de término) e listagem do histórico com o nome do motorista e
  as informações do automóvel.

E garante as regras de negócio:

- Um automóvel só pode ser utilizado por um motorista por vez.
- Um motorista que já esteja utilizando um automóvel não pode utilizar outro ao mesmo tempo.

### Tecnologias

- [Node.js](https://nodejs.org/) + [TypeScript](https://www.typescriptlang.org/)
- [Express 5](https://expressjs.com/) como framework HTTP
- [Firebase](https://firebase.google.com/) (Cloud Firestore + Authentication) como banco de dados
- [Swagger UI](https://swagger.io/tools/swagger-ui/) para documentação interativa
- [Jest](https://jestjs.io/) + [Supertest](https://github.com/ladjs/supertest) para testes
- [ESLint](https://eslint.org/) com `typescript-eslint`

## Pré-requisitos

- [Node.js](https://nodejs.org/) 22 ou superior (a versão recomendada está em `.nvmrc`)
- Uma conta Google para criar o projeto no [Firebase](https://console.firebase.google.com/)

## Como rodar o projeto

### 1. Configurar o Firebase

1. **Criar o projeto**: acesse o [Console do Firebase](https://console.firebase.google.com/),
   clique em **Adicionar projeto** e siga o assistente.
2. **Criar o banco de dados**: no menu lateral, vá em **Firestore Database** → **Criar banco de
   dados**. Escolha a localização (por exemplo, `southamerica-east1`) e inicie em **modo de
   produção** — as regras de acesso serão publicadas no passo 5.
3. **Registrar um app da Web**: em **Configurações do projeto** (ícone de engrenagem) → **Geral** →
   **Seus apps**, clique no ícone **`</>`** (Web), dê um nome e registre. Copie os valores do objeto
   `firebaseConfig` exibido; eles serão usados no `.env`.
4. **Ativar o login anônimo**: em **Authentication** → **Método de login**, ative o provedor
   **Anônimo**. A API faz login anônimo ao iniciar, e as regras do Firestore só liberam acesso a
   clientes autenticados.
5. **Publicar as regras de segurança**: em **Firestore Database** → **Regras**, substitua o conteúdo
   pelo do arquivo [`firestore.rules`](firestore.rules) e clique em **Publicar**. Como alternativa,
   use a Firebase CLI:

   ```bash
   npx firebase-tools login
   npx firebase-tools deploy --only firestore:rules --project <id-do-projeto>
   ```

### 2. Instalar as dependências

```bash
git clone https://github.com/GabrielArmond/auto-company.git
cd auto-company
npm install
```

### 3. Configurar as variáveis de ambiente

Crie o arquivo `.env` a partir do exemplo:

```bash
cp .env.example .env
```

Preencha com os valores do `firebaseConfig` copiados no passo 1.3:

| Variável                       | Valor no `firebaseConfig` | Descrição                              |
| ------------------------------ | ------------------------- | -------------------------------------- |
| `NODE_ENV`                     | —                         | `development` ou `production`          |
| `PORT`                         | —                         | Porta HTTP da API (padrão `3000`)      |
| `CORS_ORIGIN`                  | —                         | Origens liberadas no CORS (padrão `*`) |
| `FIREBASE_API_KEY`             | `apiKey`                  |                                        |
| `FIREBASE_AUTH_DOMAIN`         | `authDomain`              |                                        |
| `FIREBASE_PROJECT_ID`          | `projectId`               |                                        |
| `FIREBASE_STORAGE_BUCKET`      | `storageBucket`           |                                        |
| `FIREBASE_MESSAGING_SENDER_ID` | `messagingSenderId`       |                                        |
| `FIREBASE_APP_ID`              | `appId`                   |                                        |

> O arquivo `.env` está no `.gitignore` e não deve ser versionado.

### 4. Iniciar a API

Em desenvolvimento (reinicia automaticamente ao salvar):

```bash
npm run dev
```

Em produção:

```bash
npm run build
npm start
```

Se tudo estiver certo, o terminal mostra `Server running at http://localhost:3000 (development)`.
Para conferir, acesse http://localhost:3000/api/health.

## Usando a API

### Documentação interativa (Swagger)

Com a API rodando, acesse **http://localhost:3000/api/docs**. Lá estão todos os endpoints, com
exemplos de requisição e resposta. Para testar um endpoint, abra-o, clique em **Try it out**,
preencha os dados e clique em **Execute**.

O documento OpenAPI bruto fica em http://localhost:3000/api/docs.json (pode ser importado no
Postman ou Insomnia).

### Exemplo de fluxo completo

```bash
# 1. Cadastrar um automóvel (guarde o "id" retornado)
curl -X POST http://localhost:3000/api/vehicles \
  -H "Content-Type: application/json" \
  -d '{"plate": "ABC1D23", "color": "Preto", "brand": "Fiat"}'

# 2. Cadastrar um motorista (guarde o "id" retornado)
curl -X POST http://localhost:3000/api/drivers \
  -H "Content-Type: application/json" \
  -d '{"name": "João da Silva"}'

# 3. Iniciar a utilização do automóvel pelo motorista
curl -X POST http://localhost:3000/api/vehicle-usages \
  -H "Content-Type: application/json" \
  -d '{"vehicleId": "<ID_DO_AUTOMOVEL>", "driverId": "<ID_DO_MOTORISTA>", "reason": "Visita a cliente"}'

# 4. Listar as utilizações (com nome do motorista e dados do automóvel)
curl http://localhost:3000/api/vehicle-usages

# 5. Finalizar a utilização
curl -X PATCH http://localhost:3000/api/vehicle-usages/<ID_DA_UTILIZACAO>/finish
```

Enquanto a utilização do passo 3 estiver ativa, tentar usar o mesmo automóvel com outro motorista
(ou o mesmo motorista com outro automóvel) retorna **409 Conflict**.

## Endpoints

Todas as rotas ficam sob o prefixo `/api`. Os nomes de campos e rotas estão em inglês.

### Automóveis (`vehicles`)

| Método | Rota                | Descrição                                           |
| ------ | ------------------- | --------------------------------------------------- |
| GET    | `/api/vehicles`     | Lista (filtros opcionais: `?color=` e `?brand=`)    |
| GET    | `/api/vehicles/:id` | Busca pelo id                                       |
| POST   | `/api/vehicles`     | Cadastra `{ plate, color, brand }`                  |
| PUT    | `/api/vehicles/:id` | Atualiza `{ plate, color, brand }` (todos os campos) |
| DELETE | `/api/vehicles/:id` | Exclui                                              |

- **Placa** (`plate`): aceita o padrão antigo (`ABC1234`) e o Mercosul (`ABC1D23`). Hífens,
  espaços e letras minúsculas são normalizados (`abc-1d23` → `ABC1D23`). Não pode haver duas
  placas iguais (409).
- **Filtros**: comparam o valor inteiro, sem diferenciar maiúsculas de minúsculas
  (`?color=preto` encontra "Preto") e podem ser combinados.

### Motoristas (`drivers`)

| Método | Rota               | Descrição                        |
| ------ | ------------------ | -------------------------------- |
| GET    | `/api/drivers`     | Lista (filtro opcional: `?name=`) |
| GET    | `/api/drivers/:id` | Busca pelo id                    |
| POST   | `/api/drivers`     | Cadastra `{ name }`              |
| PUT    | `/api/drivers/:id` | Atualiza `{ name }`              |
| DELETE | `/api/drivers/:id` | Exclui                           |

- **Nome** (`name`): obrigatório, até 100 caracteres; espaços extras são removidos. Nomes
  repetidos são permitidos (homônimos).
- **Filtro por nome**: ignora maiúsculas/minúsculas e acentos e busca pelo início de qualquer
  palavra do nome — `joao`, `silva` e `jo sil` encontram "João da Silva".

### Utilizações (`vehicle-usages`)

| Método | Rota                             | Descrição                                                |
| ------ | -------------------------------- | -------------------------------------------------------- |
| GET    | `/api/vehicle-usages`            | Lista, da mais recente para a mais antiga                |
| GET    | `/api/vehicle-usages/:id`        | Busca pelo id                                            |
| POST   | `/api/vehicle-usages`            | Inicia `{ driverId, vehicleId, reason, startDate? }`     |
| PATCH  | `/api/vehicle-usages/:id/finish` | Finaliza `{ endDate? }`                                  |

Regras:

- Um automóvel só pode ser utilizado por um motorista por vez (409).
- Um motorista só pode utilizar um automóvel por vez (409).
- `startDate` e `endDate` são opcionais (padrão: data/hora atual), não podem estar no futuro, e o
  término não pode ser anterior ao início (400).
- Uma utilização só pode ser finalizada uma vez (409).
- Automóveis e motoristas com utilização em andamento não podem ser excluídos (409).
- Cada utilização guarda uma cópia dos dados do motorista e do automóvel no momento do início,
  então o histórico continua correto mesmo que eles sejam editados ou excluídos depois.

### Erros

As respostas de erro seguem o formato:

```json
{ "error": "Invalid data", "details": ["The \"plate\" field is required"] }
```

| Status | Quando                                                       |
| ------ | ------------------------------------------------------------ |
| 400    | Dados inválidos (os detalhes vêm em `details`)               |
| 404    | Registro ou rota não encontrados                             |
| 409    | Conflito: placa repetida, regra de utilização, exclusão bloqueada |

## Testes

Os testes não acessam o Firebase: os repositórios do Firestore são substituídos por
implementações em memória, então rodam sem configuração.

```bash
npm test                # executa todos os testes
npm run test:watch      # modo watch
npm run test:coverage   # relatório de cobertura em coverage/
```

### Scripts disponíveis

| Script                  | Descrição                                    |
| ----------------------- | -------------------------------------------- |
| `npm run dev`           | Inicia em modo desenvolvimento (`tsx watch`) |
| `npm run build`         | Compila o TypeScript para `dist/`            |
| `npm start`             | Inicia a versão compilada                    |
| `npm run typecheck`     | Verifica os tipos (código e testes)          |
| `npm test`              | Executa os testes                            |
| `npm run test:watch`    | Testes em modo watch                         |
| `npm run test:coverage` | Testes com relatório de cobertura            |
| `npm run lint`          | Executa o ESLint                             |

## Arquitetura

O código é organizado em camadas: **rotas → controllers → services → repositories**. As regras
de negócio ficam nos services, que dependem apenas de interfaces de repositório. Em produção essas
interfaces são implementadas com o Firestore; nos testes, em memória.

```
src/
  app.ts            # monta o app Express a partir dos services
  server.ts         # ponto de entrada: conecta ao Firebase e inicia o servidor
  container.ts      # liga os repositórios do Firestore aos services
  config/           # variáveis de ambiente e conexão com o Firebase
  docs/             # documento OpenAPI exibido pelo Swagger
  models/           # tipos das entidades
  validators/       # validação e normalização dos dados de entrada
  services/         # regras de negócio
  repositories/     # interfaces + implementação com Firestore
  controllers/      # camada HTTP
  routes/           # definição das rotas (/api/...)
  middlewares/      # rota não encontrada e tratamento de erros
  utils/            # utilitários (erros HTTP, busca por nome, etc.)
tests/
  support/          # repositórios em memória e app de teste
  unit/             # testes de validators, services e utilitários
  integration/      # testes das rotas HTTP com Supertest
```

### Dados no Firestore

| Coleção         | Conteúdo                                                                 |
| --------------- | ------------------------------------------------------------------------ |
| `vehicles`      | Automóveis                                                               |
| `drivers`       | Motoristas                                                               |
| `vehicleUsages` | Utilizações                                                              |
| `activeUsages`  | Travas das utilizações em andamento (`vehicle_<id>` e `driver_<id>`)     |

Alguns documentos guardam campos auxiliares de busca que não aparecem nas respostas da API:
`colorLower` e `brandLower` (filtros de automóveis sem diferenciar maiúsculas) e `nameSearch`
(prefixos das palavras do nome, para o filtro de motoristas).

As regras de utilização são garantidas em duas camadas. A API verifica antes de gravar e responde
com uma mensagem clara. O Firestore garante o mesmo de forma atômica: iniciar uma utilização cria
as travas em `activeUsages` dentro de uma transação, e finalizá-la as remove. As regras em
`firestore.rules` só aceitam uma nova utilização se as duas travas estavam livres e impedem
excluir automóveis ou motoristas com trava ativa — mesmo que alguém acesse o banco sem passar pela
API.

## Solução de problemas

| Mensagem / sintoma                                               | Causa e solução                                                                                 |
| ---------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `Missing Firebase environment variables: ...`                    | Falta o `.env` ou alguma variável `FIREBASE_*`. Veja o passo 3.                                 |
| `Anonymous sign-in is disabled...`                               | O login anônimo não está ativado. Veja o passo 1.4.                                             |
| `Missing or insufficient permissions` / `permission denied`      | As regras não foram publicadas ou estão desatualizadas. Publique o `firestore.rules` (passo 1.5). |
| Filtro não encontra registros cadastrados antes de uma atualização | Registros antigos não têm os campos de busca. Atualize o registro (`PUT`) para recriá-los.     |
