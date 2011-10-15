/*
 ---

 name: Stepper

 script: stepper.js

 description: MUI - Creates a stepper control. Defaults to numeric stepper.

 copyright: (c) 2011 André Fiedler <kontakt@visualdrugs.net>

 license: MIT-style license in (/MIT-LICENSE.txt).

 note:
 This documentation is taken directly from the javascript source files. It is built using Natural Docs.

 requires:
 - Core/Element
 - Core/Class
 - Core/Options
 - Core/Events
 - MUI
 - MUI.Core

 provides: [MUI.Stepper]
 ...
 */

MUI.Stepper = new NamedClass('MUI.Stepper', {

	Implements: [Events, Options],

	options: {
		//id:				'',		 	// id of the primary element, and id os control that is registered with mocha
		//container:		null,	   	// the parent control in the document to add the control to
		//clearContainer:	false,	  	// should the control clear its parent container before it appends itself
		drawOnInit:			true,		   // true to add textbox to container when control is initialized
		cssClass:			'mui-stepper',  // the primary css tag
		//width:			40,			// stepper width in px

		//iterator:		  	null,
		//valueField:		false,	  	// defaults to the id on this field
		//formTitleField:	false,	  	// defaults to the id of this field
		//formData:		  	false,	  	// used in conjunction with the above Fields to get/set value in an object

		hasTitle:			true
		//formTitle:		'',		 	// defaults to the id of this field
		//value:			'',		 	// current date in text form
		//minValue:			null,
		//maxValue:			null

		//onDrawBegin:null				// event: called when stepper is just starting to be drawn
		//onDrawEnd:null				// event: called when stepper is has just finished drawing
		//onValidationFailed:null		// event; called when the value keyed in by user is invalid
	},

	initialize: function(options){
		this.setOptions(options);
		options = this.options; // local var options for better js compression
		this.el = {};

		// If stepper has no ID, give it one.
		this.id = options.id = options.id || 'stepper' + (++MUI.idCount);
		MUI.set(this.id, this);

		// defaults to numeric stepper iterator
		if (!options.iterator) options.iterator = 'numeric';

		if (options.drawOnInit)	this.draw();
	},

	draw: function(container){
		this.fireEvent('drawBegin', [this]);

		var options = this.options; // local var options for better js compression
		if (!container) container = options.container;
		this._iterator = MUI.Stepper.interators[options.iterator];

		if (!options.value) options.value = this._iterator.defaultValue.attempt(null, this);
		if (!options.width) options.width = this._iterator.defaultWidth.attempt(null, this);

		// look for a fieldset that contains the input field
		var isNew = false;
		var fs = options.element && options.element.nodeName == 'FIELDSET' ? options.element : $(options.id + '_field');
		if (!fs){  // create it, if it does not already exist
			fs = new Element('fieldset', { 'id': options.id + '_field' });
			isNew = true;
		}
		this.el.element = fs.addClass(options.cssClass);

		// add form label/title
		var lbl = $(options.id + '_label'),
				tle = '';
		if (options.hasTitle){  // are we supposed to have a title
			tle = this.getFormTitle();
			lbl = new Element('label', { 'id': options.id + '_label' }).inject(fs);
		} else {
			if (lbl){  // title not needed so remove it, if it exists
				lbl.dispose();
				this.el.erase('label');
			}
		}
		if (lbl)
			this.el.label = lbl.set('text', tle).set('for', options.id);

		// see if we where given an input field instead
		var inp = options.element && options.element.nodeName == 'INPUT' ? options.element : $(options.id);
		if (!inp){  // create input field if none given
			inp = new Element('input', {
				'type': 'input',
				'id': options.id
			}).inject(fs);
		}
		this.el.input = inp.set('class', options.cssClass);

		// determine value of input field
		var value = options.value;
		if (options.formData)
			value = MUI.getData(options.formData, (options.valueField ? options.valueField : options.id)); // get value from data if bound to a dataset
		if (value === null)
			value = this.el.input.get('value'); // pull value from input field if we don't have one yet
		options.value = value; // remember the current value, so we can detect changes
		this.lastValue = value;

		this.setValue(value);

		// draw steppers
		this.el.stepperContainer = new Element('div', {
			'class': options.cssClass + 'Container'
		}).inject(this.el.input, 'after');

		this.el.up = new Element('div', {
			'class': options.cssClass + 'Up',
			'text': '+'
		}).inject(this.el.stepperContainer);

		this.el.down = new Element('div', {
			'class': options.cssClass + 'Down',
			'text': '-'
		}).inject(this.el.stepperContainer);

		// set input width
		var stepperSize = this.el.stepperContainer.getSize();
		this.el.input.setStyle('width', options.width - stepperSize.x);

		// add to container
		var addToContainer = function(){
			if (typeOf(container) == 'string')
				container = $(container);
			if (this.el.element.getParent() === null){
				if (options.clearContainer)
					container.empty();
				this.el.element.inject(container);
			}
			this.fireEvent('drawEnd', [this]);
		}.bind(this);
		if (!isNew || typeOf(container) === 'element')
			addToContainer();
		else
			window.addEvent('domready', addToContainer);

		this.attachEvents().drawUpdate();

		return this;
	},

	attachEvents: function(){

		if (!!this.eventsAttached || !this.el.input)
			return this;

		this.el.input.addEvents({
			'change': function(){
				this.setValue(this.el.input.get('value'));
			}.bind(this),
			'mousewheel': this.onMouseWheel.bind(this)
		});

		this.el.up.addEvents({
			'click': function(e){
				var itr = this._iterator;
				e.stop();
				if (this.aLastValue == this.lastValue && itr.next){
					if (itr.hasNext && itr.hasNext.attempt(null, this)) itr.next.attempt(null, this);
					this.setValue(this.options.value);
				}
			}.bind(this),
			'mousedown': function(e){
				e.preventDefault();
				this.aLastValue = this.lastValue;
				this.aDelay = this.startAutoIncrement.delay(500, this);
				this.el.up.addClass('active');
			}.bind(this),
			'mouseup': function(){
				clearTimeout(this.aDelay);
				this.stopAutoIncrement();
				this.el.up.removeClass('active');
			}.bind(this),
			'mouseenter': function(){
				this.addClass('over');
			},
			'mouseleave': function(){
				this.removeClass('over')
			},
			'mousewheel': this.onMouseWheel.bind(this)
		});

		this.el.down.addEvents({
			'click': function(e){
				var itr = this._iterator;
				e.stop();
				if (this.aLastValue == this.lastValue && itr.previous){
					if (itr.hasPrevious && itr.hasPrevious.attempt(null, this)) itr.previous.attempt(null, this);
					this.setValue(this.options.value);
				}
			}.bind(this),
			'mousedown': function(e){
				e.preventDefault();
				this.aLastValue = this.lastValue;
				this.aDelay = this.startAutoDecrement.delay(400, this);
				this.el.down.addClass('active');
			}.bind(this),
			'mouseup': function(){
				clearTimeout(this.aDelay);
				this.stopAutoDecrement();
				this.el.down.removeClass('active');
			}.bind(this),
			'mouseenter': function(){
				this.addClass('over');
			},
			'mouseleave': function(){
				this.removeClass('over')
			},
			'mousewheel': this.onMouseWheel.bind(this)
		});

		this.eventsAttached = true;

		return this;
	},

	drawUpdate: function(){
		if (!this.el.up || !this.el.down)
			return this;

		if (this._iterator.hasNext && this._iterator.hasNext.attempt(null, this))
			this.el.up.removeClass('disabled');
		else
			this.el.up.addClass('disabled');

		if (this._iterator.hasNext && this._iterator.hasPrevious.attempt(null, this))
			this.el.down.removeClass('disabled');
		else
			this.el.down.addClass('disabled');

		return this;
	},

	getFormTitle: function(){
		var options = this.options; // local var options for better js compression
		if (options.formTitle)
			return options.formTitle;
		if (options.formTitleField)
			return MUI.getData(options.formData, options.formTitleField);
		if (options.formData)
			return MUI.getData(options.formData, options.id);
		return options.id;
	},

	validateValue: function(value){
		var lastValue = this.options.value;
		this.options.value = value;

		if (this._iterator.validate && this._iterator.validate.attempt(null, this)){
			this.options.value = lastValue;
			return true;
		}

		this.options.value = lastValue;
		this.fireEvent('validationFailed', [value]);
		return false;
	},

	setValue: function(value){
		if (this.validateValue(value)){
			this.lastValue = value;
			this.options.value = value;
			this.el.input.set('value', value); // set the value in the input field
			this.drawUpdate();
			this.fireEvent('change', [value]);
		} else {
			this.options.value = this.lastValue;
			this.el.input.set('value', this.lastValue); // reset the input field
		}
		return this;
	},

	startAutoIncrement: function(){
		this.aInterval = function(){
			if (this._iterator.next && this._iterator.hasNext && this._iterator.hasNext.attempt(null, this))
				this._iterator.next.attempt(null, this);
			else this.stopAutoIncrement();
		}.periodical(150, this);
	},

	stopAutoIncrement: function(){
		clearInterval(this.aInterval);
	},

	startAutoDecrement: function(){
		if (this._iterator.previous && this._iterator.hasPrevious && this._iterator.hasPrevious.attempt(null, this))
			this._iterator.previous.attempt(null, this);
		else this.stopAutoDecrement();
	},

	stopAutoDecrement: function(){
		clearInterval(this.aInterval);
	},

	onMouseWheel: function(e){
		if (!this.mWheelNext){
			this.mWheelNext = true;
			(function(){
				this.mWheelNext = false;
				if (e.wheel > 0){ // Mousewheel up
					if (this._iterator.next && this._iterator.hasNext && this._iterator.hasNext.attempt(null, this)){
						this._iterator.next.attempt(null, this);
						this.el.up.addClass('active'); // show direction indicator
						this.el.down.removeClass('active');
					}
				}
				else if (e.wheel < 0){ // Mousewheel down
					if (this._iterator.previous && this._iterator.hasPrevious && this._iterator.hasPrevious.attempt(null, this)){
						this._iterator.previous.attempt(null, this);
						this.el.down.addClass('active'); // show direction indicator
						this.el.up.removeClass('active');
					}
				}
				clearTimeout(this.mWheelIndicator);
				this.mWheelIndicator = (function(){
					this.el.up.removeClass('active');
					this.el.down.removeClass('active');
				}.bind(this)).delay(200); // remove direction indicator
			}.bind(this)).delay(100); // slow down
		}
	}
});

Object.append(MUI.Stepper, {
	interators: {},

	registerIterator: function(name, iterator){
		MUI.Stepper[name] = iterator;
	}
});

MUI.Stepper.interators.numeric = {

	defaultValue:function(){return 0},

	defaultWidth:function(){return 40},

	validate: function(){
		var intv = parseInt(this.options.value, 10);
		var floatv = parseFloat(this.options.value, 10);
		return !isNaN(intv)
				&& (floatv == intv)
				&& (this.options.minValue == null || intv >= this.options.minValue)
				&& (this.options.maxValue == null || intv <= this.options.maxValue)
	},

	next: function(){
		this.options.value = parseInt(this.options.value, 10) + 1;
	},

	previous: function(){
		this.options.value = parseInt(this.options.value, 10) - 1;
	},

	hasNext: function(){
		if (!this.options.maxValue) return true;
		var intv = parseInt(this.options.value, 10);
		return (this.options.maxValue == null || intv <= this.options.maxValue);
	},

	hasPrevious: function(){
		if (!this.options.minValue) return true;
		var intv = parseInt(this.options.value, 10);
		return (this.options.minValue == null || intv >= this.options.minValue);
	}

};

MUI.Stepper.interators.alpha = {

	defaultValue:function(){return 'A'},

	defaultWidth:function(){return 40},

	validate: function(){
		var c = 0;
		if (this.options.value != null && this.options.value != '') c = this.options.value.charCodeAt(0);
		return	c != 0
				&& c >= ('A').charCodeAt(0)
				&& c <= ('Z').charCodeAt(0)
				&& (this.options.minValue == null || c >= this.options.minValue.charCodeAt(0))
				&& (this.options.maxValue == null || c <= this.options.maxValue.charCodeAt(0));
	},

	next: function(){
		this.options.value = String.fromCharCode(this.options.value.charCodeAt(0) + 1);
	},

	previous: function(){
		this.options.value = String.fromCharCode(this.options.value.charCodeAt(0) - 1);
	},

	hasNext: function(){
		if (!this.options.maxValue) return true;
		var c = 0;
		if (this.options.value != null && this.options.value != '') c = this.options.value.charCodeAt(0);
		return (this.options.maxValue == null || c >= this.options.maxValue.charCodeAt(0))
	},

	hasPrevious: function(){
		if (!this.options.minValue) return true;
		var c = 0;
		if (this.options.value != null && this.options.value != '') c = this.options.value.charCodeAt(0);
		return (this.options.minValue == null || c >= this.options.minValue.charCodeAt(0))
	}

};

MUI.Stepper.interators.hex = {

	defaultValue:function(){return 0},

	defaultWidth:function(){return 40},

	validate:function(){
		var c = -1;
		if (this.options.value != null && this.options.value != '') c = parseInt(this.options.value);
		return	c != -1
				&& (this.options.minValue == null || c >= this.options.minValue)
				&& (this.options.maxValue == null || c <= this.options.maxValue);
	},

	next: function(){
		this.options.value = (parseInt(this.options.value, 16) + 1).toString(16).toUpperCase();
	},

	previous: function(){
		this.options.value = (parseInt(this.options.value, 16) - 1).toString(16).toUpperCase();
	},

	hasNext: function(){
		if (!this.options.maxValue) return true;
		var c = -1;
		if (this.options.value != null && this.options.value != '') c = parseInt(this.options.value);
		return (this.options.maxValue == null || c <= this.options.maxValue);
	},

	hasPrevious: function(){
		if (!this.options.minValue) return true;
		var c = -1;
		if (this.options.value != null && this.options.value != '') c = parseInt(this.options.value);
		return (this.options.minValue == null || c >= this.options.minValue);
	}

};

MUI.Stepper.interators.time = {

	defaultValue:function(){ return this.options.use24 ? '12:00' : '12:00 PM' },

	defaultWidth:function(){ return this.options.use24 ? 40 : 56 },

	validate: function(){
		var o = this.options;
		if (!o._minValue && o.minValue) o._minValue = MUI.Stepper.interators.time.parse(o.minValue);
		if (!o._maxValue && o.maxValue) o._maxValue = MUI.Stepper.interators.time.parse(o.maxValue);
		var t = MUI.Stepper.interators.time.parse(o.value);

		return	t != -1
				&& (!o._maxValue || t <= o._maxValue)
				&& (!o._minValue || t >= o._minValue);
	},

	next: function(){
		var t = MUI.Stepper.interators.time.parse(this.options.value);
		if (t == -1) return;
		if (this.options.step) t += this.options.step;
		else t += 15;
		if (t >= 1440) t -= 1440;
		this.options.value = MUI.Stepper.interators.time.format(t, this.options.use24);
	},

	previous: function(){
		var t = MUI.Stepper.interators.time.parse(this.options.value);
		if (t == -1) return;
		if (this.options.step) t -= this.options.step;
		else t -= 15;
		if (t <= 0) t += 1440;
		this.options.value = MUI.Stepper.interators.time.format(t, this.options.use24);
	},

	hasNext: function(){
		var o = this.options;
		if (!o.maxValue) return true;
		if (!o._maxValue) o._maxValue = MUI.Stepper.interators.time.parse(o.maxValue);

		var t = MUI.Stepper.interators.time.parse(this.options.value);
		if (t == -1) return false;
		var step = this.options.step ? this.options.step : 15;
		return t + step <= o._maxValue;
	},

	hasPrevious: function(){
		var o = this.options;
		if (!o.minValue) return true;
		if (!o._minValue) o._minValue = MUI.Stepper.interators.time.parse(o.minValue);

		var t = MUI.Stepper.interators.time.parse(this.options.value);
		if (t == -1) return false;
		var step = this.options.step ? this.options.step : 15;
		return t - step >= o._minValue;
	},

	format: function(min, use24){
		var h = Math.floor(min / 60);
		var m = min % 60;

		if (use24) return (h < 10 ? '0' : '') + h + ":" + (m < 10 ? '0' : '') + m;
		var am = h < 12 ? ' AM' : ' PM';
		if (am == ' PM' && h > 12) h = h - 12;
		if (h == 0) h = 12;
		return (h < 10 ? '0' : '') + h + ":" + (m < 10 ? '0' : '') + m + am;
	},

	parse: function(value){
		var t = {};
		var p = value.match(/((0?[1-9]|1[012])(:)([0-5]\d){0,2})(\s)?([AP]M)$|([01]\d|2[0-3])(:)([0-5]\d){0,2}$/i);
		if (!p) return -1;
		if (p[2]){
			if (p[2].substr(0, 1) == '0') p[2] = p[2].substr(1);
			if (p[4].substr(0, 1) == '0') p[4] = p[4].substr(1);
			t.h = parseInt(p[2]);
			t.m = parseInt(p[4]);
			t.h += (p[6].toUpperCase() == 'AM') ? (t.h == 12 ? -12 : 0) : (t.h == 12 ? 0 : 12);
			if (t.h >= 24) t.h = 0;
		} else {
			if (p[7].substr(0, 1) == '0') p[7] = p[7].substr(1);
			if (p[9].substr(0, 1) == '0') p[9] = p[9].substr(1);
			t.h = parseInt(p[7]);
			t.m = parseInt(p[9]);
		}
		return (t.h * 60) + t.m;
	}

};


MUI.Stepper.interators.list = {

	defaultValue:function(){ return this.options.data[parseInt(this.options.data.length / 2)] },

	defaultWidth:function(){ return 40 },

	validate: function(){
		if (this.options.data.indexOf(this.options.value)) return true;
		var v=this.options.value.toLowerCase();
		for(var i=0;i<this.options.data.length;i++) {
			if(this.options.data[i].toLowerCase()==v) return true;
		}
		return false;
	},

	next: function(){
		var i = this.options.data.indexOf(this.options.value);
		i++;
		if (i >= this.options.data.length) i = 0;
		this.options.value = this.options.data[i];
	},

	previous: function(){
		var i = this.options.data.indexOf(this.options.value);
		i--;
		if (i <= 0) i = this.options.data.length - 1;
		this.options.value = this.options.data[i];
	},

	hasNext: function(){
		if (!this.options.maxValue) return true;
		var c = this.options.data.indexOf(this.options.value);
		return (this.options.maxValue == null || c <= this.options.maxValue);
	},

	hasPrevious: function(){
		if (!this.options.minValue) return true;
		var c = this.options.data.indexOf(this.options.value);
		return (this.options.minValue == null || c >= this.options.minValue);
	}

};
