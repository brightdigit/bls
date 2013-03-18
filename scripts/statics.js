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
    var that = this;
    this.walk('app/static', function (error, results) {
      if (!error) {
        var maxqueue = 10;
        var queue = 0;
        var retry = [];
        var done = 0;
        console.log('beginning upload of ' + results.length + ' files...');
        //results.forEach( function (filename, index, array) {
          that.uploadFile(s3.client, results, 'app/static', 'bls-webstatic01', function (error) {
            if (error) {
              console.log(error);
            }
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
          var obj = {
            Bucket : 'bls-webstatic01',
            Key : filename,
            Body: data
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
              filename !== 'feature-detects'&& 
              filename !== 'build') {
              that.walk(file, function(err, res) {
                results = results.concat(res);
                if (!--pending) done(null, results);
              }, root);
            } else {
              if (!--pending) done(null, results);
            }
          } else {
            if (filename[0] !== '.') {
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

module.exports = Statics.instance;