let CryptoJS = require("crypto-js");
const { v4: uuidv4 } = require('uuid');
const { sendEmail } = require('../../helpers/email');

const db = require("../../models");
const User = db.users;

async function findUserByEmail(email) {
    return await User.findOne({ where: { email }, raw: true });
}

/**
 * invite a user
 * @param {string} email - the email of the user.
 * @returns {object} - information about the user.
 */
const inviteUserHandler = async (req, reply) => {
    const { email } = req.body;

    try {
        // check if email doesn't already exist
        let userExists = await findUserByEmail(email);

        if (userExists)
            return reply.code(409).send({
                status: false,
                message: "User Already Invited",
            });

        // generate a unique token for the user
        let token = uuidv4();
        let ciphertext = CryptoJS.AES.encrypt(token, 'ManifoldSecret').toString();

        // store the data in the database
        const user = await User.create({
            email,
            token: ciphertext,
            inviteDate: new Date(),
        });

        const details = {
            name: 'Manny',
            templateToUse: "invite",
            url: `http://localhost:3000/update/${user.token}`,
        }

        // invite user by sending an email
        await sendEmail(email, "Manifold Forecast Invite", "Please click the link below to complete registration", details);

        if (emailResponse)
        statusCode = 201;

        result = {
            status: true,
            message: "Users invited successfully",
        };

    } catch (e) {
        statusCode = e.code;
        result = {
            status: false,
            message: e.message,
        };
    }

    return reply.status(statusCode).send(result);
}

const loginHandler = async (req, reply) => {
}

const registerHandler = async (req, reply) => {
    const { firstName, lastName, email, password, token } = req.body;

    try {

        var bytes = CryptoJS.AES.decrypt(ciphertext, 'ManifoldSecret');
        var originalText = bytes.toString(CryptoJS.enc.Utf8);

        console.log(originalText);

    } catch (error) {

    }
}

module.exports = {
    inviteUserHandler,
    loginHandler,
    registerHandler
}