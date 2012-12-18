var bls = {
  load: function () {
    var that = this;
     //setTimeout( function () {
        var pjs = Processing.getInstanceById(that.container.find('canvas').attr('id'));
        pjs.size(that.container.width(), 200);
        $(window).resize(function () {
          pjs.size(that.container.width(), 200);
          pjs.update();
        });
        bls.request({item : 'FD2101', area : '0000', startDate : new Date(2000, 0, 1), endDate : new Date()}, function (request) {
          pjs.loadData(request.data);
        });
      //}, 500);
  },
  getRandomId : function () {
    var id = "";
      var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    do {
        for( var i=0; i < 5; i++ )
            id += possible.charAt(Math.floor(Math.random() * possible.length));
    } while ($('#' + id).length > 0);

    return id;
  },
  initialize : function () {
    var that = this;
    var script = document.getElementsByTagName('script')[(document.getElementsByTagName('script').length-1)];
    this.container = $(script.parentNode);
    $(document).ready(function () {
      $('input.daterangepicker').daterangepicker();
      var canvas = $('<canvas id="' + bls.getRandomId() + '" data-processing-sources="js/bls.pde"/>');
       that.container.append(canvas);
      $.get('items', function (data) {
        var itemsSelector = $('.items');
        data.forEach(function (value) {
          itemsSelector.append('<option value="' + value.item_code + '">' + value.description + '</option>');
        });
      });

      $.get('areas', function (data) {
        var areaSelector = $('.areas');
        data.forEach(function (value) {
          areaSelector.append('<option value="' + value.area_code + '">' + value.area_name + '</option>');
        });
      });

    });
  },
  request : function (parameters, callback) {
    var request = new bls.DataRequest(parameters);
    request.on('end', callback);
    request.start();
  }
};

bls.DataRequest = function (parameters, totalPoints) {
  this.totalPoints = totalPoints ? totalPoints : this.totalPoints;
  this.parameters = this.calculateParameters(parameters);
};
// http://localhost:3000/data?item=FD2101&area=0000&months=3&start_date=2000-01-01&end_date=2012-12-01&offset=0
bls.DataRequest.prototype = {
  parameters : undefined,
  totalPoints : 1000,
  calculateParameters : function (parameters) {
    parameters.months = Math.max(Math.ceil(this.calculateTotalMonths(parameters.startDate, parameters.endDate) / this.totalPoints), 1);
    return parameters;
  },
  calculateTotalMonths : function (startDate, endDate) {
    var months;
      months = (endDate.getFullYear() - startDate.getFullYear()) * 12;
      months -= startDate.getMonth() + 1;
      months += endDate.getMonth();
      return months;
  },
  events : {
  },
  on : function (eventName, callback) {
    if (!this.events[eventName]) {
      this.events[eventName] = [];
    }

    this.events[eventName].push(callback);
  },
  start : function () {
    var that = this;
    var request = new bls.PacketRequest(this.parameters, function (request, data) {
      that.next(request, data)
    });
    request.start();
  },
  data : undefined,
  next : function (request, data) {
    var that = this;
    if (!this.data) {
      this.data = [];
    } 
    this.data = this.data.concat(data);
    if (data.length >= 100) {
      var parameters = request.parameters;
      parameters.offset = request.parameters.offset + data.length;
      var request = new bls.PacketRequest(parameters, function (request, data) {
        that.next(request, data);
      });
      request.start();
    } else if (this.events.end) {
      for (var index = 0; index < this.events.end.length; index++) {
        this.events.end[index](this);
      };
    }
  }
};

bls.PacketRequest = function (parameters, callback) {
  this.parameters = this.applyDefaults(parameters);
  this.callback = callback;
};

bls.PacketRequest.prototype = {
  parameters : undefined,
  defaultParameters : {
    offset : 0
  },
  formatParameters : function (parameters) {
    parameters.startDate = parameters.startDate.getFullYear?[
      parameters.startDate.getFullYear(),
      parameters.startDate.getMonth() + 1,
      parameters.startDate.getDate()].join('-'):parameters.startDate;
    parameters.endDate = parameters.endDate.getFullYear?[
      parameters.endDate.getFullYear(),
      parameters.endDate.getMonth() + 1,
      parameters.endDate.getDate()].join('-'):parameters.endDate;
    return parameters;
  },
  applyDefaults : function (parameters) {
    for (var key in this.defaultParameters) {
      parameters[key] = parameters[key] ? parameters[key] : this.defaultParameters[key];
    }
    return parameters;
  },
  start : function () {
    var that = this;
    $.get('data', this.formatParameters(this.parameters), function (data) {
      that.callback(that, data);
    });
  }
};