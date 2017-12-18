let mysql = require('mysql');

let poolLocal = mysql.createPool({
    multipleStatements: true,
    connectionLimit: 1000,
    host:   'ddolfsb30gea9k.c36ugxkfyi6r.us-west-2.rds.amazonaws.com',
    user:   'kmocorro',
    password:   'kmocorro123',
    database:   'fab4_apps_db'
});

exports.poolLocal = poolLocal;