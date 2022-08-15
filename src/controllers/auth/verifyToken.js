const jwt = require("jsonwebtoken");
const db = require("../../models");
const User = db.users;

const verifyToken = async (req, reply, done) => {
    const token = req?.headers?.authorization?.split(" ")[1];
    console.log('verify token', token)
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_PRIVATE_KEY);

    if (!decoded) {
        throw new Error("Authorization failed");
    }

    let user = await User.findOne({
        where: { email: decoded.email }
    });
    if (!user) {
        throw new Error("Authentication failed");
    }

    req.user = user.dataValues;
};

module.exports = verifyToken;
