/*

/items?area=

/data?item=area=begin-date=end-date=count=

select floor((time*6)/12), ((time*6)/12 - floor((time*6)/12))*12, avg(value) from (
select *, round((year*12 + period)/6) as time from ap_current order by year, period) data group by time;

/areas?item=
HhI*+5oP:(X~}@-
*/

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
	"ico": "image/x-icon"};

var connection = mysql.createConnection({
	user : 'bls_user',
	password : 'HhI*+5oP:(X~}@-',
	database: 'bls'
});

connection.config.queryFormat = function (query, values) {
  if (!values) return query;
  return query.replace(/\:(\w+)/g, function (txt, key) {
    if (values.hasOwnProperty(key)) {
      return this.escape(values[key]);
    }
    return txt;
  }.bind(this));
};

var controller = function (queryFormat, defaultParameters) {
  this.queryFormat = this.initializeFormat(queryFormat);
  this.defaultParameters = defaultParameters ? defaultParameters : this.defaultParameter;
};

controller.prototype = {
  process : function (parameters, res) {
  	parameters = this.translate(parameters);
  	//parameters.area = parameters.area ? parameters.area : null;
  	connection.query(this.queryFormat , parameters, function (error, results) {
    	if (error) {
    		console.log(error);
    		res.writeHead(500);
    		res.end();
    	} else {
		  	res.writeHead(200, {'Content-Type': 'application/json'});
    		res.end(JSON.stringify(results));
    	}
    });
  	//return parameters;
  },
  translate : function (parameters) {
  	for (var name in this.defaultParameters) {
  		parameters[name] = typeof parameters[name] === "undefined" ? this.defaultParameters[name] : parameters[name];
  	}
  	return parameters;
  },
  queryFormat : undefined,
  defaultParameters : {},
  initializeFormat : function (queryFormat) {
  	var type = typeof queryFormat;
  	if (type === "string") {
  		return queryFormat;
  	} else if (type === "object" && Array.isArray(queryFormat)) {
  		return queryFormat.join('\n');
  	}
  }
};

var items = function () {

};

items.prototype = new controller();

var bls = function () {

};

bls.controllers = {
	//'test' : new controller(),
	'items' : new controller(
		['select ap_item.item_code, description, count(*) as count from ap_current', 
		'inner join ap_series on ap_current.series_id = ap_series.series_id',    
		'inner join ap_item on ap_series.item_code = ap_item.item_code',    
		'where area_code = :area or :area is NULL',    
		'group by ap_item.item_code, description order by description'], {'area' : null}),
	'areas' : new controller(
		['select ap_area.area_code, area_name, count(*) as count from ap_current',
		'inner join ap_series on ap_current.series_id = ap_series.series_id',
		'inner join ap_area on ap_series.area_code = ap_area.area_code',
		'where item_code = :item or :item is NULL',  
		'group by ap_area.area_code, area_name order by area_name'], {'item' : null}),
};

bls.prototype = {
	startServer : function (port) {
		var that = this;
		http.createServer(this.handle).listen(3000);
	},
	handle : function (req, res) {
	  var mimeType;
	  var components = url.parse(req.url, true);
	  var pathSplit = components.path.split('.');
	  console.log(components);
	  if (req.url == '/') {
		fs.readFile(path.join(__dirname, 'static', 'index.html'), function (err, data) {
	  		if (err) {
	  			res.writeHead(404);
	  		} else {
	  			res.writeHead(200, {'Content-Type' : 'text/html'});
	  		}

	  		res.end(data);
	  	});	
	  } else if (mimeType = mimeTypes[pathSplit[pathSplit.length - 1]]) {
	  	fs.readFile(path.join(__dirname, 'static', components.path), function (err, data) {
	  		if (err) {
	  			res.writeHead(404);
	  		} else {
	  			res.writeHead(200, {'Content-Type' : mimeType});
	  		}
	  		res.end(data);
	  	});
	  } else {
	  	var command = components.pathname.substr(components.path.lastIndexOf('/')+1);
	  	var controller = bls.controllers[command];
	  	if (controller) {
		  	controller.process(components.query, res);
		    //res.end(JSON.stringify());
	  	} else {
	  		res.writeHead(404);
	  		res.end();
	  	}
	  }
	}
};

(new bls()).startServer();
