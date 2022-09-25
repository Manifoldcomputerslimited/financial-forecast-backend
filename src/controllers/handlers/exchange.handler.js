const { default: axios } = require('axios');
const db = require("../../models");
const { Op } = require('sequelize')
let moment = require('moment');
const User = db.users;
const Rate = db.rates
const BillForecast = db.billForecasts;
const InvoiceForecast = db.invoiceForecasts;
const Invoice = db.invoices;
const Bill = db.bills;
const InitialBalance = db.initialBalances;

// Get exchange rate and save into database
const getZohoExchangeRateHandler = async (zohoAccessToken, forecastNumber, forecastPeriod) => {

    const TODAY_START = new Date().setHours(0, 0, 0, 0);
    const TODAY_END = new Date().setHours(23, 59, 59, 999);
    let rate;

    const options = {
        headers: {
            'Content-Type': ['application/json'],
            'Authorization': 'Bearer ' + zohoAccessToken
        }
    }

    // check if exchange rate exist in db for the day

    rate = await Rate.findOne({
        where: {
            forecastType: `${forecastNumber} ${forecastPeriod}`,
            updatedAt: {
                [Op.gt]: TODAY_START,
                [Op.lt]: TODAY_END
            }
        }
    })

    // if rate doesn't exist then create the exchange rate from zoho and save to db
    if (!rate) {
        url = `${process.env.ZOHO_BOOK_BASE_URL}/settings/currencies/${process.env.DOLLAR_CURRENCY_ID}/exchangerates?organization_id=${process.env.ORGANIZATION_ID}`;

        res = await axios.get(url, options);

        if (res.data.error)
            return reply.code(400).send({
                status: false,
                message: 'Could not fetch exchange rate',
            });

        // save to db
        rate = await Rate.create({
            old: res.data.exchange_rates[0].rate,
            latest: res.data.exchange_rates[0].rate,
            forecastType: `${forecastNumber} ${forecastPeriod}`
        });
    }

    return rate;

}

const getExchangeRateHandler = async (req, reply) => {
    try {
        const { number, period } = req.params
        const TODAY_START = new Date().setHours(0, 0, 0, 0);
        const TODAY_END = new Date().setHours(23, 59, 59, 999);

        let rate = await Rate.findOne({
            where: {
                forecastType: number + ' ' + period,
                updatedAt: {
                    [Op.gt]: TODAY_START,
                    [Op.lt]: TODAY_END
                }
            }
        })

        if (!rate) {
            return reply.code(400).send({
                status: false,
                message: 'Could not fetch exchange rate',
            });
        }

        statusCode = 200;

        result = {
            status: true,
            message: 'Exchange rate fetched successfully',
            data: rate,
        }

    } catch (e) {
        console.log(e)
        statusCode = e.code;
        result = {
            status: false,
            message: e.message,
        };
    }

    return reply.status(statusCode).send(result);
}

const updateExchangeRateHandler = async (req, reply) => {

    try {
        const TODAY_START = new Date().setHours(0, 0, 0, 0);
        const TODAY_END = new Date().setHours(23, 59, 59, 999);
        let { id } = req.params;
        let { latest, forecastNumber, forecastPeriod } = req.body;


        // check if exchange rate exist in db for the day
        let rate = await Rate.findOne({
            where: {
                id
            }
        })

        // if rate doesn't exist then create the exchange rate from zoho and save to db
        if (!rate) {
            return reply.code(400).send({
                status: false,
                message: 'Could not fetch exchange rate',
            });
        }


        rate = await rate.update({
            latest
        });

        await InitialBalance.destroy({
            where: {
                updatedAt: {
                    [Op.gt]: TODAY_START,
                    [Op.lt]: TODAY_END
                }
            }
        })

        await BillForecast.destroy({
            where: {
                forecastType: `${forecastNumber} ${forecastPeriod}`,
                updatedAt: {
                    [Op.gt]: TODAY_START,
                    [Op.lt]: TODAY_END
                }
            }
        })

        await InvoiceForecast.destroy({
            where: {
                forecastType: `${forecastNumber} ${forecastPeriod}`,
                updatedAt: {
                    [Op.gt]: TODAY_START,
                    [Op.lt]: TODAY_END
                }
            }
        })

        await Bill.destroy({
            where: {
                forecastType: `${forecastNumber} ${forecastPeriod}`,
                updatedAt: {
                    [Op.gt]: TODAY_START,
                    [Op.lt]: TODAY_END
                }
            }
        })

        await Invoice.destroy({
            where: {
                forecastType: `${forecastNumber} ${forecastPeriod}`,
                updatedAt: {
                    [Op.gt]: TODAY_START,
                    [Op.lt]: TODAY_END
                }
            }
        })

        statusCode = 200;

        result = {
            status: true,
            message: 'Exchange rate updated successfully',
            data: rate,
        }
    } catch (e) {
        console.log(e)
        statusCode = e.code;
        result = {
            status: false,
            message: e.message,
        };
    }

    return reply.status(statusCode).send(result);
}

module.exports = { getExchangeRateHandler, getZohoExchangeRateHandler, updateExchangeRateHandler }