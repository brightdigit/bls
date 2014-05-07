define(['backbone.marionette', 'app', 'views/home'], function (Marionette, App, IndexView) {
  return Marionette.Controller.extend({

    initialize: function (options) {
      this.stuff = options.stuff;
    },

    index: function () {
      App.mainRegion.show(new IndexView());
    }

  });

});