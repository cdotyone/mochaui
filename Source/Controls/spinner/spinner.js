/*
 ---

 name: Spinner

 script: spinner.js

 description: MUI.Spinner - Creates a toolbar spinner animation control.

 copyright: (c) 2011 Contributors in (/AUTHORS.txt).

 license: MIT-style license in (/MIT-LICENSE.txt).

 requires:
 - Core/Element
 - Core/Class
 - Core/Options
 - Core/Events
 - MUI
 - MUI.Core

 provides: [MUI.Spinner]
 ...
 */

MUI.Spinner = new NamedClass('MUI.Spinner', {

	Implements: [Events, Options],

	options: {
		id:				'',				// id of the primary element, and id os control that is registered with mocha
		container:		null,			// the parent control in the document to add the control to
		drawOnInit:		true,			// true to add tree to container when control is initialized

		cssClass:		false,			// css tag to add to control

		inDock:			false,			// is this spinner inside a dock control, set by dock control (do not set)
		divider:		true,			// true if this toolbar has a divider
		orientation:	false			// left or right side of dock.  default is right
	},

	initialize: function(options){
		this.setOptions(options);
		this.el = {};

		// If spinner has no ID, give it one.
		this.id = this.options.id = this.options.id || 'spinner' + (++MUI.idCount);
		MUI.set(this.id, this);

		if (this.options.drawOnInit) this.draw();
	},

	draw: function(container){
		var o = this.options;
		if (!container) container = o.container;

		// determine element for this control
		var isNew = false;
		var div = o.element ? o.element : $(o.id);
		if (!div){
			div = new Element('div', {'id': o.id});
			isNew = true;
		}
		this.el.element = div.store('instance', this).empty();

		// process dock options
		if (o.inDock){
			if (o.divider) div.addClass('divider');
			if (o.orientation) div.addClass(o.orientation);
			div.addClass('toolbar');
		}
		if (o.cssClass) div.addClass(o.cssClass);

		this.el.spinnerWrapper = new Element('div', {'id':o.id + 'spinnerWrapper','class':'spinnerWrapper'}).inject(div);
		this.el.spinner = new Element('div', {'id':o.id + '_spinner','class':'spinner'}).inject(this.el.spinnerWrapper);

		// add to container
		var addToContainer = function(){
			if (typeOf(container) == 'string') container = $(container);
			if (div.getParent() == null) div.inject(container, 'top');
			this.show();
		}.bind(this);
		if (!isNew || typeOf(container) == 'element') addToContainer();
		else window.addEvent('domready', addToContainer);

		return this;
	},

	hide: function(){
		if (this.el.spinner) this.el.spinner.hide();
		if (this.el.element) this.el.removeClass('spinnerOverlay');
		return this;
	},

	show: function(){
		if (this.el.spinner) this.el.spinner.show();
		var container;
		if (this.el.element) container = this.el.element.getParent();
		if (container && !this.options.inDock){
			var sz = container.getScrollSize();
			var x = parseInt((sz.x / 2) - 16);
			var y = parseInt((sz.y / 2) - 16);
			this.el.element.addClass('spinnerOverlay').setStyles({width:sz.x,height:sz.y});
			this.el.spinnerWrapper.setStyles({'position':'absolute','left':x,'top':y,'zIndex':1000});
		}
		return this;
	},

	dispose: function(){
		return this.hide();
	}
});
