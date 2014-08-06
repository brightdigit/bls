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
  var node_env = process.env.NODE_ENV;

  function merge_options(obj1, obj2) {
    for (var p in obj2) {
      try {
        // Property in destination object set; update its value.
        if ( obj2[p].constructor==Object ) {
          obj1[p] = merge_options(obj1[p], obj2[p]);

        } else {
          obj1[p] = obj2[p];

        }

      } catch(e) {
        // Property in destination object not set; create it and set its value.
        obj1[p] = obj2[p];

      }
    }

    return obj1;
  }

  function getFirstValue (obj) {
    return obj[Object.keys(obj)[0]];
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

  var setup = function (env, debug, callback) {
    this.env = env;
    this.debug = debug;
    this.callback = callback;
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
          debug : this.debug,
          database : dbName 
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
      fs.mkdir(this.tmpDirPath, this.truncateDb.bind(this));
    },
    truncateDb : function (error) {

      if (error) {
        this.onError(error);
        return;
      }

      this.connection.query('show tables', this.dropTables.bind(this));
    },
    dropTables : function (error, results) {
      if (error) {
        this.onError(error);
        return;
      }

      if (results.length > 0) {
        console.log('dropping all tables...');
        this.connection.query('drop table ' + results.map(getFirstValue).join(','), this.initializeDb.bind(this));
      } else {
        console.log('no tables to drop.');
        this.initializeDb(error, results);
      }
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
      if (error) {
        this.onError(error);
        return;
      }

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
        process.env.NODE_ENV = node_env;
        console.log('indexing and cleaning up data...');
        this.executeScript('post_import_alter.sql', this.beginPostImport.bind(this));
      } else {
        console.log(this.fileCounter + ' files remaining...');
      }
    },
    beginPostImport : function (error, results) {
      if (error) {
        this.onError(error);
        return;
      }
      
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
      if (results.some(function (value) {return value[0].count > 0;})) {
        console.log('warning data integrity check failed');
        //process.exit(1);
      }
      console.log('database setup completed.');
      this.callback(error);
    },
    beginDownloadFile : function (directoryPath, dirName, value) {
      //console.log(directoryPath);
      //console.log(value.tmpFile);
      var fullFileName = path.join(directoryPath, value.file);
      var ftpPath = 'ftp://ftp.bls.gov/pub/time.series/' + dirName + '/' + value.file;
      process.env.NODE_ENV =  'production';
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
    setup : function (env, debugOrCallback, callback) {
      /*
      console.log('debug');
      console.log(debug);
      console.log('callback');
      console.log(debugOrCallback);
      */
      var debug = (typeof(debugOrCallback)) === "function" ? 
        debug : debugOrCallback;
      callback = (typeof(debugOrCallback) === "function") ? debugOrCallback : callback;
      (new setup(env, debug, callback)).begin();
    }
  };


  my.instance = new my();

  return my;
})();

module.exports = Database.instance;
