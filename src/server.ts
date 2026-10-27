import { createApp } from './app';
import { config } from './config';
import { createContainer } from './container';

async function main() {
  const app = createApp(await createContainer());

  const server = app.listen(config.port, () => {
    console.log(`Server running at http://localhost:${config.port} (${config.env}, ${config.database} database)`);
  });

  function shutdown(signal: NodeJS.Signals) {
    console.log(`${signal} received, shutting down...`);
    server.close(() => process.exit(0));
  }

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
