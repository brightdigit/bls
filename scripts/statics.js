var AWS = require('aws-sdk'),
  fs = require('fs'),
  path = require('path');
AWS.config.loadFromPath('./aws.json');
/*
AWS.config.update({ 
  "accessKeyId": "AKIAJDXH7S5YRZMJMINQ", 
  "secretAccessKey": "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"
});
*/
//AWS.config.update({region: 'us-west-2'});

function Statics () {

}

Statics.prototype = {
  setup : function (env) {
    var s3 = new AWS.S3();
    this.walk('app/static', function (error, results) {
      if (!error) {
        var maxqueue = 10;
        var queue = 0;
        var retry = [];
        var done = 0;
        console.log('beginning upload of ' + results.length + ' files...');
        results.forEach( function (filename, index, array) {
          var interval = setInterval( function () {
            if (queue < 10) {
              clearInterval(interval);
              fs.readFile(path.resolve('app/static', filename), function (error, data) {
                var obj = {
                  Bucket : 'bls-webstatic01',
                  Key : filename,
                  Body: data
                };
                //console.log('uploading ' + filename);
                //console.log(filename);
                queue++;
                s3.client.putObject(obj, function(error, res) {
                  queue--;
                  if (error) {
                    console.log(error);
                    maxqueue--;
                    console.log('Error with request, retrying: ' + maxqueue);
                    setTimeout( function () {
                      s3.client.putObject(obj, function (error, res) {
                        if (error) {
                          console.log(error);
                        }
                      });
                    }, 1000);
                  } else {
                    var prev = done;
                    done += (1000/array.length);
                    if (Math.floor(done) > Math.floor(prev)) {
                      console.log(Math.floor(done)/10);
                    }
                    //console.log(res);
                    //console.log("Successfully uploaded " + obj.Key);
                  }
                });
              });
            } else {
              console.log('waiting');
            }
          }, 500);
        });
      }
    });
  },
    /*
    var data = {Bucket: 'bls-webstatic01', Key: 'myKey', Body: 'Hello!'};

    */
  walk : function(dir, done, root) {
    var that = this;
    var results = [];
    root = root || dir;
    fs.readdir(dir, function(err, list) {
      if (err) return done(err);
      var pending = list.length;
      if (!pending) return done(null, results);
      list.forEach(function(file) {
        file = dir + '/' + file;
        fs.stat(file, function(err, stat) {
          if (stat && stat.isDirectory()) {
            that.walk(file, function(err, res) {
              results = results.concat(res);
              if (!--pending) done(null, results);
            }, root);
          } else {
            file = path.relative(root, file);
            results.push(file);
            //done(null, file);
            if (!--pending) done(null, results);
          }
        });
      });
    });
  }
};

Statics.instance = new Statics();

module.exports = Statics.instance;