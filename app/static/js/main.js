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
    'bootstrap':{deps: ['jquery']},
    'daterangepicker': {deps: ['jquery', 'bootstrap', 'datejs']},
    'jquery.cookie' : {deps : ['jquery']},
    'processingjs' : {exports : 'Processing'}
  }
});
 
define('bls',[
  'jquery', 
  'bootstrap',
  'datejs',
  'daterangepicker',
  'jquery.cookie',
  'processingjs'
  ], function($, _bootstrap, _, _, _, Processing){
    var bls = (function () {
      var my = {
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
        initialize: function() {
          my.pjs = my.getProcessingJS();
          my.setupPages();
        }
      };
      my.initialize();
      return my;
    })();
    // this is where all the site code should begin
    return bls;
});

require(['bls']);