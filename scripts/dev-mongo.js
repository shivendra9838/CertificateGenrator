const { MongoMemoryServer } = require('mongodb-memory-server');

(async () => {
  const mongo = await MongoMemoryServer.create({
    instance: {
      port: 27017,
      dbName: 'certificate_generator',
    },
  });

  console.log(`MongoMemoryServer ${mongo.getUri()}`);

  const stop = async () => {
    await mongo.stop();
    process.exit(0);
  };

  process.on('SIGTERM', stop);
  process.on('SIGINT', stop);
  setInterval(() => undefined, 1000);
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
