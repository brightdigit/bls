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

module.exports = Statics.instance;