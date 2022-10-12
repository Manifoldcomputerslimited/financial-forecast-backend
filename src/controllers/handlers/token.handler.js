const { default: axios } = require('axios');
const db = require("../../models");
const User = db.users;
const Token = db.tokens
const dayjs = require('dayjs')
var utc = require('dayjs/plugin/utc')
var timezone = require('dayjs/plugin/timezone')
const config = require('../../../config');

dayjs.extend(utc)
dayjs.extend(timezone)

// dayjs.tz.setDefault("Africa/Lagos")

Date.prototype.addHours = function (h) {
    this.setHours(this.getHours() + h);
    return this;
}

const options = {
    headers: { 'Content-Type': ['application/json'] }
}
// this generates zoho access token
const generateZohoTokenHandler = async (req, reply) => {
    const { code } = req.body;

    console.log('generating zoho token');
    try {
        let user;
        let resp;
        let url;

        // get current user
        user = await User.findOne({
            where: { email: req.user.email }
        });

        if (!user) {
            return reply.code(404).send({
                status: false,
                message: "User Not Found",
            });
        }

        // check if user has zoho token
        let zohoToken = await Token.findOne({
            where: {
                userId: user.id,
            }
        })


        // new to zoho
        if (!zohoToken) {
            console.log('new to zoho');
            if (!code) {
                console.log('code is required')
                return reply.code(400).send({
                    status: false,
                    message: 'Code is required',
                });
            }

            url = `${config.ZOHO_BASE_URL}?code=${code}&client_id=${config.ZOHO_CLIENT_ID}&client_secret=${config.ZOHO_CLIENT_SECRET}&redirect_uri=${config.BASE_URL}&grant_type=authorization_code`;

            resp = await axios.post(url,
                options)

            if (resp.data.error)
                return reply.code(400).send({
                    status: false,
                    message: 'Invalid code',
                });

            console.log('new to zoho', resp)
            // store the zoho token in the zoho table
            zohoToken = await Token.create({
                userId: user.id,
                //zohoAccessToken: resp.data.access_token,
                zohoRefreshToken: resp.data.refresh_token,
                zohoTokenExpiry: dayjs().add(3600, 'second').utc(1).format(),
                zohoTokenDate: new Date().addHours(1)
            });
            console.log('updating user')

        } else {
            console.log('refreshing user')
            url = `${config.ZOHO_BASE_URL}?refresh_token=${zohoToken.zohoRefreshToken}&client_id=${config.ZOHO_CLIENT_ID}&client_secret=${config.ZOHO_CLIENT_SECRET}&redirect_uri=${config.ZOHO_REDIRECT_URI}&grant_type=refresh_token`;

            resp = await axios.post(url,
                options)

            if (resp.data.error) {
                return reply.code(400).send({
                    status: false,
                    message: 'Invalid code',
                });
            }

            zohoToken = await zohoToken.update({
                // zohoAccessToken: resp.data.access_token,
                zohoTokenExpiry: dayjs().add(3600, 'second').utc(1).format(),
                zohoTokenDate: new Date().addHours(1)
            })
        }
        user.update({
            isZohoAuthenticated: true
        })

        console.log('what', zohoToken);

        statusCode = 200;
        result = {
            status: true,
            message: "Zoho Token generated successfully",
            data: {
                zohoAccessToken: resp.data.access_token,
                zohoTokenExpiry: zohoToken.zohoTokenExpiry
            }
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

const refreshZohoTokenHandler = async (req, reply) => {
    try {

        // get current user
        let user = await User.findOne({
            where: { email: req.user.email }
        });

        if (!user) {
            return reply.code(404).send({
                status: false,
                message: "User Not Found",
            });
        }

        // check if user has zoho token
        let zohoToken = await Token.findOne({
            where: {
                userId: user.id,
            }
        })

        if (!zohoToken) {
            return reply.code(401).send({
                status: false,
                message: "Unauthorized access to zoho",
            });
        }

        url = `${config.ZOHO_BASE_URL}?refresh_token=${zohoToken.zohoRefreshToken}&client_id=${config.ZOHO_CLIENT_ID}&client_secret=${config.ZOHO_CLIENT_SECRET}&redirect_uri=${config.ZOHO_REDIRECT_URI}&grant_type=refresh_token`;

        resp = await axios.post(url,
            options)

        if (resp.data.error) {
            return reply.code(400).send({
                status: false,
                message: 'Invalid code',
            });
        }

        zohoToken = await zohoToken.update({
            // zohoAccessToken: resp.data.access_token,
            zohoTokenExpiry: dayjs().add(3600, 'second').utc(1).format(),
            zohoTokenDate: new Date().addHours(1)
        })

        statusCode = 200;
        result = {
            status: true,
            message: "Zoho Token generated successfully",
            data: {
                zohoAccessToken: resp.data.access_token,
                zohoTokenExpiry: zohoToken.zohoTokenExpiry
            }
        }

    } catch (e) {
        statusCode = e.code;
        result = {
            status: false,
            message: e.message,
        };
    }

    return reply.status(statusCode).send(result);
}

module.exports = { generateZohoTokenHandler, refreshZohoTokenHandler }