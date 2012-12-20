var bls = {
  margin: 100,
  onresize: function() {
    var height = $(window).height() - this.container.position().top - $('.bottom').height();
    if(height < 200) {
      height = 200;
      $('.bottom').hide(); //('absolute');
      console.log('absolute');
    } else {
      $('.bottom').show(); //('absolute');
    }
    console.log($('.bottom').height());
    console.log(height);
    this.pjs.size(this.container.width(), height);
  },
  load: function() {
    var that = this;
    this.pjs = Processing.getInstanceById(that.container.find('canvas').attr('id'));
    that.onresize();
    $(window).resize(function() {
      that.onresize();
      that.pjs.update();
    });
    bls.request({
      item: 'FD2101',
      area: '0000',
      startDate: new Date(2000, 0, 1),
      endDate: new Date()
    }, function(request) {
      that.pjs.loadData(request.data);
    });
  },
  getRandomId: function() {
    var id = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    do {
      for(var i = 0; i < 5; i++)
      id += possible.charAt(Math.floor(Math.random() * possible.length));
    } while ($('#' + id).length > 0);
    return id;
  },
  updateView: function(evt) {
    var hash = evt ? $(evt.srcElement).attr('href') : (window.location.hash ? window.location.hash : '#home');
    $('.link').parent('li').removeClass('active');
    $('.link[href="' + hash + '"]').parent('li').addClass('active');
    $('.container > *.active[id]').fadeOut(function() {
      $(this).removeClass('active');
    });
    $(hash).fadeIn(function() {
      $(this).addClass('active');
    });
  },
  initialize: function() {
    var that = this;
    var script = document.getElementsByTagName('script')[(document.getElementsByTagName('script').length - 1)];
    this.container = $(script.parentNode);
    $(document).ready(function() {
      $('.link').click(bls.updateView);
      bls.updateView();
      $('input.daterangepicker-control').daterangepicker();
      var canvas = $('<canvas id="' + bls.getRandomId() + '" data-processing-sources="js/bls.pde"/>');
      that.container.append(canvas);
      $.get('items', function(data) {
        var itemsSelector = $('.items');
        data.forEach(function(value) {
          itemsSelector.append('<option value="' + value.item_code + '">' + value.description + '</option>');
        });
        itemsSelector.chosen();
      });

      $.get('areas', function(data) {
        var areaSelector = $('.areas');
        data.forEach(function(value) {
          areaSelector.append('<option value="' + value.area_code + '">' + value.area_name + '</option>');
        });
        areaSelector.chosen();
      });

    });
    $('.btn[type="reset"]').click(function() {
      var form = $(this).parents('form');
      form[0].reset();
      form.children('select').each(function() {
        this.selectedIndex = 0;
      });
    });
  },
  request: function(parameters, callback) {
    var request = new bls.DataRequest(parameters);
    request.on('end', callback);
    request.start();
  },
  getDateTime: function(unixTimestamp) {
    var date = new Date(unixTimestamp * 1000);
    return date;
    //return [date.getFullYear(), date.getMonth() + 1, date.getDate()];
  },
  getUnixTime: function(arg) {
    var date;
    if(typeof(arg) === 'object' && arg.length >= 3) {
      date = new Date(arg[0], arg[1] - 1, arg[2]);
    } else if(typeof(arg) === 'string') {
      date = new Date(arg);
    } else {
      throw 'date argument is of invalid type: ' + typeof(arg);
    }
    return date.valueOf() / 1000.00;
  }
};

bls.DataRequest = function(parameters, totalPoints) {
  this.totalPoints = totalPoints ? totalPoints : this.totalPoints;
  this.parameters = this.calculateParameters(parameters);
};

bls.DataRequest.prototype = {
  parameters: undefined,
  totalPoints: 1000,
  calculateParameters: function(parameters) {
    parameters.months = Math.max(Math.ceil(this.calculateTotalMonths(parameters.startDate, parameters.endDate) / this.totalPoints), 1);
    return parameters;
  },
  calculateTotalMonths: function(startDate, endDate) {
    var months;
    months = (endDate.getFullYear() - startDate.getFullYear()) * 12;
    months -= startDate.getMonth() + 1;
    months += endDate.getMonth();
    return months;
  },
  events: {},
  on: function(eventName, callback) {
    if(!this.events[eventName]) {
      this.events[eventName] = [];
    }

    this.events[eventName].push(callback);
  },
  start: function() {
    var that = this;
    var request = new bls.PacketRequest(this.parameters, function(request, data) {
      that.next(request, data)
    });
    request.start();
  },
  data: undefined,
  next: function(request, data) {
    var that = this;
    if(!this.data) {
      this.data = [];
    }
    this.data = this.data.concat(data);
    if(data.length >= 100) {
      var parameters = request.parameters;
      parameters.offset = request.parameters.offset + data.length;
      var request = new bls.PacketRequest(parameters, function(request, data) {
        that.next(request, data);
      });
      request.start();
    } else if(this.events.end) {
      for(var index = 0; index < this.events.end.length; index++) {
        this.events.end[index](this);
      };
    }
  }
};

bls.PacketRequest = function(parameters, callback) {
  this.parameters = this.applyDefaults(parameters);
  this.callback = callback;
};

bls.PacketRequest.prototype = {
  parameters: undefined,
  defaultParameters: {
    offset: 0
  },
  formatParameters: function(parameters) {
    parameters.startDate = parameters.startDate.getFullYear ? [
    parameters.startDate.getFullYear(), parameters.startDate.getMonth() + 1, parameters.startDate.getDate()].join('-') : parameters.startDate;
    parameters.endDate = parameters.endDate.getFullYear ? [
    parameters.endDate.getFullYear(), parameters.endDate.getMonth() + 1, parameters.endDate.getDate()].join('-') : parameters.endDate;
    return parameters;
  },
  applyDefaults: function(parameters) {
    for(var key in this.defaultParameters) {
      parameters[key] = parameters[key] ? parameters[key] : this.defaultParameters[key];
    }
    return parameters;
  },
  start: function() {
    var that = this;
    $.get('data', this.formatParameters(this.parameters), function(data) {
      that.callback(that, data);
    });
  }
};