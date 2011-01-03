/*
 ---

 name: Desktop

 script: desktop.js

 description: MUI - Creates main desktop control that loads rest of desktop.

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

MUI.files['{controls}desktop/desktop.js'] = 'loaded';

MUI.Desktop = new NamedClass('MUI.Desktop', {

	Implements: [Events, Options],

	options: {
		id:				'',				// id of the primary element, and id os control that is registered with mocha
		container:		null,			// the parent control in the document to add the control to
		drawOnInit:		true,			// true to add tree to container when control is initialized
		cssClass:		false,			// additional css tag
		orientation:	'left',			// toolbars are listed from left to right or right to left

		partner:		false,			// default partner panel to pass docked controls
		header:			true,			// has a header section
		footer:			true,			// has a footer section

		sections:		[]				// sections that make up desktop, section names can be 'header','content','footer'
	},

	initialize: function(options)
	{
		var self = this;
		self.setOptions(options);
		var o = self.options;
		self.el = {};

		// make sure this controls has an ID
		var id = o.id;
		if (!id){
			id = 'desktop' + (++MUI.IDCount);
			o.id = id;
		}
		this.id = id;
		MUI.set(id, this);

		this.draw();
	},

	draw: function(containerEl)
	{
		var self = this;
		var o = self.options;

		var isNew = false;
		var div;

		div = $(o.id);
		if (!div){
			div = new Element('div', {'id': o.id});
			isNew = true;
		}
		div.addClass('desktop');
		div.empty();
		if (o.cssClass) div.addClass(o.cssClass);
		self.el.element = div.store('instance', this);

		if (o.header) this.el[o.id + 'Header'] = new Element('div', {'id':o.id + 'Header','class':'desktopHeader'}).inject(this.el.element);
		this.el[o.id + 'Page'] = new Element('div', {'id':o.id + 'Page','class':'desktopPage'}).inject(this.el.element);
		if (o.footer) this.el[o.id + 'Footer'] = new Element('div', {'id':o.id + 'Footer','class':'desktopFooter'}).inject(this.el.element);

		if (!isNew || o._container){ if (this.el.element.getParent() == null) this.el.element.inject(o._container); }
		else window.addEvent('domready', function()
		{
			if (!o._container) o._container = $(containerEl ? containerEl : o.container);
			if (!o._container) o._container = document.body;
			if (this.el.element.getParent() == null) this.el.element.inject(o._container);
		});

		return div;
	},

	_createSection:function(sectionName)
	{
		var lname = sectionName.toLowerCase();
		var dock = new MUI.Dock({'id':this.id + sectionName,container:this.el.element});
		this[lname] = dock;

		Object.each(this.options.sections, function(section, idx)
		{
			if (section.name == lname) return;
			if (!section.control) section.control = 'MUI.Dock';
			if (!section.id) section.id = this.id + 'Section' + idx;
			this.el[section.id] = new Element('div', {'id':section.id}).inject(this.el.element);
			section.container = dock.el.element;

			if (!section.partner) section.partner = this.options.partner;
			this.options.sections[idx] = section;
			var content = {};
			Object.each(section, function(val, key)
			{
				if (['loadmethod', 'method', 'url', 'content', 'onloaded'].indexOf(key) > -1)
					content[key] = val;
			});
			section.content = content;
			MUI.create(section.control, section);
		}, bind(this));

	}

});
