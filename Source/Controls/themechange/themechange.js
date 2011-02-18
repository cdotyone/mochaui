/*
 ---

 name: ThemeChange

 script: themechange.js

 description: MUI.ThemeChange - Creates a toolbar theme changing control.

 copyright: (c) 2011 Contributors in (/AUTHORS.txt).

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
		this.setOptions(options);
		this.el = {};

		// If themeChange has no ID, give it one.
		this.id = this.options.id = this.options.id || 'themeChange' + (++MUI.idCount);
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

		div.empty().addClass('toolbar');
		if(o.cssClass) div.addClass(o.cssClass);
		if(o.divider) div.addClass('divider');

		this.el.element = div.store('instance', this);

		this.el.list = new Element('select', {'id':o.id + 'ThemeList', 'class':'theme'}).inject(div).addEvent('change', this._themeChanged.bind(this));

		var loptions = this.el.list.options;
		loptions.length=0;
		if(o.addTitle) loptions[0] = new Option('Choose Theme:', '', true);
		Object.each(MUI.options.themes, function(name){
			loptions[loptions.length] = new Option(name, name.toLowerCase());
		});

		// add to container
		var addToContainer = function(){
			if (typeOf(container) == 'string') container = $(container);
			if (div.getParent() == null) div.inject(container);
		}.bind(this);
		if (!isNew || typeOf(container) == 'element') addToContainer();
		else window.addEvent('domready', addToContainer);

		return this;
	},

	_themeChanged: function(e){
		e.stop();
		var list=this.el.list;
		if(!list) return;
		var val=list.options[list.selectedIndex].value;
		if( val && MUI.Themes.init(val)) this.fireEvent('change',val);
	}
});

