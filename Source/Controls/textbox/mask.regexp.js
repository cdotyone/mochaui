/*
 ---

 name: Mask.Regexp

 description: A mask that is defined by a regular expression.

 authors:
 - Fábio Miranda Costa

 requires:
 - MUI.Mask

 license: MIT-style license

 provides: [MUI.Mask.Regexp]

 ...
 */

MUI.Mask.Regexp = new Class({

	Extends : MUI.Mask,

	options: {
		regex: null
	},

	initialize : function(element, options){
		this.parent(element, options);
		this.regex = new RegExp(this.options.regex);
	},

	keypress: function(e, o){
		if (this.ignore) return true;
		e.preventDefault();

		var state = this.getCurrentState(e, o);
		var args = [this.element, state._char, e.code];

		if (!this.regex.test(state.value)){
			this.fireEvent('invalid', args);
		} else {
			this.element.set('value', state.value).setCaretPosition(state.start + (o.isRemoveKey ? 0 : 1));
			this.fireEvent('valid', args);
		}

		return true;
	},

	paste: function(){
		var masked = this.applyMask(this.element.get('value'), true);
		this.element.set('value', masked.value).setCaretPosition(masked.index);
	},

	applyMask: function(str, fireEvent){
		var oldValue = '', curValue;
		for (var i = 1; i <= str.length; i++){
			curValue = str.substring(0, i);
			if (!this.regex.test(curValue)){
				if (fireEvent) this.fireEvent('invalid', [this.element, str.charAt(i), str.charCodeAt(i)]);
				break;
			}
			oldValue = curValue;
		}
		return {value: oldValue, index: i};
	},

	mask: function(str){
		return this.applyMask(str).value;
	}

});

MUI.Mask.createMasks('Regexp', {
	'Ip'		: {regex: /^(\d{0,3}\.){0,3}(\d{0,3})?$/},
	'Email'		: {regex: /^[\w.!#$%&'*+=?~^_`{|}\/-]*@?[.\w-]*$/}
});
