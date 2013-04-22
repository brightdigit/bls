var fs = require('fs'),
  less = require('less'),
  async = require('async'),
  path = require('path');

var Statics = function () {
  var root = "../app/static";

  var ignoreDirs = ['test' , 
              'tests' , 
              'node_modules' , 
              'examples' , 
              'docs' , 
              'src' , 
              'dist' , 
              'tools' , 
              'feature-detects'];

  var mimeTypes = {
    "html": "text/html",
    "jpeg": "image/jpeg",
    "jpg": "image/jpeg",
    "png": "image/png",
    "js": "text/javascript",
    "css": "text/css",
    "ico": "image/x-icon",
    "pde": "text/plain",
    "ttf": "font/opentype",
    "less": "stylesheet/less",
    "svg": "image/svg+xml"
  };


  var lessConfig = {
    baseDirectory : '../app/static/less',
    files : {
      style : 'app'
    }
  };

  function loadAWS () {
    var AWS = require('aws-sdk');
    AWS.config.loadFromPath('./aws.json');
    AWS.config.update({region: 'us-west-2'});
    return AWS;
  }

  var directoryWalk = function (dir, iterator, callback, validDir) {
    this.root = dir;
    this.iterator = iterator;
    this.callback = callback;
    this.validDir = validDir;
  }

  directoryWalk.prototype  = {
    begin : function () {
      this.readdir(this.callback, this.root);
    },
    readdir : function (cb, dir) {
      fs.readdir(dir, this.onreaddir.bind(this, cb, dir));
    },
    onreaddir : function (cb, dir, error, results) {
      if (error) {
        cb(error);
        return;
      }
      async.concatSeries(results, this.stat.bind(this, dir), cb);
    },
    stat: function (dir, file, cb) {
      var file = path.resolve(dir, file);
      fs.stat(file, this.onstat.bind(this, file, cb));
    },
    onstat : function (file, cb, error, stats) {
      if (error) {
        cb(error);
        return;
      }
      if (stats.isDirectory()) {
        if (this.validDir(file)) {
          fs.readdir(file, this.onreaddir.bind(this, cb, file));  
        } else {
          cb(undefined, []);
        }
      } else {
        this.iterator(file, this.onfile.bind(this, cb));
      }
    },
    onfile : function (cb, error, obj) {
      var result = error || (obj ? [obj] : []);
      cb(error, result);
    }
  };

  directoryWalk.begin = function (dir, cb, it, validDir) {
    it = it || function (item, itcb) {
      itcb(undefined, item);
    };
    validDir = validDir || (function () {return true;});
    (new directoryWalk (dir, it, cb, validDir)).begin();
  };

  var setup = function (env, debug, callback) {
    this.env = env;
    this.debug = debug;
    this.callback = callback;
    this.AWS = loadAWS();
    this.s3 = new this.AWS.S3();
  };

  setup.prototype = {
    begin : function () {
      fs.readFile(path.join(__dirname, lessConfig.baseDirectory, lessConfig.files.style + '.less'), this.renderCss.bind(this));
    },
    renderCss : function (error, data) {
      data = data.toString();
      process.chdir(path.resolve(__dirname, lessConfig.baseDirectory));
      less.render(data, this.writeCss.bind(this));
    },
    writeCss : function (error, data) {
      fs.writeFile(path.resolve(__dirname, root, 'style.css'), data, this.walk.bind(this));
    },
    walk : function (error) {
      directoryWalk.begin(path.resolve(__dirname, root), 
        this.beginUpload.bind(this), 
        this.createS3Object.bind(this),
        this.isValidDir.bind(this));
    },
    isValidDir : function (dir) {
      dir = path.basename(dir);
      for (var i = ignoreDirs.length - 1; i >= 0; i--) {
        if (ignoreDirs[i] === dir) {
          return false;
        }
      }
      return true;
    },
    createS3Object : function (filename, cb) {
      fs.readFile(filename, this.onreadFile.bind(this, filename, cb));
    },
    onreadFile : function (filename, cb, error, data) {
      var mimeType = this.getMimeType(filename);
      if (mimeType) {
        cb(undefined, {
          Bucket : 'bls-test.brightdigit.com',
          Key : path.relative(path.resolve(__dirname, root), filename).replace(/\\/g,'/'),
          Body: data,
          ACL:'public-read',
          ContentType : mimeType
        });
      } else {
        cb();
      }
    },
    getMimeType : function (filename) {
      var comps = filename.split('.');
      var ext = comps[comps.length - 1];
      if (ext) {
        ext = ext.toLowerCase();
        return mimeTypes[ext];
      }
    },
    beginUpload : function (error, results) {
      if (error) {
        this.callback(error);
        return;
      }
      async.eachSeries(results, this.upload.bind(this), this.callback);
    },
    upload : function (item, callback) {
      console.log('uploading ' + item.Key + '...');
      this.s3.client.putObject(item, callback);
    }
  };

  var my = function () {

  };

  my.prototype = {
    setup : function (env, debugOrCallback, debug) {
      var debug = (typeof(debugOrCallback)) === "function" ? 
        debug : debugOrCallback;
      callback = (typeof(debugOrCallback) === "function") ? debugOrCallback : callback;
      (new setup(env, debug, callback)).begin();
    }
  }

  my.instance = new my ();

  return my;
}();
/*
var mimeTypes = {
  "html": "text/html",
  "jpeg": "image/jpeg",
  "jpg": "image/jpeg",
  "png": "image/png",
  "js": "text/javascript",
  "css": "text/css",
  "ico": "image/x-icon",
  "pde": "text/plain",
  "ttf": "font/opentype",
  "less": "stylesheet/less",
  "svg": "image/svg+xml"
};


var lessConfig = {
  baseDirectory : 'app/static/less',
  files : {
    style : 'app'
  }
};
/*
AWS.config.update({ 
  "accessKeyId": "AKIAJDXH7S5YRZMJMINQ", 
  "secretAccessKey": "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"
});
//AWS.config.update({region: 'us-west-2'});

function Statics () {

}

Statics.prototype = {
  _configloaded : false,
  loadConfig : function (env) {
    if (!Statics.prototype._configloaded) {
      AWS.config.loadFromPath('./aws.json');
      Statics.prototype._configloaded = true;
    }
  },
  setup : function (env) {
    var that = this;
    this.loadConfig();
    fs.readFile(path.join(lessConfig.baseDirectory, lessConfig.files.style + '.less'),function(error,data){
      data = data.toString();
      var cd = process.cwd();
      process.chdir(lessConfig.baseDirectory);
      less.render(data, function (e, css) {
        fs.writeFile('../style.css', css, function (err) {
          if (err) throw err;
          that.beginFiles(env, function (error) {
            if (error) {
              console.log(error);
            }
          });
        });
      });
    });
  },

  beginFiles : function (env, cb) {
    var s3 = new AWS.S3();
    var that = this;
    this.walk('..', function (error, results) {
      console.log(error);
      if (!error) {
        var maxqueue = 10;
        var queue = 0;
        var retry = [];
        var done = 0;
        console.log('beginning upload of ' + results.length + ' files...');
        //results.forEach( function (filename, index, array) {
          that.uploadFile(s3.client, results, '..', 'bls-webstatic01', function (error) {
            
              cb(error);
          });
        //});
      }
    });
  },

  uploadFile : function (client, files, localroot, bucket, cb, index) {
    index = index || 0;
    var that = this;
    if (index >= files.length) {
      cb();
    } else {
      var filename = files[index];
      fs.readFile(path.resolve(localroot, filename), function (error, data) {
        if (error) {
          cb({error : error, filename : filename});
        } else {
          console.log(filename.replace(/\\/g,'/'));
          var obj = {
            Bucket : 'bls-test.labs.brightdigit.com',
            Key : filename.replace(/\\/g,'/'),
            Body: data,
            ACL:'public-read',
            ContentType : that.getMimeType(filename)
          };
          //console.log('uploading ' + filename);
          client.putObject(obj, function(error, res) {
            if (error) {
              cb({error : error, filename : filename});
            } else {
              that.uploadFile(client, files, localroot, bucket, cb, index+1);
            }
          });
        }
      });
    }
  },
  getMimeType : function (filename) {
    var comps = filename.split('.');
    var ext = comps[comps.length - 1];
    if (ext) {
      ext = ext.toLowerCase();
      return mimeTypes[ext];
    }
  },
    /*
    var data = {Bucket: 'bls-webstatic01', Key: 'myKey', Body: 'Hello!'};

  walk : function(dir, done, root) {
    var that = this;
    var results = [];
    root = root || dir;
    fs.readdir(dir, function(err, list) {
      if (err) return done(err);
      var pending = list.length;
      if (!pending) return done(null, results);
      list.forEach(function(file) {
        var filename = file;
        file = dir + '/' + file;
        fs.stat(file, function(err, stat) {
          if (stat && stat.isDirectory()) {
            if (filename !== 'test' && 
              filename !== 'tests' && 
              filename !== 'node_modules' && 
              filename !== 'examples' && 
              filename !== 'docs' && 
              filename !== 'src' && 
              filename !== 'dist' && 
              filename !== 'tools' && 
              filename !== 'feature-detects') {
              that.walk(file, function(err, res) {
                results = results.concat(res);
                if (!--pending) done(null, results);
              }, root);
            } else {
              if (!--pending) done(null, results);
            }
          } else {
            if (filename[0] !== '.' && that.getMimeType(filename)) {
              file = path.relative(root, file);
              results.push(file);
            }
            //done(null, file);
            if (!--pending) done(null, results);
          }
        });
      });
    });
  }
};

Statics.instance = new Statics();
*/

module.exports = Statics.instance;