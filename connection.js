const mysql = require("mysql");
const mysqlConnection = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "crm",
  multipleStatements: true,
});
mysqlConnection.connect((err) => {
  if (err) throw err;
  console.log("MYSQL Connected!");
});

module.exports = mysqlConnection;
