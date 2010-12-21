/*
 ---

 name: ToolbarThemeChange

 script: toolbarthemechange.js

 description: MUI - Creates a toolbar theme changing control.

 copyright: (c) 2010 Contributors in (/AUTHORS.txt).

 license: MIT-style license in (/MIT-LICENSE.txt).

 requires:
 - Core/Element
 - Core/Class
 - Core/Options
 - Core/Events
 - MUI
 - MUI.Core

 provides: [MUI.ToolbarThemeChange]
 ...
 */

MUI.files['{controls}toolbar/toolbarthemechange.js'] = 'loaded';

MUI.ToolbarThemeChange = new Class({

	Implements: [Events, Options],

	options: {
		id:				'',				// id of the primary element, and id os control that is registered with mocha
		container:		null,			// the parent control in the document to add the control to
		drawOnInit:		true,			// true to add tree to container when control is initialized
		cssClass:		'divider',		// the primary css tag

		addTitle:		true			// true if 'Choose Theme:' is shown in the drop down

		//onChange:null					// event: theme was changed
	},

	initialize: function(options){
		options.instance = this;
		this.setOptions(options);

		var o = this.options;
		this.el = {};

		// make sure this controls has an ID
		var id = o.id;
		if (!id){
			id = 'toolbarThemeChange' + (++MUI.IDCount);
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

		self.el.element = div;

		self.el.list = new Element('select', {'id':o.id + 'ThemeList', 'class':'theme'}).inject(div).addEvent('change', this._themeChanged.bind(this));

		var loptions = self.el.list.options;
		loptions.length=0;
		if(o.addTitle) loptions[0] = new Option('Choose Theme:', '', true);
		Object.each(MUI.options.themes, function(name){
			loptions[loptions.length] = new Option(name, name.toLowerCase());
		});

		if (!isNew) return;
		if (o._container) this._addToContainer(o._container, div);
		else window.addEvent('domready', function(){
			if (!o._container){
				o._container = $(containerEl ? containerEl : o.container);
				if (o._container) this._addToContainer(o._container, div);
			}
		});

		return div;
	},

	_addToContainer: function(container, element){
		var instance = container.retrieve('instance');
		element.inject(container, (instance != null && instance.options.orientation == 'right') ? (Browser.ie ? 'top' : 'bottom') : (Browser.ie ? 'bottom' : 'top'));
	},

	_themeChanged: function(e){
		e.stop();
		var list=this.el.list;
		if(!list) return;
		var val=list.options[list.selectedIndex].value;
		if( val && MUI.Themes.init(val)) this.fireEvent('change',val);
	}
});

