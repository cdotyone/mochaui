/*
 ---

 name: ImageButton

 script: imagebutton.js

 description: MUI - Creates a button with an image on it.

 copyright: (c) 2010 Contributors in (/AUTHORS.txt).

 license: MIT-style license in (/MIT-LICENSE.txt).

 note:
 This documentation is taken directly from the javascript source files. It is built using Natural Docs.

 requires:
 - Core/Element
 - Core/Class
 - Core/Options
 - Core/Events
 - MUI
 - MUI.Core

 provides: [MUI.ImageButton]

 ...
 */

MUI.files['{controls}imageButton/imageButton.js'] = 'loaded';

MUI.ImageButton = new Class({

	Implements: [Events, Options],

	options: {
		id:				'',			// id of the primary element, and id os control that is registered with mocha
		container:		null,		// the parent control in the document to add the control to
		section:		false,		// name of section in panel/window to add this control
		drawOnInit:		true,		// true to add tree to container when control is initialized
		cssClass:		'imgButton',// the primary css tag

		text:			null,		// the text displayed on the button
		title:			null,		// tool tip text
		image:			null,		// the url to the image that will be displayed
		isDisabled:		false		// is the button disabled

		//onClick:		null        // event: called when button is clicked
	},

	initialize: function(options){
		this.setOptions(options);
		this.el = {};

		// make sure this controls has an ID
		var id = this.options.id;
		if (!id){
			id = 'imageButton' + (++MUI.IDCount);
			this.options.id = id;
		}

		if (this.options.drawOnInit) this.draw();

		MUI.set(id, this);
	},

	// <span class="imgButton"><a class="imgButton"><span><img></span><span>Text</span></a></span>
	draw: function(){
		var self = this;
		var o = self.options;

		var isNew = true;
		var div = self.el.element;
		if (div == null) div = new Element('span', {'class':o.cssClass,'id':o.id});
		else {
			div.empty();
			isNew = false;
		}

		div.setStyle('opacity', o.isDisabled ? '0.25' : '1.0');

		var a = new Element('a', {id:o.id + '_click','class':o.cssClass,'title':o.title}).inject(div);
		self.el[a.id] = a;

		div.removeEvents('click');
		div.addEvent('click', function(){
			self.fireEvent("click", self)
		});

		if (o.image){
			var tle = o.title;
			if (!tle) tle = o.text;
			var si = new Element('span', {id:o.id + '_imageWrapper'}).inject(a);
			var img = new Element('img', {id:o.id + '_image','src':MUI.replacePaths(o.image),'alt':tle}).inject(si);
			self.el[si.id] = si;
			self.el[img.id] = img;
		}
		if (o.text){
			a.appendChild(new Element('span', {'text':o.text,'class':'t'}));
		}

		self.el.element = div;

		if (!isNew) return self;

		if (o._container) this._addToContainer(o._container, div);
		else window.addEvent('domready', function(){
			var instance = MUI.get(o.container);
			if (!o._container && typeof(o.container) == 'string'){
				if (instance && !o._container && instance.el.content) o._container = instance.el.content;
				if (!o._container) o._container = $(o.container);
			}
			if (o._container) this._addToContainer(o._container, div);
		}.bind(this));

		return self;
	},

	setDisabled: function(disabled){
		this.options.isDisabled = disabled;
		this.draw();
		return disabled;
	},

	_addToContainer: function(container, element){
		var instance = container.retrieve('instance');
		element.inject(container, instance != null && instance.options.orientation == 'right' ? 'bottom' : 'top');
	}

});
