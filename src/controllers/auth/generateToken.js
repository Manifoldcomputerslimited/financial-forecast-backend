const jwt = require('jsonwebtoken');
const db = require('../../models');
const User = db.users;
const config = require('../../../config');

const generateTokens = async (user) => {
  let refreshToken = user.token;
  delete user.token;
  let payload = {
    ...user,
  };

  try {
    const accessToken = jwt.sign(payload, config.ACCESS_TOKEN_PRIVATE_KEY, {
      expiresIn: '1d',
    });

    if (refreshToken === null) {
      refreshToken = jwt.sign(payload, config.REFRESH_TOKEN_PRIVATE_KEY, {});
      const user = await User.findOne({ where: { email: payload.email } });

      await user.update({ token: refreshToken });
    }

    return Promise.resolve({ accessToken, refreshToken });
  } catch (e) {
    return Promise.reject(e);
  }
};

module.exports = { generateTokens };
