require('dotenv').config()
const Sequelize = require("sequelize");

let sequelize;

sequelize = new Sequelize(
    `${process.env.MYSQL_DATABASE}`,
    `${process.env.MYSQL_USERNAME}`,
    process.env.MYSQL_ROOT_PASSWORD,
    {
        host: process.env.MYSQL_HOST,
        port: process.env.MYSQL_DOCKER_PORT,
        dialect: "mysql",
        operatorsAliases: 0,
        dialectOptions: {
            useUTC: false,
        },
        timezone: "+01:00",

        pool: {
            max: 5,
            min: 0,
            acquire: 30000,
            idle: 10000,
        },
    }
);

const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;

db.users = require("./user.model")(sequelize, Sequelize);

sequelize
    .sync({ alter: true })
    .then(async () => {
        console.log("updated table");

        // await db.roles.create({
        //   name: "Admin",
        //   description: "The admin",
        // });
    })
    .catch((err) => {
        console.log(err);
    });
module.exports = db;
