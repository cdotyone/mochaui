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

 provides: [MUI.ToolbarDock]
 ...
 */

MUI.files['{controls}toolbar/toolbardock.js'] = 'loaded';

MUI.ToolbarDock = new Class({

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
		var self = this;
		self.setOptions(options);
		var o = self.options;
		self.el = {};

		// make sure this controls has an ID
		var id = o.id;
		if (!id){
			id = 'toolbarDock' + (++MUI.IDCount);
			o.id = id;
		}
		this.id = id;

		this.draw();

		MUI.set(id, this);
	},

	draw: function(containerEl){
		var self = this;
		var o = self.options;

		var isNew = false;
		var div;

		div = $(o.id);
		if (!div){
			div = new Element('div', {'id': o.id});
			isNew = true;
		}
		div.addClass('toolbardock');
		if (o.cssClass) div.addClass(o.cssClass);
		self.el.element = div.store('instance', this);

		if (!isNew || o._container) this._addToContainer(o._container, div);
		else window.addEvent('domready', function(){
			if (!o._container) o._container = $(containerEl ? containerEl : o.container);
			this._addToContainer(o._container, div);
		});

		return div;
	},

	_addToContainer: function(container){
		if(this.el.element.getParent()==null) this.el.element.inject(container);
		Object.each(this.options.docked, this._createToolbar.bind(this));
	},

	_createToolbar:function(toolbar, idx){
		if (!toolbar.control) toolbar.control = 'MUI.ToolbarHtml';
		if (!toolbar.id) toolbar.id = this.id + 'Toolbar' + idx;
		new Element('div', {'id':toolbar.id,'class':'toolbar'}).inject(this.el.element);
		/*
		 toolbar._container = this.el.element;
		 toolbar.container = toolbar._container.id;
		 */
		if (!toolbar.partner) toolbar.partner = this.options.partner;
		this.options.docked[idx] = toolbar;
		var content = {};
		Object.each(toolbar, function(val, key){
			if (['loadmethod', 'method', 'url', 'content', 'onloaded'].indexOf(key) > -1)
				content[key] = val;
		});
		toolbar.content = content;
		MUI.create(toolbar.control, toolbar);
	}

});
