/*
 ---

 name: Toolbar

 script: toolbar.js

 description: MUI.Toolbar - Creates a toolbar control.

 copyright: (c) 2011 Contributors in (/AUTHORS.txt).

 license: MIT-style license in (/MIT-LICENSE.txt).

 requires:
 - Core/Element
 - Core/Class
 - Core/Options
 - Core/Events
 - MUI
 - MUI.Core

 provides: [MUI.Toolbar]
 ...
 */

MUI.Toolbar = new NamedClass('MUI.Toolbar', {

	Implements: [Events, Options],

	options: {
		id:				'',				// id of the primary element, and id os control that is registered with mocha
		container:		null,			// the parent toolbar doc
		drawOnInit:		true,			// true to add tree to container when control is initialized
		cssClass:		false,			// css tag to add to control

		content:		false,			// used to load content
		divider:		true,			// true if this toolbar has a divider
		buttons:		[				// the buttons to add to the toolbar
			/*
			 {
			 name:		'name of button',		// the name of the button
			 id:		'id of button',			// the id of the button
			 cssClass:'icon_application_home',	// css name to add to the button
			 content:{}							// generic MUI.Content.update structure to execute on when onclick is null or returns true.
			 type:'icon'						// can be:
			 // icon = simple icon button 		(default)
			 // html = html button
			 // image = MUI.ImageButton
			 text:null,							// the text displayed on the button (html and image types only)
			 title:null,						// tool tip text
			 image:null,						// the url to the image that will be displayed (image and icon types only)
			 isDisabled:false					// is the button disabled
			 onClick: function() {				// overrides toolbar function, return true to also fire main toolbar onclick
			 // do something
			 }
			 }
			 */
		]
		//onClick:null					// event: when a button is clicked, default for all buttons , will not fire if button has its own onclick
		//onClose:null					// event
	},

	initialize: function(options){
		this.setOptions(options);
		options = this.options;
		this.el = {};

		// If toolbar has no ID, give it one.
		this.id = options.id = options.id || 'toolbar' + (++MUI.idCount);
		MUI.set(this.id, this);

		if (options.content && options.content.url){
			options.content.loadMethod = MUI.getDefaultJsonProvider(options.content.loadMethod);
			options.content.onLoaded = (function(element, options){
				options.buttons = MUI.Content.getRecords(options);
				this.draw();
			}).bind(this);
			MUI.Content.update(options.content);
		} else if(options.drawOnInit) this.draw();
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

		div.addClass('toolbar');
		if (o.cssClass) div.addClass(o.cssClass);
		if (o.divider) div.addClass('divider');

		this.el.element = div.store('instance', this);

		this.buttonCount = 0;
		Object.each(o.buttons, this._buildButton, this);

		// add to container
		var addToContainer = function(){
			if (typeOf(container) == 'string') container = $(container);
			if (div.getParent() == null) div.inject(container);
		}.bind(this);
		if (!isNew || typeOf(container) == 'element') addToContainer();
		else window.addEvent('domready', addToContainer);

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
			options.content.loadMethod = MUI.getDefaultJsonProvider(options.content.loadMethod);
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

	close: function(){
		var div = this.el.element;
		delete this.el.element;
		Object.each(this.el, function(val){
			val.destroy();
		});
		div.destroy();

		MUI.erase(this.options.id);
		this.fireEvent('close', [this]);
		return this;
	},

	_buildButton: function(button){
		var self = this;
		var div = self.el.element;
		self.buttonCount++;
		if (!button.name) button.name = 'button' + self.buttonCount;
		if (!button.id) button.id = this.options.id + '_' + button.name;
		var css = button.cssClass;
		var where = Browser.ie ? 'top' : 'bottom';
		var onclick = function(e){
			if (e.stop) e.stop();
			var fireClick = true;
			if (this.onClick) fireClick = this.onClick(this, self);
			if (fireClick) self.fireEvent('click', [this,self]);
		}.bind(button);

		if (button.type == 'image' && !button.image) button.type = 'html';
		switch (button.type){
			case 'html':
				if (!css) css = 'button';
				else css = 'button ' + css;
				this.el[button.id] = new Element('input', {id:button.id,'class':css,type:'button','value':button.text,title:button.title}).inject(div, where).addEvent('click', onclick).store('instance', this);
				break;
			case 'image':
				this.el[button.id] = new Element('span', {id:button.id}).store('instance', this);
				var options = Object.clone(button);
				options=Object.merge(options,{
					container:div.id,
					onClick:onclick,
					control:'MUI.ImageButton',
					element:this.el[button.id]
				});
				delete options.type;
				delete options.position;
				delete options.content;
				MUI.create(options);
				break;
			default:
				if (!css) css = 'icon';
				else css = 'icon ' + css;
				this.el[button.id] = new Element('span', {id:button.id,'class':css,html:'&nbsp;',title:button.title}).inject(div, where).addEvent('click', onclick).store('instance', this);
				if (button.image) this.el[button.id].setStyle('backgroundImage', "url('" + MUI.replacePaths(button.image) + "')");
		}
	}
});

MUI.Toolbar.targets = [];