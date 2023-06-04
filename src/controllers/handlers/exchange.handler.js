const { default: axios } = require("axios");
const ExcelJS = require("exceljs");
const db = require("../../models");
const config = require("../../../config");
const { Op } = require("sequelize");
const User = db.users;
const Rate = db.rates;
const BillForecast = db.billForecasts;
const InvoiceForecast = db.invoiceForecasts;
const SaleForecast = db.saleForecasts;
const PurchaseForecast = db.purchaseForecasts;
const Invoice = db.invoices;
const ZohoRate = db.zohorates;
const Bill = db.bills;
const InitialBalance = db.initialBalances;
const Sale = db.sales;
const Purchase = db.purchases;
const CustomerPayment = db.customerPayments;
const VendorPayment = db.vendorPayments;

// Get exchange rate and save into database
const getZohoExchangeRateHandler = async (
  zohoAccessToken,
  forecastNumber,
  forecastPeriod,
  userId
) => {
  const TODAY_START = new Date().setHours(0, 0, 0, 0);
  const TODAY_END = new Date().setHours(23, 59, 59, 999);
  let rate;

  const options = {
    headers: {
      "Content-Type": ["application/json"],
      Authorization: "Bearer " + zohoAccessToken,
    },
  };

  // check if exchange rate exist in db for the day

  rate = await Rate.findOne({
    where: {
      userId,
      forecastType: `${forecastNumber} ${forecastPeriod}`,
      updatedAt: {
        [Op.gt]: TODAY_START,
        [Op.lt]: TODAY_END,
      },
    },
  });

  // if rate doesn't exist then create the exchange rate from zoho and save to db
  if (!rate) {
    url = `${config.ZOHO_BOOK_BASE_URL}/settings/currencies/${config.DOLLAR_CURRENCY_ID}/exchangerates?organization_id=${config.ORGANIZATION_ID}`;

    res = await axios.get(url, options);

    if (res.data.error)
      return reply.code(400).send({
        status: false,
        message: "Could not fetch exchange rate",
      });

    // save to db
    rate = await Rate.create({
      userId,
      old: res.data.exchange_rates[0].rate,
      latest: res.data.exchange_rates[0].rate,
      forecastType: `${forecastNumber} ${forecastPeriod}`,
    });
  }

  return rate;
};

const getExchangeRateHandler = async (req, reply) => {
  try {
    const { number, period } = req.params;
    const TODAY_START = new Date().setHours(0, 0, 0, 0);
    const TODAY_END = new Date().setHours(23, 59, 59, 999);
    const userId = req.user.id;

    let rate = await Rate.findOne({
      where: {
        userId,
        forecastType: number + " " + period,
        updatedAt: {
          [Op.gt]: TODAY_START,
          [Op.lt]: TODAY_END,
        },
      },
    });

    if (!rate) {
      return reply.code(400).send({
        status: false,
        message: "Could not fetch exchange rate",
      });
    }

    statusCode = 200;

    result = {
      status: true,
      message: "Exchange rate fetched successfully",
      data: rate,
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

const getAllExchangeRateHandler = async (req, reply) => {
  try {
    const zohorates = await ZohoRate.findAll({
      limit: 30,
      order: [["createdAt", "DESC"]],
    });

    statusCode = 200;

    result = {
      status: true,
      message: "Exchage rates fetched successfully",
      data: zohorates,
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

const downloadExchangeRate = async (req, reply) => {
  try {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Exchange Rate List");

    const exchangeRateColumns = [
      { key: "id", header: "id" },
      { key: "rate", header: "rate" },
      { key: "createdAt", header: "date" },
    ];

    worksheet.columns = exchangeRateColumns;

    const zohorates = await ZohoRate.findAll({
      order: [["createdAt", "DESC"]],
    });

    zohorates.forEach((rate) => {
      worksheet.addRow(rate);
    });

    result = await workbook.xlsx.writeBuffer();
    statusCode = 200;
  } catch (e) {
    statusCode = e.response.status;
    result = {
      status: false,
      message: e.response.data.message,
    };
  }
  return reply.status(statusCode).send(result);
};

const updateExchangeRateHandler = async (req, reply) => {
  try {
    const TODAY_START = new Date().setHours(0, 0, 0, 0);
    const TODAY_END = new Date().setHours(23, 59, 59, 999);
    const { id } = req.params;
    const { latest, forecastNumber, forecastPeriod } = req.body;
    const userId = req.user.id;

    // check if exchange rate exist in db for the day
    let rate = await Rate.findOne({
      where: {
        id,
        userId,
      },
    });

    // if rate doesn't exist then create the exchange rate from zoho and save to db
    if (!rate) {
      return reply.code(400).send({
        status: false,
        message: "Could not fetch exchange rate",
      });
    }

    rate = await rate.update({
      userId: userId,
      latest,
    });

    await InitialBalance.destroy({
      where: {
        userId: userId,
        forecastType: `${forecastNumber} ${forecastPeriod}`,
        updatedAt: {
          [Op.gt]: TODAY_START,
          [Op.lt]: TODAY_END,
        },
      },
    });

    await BillForecast.destroy({
      where: {
        userId: userId,
        forecastType: `${forecastNumber} ${forecastPeriod}`,
        updatedAt: {
          [Op.gt]: TODAY_START,
          [Op.lt]: TODAY_END,
        },
      },
    });

    await InvoiceForecast.destroy({
      where: {
        userId: userId,
        forecastType: `${forecastNumber} ${forecastPeriod}`,
        updatedAt: {
          [Op.gt]: TODAY_START,
          [Op.lt]: TODAY_END,
        },
      },
    });

    await SaleForecast.destroy({
      where: {
        userId: userId,
        forecastType: `${forecastNumber} ${forecastPeriod}`,
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

    await Bill.destroy({
      where: {
        userId: userId,
        forecastType: `${forecastNumber} ${forecastPeriod}`,
        updatedAt: {
          [Op.gt]: TODAY_START,
          [Op.lt]: TODAY_END,
        },
      },
    });

    await Invoice.destroy({
      where: {
        userId: userId,
        forecastType: `${forecastNumber} ${forecastPeriod}`,
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

    statusCode = 200;

    result = {
      status: true,
      message: "Exchange rate updated successfully",
      data: rate,
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
  getExchangeRateHandler,
  getAllExchangeRateHandler,
  getZohoExchangeRateHandler,
  updateExchangeRateHandler,
  downloadExchangeRate,
};
