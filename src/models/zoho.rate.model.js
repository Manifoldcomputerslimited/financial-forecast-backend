module.exports = (sequelize, DataTypes) => {
  const ZohoRate = sequelize.define('zohorate', {
    rate: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0.0,
    },
  });

  return ZohoRate;
};
