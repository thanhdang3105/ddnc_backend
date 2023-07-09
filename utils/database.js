const { Sequelize } = require("sequelize");

const sequelize = new Sequelize("DDNC1", "root", null, {
  host: "localhost",
  port: "3306",
  dialect:
    "mysql" /* one of 'mysql' | 'postgres' | 'sqlite' | 'mariadb' | 'mssql' | 'db2' | 'snowflake' | 'oracle' */,
});

module.exports = sequelize;
