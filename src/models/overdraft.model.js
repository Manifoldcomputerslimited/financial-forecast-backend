module.exports = (sequelize, DataTypes) => {
  const Overdraft = sequelize.define('overdraft', {
    accountId: {
      type: DataTypes.STRING,
    },
    accountName: {
      type: DataTypes.STRING,
    },
    accountType: {
      type: DataTypes.STRING,
    },
    accountNumber: {
      type: DataTypes.STRING,
    },
    bankName: {
      type: DataTypes.STRING,
    },
    currency: {
      type: DataTypes.STRING,
    },
    amount: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0.0,
    },
  });

  return Overdraft;
};
