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

### Firebase setup

1. **Firestore**: create the database (Firebase Console → Firestore Database).
2. **Anonymous auth**: enable it in Firebase Console → Authentication → Sign-in method → Anonymous.
   The API uses the Firebase client SDK and signs in anonymously on startup.
3. **Security Rules**: publish [`firestore.rules`](firestore.rules). They only allow authenticated
   clients and validate the shape of each document. Either paste the file into Firebase Console →
   Firestore Database → Rules, or deploy with the Firebase CLI:

   ```bash
   npx firebase-tools deploy --only firestore:rules --project <your-project-id>
   ```

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
  docs/             # OpenAPI document served by Swagger UI
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

Interactive documentation (Swagger UI) is available at **`/api/docs`** — e.g.
http://localhost:3000/api/docs — where every endpoint can be tried out. The raw OpenAPI
document is served at `/api/docs.json` (source: `src/docs/openapi.ts`).

### Vehicles

| Method | Route                | Description                                       |
| ------ | -------------------- | ------------------------------------------------- |
| GET    | `/api/vehicles`      | List (optional filters: `?color=` and `?brand=`)  |
| GET    | `/api/vehicles/:id`  | Get by id                                         |
| POST   | `/api/vehicles`      | Create `{ plate, color, brand }`                  |
| PUT    | `/api/vehicles/:id`  | Update `{ plate, color, brand }`                  |
| DELETE | `/api/vehicles/:id`  | Delete                                            |

The plate is normalized (`abc-1d23` → `ABC1D23`), accepts the legacy Brazilian and Mercosur
formats, and must be unique (409 if duplicated). Filters match the whole value, ignoring case
(`?color=black` finds "Black"); lowercase copies (`colorLower`, `brandLower`) are stored in
Firestore for that and are not exposed by the API.

### Drivers

| Method | Route               | Description                          |
| ------ | ------------------- | ------------------------------------ |
| GET    | `/api/drivers`      | List (optional filter: `?name=`)     |
| GET    | `/api/drivers/:id`  | Get by id                            |
| POST   | `/api/drivers`      | Create `{ name }`                    |
| PUT    | `/api/drivers/:id`  | Update `{ name }`                    |
| DELETE | `/api/drivers/:id`  | Delete                               |

The name is trimmed (repeated spaces collapsed) and limited to 100 characters; homonyms are allowed.
The name filter ignores case and accents and matches the start of any word: `joao`, `silva` and
`jo sil` all find "João da Silva". For that, the prefixes of each word are stored in Firestore
(`nameSearch`), which is not exposed by the API.

### Vehicle usages

| Method | Route                              | Description                                           |
| ------ | ---------------------------------- | ----------------------------------------------------- |
| GET    | `/api/vehicle-usages`              | List, most recent first, with driver and vehicle data |
| GET    | `/api/vehicle-usages/:id`          | Get by id                                             |
| POST   | `/api/vehicle-usages`              | Start `{ driverId, vehicleId, reason, startDate? }`   |
| PATCH  | `/api/vehicle-usages/:id/finish`   | Finish `{ endDate? }`                                 |

Business rules:

- A vehicle can be used by only one driver at a time (409 otherwise).
- A driver can use only one vehicle at a time (409 otherwise).
- `startDate`/`endDate` default to now, cannot be in the future, and `endDate` cannot be before `startDate`.
- A usage can be finished only once (409 otherwise).
- Vehicles and drivers with an active usage cannot be deleted (409).

Each usage stores a snapshot of the driver (`id`, `name`) and the vehicle (`id`, `plate`, `color`,
`brand`) at the time it started, so the history stays accurate even if they are edited or deleted later.

The rules are checked by the service and also enforced atomically in Firestore: starting a usage
creates lock documents in `activeUsages` (`vehicle_<id>` and `driver_<id>`) inside a transaction,
and finishing it removes them. `firestore.rules` only accepts a usage when both locks were free,
and blocks deleting a vehicle or driver while its lock exists.

### Errors

Error responses follow the format `{ "error": "message", "details": ["..."] }`
(400 validation, 404 not found, 409 conflict).
