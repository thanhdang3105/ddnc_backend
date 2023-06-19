const jwt = require('jsonwebtoken');


function generateAccessToken(data) {
    return jwt.sign(data, process.env.JWT_TOKEN, { expiresIn: '3600s' });
}

module.exports = generateAccessToken