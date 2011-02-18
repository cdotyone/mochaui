/*
 ---

 name: ImageButton

 script: imagebutton.js

 description: MUI.ImageButton - Creates a button with an image on it.

 copyright: (c) 2011 Contributors in (/AUTHORS.txt).

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

MUI.ImageButton = new NamedClass('MUI.ImageButton', {

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

		// If ImageButton has no ID, give it one.
		this.id = this.options.id = this.options.id || 'imgButton' + (++MUI.idCount);
		MUI.set(this.id, this);

		if (this.options.drawOnInit) this.draw();
	},

	// <span class="imgButton"><a class="imgButton"><span><img></span><span>Text</span></a></span>
	draw: function(container){
		var o = this.options;
		if (!container) container = o.container;

		// determine element for this control
		var isNew = false;
		var div = o.element ? o.element : $(o.id);
		if (!div){
			div = new Element('span', {'id': o.id});
			isNew = true;
		}
		div.addClass(o.cssClass)
			.empty()
			.setStyle('opacity', o.isDisabled ? '0.25' : '1.0');

		var a = new Element('a', {id:o.id + '_click','class':o.cssClass,'title':o.title}).inject(div);
		this.el[a.id] = a;

		div.removeEvents('click').addEvent('click', function(){
			this.fireEvent("click", this)
		}.bind(this));

		if (o.image){
			var tle = o.title;
			if (!tle) tle = o.text;
			var si = new Element('span', {id:o.id + '_imageWrapper'}).inject(a);
			var img = new Element('img', {id:o.id + '_image','src':MUI.replacePaths(o.image),'alt':tle}).inject(si);
			this.el[si.id] = si;
			this.el[img.id] = img;
		}
		if (o.text){
			a.appendChild(new Element('span', {'text':o.text,'class':'t'}));
		}

		this.el.element = div;

		// add to container
		var addToContainer = function(){
			if (typeOf(container) == 'string') container = $(container);
			var instance = container.retrieve('instance');
			if (div.getParent() == null) div.inject(container, instance != null && instance.options.orientation == 'right' ? 'bottom' : 'top');

		}.bind(this);
		if (!isNew || typeOf(container) == 'element') addToContainer();
		else window.addEvent('domready', addToContainer);

		return this;
	},

	setDisabled: function(disabled){
		this.options.isDisabled = disabled;
		this.draw();
		return disabled;
	}
});
