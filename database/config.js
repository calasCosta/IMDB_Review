var mysql = require('mysql2/promise');
require('dotenv').config()

async function getConnection(){
    var connection = await mysql.createConnection({
        host: process.env.HOST,
        user: process.env.USER,
        password: process.env.PASSWORD,
        database: process.env.DATABASE
    });
    return connection;
}
module.exports = {getConnection};