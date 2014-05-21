define(['backbone.marionette', 'templates', './feeds', './graph', './types'], function (Marionette, templates, FeedsView, GraphView, TypesView) {
  return Backbone.Marionette.Layout.extend({
    template: templates.main,
    regions: {
      feeds: "#feeds",
      graph: "#graph",
    },
    onShow: function () {
      this.feeds.show(new FeedsView());
      //this.graph.show(new GraphView());
    }
  });
});