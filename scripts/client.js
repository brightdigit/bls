var bower = require('bower'),
  npm = require('npm'),
  path = require('path'),
  fs = require('fs'),
  rmdir = require('rmdir'),
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
        /*
      .on('data', function (data) {
      })
      .on('error', function (err)  {
        if (err) console.log(err);
      })
      .on('end', function (data) {
        console.log('installed bower packages...');
        for (var key in makeDeps) {
          value = makeDeps[key] ? makeDeps[key] : [];
          process.chdir(path.join(vendorDirectory, key));
          npm.load({ 
            production : false,
            loglevel : 'warn'
          }, function (er) {
            if (er) return handlError(er)
            npm.commands.install([], function (er, data) {
              if (er) return commandFailed(er)

              var ps = spawn('make', value);
              ps.stdout.on('data', function (data) {
              });

              ps.stderr.on('data', function (data) {
                console.log('ps stderr: ' + data);
              });

              ps.on('exit', function (code) {
                if (code !== 0) {
                  console.log('ps process exited with code ' + code);
                }
              });
            });
            npm.on("log", function (message) { if (debug) {console.log(message);} });
          });
        }
      });
      */
    },
    makeDependencies : function (data) {
      console.log('building dependencies...' + data);
      for (var key in this.dependencies) {
        value = this.dependencies[key] ? this.dependencies[key] : [];
        process.chdir(path.join(this.vendorDirectory, key));
        npm.load({ 
          production : false,
          loglevel : 'warn'
        }, this.npmInstall.bind(this, key, value));
      }
    },
    npmInstall : function (key, value, error) {
      if (error) {
        this.onError(error);
        return;
      }
      npm.on("log", this.onData.bind(this));
      npm.commands.install([], this.makeDependency.bind(this, key, value));        
    },
    makeDependency : function (key, value, error, data) {
      if (error) {
        this.onError(error);
        return;
      }

      var ps = spawn('make', value);
      ps.stdout.on('data', setup.prototype.onData.bind(this));
      ps.stderr.on('data', setup.prototype.onError.bind(this));
      ps.on('exit', setup.prototype.onExit.bind(this));
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