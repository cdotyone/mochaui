/*
 ---

 name: CheckBoxGrid

 script: checkboxgrid.js

 description: MUI.CheckBoxGrid - Create a control with columns and rows of checkbox/radio buttons.

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

 provides: [MUI.CheckBoxGrid]

 ...
 */

MUI.CheckBoxGrid = new NamedClass('MUI.CheckBoxGrid', {

	Implements: [Events, Options],

	options: {
		id:					'',			// id of the primary element, and id os control that is registered with mocha
		container:			null,		// the parent control in the document to add the control to
		clearContainer:		false,		// should the control clear its parent container before it appends itself
		drawOnInit:			true,		// true to add tree to container when control is initialized
		cssClass:			'mui-cbg',		// the primary css tag
		title:				false,		// the title to place above the controls

		content:			false,		// used to load content
		items:				[],			// the array list of nodes

		textField:			'text',		// the name of the field that has the item's text
		valueField:			'value',	// the name of the field that has the item's value
		isSelectedField:	false,		// the name of the field that has the item's isSelected state
		// if false, value will be treated as a comma seperated values list of selected items

		width:				0,			// width of the control
		height:				0,			// height of the control when not in drop list mode, or height of drop
		type:				'checkbox',	// can be 'checkbox' or 'radio'
		labelPlacement:		'right',	// can be 'left' or 'right'
		value:				''			// the currently selected item's value

		//onItemClick:		null
		//onValueChanged:	null
	},

	initialize: function(options){
		this.setOptions(options);
		this.el = {};

		// If CheckBoxGrid has no ID, give it one.
		this.id = this.options.id = this.options.id || 'checkBoxGrid' + (++MUI.idCount);
		MUI.set(this.id, this);

		if (options.content){
			options.content.loadMethod = MUI.getDefaultJsonProvider(options.content.loadMethod);
			if (options.content.loadMethod != 'jsonp') options.content.loadMethod = 'json';
			options.content.onLoaded = (function(element, options){
				this.options.items = MUI.Content.getRecords(options);
				this.draw();
			}).bind(this);
			MUI.Content.update(options.content);
		} else
		// create sub items if available
		if (this.options.drawOnInit && this.options.items.length > 0) this.draw();
	},

	draw: function(container){
		var o = this.options;
		if (!container) container = o.container;

		if (!o.isSelectedField && o.value){
			if (o.type == "checkbox") o._values = o.value.split(',');
			else o._values = [o.value];
		}

		// create main wrapper control
		var div = o.element ? o.element : $(o.id);
		var isNew = false;
		if (!div){
			div = new Element('fieldset', {'id':o.id});
			isNew = true;
		}
		this.el.element = div;
		if (o.cssClass) div.set('class', o.cssClass);

		// add title if given
		if (o.title) new Element('label', {'id':o.id + '_tle','text':o.title}).inject(div);

		var wrapper = $(o.id + '_wrapper');
		if (!wrapper) wrapper = new Element('div', {'id':o.id + '_wrapper','class':'mui-cbg-wrapper'}).inject(div);
		if (o.width) wrapper.setStyle('width', (parseInt('' + o.width) - 2));
		if (o.height) wrapper.setStyle('height', parseInt('' + o.height));

		var fs = $(o.id + '_field');
		if (!fs) fs = new Element('div', {'id':o.id + '_field'}).inject(wrapper);
		this.el.fieldset = fs;

		for (var i = 0; i < o.items.length; i++){
			this._buildItem(o.items[i], div, i);
		}

		// add to container
		var addToContainer = function(){
			if (typeOf(container) == 'string') container = $(container);
			if (o.clearContainer) container.empty();
			if (div.getParent() == null) div.inject(container);

			container.setStyle('padding', '0');
			this._convertToGrid.delay(1, this, [fs]);
		}.bind(this);
		if (!isNew || typeOf(container) == 'element') addToContainer();
		else window.addEvent('domready', addToContainer);

		return this;
	},

	_buildItem: function(item, fs, num){
		var self = this,o = this.options;

		item._span = new Element('span', {'id':o.id + num + '_field',styles:{'textAlign':o.labelPlacement == 'left' ? 'right' : 'left'}}).inject(fs);

		var inp = new Element('input', {'id':o.id + num,'name':o.id,'type':o.type}).inject(item._span);
		var value = MUI.getData(item, o.valueField);
		if (value) inp.set('value', value);
		var isSelected = false;
		if (o.isSelectedField) isSelected = MUI.getData(item, o.isSelectedField);
		else if (o._values){
			isSelected = o._values.indexOf('' + value) > -1;
		}

		if (isSelected) inp.set('checked', 'true');
		item._input = inp;
		inp.addEvent('click', function(e){
			self._click(inp, self, e);
		});

		var text = MUI.getData(item, o.textField);
		item._label = new Element('label', {'text':text,'for':o.id + num}).inject(item._span, o.labelPlacement == 'left' ? 'top' : 'bottom');

		return inp;
	},

	_click: function(inp, self, e){
		self.fireEvent('itemClick', [inp.checked,inp,self,e]);

		var o = self.options;
		var values = [];
		o.items.each(function(item){
			if (item._input.checked) values.push(item._input.value);
		});
		o.value = values.join(',');
		self.fireEvent('valueChanged', [o.value,self,e]);
	},

	_convertToGrid: function(fs){
		var self = this,o = this.options;
		if (!fs) fs = $(o.id);

		var reinject = function(item, tr){
			item._td = new Element('td').inject(tr);
			item._span.getChildren().each(function(el){
				el.dispose().inject(item._td);
			});
			item._span.dispose();
			item._span = null;
			if (o.labelPlacement == 'left') item._td.setStyle('text-align', 'right');
		};

		var rows = {},maxCW = 0;
		o.items.each(function(item){
			var c = item._span.getCoordinates();
			if (c.width > maxCW) maxCW = c.width;
		});

		var twidth = 0,clen = 0;
		do {
			twidth += maxCW;
			clen++;
		} while (twidth + maxCW <= o.width);

		// build table to hold newly arranged controls
		self._table = new Element('table', {'cellspacing':'0','cellpadding':'0','border':'0'}).inject(fs);
		self._tbody = new Element('tbody').inject(self._table);

		var cell = 0,tr;
		o.items.each(function(item){
			if (cell == 0) tr = new Element('tr').inject(self._tbody);
			reinject(item, tr);
			cell++;
			if (cell >= clen) cell = 0;
		});
	}
});
