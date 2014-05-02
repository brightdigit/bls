var express = require('express');
var app = express();
var async = require('async');
var moment = require('moment');

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

var server = app.listen(3000);