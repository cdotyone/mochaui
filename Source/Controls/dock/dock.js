/*
 ---

 name: ToolbarDock

 script: toolbardock.js

 description: MUI - Creates a toolbar dock control.

 copyright: (c) 2010 Contributors in (/AUTHORS.txt).

 license: MIT-style license in (/MIT-LICENSE.txt).

 requires:
 - Core/Element
 - Core/Class
 - Core/Options
 - Core/Events
 - MUI
 - MUI.Core

 provides: [MUI.Dock]
 ...
 */

MUI.files['{controls}toolbar/toolbardock.js'] = 'loaded';

MUI.Dock = new NamedClass('MUI.Dock', {

	Implements: [Events, Options],

	options: {
		id:				'',				// id of the primary element, and id os control that is registered with mocha
		container:		null,			// the parent control in the document to add the control to
		drawOnInit:		true,			// true to add tree to container when control is initialized
		cssClass:		false,			// additional css tag
		orientation:	'left',			// toolbars are listed from left to right or right to left

		partner:		false,			// default partner panel to pass docked controls

		docked:			[]				// items that are docked currently
	},

	initialize: function(options){
		this.setOptions(options);
		this.el = {};

		// If dock has no ID, give it one.
		this.id = this.options.id = this.options.id || 'dock' + (++MUI.idCount);
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

		// add styling to element
		div.addClass('toolbardock');
		if (o.cssClass) div.addClass(o.cssClass);

		this.el.element = div.store('instance', this);		// assign instance to element

		// add to container
		var addToContainer = function(){
			if (typeOf(container) == 'string') container = $(container);
			if (div.getParent() == null) div.inject(container);

			// add docked controls
			Object.each(this.options.docked, this._createToolbar, this);
		}.bind(this);
		if (!isNew || typeOf(container) == 'element') addToContainer();
		else window.addEvent('domready', addToContainer);

		return this;
	},

	_createToolbar:function(toolbar, idx){
		if (!toolbar.control) toolbar.control = 'MUI.DockHtml';
		if (!toolbar.id) toolbar.id = this.id + 'Toolbar' + idx;
		toolbar.container = this.el.element;
		toolbar.element = new Element('div', {'id':toolbar.id,'class':'toolbar'}).inject(this.el.element);
		if (!toolbar.partner) toolbar.partner = this.options.partner;
		this.options.docked[idx] = toolbar;
		var content = {};
		Object.each(toolbar, function(val, key){
			if (['loadmethod', 'method', 'url', 'content', 'onloaded'].indexOf(key) > -1)
				content[key] = val;
		});
		toolbar.content = content;
		MUI.create(toolbar);
	}

});
