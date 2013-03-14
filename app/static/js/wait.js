(function (factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define('wait', factory);
  } else {
    // Browser globals
    factory(jQuery);
  }
}(function () {
  var wait = (function () {
    var my = {
      create : function (methods) {
        return new my.waitFor(methods);
      }
    };

    my.waitFor = function (methods) {
      this.methods = methods;
    };

    my.waitFor.prototype = {
      _counter : 0,
      state : undefined,
      methods : [],
      onSuccess : function (cb) {
        this._counter++;
        console.log('done with this one');
        if (this._counter >= this.methods.length) {
          cb(this);
        }
      },
      begin : function (cb) {
        console.log('beginning waitFor');
        var that = this, onSuccess = function () {
          that.onSuccess.call(that, cb);
        };
        if (!this.state && this.methods.length > 0) {
          this.state = 'running';
          this.methods.forEach(function (method) {
            console.log('running waitFor');
            method(onSuccess);
          });
        } else if (methods.length > 0) {
          throw {message : 'The State is invalid.', object : this};
        } else if (console) {
          console.warn('There are no methods to begin.');
        }
      }
    };

    return my;
  })();

  return wait;
}));

