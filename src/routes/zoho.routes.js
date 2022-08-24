const zohoController = require('../controllers/handlers/token.handler');
const exchangeController = require('../controllers/handlers/exchange.handler');
const verifyToken = require("../controllers/auth/verifyToken");

const generateZohoTokenOpts = {
    handler: zohoController.generateZohoTokenHandler,
}

const refreshZohoTokenOpts = {
    handler: zohoController.refreshZohoTokenHandler,
}

const exchangeRateOpts = {
    handler: exchangeController.exchangeRateHandler,
}


const zohoRoutes = async (fastify, options) => {
    // generate a exchange rate
    fastify.post('/zoho/exchange/rate', exchangeRateOpts);


    fastify.register(require("@fastify/auth"))
        .after(() => privateRoutes(fastify))
}

const privateRoutes = async (fastify, options) => {
    // generate a zoho token
    fastify.post('/zoho/token/generate', {
        preHandler: fastify.auth([verifyToken]),
        ...generateZohoTokenOpts
    });

    // refresh a zoho token
    fastify.get('/zoho/token/refresh', {
        preHandler: fastify.auth([verifyToken]),
        ...refreshZohoTokenOpts,
    });

}

module.exports = zohoRoutes;