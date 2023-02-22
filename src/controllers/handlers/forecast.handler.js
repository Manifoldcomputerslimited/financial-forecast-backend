const db = require('../../models');
const { Op } = require('sequelize');
let moment = require('moment');
const InvoiceForecast = db.invoiceForecasts;
const SaleForecast = db.saleForecasts;
const BillForecast = db.billForecasts;
const Invoice = db.invoices;
const Sale = db.sales;
const Bill = db.bills;
const InitialBalance = db.initialBalances;
const BankAccount = db.bankAccounts;
const Rate = db.rates;

const resyncHandler = async (req, reply) => {
  try {
    const TODAY_START = new Date().setHours(0, 0, 0, 0);
    const TODAY_END = new Date().setHours(23, 59, 59, 999);
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

    await Bill.destroy({
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
  try {
    const YESTERDAY_START = moment()
      .subtract(1, 'days')
      .startOf('day')
      .format();
    const YESTERDAY_END = moment().subtract(1, 'days').endOf('day').format();

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
    console.log(e);
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
};
