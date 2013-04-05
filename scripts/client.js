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

  var setup = function (env, debug, dependencies, vendorDirectory) {
    this.env = env;
    this.debug = debug;
    this.dependencies = dependencies || my.dependencies;
    this.vendorDirectory = vendorDirectory || my.vendorDirectory;
  };

  setup.prototype = {
    begin : function () {
      this.checkVendorDirectory();
    },
    onData : function (data) {
      if (this.debug) {console.log(data);}
    },
    onError : function (error) {
      if (error) {console.log(error);}      
    },
    onExit : function (code) {
      if (code !== 0) {
        this.onError('ps process exited with code ' + code);
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
      bower.commands['cache-clean']()
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
    makeDependencies : function (data) {


      console.log('loading npm...');

      npm.load({ 
          production : false,
          loglevel : 'warn'
        }, 
        this.onNpmLoad.bind(this) 
      );
      npm.on("log", this.onData.bind(this));
    },
    onNpmLoad : function (error) {

      if (error) {
        this.onError(error);
        return;
      }

      console.log('building dependencies...');
      async.each(Object.keys(this.dependencies), this.makeDependency.bind(this), this.onDepenciesCompleted.bind(this));
    },
    makeDependency : function (key, cb) {   
      console.log('making ' + key + ' ...');     
      value = this.dependencies[key] ? this.dependencies[key] : [];
      process.chdir(path.join(this.vendorDirectory, key));
      this.npmInstall.call(this, key, value, cb);

    },
    onDepenciesCompleted : function (error) {

    },
    npmInstall : function (key, value, cb, error) {
      if (error) {
        cb(error);
        return;
      }
      console.log('installing npm dependencies for ' + key + '...');  
      npm.commands.install([], this.runMake.bind(this, key, value, cb));        
    },
    runMake : function (key, value, cb, error) {
      if (error) {
        cb(error);
        return;
      }

      var ps = spawn('make', value);
      ps.stdout.on('data', setup.prototype.onData.bind(this));
      ps.stderr.on('data', setup.prototype.onError.bind(this));
      ps.on('exit', function (code) {
        cb(code !== 0 ? code : undefined);
      });
    }
  };


  my.prototype = {
    setup : function (env, debug) {
      (new setup(env, debug)).begin();
  }
};

  my.instance = new my();

  return my;
})();



module.exports = Client.instance;