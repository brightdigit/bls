define(['backbone', './feedattribute'], function (Backbone, FeedAttribute) {
  return Backbone.Collection.extend({
    model: FeedAttribute
  });
});