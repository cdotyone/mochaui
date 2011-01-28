/*
 ---

 name: ToolbarSpinner

 script: toolbarspinner.js

 description: MUI - Creates a toolbar spinner animation control.

 copyright: (c) 2010 Contributors in (/AUTHORS.txt).

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

MUI.files['{controls}toolbar/toolbarspinner.js'] = 'loaded';

MUI.Spinner = new NamedClass('MUI.Spinner', {

	Implements: [Events, Options],

	options: {
		id:				'',				// id of the primary element, and id os control that is registered with mocha
		container:		null,			// the parent control in the document to add the control to
		drawOnInit:		true,			// true to add tree to container when control is initialized

		content:		false,			// used to load content

		cssClass:		false,			// css tag to add to control
		divider:		true,			// true if this toolbar has a divider
		orientation:	false			// left or right side of dock.  default is right
	},

	initialize: function(options){
		this.setOptions(options);
		this.el = {};

		// If spinner has no ID, give it one.
		this.id = this.options.id = this.options.id || 'spinner' + (++MUI.idCount);
		MUI.set(this.id, this);

		if(this.options.drawOnInit) this.draw();
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

		div.addClass('toolbar');
		if (o.cssClass) div.addClass(o.cssClass);
		if (o.divider) div.addClass('divider');
		if (o.orientation) div.addClass(o.orientation);

		this.el.spinner = new Element('div', {'id':o.id + '_spinner','class':'spinner'}).inject(
				new Element('div', {'id':o.id + 'spinnerWrapper','class':'spinnerWrapper'}).inject(div)
				);

		// add to container
		var addToContainer = function(){
			if (typeOf(container) == 'string') container = $(container);
			if (div.getParent() == null) div.inject(container);
		}.bind(this);
		if (!isNew || typeOf(container) == 'element') addToContainer();
		else window.addEvent('domready', addToContainer);

		return div;
	},

	hide: function(){
		if (this.el.spinner) this.el.spinner.hide();
		return this;
	},

	show: function(){
		if (this.el.spinner) this.el.spinner.show();
		return this;
	}

});

