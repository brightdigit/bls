// run bower 
// deploy database
// deploy static files
var envious = require('envious'),
  async = require('async'),
  client = require('./client'),
  database = require('./database'),
  statics = require('./statics'),
  testing = require('./testing');

envious.development = 
{
  database : {
    "host" : "localhost",
    "user" : "bls_maintence",
    "password" : "HhI*+5oP:(X~}@-"
  },
  statics : {
    "bucket" : "bls-test.labs.brightdigit.com"
  }
}

envious.production = 
{
  database : {
    "db_host" : "bls.cyppjw0vapjp.us-west-2.rds.amazonaws.com",
    "user" : "bls_maintence",
    "password" : "HhI*+5oP:(X~}@-"
  },
  statics : {
    "bucket" : "bls.labs.brightdigit.com"
  }
}

var env = envious.apply({strict: true});

async.series([
//client.setup.bind(undefined, env),
//database.setup.bind(undefined, env, false),  
statics.setup.bind(undefined, env)
], function (error, results) {
  console.log(error);
      
  console.log('completed setup.');
  process.exit(0);
});
//client.setup(env, true);
//database.setup(env, false);
//statics.setup(env);
//testing.setup(env);