const { Op } = require('sequelize');
const db = require('../models');

const InvoiceForecast = db.invoiceForecasts;
const SaleForecast = db.saleForecasts;
const BillForecast = db.billForecasts;
const OpeningBalance = db.openingBalances;

const Invoice = db.invoices;
const Bill = db.bills;
const Sale = db.sales;

const InitialBalance = db.initialBalances;

const createInvoiceForecast = async (
  userId,
  naira,
  dollar,
  month,
  forecastNumber,
  forecastPeriod,
  currency
) => {
  await InvoiceForecast.create({
    userId: userId,
    nairaClosingBalance: naira,
    dollarClosingBalance: dollar,
    month: month,
    forecastType: `${forecastNumber} ${forecastPeriod}`,
    currency: currency,
  });
};

const createBillForecast = async (
  userId,
  naira,
  dollar,
  month,
  forecastNumber,
  forecastPeriod,
  currency
) => {
  await BillForecast.create({
    userId: userId,
    nairaClosingBalance: naira,
    dollarClosingBalance: dollar,
    month: month,
    forecastType: `${forecastNumber} ${forecastPeriod}`,
    currency: currency,
  });
};

const createSaleForecast = async (
  userId,
  naira,
  dollar,
  month,
  forecastNumber,
  forecastPeriod,
  currency
) => {
  await SaleForecast.create({
    userId: userId,
    nairaClosingBalance: naira,
    dollarClosingBalance: dollar,
    month: month,
    forecastType: `${forecastNumber} ${forecastPeriod}`,
    currency: currency,
  });
};

const createInvoice = async ({ payload }) => {
  await Invoice.create(payload);
};

const createBill = async ({ payload }) => {
  await Bill.create(payload);
};

const createSale = async ({ payload }) => {
  await Sale.create(payload);
};

const fetchAllInvoice = async ({ payload }) => {
  return await Invoice.findAndCountAll({
    where: {
      userId: payload.userId,
      forecastType: `${payload.forecastNumber} ${payload.forecastPeriod}`,
      createdAt: {
        [Op.gt]: payload.today_start,
        [Op.lt]: payload.today_end,
      },
    },
  });
};

const fetchAllBill = async ({ payload }) => {
  return await Bill.findAndCountAll({
    where: {
      userId: payload.userId,
      forecastType: `${payload.forecastNumber} ${payload.forecastPeriod}`,
      createdAt: {
        [Op.gt]: payload.today_start,
        [Op.lt]: payload.today_end,
      },
    },
  });
};

const fetchAllSale = async ({ payload }) => {
  return await Sale.findAndCountAll({
    where: {
      userId: payload.userId,
      forecastType: `${payload.forecastNumber} ${payload.forecastPeriod}`,
      createdAt: {
        [Op.gt]: payload.today_start,
        [Op.lt]: payload.today_end,
      },
    },
  });
};

const getInitialBalance = async ({ payload }) => {
  return await InitialBalance.findOne({
    where: {
      userId: payload.userId,
      forecastType: `${payload.forecastNumber} ${payload.forecastPeriod}`,
      createdAt: {
        [Op.gt]: payload.today_start,
        [Op.lt]: payload.today_end,
      },
    },
  });
};

const fetchAllInvoiceForecast = async ({ payload }) => {
  return await InvoiceForecast.findAndCountAll({
    where: {
      userId: payload.userId,
      forecastType: `${payload.forecastNumber} ${payload.forecastPeriod}`,
      createdAt: {
        [Op.gt]: payload.today_start,
        [Op.lt]: payload.today_end,
      },
    },
  });
};

const fetchAllBillForecast = async ({ payload }) => {
  return BillForecast.findAndCountAll({
    where: {
      userId: payload.userId,
      forecastType: `${payload.forecastNumber} ${payload.forecastPeriod}`,
      createdAt: {
        [Op.gt]: payload.today_start,
        [Op.lt]: payload.today_end,
      },
    },
  });
};

const fetchAllSaleForecast = async ({ payload }) => {
  return SaleForecast.findAndCountAll({
    where: {
      userId: payload.userId,
      forecastType: `${payload.forecastNumber} ${payload.forecastPeriod}`,
      createdAt: {
        [Op.gt]: payload.today_start,
        [Op.lt]: payload.today_end,
      },
    },
  });
};

const createInitialBalance = async ({ startingBalance }) => {
  return await InitialBalance.create(startingBalance);
};

const createOpeningBalance = async ({ payload }) => {
  return await OpeningBalance.create(payload);
};

const getPreviousDayOpeningBalance = async ({ prevOpeningBalData }) => {
  return await OpeningBalance.findOne({
    where: {
      createdAt: {
        [Op.gt]: prevOpeningBalData.yesterday_start,
        [Op.lt]: prevOpeningBalData.yesterday_end,
      },
    },
  });
};

module.exports = {
  createInvoiceForecast,
  createInvoice,
  createBillForecast,
  createBill,
  createSaleForecast,
  createSale,
  fetchAllInvoice,
  fetchAllBill,
  fetchAllSale,
  getInitialBalance,
  fetchAllInvoiceForecast,
  fetchAllBillForecast,
  fetchAllSaleForecast,
  createInitialBalance,
  createOpeningBalance,
  getPreviousDayOpeningBalance,
};
