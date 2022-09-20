module.exports = (sequelize, DataTypes) => {
    const InitialBalance = sequelize.define("initialBalance", {
        nairaOpeningBalance: {
            type: DataTypes.DECIMAL(12, 2),
            defaultValue: 0.0
        },
        dollarOpeningBalance: {
            type: DataTypes.DECIMAL(12, 2),
            defaultValue: 0.0
        },
    });

    return InitialBalance;
}