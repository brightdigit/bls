/*

/items?area=

/data?item=area=begin-date=end-date=count=

select floor((time*6)/12), ((time*6)/12 - floor((time*6)/12))*12, avg(value) from (
select *, round((year*12 + period)/6) as time from ap_current order by year, period) data group by time;

/areas?item=

*/

var http = require('http'),
	url = require('url'),
	fs = require('fs'),
	path = require('path');

var mimeTypes = {
    "html": "text/html",
    "jpeg": "image/jpeg",
    "jpg": "image/jpeg",
    "png": "image/png",
    "js": "text/javascript",
    "css": "text/css",
	"ico": "image/x-icon"};

var bls = function () {

};

bls.prototype = {
	startServer : function (port) {
		var that = this;
		http.createServer(this.handle).listen(3000);
	},
	handle : function (req, res) {
	  var mimeType;
	  var components = url.parse(req.url);
	  var pathSplit = components.path.split('.');
	  if (mimeType = mimeTypes[pathSplit[pathSplit.length - 1]]) {
	  	fs.readFile(path.join('static', components.path), function (err, data) {
	  		if (err) {
	  			res.writeHead(404);
	  		}
	  		res.end(data);
	  	});
	  } else {
	  	res.writeHead(200, {'Content-Type': 'text/plain'});
	    res.end('test');
	  }
	}
};

(new bls()).startServer();
