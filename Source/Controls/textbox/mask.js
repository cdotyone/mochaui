/*
 ---

 name: Mask

 description: The base component for the MUI.Mask plugin.

 authors:
 - Fábio Miranda Costa

 requires:
 - Core/Class.Extras
 - Core/Element.Event
 - Core/Element.Style
 - More/Element.Forms

 license: MIT-style license

 provides: [MUI.Mask]

 ...
 */

// credits to Jan Kassens
Object.append(Element.NativeEvents, {
	'paste': 2, 'input': 2
});
Element.Events.paste = {
	base : (Browser.opera || (Browser.firefox && Browser.version < 4)) ? 'input' : 'paste',
	condition: function(e){
		this.fireEvent('paste', e, 1);
		return false;
	}
};

MUI.Mask = new Class({

	Implements: [Options, Events],

	options: {
		selectOnFocus: true,
		autoTab: false

		//onInvalid: null,
		//onValid: null,

		//REVERSE MASK OPTIONS
		//autoSetSize: false,
		//autoEmpty: false,
		//alignText: true,
		//symbol: '',
		//precision: 2,
		//decimal: ',',
		//thousands: '.',
		//maxLength: 18

		//REPEAT MASK OPTIONS
		//mask: '',
		//maxLength: 0 // 0 for infinite

		//REGEXP MASK OPTIONS
		//regex: null
	},

	initialize: function(options){
		this.setOptions(options);
		this.ignore = false;
		this.bound = {'focus': 0, 'blur': 0, 'keydown': 0, 'keypress': 0, 'paste': 0};
	},

	link: function(element){
		element = $(element);
		if (element.get('tag') != 'input' || element.get('type') != 'text') return;
		if (this.element) this.unlink();
		this.element = element;
		return this.attach();
	},

	unlink: function(){
		return this.detach();
	},

	attach: function(){
		var self = this;
		if (this.maxlength == null) this.maxlength = this.element.get('maxLength');
		this.element.removeAttribute('maxLength');
		for (var evt in this.bound){
			this.bound[evt] = (function(onmask, func){
				return function(e){
					return onmask.apply(self, [e,func]);
				}
			})(this.onMask, this[evt]);
			this.element.addEvent(evt, this.bound[evt]);
		}
		var elementValue = this.element.get('value');
		if (elementValue != '') this.element.set('value', this.mask(elementValue));
		return this;
	},

	detach: function(){
		var maxlength = this.maxlength;
		if (maxlength != null) this.element.set('maxlength', maxlength);
		for (var evt in this.bound){
			this.element.removeEvent(evt, this.bound[evt]);
			this.bound[evt] = 0;
		}
		this.element = null;
		return this;
	},

	onMask: function(e, func){
		if (this.element.get('readonly')) return true;
		var o = {}, event = e.event, keyCode = (e.type == 'paste') ? null : event.keyCode;
		o.range = this.element.getSelectedRange();
		o.isSelection = (o.range.start !== o.range.end);
		// 8 == backspace && 46 == delete && 127 == iphone's delete
		o.isDelKey = (keyCode == 46 && (event.type != 'keypress' || ((Browser.firefox || Browser.opera) && !event.which)));
		o.isBksKey = (keyCode == 8 || (Browser.Platform.ios && e.code == 127));
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
		return (Browser.Platform.ios || (MUI.Mask.onlyKeyDownRepeat && o.isRemoveKey)) ? this.keypress(e, o) : true;
	},

	keypress: function(){
		if (this.options.autoTab && this.shouldFocusNext()){
			var nextField = this.getNextInput();
			if (nextField){
				nextField.focus();
				if (nextField.select) nextField.select();
			}
		}
		return true;
	},

	focus: function(){
		var element = this.element;
		element.store('meiomask:focusvalue', element.get('value'));
	},

	blur: function(e){
		var element = this.element;
		if (e && element.retrieve('meiomask:focusvalue') != element.get('value')){
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

	shouldFocusNext: function(){
		var maxLength = this.options.maxLength;
		return maxLength && this.element.get('value').length >= maxLength;
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
	},

	isFixedChar: function(_char){
		return !MUI.Mask.matchRules.contains(_char);
	},

	mask: function(str){
		return str;
	},

	unmask: function(str){
		return str;
	}

});


Object.append(MUI.Mask,
		Object.append(MUI.Mask, {

			matchRules: '',

			rulesRegex: new RegExp(''),

			rules: {},

			setRule: function(ruleKey, properties){
				this.setRules({ruleKey: properties});
			},

			setRules: function(rulesObj){
				Object.append(this.rules, rulesObj);
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
				for (var i = rulesToRemove.length; i--;) this.removeRule(rulesToRemove[i]);
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

			// credits to Christoph Pojer's (cpojer) http://cpojer.net/
			upTo: function(number){
				number = '' + number;
				return function(value, index, _char){
					if (value.charAt(index - 1) == number[0])
						return (_char <= number[1]);
					return true;
				};
			},

			// http://unixpapa.com/js/key.html
			// if only the keydown auto-repeats
			// if you have a better implementation of this detection tell me
			onlyKeyDownRepeat: (Browser.ie || (Browser.webkit && Browser.version >= 4))

		})
		, function(){
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

	if (Browser.Platform.ios){
		ignoreKeys = iphoneIgnoreKeys;
	} else {
		// f1, f2, f3 ... f12
		for (var i = 1; i <= 12; i++) desktopIgnoreKeys[111 + i] = 'f' + i;
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
		'@': {regex: /[0-9a-zA-ZçáàãâéèêíìóòõôúùüñÇÁÀÃÂÉÈÊÍÌÓÒÕÔÚÙÜÑ]/}, // 'i' regex modifier doesnt work well with unicode chars
		'h': {regex: /[0-9]/, check: MUI.Mask.upTo(23)},
		'd': {regex: /[0-9]/, check: MUI.Mask.upTo(31)},
		'm': {regex: /[0-9]/, check: MUI.Mask.upTo(12)}
	};
	for (var i = 0; i <= 9; i++) rules[i] = {regex: new RegExp('[0-' + i + ']')};
	return rules;
})());

