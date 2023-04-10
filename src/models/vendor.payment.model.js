module.exports = (sequelize, DataTypes) => {
  const VendorPayment = sequelize.define('vendorPayment', {
    paymentId: {
      type: DataTypes.STRING,
    },
    vendorId: {
      type: DataTypes.STRING,
    },
    vendorName: {
      type: DataTypes.STRING,
    },
    billNumbers: {
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
    purchaseForcastbalance: {
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

  return VendorPayment;
};
