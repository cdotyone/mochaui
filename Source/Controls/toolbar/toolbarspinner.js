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

 provides: [MUI.ToolbarSpinner]
 ...
 */

MUI.files['{controls}toolbar/toolbarspinner.js'] = 'loaded';

MUI.ToolbarSpinner = new Class({

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
			id = 'toolbarSpinner' + (++MUI.IDCount);
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
		var div = $(o.id);
		if (!div){
			div = new Element('div', {'id': o.id});
			isNew = true;
		}
		div.empty();

		div.addClass('toolbar');
		if (o.cssClass) div.addClass(o.cssClass);
		if (o.divider) div.addClass('divider');
		if (o.orientation) div.addClass(o.orientation);

		self.el.element = div.store('instance', this);

		self.el.spinner = new Element('div', {'id':o.id + '_spinner',class:'spinner'}).inject(
				new Element('div', {'id':o.id + 'spinnerWrapper',class:'spinnerWrapper'}).inject(div)
				);

		if (!isNew) return;
		if (o._container) o._container.inject(div);
		else window.addEvent('domready', function(){
			if (!o._container){
				o._container = $(containerEl ? containerEl : o.container);
				if (o._container) o._container.inject(div);
			}
		});

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

