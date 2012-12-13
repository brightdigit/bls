var ftp = require('ftp-get'),
  mysql = require('mysql'),
  os = require('os'),
  path = require('path'),
  fs = require('fs'),
  spawn = require('child_process').spawn;

function makeid()
{
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for( var i=0; i < 5; i++ )
        text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text;
}

/*
select concat('drop table if exists ', table_name, ';') from meta group by table_name
union
select concat('create table ', table_name, '(', group_concat(concat_ws(' ',column_name, column_type, IF(nullable,'DEFAULT NULL','NOT NULL'))), ');') from meta group by table_name
union
select concat('load data local infile \'', @basedirectory, '/ftp.bls.gov/pub/time.series/', file_name,'\' into table ', table_name,  ' ignore 1 lines;') from import;
*/

function beginDownload() {
  connection.query('CREATE SCHEMA IF NOT EXISTS ' + dbName + ';', function (error, results) {
    connection.changeUser({database : dbName}, function (error) {
      fs.readFile(path.resolve(__dirname, 'init_db.sql'), 'UTF-8', function (error, data) {
        connection.query(data, function (error, results) {
          connection.query("select concat('create table ', table_name, '(', group_concat(concat_ws(' ',column_name, column_type, IF(nullable,'DEFAULT NULL','NOT NULL'))), ');') as value from meta group by table_name", function (error, results) {

            connection.query(results.map(function (current) {return current.value;}).join(''), function (error, results) {
              connection.query('SELECT * from import', function (error, results) {
                var count = results.length;
                var directories = {};
                results.map(function (value) {
                  var paths = value['file_name'].split('/');
                  return { dir : paths[0], file : paths[1], tmpFile : path.join(tmpDir, value['file_name']), table :  value['table_name']};
                }).forEach(function (value) {
                  if (!directories[value.dir]) {
                    directories[value.dir] = [];
                  }
                  directories[value.dir].push(value);
                });
                for(var dirName in directories) {
                  var copyDir = path.join(tmpDir, dirName);
                  fs.mkdir(copyDir, function (error) {
                    directories[dirName].forEach( function (value){
                      var fullFileName = path.join(copyDir, value.file);
                      var tableName = value.table;
                      var tmpFile = value.tmpFile;

                      console.log('downloading ' + dirName + '/' + value.file + ' for ' + value.table + '...');
                      ftp.get('ftp://ftp.bls.gov/pub/time.series/' + dirName + '/' + value.file, value.tmpFile, function (error, result) {
                        var filePath = path.sep === '\\' ? result.replace(/\\/g, '/') : result;
                        var sql = 'load data local infile \'' + filePath + '\' into table ' + tableName + ' ignore 1 lines;';
                        console.log('importing ' + value.file + ' to ' + value.table);
                        var ps = spawn('mysql', ['-e', sql, '-u', 'root', '-p'+settings.password, dbName]);
                        ps.stdout.on('data', function (data) {
                          console.log('stdout: ' + data);
                        });
                        ps.stderr.on('data', function (data) {
                          console.log('stderr: ' + data);
                        });
                        ps.on('exit', function (code) {
                          count--;
                          if (count === 0) {
                            fs.readFile(path.resolve(__dirname, 'post_import_alter.sql'), 'UTF-8', function (error, data) {
                              console.log('cleaning up data...');
                              connection.query(data, function (error){
                                if (error) {
                                  throw error;
                                } else {                                  
                                  fs.readFile(path.resolve(__dirname, 'verify_integrity.sql'), 'UTF-8', function (error, data) {
                                    console.log('verifying data integrity...');
                                    connection.query(data, function (error, results){
                                      if (error) {
                                        throw error;
                                      } else {                                 
                                        if (results.every(function (value) {return value[0].count === 0;})) {
                                          console.log('done.'); 
                                          // go through each description and clean up the text
                                          process.exit(0);
                                        } else {
                                          console.log('warning data integrity check failed');
                                          console.log('done.'); 
                                          process.exit(1);
                                        }
                                      }
                                    });
                                  });
                                }
                              });
                            });
                          }
                        });
                      });
                    });
                  });
                }
              });
            });
          });
        });
      });
    });
  });
}

var settings = {user : 'root', password : process.argv[process.argv.length - 1], multipleStatements: true, debug : false};
var ftpBaseDir = '/pub/time.series/';
var tmpDir = path.join(os.tmpDir(), makeid());
var dbName = 'bls';
var connection = mysql.createConnection(settings);

fs.mkdir(tmpDir, function (error) {
  if (process.argv[2] == '-f') {
    connection.query('DROP SCHEMA ' + dbName + '; CREATE SCHEMA ' + dbName + ';', function (error, results) {
      console.log('Schema dropped.');
      beginDownload();
    });
  } else {
    beginDownload();
  }
});
