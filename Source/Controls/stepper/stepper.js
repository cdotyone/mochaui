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
 - MUI.StepperIterator

 provides: [MUI.Stepper]
 ...
 */

MUI.Stepper = new NamedClass('MUI.Stepper', {

	Implements: [Events, Options],

	options: {
		//id:				'',		 	// id of the primary element, and id os control that is registered with mocha
		//container:		null,	   	// the parent control in the document to add the control to
		//clearContainer:	false,	  	// should the control clear its parent container before it appends itself
		drawOnInit:		  	true,	   	// true to add textbox to container when control is initialized
		cssClass:			'stepper',  // the primary css tag
		width:			   	40,		 	// stepper width in px

		//iterator:		  	null,
		//valueField:		false,	  	// defaults to the id on this field
		//formTitleField:	false,	  	// defaults to the id of this field
		//formData:		  	false,	  	// used in conjunction with the above Fields to get/set value in an object

		hasTitle:			true
		//formTitle:		'',		 	// defaults to the id of this field
		//value:			'',		 	// current date in text form

		//onDrawBegin:null				// event: called when stepper is just starting to be drawn
		//onDrawEnd:null				// event: called when stepper is has just finished drawing
		//onValidationFailed:null		// event; called when the value keyed in by user is invalid
	},

	initialize: function(options) {
		this.setOptions(options);
		options = this.options; // local var options for better js compression
		this.el = {};

		// If stepper has no ID, give it one.
		this.id = options.id = options.id || 'stepper' + (++MUI.idCount);
		MUI.set(this.id, this);

		// defaults to numeric stepper iterator
		if(!options.iterator || options.iterator.isTypeOf('MUI.StepperIterator')) {
			this.options.iterator = null;
			if(!MUI.StepperIterator) {
				new MUI.Require({js: ['{controls}stepper/stepper.iterator.js'],
					onload: function() {
						this.options.iterator = new MUI.StepperIterator();
						this.attachEvents();
					}.bind(this)
				});
			} else {
				this.options.iterator = new MUI.StepperIterator();
			}
		}

		if(options.drawOnInit)
			this.draw();
	},
	
	draw: function(container) {
		this.fireEvent('drawBegin', [this]);

		var options = this.options; // local var options for better js compression
		if (!container) container = options.container;

		// look for a fieldset that contains the input field
		var isNew = false;
		var fs = options.element && options.element.nodeName == 'FIELDSET' ? options.element : $(options.id + '_field');
		if(!fs) {  // create it, if it does not already exist
			fs = new Element('fieldset', { 'id': options.id + '_field' });
			isNew = true;
		}
		this.el.element = fs.addClass(options.cssClass);

		// add form label/title
		var lbl = $(options.id + '_label'),
		tle = '';
		if(options.hasTitle) {  // are we supposed to have a title
			tle = this.getFormTitle();
			lbl = new Element('label', { 'id': options.id + '_label' }).inject(fs);
		} else {
			if(lbl) {  // title not needed so remove it, if it exists
				lbl.dispose();
				this.el.erase('label');
			}
		}
		if(lbl)
			this.el.label = lbl.set('text', tle).set('for', options.id);

		// see if we where given an input field instead
		var inp = options.element && options.element.nodeName == 'INPUT' ? options.element : $(options.id);
		if(!inp) {  // create input field if none given
			inp = new Element('input', {
				'type': 'input',
				'id': options.id
			}).inject(fs);
		}
		this.el.input = inp.set('class', options.cssClass);

		// determine value of input field
		var value = options.value;
		if(options.formData)
			value = MUI.getData(options.formData, (options.valueField ? options.valueField : options.id)); // get value from data if bound to a dataset
		if(value === null)
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
		var addToContainer = function() {
			if (typeOf(container) == 'string')
				container = $(container);
			if (this.el.element.getParent() === null) {
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
	
	attachEvents: function() {

		if(!!this.eventsAttached || !this.el.input)
			return this;

		var iterator = this.options.iterator,
		self = this;

		if(!iterator)
			return this;
			
		iterator.addEvent('change', function(value){
			this.setValue(value);
		}.bind(this));

		this.el.input.addEvents({
			'change': function() {
				self.setValue(this.get('value'));
			},
			'mousewheel': this.onMouseWheel.bind(this)
		});
		
		this.el.up.addEvents({
			'click': function(e) {
				e.stop();
				if(this.aLastValue == this.lastValue && iterator.hasNext())
					iterator.next();
			}.bind(this),
			'mousedown': function(e) {
				e.preventDefault();
				this.aLastValue = this.lastValue;
				this.aDelay = this.startAutoIncrement.delay(500, this);
				this.el.up.addClass('active');
			}.bind(this),
			'mouseup': function() {
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
			'click': function(e) {
				e.stop();
				if(this.aLastValue == this.lastValue && iterator.hasPrevious())
					iterator.previous();
			}.bind(this),
			'mousedown': function(e) {
				e.preventDefault();
				this.aLastValue = this.lastValue;
				this.aDelay = this.startAutoDecrement.delay(400, this);
				this.el.down.addClass('active');
			}.bind(this),
			'mouseup': function() {
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
	
	drawUpdate: function() {
		var iterator = this.options.iterator;

		if(!iterator || !this.el.up || !this.el.down)
			return this;

		if(iterator.hasNext())
			this.el.up.removeClass('disabled');
		else
			this.el.up.addClass('disabled');

		if(iterator.hasPrevious())
			this.el.down.removeClass('disabled');
		else
			this.el.down.addClass('disabled');

		return this;
	},
	
	getFormTitle: function() {
		var options = this.options; // local var options for better js compression
		if (options.formTitle)
			return options.formTitle;
		if (options.formTitleField)
			return MUI.getData(options.formData, options.formTitleField);
		if (options.formData)
			return MUI.getData(options.formData, options.id);
		return options.id;
	},
	
	validateValue: function(value) {
		var iterator = this.options.iterator;

		if(!iterator)
			return this;

		if(iterator.validate(value))
			return true;
		this.fireEvent('validationFailed', [value]);
		return false;
	},
	
	setValue: function(value) {
		var iterator = this.options.iterator;

		if(!iterator)
			return this;

		if(this.validateValue(value)) {
			this.lastValue = value;
			iterator.set(value); // set the value of the iterator
			this.el.input.set('value', value); // set the value in the input field
			this.drawUpdate();
			this.fireEvent('change', [value]);
		} else {
			this.el.input.set('value', this.lastValue); // reset the input field
		}
		return this;
	},
	
	startAutoIncrement: function() {
		var iterator = this.options.iterator;

		this.aInterval = function() {
			if(iterator.hasNext())
				iterator.next();
		}.periodical(150, this);
	},
	
	stopAutoIncrement: function() {
		clearInterval(this.aInterval);
	},
	
	startAutoDecrement: function() {
		var iterator = this.options.iterator;

		this.aInterval = function() {
			if(iterator.hasPrevious())
				iterator.previous();
		}.periodical(150, this);
	},
	
	stopAutoDecrement: function() {
		clearInterval(this.aInterval);
	},
	
	onMouseWheel: function(e){
		if(!this.mWheelNext){
			this.mWheelNext = true;
			(function(){
				var iterator = this.options.iterator;
				this.mWheelNext = false;
				if(e.wheel > 0) { // Mousewheel up
					if(iterator.hasNext()) {
						iterator.next();
						this.el.up.addClass('active'); // show direction indicator
						this.el.down.removeClass('active');
					}
				}
				else if(e.wheel < 0) { // Mousewheel down
					if(iterator.hasPrevious()) {
						iterator.previous();
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
