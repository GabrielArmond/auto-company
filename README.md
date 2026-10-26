# auto-company

Web API to manage the usage of a company's vehicles.
Node.js + TypeScript + Express 5, persisted in Firebase (Firestore), tested with Jest + Supertest.

## Requirements

- Node.js >= 22 (see `.nvmrc`)
- A Firebase project with Firestore enabled

## Getting started

```bash
npm install
cp .env.example .env   # fill in the FIREBASE_* variables
npm run dev            # http://localhost:3000 (restarts on save)
```

The values come from the web app config: Firebase Console → Project settings →
Your apps → Web app → `firebaseConfig`. **Do not commit `.env`.**

The connection uses the Firebase client SDK, so Firestore access goes through the project's
**Security Rules**: they must allow read/write on the collections used by the API.

## Scripts

| Script                  | Description                        |
| ----------------------- | ---------------------------------- |
| `npm run dev`           | Starts with `tsx watch`            |
| `npm run build`         | Compiles to `dist/`                |
| `npm start`             | Starts the compiled build          |
| `npm run typecheck`     | Type-checks (src + tests)          |
| `npm test`              | Runs the tests                     |
| `npm run test:watch`    | Tests in watch mode                |
| `npm run test:coverage` | Tests with coverage report         |
| `npm run lint`          | ESLint                             |

## Structure

```
src/
  app.ts            # builds the Express app from the services (no listen)
  server.ts         # entry point: builds the container + listen
  container.ts      # wires Firestore repositories into the services
  config/           # environment variables and Firebase initialization
  models/           # entity types
  validators/       # input validation/normalization
  services/         # business rules
  repositories/     # contracts + Firestore implementation
  controllers/      # HTTP layer
  routes/           # route definitions (/api/...)
  middlewares/      # 404 and error handling
tests/
  support/          # in-memory repositories (replace Firestore in tests)
  unit/             # validators and services
  integration/      # HTTP routes with supertest
```

## Endpoints

### Vehicles

| Method | Route                | Description                                       |
| ------ | -------------------- | ------------------------------------------------- |
| GET    | `/api/vehicles`      | List (optional filters: `?color=` and `?brand=`)  |
| GET    | `/api/vehicles/:id`  | Get by id                                         |
| POST   | `/api/vehicles`      | Create `{ plate, color, brand }`                  |
| PUT    | `/api/vehicles/:id`  | Update `{ plate, color, brand }`                  |
| DELETE | `/api/vehicles/:id`  | Delete                                            |

The plate is normalized (`abc-1d23` → `ABC1D23`), accepts the legacy Brazilian and Mercosur
formats, and must be unique (409 if duplicated). Filters match the exact value (case-sensitive).

### Errors

Error responses follow the format `{ "error": "message", "details": ["..."] }`
(400 validation, 404 not found, 409 conflict).
