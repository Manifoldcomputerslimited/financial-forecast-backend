const jwt = require("jsonwebtoken");
const db = require("../../models");
const User = db.users;

const generateTokens = async (user) => {
  let refreshToken = user.token;
  delete user.token;
  let payload = {
    ...user
  };


  try {
    const accessToken = jwt.sign(
      payload,
      process.env.ACCESS_TOKEN_PRIVATE_KEY,
      {
        expiresIn: "1d",
      }
    );

    if (refreshToken === null) {
      refreshToken = jwt.sign(
        payload,
        process.env.REFRESH_TOKEN_PRIVATE_KEY,
        {
          expiresIn: "360d",
        }
      );
      const user = await User.findOne({ where: { email: payload.email } });
      
      await user.update({ token: refreshToken });
      console.log(user)
    }

    return Promise.resolve({ accessToken, refreshToken });
  } catch (e) {
    return Promise.reject(e);
  }
};

module.exports = { generateTokens };
