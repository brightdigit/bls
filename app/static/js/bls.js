(function($){
    $.fn.loadData = function(callback, options){
      this.each(function () {
        var dds = new bls.DataDrivenSelect(this);
        dds.loadData(callback);
      });
    };
})(jQuery);

var bls = {
  margin: 100,
  getString : function (value) {
      return (typeof(value) === "string" && value.length > 0) ? value : JSON.stringify(value);
  },
  getOnlyValue : function (value) {
    var child; 
    if (typeof(value) === 'object') {
      for (var key in value) {
        if (child) {
          return value;
        }
        child = value[key];
      }
      return child;
    }
  },
  getOnlyKey : function (value) {
    var child; 
    if (typeof(value) === 'object') {
      for (var key in value) {
        if (child) {
          return value;
        }
        child = key;
      }
      return child;
    }
  },
  onresize: function() {
    var height = $(window).height() - this.container.position().top - $('.bottom').height();
    if(height < 200) {
      height = 200;
      $('.bottom').hide(); //('absolute');
    } else {
      $('.bottom').show(); //('absolute');
    }
    this.pjs.size(this.container.width(), height);
  },
  verifyParameters : function (params) {
    return params.item.length > 4 && params.area.length > 3;
  },
  update : function (e, src) {
    var classNames = ['areas', 'items', 'daterangepicker-control'];
    var cls = src.attr('class').split(/\s+/).filter( function (value) { return classNames.some( function (other) {
      return other===value;
    }); } )[0];
    bls.lastChanged = cls;
    if (!bls.load()) {
      alert('invalid parameters')
    }
  },
  availability : {
    item_groups : {},
    area_groups : {},
    ranges : [],
    get_ranges : function (item_group, area_group) {
      function intersect_safe(a, b)
      {
        var ai=0, bi=0;
        var result = new Array();

        while( ai < a.length && bi < b.length )
        {
           if      (a[ai] < b[bi] ){ ai++; }
           else if (a[ai] > b[bi] ){ bi++; }
           else /* they're equal */
           {
             result.push(a[ai]);
             ai++;
             bi++;
           }
        }

        return result;
      }

      var indicies = intersect_safe(bls.availability.item_groups[item_group], bls.availability.area_groups[area_group]);
      return indicies.map( function (index) {
        return bls.availability.ranges[index];
      });
    }
  },
  load: function() {
    var that = this;
    this.pjs = Processing.getInstanceById(that.container.find('canvas').attr('id'));
    that.onresize();
      that.busy.fadeIn();
    $('input,select').attr('disabled', '');
    $('.chosen-control').trigger("liszt:updated");
    $(window).resize(function() {
      that.onresize();
      that.pjs.update();
    });
    var parameters = {
      item: $('[name=item]').val(),
      area: $('[name=area]').val(),
      factor: $('[name=factor]').val(),
      startDate: bls.current.startDate ? bls.current.startDate : bls.defaults.daterangepicker.startDate,
      endDate: bls.current.endDate ? bls.current.endDate : bls.defaults.daterangepicker.endDate
    };
    if (!bls.verifyParameters(parameters)) {
      return false;
    }
    for (var name in parameters) {
      $.cookie(name, parameters[name]);
    }
    bls.request(parameters, function(request) {
      if (request.data) {
        that.pjs.loadData(request.data);
        if (request.data.length > 0) {
          var result = {startDate : undefined, endDate : undefined};
          request.data.forEach( function (value) {
            var startDate = new Date(value.startDate),
              endDate = new Date(value.endDate);
            result.startDate = result.startDate ? new Date(Math.min.call(null, result.startDate, startDate)) : startDate;
            result.endDate = result.endDate ? new Date(Math.max.call(null, result.endDate, endDate)) : endDate;
          });
          result.startDate = bls.toUTC(result.startDate);
          result.endDate = bls.toUTC(result.endDate);
          $('#dateRange').val([result.startDate.toString(bls.defaults.daterangepicker.format),result.endDate.toString(bls.defaults.daterangepicker.format)].join(' - '));
        } else {
          $('.modal').modal();
        }
      }
      that.busy.fadeOut();
      $('input,select').removeAttr('disabled');
      $('.chosen-control').trigger("liszt:updated");
      $('.alerts .alert').alert('close');
      if (false && request.data.length <= 0) {
        $('<div class="alert fade in"><a class="close" data-dismiss="alert" href="#">&times;</a>Sorry there is no data available for this selection.</div>').appendTo(
        $('.' + bls.lastChanged + '-alert')).alert();
      }
    });
    return true;
  },
  toUTC : function (d) {
    utc = d.getTime() + (d.getTimezoneOffset() * 60000);
    return new Date(utc);
  },
  lastChanged : undefined,
  getRandomId: function() {
    var id = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    do {
      for(var i = 0; i < 5; i++)
      id += possible.charAt(Math.floor(Math.random() * possible.length));
    } while ($('#' + id).length > 0);
    return id;
  },
  updateView: function(evt) {
    var hash = evt ? $(evt.srcElement).attr('href') : (window.location.hash ? window.location.hash : '#home');
    $('.link').parent('li').removeClass('active');
    $('.link[href="' + hash + '"]').parent('li').addClass('active');
    $('.container > *.active[id]').fadeOut(function() {
      $(this).removeClass('active');
    });
    $(hash).addClass('active');
    $(hash).fadeIn(function() {
    });
  },
  current : {
    startDate : undefined,
    endDate : undefined
  },
  defaults : {
    daterangepicker : {startDate : (new Date(1978, 0, 1)), endDate : (new Date()), format : 'yyyy-MM-dd',
      ranges : {
        '6 months ago' : [Date.today().addMonths(-6), new Date()],
        'Year to date' : [Date.today().set({day : 1, month : 1}), new Date()],
        '1 year ago' : [Date.today().addYears(-1), new Date()],
        '5 years ago' : [Date.today().addYears(-5), new Date()],
        '10 years ago' : [Date.today().addYears(-10), new Date()],
        '20 years ago' : [Date.today().addYears(-20), new Date()],
        'All' : [(new Date(1978, 0, 1)), new Date()],
    }},
    area : '0000',
    item : '[{"74714":["unleaded regular"]},{"74715":["unleaded midgrade"]},{"74716":["unleaded premium"]},{"7471A":["all types"]}]'
  },
  findContainer : function () {
    var script = document.getElementsByTagName('script')[(document.getElementsByTagName('script').length - 1)];
    return $(script.parentNode);
  },
  cached : {
    unitMap : {} 
  },
  createRadio : function (value, text, name, checked) {
    var label = $('<label>');
    label.text(text);
    var input = $('<input>');
    input.attr('type', 'radio');
    input.attr('name', name);
    input.val(value);
    if (checked) {
      input.attr('checked', 'checked');
    }
    label.append(input);
    return $('<li>').append(label);
  },
  updateUnits : function (item_code, dontChangeValue) {
    var def_unit = parseInt(bls.cached.unitMap[item_code].unit_id);
    if (!dontChangeValue) {
      $('input[name=value]').val(bls.cached.unitMap[item_code].value);
    }
    $('input[name=baseValue]').val(bls.cached.unitMap[item_code].value);
    $('input[name=baseUnit]').val(def_unit);
    $('input[name=factor]').val(1);
    var unitDetails = bls.units[def_unit];
    var list = $('<ul>');
    list.append(bls.createRadio(unitDetails.id, unitDetails.label,  'unit', true));
    if (unitDetails.ratios) {
      for (var index = 0; index < unitDetails.ratios.length; index++) {
        if (unitDetails.ratios[index]) {
          list.append(bls.createRadio(index, bls.units[index].label, 'unit'));
        }
      }
      $('.unitName').removeAttr('disabled');
    } else {
      $('.unitName').attr('disabled','disabled');
    }
    $('.dropdown-menu.units').empty();
    $('.dropdown-menu.units').append(list); 
    $('.dropdown-menu.units input').change(function () {
      $('.unitName').text($('.dropdown-menu.units input:checked').parent().text());
      var newValue = Math.round(
        $('input[name=value]').val() * bls.units[def_unit].ratios[$('.dropdown-menu.units input:checked').val()] * 1000)/1000.0;
      $('input[name=value]').val(newValue);
      def_unit = $('.dropdown-menu.units input:checked').val();
      bls.updateFactor();
    });  
    $('.unitName').text(bls.units[def_unit].label);
  },
  updateFactor : function (evt) {
    var ratio = (($('.dropdown-menu.units input:checked').val() !== $('input[name=baseUnit]').val())
     && (bls.units[$('.dropdown-menu.units input:checked').val()].ratios[$('input[name=baseUnit]').val()])) || 1;
    $('input[name=ratio]').val(ratio);
    $('input[name=factor]').val(ratio * ($('input[name=value]').val())/ ($('input[name=baseValue]').val()));
    bls.update(evt, $('input[name=factor]'));
  },
  onDocumentReady : function () {
    var that = this;
    $('input.debug').each( function () {
      $(this).attr('title', $(this).attr('name'));
    });
    $('[data-toggle=tooltip]').tooltip();
    $('.unitName').click( function (e) {
      if ($(this).attr('disabled') !== undefined) {
        e.stopPropagation();
      }
    });
    $('input[name=value]').change(bls.updateFactor);

    $.get('available', function (data) {
      for (var index = 0; index < data.length; index++) {
        if (!bls.availability.item_groups[data[index].group_name]) {
          bls.availability.item_groups[data[index].group_name] = [];
        }
        bls.availability.item_groups[data[index].group_name].push(index);
        if (!bls.availability.area_groups[data[index].area_group_name]) {
          bls.availability.area_groups[data[index].area_group_name] = [];
        }
        bls.availability.area_groups[data[index].area_group_name].push(index);
        bls.availability.ranges.push(data[index]);
      }
    });
    that.busy = $('#fadingBarsG').appendTo(that.container);
    $('.link').click(bls.updateView);
    bls.updateView();
    var options = bls.defaults.daterangepicker;
    var drp = $('input.daterangepicker-control').daterangepicker(options, function (start, end) {
      bls.current.startDate = start;
      bls.current.endDate = end;
      bls.update(this, this.element);
    });
    drp.val([options.startDate.toString(options.format), options.endDate.toString(options.format)].join(' - '));
    var canvas = $('<canvas id="' + bls.getRandomId() + '" data-processing-sources="js/bls.pde"/>');
    this.container.append(canvas);
    var dataDrivens = $('.data-driven');
    var semaphore = $.map(new Array(dataDrivens.length), function () { return false; });
    this.loadUnits(function () {
      dataDrivens.loadData( function (select, data) {
        var lastone = -1;

        if (select.jq.data('src') === 'items') {
          for (var key in data) {
            group = data[key];
            for (var key in group) {
              item = group[key];
              for (var key in item) {
                type = item[key];
                bls.cached.unitMap[type.item_code] = { unit_id : type.unit_id, value : type.value };              
              }          
            }
          }
          select.jq.change(function () {
            bls.updateUnits(select.val());
          });
          select.onsubselectchange(function (element, evt) {
            var value = $(element).val();
            try {
              value = bls.getOnlyKey(JSON.parse(value)) || value;
            } catch (ex) {
              
            }
            bls.updateUnits(value, true);
            bls.update(evt, select.jq);
          });
          bls.updateUnits(select.val());
        } else {
          select.onsubselectchange(function (element, evt) {
            bls.update(evt, $(element));
          });
        }

        if (semaphore.every(function (value, index) {lastone = index; return value;})) {
          that.onDataDrivenComplete();
        } else {
          semaphore[lastone] = true;
          if (lastone === semaphore.length-1) {
            that.onDataDrivenComplete();
          }
        }
      });
    });

  },
  onDataDrivenComplete : function () {

  },
  loadUnits : function (callback) {
    $.get('units', function (data) {
      bls.units = [];
      data.forEach( function (value) {
        bls.units[parseInt(value.id)] = value;
      });
      if (callback) {
        callback();
      }
    });
  },
  units : [],
  initialize: function() {
    /*
    bls.defaults.item = $.cookie('item') || bls.defaults.item;
    bls.defaults.area = $.cookie('area') || bls.defaults.area;
    */
    bls.defaults.startDate = (new Date($.cookie('startDate'))) || bls.defaults.startDate;
    bls.defaults.endDate = (new Date($.cookie('endDate'))) || bls.defaults.endDate;
    var that = this;
    this.container = bls.findContainer();
     $(document).ready(function() {
      that.onDocumentReady();
    });
     /*
    $('.btn[type="reset"]').click(function(e) {
      e.preventDefault();
      $('.items').val(bls.defaults.item);
      $('.areas').val(bls.defaults.area);
      $('input.daterangepicker-control').daterangepicker(bls.defaults.daterangepicker);
    });
    */
  },
  request: function(parameters, callback) {
    var request = new bls.DataRequest(parameters);
    request.on('end', callback);
    request.start();
  },
  getDateTime: function(unixTimestamp) {
    var date = new Date(unixTimestamp * 1000);
    return date;
  },
  getUnixTime: function(arg) {
    var date;
    if(typeof(arg) === 'object' && arg.length >= 3) {
      date = new Date(arg[0], arg[1] - 1, arg[2]);
    } else if(typeof(arg) === 'string') {
      date = new Date(arg);
    } else {
      throw 'date argument is of invalid type: ' + typeof(arg);
    }
    return date.valueOf() / 1000.00;
  }
};

bls.DataRequest = function(parameters, totalPoints) {
  this.totalPoints = totalPoints ? totalPoints : this.totalPoints;
  this.parameters = this.calculateParameters(parameters);
};

bls.DataRequest.prototype = {
  parameters: undefined,
  totalPoints: 1000,
  calculateParameters: function(parameters) {
    parameters.months = Math.max(Math.ceil(this.calculateTotalMonths(parameters.startDate, parameters.endDate) / this.totalPoints), 1);
    return parameters;
  },
  calculateTotalMonths: function(startDate, endDate) {
    var months;
    months = (endDate.getFullYear() - startDate.getFullYear()) * 12;
    months -= startDate.getMonth() + 1;
    months += endDate.getMonth();
    return months;
  },
  events: {},
  on: function(eventName, callback) {
    if(!this.events[eventName]) {
      this.events[eventName] = [];
    }

    this.events[eventName].push(callback);
  },
  start: function() {
    var that = this;
    var request = new bls.PacketRequest(this.parameters, function(request, data) {
      that.next(request, data)
    });
    request.start();
  },
  data: undefined,
  next: function(request, data) {
    var that = this;
    if(!this.data) {
      this.data = [];
    }
    this.data = this.data.concat(data);
    if(data.length >= 100) {
      var parameters = request.parameters;
      parameters.offset = request.parameters.offset + data.length;
      var request = new bls.PacketRequest(parameters, function(request, data) {
        that.next(request, data);
      });
      request.start();
    } else if(this.events.end) {
      for(var index = 0; index < this.events.end.length; index++) {
        this.events.end[index](this);
      };
    }
  }
};

bls.PacketRequest = function(parameters, callback) {
  this.parameters = this.applyDefaults(parameters);
  this.callback = callback;
};

bls.PacketRequest.prototype = {
  parameters: undefined,
  defaultParameters: {
    offset: 0
  },
  formatParameters: function(parameters) {
    parameters.startDate = parameters.startDate.getFullYear ? [
    parameters.startDate.getFullYear(), parameters.startDate.getMonth() + 1, parameters.startDate.getDate()].join('-') : parameters.startDate;
    parameters.endDate = parameters.endDate.getFullYear ? [
    parameters.endDate.getFullYear(), parameters.endDate.getMonth() + 1, parameters.endDate.getDate()].join('-') : parameters.endDate;
    return parameters;
  },
  applyDefaults: function(parameters) {
    for(var key in this.defaultParameters) {
      parameters[key] = parameters[key] ? parameters[key] : this.defaultParameters[key];
    }
    return parameters;
  },
  start: function() {
    var that = this;

    $.get('data', this.formatParameters(this.parameters), function(data) {
      that.callback(that, data);
    });
  }
};

bls.DataDrivenSelect = function(element, onChange) {
  var that = this;
  this.jq = $(element);
  this.name = this.jq.attr('name');
  this.jq.removeAttr('name');
  this.__input = $('<input type="text" readonly/>').appendTo(this.jq.parent());
  this.__input.attr('name', this.name);
  this.__input.change( function () {
    console.log(that.name);
  });
  this.__input.addClass('debug input-mini');
  this.__input.attr('title', this.name);
  this.__input.attr('data-toggle', 'tooltip');
  this.__input.tooltip();
  console.log('adding hidden input ' + this.name);
  this.subdd = $('#subselector').clone().removeAttr('id').insertAfter(
    this.jq);
  this.subdd.find('.dropdown-toggle').dropdown();
  this.jq.change( function (evt) {
    that.onChange(evt);
  });
};

bls.DataDrivenSelect.prototype = {
  jq : undefined,
  onChange : function (evt) {
    var value, first = true;
    var that = this;
    try {
      value = JSON.parse(this.jq.val());
    } catch (ex) {
      console.log(ex);
    }
    var list = this.subdd.find('ul').empty();
    value = bls.getOnlyKey(value) || this.jq.val();
    value = ($.isArray(value) && value.join(',')) || value;
    if (typeof(value) === 'object') {
      for (var code in value) {
        //this.subdd              
        var label = $('<label>').addClass('radio');
        $('<input type="radio">').attr('name', this.name + '-sub').attr('id', this.name + '_' + code).val(code).prop('checked', first).appendTo(label);
        label.append(value[code].join(','));
        first = false;
        label.appendTo('<li>').appendTo(list);
      }
      this.subdd.find('.dropdown-menu input, .dropdown-menu label').click(function(e) {
          e.stopPropagation();
      });
      this.subdd.find('.dropdown-menu input').change(function (evt) {
        that.subdd.find('.selected-value').text(that.subdd.find('input:checked').parent().text());
        that.onsubselectchangetrigger(this, evt, that);
      });
        that.subdd.find('.selected-value').text(that.subdd.find('input:checked').parent().text());
      this.subdd.find('.dropdown-toggle').dropdown();
      this.subdd.show();
      this.subdd.find('i').toggle(list.children().length > 1);
      this.subdd.find('a').click(function (e) {
        if (list.children().length < 2) {
          e.stopPropagation();
          return false;
        }
      });
      this.onsubselectchangetrigger(list.find('input:checked').get(0), evt, this);
    } else {
      this.__input.val(value);
      this.subdd.hide();
      this.onsubselectchangetrigger(evt?evt.target:undefined, evt, this);
    }
  },
  onsubselectchange : function (func) {
    this.onsubselectchangecallback = func;
  },
  onsubselectchangetrigger : function (input, evt) {
    if ($(input).attr('type') === 'radio') {
      this.__input.val($(input).val());
    }
    if (this.changecallback) {
      this.changecallback(input, evt, this);
    }
    if (this.onsubselectchangecallback) {
      this.onsubselectchangecallback(input, evt, this);
    }
  },
  loadData : function (callback) {
    var that = this;
    $.get(this.jq.data('src'), function (data) {
      that.update(data);
      callback(that, data);
    });
  },
  val : function () {
    var val =  this.__input.val();
    if (val === '') {
      this.__input.val(val = this.value);
    }
    console.log(val);
    return val;
  },
  update : function (data) {
    var valuefield = this.jq.data('valuefield');
    var textfield = this.jq.data('textfield');
    for (var groupName in data) {
      var optGroup = $('<optgroup label="' + groupName + '"/>')
      for (var key in data[groupName]) {
        var option;
        if ($.isArray(data[groupName][key]) && data[groupName][key].length > 0) {
          var value = {};
          $.each(data[groupName][key], function () {
            if (this[textfield]) {
              value[this[valuefield]] = this[textfield];
            } else {
              value = this[valuefield];
              return false;
            }
          });
          $('<option>' + key + '</option>').appendTo(optGroup).val(bls.getString(value));
        } else {
          $('<option>' + data[groupName][key][textfield] + '</option>').appendTo(optGroup).val(data[groupName][key][valuefield]);
        }
        optGroup.appendTo(this.jq);
      }
    }
    this.setDefault();
    this.chosen = this.jq.chosen();
  },
  setDefault : function () {
    var value = $.cookie(this.jq.data('cookie')) || this.jq.data('default');
    value = bls.getString(value);
    console.log('set value to ' + value);
    this.value = value;
    this.jq.val(value);
    //this.onChange();
    this.__input.val(value);
    console.log(this.__input.val());
    this.jq.trigger($.Event("change"));
  }
};