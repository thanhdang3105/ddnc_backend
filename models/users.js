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
    role: {
        type: DataTypes.STRING,
        defaultValue: 'employee'
    } // 'employee' or 'manager' or 'admin'
});

module.exports = Users;