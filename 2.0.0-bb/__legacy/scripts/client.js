var bower = require('bower'),
  npm = require('npm'),
  path = require('path'),
  fs = require('fs'),
  rmdir = require('rmdir'),
  async = require('async'),
  spawn = require('child_process').spawn;


var Client = (function () {
  var my = function () {};

  my.dependencies = {
  'bootstrap' : ['bootstrap-js']
};

  my.vendorDirectory = 'app/static/js/vendor';

  var setup = function (env, debug, callback, dependencies, vendorDirectory) {

    this.env = env;
    this.debug = debug;
    this.callback = callback;
    this.dependencies = dependencies || my.dependencies;
    this.vendorDirectory = vendorDirectory || my.vendorDirectory;
  };

  setup.prototype = {
    begin : function () {
      this.checkVendorDirectory();
    },
    onData : function (data) {      
      if (this.debug) {console.log('info'); console.log(data);}
    },
    onError : function (error) {
      if (error) {console.log(error);}      
    },
    onExit : function (cb, code) {
      code = (typeof(cb) === 'number') ? cb : code;
      cb = (typeof(cb) === 'number') ? undefined : cb;
      if (code !== 0) {
        if (cb) {
          cb(code);
        } else {
          this.onError('ps process exited with code ' + code);  
        }
      } else if (cb) {
        cb();
      }      
    },
    checkVendorDirectory : function () {
      console.log('checking for bower installs...');
      fs.exists(this.vendorDirectory, this.removeVendorDirectory.bind(this));
    },
    removeVendorDirectory : function (exists) {
      if (exists) {
        console.log('removing bower installs...');
        rmdir(this.vendorDirectory, this.clearCache.bind(this));
      } else {
        this.clearCache();
      }
    },
    clearCache : function (error) {
      if (error) {
        this.onError(error);
        return;
      }
      console.log('clearing cache...');
      bower.commands['cache-clean'](undefined, {production : true})
        .on('data', setup.prototype.onData.bind(this))
        .on('error', setup.prototype.onError.bind(this))
        .on('end', this.install.bind(this));
    },
    install : function (data) {
      console.log('installing bower packages...');
      bower.commands
        .install()
        .on('data', setup.prototype.onData.bind(this))
        .on('error', setup.prototype.onError.bind(this))
        .on('end', this.makeDependencies.bind(this));
    },
    onDependenciesCompleted : function (err) {
      if (err) {
        console.log(err);
      } 
      console.log('completed building client files.');
      this.callback(err);
    },
    beginNpm : function (key, cb) {
      value = this.dependencies[key] ? this.dependencies[key] : [];
      process.chdir(path.join(this.vendorDirectory, key));
      npm.load({ 
        production : false,
        loglevel : 'warn'
      }, this.npmInstall.bind(this, key, value, cb));
    },
    makeDependencies : function (data) {
      console.log('building dependencies...');
      async.each(Object.keys(this.dependencies), this.beginNpm.bind(this), this.onDependenciesCompleted.bind(this));
    },
    npmInstall : function (key, value, cb, error) {
      if (error) {
        this.onError(error);
        return;
      }
      npm.on("log", this.onData.bind(this));
      npm.commands.install([], this.makeDependency.bind(this, key, value, cb));        
    },
    makeDependency : function (key, value, cb, error, data) {
      if (error) {
        this.onError(error);
        return;
      }

      var ps = spawn('make', value);
      ps.stdout.on('data', setup.prototype.onData.bind(this));
      ps.stderr.on('data', setup.prototype.onError.bind(this, cb));
      ps.on('exit', setup.prototype.onExit.bind(this, cb));
    }
  };


  my.prototype = {
    setup : function (env, debugOrCallback, debug) {
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



module.exports = Client.instance;