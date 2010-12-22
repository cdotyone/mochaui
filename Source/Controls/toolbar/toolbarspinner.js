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
		cssClass:		'divider',		// the primary css tag

		content:		false			// used to load content
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
		if (o.cssClass) div.addClass(o.cssClass);
		div.empty();

		self.el.spinner = new Element('div', {'id':o.id + '_spinner',class:'spinner'}).inject(
			new Element('div', {'id':o.id + 'spinnerWrapper',class:'spinnerWrapper'}).inject(div)
		);

		self.el.element = div;

		if (!isNew) return;
		if (o._container){
			this._addToContainer(o._container, div);
		}
		else window.addEvent('domready', function(){
			if (!o._container){
				o._container = $(containerEl ? containerEl : o.container);
				if (o._container) this._addToContainer(o._container, div);
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
	},

	_addToContainer: function(container, element){
		var instance = container.retrieve('instance');
		element.inject(container, (instance != null && instance.options.orientation == 'right') ? (Browser.ie ? 'top' : 'bottom') : (Browser.ie ? 'bottom' : 'top'));
	}

});

