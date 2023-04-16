module.exports = (sequelize, DataTypes) => {
  const Purchase = sequelize.define('purchase', {
    purchaseOrderId: {
      type: DataTypes.STRING,
    },
    vendorId: {
      type: DataTypes.STRING,
    },
    vendorName: {
      type: DataTypes.STRING,
    },
    status: {
      type: DataTypes.STRING,
    },
    purchaseOrderNumber: {
      type: DataTypes.STRING,
    },
    refrenceNumber: {
      type: DataTypes.STRING,
    },
    date: {
      type: DataTypes.STRING,
    },
    deliveryDate: {
      type: DataTypes.STRING,
    },
    currencyCode: {
      type: DataTypes.STRING,
    },
    total: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0.0,
    },
    naira: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0.0,
    },
    dollar: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0.0,
    },
    // Amount after deducting from payment made
    balance: {
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

  return Purchase;
};
