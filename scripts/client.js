var bower = require('bower'),
  npm = require('npm'),
  path = require('path'),
  fs = require('fs'),
  spawn = require('child_process').spawn;

var vendorDirectory = 'app/static/js/vendor';

var makeDeps = {
  'bootstrap' : ['bootstrap-js']
};

function Client () {
}

Client.prototype = {
  setup : function (env, debug) {
    bower.commands
      .install()
      .on('data', function (data) {
        if (debug) {console.log(data);}
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
  }
};

Client.instance = new Client();

module.exports = Client.instance;