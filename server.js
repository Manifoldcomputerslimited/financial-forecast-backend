//load fastify itself
const app = require('fastify')({
  logger: true,
  trustProxy: true,
});
const config = require('./config');

const cors = require('@fastify/cors');
const fastifyFormbody = require('@fastify/formbody');
const fastifyAxios = require('fastify-axios');

// load fastify plugins
app
  .register(cors, {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  })
  .register(fastifyFormbody)
  .register(fastifyAxios, {
    clients: {
      zoho: {
        baseURL: 'https://www.zohoapis.com/crm/v2/',
        // headers: {
        //   Authorization: `Zoho-oauthtoken ${process.env.ZOHO_TOKEN}`,
        //   "Content-Type": "application/json",
        // },
      },
    },
  });

const db = require('./src/models');
db.sequelize.sync();

app.register(require('./src/routes/auth.routes.js'), { prefix: 'v1' });
app.register(require('./src/routes/zoho.routes.js'), { prefix: 'v1' });

// Declare a route
app.register(
  function (instance, options, next) {
    instance.setNotFoundHandler(function (request, reply) {
      reply.code(404).send({ message: "You're in the wrong place" });
    });
    next();
  },
  { prefix: '/' }
);

// Run the server!
const start = async () => {
  try {
    const PORT = parseInt(config.PORT);
    await app.listen({ port: PORT });
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};
start();

exports.default = app;
