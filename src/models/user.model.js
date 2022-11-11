module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('user', {
    firstName: {
      type: DataTypes.STRING,
    },
    lastName: {
      type: DataTypes.STRING,
    },
    email: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
    },
    password: {
      type: DataTypes.STRING,
    },
    // status is true if the user has verified their email address and completed registration
    status: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    // role is true:1 for admin and false:0 for user
    role: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    // super admin
    super: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    // Token generated when an invite is sent to a user
    inviteToken: {
      type: DataTypes.TEXT('long'),
    },
    // Access token generated when a user logs in
    token: {
      type: DataTypes.TEXT('long'),
    },
    inviteDate: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    isZohoAuthenticated: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  });

  return User;
};
