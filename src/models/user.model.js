module.exports = (sequelize, DataTypes) => {
    const User = sequelize.define("user", {
        firstName: {
            type: DataTypes.STRING,
        },
        lastName: {
            type: DataTypes.STRING,
        },
        email: {
            type: DataTypes.STRING,
            unique: true,
            allowNull: false,
        },
        password: {
            type: DataTypes.STRING,
        },
        status: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
        },
        role: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
        },
        token: {
            type: DataTypes.TEXT('long'),
        },
        inviteDate: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
        }
    });

    return User;
}
