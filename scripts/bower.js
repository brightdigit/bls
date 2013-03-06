var bower = require('bower'),
  npm = require('npm'),
    spawn = require('child_process').spawn;

bower.commands
  .install()
  .on('data', function (data) {
    if (data) console.log(data);
  })
  .on('error', function (err)  {
    if (err) console.log(err);
  })
  .on('end', function (data) {
    data && console.log(data);
    process.chdir('app/static/js/vendor/bootstrap');
    npm.load({}, function (er) {
      if (er) return handlError(er)
      npm.commands.install([], function (er, data) {
        if (er) return commandFailed(er)

        var ps = spawn('make', ['bootstrap']);
        ps.stdout.on('data', function (data) {
          console.log(data);
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
        // command succeeded, and data might have some info
      //})
      npm.on("log", function (message) { console.log(message); });
    });
  });