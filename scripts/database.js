var ftp = require('ftp-get'),
  mysql = require('mysql'),
  os = require('os'),
  path = require('path'),
  fs = require('fs'),
  spawn = require('child_process').spawn;

/*
if (process.argv.length < 3) {
  console.log(process.argv[0] + ' ' + __filename + ' (-f) dbpassword');
  process.exit(1); 
}
*/

var Database = (function () {

  var dbName = 'bls';

  function merge_options(obj1,obj2){
      var obj3 = {};
      for (var attrname in obj1) { obj3[attrname] = obj1[attrname]; }
      for (var attrname in obj2) { obj3[attrname] = obj2[attrname]; }
      return obj3;
  }

  function makeid()
  {
      var text = "";
      var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

      for( var i=0; i < 5; i++ )
          text += possible.charAt(Math.floor(Math.random() * possible.length));

      return text;
  }

  function parseValue (str) {
    // if is a fraction
    if (str.indexOf('/') >= 0) {
      return str.split('/').reduce(function (prev, current, index) {
        if (index === 0) {
          return current;
        } else {
          return prev/current;
        }
      });
    // if it contains per
    } else if (str.indexOf('per') >= 0) {
      return 1;
    // if it can be parsed as an float
    } else {
      return parseFloat(str.match(/\d+(?:[.,]\d+)?/));
    }
    return 1;
  }

  var setup = function (env, debug) {
    this.env = env;
    this.debug = debug;
  };

  setup.prototype = {
    begin : function () {
      this.connect();
    },
    onData : function (data) {
      if (this.debug) {console.log(data);}
    },
    onError : function (error) {
      if (error) {console.log(error);}      
    },
    executeScript : function (filename, cb) {
      var connection = this.connection;

      fs.readFile(path.resolve(__dirname, filename), 'UTF-8', 
        function (error, data) {
          if (error) {
            cb(error);
          } else {
            connection.query(data, cb);  
          }
        }
      );
    },
    connect : function () {

      console.log('connecting to db...');

      this.connection = mysql.createConnection(
        merge_options(this.env.database, {
          multipleStatements: true, 
          debug : this.debug
        }));
      this.connection.connect(this.tmpDir.bind(this));
    },
    tmpDir : function (error) {

      if (error) {
        this.onError(error);
        return;
      }

      console.log('making temporary directory...');
      this.tmpDirPath = path.join(os.tmpDir(), makeid());
      console.log(this.dropDb);
      fs.mkdir(this.tmpDirPath, this.dropDb.bind(this));
    },
    dropDb : function (error) {

      if (error) {
        this.onError(error);
        return;
      }

      console.log('recreating db...');
      this.connection.query(
        'DROP SCHEMA if exists ' + dbName + '; CREATE SCHEMA ' + dbName + '; GRANT ALL PRIVILEGES ON '+dbName+'.* To \'' + this.env.database.user + '\'@\'localhost\'',
        this.changeUser.bind(this));
    },
    changeUser : function (error) {
      if (error) {
        this.onError(error);
        return;
      }

      console.log('reconnecting to db...');
      this.connection.changeUser({database : dbName}, this.initializeDb.bind(this));
    },
    initializeDb : function (error) {
      if (error) {
        this.onError(error);
        return;
      }

      console.log('initializing db...');
      this.executeScript('init_db.sql', this.tablesBuildQuery.bind(this));
    },
    tablesBuildQuery : function (error, results) {
      console.log(error);
      this.connection.query(
        "select concat('create table ', table_name, '(', group_concat(concat_ws(' ',column_name, column_type, IF(nullable,'DEFAULT NULL','NOT NULL'))), ');') as value from meta group by table_name",
        this.buildTables.bind(this));
    },
    buildTables : function (error, results) {
      if (error) {
        this.onError(error);
        return;
      }

      console.log('building tables...');
      this.connection.query(
        results.map(function (current) {return current.value;}).join(''), 
        this.beginImport.bind(this));
    },
    beginImport : function (error, results) {
      if (error) {
        this.onError(error);
        return;
      }

      console.log('importing data...');
      this.connection.query('SELECT * from import', this.beginDownload.bind(this));
    },
    loadData: function (value, error, result) {

      if (error) {
        this.onError(error);
        return;
      }
      
      var tableName = value.table;
      var tmpFile = value.tmpFile;
      var filePath = path.sep === '\\' ? result.replace(/\\/g, '/') : result;
      var sql = 'load data local infile \'' + filePath + '\' into table ' + tableName + ' ignore 1 lines;';

      var ps = spawn('mysql', ['-e', sql, '-u', this.env.database.user, '-p'+this.env.database.password, dbName]);
      ps.stdout.on('data', this.onData.bind(this));
      ps.stderr.on('data', this.onError.bind(this));
      ps.on('exit', this.onLoadCompleted.bind(this));
    },
    onLoadCompleted : function (code) {
      if (code !== 0) {
        this.onError('ps process exited with code ' + code);
        return;
      }  

      this.fileCounter--;

      if (this.fileCounter === 0) {
        console.log('finished downloading files...');
        this.executeScript('post_import_alter.sql', this.beginPostImport.bind(this));
        //fs.readFile(path.resolve(__dirname, 'post_import_alter.sql'), 'UTF-8', this.beginPostImport.bind(this));
      } else {
        console.log(this.fileCounter + ' files remaining...');
      }
    },
    beginPostImport : function (error, results) {
      var quantities = results[results.length - 1].map(
        function (value) {
          return '(' + [
            "'" + value.item_code + "'",
            value.unit_id,
            parseValue(value.qty_str)
          ].join(',') + ')';
        }
      );

      var units_sql = 'INSERT INTO ap_item_unit (`item_code`, `unit_id`,`value`) VALUES ' + quantities.join(', ');

      this.connection.query(units_sql, this.verifyIntegrity.bind(this));
    },
    verifyIntegrity : function (error) {
      if (error) {
        this.onError(error);
        return;
      }

      this.executeScript('verify_integrity.sql', this.onVerification.bind(this));
    },
    onVerification : function (error, results) {
      if (results.every(function (value) {return value[0].count === 0;})) {
        console.log('done.');
        // go through each description and clean up the text
        //process.exit(0);
      } else {
        console.log('warning data integrity check failed');
        console.log('done.');
        //process.exit(1);
      }
    },
    beginDownloadFile : function (directoryPath, dirName, value) {
      //console.log(directoryPath);
      //console.log(value.tmpFile);
      var fullFileName = path.join(directoryPath, value.file);
      var ftpPath = 'ftp://ftp.bls.gov/pub/time.series/' + dirName + '/' + value.file;
      ftp.get(ftpPath, value.tmpFile, this.loadData.bind(this, value));
    },
    beginDirectoryDownload : function (directoryPath, dirName, directories, error) {
      directories[dirName].forEach(this.beginDownloadFile.bind(this, directoryPath, dirName));
    },
    makeTemporaryDataDirectory : function (dirName, directories) {
      var copyDir = path.join(this.tmpDirPath, dirName);
      fs.mkdir(copyDir, this.beginDirectoryDownload.bind(this, copyDir, dirName, directories));        
    },
    beginDownload : function (error, results) {
      
      if (error) {
        this.onError(error);
        return;
      }

      console.log('creating data directories...'); 

      var directories = this.parseDirectories(results);

      for(var dirName in directories) {
        this.makeTemporaryDataDirectory(dirName, directories);
        
      }
    },
    parseDirectories : function (results) {
      var that = this;
      var directories = {};
      this.fileCounter = results.length;
      results.map(function (value) {
        var paths = value['file_name'].split('/');
        return { dir : paths[0], file : paths[1], tmpFile : path.join(that.tmpDirPath, value['file_name']), table :  value['table_name']};
      }).forEach(function (value) {
        if (!directories[value.dir]) {
          directories[value.dir] = [];
        }
        directories[value.dir].push(value);
      });
      return directories;
    }


  };

  var my = function () {

  };

  my.prototype = {
    setup : function (env) {
      (new setup(env)).begin();
    }
  };


  my.instance = new my();

  return my;
})();

module.exports = Database.instance;

/*
function Database () {

}

Database.prototype = {
  state : undefinded,
  connection : undefinded,
  setup : function (env) {
    if (state) {
      throw 'state already defined ' + state;
    }
    state = 'running';
    this.initialize(env);
  },
  initialize : function (env) {
    var that = this;
    this.connection = this.createConnection(env);
    fs.mkdir(tmpDir, function (error) {
      connection.query('DROP SCHEMA ' + dbName + '; CREATE SCHEMA ' + dbName + ';', function (error, results) {
        if (error) {
          console.log(error);
          process.exit(1);
        }
        console.log('Schema dropped.');
        that.createSchema();
      });
    });
  },
  createSchema : function (env) {
    var that = this;
    connection.query('CREATE SCHEMA IF NOT EXISTS ' + dbName + ';', function (error, results) {
      that.changeUser()
    });
  },
  changeUser : function (env) {
    connection.changeUser({database : dbName}, function (error) {
      if (error) {
        console.log(error);
        process.exit(1);
      } else {
        that.initDb(env);
      }
    });
  },
  initDb : function (env) {
    var that = this;
    this.executeScript(this.connection, 'init_db.sql', this.createTables);
  },
  executeScript : function (connection, filename, cb) {
    fs.readFile(path.resolve(__dirname, filename), 'UTF-8', function (error, data) {
      if (error) {
        cb(error, data);
      } else {
        connection.query(data, function (error, results) {
          cb(error, results);
        });
      }
    });
  },
  createTables : function (env) {
    connection.query("select concat('create table ', table_name, '(', group_concat(concat_ws(' ',column_name, column_type, IF(nullable,'DEFAULT NULL','NOT NULL'))), ');') as value from meta group by table_name", function (error, results) {

  },
  download : function () {
    if (error) {
      console.log(error);
      process.exit(1);
    }
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
                
              });
            });
          });
        });
      });
    });
  });
  }
};

Database.makeid = function () {
  var text = "";
  var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  for( var i=0; i < 5; i++ )
      text += possible.charAt(Math.floor(Math.random() * possible.length));

  return text;
};

Database.parseValue = function(str) {
  // if is a fraction
  if (str.indexOf('/') >= 0) {
    return str.split('/').reduce(function (prev, current, index) {
      if (index === 0) {
        return current;
      } else {
        return prev/current;
      }
    });
  // if it contains per
  } else if (str.indexOf('per') >= 0) {
    return 1;
  // if it can be parsed as an float
  } else {
    return parseFloat(str.match(/\d+(?:[.,]\d+)?/));
  }
  return 1;
};

(function (Database) {
  var env; 
  Database.ActiveSetup = function (env) {

  };

  Database.ActiveSetup.prototype = {

  };
})(Database);



function makeid()
{
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for( var i=0; i < 5; i++ )
        text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text;
}

function parseValue (str) {
  // if is a fraction
  if (str.indexOf('/') >= 0) {
    return str.split('/').reduce(function (prev, current, index) {
      if (index === 0) {
        return current;
      } else {
        return prev/current;
      }
    });
  // if it contains per
  } else if (str.indexOf('per') >= 0) {
    return 1;
  // if it can be parsed as an float
  } else {
    return parseFloat(str.match(/\d+(?:[.,]\d+)?/));
  }
  return 1;
}

function beginDownload() {
  connection.query('CREATE SCHEMA IF NOT EXISTS ' + dbName + ';', function (error, results) {
    if (error) {
      console.log(error);
      process.exit(1);
    }
    connection.changeUser({database : dbName}, function (error) {
      if (error) {
        console.log(error);
        process.exit(1);
      }
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
                        if (error) {
                          console.log('error downloading file ' + value.file);
                          console.log(error);
                          process.exit(1);
                        }
                        var filePath = path.sep === '\\' ? result.replace(/\\/g, '/') : result;
                        var sql = 'load data local infile \'' + filePath + '\' into table ' + tableName + ' ignore 1 lines;';
                        console.log('importing ' + value.file + ' to ' + value.table);
                        var ps = spawn('mysql', ['-e', sql, '-u', settings.user, '-p'+settings.password, dbName]);
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
                              connection.query(data, function (error, results){
                                console.log('parsing quantities...');
                                var quantities = results[results.length - 1].map(
                                  function (value) {
                                    return '(' + [
                                      "'" + value.item_code + "'",
                                      value.unit_id,
                                      parseValue(value.qty_str)
                                    ].join(',') + ')';
                                  }
                                );
                                connection.query('INSERT INTO ap_item_unit (`item_code`, `unit_id`,`value`) VALUES ' + quantities.join(', '), function (error) {
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

var settings = {
  user : 'root', 
  password : process.argv[process.argv.length - 1], 
  multipleStatements: true, 
  debug : false
};

var ftpBaseDir = '/pub/time.series/';
var tmpDir = path.join(os.tmpDir(), makeid());
var dbName = 'bls';
var connection = mysql.createConnection(settings);

fs.mkdir(tmpDir, function (error) {
  if (process.argv[2] == '-f') {
    connection.query('DROP SCHEMA ' + dbName + '; CREATE SCHEMA ' + dbName + ';', function (error, results) {
      if (error) {
        console.log(error);
        process.exit(1);
      }
      console.log('Schema dropped.');
      beginDownload();
    });
  } else {
    beginDownload();
  }
});

Database.instance = new Database();

module.exports = Database.instance;
*/