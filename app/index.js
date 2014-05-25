var express = require('express');
var app = express();
var async = require('async');
var moment = require('moment');

var port = Number(process.env.PORT || 3000);
app.use(express.static(__dirname + '/../public'));
app.get('/api/v2/prices', function (req, res) {
  var result = [];
  var dates = req.query.dates.split(',').concat([new Date()]).map(function (v) {
    return moment(v);
  });
  var length = Math.abs(dates[0].diff(dates[1], "months"));
  async.whilst(function () {
    return result.length <= length;
  }, function (cb) {
    var price = result.length > 0 ? (result[result.length - 1].price + Math.random() - 0.5) : Math.random() * 100;
    result.push({
      price: Math.floor(price * 100) / 100
    });
    cb();
  }, function () {
    res.send(JSON.stringify(result));
  });
});
app.get('/api/v2/items', function (req, res) {
  res.send({
      "Ice Cream" : {
        types : {
          "Chocolate" : "F31211",
          "Vanilla" : "FE1231"
        },
        tags : ["frozen", "dessert"]
      },
      "Ground Beef" : {
        types : "AD12312",
        tags : [
          "meat"
        ]
      }
  });
});
app.get('/api/v2/areas', function (req, res) {
  res.send({
    "E4ASDF" : {
      "name" : "New York",
      "shape" : [24, 32],
      "size" : "metropolitian area",
      "region" : "Northeast"
    },
    "0000" : {
      "name" : "Average US City",
      "size" : "average",
      "region" : "national"
    },
    "3DQ12" : {
      "name" : "Average Midwest Urban Area",
      "size" : "urban",
      "region" : "midwest"
    }

  });
});
var server = app.listen(port, function () {
  console.log("starting server...");
});