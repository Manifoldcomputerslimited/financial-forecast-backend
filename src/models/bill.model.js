module.exports = (sequelize, DataTypes) => {
  const Bill = sequelize.define(' bill', {
    billId: {
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
    invoiceNumber: {
      type: DataTypes.STRING,
    },
    refrenceNumber: {
      type: DataTypes.STRING,
    },
    date: {
      type: DataTypes.STRING,
    },
    dueDate: {
      type: DataTypes.STRING,
    },
    currencyCode: {
      type: DataTypes.STRING,
    },
    balance: {
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

  return Bill;
};
