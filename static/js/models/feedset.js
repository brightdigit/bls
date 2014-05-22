define(['backbone', './feedattributeset'], function (Backbone, FeedAttributeSet) {
  return Backbone.Model.extend({
    initialize: function () {
      // assuming Players a collection of players
      this.set('items', new FeedAttributeSet);
      this.set('areas', new FeedAttributeSet);
      this.attributes.items.on('change', this.save, this);
      this.attributes.areas.on('change', this.save, this);
    },
    url: '#',
    save: function () {

    }
  });
});