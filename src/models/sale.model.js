module.exports = (sequelize, DataTypes) => {
    const Sale = sequelize.define("sale", {
        saleOrderId: {
            type: DataTypes.STRING,
        },
        customerName: {
            type: DataTypes.STRING,
        },
        status: {
            type: DataTypes.STRING,
        },
        salesOrderNumber: {
            type: DataTypes.STRING,
        },
        refrenceNumber: {
            type: DataTypes.STRING,
        },
        date: {
            type: DataTypes.STRING,
        },
        shipmentDate: {
            type: DataTypes.STRING,
        },
        currencyCode: {
            type: DataTypes.STRING,
        },
        total: {
            type: DataTypes.DECIMAL(12, 2),
            defaultValue: 0.0
        },
        naira: {
            type: DataTypes.DECIMAL(12, 2),
            defaultValue: 0.0
        },
        dollar: {
            type: DataTypes.DECIMAL(12, 2),
            defaultValue: 0.0
        },
        exchangeRate: {
            type: DataTypes.DECIMAL(10, 6),
            defaultValue: 0.0
        },
        forecastType: {
            type: DataTypes.STRING,
        },
        userId: {
            type: DataTypes.STRING,
            allowNull: false,
        },
    });

    return Sale;
}
