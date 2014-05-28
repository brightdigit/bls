define(['backbone.marionette', 'templates', './feedviewtypebutton'], function (Marionette, templates, FeedViewTypeButtonView) {
  return Backbone.Marionette.CompositeView.extend({
    template: templates.types,
    itemView: FeedViewTypeButtonView,
    itemViewContainer: ".btn-group[data-toggle]"
/*,
    ui: {
      graph: ".graph",
      daterange: "[name=\"daterange\"]"
    },
    onRender: function () {
      var daterangepicker = this.ui.daterange.daterangepicker();
      var source = Rx.Observable.fromEventPattern(

      function (h) {
        daterangepicker.on('apply.daterangepicker', h);
      }, function (h) {
        daterangepicker.off('apply.daterangepicker', h);
      }, function (args) {
        args[0].daterangepicker = args[1];
        return args[0];
      });
      source.subscribe(function (evt) {
        console.log(evt.daterangepicker.startDate.format('YYYY-MM-DD'));
        console.log(evt.daterangepicker.endDate.format('YYYY-MM-DD'));
      });
      var graph = d3.select(this.ui.graph.get(0)).append('svg').style("width", "100%").style("height", "100%").attr("width", "1px").attr("height", "1px").attr("viewBox", "0 0 1 1").append("g").attr("width", "100%").attr("height", "100%");
      var data = [];
      for (var index = 0; index < 100; index++) {
        data.push([Math.random(), Math.random()]);
      }
      var line = d3.svg.line().x(function (_) {
        return _[0];
      }).y(function (_) {
        return _[1];
      });
      graph.append("path").datum(data).attr("d", line).attr("class", "line").attr("width", "100%").attr("height", "100%");
    }*/
  });
});