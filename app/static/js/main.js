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
              console.log(this);
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
            if (fn = my.events[$(this).attr('name')]['change']) {
              fn.call(this, evt);
            }
          });
        },
        pullData: function () {
          $.get('/available', function (data) {
            my.data.available = new my.availablity(data);
            var item_group = $('[name=item_group]');
            console.log(my.data.available);
          });
        },
        selectrequest : function (jq) {
          this._constuctor(jq);
        },
        initialize: function() {
          my.pjs = my.getProcessingJS();
          my.setupPages();
          my.setupForm();
        }
      };

      my.availablity = function (data) {
        for (var index = 0; index < data.length; index++) {

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