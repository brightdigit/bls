define(['backbone', './feedattributeset'], function (Backbone, FeedAttributeSet) {
  return Backbone.Model.extend({
    initialize: function () {
      // assuming Players a collection of players
      var items, areas;
      this.set('items', items = new FeedAttributeSet);
      this.set('areas', areas = new FeedAttributeSet);
      //this.attributes.items.on('change', this.save, this);
      //this.attributes.areas.on('change', this.save, this);
      //this.
      items.on("add", this.trigger.bind(this, 'change'));
      areas.on("add", this.trigger.bind(this, 'change'));
    },
    defaults: {
      "test": "hello"
    },
    url: '#',
    save: function () {

    }
  });
});