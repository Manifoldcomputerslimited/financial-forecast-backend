module.exports = (sequelize, DataTypes) => {
  const BankAccount = sequelize.define('bankAccount', {
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
    balance: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0.0,
    },
  });

  return BankAccount;
};
