const jwt = require("jsonwebtoken");
const db = require("../../models");
const config = require('../../../config');
const User = db.users;


const verifyRefreshToken = (refreshToken, reply) => {
    const privateKey = config.REFRESH_TOKEN_PRIVATE_KEY;

    return new Promise((resolve, reject) => {
        const user = User.findOne({
            where: { token: refreshToken },
        });

        if (!user)
            return reply.code(500).send({
                statusCode: 500,
                message: "Invalid refresh token",
                error: true,
            });

        jwt.verify(refreshToken, privateKey, (err, tokenDetails) => {
            if (err)
                return reply.code(500).send({
                    statusCode: 500,
                    message: "Invalid refresh token",
                    error: true,
                });
            resolve({
                tokenDetails,
                error: false,
                message: "Valid refresh token",
            });
        });
    });
};

module.exports = { verifyRefreshToken };
