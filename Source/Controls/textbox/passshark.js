/*
 ---
 description: PassShark v1.0 - iPhone style password masking using MooTools.

 license: MIT-style license

 authors:
 - Luis Merino

 copyright:
 - Luis Merino
 - QUERIDODESIGN, Switzerland

 dependencies:
 - MooTools-Core
 - MooTools-More > Class.Occlude.js
 - MooTools-More > Class.Binds.js

 ...
 */

MUI.PassShark = new Class({

	Implements: [Options, Events, Class.Occlude],

	Binds: ['start', 'stop', '_check'],

	options: {
		interval: 200,
		duration: 2000,
		replacement: '%u25CF',
		prefix: 'password-'

		//onStageChange: null
	},

	initialize: function(element, options){
		this.origElement = this.element = document.id(element);
		if (this.occlude()) return this.occluded;
		this.setOptions(options);
		this.$E = function(selector){
			return document.getElement(selector);
		};
		this._setup();
	},

	_setup: function(){
		var attributes = this.origElement.getProperties(
				'name',
				'id',
				'class',
				'style',
				'size',
				'maxlength',
				'disabled',
				'tabindex',
				'accesskey',
				'value'
				);
		this.checker = null;
		this.timer = null;
		this._cloakInput(attributes);
	}.protect(),

	_cloakInput: function(params){
		// Display none the original element.
		this.origElement.hide();
		var standardMaxLength = 255;
		var opts = this.options;
		var attributes = (typeof params == 'object') ? Object.merge(params, {
			'type': 'text',
			'name': opts.prefix + (params.name ? params.name : ''),
			'id': opts.prefix + (params.id ? params.id : ''),
			'maxlength': params.maxlength != -1 ? params.maxlength : standardMaxLength,
			'accesskey': params.accesskey != undefined ? params.accesskey : '',
			'tabindex': params.tabindex != '' ? params.tabindex : ''
		}) : {};
		// Adding the new text field.
		var input = new Element('input', attributes).inject(this.origElement, 'after');
		// Adapt label to new field.
		//$pick(this.$E('label[for=' + params.id + ']'), new Element('label')).setProperty('for', opts.prefix + params.id);
		// Disable tabindex.
		this.origElement.setProperty('tabindex', '');
		// Disable accesskey.
		this.origElement.setProperty('accesskey', '');
		// Set events
		this.element = input.store('focus', 0).addEvents({
			'focus': this.start,
			'blur': this.stop
		});
		this._check.delay(opts.interval, this, ['', true]);
	}.protect(),

	start: function(){
		this.element.store('focus', 1);
		clearTimeout(this.checker);
		this.checker = this._check.delay(this.options.interval, this, '');
	},

	stop: function(){
		this.element.store('focus', 0);
		this.checker = clearTimeout(this.checker);
	},

	_onDeletion: function(caret, diff){
		var value = this.origElement.get('value');
		var split = caret;
		if ((typeof caret == 'number') && (this.element.getCaretPosition() < caret)){
			// Need for checking if the key 'backspace' was hit, since it changes the caret position whereas 'delete/supr' does not.
			split = caret - diff;
		}
		else if (typeof caret != 'object'){
			// Apply if 'delete' key was hit and the deletion didn't happen from a textSelection.
			caret = caret + diff;
		}
		var str1 = value.slice(0, caret.start || split);
		var str2 = value.slice(caret.end || caret);
		this.origElement.set('value', str1 + str2);
	}.protect(),

	_setPassword: function(str){
		var tmp = '';
		var add = 0;
		for (var i = 0; i < str.length; i++){
			if (str.charAt(i) == unescape(this.options.replacement)){
				tmp += this.origElement.get('value').charAt(i - add);
			} else {
				tmp += str.charAt(i);
				if (this.element.getCaretPosition() !== str.length){
					add++;
				}
			}

		}
		this.origElement.set('value', tmp);
	}.protect(),

	_convertLastChar: function(){
		if (this.element.get('value') != ''){
			var tmp = '';
			for (var i = 0; i < this.element.get('value').length; i++){
				tmp += unescape(this.options.replacement);
			}
			var caret = this._getCaretRange();
			this.element.set('value', tmp);
			if (this.element.retrieve('focus')) this._correctCaret(caret);
		}
	},

	_check: function(oldValue, initialCall, posCaret){
		var bullets = this.element.get('value');
		// Check if there is an inferior number of characters AND it's not the last char, hence, deletion...
		if (bullets.length < oldValue.length){
			// Calculate difference, since the keyboard can act faster than the interval time set.
			var subtract = oldValue.length - bullets.length;
			this._onDeletion(posCaret, subtract);
		}
		if (oldValue != bullets){
			this._setPassword(bullets);
			if (bullets.length > 1){
				var tmp = '';
				for (i = 0; i < bullets.length - 1; i++){
					tmp += unescape(this.options.replacement);
				}
				tmp += bullets.charAt(bullets.length - 1);
				var caret = this._getCaretRange();
				this.element.set('value', tmp);
				this._correctCaret(caret);
			}
			clearTimeout(this.timer);
			this.timer = this._convertLastChar.delay(this.options.duration, this);
		}
		if (!initialCall){
			clearTimeout(this.checker);
			this.checker = this._check.delay(this.options.interval, this, [this.element.get('value'), false, caret || this._getCaretRange()]);
		}
	},

	_correctCaret: function(caret){
		switch (typeof caret){
			case 'number': return this.element.setCaretPosition(caret);
			case 'object': return this.element.selectRange(caret.start, caret.end);
		}
	}.protect(),

	_getCaretRange: function(){
		// check if caret is equal to 0, therefore a text range has been selected and
		// it should not be placed at the the beginning, but the end of it.
		return (this.element.getSelectedRange().start === this.element.getSelectedRange().end) ? this.element.getCaretPosition() : this.element.getSelectedRange();
	}.protect()

});

