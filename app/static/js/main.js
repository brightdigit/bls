requirejs.config({
  baseUrl: '/js/vendor',
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
                area_group = $('[name=area_group]');
              area_group.empty();
              for (var key in my.data.available.item[item_group.val()]) {
                $('<option>').appendTo(area_group).text(key).val(key);
              }

              if (area_group.find('option').length > 1) {
                area_group.removeAttr('disabled');
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

              var indicies = my.data.available.item[item_group.val()][area_group.val()];

              area_select.empty();
              item_select.empty();

              // add items
              for (var index = 0; index < indicies.length; index++) {
                var item, range = my.data.available.data[indicies[index]];
                if (item = my.data.items[item_group.val()][range.name]) {
                  $('<option>').appendTo(item_select).val(item[0].item_code).text(range.name).data('group', item_group.val()).data('advanced', item.length > 1);
                }
              }

              // add areas
              for (var index = 0; index < my.data.areas[area_group.val()].length; index++) {
                var area = my.data.areas[area_group.val()][index];
                $('<option>').appendTo(area_select).val(area.area_code).text(area.area_name);
              }

              if (area_select.find('option').length > 1) {
                area_select.removeAttr('disabled');
              } else {
                area_select.attr('disabled', 'disabled');
                area_select.trigger('change');
              }


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

              if (my.data.items[item_group.val()][item_select.find('option:selected').text()].length > 1) {
                $('#adv-item').fadeIn();
              } else {
                $('#adv-item').fadeOut();
              }
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
        getProcessingJS: function() {
          var canvas = $('<canvas id="' + my.getRandomId() + '" data-processing-sources="js/bls.pde"/>');
          $('.bls-viewport').append(canvas);
          my.pjs = Processing.getInstanceById(canvas.attr('id'));
        },
        setupPages: function () {
          $('a.link').click(function () {
            $('.page').fadeOut();
            $($(this).attr('href')).fadeIn();
          });
          var hash = (window.location.hash ? window.location.hash : '#home');
          $(hash).show();
        },
        setupForm: function () {
          $('input.daterangepicker-control').daterangepicker(my.defaults.daterangepicker);
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
            for (var key in my.data.available.item) {
              $('<option>').appendTo(item_group).text(key).val(key);
            }
            item_group.removeAttr('disabled');
          });
          $.get('/items', function (data) {
            my.data.items = data;
          });
          $.get('/areas', function (data) {
            my.data.areas = data;
          });
        },
        selectrequest : function (jq) {
          this._constuctor(jq);
        },
        initialize: function() {
          my.pjs = my.getProcessingJS();
          my.setupPages();
          my.setupForm();
        },
        addObject: function(parent, key, value) {
          value = value || {};
          if (!parent[key]) {
            parent[key] = value;
          }
          return parent[key];
        }
      };

      my.availablity = function (data) {
        for (var index = 0; index < data.length; index++) {
          var range = data[index];
          if (!this.item[range.group_name]) {
            this.item[range.group_name] = {};
          }

          if (!this.item[range.group_name][range.area_group_name]) {
            this.item[range.group_name][range.area_group_name] = [];
          }

          this.item[range.group_name][range.area_group_name].push(index);
          
        }
        this.data = data;
      };

      my.availablity.prototype = {
        item : {

        },
        data : undefined
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

      my.initialize();
      return my;
    })();
    // this is where all the site code should begin
    return bls;
});

require(['bls']);