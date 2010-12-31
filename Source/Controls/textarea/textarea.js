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
		// handle options
		this.setOptions(options);
		var o = this.options;

		// make sure this controls has an ID
		var id = o.id;
		if (!id){
			id = 'textbox' + (++MUI.IDCount);
			o.id = id;
		}

		// create control if we have a target container
		if (o.drawOnInit && o.container != null) this.draw();

		MUI.set(id, this);
	},

	getFieldTitle: function(){
		var self = this,o = this.options;

		if (o.formTitleField) return MUI.getData(o.formData, o.formTitleField);
		if (o.formData) return MUI.getData(o.formData, o.id);
		return o.id;
	},

	draw: function(){
		var self = this,o = this.options;

		var isNew = false;
		var inp = $(o.id);
		if (!inp){
			self._wrapper = new Element('fieldset', {'id':o.id + '_field',
				'styles':
				{
					'resize':'none',
					'position':'relative',
					'display':'block',
					'overflow':'hidden',
					'height':'auto'
				}
			});

			var tle = MUI.getData(o.formData, o.formTitleField);
			if (!tle) tle = o.id;
			self._label = new Element('label', {'text':tle}).inject(self._wrapper);

			inp = new Element('textarea', {'id':o.id,'rows':o.rows}).inject(self._wrapper);
			if (o.width) inp.setStyle('width', o.width + 'px');
			if (o.height && !o.hasDynamicSize) inp.setStyle('height', o.height + 'px');
			isNew = true;
		}
		if (o.cssClass){
			if (self._wrapper) self._wrapper.set('class', o.cssClass);
			inp.set('class', o.cssClass);
		}

		self.element = inp;
		inp.addEvent('focus', self.focus.bind(self));

		var value = o.value;
		if (o.valueField) value = MUI.getData(o.formData, o.valueField);
		else if (o.formData) value = MUI.getData(o.formData, o.id);
		inp.set('value', value);
		o._prevValue = value;

		if (!isNew) return inp;

		window.addEvent('domready', function(){
			// determine parent container object
			if(!o._container && typeof(o.container) == 'string') {
				var instance = MUI.get(o.container);
				if(instance) {
					if(instance.el.content) {
						instance.el.content.setStyle('padding','0');
						o._container = instance.el.content;
					}
				}
				if(!o._container) o._container=$(o.container);
			}
			if(!o._container) o._container=$(containerEl ? containerEl : o.container);
			if(!o._container) return;
			self._wrapper.inject(o._container);

			if (!o.width) o.width = inp.getSize().x;
			if (!o.hasDynamicSize) return;
			inp.setStyle('overflow', 'hidden');

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
			})) + o.offset - o.padding;
			inp.value = backupString;
			o._minHeight = o._lineHeight * o.rows;
			inp.setStyle('height', o._minHeight);

			// make sure we have proper width
			inp.setStyle('width', o.width);
		});

		return inp;
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
