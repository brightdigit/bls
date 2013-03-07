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
          /*
          $('<link>')
            .attr('href','/js/vendor/bootstrap-daterangepicker/daterangepicker.css')
            .attr('rel','stylesheet')
            .appendTo($('head'));
            */
          $('input.daterangepicker-control').daterangepicker(my.defaults.daterangepicker);
        },
        initialize: function() {
          my.pjs = my.getProcessingJS();
          my.setupPages();
          my.setupForm();
          $('[data-toggle=tooltip]').tooltip();
        }
      };
      my.initialize();
      return my;
    })();
    // this is where all the site code should begin
    return bls;
});

require(['bls']);