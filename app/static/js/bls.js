var bls = {
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
		var script = document.getElementsByTagName('script')[(document.getElementsByTagName('script').length-1)];
		var container = $(script.parentNode);
		$(document).ready(function () {
			$('input.daterangepicker').daterangepicker();
			var canvas = $('<canvas id="' + bls.getRandomId() + '" data-processing-sources="js/bls.pde"/>');
			container.append(canvas);
			setTimeout( function () {
				var pjs = Processing.getInstanceById(canvas.attr('id'));
				pjs.loadData([{'x' : 6}, {'y' : 5}]);
			}, 500);
		});
	}
};