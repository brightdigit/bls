define(['backbone.marionette', 'templates', './types', './daterangepicker', './feedcollection', '../models/feedviewtype', '../models/feedset'], function (Marionette, templates, TypesView, DateRangePickerView, FeedCollectionView, FeedViewType, FeedSet) {
  return Backbone.Marionette.Layout.extend({
    template: templates.feeds,
    regions: {
      daterangepicker: "#daterangepickerRegion",
      types: "#types",
      feedcollection: "#feedcollection"
    },
    onShow: function () {
      this.daterangepicker.show(new DateRangePickerView());
      this.types.show(new TypesView({
        collection: new Backbone.Collection([new FeedViewType({
          name: "Item",
          checked: true
        }), new FeedViewType({
          name: "Place"
        })])
      }));
      var feedset;
      this.feedcollection.show(new FeedCollectionView({
        model: (feedset = new FeedSet())
      }));
      feedset.attributes.items.add(["1234"]);
      feedset.save();
    }
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