module.exports = (sequelize, DataTypes) => {
  const InitialBalance = sequelize.define('initialBalance', {
    openingBalance: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0.0,
    },
    nairaOpeningBalance: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0.0,
    },
    dollarOpeningBalance: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0.0,
    },
    rate: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0.0,
    },
    forecastType: {
      type: DataTypes.STRING,
    }, // 1 day, 1 week, 1month, 2month etc,
    userId: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  });

  return InitialBalance;
};
