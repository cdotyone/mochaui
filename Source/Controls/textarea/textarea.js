/*
 ---

 name: TextArea

 script: textarea.js

 description: MUI - Creates a textarea that can dynamically size itself control.

 copyright: (c) 2010 Contributors in (/AUTHORS.txt).

 license: MIT-style license in (/MIT-LICENSE.txt).

 authors:
 - Chris Doty (http://polaropposite.com/)
 - Amadeus Demarzi (http://enmassellc.com/)

 credits:
 All of the textarea scroll detection and sizing code came from DynamicTextArea by Amadeus Demarzi
 the code is marked as such as best as I could, and any copyrights to those sections of code belong
 to him.

 requires:
 - Core/Element
 - Core/Class
 - Core/Options
 - Core/Events
 - MUI
 - MUI.Core

 provides: [MUI.TextArea]
 ...
 */

MUI.files['{controls}textarea/textarea.js'] = 'loaded';

MUI.TextArea = new NamedClass('MUI.TextArea', {

	Implements: [Events, Options],

	options: {
		id:				'',		// id of the primary element, and id os control that is registered with mocha
		container:		null,	// the parent control in the document to add the control to
		drawOnInit:		true,	// true to add textbox to container when control is initialized
		cssClass:		'form',	// the primary css tag

		hasDynamicSize:	false,	// true if this textarea can automatically resize
		width:			false,	// width of the textarea control
		height:			false,	// height of the textarea control, ignored if hasDynamicSize is true
		rows:			1,		// number of lines to show, when hasDynamicSize is true this is the minimum # rows

		valueField:		false,	// defaults to the id on this field
		formTitleField:	false,	// defaults to the id of this field
		formData:		false,	// used in conjunction with the above Fields to get/set value in an object

		formTitle:		'',		// defaults to the id of this field
		value:			''		// the currently textbox's value

		//onValueChanged:null
	},

	initialize: function(options){
		this.setOptions(options);
		this.el = {};

		// If textarea has no ID, give it one.
		this.id = this.options.id = this.options.id || 'textArea' + (++MUI.idCount);
		MUI.set(this.id, this);

		if (this.options.drawOnInit && this.options.container != null) this.draw();
	},

	getFieldTitle: function(){
		var self = this,o = this.options;

		if (o.formTitleField) return MUI.getData(o.formData, o.formTitleField);
		if (o.formData) return MUI.getData(o.formData, o.id);
		return o.id;
	},

	draw: function(container){
		// todo: need way to create all elements externally 
		// todo: need way to allow other controls know the main element is id+_field and is a fieldset 

		var o = this.options;
		if (!container) container = o.container;

		var isNew = false;
		var fs = o.element ? o.element : $(o.id + '_field');
		if (!fs){
			isNew = true;
			this.el.element = fs = new Element('fieldset', {'id':o.id + '_field',
				'styles':
				{
					'resize':'none',
					'position':'relative',
					'display':'block',
					'overflow':'hidden',
					'height':'auto'
				}
			});
		}
		fs.addClass(o.cssClass).empty();

		var tle = MUI.getData(o.formData, o.formTitleField);
		if (!tle) tle = o.id;
		this.el.label = new Element('label', {'text':tle}).inject(fs);
		var inp = this.el.input = new Element('textarea', {'id':o.id,'rows':o.rows,'class':o.cssClass}).inject(fs).addEvent('focus', this.focus.bind(this)).setStyle('overflow', 'hidden');
		if (o.width) inp.setStyle('width', o.width + 'px');
		if (o.height && !o.hasDynamicSize) inp.setStyle('height', o.height + 'px');

		var value = o.value;
		if (o.valueField) value = MUI.getData(o.formData, o.valueField);
		else if (o.formData) value = MUI.getData(o.formData, o.id);
		inp.set('value', value);
		o._prevValue = value;

		// add to container
		var addToContainer = function(){
			if (typeOf(container) == 'string') container = $(container);
			if (fs.getParent() == null) fs.inject(container);

			if (!o.width) o.width = inp.getSize().x;
			if (!o.hasDynamicSize || isNew) return;

			// Firefox handles scroll heights differently than all other browsers -- from Amadeus Demarzi
			if (Browser.firefox){
				o.offset = parseInt(inp.getStyle('padding-top'), 10) + parseInt(inp.getStyle('padding-bottom'), 10) + parseInt(inp.getStyle('border-bottom-width'), 10) + parseInt(inp.getStyle('border-top-width'), 10);
				o.padding = 0;
			} else {
				o.offset = parseInt(inp.getStyle('border-bottom-width'), 10) + parseInt(inp.getStyle('border-top-width'), 10);
				o.padding = parseInt(inp.getStyle('padding-top'), 10) + parseInt(inp.getStyle('padding-bottom'), 10);
			}

			// This is the only crossbrowser method to determine scrollheight of a single line in a textarea -- from Amadeus Demarzi
			var backupString = inp.value;
			inp.value = 'M';
			inp.set('rows', 1);
			o._lineHeight = (inp.measure(function(){
				return this.getScrollSize().y;
			}).bind(this)) + o.offset - o.padding;
			inp.value = backupString;
			o._minHeight = o._lineHeight * o.rows;
			inp.setStyle('height', o._minHeight);

			// make sure we have proper width
			inp.setStyle('width', o.width);
		}.bind(this);
		if (!isNew || typeOf(container) == 'element') addToContainer();
		else window.addEvent('domready', addToContainer);

		return this;
	},

	keypress: function(e){
		var self = this,o = this.options;

		// check to se if value has changed
		o.value = self.element.get('value');
		if (o.value != o._prevValue){
			o._prevValue = o.value;
			self.fireEvent('valueChanged', [o.value,self]);
		}

		if (e.key == 'backspace' || e.key == 'delete'){
			// shrink on backspace and delete
			var height = self.element.getSize().y - 15;
			if (height < o._minHeight) height = o._minHeight;
			self.element.setStyle('overflow', 'hidden');
			self.element.setStyle('height', height);
			self.element.scrollTo(0, 0);

			// now resize based on content
			self.adjustSize();
		} else self.adjustSize.bind(self).delay(1);  // delayed resize
	},

	focus: function(){
		var self = this;
		if (!self.options.hasDynamicSize) return;
		self.element.addEvents({
			'keydown': self.keypress.bind(self),
			'keypress': self.keypress.bind(self),
			'blur': self.blur.bind(self),
			'scroll': self.scroll.bind(self)
		});
	},

	blur: function(){
		var self = this;
		if (!self.options.hasDynamicSize) return;
		self.element.removeEvents({
			'keydown': self.keypress.bind(self),
			'keypress': self.keypress.bind(self),
			'blur': self.blur.bind(self),
			'scroll': self.scroll.bind(self)
		});
	},

	scroll: function(){
		var self = this;
		if (!self.options.hasDynamicSize) return;
		self.element.setStyle('overflow', 'hidden');
		self.element.scrollTo(0, 0);
	},

	adjustSize: function(){
		var self = this;
		// expand text box based on scroll bar -- from Amadeus Demarzi
		var height = self.element.getScrollSize().y;
		var tempHeight = self.element.getScrollSize().y;
		var cssHeight = tempHeight - self.options.padding;
		var scrollHeight = tempHeight + self.options.offset;
		if (scrollHeight != self.element.offsetHeight) self.element.setStyle('height', scrollHeight);
	}

});
