const express = require('express');
require('dotenv').config()

const sequelize = require('./utils/database.js');

const routes = require('./routes');

const app = express();

app.use(express.urlencoded({ extended: true }));

app.use(express.json());

app.use((_, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    next();
});

routes(app);

sequelize.sync({ alter: true });

app.listen(process.env.PORT, () => {
    console.log(`App listening at http://localhost:${process.env.PORT}/`)
});