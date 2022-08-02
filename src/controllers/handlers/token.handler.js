const { default: axios } = require('axios');
const db = require("../../models");
const User = db.users;
const Token = db.tokens
const dayjs = require('dayjs')
var utc = require('dayjs/plugin/utc')
var timezone = require('dayjs/plugin/timezone')

dayjs.extend(utc)
dayjs.extend(timezone)

// dayjs.tz.setDefault("Africa/Lagos")

Date.prototype.addHours = function (h) {
    this.setHours(this.getHours() + h);
    return this;
}

// this generates zoho access token
const generateZohoTokenHandler = async (req, reply) => {
    const { code } = req.body;


    try {
        let user;
        let resp;
        let url;

        const options = {
            headers: { 'Content-Type': ['application/json'] }
        }

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
        const zohoToken = await Token.findOne({
            where: {
                userId: user.id,
            }
        })

        if (!zohoToken) {
           
            if (!code) {
                console.log('code is required')
                return reply.code(400).send({
                    status: false,
                    message: 'Code is required',
                });
            }

            url = `${process.env.ZOHO_BASE_URL}?code=${code}&client_id=${process.env.ZOHO_CLIENT_ID}&client_secret=${process.env.ZOHO_CLIENT_SECRET}&redirect_uri=http://localhost:3000&grant_type=authorization_code`;

            resp = await axios.post(url,
                options)

            if (resp.data.error)
                return reply.code(400).send({
                    status: false,
                    message: 'Invalid code',
                });

            // store the zoho token in the zoho table
            await Token.create({
                userId: user.id,
                zohoToken: resp.data.access_token,
                zohoRefreshToken: resp.data.refresh_token,
                zohoTokenExpiry: dayjs().add(3600, 'second').utc(1).format(),
                zohoTokenDate: new Date().addHours(1)
            });

        } else {
            // update the token
            console.log('updaing the token')
            
            url = `${process.env.ZOHO_BASE_URL}?refresh_token=${zohoToken.zohoRefreshToken}&client_id=${process.env.ZOHO_CLIENT_ID}&client_secret=${process.env.ZOHO_CLIENT_SECRET}&redirect_uri=${process.env.ZOHO_REDIRECT_URI}&grant_type=refresh_token`;

            resp = await axios.post(url,
                options)

            if (resp.data.error) {
                return reply.code(400).send({
                    status: false,
                    message: 'Invalid code',
                });
            }

            zohoToken.update({
                zohoToken: resp.data.access_token,
                zohoTokenExpiry: dayjs().add(3600, 'second').utc(1).format(),
                zohoTokenDate: new Date().addHours(1)
            })
        }

        statusCode = 200;
        result = {
            status: true,
            message: "Zoho Token generated successfully",
            data: {
                ...resp.data
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

module.exports = { generateZohoTokenHandler }