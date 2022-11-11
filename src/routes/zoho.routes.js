const tokenController = require('../controllers/handlers/token.handler');
const zohoController = require('../controllers/handlers/zoho.handler');
const exchangeController = require('../controllers/handlers/exchange.handler');
const verifyToken = require('../controllers/auth/verifyToken');

const generateZohoTokenOpts = {
  handler: tokenController.generateZohoTokenHandler,
};

const createOpeningbalanceOpts = {
  handler: zohoController.createOpeningBalanceHandler,
};

const refreshZohoTokenOpts = {
  handler: tokenController.refreshZohoTokenHandler,
};

const exchangeRateOpts = {
  handler: exchangeController.getExchangeRateHandler,
};

const updateExchangeRateOpts = {
  handler: exchangeController.updateExchangeRateHandler,
};

const generateReportOpts = {
  handler: zohoController.generateReportHandler,
};

const salesOrderOpts = {
  handler: zohoController.salesOrderHandler,
};

const zohoRoutes = async (fastify, options) => {
  fastify.get('/zoho/opening/balance/create', createOpeningbalanceOpts);

  fastify
    .register(require('@fastify/auth'))
    .after(() => privateRoutes(fastify));
};

const privateRoutes = async (fastify, options) => {
  // get exchange rate from zoho
  fastify.get('/zoho/exchange/rate/:number/:period', {
    preHandler: fastify.auth([verifyToken]),
    ...exchangeRateOpts,
  });

  fastify.put('/zoho/exchange/rate/:id', {
    preHandler: fastify.auth([verifyToken]),
    ...updateExchangeRateOpts,
  });

  // generate report from zoho
  fastify.post('/zoho/generate/report', {
    preHandler: fastify.auth([verifyToken]),
    ...generateReportOpts,
  });

  // get list of sales order
  fastify.post('/zoho/sales/order', {
    preHandler: fastify.auth([verifyToken]),
    ...salesOrderOpts,
  });

  // generate a zoho token
  fastify.post('/zoho/token/generate', {
    preHandler: fastify.auth([verifyToken]),
    ...generateZohoTokenOpts,
  });

  // refresh a zoho token
  fastify.get('/zoho/token/refresh', {
    preHandler: fastify.auth([verifyToken]),
    ...refreshZohoTokenOpts,
  });
};

module.exports = zohoRoutes;
