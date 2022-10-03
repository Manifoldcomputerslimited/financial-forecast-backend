const { Op } = require('sequelize');
const db = require("../models");
const Invoice = db.invoices;
const InvoiceForecast = db.invoiceForecasts;
const Bill = db.bills;
const BillForecast = db.billForecasts;
const InitialBalance = db.initialBalances;

const createInvoiceForecast = async (userId, naira, dollar, month, forecastNumber, forecastPeriod, currency) => {

    await InvoiceForecast.create(
        {
            userId: userId,
            nairaClosingBalance: naira,
            dollarClosingBalance: dollar,
            month: month,
            forecastType: `${forecastNumber} ${forecastPeriod}`,
            currency: currency
        }
    );
}

const createInvoice = async ({ payload }) => {
    await Invoice.create(
        payload
    );
}

const createBillForecast = async (userId, naira, dollar, month, forecastNumber, forecastPeriod, currency) => {

    await BillForecast.create(
        {
            userId: userId,
            nairaClosingBalance: naira,
            dollarClosingBalance: dollar,
            month: month,
            forecastType: `${forecastNumber} ${forecastPeriod}`,
            currency: currency
        }
    );
}

const createBill = async ({ payload }) => {
    await Bill.create(
        payload
    );
}

const fetchAllInvoice = async ({ payload }) => {

    return await Invoice.findAndCountAll({
        where: {
            userId: payload.userId,
            forecastType: `${payload.forecastNumber} ${payload.forecastPeriod}`,
            createdAt: {
                [Op.gt]: payload.today_start,
                [Op.lt]: payload.today_end
            }
        },
    })
}

const fetchAllBill = async ({ payload }) => {

    return await Bill.findAndCountAll({
        where: {
            userId: payload.userId,
            forecastType: `${payload.forecastNumber} ${payload.forecastPeriod}`,
            createdAt: {
                [Op.gt]: payload.today_start,
                [Op.lt]: payload.today_end
            }
        },
    });
}

const getInitialBalance = async ({ payload }) => {

    return await InitialBalance.findOne({
        where: {
            userId: payload.userId,
            forecastType: `${payload.forecastNumber} ${payload.forecastPeriod}`,
            createdAt: {
                [Op.gt]: payload.today_start,
                [Op.lt]: payload.today_end
            }
        },
    })
}

const fetchAllInvoiceForecast = async ({ payload }) => {

    return await InvoiceForecast.findAndCountAll({
        where: {
            userId: payload.userId,
            forecastType: `${payload.forecastNumber} ${payload.forecastPeriod}`,
            createdAt: {
                [Op.gt]: payload.today_start,
                [Op.lt]: payload.today_end
            }
        },
    });
}

const fetchAllBillForecast = async ({ payload }) => {
    return BillForecast.findAndCountAll({
        where: {
            userId: payload.userId,
            forecastType: `${payload.forecastNumber} ${payload.forecastPeriod}`,
            createdAt: {
                [Op.gt]: payload.today_start,
                [Op.lt]: payload.today_end
            }
        },
    });
}

const createInitialBalance = async ({ startingBalance }) => {
    await InitialBalance.create(
        startingBalance
    );
}


module.exports = {
    createInvoiceForecast,
    createInvoice,
    createBillForecast,
    createBill,
    fetchAllInvoice,
    fetchAllBill,
    getInitialBalance,
    fetchAllInvoiceForecast,
    fetchAllBillForecast,
    createInitialBalance
}