/*
---

description: A mask used for currency and decimal numbers.

authors:
 - Fábio Miranda Costa

requires:
 - Meio.Mask

license: MIT-style license

provides: [Meio.Mask.Reverse]

...
*/

MUI.Mask.Reverse = new Class({

	Extends: MUI.Mask,

	options: {
		autoSetSize: false,
		autoEmpty: false,
		alignText: true,
		symbol: '',
		precision: 2,
		decimal: ',',
		thousands: '.',
		maxLength: 18
	},

	initialize: function(element, options){
		this.parent(element, options);
		var escapedDecimalChar = this.options.decimal.escapeRegExp(),
			thousandsChar = this.options.thousands,
			escapedThousandsChars = thousandsChar.escapeRegExp();
		if (this.options.alignText) this.element.setStyle('text-align', 'right');
		this.maxlength = this.maxlength || this.options.maxLength;
		this.thousandsRegex = /(\d+)(\d{3})/;
		this.removeLeadingZerosRegex = /^0+(.*)$/;
		this.decimalNumberRegex = /^\d$/;
		this.thousandsReplaceStr = '$1' + thousandsChar + '$2';
		this.thousandsReplaceRegex = new RegExp(escapedThousandsChars, 'g');
		this.cleanupRegex = new RegExp('[' + escapedThousandsChars + escapedDecimalChar + ']', 'g');
		var elementValue = this.element.get('value');
		if (elementValue === '' && !this.options.autoEmpty){
			this.element.set('value', this.mask(elementValue));
		}
	},

	focus: function(e, o){
		var element = this.element,
		elValue = element.get('value'),
		symbol = this.options.symbol;
		if (this.options.autoEmpty){
			if (elValue === '') element.set('value', (elValue = this.mask(elValue)));
		} else {
			element.set('value', (elValue = this.getValue(elValue, true)));
		}
		if (this.options.selectOnFocus) element.selectRange(symbol.length, elValue.length);
		this.parent(e, o);
	},

	blur: function(e, o){
		this.parent(e, o);
		var element = this.element;
		var value = this.getValue(element.get('value'));
		if (this.options.autoEmpty && this.mask(value) == this.mask()) value = '';
		element.set('value', value);
	},

	keypress: function(e, o){
		if (this.ignore) return true;
		e.preventDefault();
		
		var state = this.getCurrentState(e, o);
		var elementValue = state.value;
		
		if (!this.testEvents(elementValue, state._char, e.code, o.isRemoveKey)) return true;
		elementValue = this.forceMask(elementValue, true);
		this.element.set('value', elementValue).setCaretPosition(elementValue.length);
		
		return this.parent();
	},

	testEvents: function(elementValue, _char, code, isRemoveKey){
		var args = [this.element, code, _char];
		if (!isRemoveKey){
			var elementValueLength = this.getValue(elementValue, false).length;
			if (!(this.decimalNumberRegex).test(_char) || elementValueLength > this.maxlength){
				this.fireEvent('invalid', args);
				return false;
			}
			this.fireEvent('valid', args);
		}
		return true;
	},

	paste: function(){
		var element = this.element;
		elValue = element.get('value');
		element.set('value', (elValue = this.forceMask(elValue, true))).setCaretPosition(elValue.length);
		return true;
	},

	forceMask: function(str, withSymbol){
		str = this.cleanup(str);
		var precision = this.options.precision;
		var zeros = precision + 1 - str.length;
		if (zeros > 0) str = this.zeroize(str, zeros);
		if (precision){
			var decimalIndex = str.length - precision;
			str = str.substring(0, decimalIndex) + this.options.decimal + str.substring(decimalIndex);
		}
		return this.getValue(this.maskThousands(str), withSymbol);
	},

	cleanup: function(str){
		return this.getValue(str.replace(this.cleanupRegex, '')).replace(this.removeLeadingZerosRegex, '$1');
	},

	mask: function(str, withSymbol){
		str = this.unmask(str || '0').replace('.', this.options.decimal);
		return this.getValue(this.maskThousands(str), withSymbol);
	},

	unmask: function(str){
		return this.toNumber(this.getValue(str));
	},

	toNumber: function(str){
		if (!isFinite(str)){
			var thousandsChar = this.options.thousands,
			decimalChar = this.options.decimal;
			if (thousandsChar) str = str.replace(this.thousandsReplaceRegex, '');
			if (decimalChar) str = str.replace(decimalChar, '.');
		}
		return str.toFloat().toFixed(this.options.precision);
	},

	getValue: function(str, withSymbol){
		var symbol = this.options.symbol;
		return (str.substring(0, symbol.length) === symbol) ?
			withSymbol ? str : str.substring(symbol.length) :
			withSymbol ? symbol + str : str;
	},

	maskThousands: function(str){
		if (this.options.thousands){
			while (this.thousandsRegex.test(str)) str = str.replace(this.thousandsRegex, this.thousandsReplaceStr);
		}
		return str;
	},

	zeroize: function(str, zeros){
		while (zeros--)  str = '0' + str;
		return str;
	},

	shouldFocusNext: function(){
		return this.getValue(this.element.get('value'), false).length >= this.options.maxLength;
	}
});

MUI.Mask.createMasks('Reverse', {
	'Integer'		: {precision: 0, maxLength: 18},
	'Decimal'		: { },
	'DecimalUs'		: {thousands: ',', decimal: '.'},
	'Reais'			: {symbol: 'R$ ' },
	'Dollar'		: {symbol: 'US$ ', thousands: ',', decimal: '.'}
});
