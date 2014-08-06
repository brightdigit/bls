define(['backbone.marionette', 'templates'], function (Marionette, templates) {
  return Backbone.Marionette.ItemView.extend({
    template: templates.feedviewtypebutton,
    tagName: 'label',
    className: 'btn btn-primary',
    onRender: function () {
      // manipulate the `el` here. it's already
      // been rendered, and is full of the view's
      // HTML, ready to go.
      if (this.model.attributes.checked) {
        this.$el.addClass('active');
      }
    }
  });
});