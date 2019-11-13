/**
 * http://usejsdoc.org/
 */

var mysql = require('mysql');
var fs = require('fs');
var connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'password',
    database: 'team'
});

var filename='Sample.txt';
var list=filename.split(".");
var tableName=list[0];

var value=fs.readFileSync(filename, 'utf8'); 

var temp=value.split(/\r\n|\n/);
var columnname=temp[0].split(",");
var i;
connection.connect(function(err)
{
	if (err) throw err;
	console.log("ABC");
	
for( i=0;i<columnname.length;i++)
	{
		if(i==0)
			{
			//connection.connect(function(err) {
				//if (err) throw err;
				  //console.log("Connected!");
				 //var sql = "CREATE TABLE cus (name VARCHAR(255), address VARCHAR(255))";
				
				 var sql="CREATE TABLE "+tableName+" ("+columnname[0]+" VARCHAR(255)"+");";
				  connection.query(sql, function (err, result) {
				    if (err) throw err;
				    console.log("Table created");
				  });
				//});
			}
		else
			{
			//connection.connect(function(err) {
				//if (err) throw err;
				  //console.log("Connected!");
				 var sql="ALTER TABLE "+tableName+" ADD COLUMN "+columnname[i]+" VARCHAR(255);";
				  connection.query(sql, function (err, result) {
				    if (err) throw err;
				    console.log("Column Inserted");
				  });
				//});	
			}
	}

	
});






