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

MUI.files[MUI.path.muiplugins + 'TextBox/TextBox.js'] = 'loaded';

MUI.TextBox = new Class({

	Implements: [Events, Options],

	options: {
		id:			''			  // id of the primary element, and id os control that is registered with mocha
		,container:	 null			// the parent control in the document to add the control to
		,createOnInit:  true			// true to add textbox to container when control is initialized
		,cssClass:	  'form'		  // the primary css tag
		,type:		  'text'		  // this is a text field

		,maskType:	  'none'		  // type of mask to apply  ['Fixed','Regexp','Reverse']
		,maskOptions:   {}			  // the field mask

		,valueField:	false		   // defaults to the id on this field
		,formTitleField:false		   // defaults to the id of this field
		,formData:	  false		   // used in conjunction with the above Fields to get/set value in an object

		,formTitle:	 ''			  // defaults to the id of this field
		,value:		 ''			  // the currently textbox's value
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
		if (o.createOnInit && o.container != null) this.toDOM();
		else {
			window.addEvent('domready', function(){
				var el = $(id);
				if (el != null){
					self.fromHTML();
					self.checkForMask();
				}
			});
		}

		MUI.set(id, this);
	},

	checkForMask: function(){
		var self = this;
		var o = self.options;

		if (o.maskType != 'none' && (!MUI.Mask || !MUI.Mask[o.maskType]) && self.element){
			o.maskType = o.maskType.camelCase().capitalize();

			if (o.maskType == 'Password'){
				new MUI.Require({js: ['PassShark.js'],
					onload: function(){
						var options = $H({});
						options.extend(o.maskOptions);
						options.maskType = o.maskType.toLowerCase();
						new MUI.PassShark(self.element, options);
					}
				});
			} else {
				new MUI.Require({js: ['Mask.js'],
					onload: function(){
						new MUI.Require({
							js: ['Mask.' + o.maskType.split('.')[0] + '.js'],
							onload: function(){
								var o = self.options;
								var options = $H({});
								options.extend(o.maskOptions);
								options.maskType = o.maskType.toLowerCase();
								var klass = self.getMaskClassOptions(o.maskType);
								if (!klass) return;
								new klass(self.element, options);
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

	_getData: function(item, property){
		if (!item || !property) return '';
		if (item[property] == null) return '';
		return item[property];
	},

	getFieldTitle: function(){
		var self = this;
		var o = self.options;

		if (o.formTitleField) return self._getData(o.formData, o.formTitleField);
		if (o.formData) return self._getData(o.formData, o.id);
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

		self.toDOM();
		return self;
	},

	toDOM: function(containerEl){
		var self = this;
		var o = self.options;

		var isNew = false;
		var inp = $(o.id);
		if (!inp){
			self._wrapper = new Element('fieldset', {'id':o.id});

			var tle = self._getData(o.formData, o.formTitleField);
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
		if (o.valueField) value = self._getData(o.formData, o.valueField);
		else if (o.formData) value = self._getData(o.formData, o.id);
		inp.set('value', value);

		self.checkForMask();
		if (!isNew) return inp;

		window.addEvent('domready', function(){
			var container = $(containerEl ? containerEl : o.container);
			self._wrapper.inject(container);
		});

		return inp;
	}

});
