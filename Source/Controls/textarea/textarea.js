/*
 ---

 name: TextArea

 script: textarea.js

 description: MUI.TextArea - Creates a textarea that can dynamically size itself control.

 copyright: (c) 2011 Contributors in (/AUTHORS.txt).

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

MUI.TextArea = new NamedClass('MUI.TextArea', {

	Implements: [Events, Options],

	options: {
		//id:				null,	// id of the primary element, and id os control that is registered with mocha
		//container:		null,	// the parent control in the document to add the control to
		drawOnInit:			true,	// true to add textbox to container when control is initialized
		cssClass:			'form',	// the primary css tag

		//hasDynamicSize:	false,	// true if this textarea can automatically resize
		//width:			false,	// width of the textarea control
		//height:			false,	// height of the textarea control, ignored if hasDynamicSize is true
		rows:				1,		// number of lines to show, when hasDynamicSize is true this is the minimum # rows

		//valueField:		false,	// defaults to the id on this field
		//formTitleField:	false,	// defaults to the id of this field
		//formData:			false,	// used in conjunction with the above Fields to get/set value in an object

		hasTitle:			true
		//formTitle:		'',		// defaults to the id of this field
		//value:			'',		// current date in text form

		//onValueChanged:	null
	},

	initialize: function(options){
		this.setOptions(options);
		this.el = {};

		// If textarea has no ID, give it one.
		this.id = this.options.id = this.options.id || 'textArea' + (++MUI.idCount);
		MUI.set(this.id, this);

		if (this.options.drawOnInit) this.draw();
	},

	draw: function(container){
		var o = this.options;
		if (!container) container = o.container;

		var isNew = false;
		var fs = o.element && o.element.nodeName == 'FIELDSET' ? o.element : $(o.id + '_field');
		if (!fs){
			isNew = true;
			this.el.element = fs = new Element('fieldset', {'id':o.id + '_field'});
		}
		fs.addClass(o.cssClass).addClass('dynamic').empty();

		// add form label/title
		var lbl = $(o.id + '_label');
		if (o.hasTitle){  // are we supposed to have a title
			var tle = this.getFormTitle();
			lbl = new Element('label', {'id':o.id + '_label'}).inject(fs);
		} else {
			if (lbl){  // title not needed so remove it, if it exists
				lbl.dispose();
				this.el.erase('label');
			}
		}
		if (lbl) this.el.label = lbl.set('text', tle).set('for', o.id);

		// see if we where given an input field instead
		var inp = o.element && o.element.nodeName == 'TEXTAREA' ? o.element : $(o.id);
		if (!inp){  // create textarea field if none given
			inp = new Element('textarea', {'id':o.id,'rows':o.rows,'class':o.cssClass}).inject(fs)
		}
		this.el.textarea = inp.set('rows', o.rows)
				.removeEvents('focus')
				.addEvent('focus', this._focus.bind(this))
				.setStyle('overflow', o.hasDynamicSize ? 'hidden' : 'auto');
		if (o.width) inp.setStyle('width', o.width);
		if (o.height && !o.hasDynamicSize) inp.setStyle('height', o.height);

		// determine value of input field
		var value = o.value;
		if (o.formData) value = MUI.getData(o.formData, (o.valueField ? o.valueField : o.id));	// get value from data if bound to a dataset
		if (!value) value = this.el.textarea.get('value');										// pull value from input field if we don't have one yet
		inp.set('value', value);																// set the value in the input field
		o.value = value;																		// remember the current value, so we can detect changes

		// add to container
		var addToContainer = function(){
			if (typeOf(container) == 'string') container = $(container);
			if (fs.getParent() == null) fs.inject(container);

			var inp = this.el.textarea;
			if (!o.width) o.width = inp.getSize().x;
			if (!o.hasDynamicSize) return;

			// Firefox handles scroll heights differently than all other browsers -- from Amadeus Demarzi
			if (Browser.firefox){
				this._offset = parseInt(inp.getStyle('padding-top'), 10) + parseInt(inp.getStyle('padding-bottom'), 10) + parseInt(inp.getStyle('border-bottom-width'), 10) + parseInt(inp.getStyle('border-top-width'), 10);
				this._padding = 0;
			} else {
				this._offset = parseInt(inp.getStyle('border-bottom-width'), 10) + parseInt(inp.getStyle('border-top-width'), 10);
				this._padding = parseInt(inp.getStyle('padding-top'), 10) + parseInt(inp.getStyle('padding-bottom'), 10);
			}

			// This is the only crossbrowser method to determine scrollheight of a single line in a textarea -- from Amadeus Demarzi
			var backupString = inp.value;
			inp.value = 'M';
			inp.set('rows', 1);
			o._lineHeight = (inp.measure(function(){
				return this.el.textarea.getScrollSize().y;
			}.bind(this))) + this._offset - this._padding;
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

	getFormTitle: function(){
		var o = this.options;
		if (o.formTitle) return o.formTitle;
		if (o.formTitleField) return MUI.getData(o.formData, o.formTitleField);
		if (o.formData) return MUI.getData(o.formData, o.id);
		return o.id;
	},

	focus: function(){
		this.el.textarea.focus = true;
	},

	_keypress: function(e){
		var o = this.options;
		var el = this.el.textarea;

		// check to se if value has changed
		var value = el.get('value');
		if (value != o.value){
			o.value = value;
			this.fireEvent('valueChanged', [value,this]);
		}

		if (e.key == 'backspace' || e.key == 'delete'){
			// shrink on backspace and delete
			var height = el.getSize().y - 15;
			if (height < o._minHeight) height = o._minHeight;
			el.setStyles({'overflow':'hidden','height':height})
					.scrollTo(0, 0);

			// now resize based on content
			this._adjustSize();
		} else this._adjustSize.bind(this).delay(1);  // delayed resize
	},

	_focus: function(){
		if (!this.options.hasDynamicSize) return;
		this.el.textarea.addEvents({
			'keydown': this._keypress.bind(this),
			'keypress': this._keypress.bind(this),
			'blur': this._blur.bind(this),
			'scroll': this._scroll.bind(this)
		});
	},

	_blur: function(){
		if (!this.options.hasDynamicSize) return;
		this.el.textarea.removeEvents({
			'keydown': this._keypress.bind(this),
			'keypress': this._keypress.bind(this),
			'blur': this._blur.bind(this),
			'scroll': this._scroll.bind(this)
		});
	},

	_scroll: function(){
		if (!this.options.hasDynamicSize) return;
		this.el.textarea.setStyle('overflow', 'hidden')
				.scrollTo(0, 0);
	},

	_adjustSize: function(){
		// expand text box based on scroll bar -- from Amadeus Demarzi
		var el = this.el.textarea;
		var height = el.getScrollSize().y;
		var tempHeight = el.getScrollSize().y;
		var cssHeight = tempHeight - this._padding;
		var scrollHeight = tempHeight + this._offset;
		if (scrollHeight != el.offsetHeight) el.setStyle('height', scrollHeight);
	}

});
