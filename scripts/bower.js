var bower = require('bower');

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
  });