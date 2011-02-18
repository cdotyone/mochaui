/*
 ---

 name: Grid

 script: grid.js

 description: MUI.Grid - Create a grid list.

 copyright: (c) 2011 Contributors in (/AUTHORS.txt).

 license: MIT-style license in (/MIT-LICENSE.txt).

 authors:
 Chris Doty		MochaUI Version
 Marko Santic	OmniGrid Original <http://www.omnisdata.com/omnigrid/>

 note:
 This started out as OmniGrid and got modified so to much to work like a Mocha control.
 It was renamed to just grid because it departs to much from OmniGrid.  This Grid is not
 designed to work outside of the Mocha framework.

 todo: need to make buttons use toolbar control
 todo: need to make pagination use toolbar control - may need to create pagination control
 todo: need to allow buttons and pagination use header and footer of both the window and the panels

 requires:
 - Core/Element
 - Core/Class
 - Core/Options
 - Core/Events
 - MUI
 - MUI.Core

 provides: [MUI.Grid]
 ...
 */

MUI.Grid = new NamedClass('MUI.Grid', {

	Implements: [Events,Options],

	options: {
		id:					'',			// id of the primary element, and id os control that is registered with mocha
		clearContainer:		true,		// should the control clear its parent container before it appends itself
		container:			null,		// the parent control in the document to add the control to
		drawOnInit:			true,		// true to add tree to container when control is initialized

		content:			false,		// used to load content
		data:				[],			// the array list of items
		columns:			[],			// the list of columns to be used

		alternateRows:		true,
		showHeader:			true,
		sortHeader:			false,
		serverSort:			true,
		resizeColumns:		true,
		selectable:			true,
		multipleSelection:	true,
		editable:			false,
		editOnDblClick:		false,
		editColumn:			false,

		// accordion
		accordion:			false,
		accordionRenderer:	null,
		autoSectionToggle:	true,		 // if true just one section can be open/visible
		showToggleIcon:		true,
		openOnDblClick:		false
	},

	initialize: function(options){
		this.setOptions(options);
		options = this.options;
		this.el = {};

		// If grid has no ID, give it one.
		this.id = options.id = options.id || 'grid' + (++MUI.idCount);
		MUI.set(this.id, this);

		if (options.content){
			if (!options.content.paging) options.content.paging = {};
			options.content.paging = Object.merge({}, MUI.Content.PagingOptions, options.content.paging);
			this.refresh();
		}
		else if (this.options.drawOnInit && this.options.data.length > 0){
			options.content = {paging:{pageSize:0}};
			// create sub data if available
			this.draw();
			this.reset();
		}
	},

	// API
	reset: function(){
		this._renderData();

		this.refreshDelayID = null;
		this.dragging = false;
		this.selected = new Array();

		if (this.options.accordion) this.rows = this.el.ulBody.getElements('li:nth-child(2n+1)'); // all elements except accordion sections
		else this.rows = this.el.ulBody.getElements('li');
		this.lastsection = null;

		if (this.options.alternateRows)	this._altRow();

		this.rows.each(function(row){
			row.addEvent('click', this._rowClick.bind(this));
			row.addEvent('dblclick', this._rowDblClick.bind(this));
			row.addEvent('mouseover', this._rowMouseOver.bind(this));
			row.addEvent('mouseout', this._rowMouseOut.bind(this));
		}, this);

		// ------------------------- setup header --------------------------------
		this.el.element.getElements('.th').each(function(el, i){
			var dataType = el.retrieve('dataType');
			if (dataType){

				el.getdate = function(str){
					// converts 2-digit years to 4
					function fixYear(yr){
						yr = +yr;
						if (yr < 50){
							yr += 2000;
						}
						else if (yr < 100){
							yr += 1900;
						}
						return yr;
					}

					var ret,strtime;
					if (str.length > 12){
						strtime = str.substring(str.lastIndexOf(' ') + 1);
						strtime = strtime.substring(0, 2) + strtime.substr(-2)
					} else {
						strtime = '0000';
					}

					// YYYY-MM-DD
					if (ret = str.match(/(\d{2,4})-(\d{1,2})-(\d{1,2})/)){
						return (fixYear(ret[1]) * 10000) + (ret[2] * 100) + (+ret[3]) + strtime;
					}

					// DD/MM/YY[YY] or DD-MM-YY[YY]
					if (ret = str.match(/(\d{1,2})[\/-](\d{1,2})[\/-](\d{2,4})/)){
						return (fixYear(ret[3]) * 10000) + (ret[2] * 100) + (+ret[1]) + strtime;
					}
					return 999999990000; // So non-parsed dates will be last, not first
				};

				el.findData = function(elem){
					var child = elem.getFirst();
					if (child){
						return el.findData(child);
					} else {
						return elem.get('html').trim();
					}
				};

				el.compare = function(a, b){
					var dir = el.retrieve('dir');
					var var1 = a.getChildren()[i].get('html').trim();
					var var2 = b.getChildren()[i].get('html').trim();

					if (dataType == 'number'){
						var1 = parseFloat(var1);
						var2 = parseFloat(var2);
						return dir == 'asc' ? var1 - var2 : var2 - var1;
					} else if (dataType == 'string'){
						var1 = var1.toUpperCase();
						var2 = var2.toUpperCase();
						if (var1 == var2) return 0;
						if (dir == 'asc'){
							if (var1 < var2) return -1;
						} else {
							if (var1 > var2) return -1;
						}
						return 1;

					} else if (dataType == 'date'){
						var1 = parseFloat(el.getdate(var1));
						var2 = parseFloat(el.getdate(var2));
						return dir == 'asc' ? var1 - var2 : var2 - var1;
					} else if (dataType == 'currency'){
						var1 = parseFloat(var1.substr(1).replace(',', ''));
						var2 = parseFloat(var2.substr(1).replace(',', ''));
						return dir == 'asc' ? var1 - var2 : var2 - var1;
					}
				}
			}
		}, this);
	},

	// API
	// default column in inline edit mode
	// options = {
	//		dataIndex:Number - column name || columnIndex:Number - column index
	//}
	edit: function(options){
		var sels = this.getSelectedIndices();

		if (!sels || sels.length == 0 || !this.options.editable) return null;

		this._finishEditing(); // if it is open somewhere

		var li = this.rows[ sels[0] ];

		// find the columns index
		var c = options.columnIndex ? options.columnIndex : 0; // defaults to first column
		var columns;
		if (options.editColumn){
			for (; c < this.options.columns.length; c++){
				columns = this.options.columns[c];

				if (columns.hidden) continue;
				if (columns.name == options.editColumn) break;
			}
		}

		if (c == this.options.columns.length) return null; // column not found

		columns = this.options.columns[c];
		if (!columns.editable) return null;

		var td = li.getElements('div.td')[c];
		var data = this.options.data[ sels[0] ];

		var width = td.getStyle('width').toInt() - 5;
		var height = 15;
		var html = data[columns.name];

		td.set('html', '');

		var input = new Element('input', {style:"width: " + width + "px; height: " + height + "px;", maxlength:254, value: html});
		input.addClass('inline');
		input.addEvent("keyup", this._finishEditing.bind(this));
		input.addEvent("blur", this._finishEditing.bind(this));
		input.inject(td);
		input.focus();

		this.inlineEditSafe = {row:sels[0], columns: columns, td:td, input:input, oldvalue: html};
		this.inlineeditmode = true; // Chrome calls for KeyUp and blur event almost simultaneously

		return this.inlineEditSafe;
	},

	_finishEditing: function(evt){
		if (!this.inlineeditmode) return;

		if (evt && evt.type == "keyup" && evt.key != 'enter' && evt.key != 'esc') return;

		this.inlineeditmode = false;  // for chrome

		var row = this.inlineEditSafe.row;
		var data = this.options.data[ row ];
		var columns = this.inlineEditSafe.columns;
		var td = this.inlineEditSafe.td;

		// if not confirmed with ENTER returns to the old value
		data[columns.editColumn] = ( evt && evt.type == "keyup" && evt.key == 'enter') ? this.inlineEditSafe.input.value : this.inlineEditSafe.oldvalue;

		td.set('html', columns.labelFunction ? columns.labelFunction(data, row, columns) : data[columns.editColumn]);

		if (td.get('html').length == 0) td.set('html', '&nbsp;'); // important because otherwise would not have reacted at the second DBL click

		// decreased event for key = ENTER if the change is made
		if (evt && evt.type == "keyup" && evt.key == 'enter' && this.inlineEditSafe.oldvalue != td.get('html')){
			// dropped out of the event for
			this.inlineEditSafe.target = this;
			this.fireEvent("editcomplete", this.inlineEditSafe);
		}

		this.inlineEditSafe = null;
	},

	_toggle: function(el){
		el.setStyle('display', el.getStyle('display') == 'block' ? 'none' : 'block');
	},

	// API
	getSection: function(row){
		return this.el.ulBody.getElement('.section-' + row);
	},

	_getLiParent: function (target){
		target = $(target);

		while (target && !target.hasClass('td')){
			target = target.getParent();
		}

		if (target) return target.getParent();
	},

	_rowMouseOver: function (evt){
		var li = this._getLiParent(evt.target);
		if (!li) return;

		if (!this.dragging) li.addClass('over');

		this.fireEvent("mouseover", {target:this, row:li.retrieve('row'), element:li });
	},

	_rowMouseOut: function (evt){
		var li = this._getLiParent(evt.target);
		if (!li) return;

		if (!this.dragging)
			li.removeClass('over');

		this.fireEvent("mouseout", {target:this, row:li.retrieve('row'), element:li });
	},

	_rowClick: function (evt){
		var li = this._getLiParent(evt.target);
		if (!li) return;

		if (this.options.selectable){
			var currentindex = li.retrieve('row');
			var selectedNum = this.selected.length;
			var dontselect = false;

			if ((!evt.control && !evt.shift) || !this.options.multipleSelection){
				// clear the old selection
				this.rows.each(function(row){
					row.removeClass('selected')
				}, this);
				this.selected = new Array();
			}

			if (evt.control){
				for (var i = 0; i < selectedNum; i++){
					if (currentindex == this.selected[i]){ // select if it is current
						this.rows[ currentindex ].removeClass('selected');
						this.selected.splice(i, 1);
						dontselect = true;
					}
				}
			}

			if (evt.shift && this.options.multipleSelection){
				var si = 0;
				if (this.selected.length > 0) si = this.selected[selectedNum - 1]; // back up one

				var endindex = currentindex;
				var startindex = Math.min(si, endindex);
				endindex = Math.max(si, endindex);

				for (var j = startindex; j <= endindex; j++){
					this.rows[j].addClass('selected');
					this.selected.push(Number(j));
				}
			}

			if (!dontselect){
				li.addClass('selected');
				this.selected.push(Number(li.retrieve('row')));
			}

			this.unique(this.selected, true); // remove all duplicates from selection
		}

		if (this.options.accordion && !this.options.openOnDblClick) this._accordionOpen(li);
		this.fireEvent("click", {indices:this.selected, target:this, row:li.retrieve('row'), element:li });
	},

	_toggleIconClick: function(evt){
		var li = this._getLiParent(evt.target);
		this._accordionOpen(li);
	},

	_accordionOpen: function(li){
		var section = this.getSection(li.retrieve('row'));

		if (this.options.autoSectionToggle){

			if (this.lastsection)
				if (this.lastsection != section){
					this.lastsection.setStyle('display', 'none');
					this.lastsection.getPrevious().getElement('.toggleicon').setStyle('background-position', '0 0');
				}

			if (!this.options.accordionRenderer) section.setStyle('display', 'block');
		}

		if (this.options.accordionRenderer) this._toggle(section);

		if (this.options.showToggleIcon)
			li.getElement('.toggleicon').setStyle('background-position', section.getStyle('display') == 'block' ? '-16px 0' : '0 0');

		this.lastsection = section;
	},

	_rowDblClick: function (evt){

		var li = this._getLiParent(evt.target);
		if (!li) return;

		var t = evt.target;
		if (this.options.editable && this.options.editOnDblClick && t.hasClass('td')){
			var children = li.getChildren();
			for (var i = 0; i < children.length; i++){
				if (children[i] == t) break;
			}
			var obj = this.edit({columnIndex:i});
			if (obj) obj.input.selectRange(0, obj.input.value.length);
		}

		if (this.options.accordion && this.options.openOnDblClick) this._accordionOpen(li);
		this.fireEvent("dblclick", {row:li.retrieve('row'), target:this, element:li});
	},

	update: function (data){
		this.setData(data);
		this.fireEvent("update", {target:this, payload:data});
	},

	unique: function(a, asNumber){
		function om_sort_number(a, b){
			return a - b;
		}

		var sf = asNumber ? om_sort_number : function(){
		};
		a.sort(sf);

		for (var i = 1; i < a.length; i++){
			if (a[i - 1] == a[i]){
				a.splice(i, 1);
				i--;
			}
		}

		return a;
	},

	setData: function(data, cm){
		if (!data) return;

		this.options.data = data;
		if (!this.options.columns) this._buildDefaultcolumns();

		var paging = this.options.content.paging;
		if (paging.pageSize){
			this.el.element.getElement('div.pDiv input').value = paging.page;
			var to = (paging.page * paging.pageSize) > paging.total ? paging.total : (paging.page * paging.pageSize);
			this.el.element.getElement('div.pDiv .pPageStat').set('html', ((paging.page - 1) * paging.pageSize + 1) + '..' + to + ' / ' + paging.total);
			this.el.element.getElement('div.pDiv .pcontrol span').set('html', paging.pageMax);
		}

		if (cm){
			// first check is new columns different from active one
			if (this.options.columns != cm){
				this.options.columns = cm;
				// if we change columns then we must redraw entire component
				this.draw();
			}
		}

		this.reset();
		this.hideSpinner();
	},

	setDataByRow: function(row, data){
		if (row >= 0 && row < this.options.data.length){
			this.options.data[row] = data;
			this.reset();
		}
	},

	setScroll: function(x, y){
		var bDiv = this.el.element.getElement('.bDiv');
		new Fx.Scroll(bDiv).set(x, y);
	},

	addRow: function(data, row){
		if (row >= 0){
			if (!this.options.data) this.options.data = [];
			this.options.data.splice(row, 0, data);
			this.reset();
		}
	},

	deleteRow: function(row){
		if (row >= 0 && row < this.options.data.length){
			this.options.data.splice(row, 1);
			this.reset();
		}
	},

	showSpinner: function(){
		if (this.spinner || !this.el.element) return;
		this.spinner = new MUI.Spinner({'id':this.id + '_spinner',container:this.el.element.getParent()});
		this.spinner.show();
	},

	hideSpinner: function(){
		if (!this.spinner) return;
		MUI.erase(this.id + '_spinner');
		this.spinner = null;
	},

	selectAll: function(){
		this.rows.each(function(el){
			this.selected.push(el.retrieve('row'));
			el.addClass('selected');
		}, this);
	},

	unselectAll: function(){
		this.rows.each(function(el){
			el.removeClass('selected');
		}, this);
		this.selected = [];
	},

	getSelectedIndices: function(){
		return this.selected;
	},

	setSelectedIndices: function(arr){
		this.selected = arr;
		for (var i = 0; i < arr.length; i++){
			var li = this.rows[arr[i]];
			this._rowClick({target:li.getFirst(), control:false});
		}
	},

	onMouseOver: function(obj){
		obj.columns.onMouseOver(obj.element, obj.data);
	},

	// API
	removeHeader: function(){
		var obj = this.el.element.getElement('.hDiv');
		if (obj) obj.empty();
		this.options.columns = null;
	},

	removeAll: function(){
		if (this.el.ulBody) this.el.ulBody.empty();
		this.selected = new Array();
	},

	setColumns: function(cmu){
		if (!cmu) return;
		this.options.columns = cmu;
		this.draw();
	},

	// quickly determine provide default settings for the column
	_buildDefaultcolumns: function(){
		if (!this.options.data) return;

		var rowCount = this.options.data.length;
		if (!(rowCount <= 0))return;

		this.options.columns = [];

		// get the type of data from the first row
		for (var cn in this.options.data[0]){
			var dataType = typeof(this.options.data[0][cn]) == "number" ? "number" : "string";
			this.options.columns.push({header:cn, dataIndex:cn, dataType: dataType, editable:true});
		}

		this.fireEvent("autocolummodel", {target:this, columns:this.options.columns});
		this.draw();
	},

	setSize: function(w, h){
		// Width
		this.options.width = w ? w : this.options.width;
		this.el.element.setStyle('width', this.options.width);

		var width = this.options.width - 2;
		if (this.options.buttons) this.el.element.getElement('.tDiv').setStyle('width', width);

		var hDiv = this.el.element.getElement('.hDiv');
		if (this.options.showHeader && hDiv) hDiv.setStyle('width', width);

		var bodyEl = this.el.element.getElement('.bDiv');
		bodyEl.setStyle('width', width);
		this.el.element.getElement('.pDiv').setStyle('width', width);

		// Height
		this.options.height = h ? h : this.options.height;

		bodyEl.setStyle('height', this._getBodyHeight());
		this.el.element.setStyle('height', this.options.height);

		// if it has a gBlock by chance, set it whiteOverflow
		var gBlock = this.el.element.getElement('.gBlock');
		if (gBlock) gBlock.setStyles({width:this.options.width, height: bodyEl.getSize().y });
	},

	_bodyScroll: function(){
		var hbox = this.el.element.getElement('.hDivBox');
		var bbox = this.el.element.getElement('.bDiv');

		var xs = bbox.getScroll().x;
		hbox.setStyle('left', -xs);

		this._dragColumnReposition();
	},

	// ------------------------- Drag columns events --------------------------------
	_dragColumnReposition: function(){
		if (!this.options.resizeColumns) return;

		var dragTempWidth = 0;
		var cDrags = this.el.element.getElements('.cDrag div');
		var scrollX = this.el.element.getElement('div.bDiv').getScroll().x;

		for (var c = 0; c < this.options.columns.length; c++){
			var columns = this.options.columns[c];

			var dragSt = cDrags[c];
			dragSt.setStyle('left', dragTempWidth + columns.width + 1 - scrollX);

			if (!columns.hidden)dragTempWidth += columns.width;
		}
	},

	_dragColumnComplete: function(target){
		this.dragging = false;

		var colindex = target.retrieve('column');

		// find the first position
		var cDrag = this.el.element.getElement('div.cDrag');
		var dragSt = cDrag.getElements('div')[colindex];
		var scrollX = this.el.element.getElement('div.bDiv').getScroll().x;

		// calculate the total width
		this.sumWidth = 0;
		var columns;
		for (var c = 0; c < this.options.columns.length; c++){
			columns = this.options.columns[c];

			if (c == colindex){
				// adjust column position based on new width
				var pos = dragSt.getStyle('left').toInt() + scrollX - this.sumWidth - (Browser.ie ? -1 : 1 );
			} else if (!columns.hidden)
				this.sumWidth += columns.width;
		}

		if (pos < 30) pos = 30; // minimize size of the column

		this.options.columns[colindex].width = pos;
		this.sumWidth += pos;


		this.el.ulBody.setStyle('width', this.sumWidth + this.visibleColumns);
		var hDivBox = this.el.element.getElement('div.hDivBox');

		hDivBox.setStyle('width', this.sumWidth + this.visibleColumns * 2);

		// header
		columns = hDivBox.getElements('div.th');
		var columnObj = columns[colindex];

		columnObj.setStyle('width', pos - 6);

		var visibleColumns = this.visibleColumns; // used in each below
		var elements = this.el.ulBody.getElements('li.tr'); // for Accordion

		// all columns in the body
		elements.each(function(el){
			el.setStyle('width', this.sumWidth + 2 * visibleColumns);

			if (!el.hasClass('section')){
				var columns = el.getElements('div.td');
				var columnObj = columns[colindex];
				columnObj.setStyle('width', pos - 6);
			}
		}, this);

		this._dragColumnReposition();
	},

	_dragColumnStart: function(){
		this.dragging = true;
	},

	_dragColumnDragging: function(target){
		target.setStyle('top', 1);
	},

	_dragColumnOver: function(evt){
		evt.target.addClass('dragging');
	},

	_dragColumnOut: function(evt){
		evt.target.removeClass('dragging');
	},


	// ------------------------- Header events --------------------------------
	_clickHeaderColumn: function(evt){
		if (this.dragging) return;

		var colIndex = evt.target.retrieve('column');
		var columns = this.options.columns[colIndex];

		evt.target.removeClass(columns.dir);
		columns.dir = (columns.dir == 'asc') ? 'desc' : 'asc';
		evt.target.addClass(columns.dir);

		this.sort(colIndex);
	},

	_overHeaderColumn: function(evt){
		if (this.dragging) return;

		var colIndex = evt.target.retrieve('column');
		var columns = this.options.columns[colIndex];

		evt.target.addClass(columns.sort);
	},

	_outHeaderColumn: function(evt){
		if (this.dragging) return;

		var colindex = evt.target.retrieve('column');
		var columns = this.options.columns[colindex];

		evt.target.removeClass(columns.sort);
	},

	_getBodyHeight: function(){
		var options = this.options;
		// the total height of the entire grid is this.options.height have in the body header
		// header
		var headerHeight = options.showHeader ? 24 + 2 : 0;  //+2 for the border
		// toolbar
		var toolbarHeight = options.buttons ? this.el.element.getElement('.tDiv').getStyle('height').toInt() : 0;
		// pagination toolbar height 25px + 1px bottom border
		var paginationToolbar = options.content && options.content.paging.pageSize ? 26 : 0;
		return options.height - headerHeight - toolbarHeight - paginationToolbar - 2; //+2 for the border
	},

	_renderData: function(){
		var options = this.options;
		this.el.ulBody.empty();
		this.inlineEditSafe = null;

		if (options.data && options.data.length){
			var columnCount = options.columns.length;
			var rowCount = options.data.length;

			for (var r = 0; r < rowCount; r++){
				var rowData = options.data[r];

				var li = new Element('li');
				li.setStyle('width', this.sumWidth + 2 * this.visibleColumns);
				li.store('row', r);
				li.addClass('tr');

				this.el.ulBody.appendChild(li);
				if (options.tooltip) options.tooltip.attach(tr);

				var firstVisible = -1;
				for (var c = 0; c < columnCount; c++){
					var columns = options.columns[c];

					var div = new Element('div', {'class':'td'});
					div.setStyle('width', columns.width - 6); // because of the padding in FF
					li.appendChild(div);

					firstVisible = (!columns.hidden && firstVisible == -1) ? c : firstVisible;

					var toggleIcon = "";
					if (firstVisible == c && options.accordion && options.showToggleIcon) toggleIcon = "<div class='toggleicon'></div>";

					if (columns.hidden) div.setStyle('display', 'none');
					if (columns.onMouseOver) div.onmouseover = this.onMouseOver.bind(this, {element:div, columns:columns, data:rowData });

					// title
					if (columns.title) div.title = rowData[columns.title];

					var template = columns.name;
					if (template.indexOf('{') < 0) template = '{' + template + '}';
					var val = ''+MUI.replaceFields(template,rowData); 

					if (columns.itemsType == "checkbox"){
						var input = new Element('input', {type:"checkbox"});
						if (columns.onChange) input.onclick = this.onSelect.bind(this, {columns:columns, row:r, input:input});
						div.appendChild(input);
						if (val == '1' || val == 't' || val.toLowerCase() == 'true') input.set('checked', true);
					} else if (columns.type == "image"){
					} else if (columns.type == 'custom'){
						//columns.labelFunction(td, options.items[r], r);
					} else if (columns.labelFunction != null){
						div.set('html', columns.labelFunction(rowData, r, columns));
					} else {
						if (val == null || val == 'null' || val == 'undefined' || val == "") val = '&nbsp;';

						var trimmed = val.replace(/^\s+|\s+$/g, ''); // see if string is empty
						if (trimmed.length == 0) val = '&nbsp;';

						div.set('html', toggleIcon + val);

						// *** reg. event to toggleicon ***
						if (firstVisible == c && options.accordion && options.showToggleIcon)
							div.getElement('.toggleicon').addEvent('click', this._toggleIconClick.bind(this));
					}
				} // for column

				if (options.accordion){
					var li2 = new Element('li');
					li2.addClass('section');
					li2.addClass('section-' + r);
					li2.setStyle('width', this.sumWidth + 2 * this.visibleColumns);

					this.el.ulBody.appendChild(li2);
					if (options.accordionRenderer) options.accordionRenderer({parent:li2, row:r, grid:this, rowdata: rowData});
				}
			}
		}
	},

	// --- Main draw function
	draw: function(container){
		var o = this.options;
		if (!container) container = o.container;

		this.removeAll(); // reset variables and only empty ulBody

		// determine element for this control
		var isNew = false;
		var div = o.element ? o.element : $(o.id);
		if (!div){
			div = new Element('div', {'id': o.id});
			isNew = true;
		}
		this.el.element = div.store('instance', this).empty();		// assign instance to element

		// --- common
		var width = o.width - 2; //-2 for the borders
		var columnCount = o.columns ? o.columns.length : 0;
		// --- common

		// --- container
		if (o.width)	this.el.element.setStyle('width', o.width);
		div.addClass('grid');
		// --- container

		// --- toolbar
		if (o.buttons){
			var toolDiv = new Element('div', {
				'class':'tDiv',
				'styles':{
					'width':width,
					'height': 25 + (Browser.ie ? 2 : 0 )
				}
			}).inject(div);

			Array.each(o.buttons, function(button){
				var divBtn = new Element('div');
				toolDiv.appendChild(divBtn);
				if (button.separator){
					divBtn.addClass('btnseparator');
					return;
				}

				divBtn.addClass('fbutton');

				var divBtnC = new Element('div');
				divBtnC.addEvent('click', button.click.bind(this, [button.cssClass, this]));
				divBtnC.addEvent('mouseover', function(){
					this.addClass('fbOver');
				});
				divBtnC.addEvent('mouseout', function(){
					this.removeClass('fbOver');
				});

				divBtn.appendChild(divBtnC);

				var divBText = new Element('span');
				divBText.addClass(button.cssClass);
				divBText.setStyle('padding-left', 20);
				divBText.set('html', button.name);
				divBtnC.appendChild(divBText);
			});
		}
		// --- toolbar

		// --- header
		this.el.header = new Element('div', {
			'class':'hDiv',
			'styles':{
				'width':width
			}}).inject(div);

		var headDivBox = new Element('div', {'class':'hDivBox'}).inject(this.el.header);

		this.sumWidth = 0;
		this.visibleColumns = 0; // differs from the columnCount because data for some columns are of reading but are not shown
		var columns,c;
		for (c = 0; c < columnCount; c++){
			columns = o.columns[c];

			var columnDiv = new Element('div');
			// default settings columns
			if (columns.width == null)  o.columns[c].width = 100;
			columns.sort = 'asc';

			// Header events
			if (o.sortHeader){
				columnDiv.addEvent('click', this._clickHeaderColumn.bind(this));
				columnDiv.addEvent('mouseout', this._outHeaderColumn.bind(this));
				columnDiv.addEvent('mouseover', this._overHeaderColumn.bind(this));
			}

			columnDiv.store('column', c);
			columnDiv.store('dataType', columns.dataType);
			columnDiv.addClass('th');
			columnDiv.setStyle('width', columns.width - 6);
			headDivBox.appendChild(columnDiv);

			if (columns.hidden) columnDiv.setStyle('display', 'none');
			else {
				this.sumWidth += columns.width;
				this.visibleColumns++;
			}

			var header = columns.header;
			if (header) columnDiv.set('html', header);
		}
		headDivBox.setStyle('width', this.sumWidth + this.visibleColumns * 2);
		if (!o.showHeader) this.el.header.setStyle('display', 'none');
		// --- header

		// --- Column size drag
		if (o.height){
			var bodyHeight = this._getBodyHeight();
			div.setStyle('height', o.height);
		}

		if (o.resizeColumns){
			var cDrag = new Element('div', {'class':'cDrag'}).inject(div);
			var toolbarHeight = o.buttons ? toolDiv.getStyle('height').toInt() : 0; // toolbar
			cDrag.setStyle('top', toolbarHeight);

			var dragTempWidth = 0;
			for (c = 0; c < columnCount; c++){
				columns = o.columns[c];

				var dragSt = new Element('div');
				var headerHeight = o.showHeader ? 24 + 2 : 0; // +2 border

				dragSt.setStyles({top:1,left: dragTempWidth + columns.width, height: headerHeight, display:'block'}); // bodyHeight+
				dragSt.store('column', c);
				cDrag.appendChild(dragSt);

				// Events
				dragSt.addEvent('mouseout', this._dragColumnOut.bind(this));
				dragSt.addEvent('mouseover', this._dragColumnOver.bind(this));

				var dragMove = new Drag(dragSt, {snap:0});
				dragMove.addEvent('drag', this._dragColumnDragging.bind(this));
				dragMove.addEvent('start', this._dragColumnStart.bind(this));
				dragMove.addEvent('complete', this._dragColumnComplete.bind(this));

				if (columns.hidden) dragSt.setStyle('display', 'none');
				else dragTempWidth += columns.width;
			}
		}
		// --- Column size drag

		// --- body
		var bDiv = new Element('div');
		this.el.body = bDiv.addClass('bDiv');

		if (o.width) bDiv.setStyle('width', width);

		bDiv.setStyle('height', bodyHeight);
		div.appendChild(bDiv);

		//  scroll event
		this.onBodyScrollBind = this._bodyScroll.bind(this);
		bDiv.addEvent('scroll', this.onBodyScrollBind);
		this.el.ulBody = new Element('ul');
		this.el.ulBody.setStyle('width', this.sumWidth + this.visibleColumns); // not to see surplus, address the overflow hidden
		bDiv.appendChild(this.el.ulBody);

		var paging = o.content.paging;
		if (paging.pageSize && !div.getElement('div.pDiv')){
			var pageDivWrap = new Element('div', {
				'class':'pDiv',
				'styles':{
					'width':width,
					'height':25
				}}).inject(div);

			var pageDiv = new Element('div', {'class':'pDiv2'}).inject(pageDivWrap);

			var h = '<div class="pGroup"><select class="rp" name="rp">';

			var idx;
			var setDefaultpageSize = false;
			for (idx = 0; idx < paging.pageOptions.length; idx++){
				if (paging.pageOptions[idx] != paging.pageSize)
					h += '<option value="' + paging.pageOptions[idx] + '">' + paging.pageOptions[idx] + '</option>';
				else {
					setDefaultpageSize = true;
					h += '<option selected="selected" value="' + paging.pageOptions[idx] + '">' + paging.pageOptions[idx] + '</option>';
				}
			}
			h += '</select></div>';

			h += '<div class="btnseparator"></div><div class="pGroup"><div class="pFirst pButton"></div><div class="pPrev pButton"></div></div>';
			h += '<div class="btnseparator"></div><div class="pGroup"><span class="pcontrol"><input class="cpage" type="text" value="1" size="4" style="text-align:center"/> / <span></span></span></div>';
			h += '<div class="btnseparator"></div><div class="pGroup"><div class="pNext pButton"></div><div class="pLast pButton"></div></div>';
			h += '<div class="btnseparator"></div><div class="pGroup"><div class="pReload pButton"></div></div>';
			h += '<div class="btnseparator"></div><div class="pGroup"><span class="pPageStat"></div>';

			pageDiv.set('html', h);

			// set o.pageSize value from o.pageOptions array
			var rpObj = pageDiv.getElement('.rp');
			if (!setDefaultpageSize && rpObj.options.length > 0){
				if (paging) paging.pageSize = rpObj.options[0].value;
				rpObj.options[0].selected = true;
			}

			pageDiv.getElement('.pFirst').addEvent('click', this.firstPage.bind(this));
			pageDiv.getElement('.pPrev').addEvent('click', this.prevPage.bind(this));
			pageDiv.getElement('.pNext').addEvent('click', this.nextPage.bind(this));
			pageDiv.getElement('.pLast').addEvent('click', this.lastPage.bind(this));
			pageDiv.getElement('.pReload').addEvent('click', this.refresh.bind(this, false));
			pageDiv.getElement('.rp').addEvent('change', this._pageSizeChange.bind(this));
			pageDiv.getElement('input.cpage').addEvent('keyup', this._pageChange.bind(this));
		}
		// --- body

		// add to container
		var addToContainer = function(){
			if (typeOf(container) == 'string') container = $(container);
			this.hideSpinner();
			if (o.clearContainer) container.empty();
			if (div.getParent() == null) div.inject(container);
			container.setStyle('padding', '0');
		}.bind(this);
		if (!isNew || typeOf(container) == 'element') addToContainer();
		else window.addEvent('domready', addToContainer);
	},

	_pageSizeChange: function(){
		MUI.Content.setPageSize(this.options.content, this.el.element.getElement('.rp').value);
	},

	_pageChange: function(){
		MUI.Content.gotoPage.delay(1000, this, [this.options.content, this.el.element.getElement('div.pDiv2 input').value]);
	},

	firstPage: function(){
		MUI.Content.firstPage(this.options.content);
	},

	lastPage: function(){
		MUI.Content.lastPage(this.options.content);
	},

	prevPage: function(){
		MUI.Content.prevPage(this.options.content);
	},

	nextPage: function(){
		MUI.Content.nextPage(this.options.content);
	},

	gotoPage: function(p){
		MUI.Content.gotoPage(this.options.content, p);
	},

	setPageSize: function(p){
		MUI.Content.setPageSize(this.options.content, p);
	},

	sort: function(index, by){
		var options = this.options;

		if (index < 0 || index >= options.columns.length) return;

		if (options.onStart) this.fireEvent('onStart');

		var header = this.el.element.getElements('.th');
		var el = header[index];

		if (by != null) el.addClass(by.toLowerCase());
		if (el.hasClass('desc')) el.store('dir', 'desc');
		else el.store('dir', 'asc');

		if (options.serverSort){
			options.content.paging.sort = options.columns[index].name;
			options.content.paging.dir = el.retrieve('dir');
			this.refresh();
		} else {
			// Sorting...
			this.rows.sort(el.compare);
			this.rows.inject(this.el.ulBody, 'inside');

			// Update selection array because indices has been changed
			this.selected = new Array();
			this.rows.each(function(row){
				if (row.hasClass('selected')) this.selected.push(row.retrieve('row'));
			}, this);

			this._altRow();
		}
	},

	refresh:function(init){
		var options = this.options;
		if (!init) init = false;
		if (options.content){
			// handle force refresh
			if (!init){
				options.content.records = [];
				if (options.content.persist) MUI.Persist.clear(options.content.url);
			}

			options.content.instance = this;
			options.content.loadMethod = MUI.getDefaultJsonProvider(options.content.loadMethod);
			MUI.Content.update(options.content);
		}
	},

	_altRow: function(){
		this.rows.each(function(el, i){
			if (i % 2) el.removeClass('erow');
			else el.addClass('erow');
		});
	},

	updateStart: function(){
		this.showSpinner();
	},

	updateEnd: function(content){
		this.draw();
		this.setData(MUI.Content.getRecords(content));
	}
});
