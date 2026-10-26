import { createApp } from './app';
import { config } from './config';
import { createContainer } from './container';

const app = createApp(createContainer());

const server = app.listen(config.port, () => {
  console.log(`Server running at http://localhost:${config.port} (${config.env})`);
});

function shutdown(signal: NodeJS.Signals) {
  console.log(`${signal} received, shutting down...`);
  server.close(() => process.exit(0));
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
