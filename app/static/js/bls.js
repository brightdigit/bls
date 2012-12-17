var bls = {
	initialize : function () {
		var script = document.getElementsByTagName('script')[(document.getElementsByTagName('script').length-1)];
		var container = $(script.parentNode);
		$(document).ready(function () {
			var canvas = $('<canvas data-processing-sources="js/bls.pde"/>');
			container.append(canvas);
			

		});
	}
};