const { default: axios } = require('axios');
const db = require("../../models");
const { Op } = require('sequelize')
let moment = require('moment');
const User = db.users;
const Rate = db.rates

// Get exchange rate and save into database
const exchangeRateHandler = async (req, reply) => {

    try {

        let rate;
        let zohoAccessToken = req.body.zohoAccessToken;

        const options = {
            headers: {
                'Content-Type': ['application/json'],
                'Authorization': 'Bearer ' + zohoAccessToken
            }
        }

        // check if exchange rate exist in db

        const { count } = await Rate.findAndCountAll();

        if (count < 1) {
            // if no get create the exchange rate from zoho and save to db

            // TODO:: move this into a single function
            url = `${process.env.ZOHO_BOOK_BASE_URL}/settings/currencies/${process.env.DOLLAR_CURRENCY_ID}/exchangerates?organization_id=${process.env.ORGANIZATION_ID}`;

            res = await axios.get(url, options);

            if (res.data.error)
                return reply.code(400).send({
                    status: false,
                    message: 'Could not fetch exchange rate',
                });

            // save to db
            rate = await Rate.create({
                // currencyId: process.env.DOLLAR_CURRENCY_ID,
                value: res.data.exchange_rates[0].rate,
            });
        } else {
            // if yes check if exchange rate has being updated today
            rate = await Rate.findOne({
                where: {
                    updatedAt: {
                        [Op.gte]: moment().subtract(12, 'hour').toDate()
                    }
                }
            });

            // if yes, return the exchange rate
            if (!rate) {
                // if no , get the exchange rate from zoho and update
                url = `${process.env.ZOHO_BOOK_BASE_URL}/settings/currencies/${process.env.DOLLAR_CURRENCY_ID}/exchangerates?organization_id=${process.env.ORGANIZATION_ID}`;

                res = await axios.get(url, options);

                if (res.data.error)
                    return reply.code(400).send({
                        status: false,
                        message: 'Could not fetch exchange rate',
                    });

                rate = await rate.update({
                    value: res.data.exchange_rates[0].rate,
                })
            }
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

module.exports = { exchangeRateHandler }