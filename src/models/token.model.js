module.exports = (sequelize, DataTypes) => {
    const Token = sequelize.define("token", {
        // Refresh token generated after successful authentication with zoho
        zohoRefreshToken: {
            type: DataTypes.TEXT('long'),
        },
        zohoTokenExpiry: {
            type: DataTypes.DATE,
        },
        zohoTokenDate: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
        }
    });

    return Token;
}
