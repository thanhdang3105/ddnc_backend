const { DataTypes } = require('sequelize');
const sequelize = require('../utils/database.js');

const Users = sequelize.define('Users', {
    ID: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    name: DataTypes.STRING,
    email: {
        type: DataTypes.STRING,
        unique: true
    },
    password: DataTypes.STRING,
    token: DataTypes.STRING
});

module.exports = Users;