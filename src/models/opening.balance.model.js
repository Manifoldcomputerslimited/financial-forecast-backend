module.exports = (sequelize, DataTypes) => {
    const OpeningBalance = sequelize.define("openingBalance", {
        naira: {
            type: DataTypes.DECIMAL(12, 2),
            defaultValue: 0.0
        },
        dollar: {
            type: DataTypes.DECIMAL(12, 2),
            defaultValue: 0.0
        },
        rate: {
            type: DataTypes.DECIMAL(10, 2),
            defaultValue: 0.0
        },
        amount: {
            type: DataTypes.DECIMAL(12, 2),
            defaultValue: 0.0
        },
    });

    return OpeningBalance;
}