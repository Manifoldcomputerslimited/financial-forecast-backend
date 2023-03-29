const { default: axios } = require('axios');
const db = require('../../models');
const { Op } = require('sequelize');
let moment = require('moment');
const config = require('../../../config');
const {
  createZohoRate,
  createOpeningBalance,
  createBankAccounts,
  getTodayDayOpeningBalance,
} = require('../../helpers/dbQuery');

const InvoiceForecast = db.invoiceForecasts;
const SaleForecast = db.saleForecasts;
const PurchaseForecast = db.purchaseForecasts;
const BillForecast = db.billForecasts;
const Invoice = db.invoices;
const Sale = db.sales;
const Purchase = db.purchases;
const CustomerPayment = db.customerPayments;
const VendorPayment = db.vendorPayments;
const Bill = db.bills;
const InitialBalance = db.initialBalances;
const BankAccount = db.bankAccounts;
const Rate = db.rates;
const Overdraft = db.overdrafts;
const OpeningBalance = db.openingBalances;

const resyncHandler = async (req, reply) => {
  const TODAY_START = moment().startOf('day').format();
  const TODAY_END = moment().endOf('day').format();
  try {
    const userId = req.user.id;

    await InitialBalance.destroy({
      where: {
        userId: userId,
        updatedAt: {
          [Op.gt]: TODAY_START,
          [Op.lt]: TODAY_END,
        },
      },
    });

    await InvoiceForecast.destroy({
      where: {
        userId: userId,
        updatedAt: {
          [Op.gt]: TODAY_START,
          [Op.lt]: TODAY_END,
        },
      },
    });

    await SaleForecast.destroy({
      where: {
        userId: userId,
        updatedAt: {
          [Op.gt]: TODAY_START,
          [Op.lt]: TODAY_END,
        },
      },
    });

    await PurchaseForecast.destroy({
      where: {
        userId: userId,
        updatedAt: {
          [Op.gt]: TODAY_START,
          [Op.lt]: TODAY_END,
        },
      },
    });

    await BillForecast.destroy({
      where: {
        userId: userId,
        updatedAt: {
          [Op.gt]: TODAY_START,
          [Op.lt]: TODAY_END,
        },
      },
    });

    await Invoice.destroy({
      where: {
        userId: userId,
        updatedAt: {
          [Op.gt]: TODAY_START,
          [Op.lt]: TODAY_END,
        },
      },
    });

    await Sale.destroy({
      where: {
        userId: userId,
        updatedAt: {
          [Op.gt]: TODAY_START,
          [Op.lt]: TODAY_END,
        },
      },
    });

    await Purchase.destroy({
      where: {
        userId: userId,
        updatedAt: {
          [Op.gt]: TODAY_START,
          [Op.lt]: TODAY_END,
        },
      },
    });

    await Bill.destroy({
      where: {
        userId: userId,
        updatedAt: {
          [Op.gt]: TODAY_START,
          [Op.lt]: TODAY_END,
        },
      },
    });

    await CustomerPayment.destroy({
      where: {
        userId: userId,
        updatedAt: {
          [Op.gt]: TODAY_START,
          [Op.lt]: TODAY_END,
        },
      },
    });

    await VendorPayment.destroy({
      where: {
        userId: userId,
        updatedAt: {
          [Op.gt]: TODAY_START,
          [Op.lt]: TODAY_END,
        },
      },
    });

    await Rate.destroy({
      where: {
        userId: userId,
        updatedAt: {
          [Op.gt]: TODAY_START,
          [Op.lt]: TODAY_END,
        },
      },
    });

    statusCode = 204;

    result = {
      status: true,
      message: 'Resynced successfully',
    };
  } catch (e) {
    statusCode = e.code;
    result = {
      status: false,
      message: e.message,
    };
  }

  return reply.status(statusCode).send(result);
};

const bankAccountsHandler = async (req, reply) => {
  const YESTERDAY_START = moment().subtract(1, 'days').startOf('day').format();
  const YESTERDAY_END = moment().subtract(1, 'days').endOf('day').format();
  try {
    let bankAccounts = await BankAccount.findAll({
      where: {
        createdAt: {
          [Op.gt]: YESTERDAY_START,
          [Op.lt]: YESTERDAY_END,
        },
      },
    });

    statusCode = 200;

    result = {
      status: true,
      message: 'Opening bank accounts fetched successfully',
      data: bankAccounts,
    };
  } catch (e) {
    statusCode = e.code;
    result = {
      status: false,
      message: e.message,
    };
  }

  return reply.status(statusCode).send(result);
};

// This function will be executed by a CRON JOB daily
// stores todays exchange rate and opening in the database
const createOpeningBalanceHandler = async (req, reply) => {
  const TODAY_START = moment().startOf('day').format();
  const TODAY_END = moment().endOf('day').format();
  try {
    let todayOpeningBalData = {
      today_start: TODAY_START,
      today_end: TODAY_END,
    };
    // check if opening balance has been updated today.
    const openingBalance = await getTodayDayOpeningBalance({
      todayOpeningBalData,
    });

    if (openingBalance) {
      return reply.code(400).send({
        status: false,
        message: 'Opening Balance Already Exits for today',
      });
    }

    // get zoho access token
    url = `${config.ZOHO_BASE_URL}?refresh_token=${config.ZOHO_REFRESH_TOKEN}&client_id=${config.ZOHO_CLIENT_ID}&client_secret=${config.ZOHO_CLIENT_SECRET}&redirect_uri=${config.ZOHO_REDIRECT_URI}&grant_type=refresh_token`;

    zoho = await axios.post(url);

    if (zoho.data.error) {
      return reply.code(400).send({
        status: false,
        message: 'Invalid code',
      });
    }

    const options = {
      headers: {
        'Content-Type': ['application/json'],
        Authorization: 'Bearer ' + zoho.data.access_token,
      },
    };

    // get current exchange rate from zoho
    let rateUrl = `${config.ZOHO_BOOK_BASE_URL}/settings/currencies/${config.DOLLAR_CURRENCY_ID}/exchangerates?organization_id=${config.ORGANIZATION_ID}`;

    res = await axios.get(rateUrl, options);

    if (res.data.error)
      return reply.code(400).send({
        status: false,
        message: 'Could not fetch exchange rate',
      });

    payload = {
      rate: res.data.exchange_rates[0].rate,
    };

    await createZohoRate({ payload });

    // fetch all bank accounts details
    let bankAccountUrl = `${config.ZOHO_BOOK_BASE_URL}/bankaccounts?organization_id=${config.ORGANIZATION_ID}`;

    resp = await axios.get(bankAccountUrl, options);

    if (resp.data.error)
      return reply.code(400).send({
        status: false,
        message: 'Could not fetch bank accounts',
      });

    let ngnBalance = 0;
    let usdBalance = 0;
    let overdraft;

    for (const [rowNum, inputData] of resp.data.bankaccounts.entries()) {
      // Save into databse
      if (
        inputData.currency_code === 'USD' ||
        inputData.currency_code === 'NGN'
      ) {
        overdraft = inputData.balance;
        // if bank balance is less than zero then check if there is an overdraft account loan
        if (inputData.balance < 0) {
          overdraftExits = await Overdraft.findOne({
            where: { accountId: inputData.account_id },
          });

          if (overdraftExits) {
            overdraft =
              parseFloat(inputData.balance) +
              parseFloat(overdraftExits.dataValues.amount);
          }
        }

        let bankAccounts = {
          accountId: inputData.account_id,
          accountName: inputData.account_name,
          accountType: inputData.account_type,
          accountNumber: inputData.account_number,
          bankName: inputData.bank_name,
          currency: inputData.currency_code,
          balance: inputData.balance,
          overdraftBalance: overdraft,
        };

        if (inputData.currency_code === 'USD') {
          usdBalance += overdraft;
        }

        if (inputData.currency_code === 'NGN') {
          ngnBalance += overdraft;
        }

        await createBankAccounts({ bankAccounts });
      }
    }

    payload = {
      naira: ngnBalance,
      dollar: usdBalance,
    };

    await createOpeningBalance({ payload });

    statusCode = 200;

    result = {
      status: true,
      message: 'Successfully',
      data: '',
    };
  } catch (e) {
    statusCode = e.response.status;
    result = {
      status: false,
      message: e.response.data.message,
    };
  }

  return reply.status(statusCode).send(result);
};

const createOverdraftHandler = async (req, reply) => {
  const YESTERDAY_START = moment().subtract(1, 'days').startOf('day').format();
  const YESTERDAY_END = moment().subtract(1, 'days').endOf('day').format();
  const {
    accountId,
    accountName,
    accountType,
    accountNumber,
    bankName,
    currency,
    amount,
  } = req.body;
  try {
    let overdraft;
    let bankAccount;
    let openingBalance;
    let bankBalance;

    let overdraftExists = await Overdraft.findOne({
      where: { accountId },
    });

    if (overdraftExists)
      return reply.code(409).send({
        status: false,
        message: 'Overdraft account already exist',
      });

    bankAccount = await BankAccount.findOne({
      where: {
        accountId,
        currency,
        createdAt: {
          [Op.gt]: YESTERDAY_START,
          [Op.lt]: YESTERDAY_END,
        },
      },
    });

    if (!bankAccount)
      return reply.code(404).send({
        status: false,
        message: 'Bank account not found',
      });

    if (bankAccount && bankAccount.dataValues.balance > 0)
      return reply.code(400).send({
        status: false,
        message: 'Bank account balance is greater than 0',
      });

    overdraft = await Overdraft.create({
      accountId,
      accountName,
      accountType,
      accountNumber,
      bankName,
      currency,
      amount,
    });

    if (!overdraft)
      return reply.code(500).send({
        status: false,
        message: 'Unable to create overdraft account',
      });

    if (bankAccount.currency !== currency)
      return reply.code(400).send({
        status: false,
        message: 'Curreny mismtach',
      });

    bankBalance = parseFloat(bankAccount.dataValues.balance);
    let overdraftBalance = parseFloat(amount) + parseFloat(bankBalance);

    // update opening balance
    openingBalance = await OpeningBalance.findOne({
      where: {
        createdAt: {
          [Op.gt]: YESTERDAY_START,
          [Op.lt]: YESTERDAY_END,
        },
      },
    });

    //update bankAccount
    bankAccount = await bankAccount.update({
      overdraftBalance: overdraftBalance,
    });

    if (!bankAccount)
      return reply.code(500).send({
        status: false,
        message: 'Unable to update bank account',
      });

    let res = await BankAccount.findAll({
      where: {
        createdAt: {
          [Op.gt]: YESTERDAY_START,
          [Op.lt]: YESTERDAY_END,
        },
      },
    });

    let ngnBalance = 0;
    let usdBalance = 0;

    res.map(async function (res) {
      if (res.dataValues.currency === 'USD') {
        usdBalance += parseFloat(res.dataValues.overdraftBalance);
      }
      if (res.dataValues.currency === 'NGN') {
        ngnBalance += parseFloat(res.dataValues.overdraftBalance);
      }
    });

    openingBalance = await openingBalance.update({
      dollar: usdBalance,
      naira: ngnBalance,
    });

    if (!openingBalance)
      return reply.code(500).send({
        status: false,
        message: 'Unable to update opening balance',
      });

    statusCode = 201;

    result = {
      status: true,
      message: 'Overdraft account created successfully',
    };
  } catch (e) {
    statusCode = e.response.status;
    result = {
      status: false,
      message: e.response.data.message,
    };
  }
  return reply.status(statusCode).send(result);
};

const updateOverdraftHandler = async (req, reply) => {
  const YESTERDAY_START = moment().subtract(1, 'days').startOf('day').format();
  const YESTERDAY_END = moment().subtract(1, 'days').endOf('day').format();
  const id = req.params.id;
  const { amount } = req.body;

  try {
    let openingBalance;

    let overdraft = await Overdraft.findOne({
      where: { accountId: id },
    });

    if (!overdraft)
      return reply.code(500).send({
        status: false,
        message: 'Overdraft account not found',
      });

    let bankAccount = await BankAccount.findOne({
      where: {
        accountId: overdraft.accountId,
        createdAt: {
          [Op.gt]: YESTERDAY_START,
          [Op.lt]: YESTERDAY_END,
        },
      },
    });

    if (!bankAccount)
      return reply.code(404).send({
        status: false,
        message: 'Bank account not found',
      });

    // update opening balance
    openingBalance = await OpeningBalance.findOne({
      where: {
        createdAt: {
          [Op.gt]: YESTERDAY_START,
          [Op.lt]: YESTERDAY_END,
        },
      },
    });

    if (!openingBalance)
      return reply.code(404).send({
        status: false,
        message: 'Opening Balance not found',
      });

    let overdraftDiff;

    if (parseFloat(amount) > parseFloat(overdraft.dataValues.amount)) {
      overdraftDiff =
        parseFloat(amount) - parseFloat(overdraft.dataValues.amount);

      overdraftBalance =
        parseFloat(bankAccount.dataValues.overdraftBalance) +
        parseFloat(overdraftDiff);

      if (bankAccount.dataValues.currency === 'NGN') {
        dollar = openingBalance.dataValues.dollar;
        naira =
          parseFloat(openingBalance.dataValues.naira) +
          parseFloat(overdraftDiff);
      }

      if (bankAccount.dataValues.currency === 'USD') {
        naira = openingBalance.dataValues.naira;
        dollar =
          parseFloat(openingBalance.dataValues.dollar) +
          parseFloat(overdraftDiff);
      }

      bankAccount = await bankAccount.update({
        overdraftBalance: overdraftBalance,
      });

      openingBalance = await openingBalance.update({
        dollar,
        naira,
      });
    } else {
      overdraftDiff =
        parseFloat(amount) - parseFloat(overdraft.dataValues.amount);

      overdraftBalance =
        parseFloat(bankAccount.dataValues.overdraftBalance) +
        parseFloat(overdraftDiff);

      bankAccount = await bankAccount.update({
        overdraftBalance: overdraftBalance,
      });

      if (!bankAccount)
        return reply.code(500).send({
          status: false,
          message: 'Unable to update bank account',
        });

      let res = await BankAccount.findAll({
        where: {
          createdAt: {
            [Op.gt]: YESTERDAY_START,
            [Op.lt]: YESTERDAY_END,
          },
        },
      });

      let ngnBalance = 0;
      let usdBalance = 0;

      res.map(async function (res) {
        if (res.dataValues.currency === 'USD') {
          usdBalance += parseFloat(res.dataValues.overdraftBalance);
        }
        if (res.dataValues.currency === 'NGN') {
          ngnBalance += parseFloat(res.dataValues.overdraftBalance);
        }
      });

      openingBalance = await openingBalance.update({
        dollar: usdBalance,
        naira: ngnBalance,
      });

      if (!openingBalance)
        return reply.code(500).send({
          status: false,
          message: 'Unable to update opening balance',
        });
    }

    overdraft = await overdraft.update({
      amount: amount,
    });

    if (!overdraft)
      return reply.code(500).send({
        status: false,
        message: 'Unable to update overdraft',
      });

    statusCode = 200;

    result = {
      status: true,
      message: 'Overdraft account updated successfully',
    };
  } catch (e) {
    statusCode = e.code;
    result = {
      status: false,
      message: e.message,
    };
  }
  return reply.status(statusCode).send(result);
};

const deleteOverdraftHandler = async (req, reply) => {
  const YESTERDAY_START = moment().subtract(1, 'days').startOf('day').format();
  const YESTERDAY_END = moment().subtract(1, 'days').endOf('day').format();
  const id = req.params.id;

  try {
    let overdraft = await Overdraft.findOne({
      where: { accountId: id },
    });

    if (!overdraft)
      return reply.code(500).send({
        status: false,
        message: 'Overdraft account not found',
      });

    let bankAccount = await BankAccount.findOne({
      where: {
        accountId: overdraft.accountId,
        createdAt: {
          [Op.gt]: YESTERDAY_START,
          [Op.lt]: YESTERDAY_END,
        },
      },
    });

    if (!bankAccount)
      return reply.code(404).send({
        status: false,
        message: 'Bank account not found',
      });

    let openingBalance = await OpeningBalance.findOne({
      where: {
        createdAt: {
          [Op.gt]: YESTERDAY_START,
          [Op.lt]: YESTERDAY_END,
        },
      },
    });

    if (!openingBalance)
      return reply.code(404).send({
        status: false,
        message: 'Opening Balance not found',
      });

    await overdraft.destroy();

    bankAccount = await bankAccount.update({
      overdraftBalance: bankAccount.dataValues.balance,
    });

    if (!bankAccount)
      return reply.code(500).send({
        status: false,
        message: 'Unable to update bank account',
      });

    let res = await BankAccount.findAll({
      where: {
        createdAt: {
          [Op.gt]: YESTERDAY_START,
          [Op.lt]: YESTERDAY_END,
        },
      },
    });

    let ngnBalance = 0;
    let usdBalance = 0;

    res.map(async function (res) {
      if (res.dataValues.currency === 'USD') {
        usdBalance += parseFloat(res.dataValues.overdraftBalance);
      }
      if (res.dataValues.currency === 'NGN') {
        ngnBalance += parseFloat(res.dataValues.overdraftBalance);
      }
    });

    openingBalance = await openingBalance.update({
      dollar: usdBalance,
      naira: ngnBalance,
    });

    if (!openingBalance)
      return reply.code(500).send({
        status: false,
        message: 'Unable to update opening balance',
      });

    statusCode = 200;

    result = {
      status: true,
      message: 'Overdraft deleted successfully',
    };
  } catch (e) {
    statusCode = e.code;
    result = {
      status: false,
      message: e.message,
    };
  }
  return reply.status(statusCode).send(result);
};

const getOverdraftHandler = async (req, reply) => {
  try {
    let overdrafts = await Overdraft.findAll();

    statusCode = 200;

    result = {
      status: true,
      message: 'Overdrafts retrieved successfully',
      data: overdrafts,
    };
  } catch (e) {
    statusCode = e.code;
    result = {
      status: false,
      message: e.message,
    };
  }
  return reply.status(statusCode).send(result);
};

module.exports = {
  resyncHandler,
  bankAccountsHandler,
  createOpeningBalanceHandler,
  createOverdraftHandler,
  updateOverdraftHandler,
  deleteOverdraftHandler,
  getOverdraftHandler,
};
