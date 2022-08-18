module.exports = (sequelize, DataTypes) => {
    const Rate = sequelize.define("rate", {
        value: {
            type: DataTypes.DECIMAL(10, 2),
            defaultValue: 0.0
        },
    });

    return Rate;
}
