//load fastify itself
const app = require("fastify")({
  logger: true,
  trustProxy: true,
});

// Declare a route
app.get("/", async (request, reply) => {
  return { hello: "Welcome to Manifold API" };
});

// Run the server!
const start = async () => {
  try {
    await app.listen({ port: 3000 });
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};
start();
