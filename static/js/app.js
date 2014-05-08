define(["backbone.marionette", "./router", 'views/navigation', 'models/home'], function (Marionette, Router, NavigationView, IndexModel) {
  var app = new Marionette.Application();

  var Controller = Marionette.Controller.extend({

    initialize: function (options) {
      this.stuff = options.stuff;
    },

    index: function () {
      app.headerRegion.show(new NavigationView({

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