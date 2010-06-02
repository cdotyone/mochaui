/*
---

description: The base component for the Meio.Mask plugin.

authors:
 - Fábio Miranda Costa

requires:
 - core/1.2.3: [Class.Extras, Element.Event, Element.Style]
 - more/1.2.3.1: Element.Forms

license: MIT-style license

provides: [Meio.Mask]

...
*/

if (typeof MUI == 'undefined') var MUI = {};

$extend(Element.NativeEvents, {
	'paste': 2, 'input': 2
});
// thanks Jan Kassens
Element.Events.paste = {
	base : (Browser.Engine.presto || (Browser.Engine.gecko && Browser.Engine.version < 19))? 'input': 'paste',
	condition: function(e){
		this.fireEvent('paste', e, 1);
		return false;
	}
};
	
MUI.Mask = new Class({

	Implements: [Options, Events],
	
	eventsToBind: ['focus', 'blur', 'keydown', 'keypress', 'paste'],

	options: {
		selectOnFocus: true,
		autoTab: false

		//onInvalid: $empty,
		//onValid: $empty,
		
		//REVERSE MASK OPTIONS
		//signal: false,
		//setSize: false
	},

	initialize: function(el, options){
		this.element = $(el);
		if (this.element.get('tag') !== 'input' || this.element.get('type') !== 'text') return;
		this.setup(options);
	},
    
	setup: function(options){
		this.setOptions(options);
		if (this.element.retrieve('meiomask')) this.remove();
		this.ignore = false;
		this.maxlength = this.element.get('maxlength');
		this.eventsToBind.each(function(evt){
			this.element.addEvent(evt, this.onMask.bindWithEvent(this, this[evt]));
		}, this);
		this.element.store('meiomask', this).erase('maxlength');
		var elementValue = this.element.get('value');
		if (elementValue !== ''){
			this.element.set('value', elementValue.meiomask(this.constructor, this.options));
		}
		return this;
	},
	
	remove: function(){
		var mask = this.element.retrieve('meiomask');
		if (mask){
			var maxlength = mask.maxlength;
			if (maxlength !== null) this.element.set('maxlength', maxlength);
			mask.eventsToBind.each(function(evt){
				this.element.removeEvent(evt, this[evt]);
			}, mask);
			this.element.eliminate('meiomask');
		}
		return this;
	},
	
	onMask: function(e, func){
		if (this.element.get('readonly')) return true;
		var o = {}, keyCode = (e.type == 'paste') ? null : e.event.keyCode;
		o.range = this.element.getSelectedRange();
		o.isSelection = (o.range.start !== o.range.end);
		// 8 == backspace && 46 == delete && 127 == iphone's delete (i mean backspace)
		o.isDelKey = (keyCode == 46 && !(Browser.Engine.trident && e.event.type == 'keypress'));
		o.isBksKey = (keyCode == 8 || (Browser.Platform.ipod && e.code == 127));
		o.isRemoveKey = (o.isBksKey || o.isDelKey);
		func && func.call(this, e, o);
		return true;
	},

    keydown: function(e, o){
		this.ignore = (MUI.Mask.ignoreKeys[e.code] && !o.isRemoveKey) || e.control || e.meta || e.alt;
		if (this.ignore || o.isRemoveKey){
			var keyRepresentation = MUI.Mask.ignoreKeys[e.code] || '';
			this.fireEvent('valid', [this.element, e.code, keyRepresentation]);
		}
		return (Browser.Platform.ipod || (MUI.Mask.onlyKeyDownRepeat && o.isRemoveKey)) ? this.keypress(e, o) : true;
	},
	
	keypress: function(e, o){
		if (this.options.autoTab){
			if (this.shouldFocusNext()){
				var nextField = this.getNextInput();
				if (nextField){
					nextField.focus();
					if (nextField.select) nextField.select();
				}
			}
		}
		return true;
	},
	
	shouldFocusNext: function(){
		var maxLength = this.options.maxLength;
		return maxLength && this.element.get('value').length >= maxLength;
	},
	
	focus: function(e, o){
		var element = this.element;
		element.store('meiomask:focusvalue', element.get('value'));
	},

	blur: function(e, o){
		var element = this.element;
		if (element.retrieve('meiomask:focusvalue') != element.get('value')){
			element.fireEvent('change');
		}
	},
	
	getCurrentState: function(e, o){
		var _char = String.fromCharCode(e.code),
			elValue = this.element.get('value');
		var start = o.range.start, end = o.range.end;
		if (o.isRemoveKey && !o.isSelection) o.isDelKey ? end++ : start--;
		return {value: elValue.substring(0, start) + (o.isRemoveKey ? '' : _char) + elValue.substring(end),
			_char: _char, start: start, end: end};
	},
	
	setSize: function(){
		if (!this.element.get('size')) this.element.set('size', this.maskArray.length);
	},
	
	isFixedChar: function(_char){
		return !MUI.Mask.matchRules.contains(_char);
	},
	
	mask: function(str){
		return str;
	},

	unmask: function(str){
		return str;
	},
	
	getNextInput: function(){
		var fields = $A(this.element.form.elements), field;
		for (var i = fields.indexOf(this.element) + 1, l = fields.length; i < l; i++){
			field = fields[i];
			if (this.isFocusableField(field)) return $(field);
		}
		return null;
	},
	
	isFocusableField: function(field){
		return (field.offsetWidth > 0 || field.offsetHeight > 0) // is it visible?
			&& field.nodeName != 'FIELDSET';
	}
	
});

MUI.Mask.extend({

	matchRules: '',

	rulesRegex: new RegExp(''),
	
	rules: {},
	
	setRule: function(ruleKey, properties){
		this.setRules({ruleKey: properties});
	},

	setRules: function(rulesObj){
		$extend(this.rules, rulesObj);
		var rulesKeys = [];
		for (rule in rulesObj) rulesKeys.push(rule);
		this.matchRules += rulesKeys.join('');
		this.recompileRulesRegex();
	},

	removeRule: function(rule){
		delete this.rules[rule];
		this.matchRules = this.matchRules.replace(rule, '');
		this.recompileRulesRegex();
	},

	removeRules: function(){
		var rulesToRemove = Array.flatten(arguments);
		for (var i=rulesToRemove.length; i--;) this.removeRule(rulesToRemove[i]);
	},
	
	recompileRulesRegex: function(){
		this.rulesRegex.compile('[' + this.matchRules.escapeRegExp() + ']', 'g');
	},
	
	createMasks: function(type, masks){
		type = type.capitalize();
		for (mask in masks){
			this[type][mask.camelCase().capitalize()] = new Class({
				Extends: this[type],
				options: masks[mask]
			});
		}
	},
	
	// Christoph Pojer's (zilenCe) idea http://cpojer.net/
	// adapted to MeioMask
	upTo: function(number){
		number = '' + number;
		return function(value, index, _char){
			if (value.charAt(index-1) == number[0])
				return (_char <= number[1]);
			return true;
		};
	},
	
	// http://unixpapa.com/js/key.html
	// if only the keydown auto-repeats
	// if you have a better implementation of this detection tell me
	onlyKeyDownRepeat: (Browser.Engine.trident || (Browser.Engine.webkit && Browser.Engine.version >= 525))
	
}).extend(function(){
	var ignoreKeys;
	var desktopIgnoreKeys = {
		8		: 'backspace',
		9		: 'tab',
		13		: 'enter',
		16		: 'shift',
		17		: 'control',
		18		: 'alt',
		27		: 'esc',
		33		: 'page up',
		34		: 'page down',
		35		: 'end',
		36		: 'home',
		37		: 'left',
		38		: 'up',
		39		: 'right',
		40		: 'down',
		45		: 'insert',
		46		: 'delete',
		224		: 'command'
	},
	iphoneIgnoreKeys = {
		10		: 'go',
		127		: 'delete'
	};
	
	if (Browser.Platform.ipod){
		ignoreKeys = iphoneIgnoreKeys;
	} else {
		// f1, f2, f3 ... f12
		for (var i=1; i<=12; i++) desktopIgnoreKeys[111 + i] = 'f' + i;
		ignoreKeys = desktopIgnoreKeys; 
	}
	return {ignoreKeys: ignoreKeys};
}())
.setRules((function(){
	var rules = {
		'z': {regex: /[a-z]/},
		'Z': {regex: /[A-Z]/},
		'a': {regex: /[a-zA-Z]/},
		'*': {regex: /[0-9a-zA-Z]/},
		'@': {regex: /[0-9a-zA-ZçáàãâéèêíìóòõôúùüñÇÁÀÃÂÉÈÊÍÌÓÒÕÔÚÙÜÑ]/}, // 'i' doesnt work here
		'h': {regex: /[0-9]/, check: MUI.Mask.upTo(23)},
		'd': {regex: /[0-9]/, check: MUI.Mask.upTo(31)},
		'm': {regex: /[0-9]/, check: MUI.Mask.upTo(12)}
	};
	for (var i=0; i<=9; i++) rules[i] = {regex: new RegExp('[0-' + i + ']')};
	return rules;
})());

