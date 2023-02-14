const status = require('../helpers/status');

const addOverdraftOpts = {
  tags: ['Overdraft'],
  description: 'Add an overdraft account balance',
  body: {
    required: [
      'accountId',
      'accountName',
      'accountType',
      'accountNumber',
      'bankName',
      'currency',
      'amount',
    ],
    type: 'object',
    properties: {
      accountId: {
        type: 'string',
        description: 'Bank account id',
      },
      accountName: {
        type: 'string',
        description: 'Bank account name',
      },
      accountType: {
        type: 'string',
        description: 'Bank account type',
      },
      accountNumber: {
        type: 'string',
        description: 'The account number',
      },
      bankName: {
        type: 'string',
        description: 'Bank name',
      },
      currency: {
        type: 'string',
        description: 'The currency of the bank account',
      },
      amount: {
        type: 'string',
        description: 'Overdraft/loan amount for this bank account',
      },
    },
  },
  response: {
    200: status.success,
    204: status.noConent,
    400: status.badRequest,
    500: status.internalServer,
  },
  logLevel: 'debug',
};

module.exports = {
  addOverdraftOpts,
};
