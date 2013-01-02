var http = require('http'),
  url = require('url'),
  fs = require('fs'),
  path = require('path'),
  mysql = require('mysql');

var mimeTypes = {
  "html": "text/html",
  "jpeg": "image/jpeg",
  "jpg": "image/jpeg",
  "png": "image/png",
  "js": "text/javascript",
  "css": "text/css",
  "ico": "image/x-icon",
  "pde": "text/plain",
  "ttf": "font/opentype",
  "less": "stylesheet/less",
  "svg": "image/svg+xml"
};

var connection = mysql.createConnection({
  user: 'bls_user',
  password: 'HhI*+5oP:(X~}@-',
  database: 'bls',
  debug: false
});

var requireReferer = true;

connection.config.queryFormat = function(query, values) {
  if(!values) return query;
  return query.replace(/\:(\w+)/g, function(txt, key) {
    if(values.hasOwnProperty(key)) {
      if(parseInt(values[key]).toString() === values[key]) {
        return values[key];
      } else {
        return this.escape(values[key]);
      }
    }
    return txt;
  }.bind(this));
};

var controller = function(queryFormat, defaultParameters, groupNames, jsonFields) {
    this.queryFormat = this.initializeFormat(queryFormat);
    this.defaultParameters = defaultParameters ? defaultParameters : this.defaultParameter;
    this.groupNames = groupNames || this.groupNames;
    this.jsonFields = jsonFields || this.jsonFields;
  };

controller.prototype = {
  process: function(parameters, res, req) {
    var that = this;
    parameters = this.translate(parameters);
    connection.query(this.queryFormat, parameters, function(error, results) {
      if(error) {
        console.log(error);
        res.writeHead(500);
        res.end();
      } else {
        var data = controller.prototype.groupBy(controller.prototype.jsonConvert(results, that.jsonFields), that.groupNames);
        res.writeHead(200, {
          'Content-Type': 'application/json'
        });
        res.end(controller.prototype.stringify(data));
      }
    });
  },
  stringify : function (object) {
    var comps = [];
    if (Object.prototype.toString.call( object ) === '[object Array]' && object.length) {
      comps.push('[');
      for (var index = 0; index < object.length; index++) {
        comps.push(controller.prototype.stringify(object[index]));
        comps.push(", ");
      }
      comps[comps.length - 1] = ']';
    } else if (typeof(object) === 'object') {
      comps.push('{');
      for (var key in object) {
        if (object.hasOwnProperty(key) && typeof(object[key]) !== 'undefined' && object[key] !== null && Object.prototype.toString.call(object[key]) !== '[object Function]') {
          comps.push("\"");
          comps.push(key);
          comps.push("\" : ");
          comps.push(controller.prototype.stringify(object[key]));
          comps.push(", ");
        }
      }
      comps[comps.length - 1] = '}';
    } else {
      return JSON.stringify(object);
    }
    return comps.join('');
  },
  jsonConvert : function(results, jsonFields) {
    if (jsonFields) {
      return results.map(function (value) {
        var field, newValue = {};
        for (field in value) {
          if (typeof(value[field]) === 'string' && jsonFields.some(function (name) {return name === field;})) {
            newValue[field] = JSON.parse(value[field]);
          } else {
            newValue[field] = value[field];
          }
        }
        return newValue;
      });
    } else {
      return results;
    }
  },
  groupBy : function (results, groupNames) {
    var data = {};
    if (groupNames && groupNames.length > 0) {
      results.forEach(function (value) {
        var curGroup = data;
        var groups = groupNames.map(function (name) { return value[name];});
        for (var index = 0; index < groups.length; index++) {
          //console.log(groups[index]);
          if (curGroup[groups[index]] === undefined) {
            curGroup[groups[index]] = [];
          }
          // this doesn't work
          //console.log('deleting groups[p')
          delete value[groupNames[index]];
          curGroup = curGroup[groups[index]];
        }
        curGroup.push(value);
        //console.log('data');
        //console.log(data);
        //console.log(value);
      });
        //console.log('data');
        //console.log(data);
      return data;
    } else {
      return results;
    }
  },
  translate: function(parameters) {
    for(var name in this.defaultParameters) {
      parameters[name] = typeof parameters[name] === "undefined" ? this.defaultParameters[name] : parameters[name];
    }
    return parameters;
  },
  queryFormat: undefined,
  defaultParameters: {},
  groupNames : [],
  initializeFormat: function(queryFormat) {
    var type = typeof queryFormat;
    if(type === "string") {
      return queryFormat;
    } else if(type === "object" && Array.isArray(queryFormat)) {
      return queryFormat.join('\n');
    }
  }
};

var bls = function() {

};

bls.controllers = {
  //'test' : new controller(),
  'items': new controller(
  ['select ap_item_matches_mapping.root_code as item_code, ap_item_names.name, group_name, concat(\'["\',group_concat(distinct ap_item_types.type_name separator \'","\'), \'"]\') as type_names, count(*) as count,',
  'ap_item_measurement.priority as measure_type, ap_item_measurement.value',
'from ap_current inner join ap_series on ap_current.series_id = ap_series.series_id',
'inner join ap_item on ap_series.item_code = ap_item.item_code',
'inner join ap_item_matches_mapping on ap_item.item_code = ap_item_matches_mapping.item_code',
'inner join ap_item_names on ap_item_matches_mapping.root_code = ap_item_names.item_code',
'left join ap_item_measurement on ap_item.item_code = ap_item_measurement.item_code',
'left join ap_item_inactive on ap_item.item_code = ap_item_inactive.item_code',
'left join ap_item_grouping on ap_item.item_code = ap_item_grouping.item_code',
'left join ap_item_types on ap_item.item_code = ap_item_types.item_code',
'where area_code = :area or :area is NULL',
'and ap_item_inactive.item_code is null',
'group by ap_item_matches_mapping.root_code order by ap_item_names.name'], {
    'area': null
  }, ['group_name', 'name'], [
      'type_names'
    ]),
  'areas': new controller(
  ['select ap_area.area_code, area_name, count(*) as count from ap_current', 'inner join ap_series on ap_current.series_id = ap_series.series_id', 'inner join ap_area on ap_series.area_code = ap_area.area_code', 'where item_code = :item or :item is NULL', 'group by ap_area.area_code, area_name order by area_name'], {
    'item': null
  }),
  'data': new controller(
  ['select start_date as startDate, DATE_ADD(start_date, interval :months month) as endDate, value from (', 'select str_to_date(concat(floor((time*:months)/12),\'-\',cast( ((time*:months)/12 - floor((time*:months)/12))*12 as unsigned) + 1,\'-01\'), \'%Y-%m-%d\') as start_date, avg(value) as value from (', 'select value, floor((year*12 + (period-1))/:months) as time from ap_current ', 'inner join ap_series on ap_current.series_id = ap_series.series_id', 'where (ap_series.item_code = :item and ap_series.area_code = :area', 'and str_to_date(concat(year, \'-\', period, \'-01\'), \'%Y-%m-%d\') between :startDate and :endDate)', 'order by year, period', ') data group by time) as valuez limit 100 offset :offset'])
};

bls.prototype = {
  startServer: function(port) {
    var that = this;
    http.createServer(this.handle).listen(3000);
  },
  handle: function(req, res) {
    var mimeType;
    var components = url.parse(req.url, true);
    var pathSplit = components.path.split('.');
    console.log(req.url);

    if(req.url == '/') {
      fs.readFile(path.join(__dirname, 'static', 'index.html'), function(err, data) {
        if(err) {
          res.writeHead(404);
        } else {
          res.writeHead(200, {
            'Content-Type': 'text/html'
          });
        }

        res.end(data);
      });
    } else if(mimeType = mimeTypes[pathSplit[pathSplit.length - 1]]) {
      fs.readFile(path.join(__dirname, 'static', components.path), function(err, data) {
        if(err) {
          res.writeHead(404);
        } else {
          res.writeHead(200, {
            'Content-Type': mimeType
          });
        }
        res.end(data);
      });
    } else if(requireReferer && req.connection.remoteAddress !== '127.0.0.1' && (!req.headers['referer'] || req.headers['referer'].indexOf('http://' + req.headers['host'] + '/') !== 0)) {
      res.writeHead(400);
      res.end();
    } else {
      var command = components.pathname.substr(components.path.lastIndexOf('/') + 1);
      var controller = bls.controllers[command];
      if(controller) {
        controller.process(components.query, res, req);
      } else {
        res.writeHead(404);
        res.end();
      }
    }
  }
};

(new bls()).startServer();