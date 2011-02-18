/*
 ---

 name: DockHtml

 script: dockhtml.js

 description: MUI.DockHtml - Creates a toolbar control that contains generic html.

 copyright: (c) 2011 Contributors in (/AUTHORS.txt).

 license: MIT-style license in (/MIT-LICENSE.txt).

 requires:
 - Core/Element
 - Core/Class
 - Core/Options
 - Core/Events
 - MUI
 - MUI.Core

 provides: [MUI.DockHtml]
 ...
 */

MUI.DockHtml = new NamedClass('MUI.DockHtml', {

	Implements: [Events, Options],

	options: {
		id:				'',				// id of the primary element, and id os control that is registered with mocha
		container:		null,			// the parent control in the document to add the control to
		drawOnInit:		true,			// true to add tree to container when control is initialized

		content:		false,			// used to load content

		cssClass:		'toolbar',		// css tag to add to control
		divider:		true,			// true if this toolbar has a divider
		orientation:	false			// left or right side of dock.  default is right
	},

	initialize: function(options){
		this.setOptions(options);
		this.el = {};

		// If DockHtml has no ID, give it one.
		this.id = this.options.id = this.options.id || 'dockHtml' + (++MUI.idCount);
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
		if (o.content) o.content.container = div;

		// add styling to element
		if (o.cssClass) div.addClass(o.cssClass);
		if (o.divider) div.addClass('divider');
		if (o.orientation) div.addClass(o.orientation);

		o.content.element = this.el.element = div.store('instance', this);		// assign instance to element

		// add to container
		var addToContainer = function(){
			if (typeOf(container) == 'string') container = $(container);
			if (div.getParent() == null) div.inject(container);

			// add content
			if (o.content) MUI.Content.update(o.content);
		}.bind(this);
		if (!isNew || typeOf(container) == 'element') addToContainer();
		else window.addEvent('domready', addToContainer);

		return this;
	}

});

