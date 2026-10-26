import { createApp } from './app';
import { config } from './config';
import { createContainer } from './container';

const app = createApp(createContainer());

const server = app.listen(config.port, () => {
  console.log(`Servidor rodando em http://localhost:${config.port} (${config.env})`);
});

function shutdown(signal: NodeJS.Signals) {
  console.log(`${signal} recebido, encerrando...`);
  server.close(() => process.exit(0));
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
