const zohoController = require('../controllers/handlers/token.handler');
const verifyToken = require("../controllers/auth/verifyToken");

const generateZohoTokenOpts = {
    handler: zohoController.generateZohoTokenHandler,
}


const zohoRoutes = async (fastify, options) => {
    fastify.register(require("@fastify/auth"))
        .after(() => privateRoutes(fastify))
}

const privateRoutes = async (fastify, options) => {
    // generate a zoho token
    fastify.post('/zoho/token/generate', {
        preHandler: fastify.auth([verifyToken]),
        ...generateZohoTokenOpts
    });
}

module.exports = zohoRoutes;