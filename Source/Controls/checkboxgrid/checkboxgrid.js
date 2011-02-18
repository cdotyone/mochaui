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
		cssClass:			'cbg',		// the primary css tag
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
		var fs = o.element ? o.element : $(o.id);
		var isNew = false;
		if (!fs){
			fs = new Element('fieldset', {'id':o.id + '_field'});
			isNew = true;
		}
		if (o.cssClass) fs.set('class', o.cssClass);
		if (o.width) fs.setStyle('width', (parseInt('' + o.width) - 2));
		if (o.height) fs.setStyle('height', parseInt('' + o.height));
		this.el.element = fs;

		// add title if given
		if (o.title)  new Element('div', {'id':o.id + '_tle','text':o.title}).inject(fs);

		for (var i = 0; i < o.items.length; i++){
			this._buildItem(o.items[i], fs, i);
		}

		// add to container
		var addToContainer = function(){
			if (typeOf(container) == 'string') container = $(container);
			if (o.clearContainer) container.empty();
			if (fs.getParent() == null) fs.inject(container);

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

		var reinject = function(pair, tr, colspan){
			pair[1] = colspan;
			pair[0]._td = new Element('td', {'colspan':colspan}).inject(tr);
			pair[0]._span.getChildren().each(function(el){
				el.dispose().inject(pair[0]._td);
			});
			pair[0]._span.dispose();
			pair[0]._span = null;
			if (o.labelPlacement == 'left') pair[0]._td.setStyle('text-align', 'right');
		};

		var rows = {};
		o.items.each(function(item){
			var c = item._span.getCoordinates();
			if (!rows['row' + c.top]) rows['row' + c.top] = [];
			rows['row' + c.top].push([item,c.width]);
		});

		// find the row width the most columns
		var lv = 0,lk;
		Object.each(rows, function(row, k){
			if (lv < row.length){
				lk = k;
				lv = row.length;
			}
		});

		// now get widths of the columns
		var cols = [],twidth = 0;
		Object.each(rows[lk], function(pair){
			cols.push(pair[1]);
			twidth += pair[1] + 3;
		});

		// check to make sure total width is used
		if (twidth < o.width){
			for (var i = 0; i < cols.length; i++){
				cols[i] = Math.round((cols[i] / twidth) * o.width);
			}
		}

		// build table to hold newly arranged controls
		self._table = new Element('table', {'cellspacing':'0','cellpadding':'0','border':'0'}).inject(fs);
		self._tbody = new Element('tbody').inject(self._table);

		// determine colspan for other columns in other rows
		var clen = cols.length;
		Object.each(rows, function(row){
			// create table row for this row
			var tr = new Element('tr').inject(self._tbody);

			// rows with the same length as the largest rows do not need colspan determination
			if (row.length == clen){
				for (var j = 0; j < clen; j++){
					row[j][1] = reinject(row[j], tr, 1);
				}
				return;
			}

			// determine colspan for this row
			var i = 0,tspan = 0;
			Object.each(row, function(col){
				var cwidth = col[1]
						,twidth = 0
						,colspan = 1;

				// keep increasing colspan until we have enough support this column
				for (var j = i; j < clen && i < clen; j++,i++,colspan++){
					twidth += cols[j];
					if (twidth >= cwidth) break;
				}

				// convert span to table cell
				reinject(col, tr, colspan);
				tspan += colspan;
			});

			// make sure the total colspans in this row is at least the same as our largest row
			while (tspan < clen){
				row[row.length - 1][1]++;
				row[row.length - 1][0]._td.set('colspan', row[row.length - 1][1]);
				tspan++;
			}

			if (tspan > clen){
				// went past the end of the longest row, so move all items to same cell
				row[0][0]._td.set('colspan', clen);
				for (i = 1; i < row.length; i++){
					row[i][0]._td.getChildren().each(function(el){
						el.dispose().inject(row[0][0]._td);
					});
					row[i][0]._td.dispose();
					row[i][0]._td = null;
				}
			}
		});

		self.el.element.setStyles({'width':null,'height':null});
	}
});
