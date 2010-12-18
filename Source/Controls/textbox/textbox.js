/*
 ---

 name: TextBox

 script: textbox.js

 description: MUI - Creates a maskable textbox control.

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

 provides: [MUI.TextBox]
 ...
 */

MUI.files['{controls}textbox/textbox.js'] = 'loaded';

MUI.TextBox = new Class({

	Implements: [Events, Options],

	options: {
		id:				''			// id of the primary element, and id os control that is registered with mocha
		,container:			null		// the parent control in the document to add the control to
		,drawOnInit:		true		// true to add textbox to container when control is initialized
		,cssClass:			'form'		// the primary css tag
		,type:				'text'		// this is a text field

		,maskType:			'none'		// type of mask to apply  ['Fixed','Regexp','Reverse']
		,maskOptions:		{}			// the field mask

		,valueField:		false		// defaults to the id on this field
		,formTitleField:	false		// defaults to the id of this field
		,formData:			false		// used in conjunction with the above Fields to get/set value in an object

		,formTitle:			''			// defaults to the id of this field
		,value:				''			// the currently textbox's value
	},

	initialize: function(options){
		var self = this;
		self.setOptions(options);
		var o = self.options;

		// make sure this controls has an ID
		var id = o.id;
		if (!id){
			id = 'textbox' + (++MUI.IDCount);
			o.id = id;
		}

		if (o.maskType.capitalize() == 'Password') o.type = 'password';

		// create sub items if available
		if (o.drawOnInit && o.container != null) this.draw();

		MUI.set(id, this);
	},

	checkForMask: function(){
		var self = this;
		var o = self.options;

		if (o.maskType != 'none' && (!MUI.Mask || !MUI.Mask[o.maskType]) && self.element){
			o.maskType = o.maskType.camelCase().capitalize();

			if (o.maskType == 'Password'){
				new MUI.Require({js: ['{controls}textbox/passshark.js'],
					onload: function(){
						var options = Object.clone(o.maskOptions);
						options.maskType = o.maskType.toLowerCase();
						new MUI.PassShark(self.element, options);
					}
				});
			} else {
				new MUI.Require({js: ['{controls}textbox/mask.js'],
					onload: function(){
						new MUI.Require({
							js: ['{controls}textbox/mask.' + o.maskType.split('.')[0].toLowerCase() + '.js'],
							onload: function(){
								var o = self.options;
								var options = Object.clone(o.maskOptions);
								options.maskType = o.maskType.toLowerCase();
								var klass = self.getMaskClassOptions(o.maskType);
								if (!klass) return;
								new klass(options).link(self.element);
							}
						});
					}
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

	getFieldTitle: function(){
		var self = this;
		var o = self.options;

		if (o.formTitleField) return MUI.getData(o.formData, o.formTitleField);
		if (o.formData) return MUI.getData(o.formData, o.id);
		if (o.formTitle) return o.formTitle;
		return o.id;
	},

	fromHTML: function(){
		var self = this;
		var o = self.options;

		var inp = $(o.id);
		if (!inp) return self;
		self.element = inp;

		if (inp.get('type')) o.type = inp.get('type');
		o.value = inp.get('defaultValue');
		if (inp.get('class')) o.cssClass = inp.get('class');

		self.draw();
		return self;
	},

	draw: function(containerEl){
		var self = this;
		var o = self.options;

		var isNew = false;
		var inp = $(o.id);
		if (!inp){
			self._wrapper = new Element('fieldset', {'id':o.id});

			var tle = self.getFieldTitle();
			if (!tle) tle = o.id;
			self._label = new Element('label', {'text':tle}).inject(self._wrapper);

			inp = new Element('input', {'id':o.id,'type':o.type}).inject(self._wrapper);
			isNew = true;
		}
		if (o.cssClass){
			if (self._wrapper) self._wrapper.set('class', o.cssClass);
			inp.set('class', o.cssClass);
		}

		self.element = inp;

		var value = o.value;
		if (o.valueField) value = MUI.getData(o.formData, o.valueField);
		else if (o.formData) value = MUI.getData(o.formData, o.id);
		inp.set('value', value);

		self.checkForMask();
		if (!isNew) return inp;

		window.addEvent('domready', function(){
			// determine parent container object
			if (!o._container && typeof(o.container) == 'string'){
				var instance = MUI.get(o.container);
				if (instance){
					if (instance.el.content){
						instance.el.content.setStyle('padding', '0');
						o._container = instance.el.content;
					}
				}
				if (!o._container) o._container = $(o.container);
			}
			if (!o._container) o._container = $(containerEl ? containerEl : o.container);
			if (!o._container) return;

			self._wrapper.inject(o._container);
		});

		return inp;
	}

});
