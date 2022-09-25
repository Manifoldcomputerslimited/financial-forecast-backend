let CryptoJS = require("crypto-js");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require('uuid');
const { sendEmail } = require('../../helpers/email');
const { generateTokens } = require("../auth/generateToken");
const { verifyRefreshToken } = require("../auth/verifyRefreshToken");

const db = require("../../models");
const User = db.users;

async function findUserByEmailStatus(email, status, raw = true) {
    return await User.findOne({ where: { email, status }, raw: raw });
}

async function findUserByEmail(email) {
    return await User.findOne({ where: { email }, raw: true });
}

/**
 * invite or re-invite a user
 * by default user role is 'user'
 * @param {string} email - the email of the user.
 * @returns {object} - information about the user.
 */
const inviteUserHandler = async (req, reply) => {
    const { email } = req.body
    const status = false

    try {
        let user;
        // check if email doesn't already exist
        let userExists = await findUserByEmail(email)

        // check if user has already registered
        if (userExists && userExists.status)
            return reply.code(409).send({
                status: false,
                message: "User already exist",
            });

        // generate a unique token for the user
        let token = uuidv4();
        let ciphertext = CryptoJS.AES.encrypt(token, 'ManifoldSecret').toString();

        // remove special characters to the token
        let updatedCipherText = ciphertext.toString().replaceAll('+', 'xMl3Jk').replaceAll('/', 'Por21Ld').replaceAll('=', 'Ml32');

        // invite a new user
        if (!userExists) {
            // store the data in the database
            user = await User.create({
                email,
                inviteToken: token,
                inviteDate: new Date(),
            });
        }

        // re-invite a user
        if (userExists && !userExists.status) {
            // update the user's status to false
            user = await User.update({
                inviteToken: token,
                inviteDate: new Date(),
            }, { where: { email } });
        }

        const details = {
            name: 'User',
            templateToUse: "invite",
            url: `http://localhost:3000/register/${updatedCipherText}`,
        }

        // invite user by sending an email
        await sendEmail(email, "Manifold Forecast Invitation", "Please click the link below to complete registration", details);

        statusCode = 200;

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

/**
 * login a user
 * @param {string} email - the email of the user.
 * @param {string} password - the password of the user.
 * @returns {object} - information about the user.
 */
const loginUserHandler = async (req, reply) => {
    const { email, password } = req.body;
    const status = true;

    try {
        // check if email exists
        let user = await findUserByEmailStatus(email, status);

        if (!user)
            return reply.code(500).send({
                status: false,
                message: "Invalid email or password",
            });

        // check if password matches
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch)
            return reply.code(401).send({
                status: false,
                message: "Invalid email or password",
            });

        // generate tokens
        const { accessToken, refreshToken } = await generateTokens(user);

        statusCode = 200;

        result = {
            status: true,
            message: "User logged in successfully",
            data: {
                accessToken,
                refreshToken,
                isZohoAuthenticated: user.isZohoAuthenticated ? true : false
            },
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

/**
 * register a user
 * @param {string} firstName - the first name of the user.
 * @param {string} lastName - the last name of the user.
 * @param {string} email - the email of the user.
 * @param {string} password - the password of the user.
 * @param {object} inviteToken - the token generated when an invite is sent to a user.
 * @returns {object} - information about the user.
 */
const registerUserHandler = async (req, reply) => {
    const { firstName, lastName, email, password, inviteToken } = req.body;

    try {
        // TODO:: check if link has expired
        // add special characters to the token
        let updatedToken = inviteToken.toString().replaceAll('xMl3Jk', '+').replaceAll('Por21Ld', '/').replaceAll('Ml32', '=');

        // decrypt the invitation token
        let bytes = CryptoJS.AES.decrypt(updatedToken, 'ManifoldSecret');
        let originalText = bytes.toString(CryptoJS.enc.Utf8);

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // check if email and token match the database
        let user = await User.findOne({ where: { email, inviteToken: originalText } });

        // check if user has been invited
        if (!user)
            return reply.code(401).send({
                status: false,
                message: "Invalid email or token",
            });

        // check if user has already completed registration
        if (user.status)
            return reply.code(409).send({
                status: false,
                message: "Already registered",
            });

        // update the user's status to true
        await User.update({
            firstName,
            lastName,
            status: true,
            password: hashedPassword,
        }, { where: { email } });

        // send an email to the user to notify them of their registration
        const details = {
            name: `${firstName} ${lastName}`,
            templateToUse: "signup",
            url: `http://localhost:3000/`,
        }

        sendEmail(email, "Manifold Forecast Signup", "Registration completed", details);

        statusCode = 201;

        result = {
            status: true,
            message: "User registered successfully",
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

// A user who wants to refresh token
const refreshTokenHandler = async (req, reply) => {
    try {
        const { refreshToken } = req.body;
        const { tokenDetails } = await verifyRefreshToken(refreshToken, reply);

        if (!tokenDetails) {
            return reply.code(401).send({
                status: false,
                message: "Invalid email or password",
            });
        }

        delete tokenDetails.exp;
        delete tokenDetails.iat;

        const accessToken = jwt.sign(
            tokenDetails,
            process.env.ACCESS_TOKEN_PRIVATE_KEY,
            { expiresIn: "1d" }
        );

        statusCode = 200;

        // return all information about the user
        result = {
            status: true,
            message: "Access token created successfully",
            data: {
                accessToken,
            },
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

const getUserHandler = async (req, reply) => {
    try {

        let user = await User.findOne({
            where: { id: req.user.id },
        });

        if (!user)
            return reply.code(404).send({
                status: false,
                message: "User Not Found",
            });

        statusCode = 200;

        result = {
            status: true,
            message: "User fetched successfully",
            data: user,
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

/**
 * view all users
 * @returns {object} - information about the user.
 */
const getUsersHandler = async (req, reply) => {

    try {
        let users = await User.findAll();

        statusCode = 200;

        result = {
            status: true,
            message: "Users retrieved successfully",
            data: users,
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

/**
 * update user role
 * @returns {object} - information about the user.
 */
const updateUserRoleHandler = async (req, reply) => {

    try {
        let { role, email } = req.body
        let isAdmin = req.user.role


        if (!isAdmin)
            return reply.code(401).send({
                status: false,
                message: "You are not authorized to perform this action",
            });


        let user = await User.findOne({
            where: { email },
        });

        if (!user.status)
            return reply.code(400).send({
                status: false,
                message: "User has not completed registration",
            });


        if (!user)
            return reply.code(404).send({
                status: false,
                message: "User Not Found",
            });

        await user.update({ role });

        statusCode = 200;

        result = {
            status: true,
            message: "User role updated successfully",
        };

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


const updatePasswordHandler = async (req, reply) => {
    try {
        const { currentPassword, newPassword } = req.body
        const { id } = req.user

        const user = await User.findOne({ where: { id } })

        if (!user)
            return reply.code(404).send({
                status: false,
                message: "User not found"
            })

        // check if the current password is correct
        const isMatch = await bcrypt.compare(currentPassword, user.password)

        if (!isMatch)
            return reply.code(400).send({
                status: false,
                message: "Your current password does not match the old password",
            });

        // hash the new password
        const encryptedPassword = await bcrypt.hash(newPassword, 10);

        // update the password
        await user.update({ password: encryptedPassword });

        statusCode = 200;

        result = {
            status: true,
            message: "Password updated successfully",
            data: null,
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

const forgotPasswordHandler = async (req, reply) => {
    try {
        const { email } = req.body

        // check if email exist and status is false
        let userExists = await findUserByEmailStatus(email, true)

        if (!userExists)
            return reply.code(409).send({
                status: false,
                message: "User Not Found",
            });

        // encrypt the email
        let ciphertext = CryptoJS.AES.encrypt(userExists.email, 'ManifoldSecret').toString();

        // remove special characters to the token
        let updatedCipherText = ciphertext.toString().replaceAll('+', 'xMl3Jk').replaceAll('/', 'Por21Ld').replaceAll('=', 'Ml32');

        const details = {
            name: userExists.firstName,
            templateToUse: "passwordReset",
            url: `http://localhost:3000/reset-password/${updatedCipherText}`,
        }

        console.log(details)
        // invite user by sending an email
        await sendEmail(email, "Reset Manifold Forecast Password", "Please click the link below to reset password", details);

        statusCode = 200;

        result = {
            status: true,
            message: "Password reset link sent successfully",
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

const resetPasswordHandler = async (req, reply) => {
    try {
        const { password, token } = req.body

        // add special characters to the token
        let updatedToken = token.toString().replaceAll('xMl3Jk', '+').replaceAll('Por21Ld', '/').replaceAll('Ml32', '=');

        // decrypt the invitation token
        let bytes = CryptoJS.AES.decrypt(updatedToken, 'ManifoldSecret');
        let email = bytes.toString(CryptoJS.enc.Utf8);

        // check if email exist and status is false
        let userExists = await findUserByEmailStatus(email, true, false)

        if (!userExists)
            return reply.code(409).send({
                status: false,
                message: "User Not Found",
            });

        // hash the new password
        const encryptedPassword = await bcrypt.hash(password, 10);

        // update the password
        await userExists.update({ password: encryptedPassword });

        statusCode = 200;

        result = {
            status: true,
            message: "Password reset successfully",
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

const deleteUserHandler = async (req, reply) => {
    try {
        // TODO:: only admin should be able to delete a user
        const id = req.params.id;

        let user = await User.findOne({
            where: { id },
        });

        if (!user)
            return reply.code(404).send({
                status: false,
                message: "User Not Found",
            });

        user.destroy();

        statusCode = 200;

        result = {
            status: true,
            message: "User deleted successfully",
            data: {},
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

module.exports = {
    inviteUserHandler,
    loginUserHandler,
    registerUserHandler,
    getUserHandler,
    refreshTokenHandler,
    updatePasswordHandler,
    forgotPasswordHandler,
    resetPasswordHandler,
    getUsersHandler,
    updateUserRoleHandler,
    deleteUserHandler
}