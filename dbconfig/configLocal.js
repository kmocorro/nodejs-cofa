let mysql = require('mysql');

let poolLocal = mysql.createPool({
    multipleStatements: true,
    connectionLimit: 1000,
    host:   'localhost',
    user:   'root',
    password:   '2qhls34r',
    database:   'dbcofa'
});

exports.poolLocal = poolLocal;