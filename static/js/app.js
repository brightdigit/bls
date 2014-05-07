define(["backbone.marionette", "./router", 'views/home', 'models/home'], function (Marionette, Router, IndexView, IndexModel) {
  var app = new Marionette.Application();

  var Controller = Marionette.Controller.extend({

    initialize: function (options) {
      this.stuff = options.stuff;
    },

    index: function () {
      app.mainRegion.show(new IndexView({
        model: new IndexModel({
          //"test": "Hello"
        })
      }));
    }

  });

  app.addRegions({
    headerRegion: "header",
    mainRegion: "#main"
  });

  app.addInitializer(function () {
    new Router({
      controller: new Controller()
    });
    Backbone.history.start();
  });

  return app;
});