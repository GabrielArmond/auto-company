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
- [Firebase](https://firebase.google.com/) (Cloud Firestore, via Firebase Admin SDK) como banco de
  dados, ou um banco em memória para rodar sem nenhuma configuração
- [Docker Compose](https://docs.docker.com/compose/) para subir a API com o emulador do Firestore
- [Swagger UI](https://swagger.io/tools/swagger-ui/) para documentação interativa
- [Jest](https://jestjs.io/) + [Supertest](https://github.com/ladjs/supertest) para testes
- [ESLint](https://eslint.org/) com `typescript-eslint`

## Como rodar o projeto

A API pode guardar os dados de três formas, escolhidas pela variável `DATABASE`:

| Modo                                                   | Precisa de                     | Os dados                          |
| ------------------------------------------------------ | ------------------------------ | --------------------------------- |
| [Em memória](#opção-1-em-memória-mais-rápido) (padrão) | Node.js 22+                    | Somem ao reiniciar a API          |
| [Emulador do Firestore](#opção-2-docker-com-o-emulador-do-firestore) | Docker           | Ficam no container até ele parar  |
| [Firebase real](#opção-3-projeto-real-no-firebase)     | Node.js 22+ e uma conta Google | Ficam no Firestore                |

Nos três casos a API, as regras de negócio e as rotas são as mesmas; só muda onde os dados são
gravados. Para avaliar o projeto, a **opção 1** basta. A **opção 2** mostra a integração com o
Firestore sem precisar criar conta.

### Opção 1: em memória (mais rápido)

```bash
git clone https://github.com/GabrielArmond/auto-company.git
cd auto-company
npm install
cp .env.example .env
npm run dev
```

O terminal mostra `Server running at http://localhost:3000 (development, memory database)`.
Abra **http://localhost:3000/api/docs** e use a chave de demonstração do `.env.example`
(`local-demo-api-key-change-me-0123456789`) no botão **Authorize**.

### Opção 2: Docker com o emulador do Firestore

```bash
git clone https://github.com/GabrielArmond/auto-company.git
cd auto-company
docker compose up --build
```

O Compose sobe dois containers:

- **`firestore`**: o emulador oficial do Firestore (parte do `firebase-tools`), que roda
  localmente e não precisa de conta Google nem de credenciais. A interface do emulador, em
  **http://localhost:4000/firestore**, mostra os documentos gravados em tempo real.
- **`api`**: a API compilada, ligada ao emulador (`DATABASE=firestore` e
  `FIRESTORE_EMULATOR_HOST=firestore:8080`). Ela só inicia depois que o emulador estiver pronto.

A API fica em **http://localhost:3000/api/docs**, com a mesma chave de demonstração da opção 1.
Para trocar a chave ou a porta:

```bash
API_KEYS=<sua-chave> API_PORT=3001 docker compose up --build
```

> O Compose também lê o `.env` da pasta. Se ele existir, a `API_KEYS` dele é a que vale.

Para usar o emulador com a API rodando fora do Docker (por exemplo, com `npm run dev`), suba só o
emulador com `docker compose up firestore` e use no `.env`:

```bash
DATABASE=firestore
FIRESTORE_EMULATOR_HOST=localhost:8080
```

### Opção 3: projeto real no Firebase

#### 1. Configurar o Firebase

1. **Criar o projeto**: acesse o [Console do Firebase](https://console.firebase.google.com/),
   clique em **Adicionar projeto** e siga o assistente.
2. **Criar o banco de dados**: no menu lateral, vá em **Firestore Database** → **Criar banco de
   dados**. Escolha a localização (por exemplo, `southamerica-east1`) e inicie em **modo de
   produção**.
3. **Gerar a chave da conta de serviço**: em **Configurações do projeto** (ícone de engrenagem) →
   **Contas de serviço**, clique em **Gerar nova chave privada**. Um arquivo JSON será baixado; os
   campos `project_id`, `client_email` e `private_key` dele serão usados no `.env`.

   > Essa chave dá acesso total ao banco. Guarde-a em local seguro, nunca a versione e, se ela
   > vazar, revogue-a na mesma tela.
4. **Publicar as regras de segurança**: em **Firestore Database** → **Regras**, substitua o conteúdo
   pelo do arquivo [`firestore.rules`](firestore.rules) e clique em **Publicar**. Elas negam todo
   acesso direto ao banco; só a API, que usa o Admin SDK, consegue ler e gravar. Como alternativa,
   use a Firebase CLI:

   ```bash
   npx firebase-tools login
   npx firebase-tools deploy --only firestore:rules --project <id-do-projeto>
   ```

#### 2. Configurar e iniciar

```bash
npm install
cp .env.example .env
```

No `.env`, defina `DATABASE=firestore`, descomente as variáveis `FIREBASE_*` e preencha com os
dados do JSON. Depois inicie com `npm run dev`.

### Variáveis de ambiente

| Variável                  | Descrição                                                                      |
| ------------------------- | ------------------------------------------------------------------------------ |
| `NODE_ENV`                | `development` ou `production`                                                  |
| `PORT`                    | Porta HTTP da API (padrão `3000`)                                              |
| `CORS_ORIGIN`             | Origem liberada no CORS (padrão `*`); veja [CORS](#cors)                       |
| `API_KEYS`                | Chaves de acesso à API, separadas por vírgula (mínimo de 32 caracteres cada)   |
| `RATE_LIMIT_WINDOW_MS`    | Janela do limite de requisições, em milissegundos (padrão `60000`)             |
| `RATE_LIMIT_MAX`          | Requisições permitidas por IP em cada janela (padrão `100`)                    |
| `TRUST_PROXY`             | Quantidade de proxies reversos na frente da API (padrão `0`)                   |
| `DATABASE`                | `memory` (padrão) ou `firestore`                                               |
| `FIRESTORE_EMULATOR_HOST` | Endereço do emulador (ex.: `localhost:8080`); dispensa as credenciais abaixo   |
| `FIREBASE_PROJECT_ID`     | Campo `project_id` do JSON da conta de serviço                                 |
| `FIREBASE_CLIENT_EMAIL`   | Campo `client_email` do JSON                                                   |
| `FIREBASE_PRIVATE_KEY`    | Campo `private_key` do JSON, entre aspas duplas e com os `\n` mantidos         |

A chave de `API_KEYS` do `.env.example` serve só para testes locais. Em qualquer ambiente
acessível por outras pessoas, gere uma chave aleatória:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Aceitar mais de uma chave permite trocá-las sem interromper os clientes: adicione a nova, atualize
os clientes e depois remova a antiga.

> O arquivo `.env` está no `.gitignore` e não deve ser versionado.

### Build de produção

```bash
npm run build
npm start
```

## Usando a API

### Autenticação

Todas as rotas, exceto `/api/health` e a documentação (`/api/docs`), exigem uma das chaves de
`API_KEYS` no cabeçalho `X-API-Key`. Sem ela, ou com uma chave errada, a API responde
**401 Unauthorized**.

```bash
curl http://localhost:3000/api/vehicles -H "X-API-Key: local-demo-api-key-change-me-0123456789"
```

### Limite de requisições

Cada IP pode fazer até `RATE_LIMIT_MAX` requisições (padrão 100) a cada `RATE_LIMIT_WINDOW_MS`
(padrão 1 minuto). Acima disso, a API responde **429 Too Many Requests** com o cabeçalho
`Retry-After`, que informa em quantos segundos tentar de novo. Toda resposta traz os cabeçalhos
`RateLimit` e `RateLimit-Policy` com o limite e quantas requisições restam. `/api/health` e a
documentação ficam fora do limite.

As requisições com chave de API errada também contam, o que impede tentar adivinhar a chave por
força bruta.

Se a API estiver atrás de um proxy reverso (load balancer, Nginx, Cloud Run etc.), defina
`TRUST_PROXY` com a quantidade de proxies (normalmente `1`). Sem isso, todos os clientes parecem vir
do IP do proxy e dividem o mesmo limite. Já um valor maior que o real permite que um cliente forje o
cabeçalho `X-Forwarded-For` e escape do limite; por isso `true` não é aceito.

> O contador fica na memória de cada instância da API. Com várias instâncias, cada uma conta
> separadamente; nesse caso, use um store compartilhado (como Redis) no `express-rate-limit`.

### Documentação interativa (Swagger)

Com a API rodando, acesse **http://localhost:3000/api/docs**. Lá estão todos os endpoints, com
exemplos de requisição e resposta. Para testar, clique em **Authorize**, informe a chave de API e
confirme. Depois abra um endpoint, clique em **Try it out**, preencha os dados e clique em
**Execute**.

O documento OpenAPI bruto fica em http://localhost:3000/api/docs.json (pode ser importado no
Postman ou Insomnia).

A documentação é pública de propósito; veja [Swagger em produção](#swagger-em-produção).

### Exemplo de fluxo completo

```bash
export API_KEY=local-demo-api-key-change-me-0123456789

# 1. Cadastrar um automóvel (guarde o "id" retornado)
curl -X POST http://localhost:3000/api/vehicles \
  -H "X-API-Key: $API_KEY" -H "Content-Type: application/json" \
  -d '{"plate": "ABC1D23", "color": "Preto", "brand": "Fiat"}'

# 2. Cadastrar um motorista (guarde o "id" retornado)
curl -X POST http://localhost:3000/api/drivers \
  -H "X-API-Key: $API_KEY" -H "Content-Type: application/json" \
  -d '{"name": "João da Silva"}'

# 3. Iniciar a utilização do automóvel pelo motorista
curl -X POST http://localhost:3000/api/vehicle-usages \
  -H "X-API-Key: $API_KEY" -H "Content-Type: application/json" \
  -d '{"vehicleId": "<ID_DO_AUTOMOVEL>", "driverId": "<ID_DO_MOTORISTA>", "reason": "Visita a cliente"}'

# 4. Listar as utilizações (com nome do motorista e dados do automóvel), paginadas em "data"
curl http://localhost:3000/api/vehicle-usages -H "X-API-Key: $API_KEY"

# 5. Finalizar a utilização
curl -X PATCH http://localhost:3000/api/vehicle-usages/<ID_DA_UTILIZACAO>/finish -H "X-API-Key: $API_KEY"
```

Enquanto a utilização do passo 3 estiver ativa, tentar usar o mesmo automóvel com outro motorista
(ou o mesmo motorista com outro automóvel) retorna **409 Conflict**.

## Endpoints

Todas as rotas ficam sob o prefixo `/api`. Os nomes de campos e rotas estão em inglês.

### Paginação

As listagens (`GET /api/vehicles`, `/api/drivers` e `/api/vehicle-usages`) são paginadas e
respondem neste formato:

```json
{ "data": [ ... ], "nextCursor": "q8Zt1nV3kXyP" }
```

| Parâmetro | Descrição                                                            |
| --------- | -------------------------------------------------------------------- |
| `limit`   | Itens por página, de 1 a 100 (padrão `20`)                           |
| `cursor`  | O `nextCursor` da página anterior; sem ele, vem a primeira página    |

Para percorrer tudo, repita a chamada passando o `nextCursor` recebido até ele vir `null`:

```bash
curl "http://localhost:3000/api/vehicles?limit=50" -H "X-API-Key: $API_KEY"
curl "http://localhost:3000/api/vehicles?limit=50&cursor=<nextCursor>" -H "X-API-Key: $API_KEY"
```

O cursor é o id do último item da página, e não um número de página. Assim, cada página é lida
diretamente a partir desse ponto, sem reler as anteriores, e cadastros feitos durante a navegação
não fazem itens se repetirem ou serem pulados. Automóveis e motoristas são ordenados pelo id, e as
utilizações, da mais recente para a mais antiga. Um `limit` ou `cursor` inválido retorna 400.

### Automóveis (`vehicles`)

| Método | Rota                         | Descrição                                            |
| ------ | ---------------------------- | ---------------------------------------------------- |
| GET    | `/api/vehicles`              | Lista paginada (filtros: `?color=` e `?brand=`)      |
| GET    | `/api/vehicles/:id`          | Busca pelo id                                        |
| GET    | `/api/vehicles/plate/:plate` | Busca pela placa                                     |
| POST   | `/api/vehicles`              | Cadastra `{ plate, color, brand }`                   |
| PUT    | `/api/vehicles/:id`          | Atualiza `{ plate, color, brand }` (todos os campos) |
| DELETE | `/api/vehicles/:id`          | Exclui                                               |

- **Placa** (`plate`): aceita o padrão antigo (`ABC1234`) e o Mercosul (`ABC1D23`). Hífens,
  espaços e letras minúsculas são normalizados (`abc-1d23` → `ABC1D23`). Não pode haver duas
  placas iguais (409), nem mesmo em cadastros simultâneos.
- **Cor e marca** (`color`, `brand`): obrigatórias, até 50 caracteres cada.
- **Busca pela placa**: a placa informada na URL passa pela mesma normalização, então
  `/api/vehicles/plate/abc-1d23` encontra o veículo `ABC1D23`. Retorna 404 se não houver veículo
  com a placa.
- **Filtros**: comparam o valor inteiro, sem diferenciar maiúsculas de minúsculas
  (`?color=preto` encontra "Preto") e podem ser combinados.

### Motoristas (`drivers`)

| Método | Rota               | Descrição                        |
| ------ | ------------------ | -------------------------------- |
| GET    | `/api/drivers`     | Lista paginada (filtro: `?name=`) |
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
| GET    | `/api/vehicle-usages`            | Lista paginada, da mais recente para a mais antiga       |
| GET    | `/api/vehicle-usages/:id`        | Busca pelo id                                            |
| POST   | `/api/vehicle-usages`            | Inicia `{ driverId, vehicleId, reason, startDate? }`     |
| PATCH  | `/api/vehicle-usages/:id/finish` | Finaliza `{ endDate? }`                                  |

Regras:

- Um automóvel só pode ser utilizado por um motorista por vez (409).
- Um motorista só pode utilizar um automóvel por vez (409).
- `startDate` e `endDate` são opcionais (padrão: data/hora atual), não podem estar no futuro, e o
  término não pode ser anterior ao início (400).
- Uma utilização só pode ser finalizada uma vez (409).
- Uma utilização retroativa não pode se sobrepor ao histórico: o `startDate` não pode ser anterior
  ao término da última utilização do mesmo automóvel nem do mesmo motorista (409). Começar
  exatamente no horário em que a anterior terminou é permitido.
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
| 400    | Dados inválidos (os detalhes vêm em `details`) ou JSON malformado |
| 401    | Chave de API ausente ou inválida                             |
| 404    | Registro ou rota não encontrados                             |
| 409    | Conflito: placa repetida, regra de utilização, exclusão bloqueada |
| 413    | Corpo da requisição acima de 100 KB                          |
| 429    | Limite de requisições excedido (veja `Retry-After`)          |
| 500    | Erro inesperado                                              |

Os ids aceitam apenas letras, números, `-` e `_`, com até 128 caracteres. Um id fora desse formato
na URL retorna 404 (o registro não pode existir); em `driverId` ou `vehicleId` no corpo, retorna 400.

Erros inesperados sempre respondem `{ "error": "Internal Server Error" }`, em qualquer ambiente. A
mensagem original, que pode conter detalhes internos do banco, aparece apenas no log do servidor.

## Segurança em produção

A configuração padrão foi pensada para rodar localmente sem atrito. Antes de publicar a API,
revise os pontos abaixo.

| Item                     | O que fazer                                                                    |
| ------------------------ | ------------------------------------------------------------------------------ |
| `API_KEYS`               | Trocar a chave de demonstração por chaves aleatórias (veja Variáveis de ambiente) |
| `NODE_ENV`               | Definir `production`                                                           |
| `CORS_ORIGIN`            | Restringir à origem do front-end, se houver (veja [CORS](#cors))               |
| `TRUST_PROXY`            | Definir a quantidade de proxies, se houver (veja Limite de requisições)        |
| HTTPS                    | Servir a API apenas por HTTPS, já que a chave viaja no cabeçalho `X-API-Key`. O TLS fica a cargo da plataforma ou do proxy reverso |
| Conta de serviço         | Guardar o JSON fora do repositório e revogar a chave se ela vazar              |
| Swagger                  | Decidir se continua público (veja [Swagger em produção](#swagger-em-produção)) |

### CORS

O CORS controla quais sites podem chamar a API **a partir do navegador** dos usuários. Ele não
protege a API de chamadas feitas por outros servidores, `curl` ou Postman; quem faz isso é a chave
de API.

O padrão `CORS_ORIGIN=*` libera qualquer site. O risco é baixo nesta API, porque ela não usa cookies
nem sessões: um site malicioso não consegue aproveitar credenciais guardadas no navegador da
vítima, e sem a chave de API as requisições recebem 401. Ainda assim, em produção é recomendado
restringir à origem do front-end que vai consumir a API, para reduzir a superfície de ataque:

```bash
CORS_ORIGIN=https://frota.minhaempresa.com.br
```

- Informe a origem completa (protocolo, domínio e porta, se não for a padrão), sem `/` no final.
- Hoje a variável aceita **uma única origem**. Liberar várias exigiria passar uma lista ao
  middleware `cors` em `src/app.ts`.
- Se a API só for chamada por outros servidores, não há front-end para liberar; qualquer origem
  específica serve, já que o CORS não se aplica a essas chamadas.

### Swagger em produção

`/api/docs` (Swagger UI) e `/api/docs.json` (documento OpenAPI) ficam públicos e fora do limite de
requisições. É uma escolha consciente: a documentação é a forma principal de testar a API.

O que ela expõe é o mapa da API: rotas, campos e formatos de resposta. Ela **não** expõe dados nem
permite executar nada sem a chave, porque o botão **Execute** faz requisições normais à API, que
exigem o `X-API-Key` e respondem 401 sem ele. A chave informada em **Authorize** fica salva apenas
no navegador de quem a digitou.

Esconder a documentação não torna a API mais segura, só mais difícil de explorar; a proteção real
está na chave de API, no limite de requisições e nas validações. Se ainda assim a empresa preferir
não divulgar o mapa da API, as opções são:

- **Remover a documentação em produção**: registrar as rotas `/api/docs` e `/api/docs.json` em
  `src/app.ts` só quando `NODE_ENV` não for `production`.
- **Restringir na infraestrutura**: liberar `/api/docs` apenas para a rede interna ou VPN no proxy
  reverso ou no firewall da plataforma.

## Testes

Os testes não acessam o Firebase: usam os repositórios em memória, então rodam sem
configuração.

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
de negócio ficam nos services, que dependem apenas de interfaces de repositório. Cada interface tem
duas implementações, uma com o Firestore e outra em memória, e o `container.ts` escolhe qual usar
pela variável `DATABASE`. Os testes usam as implementações em memória.

```
src/
  app.ts            # monta o app Express a partir dos services
  server.ts         # ponto de entrada: conecta ao Firebase e inicia o servidor
  container.ts      # escolhe os repositórios (memória ou Firestore) e monta os services
  config/           # variáveis de ambiente e conexão com o Firebase
  docs/             # documento OpenAPI exibido pelo Swagger
  models/           # tipos das entidades
  validators/       # validação e normalização dos dados de entrada
  services/         # regras de negócio
  repositories/     # interfaces + implementações com Firestore (firestore/) e em memória (memory/)
  controllers/      # camada HTTP
  routes/           # definição das rotas (/api/...)
  middlewares/      # autenticação por chave de API, rota não encontrada e erros
  utils/            # utilitários (erros HTTP, busca por nome, etc.)
tests/
  support/          # app e cliente HTTP de teste
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
| `usageHistory`  | Fim da última utilização de cada automóvel e motorista (`lastEndDate`)   |
| `vehiclePlates` | Trava de cada placa cadastrada (id = placa, com o `vehicleId` dono)      |

Alguns documentos guardam campos auxiliares de busca que não aparecem nas respostas da API:
`colorLower` e `brandLower` (filtros de automóveis sem diferenciar maiúsculas) e `nameSearch`
(prefixos das palavras do nome, para o filtro de motoristas).

As regras de negócio são garantidas em duas camadas. A API verifica antes de gravar e responde
com uma mensagem clara. O Firestore garante o mesmo de forma atômica, com transações, então duas
requisições simultâneas nunca passam juntas pela verificação:

- **Uma utilização por vez**: iniciar uma utilização cria as travas em `activeUsages` dentro de uma
  transação, que falha se alguma delas já existir; finalizá-la as remove.
- **Exclusão x início de utilização**: excluir um automóvel ou motorista confere, na mesma
  transação, que não há trava em `activeUsages`; iniciar uma utilização confere, na sua transação,
  que o automóvel e o motorista ainda existem. Se as duas operações acontecerem ao mesmo tempo, só
  uma delas vence: ou a exclusão é recusada (409), ou o início responde 404.
- **Sem sobreposição no histórico**: ao finalizar uma utilização, o término é gravado em
  `usageHistory` para o automóvel e para o motorista. Ao iniciar outra, a mesma transação confere
  que o `startDate` não é anterior a esses términos. Guardar só o último término evita reler todo
  o histórico a cada nova utilização.
- **Placa única**: cadastrar um automóvel ou trocar sua placa cria a trava `vehiclePlates/<placa>` na
  mesma transação; trocar a placa ou excluir o automóvel libera a anterior. A transação também
  consulta a coleção `vehicles`, o que cobre automóveis cadastrados antes de as travas existirem.

> Utilizações finalizadas antes da criação de `usageHistory` não têm o término registrado; a
> verificação de sobreposição vale a partir das próximas finalizações.

Somente a API acessa o banco. Ela usa o Firebase Admin SDK com a conta de serviço, que ignora as
regras de segurança, enquanto o [`firestore.rules`](firestore.rules) nega qualquer outro acesso.
Assim, ninguém consegue ler ou gravar dados sem passar pelas validações da API.

## Solução de problemas

| Mensagem / sintoma                                               | Causa e solução                                                                                 |
| ---------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `Missing API_KEYS environment variable`                          | Falta o `.env` ou a variável `API_KEYS`. Rode `cp .env.example .env`.                           |
| `Each API key must have at least 32 characters`                  | Alguma chave em `API_KEYS` é curta demais. Gere uma nova (veja Variáveis de ambiente).          |
| `Invalid DATABASE "..."`                                         | `DATABASE` aceita apenas `memory` ou `firestore`.                                               |
| `Missing Firebase environment variables: ...`                    | `DATABASE=firestore` sem emulador e sem as variáveis `FIREBASE_*`. Veja a opção 2 ou a 3.       |
| `Failed to parse private key` / `Invalid PEM`                    | `FIREBASE_PRIVATE_KEY` mal copiada. Use aspas duplas e mantenha os `\n` do JSON.               |
| `16 UNAUTHENTICATED` / `7 PERMISSION_DENIED` ao iniciar          | Chave da conta de serviço revogada ou de outro projeto. Gere uma nova (opção 3, passo 3).       |
| `ECONNREFUSED ...:8080` ao iniciar                               | O emulador não está rodando. Suba com `docker compose up firestore`.                            |
| `Invalid TRUST_PROXY "..."`                                      | `TRUST_PROXY` aceita apenas um número inteiro (a quantidade de proxies). Veja Limite de requisições. |
| `429` com `Too many requests...`                                 | Limite de requisições atingido. Aguarde os segundos de `Retry-After` ou aumente `RATE_LIMIT_MAX`. |
| `401` com `Invalid or missing API key`                           | Envie o cabeçalho `X-API-Key` com uma das chaves de `API_KEYS`.                                 |
| `address already in use` / `port is already allocated`           | A porta já está ocupada. Mude `PORT` no `.env` ou use `API_PORT=3001 docker compose up`.        |
| Filtro não encontra registros cadastrados antes de uma atualização | Registros antigos não têm os campos de busca. Atualize o registro (`PUT`) para recriá-los.     |
