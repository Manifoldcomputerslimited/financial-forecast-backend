module.exports = (sequelize, DataTypes) => {
  const Rate = sequelize.define('rate', {
    old: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0.0,
    },
    latest: {
      type: DataTypes.DECIMAL(10, 2),
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

  return Rate;
};
