var bls = {
  margin: 100,
  onresize: function() {
    var height = $(window).height() - this.container.position().top - $('.bottom').height();
    if(height < 200) {
      height = 200;
      $('.bottom').hide(); //('absolute');
    } else {
      $('.bottom').show(); //('absolute');
    }
    this.pjs.size(this.container.width(), height);
  },
  update : function (e, src) {
    var classNames = ['areas', 'items', 'daterangepicker-control'];
    var cls = src.attr('class').split(/\s+/).filter( function (value) { return classNames.some( function (other) {
      return other===value;
    }); } )[0];
    bls.lastChanged = cls;
    bls.load();
  },
  load: function() {
    var that = this;
    this.pjs = Processing.getInstanceById(that.container.find('canvas').attr('id'));
    that.onresize();
      that.busy.fadeIn();
    $('input,select').attr('disabled', '');
    $('.chosen-control').trigger("liszt:updated");
    $(window).resize(function() {
      that.onresize();
      that.pjs.update();
    });
    var parameters = {
      item: $('.items').val(),
      area: $('.areas').val(),
      startDate: bls.current.startDate ? bls.current.startDate : bls.defaults.daterangepicker.startDate,
      endDate: bls.current.endDate ? bls.current.endDate : bls.defaults.daterangepicker.endDate
    };
    for (var name in parameters) {
      $.cookie(name, parameters[name]);
    }
    bls.request(parameters, function(request) {
      if (request.data) {
        that.pjs.loadData(request.data);
        if (request.data.length > 0) {
          var result = {startDate : undefined, endDate : undefined};
          request.data.forEach( function (value) {
            var startDate = new Date(value.startDate),
              endDate = new Date(value.endDate);
            result.startDate = result.startDate ? new Date(Math.min.call(null, result.startDate, startDate)) : startDate;
            result.endDate = result.endDate ? new Date(Math.max.call(null, result.endDate, endDate)) : endDate;
          });
          result.startDate = bls.toUTC(result.startDate);
          result.endDate = bls.toUTC(result.endDate);
          $('#dateRange').val([result.startDate.toString(bls.defaults.daterangepicker.format),result.endDate.toString(bls.defaults.daterangepicker.format)].join(' - '));
        }
      }
      that.busy.fadeOut();
      $('input,select').removeAttr('disabled');
      $('.chosen-control').trigger("liszt:updated");
      $('.alerts .alert').alert('close');
      if (false && request.data.length <= 0) {
        $('<div class="alert fade in"><a class="close" data-dismiss="alert" href="#">&times;</a>Sorry there is no data available for this selection.</div>').appendTo(
        $('.' + bls.lastChanged + '-alert')).alert();
      }
    });
  },
  toUTC : function (d) {
    utc = d.getTime() + (d.getTimezoneOffset() * 60000);
    return new Date(utc);
  },
  lastChanged : undefined,
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
    $(hash).addClass('active');
    $(hash).fadeIn(function() {
    });
  },
  current : {
    startDate : undefined,
    endDate : undefined
  },
  defaults : {
    daterangepicker : {startDate : (new Date(1978, 0, 1)), endDate : (new Date()), format : 'yyyy-MM-dd',
      ranges : {
        '6 months ago' : [Date.today().addMonths(-6), new Date()],
        'Year to date' : [Date.today().set({day : 1, month : 1}), new Date()],
        '1 year ago' : [Date.today().addYears(-1), new Date()],
        '5 years ago' : [Date.today().addYears(-5), new Date()],
        '10 years ago' : [Date.today().addYears(-10), new Date()],
        '20 years ago' : [Date.today().addYears(-20), new Date()],
        'All' : [(new Date(1978, 0, 1)), new Date()],
    }},
    area : '0000',
    item : '[{"74714":["unleaded regular"]},{"74715":["unleaded midgrade"]},{"74716":["unleaded premium"]},{"7471A":["all types"]}]'
  },
  findContainer : function () {
    var script = document.getElementsByTagName('script')[(document.getElementsByTagName('script').length - 1)];
    return $(script.parentNode);
  },
  onDocumentReady : function () {
    var that = this;
    that.busy = $('#fadingBarsG').appendTo(that.container);
    $('.link').click(bls.updateView);
    bls.updateView();
    var options = bls.defaults.daterangepicker;
    var drp = $('input.daterangepicker-control').daterangepicker(options, function (start, end) {
      bls.current.startDate = start;
      bls.current.endDate = end;
      bls.update(this, this.element);
    });
    drp.val([options.startDate.toString(options.format), options.endDate.toString(options.format)].join(' - '));
    var canvas = $('<canvas id="' + bls.getRandomId() + '" data-processing-sources="js/bls.pde"/>');
    this.container.append(canvas);
    var dataDrivens = $('.data-driven');
    var semaphore = $.map(new Array(dataDrivens.length), function () { return false; });
    dataDrivens.loadData( function () {
      var lastone = -1;
      if (semaphore.every(function (value, index) {lastone = index; return value;})) {
        that.onDataDrivenComplete();
      } else {
        semaphore[lastone] = true;
        if (lastone === semaphore.length-1) {
          that.onDataDrivenComplete();
        }
      }
    });
  },
  onDataDrivenComplete : function () {

  },
  initialize: function() {
    bls.defaults.item = $.cookie('item') || bls.defaults.item;
    bls.defaults.area = $.cookie('area') || bls.defaults.area;
    bls.defaults.startDate = (new Date($.cookie('startDate'))) || bls.defaults.startDate;
    bls.defaults.endDate = (new Date($.cookie('endDate'))) || bls.defaults.endDate;
    var that = this;
    this.container = bls.findContainer();
     $(document).ready(function() {
      that.onDocumentReady();
    });
    $('.btn[type="reset"]').click(function(e) {
      e.preventDefault();
      $('.items').val(bls.defaults.item);
      $('.areas').val(bls.defaults.area);
      $('input.daterangepicker-control').daterangepicker(bls.defaults.daterangepicker);
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

      that.callback(that, []);
      /*
    $.get('data', this.formatParameters(this.parameters), function(data) {
      that.callback(that, data);
    });
*/
  }
};

bls.DataDrivenSelect = function(element) {
  var that = this;
  this.jq = $(element);
  this.jq.change( function (evt) {
    that.onChange(evt);
  });
};

bls.DataDrivenSelect.prototype = {
  jq : undefined,
  onChange : function (evt) {

  },
  loadData : function (callback) {
    var that = this;
    $.get(this.jq.data('src'), function (data) {
      that.update(data);
      callback(this.jq);
    });
  },
  update : function (data) {
    var valuefield = this.jq.data('valuefield');
    var textfield = this.jq.data('textfield');
    for (var groupName in data) {
      var optGroup = $('<optgroup label="' + groupName + '"/>')
      for (var key in data[groupName]) {
        var option;
        if ($.isArray(data[groupName][key])) {
          var value = {};
          $.each(data[groupName][key], function () {
              value[this[valuefield]] = this[textfield];
          });
          $('<option>' + key + '</option>').appendTo(optGroup).val(JSON.stringify(value));
        } else {
          $('<option>' + data[groupName][key][textfield] + '</option>').appendTo(optGroup).val(data[groupName][key][valuefield]);
        }
      optGroup.appendTo(this.jq);
    }
    this.setDefault();
    this.jq.chosen();
  },
  setDefault : function () {
    var value = $.cookie(this.jq.data('cookie')) || this.jq.data('default');
    value = typeof(value) === "string" ? value : JSON.stringify(value);
    this.jq.val(value);
  }
};

(function($){
    $.fn.loadData = function(callback){
      this.each(function () {
        var dds = new bls.DataDrivenSelect(this);
        dds.loadData(callback);
      });
    };
})(jQuery);