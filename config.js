require('dotenv').config(process.env.NODE_ENV === 'development' ? { path: `.env.development` } : null)

module.exports = {
    NODE_ENV: process.env.NODE_ENV,
    HOST: process.env.HOST,
    PORT: process.env.PORT,
    MYSQL_DATABASE: process.env.MYSQL_DATABASE,
    MYSQL_USERNAME: process.env.MYSQL_USERNAME,
    MYSQL_ROOT_PASSWORD: process.env.MYSQL_ROOT_PASSWORD,
    MYSQL_HOST: process.env.MYSQL_HOST,
    MYSQL_DOCKER_PORT: process.env.DOCKER_PORT,

    SMTP_HOST: process.env.SMTP_HOST,
    SMTP_PORT: process.env.SMTP_PORT,
    SMTP_USER: process.env.SMTP_USER,
    SMTP_PASS: process.env.SMTP_PASS,
    EMAIL_FROM: process.env.EMAIL_FROM,

    ACCESS_TOKEN_PRIVATE_KEY: process.env.ACCESS_TOKEN_PRIVATE_KEY,
    REFRESH_TOKEN_PRIVATE_KEY: process.env.REFRESH_TOKEN_PRIVATE_KEY,

    ZOHO_CLIENT_ID: process.env.ZOHO_CLIENT_ID,
    ZOHO_CLIENT_SECRET: process.env.ZOHO_CLIENT_SECRET,
    ZOHO_BASE_URL: process.env.ZOHO_BASE_URL,
    ZOHO_BOOK_BASE_URL: process.env.ZOHO_BOOK_BASE_URL,
    ZOHO_REFRESH_TOKEN: process.env.ZOHO_REFRESH_TOKEN,
    ZOHO_REDIRECT_URI: process.env.ZOHO_REDIRECT_URI,

    ORGANIZATION_ID: process.env.ORGANIZATION_ID,
    DOLLAR_CURRENCY_ID: process.env.DOLLAR_CURRENCY_ID,

    BASE_URL: process.env.BASE_URL,
    BASE_TEST_URL: process.env.BASE_TEST_URL,


}