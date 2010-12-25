/*
 ---

 name: ToolbarHtml

 script: toolbarhtml.js

 description: MUI - Creates a toolbar control that contains generic html.

 copyright: (c) 2010 Contributors in (/AUTHORS.txt).

 license: MIT-style license in (/MIT-LICENSE.txt).

 requires:
 - Core/Element
 - Core/Class
 - Core/Options
 - Core/Events
 - MUI
 - MUI.Core

 provides: [MUI.ToolbarHtml]
 ...
 */

MUI.files['{controls}toolbar/toolbarhtml.js'] = 'loaded';

MUI.ToolbarHtml = new Class({

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
		options.instance = this;
		this.setOptions(options);

		var o = this.options;
		this.el = {};

		// make sure this controls has an ID
		var id = o.id;
		if (!id){
			id = 'toolbarHtml' + (++MUI.IDCount);
			o.id = id;
		}
		this.id = id;

		if (o.content) o.content.instance = this;
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

		div.addClass('toolbar');
		if(o.cssClass) div.addClass(o.cssClass);
		if(o.divider) div.addClass('divider');
		if(o.orientation) div.addClass(o.orientation);

		self.el.element = div.store('instance', this);

		if (!isNew || o._container) {
			if(isNew) o._container.inject(div);
			if (o.content) {
				if(o.content==null || o.content.content==null || o.content.content.style==null)  MUI.Content.update(o.content);
				else o.content.content.inject(div);
			}
		}
		else window.addEvent('domready', function(){
			if (!o._container) o._container = $(containerEl ? containerEl : o.container);
			if (o._container) o._container.inject(div);
			if (o.content) MUI.Content.update(o.content);
		});

		return div;
	},

	updateSetContent: function(content){
		this.el.element.set('html', content.content);
		return false;
	}

});

