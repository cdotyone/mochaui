/*
 ---

 name: Toolbar

 script: toolbar.js

 description: MUI - Creates a toolbar control.

 copyright: (c) 2010 Contributors in (/AUTHORS.txt).

 license: MIT-style license in (/MIT-LICENSE.txt).

 note:
 This documentation is taken directly from the JavaScript source files. It is built using Natural Docs.

 requires:
 - Core/Element
 - Core/Class
 - Core/Options
 - Core/Events
 - MUI
 - MUI.Core

 provides: [MUI.Tabs]
 ...
 */

MUI.files['{controls}toolbar/toolbar.js'] = 'loaded';

MUI.Toolbar = new Class({

	Implements: [Events, Options],

	options: {
		id:				'',				// id of the primary element, and id os control that is registered with mocha
		container:		null,			// the parent control in the document to add the control to
		drawOnInit:		true,			// true to add tree to container when control is initialized
		cssClass:		'divider',		// the primary css tag

		content:		false,			// used to load content
		buttons:		[				// the buttons to add to the toolbar
			/*
			 {
			 name:		'name of button',		// the name of the button
			 id:		'id of button',			// the id of the button
			 cssClass:'icon_application_home',	// css name to add to the button
			 content:{}							// generic MUI.Content.update structure to execute on when onclick isn null or returns true.
			 type:'icon'						// can be:
			 // icon = simple icon button 		(default)
			 // html = html button
			 // image = MUI.ImageButton
			 text:null,							// the text displayed on the button (html and image types only)
			 title:null,						// tool tip text
			 image:null,						// the url to the image that will be displayed (image types only)
			 isDisabled:false					// is the button disabled
			 onClick: function() {				// overrides toolbar function, return true to also fire main toolbar onclick
			 // do something
			 }
			 }
			 */
		]
		//onClick:null					// event: when a button is clicked, default for all buttons , will not fire if button has its own onclick
	},

	initialize: function(options){
		var self = this;
		self.setOptions(options);
		var o = self.options;
		self.el = {};
		self.buttonCount = 0;

		// make sure this controls has an ID
		var id = o.id;
		if (!id){
			id = 'toolbar' + (++MUI.IDCount);
			o.id = id;
		}

		if (o.content) o.content.instance = this;
		MUI.set(id, this);

		if (options.content && options.content.url){
			options.content.loadMethod = 'json';
			options.content.onLoaded = (function(element, options){
				this.options.buttons = MUI.Content.getRecords(options);
				this.draw();
			}).bind(this);
			MUI.Content.update(options.content);
		} else this.draw();
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
		div.set('class', o.cssClass);
		self.el.element = div.store('instance', this);

		self.buttonCount = 0;
		Object.each(o.buttons, this._buildButton, this);

		if (!isNew) return;
		if (o._container) this._addToContainer(o._container, div);
		else window.addEvent('domready', function(){
			if (!o._container){
				o._container = $(containerEl ? containerEl : o.container);
				if (o._container) this._addToContainer(o._container, div);
			}
			if (o.content) MUI.Content.update(o.content);
		}.bind(this));

		return div;
	},

	refresh:function(init){
		var options = this.options;
		if (!init) init = false;
		if (options.content){
			// handle force refresh
			if (!init){
				options.content.records = [];
				if (options.content.persist) MUI.Persist.clear(options.content.url);
			}

			options.content.instance = this;
			options.content.loadMethod = 'json';
			options.content.onLoaded = (function(element, options){
				this.options.buttons = MUI.Content.getRecords(options);
				this.draw();
			}).bind(this);
			MUI.Content.update(options.content);
		}
	},

	addButton: function(button){
		this.options.button.push(button);
		this._buildButton(button);
	},

	_buildButton: function(button){
		var self = this;
		var div=self.el.element;
		self.buttonCount++;
		if (!button.name) button.name = 'button' + self.buttonCount;
		if (!button.id) button.id = o.id + '_' + button.name;
		var css = button.cssClass;
		var where = Browser.ie ? 'top' : 'bottom';
		var onclick = function(e){
			if (e.stop) e.stop();
			var fireClick = true;
			if (this.onClick) fireClick = this.onClick(this, self);
			if (fireClick) self.fireEvent('click', [this,self]);
			if (this.content) MUI.Content.update(this.content);
		}.bind(button);

		if (button.type == 'image' && !button.image) button.type = 'html';
		switch (button.type){
			case 'html':
				if (!css) css = 'button';
				else css = 'button ' + css;
				this.el[button.id] = new Element('input', {id:button.id,'class':css,type:'button','value':button.text,title:button.title}).inject(div, where).addEvent('click', onclick).store('instance', this);
				break;
			case 'image':
				var options = Object.clone(button);
				delete options.type;
				delete options.position;
				delete options.content;
				options._container = div;
				options.container = div.id;
				options.onClick = onclick;
				MUI.create('MUI.ImageButton', options);
				break;
			default:
				if (!css) css = 'icon';
				else css = 'icon ' + css;

				this.el[button.id] = new Element('span', {id:button.id,'class':css,html:'&nbsp;',title:button.title}).inject(div, where).addEvent('click', onclick).store('instance', this);
		}
	},

	_addToContainer: function(container, element){
		var instance = container.retrieve('instance');
		element.inject(container, (instance != null && instance.options.orientation == 'right') ? (Browser.ie ? 'top' : 'bottom') : (Browser.ie ? 'bottom' : 'top'));
	}
});

MUI.Toolbar.targets = [];