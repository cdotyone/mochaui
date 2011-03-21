/*
 ---

 name: StepperIterator

 script: stepper.iterator.js

 description: MUI - Iterator used by MUI.Stepper.

 copyright: (c) 2011 André Fiedler <kontakt@visualdrugs.net>

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

 provides: [MUI.StepperIterator]
 ...
 */

MUI.StepperIterator = new NamedClass('MUI.StepperIterator', {

	Implements: Events,

	index: 0,

	rewind: function() {
		this.index = 0;
	},
	
	set: function(index) {
		index = index.toInt();
		if(index !== this.index) {
			this.index = index;
			this.fireEvent('change', [this.current()]);
		}
		return this;
	},
	
	validate: function(value) {
		if(typeOf(value) === 'integer')
			return true;
		var intv = parseInt(value, 10);
		var floatv = parseFloat(value, 10);
		return !isNaN(intv) && (floatv == intv);
	},
	
	current: function() {
		return this.index;
	},
	
	hasNext: function() {
		return true;
	},
	
	hasPrevious: function() {
		return true;
	},
	
	next: function() {
		this.index++;
		this.fireEvent('change', [this.current()]);
		return this;
	},
	
	previous: function() {
		this.index--;
		this.fireEvent('change', [this.current()]);
		return this;
	}
});