// run bower 
// deploy database
// deploy static files
var envious = require('envious'),
  client = require('./client'),
  //database = require('./database'),
  statics = require('./statics'),
  testing = require('./testing');

envious.development = 
{
  database : {
    "host" : "localhost",
    "user_name" : "bls_maintence",
    "password" : "HhI*+5oP:(X~}@-"
  }
}

envious.production = 
{
  "db_host" : "bls.cyppjw0vapjp.us-west-2.rds.amazonaws.com",
  "static_host" : "http://bls-webstatic01.s3-website-us-east-1.amazonaws.com/",
  "site_url": "http://labs.brightdigit.com/bls",
}

var env = envious.apply({strict: true});

client.setup(env, false);
//database.setup(env);
//statics.setup(env);
//testing.setup(env);