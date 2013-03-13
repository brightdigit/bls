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
        previous : {

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
              } else {
                area_group.attr('disabled', 'disabled');
              }
                area_group.trigger('change');
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
              } else {
                area_select.attr('disabled', 'disabled');
              }
                area_select.trigger('change');
            }
          },
          area : {
            change : function (evt) {
              var item_group = $('[name=item_group]'),
                area_group = $('[name=area_group]'),
                area_select =  $('[name=area]'),
                item_select =  $('[name=item]');

              var names = [];
              var value = item_select.val();
              var items = my.data.available.item_groups[item_group.val()][area_group.val()][area_select.val()];
              item_select.empty();
              for (var code in items) {
                var name = my.data.item_map[code];
                if (names.indexOf(name) < 0) {
                  names.push(name);   
                  $('<option>').appendTo(item_select).val(code).text(name);               
                }
              }

              item_select.val(value);

              if (item_select.find('option').length > 1) {
                item_select.removeAttr('disabled');
              } else {
                item_select.attr('disabled', 'disabled');
              }
                  item_select.trigger('change');
            }
          },
          item : {
            change : function (evt) {
              var item_group = $('[name=item_group]'),
                area_group = $('[name=area_group]'),
                area_select =  $('[name=area]'),
                item_select =  $('[name=item]');

              var range = my.data.available.item_groups[item_group.val()][area_group.val()][area_select.val()][item_select.val()];
              $('[name=dateRange]').val([range.begin_date.toString(my.defaults.daterangepicker.format),range.end_date.toString(my.defaults.daterangepicker.format)].join(' - '));
              my.previous = range;
              $('[name=startDate]').val(range.begin_date);
              $('[name=endDate]').val(range.end_date);
              my.daterangepicker.startDate = range.begin_date;
              my.daterangepicker.endDate = range.end_date;
              my.daterangepicker.notify();
              my.daterangepicker.container.find('li').removeClass('active').last().addClass('active');
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
          var interval = setInterval(function () {
            if (my.getProcessingJS()) {
              console.log('ready');
              clearInterval(interval);
              my.pjsReady();
            }
          });
          return canvas;
        },
        pjsReady : function () {
            my.canvas.height($('footer').offset().top - 100);
            my.pjs.size(my.canvas.width(), my.canvas.height());

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

            my.canvas.width(my.canvas.parent().width());
            my.canvas.height($('footer').offset().top - 100);
            
            my.getProcessingJS().size(my.canvas.width(), my.canvas.height());
            my.getProcessingJS().update();
          });
            //my.canvas.height($('footer').offset().top - 80);            //my.getProcessingJS().size(my.canvas.width(), my.canvas.height());

          var hash = (window.location.hash ? window.location.hash : '#home');
            //my.getProcessingJS().size(my.canvas.width(), my.canvas.height());
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
          request.on('error', my.onerror);
          request.start();
        },
        onerror: function (request, packet, jq) {
          debugger;
        },
        onload: function (request) {
          if (request.data) {
            my.getProcessingJS().loadData(request.data);
          }
        },
        calculateRange: function (available, previous, newStart, newEnd) {
          var newRange = {
            begin_date : newStart,
            end_date : newEnd
          };

          if (newEnd < available.begin_date || newStart > available.end_date) {
            newRange = previous;
          } else if (newStart > available.begin_date && newStart < available.end_date && newEnd > available.end_date) {
            newRange.end_date = available.end_date;
          } else if (newStart < available.begin_date && newEnd > available.begin_date && newEnd < available.end_date) {
            newRange.begin_date = available.begin_date;            
          } else if (newStart < available.begin_date && newEnd > available.end_date) {
            newRange = available;
          }

          return newRange;
        },
        setupForm: function () {
          var val = [my.defaults.daterangepicker.startDate.toString(my.defaults.daterangepicker.format),
          my.defaults.daterangepicker.endDate.toString(my.defaults.daterangepicker.format)].join(' - ');

          var startDateInput = $('<input>').attr('name', 'startDate').attr('type', 'hidden').val(my.defaults.daterangepicker.startDate)
          var endDateInput = $('<input>').attr('name', 'endDate').attr('type', 'hidden').val(my.defaults.daterangepicker.endDate);

          my.daterangepicker = $('input.daterangepicker-control').val(val).after(endDateInput).after(startDateInput).daterangepicker(my.defaults.daterangepicker, function (start, end) {  
            var new_range;
              var item_group = $('[name=item_group]'),
                area_group = $('[name=area_group]'),
                area_select =  $('[name=area]'),
                item_select =  $('[name=item]');
            if (item_group.val() !== '' && area_group.val() !== '' && area_select.val() !== '' && item_select !== '') {
              var range = my.data.available.item_groups[item_group.val()][area_group.val()][area_select.val()][item_select.val()];          
              new_range = my.calculateRange(range, my.previous, start, end);
            } else {
              new_range = {
                begin_date : start,
                end_date : end
              };
            }
            startDateInput.val(new_range.begin_date);
            endDateInput.val(new_range.end_date);
            console.log(this);
            my.previous.begin_date = new_range.begin_date;
            my.previous.end_date = new_range.end_date;
            $('[name=dateRange]').val([new_range.begin_date.toString(my.defaults.daterangepicker.format),new_range.end_date.toString(my.defaults.daterangepicker.format)].join(' - '));
            my.load();
            if (new_range.begin_date !== start || new_range.end_date !== end) {
              my.daterangepicker.startDate = range.begin_date;
              my.daterangepicker.endDate = range.end_date;
              my.daterangepicker.notify();
              my.daterangepicker.container.find('li').removeClass('active').last().addClass('active');
            }
          }).data('daterangepicker');

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
            my._dataReady = true;
            my.getProcessingJS();
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
          if (!my.pjs || !my.pjs.initialize) {
            my.pjs = Processing.getInstanceById(my.canvas.attr('id'));
          }

          if (my._dataReady && my.pjs.initialize) {
            $('[name=item_group]').removeAttr('disabled');  
            $('[name=dateRange]').removeAttr('disabled');  
          }
          return my.pjs.initialize ? my.pjs : undefined;
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
        var min, max;
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
              begin_date : (new Date(range.begin_date)),//.set({day : 1}),
              end_date : (new Date(range.end_date))//.set({day: 1})
            };
          }

         
        }

        my.defaults.daterangepicker.ranges['All'][0] = min;
        my.defaults.daterangepicker.ranges['All'][1] = max;
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
        error: function (pRequest, request) {
          for(var index = 0; index < this.events.error.length; index++) {
            this.events.error[index](this, pRequest, request);
          };
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
            }, (this.events.error && this.events.error.length > 0) && (function (pRequest) {
              this.error(pRequest, request);
            }));
            request.start();
          } else if(this.events.end) {
            for(var index = 0; index < this.events.end.length; index++) {
              this.events.end[index](this);
            };
          }
        }
      };

      my.PacketRequest = function(parameters, callback, errorCallback) {
        this.parameters = this.applyDefaults(parameters);
        this.callback = callback;
        this.errorCallback = errorCallback;
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

          var request = $.get('data', this.formatParameters(this.parameters), function(data) {
            that.callback(that, data);
          });

          if (this.errorCallback) {
            request.fail(
              function () {
                that.errorCallback(request);
              }
            );
          }
        }
      };
      if (!QUnit) {
        $(window).ready(function () {
          my.initialize();
        });        
      }
      return my;
    })();
    // this is where all the site code should begin
    return bls;
});

if (!QUnit) {
  require(['bls']);
}
