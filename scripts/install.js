var ftp = require('ftp'),
  mysql = require('mysql');

var dbName = 'bls';
var client = new ftp ({host : 'ftp.bls.gov'}),
  connection = mysql.createConnection({user : 'root', password : process.argv[process.argv.length - 1], database : 'bls'});

client.on('connect', function () {
  client.auth(function (e) {
    if (e) {
		throw e;
	 } else {
      connection.query('SELECT * from import', function (error, results) {
/*
		  console.log(error);
		  console.log('results: ');
		  console.log(results);	  
*/
		  for (var index = 0; index < results.length; index++) {
          
        }
		});
/*
      client.list('/pub/time.series', function (e, entities) {
	     
		  for (var index = 0; index < entities.length; index++) {
		  	 var dirName = entities[index];
			 
		  }
		});
*/
	 }
  });
});

if (process.argv[1] == '-f') {
  connection.query('DROP SCHEMA ' + dbName + ';', function (error, results) {
    client.connect();
  });
} else {
  client.connect();
}
