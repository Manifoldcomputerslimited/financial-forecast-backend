module.exports = (sequelize, DataTypes) => {
  const CustomerPayment = sequelize.define('customerPayment', {
    paymentId: {
      type: DataTypes.STRING,
    },
    customerId: {
      type: DataTypes.STRING,
    },
    customerName: {
      type: DataTypes.STRING,
    },
    invoiceNumbers: {
      type: DataTypes.STRING,
    },
    refrenceNumber: {
      type: DataTypes.STRING,
    },
    date: {
      type: DataTypes.STRING,
    },
    currencyCode: {
      type: DataTypes.STRING,
    },
    amount: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0.0,
    },
    // Amount after deducting from purchase order
    balance: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0.0,
    },
    saleForcastbalance: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0.0,
    },
    exchangeRate: {
      type: DataTypes.DECIMAL(10, 6),
      defaultValue: 0.0,
    },
    forecastType: {
      type: DataTypes.STRING,
    },
    userId: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  });

  return CustomerPayment;
};
