const { DataTypes } = require('sequelize');
const sequelize = require('../utils/database.js');

const Products = sequelize.define('Products', {
    ID: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    name: DataTypes.STRING,
    price: DataTypes.DOUBLE,
    unit: DataTypes.STRING,
    isClose: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    createdBy: {
        type: DataTypes.UUID,
        allowNull: false
    }
});

module.exports = Products;