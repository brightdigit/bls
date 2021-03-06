var http = require('http'),
  url = require('url'),
  fs = require('fs'),
  path = require('path'),
  mysql = require('mysql'),
  less = require('less'),
  envious = require('envious');

envious.development = 
{
  "db_host" : "localhost",
  "static_host" : "http://bls-webstatic01.s3-website-us-east-1.amazonaws.com/",
  "listen" : 3000
}

envious.production = 
{
  "host" : "apps01.cyppjw0vapjp.us-west-2.rds.amazonaws.com",
  "static_host" : "http://bls-webstatic01.s3-website-us-east-1.amazonaws.com/",
  "site_url": "http://labs.brightdigit.com/bls",
  "listen": "/tmp/bls.socket"
}

var env = envious.apply({strict: true});

var lessConfig = {
  baseDirectory : 'app/static/less',
  files : {
    style : 'app'
  }
};

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
  password: 'friacr=+kIez_az',
  database: 'bls',
  host : env.host,
  debug: false
});

var requireReferer = false;

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

/*
select ap_item_grouping.group_name, ap_area_groups.area_group_id, root_code, ap_series.area_code, count(*) from ap_current
    inner join ap_series on ap_current.series_id = ap_series.series_id
    inner join ap_area_groups on ap_series.area_code = ap_area_groups.area_code
    inner join ap_item_matches_mapping on ap_series.item_code = ap_item_matches_mapping.item_code
    inner join ap_item_grouping on ap_item_matches_mapping.root_code = ap_item_grouping.item_code
    group by ap_item_matches_mapping.root_code, area_code;
*/

var bls = function() {
  this.connection = mysql.createConnection({
    user: 'bls_user',
    password: 'HhI*+5oP:(X~}@-',
    database: 'bls',
    host : env.host,
    debug: false
  });

  //var requireReferer = true;

  this.connection.config.queryFormat = function(query, values) {
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
};


bls.controller = function(queryFormat, defaultParameters, groupNames, jsonFields, callback) {
    this.queryFormat = this.initializeFormat(queryFormat);
    this.defaultParameters = defaultParameters ? defaultParameters : this.defaultParameter;
    this.groupNames = groupNames || this.groupNames;
    this.jsonFields = jsonFields || this.jsonFields;
    this.callback = callback;
  };

bls.controller.prototype = {
  process: function(connection, parameters, res, req) {
    var that = this;
    parameters = this.translate(parameters);
    connection.query(this.queryFormat, parameters, function(error, results) {
      if(error) {
        console.log(error);
        res.writeHead(500);
        res.end();
      } else {
        var data = bls.controller.prototype.groupBy(bls.controller.prototype.jsonConvert(results, that.jsonFields), that.groupNames);
        data = that.callback ? data.map(that.callback) : data;
        res.writeHead(200, {
          'Content-Type': 'application/json',
	  'Access-Control-Allow-Origin' : 'http://bls.labs.brightdigit.com'
        });
        res.end(bls.controller.prototype.stringify(data));
      }
    });
  },
  isEmpty : function (obj) {
    for(var prop in obj) {
      console.log(prop);
      if(obj.hasOwnProperty(prop) && (parseInt(prop).toString() !== prop))
        return false;
      console.log('prop:' + prop);
    }
    return true;
  },
  stringify : function (object) {
    var comps = [];
    if (object === undefined || object === null) {
      return 'null';
    } else if (object.getDate) {
      //return ['new Date(\'',object.toJSON(),'\')'].join('');
      return ['"',object.toJSON(),'"'].join('');
    } else if (Object.prototype.toString.call( object ) === '[object Array]' && (object.length || bls.controller.prototype.isEmpty(object))) {
      comps.push('[');
      for (var index = 0; index < (object.length || 0); index++) {
        comps.push(bls.controller.prototype.stringify(object[index]));
        comps.push(", ");
      }
      comps[Math.max(comps.length - 1, 1)] = ']';
      return comps.join('');
    } else if (typeof(object) === 'object') {
      comps.push('{');
      for (var key in object) {
        if (object.hasOwnProperty(key) && typeof(object[key]) !== 'undefined' && object[key] !== null && Object.prototype.toString.call(object[key]) !== '[object Function]') {
          comps.push("\"");
          comps.push(key);
          comps.push("\" : ");
          comps.push(bls.controller.prototype.stringify(object[key]));
          comps.push(", ");
        }
      }
      comps[Math.max(comps.length - 1, 1)] = '}';
      return comps.join('');
    } else {
      return JSON.stringify(object);
    }
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
          if (curGroup[groups[index]] === undefined) {
            curGroup[groups[index]] = [];
          }
          delete value[groupNames[index]];
          curGroup = curGroup[groups[index]];
        }
        curGroup.push(value);
      });
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

bls.controllers = {
  //'test' : new controller(),
  'items': new bls.controller(
  ['select ap_item_matches_mapping.root_code as item_code, ap_item_names.name, group_name, concat(\'["\',group_concat(distinct ap_item_types.type_name separator \'","\'), \'"]\') as type_names, count(*) as count,',
  'ap_item_unit.unit_id as unit_id, ap_item_unit.value',
'from ap_current inner join ap_series on ap_current.series_id = ap_series.series_id',
'inner join ap_item on ap_series.item_code = ap_item.item_code',
'inner join ap_item_matches_mapping on ap_item.item_code = ap_item_matches_mapping.item_code',
'inner join ap_item_names on ap_item_matches_mapping.root_code = ap_item_names.item_code',
'left join ap_item_unit on ap_item.item_code = ap_item_unit.item_code',
'left join ap_item_inactive on ap_item.item_code = ap_item_inactive.item_code',
'left join ap_item_grouping on ap_item.item_code = ap_item_grouping.item_code',
'left join ap_item_types on ap_item.item_code = ap_item_types.item_code',
'where area_code = :area or :area is NULL',
'and ap_item_inactive.item_code is null',
'group by ap_item_matches_mapping.root_code order by ap_item_names.name'], {
    'area': null
  }, ['name'], [
      'type_names'
    ]),
  'areas': new bls.controller(
  ['select ap_area.area_code, area_name, area_group_name, count(*) as count from ap_current', 
  'inner join ap_series on ap_current.series_id = ap_series.series_id', 
  'inner join ap_area on ap_series.area_code = ap_area.area_code', 
  'left join ap_area_groups on ap_area.area_code = ap_area_groups.area_code',
  'left join ap_area_groupings on ap_area_groups.area_group_id = ap_area_groupings.area_group_id',
  'where item_code = :item or :item is NULL', 
  'group by ap_area.area_code, area_name order by ap_area_groupings.ordering, area_name'], {
    'item': null
  }, ['area_group_name']),
  'data': new bls.controller(
  ['select start_date as startDate, DATE_ADD(start_date, interval :months month) as endDate, value from (',
   'select str_to_date(concat(floor((time*:months)/12),\'-\',cast( ((time*:months)/12 - floor((time*:months)/12))*12 as unsigned) + 1,\'-01\'), \'%Y-%m-%d\') as start_date, :factor * avg(value) as value from (',
    'select value, floor((year*12 + (period-1))/:months) as time from ap_current ', 
    'inner join ap_series on ap_current.series_id = ap_series.series_id',
    'inner join ap_item_matches_mapping on ap_series.item_code = ap_item_matches_mapping.item_code',
    'where (ap_item_matches_mapping.root_code = :item and ap_series.area_code = :area', 'and str_to_date(concat(year, \'-\', period, \'-01\'), \'%Y-%m-%d\') between :startDate and :endDate)',
    'order by year, period', ') data group by time) as valuez limit 100 offset :offset'], {factor : 1}),
  'units': new bls.controller(
  ['select units.unit_id as id, units.label, ratios from units',
'left join (',
'SELECT from_unit_id, ',
'IFNULL(GROUP_CONCAT(concat(units_ratios.to_unit_id,\':\',units_ratios.ratio)),units_ratios.ratio) as ratios',
'FROM bls.units_ratios',
'group by units_ratios.from_unit_id',
') ratio_table on',
'units.unit_id = ratio_table.from_unit_id;'], null, null, null, function (value) {
    var ratios = value.ratios;
    if (ratios) {
      if (ratios.indexOf(':') < 0) {
        value.ratios = parseFloat(ratios);
      } else {
        value.ratios = [];
        ratios.split(',').forEach(function (item) {
          var set = item.split(':');
          value.ratios[set[0]] = parseFloat(set[1]);
        });
      }
      return value;
    } else {
      return value;
    }
  }),
  'available' : new bls.controller(
  ['select ap_item_grouping.group_name as item_group_name, ap_area_groupings.area_group_name, root_code as item_code, ap_series.area_code,',
'min(str_to_date(concat(begin_year,\'-\', begin_period,\'-01\'), \'%Y-%m-%d\')) as begin_date,',
'max(str_to_date(concat(end_year,\'-\', end_period,\'-01\'), \'%Y-%m-%d\')) as end_date,',
'count(*) from ap_current',
'inner join ap_series on ap_current.series_id = ap_series.series_id',
'inner join ap_area_groups on ap_series.area_code = ap_area_groups.area_code',
'inner join ap_item_matches_mapping on ap_series.item_code = ap_item_matches_mapping.item_code',
'inner join ap_item_grouping on ap_item_matches_mapping.root_code = ap_item_grouping.item_code',
'inner join ap_area_groupings on ap_area_groups.area_group_id = ap_area_groupings.area_group_id',
'group by ap_item_matches_mapping.root_code, area_code;']
    )
};

bls.prototype = {
  startServer: function() {
    var that = this;
    console.log(env);
    http.createServer(this.handle.bind(this)).listen(env.listen);
  },
  mimeTypes : {
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
  },
  handle: function(req, res) {
    var mimeType;
    var lessBase;
    var components = url.parse(req.url, true);
    var pathSplit = components.path.split('.');
    console.log(req.url);

    if(req.url == '/') {
      if (env.listen === '/tmp/bls.socket') {
	res.writeHead(200); 
	res.end();
      } else {
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
      }
    } else if(pathSplit[1] === 'css' && (lessBase = lessConfig.files[pathSplit[0].substr(1)]) ) {
      fs.readFile(path.join(lessConfig.baseDirectory, lessBase + '.less'),function(error,data){
        data = data.toString();
        var cd = process.cwd();
        process.chdir(lessConfig.baseDirectory);
        less.render(data, function (e, css) {
          res.writeHead(200, {
            'Content-Type': mimeTypes['css']
          });
          res.end(css);
          process.chdir(cd);
        });
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
        controller.process(this.connection, components.query, res, req);
      } else {
        res.writeHead(404);
        res.end();
      }
    }
  }
};

(new bls()).startServer();
