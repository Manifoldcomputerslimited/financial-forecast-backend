module.exports = (sequelize, DataTypes) => {
  const InvoiceForecast = sequelize.define('invoiceForecast', {
    dollarClosingBalance: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0.0,
    },
    nairaClosingBalance: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0.0,
    },
    month: {
      type: DataTypes.STRING,
    },
    forecastType: {
      type: DataTypes.STRING,
    }, // 1 day, 1 week, 1month, 2month etc,
    currency: {
      type: DataTypes.STRING,
    },
    userId: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  });

  return InvoiceForecast;
};
