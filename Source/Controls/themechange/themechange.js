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

 provides: [MUI.ThemeChange]
 ...
 */

MUI.files['{controls}toolbar/toolbarthemechange.js'] = 'loaded';

MUI.ThemeChange = new NamedClass('MUI.ThemeChange', {

	Implements: [Events, Options],

	options: {
		id:				'',				// id of the primary element, and id os control that is registered with mocha
		container:		null,			// the parent control in the document to add the control to
		drawOnInit:		true,			// true to add tree to container when control is initialized
		cssClass:		false,			// css tag to add to control

		addTitle:		true,			// true if 'Choose Theme:' is shown in the drop down
		divider:		true			// true if this toolbar has a divider

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
		if(o.cssClass) div.addClass(o.cssClass);
		if(o.divider) div.addClass('divider');

		self.el.element = div.store('instance', this);

		self.el.list = new Element('select', {'id':o.id + 'ThemeList', 'class':'theme'}).inject(div).addEvent('change', this._themeChanged.bind(this));

		var loptions = self.el.list.options;
		loptions.length=0;
		if(o.addTitle) loptions[0] = new Option('Choose Theme:', '', true);
		Object.each(MUI.options.themes, function(name){
			loptions[loptions.length] = new Option(name, name.toLowerCase());
		});

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

	_themeChanged: function(e){
		e.stop();
		var list=this.el.list;
		if(!list) return;
		var val=list.options[list.selectedIndex].value;
		if( val && MUI.Themes.init(val)) this.fireEvent('change',val);
	}
});

