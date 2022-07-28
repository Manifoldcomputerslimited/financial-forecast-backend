const jwt = require("jsonwebtoken");
const db = require("../../models");
const User = db.users;

const generateTokens = async (user) => {
  let payload = user;
  try {
    const accessToken = jwt.sign(
      payload,
      process.env.ACCESS_TOKEN_PRIVATE_KEY,
      {
        expiresIn: "50m",
      }
    );

    const refreshToken = jwt.sign(
      payload,
      process.env.REFRESH_TOKEN_PRIVATE_KEY,
      {
        expiresIn: "30d",
      }
    );

    const user = await User.findOne({ id: payload.id });

    await user.update({ token: refreshToken });

    return Promise.resolve({ accessToken, refreshToken });
  } catch (e) {
    return Promise.reject(e);
  }
};

module.exports = { generateTokens };
