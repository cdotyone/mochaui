/*
 ---

 name: TextBox

 script: textbox.js

 description: MUI.TextBox - Creates a maskable textbox control.

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

 provides: [MUI.TextBox]
 ...
 */

MUI.TextBox = new NamedClass('MUI.TextBox', {

	Implements: [Events, Options],

	options: {
		//id:				'',			// id of the primary element, and id os control that is registered with mocha
		//container:		null,		// the parent control in the document to add the control to
		//clearContainer:	false,		// should the control clear its parent container before it appends itself
		drawOnInit:			true,		// true to add textbox to container when control is initialized
		cssClass:			'form',		// the primary css tag
		type:				'text',		// this is a text field

		maskType:			'none',		// type of mask to apply  ['Fixed','Regexp','Reverse']
		maskOptions:		{},			// the field mask

		//valueField:		false,		// defaults to the id on this field
		//formTitleField:	false,		// defaults to the id of this field
		//formData:			false,		// used in conjunction with the above Fields to get/set value in an object

		hasTitle:			true
		//formTitle:		'',		// defaults to the id of this field
		//value:			'',		// current date in text form
	},

	initialize: function(options){
		this.setOptions(options);
		options = this.options;
		this.el = {};

		// If textbox has no ID, give it one.
		this.id = options.id = options.id || 'textBox' + (++MUI.idCount);
		MUI.set(this.id, this);

		if (options.maskType.capitalize() == 'Password') options.type = 'password';

		if (options.drawOnInit) this.draw();
	},

	draw: function(container){
		var o = this.options;
		if (!container) container = o.container;

		// look for a fieldset that contains the input field
		var isNew = false;
		var fs = o.element && o.element.nodeName == 'FIELDSET' ? o.element : $(o.id + '_field');
		if (!fs){  // create it, if it does not already exist
			fs = new Element('fieldset', {'id':o.id + '_field'});
			isNew = true;
		}
		this.el.element = fs.addClass(o.cssClass);

		// add form label/title
		var lbl = $(o.id + '_label');
		var tle = '';
		if (o.hasTitle){  // are we supposed to have a title
			tle = this.getFormTitle();
			lbl = new Element('label', {'id':o.id + '_label'}).inject(fs);
		} else {
			if (lbl){  // title not needed so remove it, if it exists
				lbl.dispose();
				this.el.erase('label');
			}
		}
		if (lbl) this.el.label = lbl.set('text', tle).set('for', o.id);

		// see if we where given an input field instead
		var inp = o.element && o.element.nodeName == 'INPUT' ? o.element : $(o.id);
		if (!inp){  // create input field if none given
			inp = new Element('input', {'type':'input','id':o.id}).inject(fs);
		}
		this.el.input = inp.set('maxlength', 10).set('type', o.type).setStyle('width', o.width).set('class', o.cssClass);

		// determine value of input field
		var value = o.value;
		if (o.formData) value = MUI.getData(o.formData, (o.valueField ? o.valueField : o.id));	// get value from data if bound to a dataset
		if (!value) value = this.el.input.get('value');											// pull value from input field if we don't have one yet
		inp.set('value', value);																// set the value in the input field
		o.value = value;																		// remember the current value, so we can detect changes

		// add to container
		var addToContainer = function(){
			if (typeOf(container) == 'string') container = $(container);
			if (this.el.element.getParent() == null){
				if (o.clearContainer) container.empty();
				this.el.element.inject(container);
			}

			this.checkForMask();
			return this;
		}.bind(this);
		if (!isNew || typeOf(container) == 'element') return addToContainer();
		else window.addEvent('domready', addToContainer);

		return this;
	},

	checkForMask: function(){
		var o = this.options;

		if (o.maskType != 'none' && (!MUI.Mask || !MUI.Mask[o.maskType]) && this.el.input){
			o.maskType = o.maskType.camelCase().capitalize();

			if (o.maskType == 'Password'){
				new MUI.Require({js: ['{controls}textbox/passshark.js'],
					onload: function(){
						var options = Object.clone(o.maskOptions);
						options.maskType = o.maskType.toLowerCase();
						new MUI.PassShark(this.el.input, options);
					}.bind(this)
				});
			} else {
				new MUI.Require({js: ['{controls}textbox/mask.js'],
					onload: function(){
						new MUI.Require({
							js: ['{controls}textbox/mask.' + o.maskType.split('.')[0].toLowerCase() + '.js'],
							onload: function(){
								var o = this.options;
								var options = Object.clone(o.maskOptions);
								options.maskType = o.maskType.toLowerCase();
								var klass = this.getMaskClassOptions(o.maskType);
								if (!klass) return;
								new klass(options).link(this.el.input);
							}.bind(this)
						});
					}.bind(this)
				});
			}
		}
	},

	getMaskClassOptions: function(maskType){
		var classNames = [];
		if (maskType) classNames = maskType.split('.');
		else return false;
		var name = classNames[0].camelCase().capitalize();
		return (classNames[1] ? MUI.Mask[name][classNames[1].camelCase().capitalize()] : MUI.Mask[name]);
	},

	getFormTitle: function(){
		var o = this.options;
		if (o.formTitle) return o.formTitle;
		if (o.formTitleField) return MUI.getData(o.formData, o.formTitleField);
		if (o.formData) return MUI.getData(o.formData, o.id);
		return o.id;
	}

});
