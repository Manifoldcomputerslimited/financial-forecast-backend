require('dotenv').config();
const Sequelize = require('sequelize');
const config = require('../../config');

let sequelize;

sequelize = new Sequelize(
  `${config.MYSQL_DATABASE}`,
  `${config.MYSQL_USERNAME}`,
  config.MYSQL_ROOT_PASSWORD,
  {
    host: config.MYSQL_HOST,
    port: config.MYSQL_DOCKER_PORT,
    dialect: 'mysql',
    operatorsAliases: 0,
    timezone: '+01:00',

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

db.users = require('./user.model')(sequelize, Sequelize);
db.tokens = require('./token.model')(sequelize, Sequelize);
db.rates = require('./rate.model')(sequelize, Sequelize);
db.zohorates = require('./zoho.rate.model')(sequelize, Sequelize);
db.invoices = require('./invoice.model')(sequelize, Sequelize);
db.invoiceForecasts = require('./invoice.forecast.model')(sequelize, Sequelize);
db.sales = require('./sale.model')(sequelize, Sequelize);
db.saleForecasts = require('./sale.forecast.model')(sequelize, Sequelize);
db.bills = require('./bill.model')(sequelize, Sequelize);
db.billForecasts = require('./bill.forecast.model')(sequelize, Sequelize);
db.initialBalances = require('./initial.balance.model')(sequelize, Sequelize);
db.openingBalances = require('./opening.balance.model')(sequelize, Sequelize);
db.bankAccounts = require('./bank.account.model')(sequelize, Sequelize);
db.overdrafts = require('./overdraft.model')(sequelize, Sequelize);

db.tokens.belongsTo(db.users, { foreignKey: 'userId' });
db.users.hasMany(db.tokens, { foreignKey: 'userId' });

sequelize
  .sync({ alter: true })
  .then(async () => {
    // await db.roles.create({
    //   name: "Admin",
    //   description: "The admin",
    // });
  })
  .catch((err) => {
    console.log(err);
  });
module.exports = db;
