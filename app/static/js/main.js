var QUnit = QUnit || false;

requirejs.config({
  baseUrl: (QUnit?'../../app/static/js/vendor':'js/vendor'),
  paths: {
    bootstrap: 'bootstrap/bootstrap/js/bootstrap.min',
    jquery: 'jquery/jquery.min',
    datejs : 'datejs/build/date',
    daterangepicker : 'bootstrap-daterangepicker/daterangepicker',
    'jquery.cookie' : 'jquery.cookie/jquery.cookie',
    processingjs : 'processingjs/processing'
  },
  shim: {
    'bootstrap':{deps: ['jquery'], exports : 'jquery'},
    'daterangepicker': {deps: ['jquery', 'bootstrap', 'datejs']},
    'jquery.cookie' : {deps : ['jquery'], exports : 'jquery'},
    'processingjs' : {exports : 'Processing'}
  }
});
 
define('bls',[
  'jquery', 
  'processingjs',
  'bootstrap',
  'datejs',
  'daterangepicker',
  'jquery.cookie',
  ], function($, Processing){
    var bls = (function () {
      var my = {
        data : {

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
        events : {
          item_group : {
            change : function (evt) {
              var item_group = $('[name=item_group]'),
                area_group = $('[name=area_group]'),
                area_select =  $('[name=area]'),
                item_select =  $('[name=item]');
              var value = area_group.val();
              area_group.empty();
              for (var key in my.data.available.item_groups[item_group.val()]) {
                $('<option>').appendTo(area_group).text(key).val(key);
              }
              area_group.val(value);


              if (area_group.find('option').length > 1) {
                area_group.removeAttr('disabled');
                if (area_group.val() !== value) {
                  area_group.trigger('change');
                }
              } else {
                area_group.attr('disabled', 'disabled');
                area_group.trigger('change');
              }
            }
          },
          area_group : {
            change : function (evt) {
              var item_group = $('[name=item_group]'),
                area_group = $('[name=area_group]'),
                area_select =  $('[name=area]'),
                item_select =  $('[name=item]');

              var value = area_select.val();
              var areas = my.data.available.item_groups[item_group.val()][area_group.val()];

              area_select.empty();

              // add areas
              for (var index = 0; index < my.data.areas[area_group.val()].length; index++) {
                var area = my.data.areas[area_group.val()][index];
                $('<option>').appendTo(area_select).val(area.area_code).text(area.area_name);
              }

              area_select.val(value);

              if (area_select.find('option').length > 1) {
                area_select.removeAttr('disabled');
                if (area_select.val() !== value) {
                  area_select.trigger('change');
                }
              } else {
                area_select.attr('disabled', 'disabled');
                area_select.trigger('change');
              }
            }
          },
          area : {
            change : function (evt) {
              var item_group = $('[name=item_group]'),
                area_group = $('[name=area_group]'),
                area_select =  $('[name=area]'),
                item_select =  $('[name=item]');

              var value = item_select.val();
              var items = my.data.available.item_groups[item_group.val()][area_group.val()][area_select.val()];
              item_select.empty();
              for (var code in items) {
                var name = my.data.item_map[code];
                $('<option>').appendTo(item_select).val(code).text(name);
              }

              item_select.val(value);

              if (item_select.find('option').length > 1) {
                item_select.removeAttr('disabled');
                if (item_select.val() !== value) {
                  item_select.trigger('change');
                }
              } else {
                item_select.attr('disabled', 'disabled');
                item_select.trigger('change');
              }
            }
          },
          item : {
            change : function (evt) {
              var item_group = $('[name=item_group]'),
                area_group = $('[name=area_group]'),
                area_select =  $('[name=area]'),
                item_select =  $('[name=item]');
/*
              if (my.data.items[item_group.val()][item_select.find('option:selected').text()].length > 1) {
                $('#adv-item').removeAttr('disabled');
              } else {
                $('#adv-item').attr('disabled', 'disabled');
              }
              */
              
              my.load();
            }
          }
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
        getCanvas: function() {
          var canvas = $('<canvas id="' + my.getRandomId() + '" data-processing-sources="js/bls.pde"/>');
          $('.bls-viewport').append(canvas);
           Processing.reload();
          return canvas;
        },
        setupPages: function () {
          $('a.link').click(function () {
            $(this).parents('ul').find('li.active').removeClass('active');
            $(this).parent('li').addClass('active');
            $('.page').fadeOut();
            $($(this).attr('href')).fadeIn();
          });
          $(window).resize(function () {
            var controls = $('#controls'),
              vpParent = $('#viewport-parent');

            if ($(window).width() >= 1650) {
              controls.removeClass('span3 span4').addClass('span2');
              vpParent.removeClass('span9 span8').addClass('span10');
            } else if ($(window).width() >=  1024) {
              controls.removeClass('span4 span2').addClass('span3');
              vpParent.removeClass('span8 span10').addClass('span9');              
            }

            my.canvas.height($('footer').offset().top - 80);
          });
            my.canvas.height($('footer').offset().top - 80);
          var hash = (window.location.hash ? window.location.hash : '#home');
          $(hash).show();
        },
        load: function () {
          var parameters = {
            item: $('[name=item]').val(),
            area: $('[name=area]').val(),
            factor: $('[name=factor]').val(),
            startDate: new Date($('[name=startDate]').val()),
            endDate: new Date($('[name=endDate]').val())
          };

          var request = new my.DataRequest(parameters);
          request.on('end', my.onload);
          request.start();
        },
        onload: function (request) {
          if (request.data) {
            my.getProcessingJS().loadData(request.data);
          }
        },
        setupForm: function () {
          var val = [my.defaults.daterangepicker.startDate.toString(my.defaults.daterangepicker.format),
          my.defaults.daterangepicker.endDate.toString(my.defaults.daterangepicker.format)].join(' - ');

          var startDateInput = $('<input>').attr('name', 'startDate').attr('type', 'hidden').val(my.defaults.daterangepicker.startDate)
          var endDateInput = $('<input>').attr('name', 'endDate').attr('type', 'hidden').val(my.defaults.daterangepicker.endDate);

          $('input.daterangepicker-control').val(val).after(endDateInput).after(startDateInput).daterangepicker(my.defaults.daterangepicker, function (start, end) {
            startDateInput.val(start);
            endDateInput.val(end);
            my.load();
          });

          my.pullData();

          $('[name]').change(function (evt) {
            var fn;
            if (my.events[$(this).attr('name')] && (fn = my.events[$(this).attr('name')]['change'])) {
              fn.call(this, evt);
            }
          });
        },
        pullData: function () {
          $.get('/available', function (data) {
            my.data.available = new my.availablity(data);
            var item_group = $('[name=item_group]'),
              area_group = $('[name=area_group]');
            for (var key in my.data.available.item_groups) {
              $('<option>').appendTo(item_group).text(key).val(key);
            }
            item_group.removeAttr('disabled');
          });
          $.get('/items', function (data) {
            my.data.items = data;
            my.data.item_map = {};

            for (var name in my.data.items) {
              var item_set =my.data.items[name];
              for (var index = 0; index < item_set.length; index++) {
                my.data.item_map[item_set[index].item_code] = name;
              }
            }
          });
          $.get('/areas', function (data) {
            my.data.areas = data;
          });
        },
        selectrequest : function (jq) {
          this._constuctor(jq);
        },
        initialize: function() {
          my.canvas = my.getCanvas();
          my.setupPages();
          my.setupForm();
        },
        getProcessingJS: function () {
          if (!my.pjs) {
            my.pjs = Processing.getInstanceById(my.canvas.attr('id'));
            my.pjs.initialize(my);
          }

          return my.pjs;
        },
        addObject: function(parent, key, value) {
          value = value || {};
          if (!parent[key]) {
            parent[key] = value;
          }
          return parent[key];
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

      my.availablity = function (data) {
        for (var index = 0; index < data.length; index++) {
          var range = data[index];
          if (!this.item_groups[range.item_group_name]) {
            this.item_groups[range.item_group_name] = {};
          }

          if (!this.item_groups[range.item_group_name][range.area_group_name]) {
            this.item_groups[range.item_group_name][range.area_group_name] = {};
          }

          if (!this.item_groups[range.item_group_name][range.area_group_name][range.area_code]) {
            this.item_groups[range.item_group_name][range.area_group_name][range.area_code] = {};
          }

          if (!this.item_groups[range.item_group_name][range.area_group_name][range.area_code][range.item_code]) {
            this.item_groups[range.item_group_name][range.area_group_name][range.area_code][range.item_code] = {
              begin_date : range.begin_date,
              end_date : range.end_date
            };
          }
         
        }
      };

      my.availablity.prototype = {
        item_groups : {

        },
        data : undefined
      };


      my.DataRequest = function(parameters, totalPoints) {
        this.totalPoints = totalPoints ? totalPoints : this.totalPoints;
        this.parameters = this.calculateParameters(parameters);
      };

      my.DataRequest.prototype = {
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
          var request = new my.PacketRequest(this.parameters, function(request, data) {
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
            var request = new my.PacketRequest(parameters, function(request, data) {
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

      my.PacketRequest = function(parameters, callback) {
        this.parameters = this.applyDefaults(parameters);
        this.callback = callback;
      };

      my.PacketRequest.prototype = {
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
      /*
      my.selectrequest._init = function () {
            $.fn.selectrequest = function (cb) {
            this.each(function() {
              var el = $(this);
              var name = el.attr('name');
              if (my.selectrequest._elements[name]) {
                return my.selectrequest._elements[name];
              } else {
                return new my.selectrequest(el, cb);
              }
            });
            return this;
          };
      };

      my.selectrequest._elements = {};

      my.selectrequest.prototype = {
        jq : undefined,

        _constuctor : function (jq, cb, src) {
          this.jq = jq;
          this.src = src || jq.data('src');
          this.cb = cb;
          this.load();
          my.selectrequest._elements[jq.attr('name')] = this;
        },

        load : function () {
          $.get(this.src, function (data) {
              console.log(data);
          });
        }
      };
      */
      if (!QUnit) {
        my.initialize();
      }
      return my;
    })();
    // this is where all the site code should begin
    return bls;
});

if (!QUnit) {
  require(['bls']);
}
