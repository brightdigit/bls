define(['backbone.marionette', 'templates', 'd3'], function (Marionette, templates, d3) {
  return Backbone.Marionette.ItemView.extend({
    template: templates.main,
    ui: {
      graph: ".graph"
    },
    onRender: function () {
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
    }
  });
});