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
    ], function($, _bootstrap, _, _, Processing){
        var bls = (function () {
            var my = {};
            $('.bls-viewport').text('test');

            return my;
        })();
        // this is where all the site code should begin
        return bls;
});

require(['bls']);