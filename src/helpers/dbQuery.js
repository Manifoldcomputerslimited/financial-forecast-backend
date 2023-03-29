const { Op } = require('sequelize');
const db = require('../models');

const InvoiceForecast = db.invoiceForecasts;
const PurchaseForecast = db.purchaseForecasts;
const SaleForecast = db.saleForecasts;
const BillForecast = db.billForecasts;
const ZohoRate = db.zohorates;
const VendorPayment = db.vendorPayments;
const CustomerPayment = db.customerPayments;

const OpeningBalance = db.openingBalances;
const BankAccount = db.bankAccounts;

const Invoice = db.invoices;
const Bill = db.bills;
const Purchase = db.purchases;
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

const createPurchaseForecast = async (
  userId,
  naira,
  dollar,
  month,
  forecastNumber,
  forecastPeriod,
  currency
) => {
  await PurchaseForecast.create({
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

const createPurchase = async ({ payload }) => {
  await Purchase.create(payload);
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

const fetchAllPurchase = async ({ payload }) => {
  return await Purchase.findAndCountAll({
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
  return await BillForecast.findAndCountAll({
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

const fetchAllPurchaseForecast = async ({ payload }) => {
  return await PurchaseForecast.findAndCountAll({
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
  return await SaleForecast.findAndCountAll({
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

const getPurchaseForecast = async ({ payload }) => {
  return await PurchaseForecast.findOne({
    where: {
      userId: payload.userId,
      forecastType: `${payload.forecastNumber} ${payload.forecastPeriod}`,
      currency: payload.currency,
      createdAt: {
        [Op.gt]: payload.today_start,
        [Op.lt]: payload.today_end,
      },
    },
  });
};

const getSaleForecast = async ({ payload }) => {
  return await SaleForecast.findOne({
    where: {
      userId: payload.userId,
      forecastType: `${payload.forecastNumber} ${payload.forecastPeriod}`,
      currency: payload.currency,
      createdAt: {
        [Op.gt]: payload.today_start,
        [Op.lt]: payload.today_end,
      },
    },
  });
};

const createVendorPayment = async ({ payload }) => {
  return await VendorPayment.create(payload);
};

const createCustomerPayment = async ({ payload }) => {
  return await CustomerPayment.create(payload);
};

const getVendorPaymentByVendorId = async ({ payload }) => {
  return await VendorPayment.findOne({
    where: {
      userId: payload.userId,
      vendorId: payload.vendorId,
      forecastType: `${payload.forecastNumber} ${payload.forecastPeriod}`,
      currencyCode: payload.currencyCode,
      createdAt: {
        [Op.gt]: payload.today_start,
        [Op.lt]: payload.today_end,
      },
    },
  });
};

const getCustomerPaymentByCustomerId = async ({ payload }) => {
  return await CustomerPayment.findOne({
    where: {
      userId: payload.userId,
      customerId: payload.customerId,
      forecastType: `${payload.forecastNumber} ${payload.forecastPeriod}`,
      currencyCode: payload.currencyCode,
      createdAt: {
        [Op.gt]: payload.today_start,
        [Op.lt]: payload.today_end,
      },
    },
  });
};

const fetchAllVendorPayments = async ({ payload }) => {
  return await VendorPayment.findAndCountAll({
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

const fetchAllCustomerPayments = async ({ payload }) => {
  return await CustomerPayment.findAndCountAll({
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

const createBankAccounts = async ({ bankAccounts }) => {
  return await BankAccount.create(bankAccounts);
};

const getTodayDayOpeningBalance = async ({ todayOpeningBalData }) => {
  return await OpeningBalance.findOne({
    where: {
      createdAt: {
        [Op.gt]: todayOpeningBalData.today_start,
        [Op.lt]: todayOpeningBalData.today_end,
      },
    },
  });
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

const createZohoRate = async ({ payload }) => {
  return await ZohoRate.create(payload);
};

module.exports = {
  createZohoRate,
  createInvoiceForecast,
  createInvoice,
  createBillForecast,
  createBill,
  createPurchaseForecast,
  createPurchase,
  createSaleForecast,
  createSale,
  createVendorPayment,
  createCustomerPayment,
  fetchAllInvoice,
  fetchAllBill,
  fetchAllPurchase,
  fetchAllSale,
  getInitialBalance,
  fetchAllInvoiceForecast,
  fetchAllBillForecast,
  fetchAllPurchaseForecast,
  fetchAllSaleForecast,
  fetchAllVendorPayments,
  fetchAllCustomerPayments,
  getVendorPaymentByVendorId,
  getCustomerPaymentByCustomerId,
  getPurchaseForecast,
  getSaleForecast,
  createInitialBalance,
  createOpeningBalance,
  createBankAccounts,
  getTodayDayOpeningBalance,
  getPreviousDayOpeningBalance,
};
