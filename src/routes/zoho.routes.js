const zohoController = require('../controllers/handlers/zoho.handler');

const generateZohoTokenOpts = {
    handler: zohoController.generateZohoTokenHandler,
}


const zohoRoutes = async (fastify, options) => {
    // generate a zoho token
    fastify.post('/zoho/token/generate', generateZohoTokenOpts);
}

module.exports = zohoRoutes;