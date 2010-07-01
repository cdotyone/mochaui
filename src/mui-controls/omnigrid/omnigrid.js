/*
 ---

 name: OmniGrid

 script: omnigrid.js

 description: MUI - Create a list with check boxes next to each item.

 copyright: (c) 2010 Omnisdata Ltd.

 license: MIT-style license in (/MIT-LICENSE.txt).

 author: Marko Šantić

 note:
 This documentation is taken directly from the javascript source files. It is built using Natural Docs.

 requires:
 - Core/Element
 - Core/Class
 - Core/Options
 - Core/Events
 - MUI
 - MUI.Core

 provides: [omniGrid]
 ...
 */

var omniGrid = new Class({
	Implements: [Events,Options],

	getOptions: function(){
		return {
			alternateRows: true,
			showHeader:true,
			sortHeader:false,
			resizeColumns:true,
			selectable:true,
			serverSort:true,
			sortOn: null,
			sortBy: 'ASC',
			filterHide: true,
			filterHideCls: 'hide',
			filterSelectedCls: 'filter',
			multipleSelection:true,
			editable:false,
			editOnDblClick:false,

			// accordion
			accordion:false,
			accordionRenderer:null,
			autoSectionToggle:true, // if true just one section can be open/visible
			showToggleIcon:true,
			openAccordionOnDblClick:false,

			// pagination
			url:null,
			pagination:false,
			page:1,
			perPageOptions: [10, 20, 50, 100, 200],
			perPage:10,
			filterInput:false,

			// dataProvider
			dataProvider:null
		};
	},

	initialize: function(container, options){
		this.setOptions(this.getOptions(), options);
		this.container = $(container);

		if (!this.container) return;
		this.draw();
		this.reset();
		this.loadData();
	},

	// API
	reset: function(){
		this.renderData();

		this.refreshDelayID = null;
		this.dragging = false;
		this.selected = new Array();

		if (this.options.accordion) this.elements = this.ulBody.getElements('li:nth-child(2n+1)'); // all elements except accordion sections
		else this.elements = this.ulBody.getElements('li');

		this.filtered = false;
		this.lastsection = null;

		if (this.options.alternateRows)	this.altRow();

		this.elements.each(function(el){

			el.addEvent('click', this.onRowClick.bind(this));
			el.addEvent('dblclick', this.onRowDblClick.bind(this));
			el.addEvent('mouseover', this.onRowMouseOver.bind(this));
			el.addEvent('mouseout', this.onRowMouseOut.bind(this));

		}, this);

		// ------------------------- setup header --------------------------------
		this.container.getElements('.th').each(function(el, i){

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
						return elem.innerHTML.trim();
					}
				};

				el.compare = function(a, b){
					var var1 = a.getChildren()[i].innerHTML.trim();
					var var2 = b.getChildren()[i].innerHTML.trim();

					if (dataType == 'number'){
						var1 = parseFloat(var1);
						var2 = parseFloat(var2);
						return el.sortBy == 'ASC' ? var1 - var2 : var2 - var1;

					} else if (dataType == 'string'){
						var1 = var1.toUpperCase();
						var2 = var2.toUpperCase();
						if (var1 == var2) return 0;
						if (el.sortBy == 'ASC'){
							if (var1 < var2) return -1;
						} else {
							if (var1 > var2) return -1;
						}
						return 1;

					} else if (dataType == 'date'){
						var1 = parseFloat(el.getdate(var1));
						var2 = parseFloat(el.getdate(var2));
						return el.sortBy == 'ASC' ? var1 - var2 : var2 - var1;

					} else if (dataType == 'currency'){
						var1 = parseFloat(var1.substr(1).replace(',', ''));
						var2 = parseFloat(var2.substr(1).replace(',', ''));
						return el.sortBy == 'ASC' ? var1 - var2 : var2 - var1;
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

		this.finishEditing(); // if it is open somewhere

		var li = this.elements[ sels[0] ];

		// find the columnModel index
		var c = options.columnIndex ? options.columnIndex : 0; // defaults to first column
		var colmod;
		if (options.dataIndex){
			for (; c < this.options.columnModel.length; c++){
				colmod = this.options.columnModel[c];

				if (colmod.hidden) continue;
				if (colmod.dataIndex == options.dataIndex) break;
			}
		}

		if (c == this.options.columnModel.length) return null; // column not found

		colmod = this.options.columnModel[c];
		if (!colmod.editable) return null;

		var td = li.getElements('div.td')[c];
		var data = this.options.data[ sels[0] ];

		var width = td.getStyle('width').toInt() - 5;
		var height = 15;
		var html = data[colmod.dataIndex];

		td.innerHTML = "";

		var input = new Element('input', {style:"width: " + width + "px; height: " + height + "px;", maxlength:254, value: html});
		input.addClass('inline');
		input.addEvent("keyup", this.finishEditing.bind(this));
		input.addEvent("blur", this.finishEditing.bind(this));
		input.inject(td);
		input.focus();

		this.inlineEditSafe = {row:sels[0], columnModel: colmod, td:td, input:input, oldvalue: html};
		this.inlineeditmode = true; // Chrome calls for KeyUp and blur event almost simultaneously

		return this.inlineEditSafe;
	},

	finishEditing: function(evt)
	{
		if (!this.inlineeditmode) return;

		if (evt && evt.type == "keyup" && evt.key != 'enter' && evt.key != 'esc') return;

		this.inlineeditmode = false;  // for chrome

		var row = this.inlineEditSafe.row;
		var data = this.options.data[ row ];
		var colmod = this.inlineEditSafe.columnModel;
		var td = this.inlineEditSafe.td;

		// if not confirmed with ENTER returns to the old value
		data[colmod.dataIndex] = ( evt && evt.type == "keyup" && evt.key == 'enter') ? this.inlineEditSafe.input.value : this.inlineEditSafe.oldvalue;

		td.innerHTML = colmod.labelFunction ? colmod.labelFunction(data, row, colmod) : data[colmod.dataIndex];

		if (td.innerHTML.length == 0) td.innerHTML = "&nbsp;"; // important because otherwise would not have reacted at the second DBL click

		// decreased event for key = ENTER if the change is made
		if (evt && evt.type == "keyup" && evt.key == 'enter' && this.inlineEditSafe.oldvalue != td.innerHTML){
			// dropped out of the event for
			this.inlineEditSafe.target = this;
			this.fireEvent("editcomplete", this.inlineEditSafe);
		}

		this.inlineEditSafe = null;
	},

	toggle: function(el){
		el.setStyle('display', el.getStyle('display') == 'block' ? 'none' : 'block');
	},

	// API
	getSection: function(row){
		return this.ulBody.getElement('.section-' + row);
	},

	getLiParent: function (target){
		target = $(target);

		while (target && !target.hasClass('td')){
			target = target.getParent();
		}

		if (target) return target.getParent();
	},

	onRowMouseOver: function (evt){
		var li = this.getLiParent(evt.target);
		if (!li) return;

		if (!this.dragging) li.addClass('over');

		this.fireEvent("mouseover", {target:this, row:li.retrieve('row'), element:li });
	},

	onRowMouseOut: function (evt){
		var li = this.getLiParent(evt.target);
		if (!li) return;

		if (!this.dragging)
			li.removeClass('over');

		this.fireEvent("mouseout", {target:this, row:li.retrieve('row'), element:li });
	},

	onRowClick: function (evt){
		var li = this.getLiParent(evt.target);
		if (!li) return;

		if (this.options.selectable){
			var currentindex = li.retrieve('row');
			var selectedNum = this.selected.length;
			var dontselect = false;

			if ((!evt.control && !evt.shift) || !this.options.multipleSelection){
				// clear the old selection
				this.elements.each(function(el){
					el.removeClass('selected')
				}, this);
				this.selected = new Array();
			}

			if (evt.control){
				for (var i = 0; i < selectedNum; i++){
					if (currentindex == this.selected[i]){ // select if it is current
						this.elements[ currentindex ].removeClass('selected');
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
					this.elements[j].addClass('selected');
					this.selected.push(Number(j));
				}
			}

			if (!dontselect){
				li.addClass('selected');
				this.selected.push(Number(li.retrieve('row')));
			}

			this.unique(this.selected, true); // remove all duplicates from selection
		}

		if (this.options.accordion && !this.options.openAccordionOnDblClick) this.accordionOpen(li);
		this.fireEvent("click", {indices:this.selected, target:this, row:li.retrieve('row'), element:li });
	},

	toggleIconClick: function(evt){
		var li = this.getLiParent(evt.target);
		this.accordionOpen(li);
	},

	accordionOpen: function(li){
		var section = this.getSection(li.retrieve('row'));

		if (this.options.autoSectionToggle){

			if (this.lastsection)
				if (this.lastsection != section){
					this.lastsection.setStyle('display', 'none');
					this.lastsection.getPrevious().getElement('.toggleicon').setStyle('background-position', '0 0');
				}

			if (!this.options.accordionRenderer) section.setStyle('display', 'block');
		}

		if (this.options.accordionRenderer) this.toggle(section);

		if (this.options.showToggleIcon)
			li.getElement('.toggleicon').setStyle('background-position', section.getStyle('display') == 'block' ? '-16px 0' : '0 0');

		this.lastsection = section;
	},

	onRowDblClick: function (evt){

		var li = this.getLiParent(evt.target);
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

		if (this.options.accordion && this.options.openAccordionOnDblClick) this.accordionOpen(li);
		this.fireEvent("dblclick", {row:li.retrieve('row'), target:this, element:li});
	},

	onLoadData: function (data){
		this.setData(data);
		this.fireEvent("loaddata", {target:this, pkey:data.pkey});
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

	// API
	loadData: function (url)
	{
		if (!this.options.url && !this.options.dataProvider)
			return;

		var param = {};

		// pagination
		if (this.options.pagination) param = {page:this.options.page, perpage:this.options.perPage};

		// server sorting
		if (this.options.serverSort){
			param.sorton = this.options.sortOn;
			param.sortby = this.options.sortBy;
		}

		if (this.options.filterInput){
			var cfilter = this.container.getElement('input.cfilter');
			if (cfilter) param.filter = cfilter.value;
		}

		this.showLoader();

		if (this.options.dataProvider){
			// load data throw external class
			this.options.dataProvider.loadData(param);
		} else {
			url = (url != null) ? url : this.options.url;

			var request = new Request.JSON({url:url, data:param});
			request.addEvent("complete", this.onLoadData.bind(this));
			request.get();
		}
	},

	// API
	refresh: function(){
		this.loadData();
	},

	// API
	setData: function(data, cm){
		if (!data) return;

		this.options.data = data.data;

		// if not make it default columnModel
		if (!this.options.columnModel) this.setAutoColumnModel();

		if (this.options.pagination){
			this.options.page = parseInt('' + data.page);
			this.options.total = data.total;
			this.options.maxpage = Math.ceil(this.options.total / this.options.perPage);

			this.container.getElement('div.pDiv input').value = data.page;
			var to = (data.page * this.options.perPage) > data.total ? data.total : (data.page * this.options.perPage);
			this.container.getElement('div.pDiv .pPageStat').set('html', ((data.page - 1) * this.options.perPage + 1) + '..' + to + ' / ' + data.total);
			this.container.getElement('div.pDiv .pcontrol span').set('html', this.options.maxpage);
		}

		if (cm){
			// first check is new columnModel different from active one
			if (this.options.columnModel != cm){
				this.options.columnModel = cm;
				// if we change columnModel then we must redraw entire component
				this.draw();
			}
		}

		this.reset();
		this.hideLoader();
	},

	// API
	getData: function(){
		return this.options.data;
	},

	// API
	getDataByRow: function(row){
		if (row >= 0 && row < this.options.data.length) return this.options.data[row];
		return null;
	},

	// API
	setDataByRow: function(row, data){
		if (row >= 0 && row < this.options.data.length){
			this.options.data[row] = data;
			this.reset();
		}
	},

	// API
	setScroll: function(x, y){
		var bDiv = this.container.getElement('.bDiv');
		new Fx.Scroll(bDiv).set(x, y);
	},

	// API
	addRow: function(data, row){
		if (row >= 0){
			if (!this.options.data) this.options.data = [];
			this.options.data.splice(row, 0, data);
			this.reset();
		}
	},

	// API
	deleteRow: function(row){
		if (row >= 0 && row < this.options.data.length){
			this.options.data.splice(row, 1);
			this.reset();
		}
	},

	isHidden: function(i){
		return this.elements[i].hasClass(this.options.filterHideCls);
	},

	hideWhiteOverflow: function(){
		if (this.container.getElement('.gBlock')) this.container.getElement('.gBlock').dispose();

		var pReload = this.container.getElement('div.pDiv .pReload');
		if (pReload) pReload.removeClass('loading');
	},

	showWhiteOverflow: function(i){
		// white overflow & loader
		if (this.container.getElement('.gBlock')) this.container.getElement('.gBlock').dispose();

		var gBlock = new Element('div', {style:'top: 0px; left: 0px; background: white none repeat scroll 0% 0%;  -moz-background-clip: -moz-initial; -moz-background-origin: -moz-initial; -moz-background-inline-policy: -moz-initial; position: absolute; z-index: 999; opacity: 0.5; filter: alpha(opacity=50'});
		var bDiv = this.container.getElement('.bDiv');

		var top = 1;
		top += this.container.getElement('.tDiv') ? this.container.getElement('.tDiv').getSize().y : 0;
		top += this.container.getElement('.hDiv') ? this.container.getElement('.hDiv').getSize().y : 0;

		gBlock.setStyles({width:this.options.width, height: this.options.height - 1, top:0});
		gBlock.addClass('gBlock');

		this.container.appendChild(gBlock);

		var pReload = this.container.getElement('div.pDiv .pReload');
		if (pReload) pReload.addClass('loading');
	},

	showLoader: function(){
		if (this.loader) return;

		this.showWhiteOverflow();

		this.loader = new Element('div', {
			'class':'elementloader',
			'styles':{
				'top': this.options.height / 2 - 16,
				'left': this.options.width / 2
			}
		}).inject(this.container);
	},

	hideLoader: function(){
		if (!this.loader) return;

		this.hideWhiteOverflow();
		this.loader.dispose();
		this.loader = null;

	},

	// API
	selectAll: function(){
		this.elements.each(function(el){
			this.selected.push(el.retrieve('row'));
			el.addClass('selected');
		}, this);
	},

	// API
	unselectAll: function(){
		this.elements.each(function(el){
			el.removeClass('selected');
		}, this);

		this.selected = [];
	},

	// API
	getSelectedIndices: function(){
		return this.selected;
	},

	// API
	setSelectedIndices: function(arr){
		this.selected = arr;

		for (var i = 0; i < arr.length; i++){
			var li = this.elements[arr[i]];
			this.onRowClick({target:li.getFirst(), control:false});
		}
	},

	onMouseOver: function(obj){
		obj.columnModel.onMouseOver(obj.element, obj.data);
	},

	// API
	removeHeader: function(){
		var obj = this.container.getElement('.hDiv');
		if (obj) obj.empty();
		this.options.columnModel = null;
	},

	// API
	removeAll: function(){
		if (this.ulBody) this.ulBody.empty();
		this.selected = new Array();
	},

	// API
	setColumnModel: function(cmu){
		if (!cmu) return;

		this.options.columnModel = cmu;
		this.draw();
	},

	// API
	setColumnProperty: function(columnName, property, value){
		var cmu = this.options.columnModel;

		if (!cmu || !columnName || !property) return;
		columnName = columnName.toLowerCase();

		for (var i = 0; i < cmu.length; i++){
			if (cmu[i].dataIndex.toLowerCase() == columnName){
				cmu[i][property] = value;
				return;
			}
		}
	},

	// quickly determine provide default settings for the column
	setAutoColumnModel: function(){
		if (!this.options.data) return;

		var rowCount = this.options.data.length;
		if (!(rowCount <= 0))return;

		this.options.columnModel = [];

		// get the type of data from the first row
		for (var cn in this.options.data[0]){
			var dataType = typeof(this.options.data[0][cn]) == "number" ? "number" : "string";
			this.options.columnModel.push({header:cn, dataIndex:cn, dataType: dataType, editable:true});
		}

		this.fireEvent("autocolummodel", {target:this, columnModel:this.options.columnModel});
		this.draw();
	},

	// API
	setSize: function(w, h){
		// Width
		this.options.width = w ? w : this.options.width;
		this.container.setStyle('width', this.options.width);

		var width = this.options.width - 2;
		if (this.options.buttons) this.container.getElement('.tDiv').setStyle('width', width);

		var hDiv = this.container.getElement('.hDiv');
		if (this.options.showHeader && hDiv) hDiv.setStyle('width', width);

		var bodyEl = this.container.getElement('.bDiv');
		bodyEl.setStyle('width', width);
		this.container.getElement('.pDiv').setStyle('width', width);

		// Height
		this.options.height = h ? h : this.options.height;

		bodyEl.setStyle('height', this.getBodyHeight());
		this.container.setStyle('height', this.options.height);

		// if it has a gBlock by chance, set it whiteOverflow
		var gBlock = this.container.getElement('.gBlock');
		if (gBlock) gBlock.setStyles({width:this.options.width, height: bodyEl.getSize().y });
	},

	onBodyScroll: function(){
		var hbox = this.container.getElement('.hDivBox');
		var bbox = this.container.getElement('.bDiv');

		var xs = bbox.getScroll().x;
		hbox.setStyle('left', -xs);

		this.rePosDrag();
	},

	onBodyClick: function(){
	},

	onBodyMouseOver: function(){
	},

	onBodyMouseOut: function(){
	},


	// ------------------------- Drag columns events --------------------------------
	rePosDrag: function(){
		if (!this.options.resizeColumns) return;

		var dragTempWidth = 0;
		var cDrags = this.container.getElements('.cDrag div');
		var scrollX = this.container.getElement('div.bDiv').getScroll().x;

		for (var c = 0; c < this.options.columnModel.length; c++){
			var columnModel = this.options.columnModel[c];

			var dragSt = cDrags[c];
			dragSt.setStyle('left', dragTempWidth + columnModel.width + (Browser.Engine.trident ? 1 : 1 ) - scrollX);

			if (!columnModel.hidden)dragTempWidth += columnModel.width;
		}
	},

	onColumnDragComplete: function(target){
		this.dragging = false;

		var colindex = target.retrieve('column');

		// find the first position
		var cDrag = this.container.getElement('div.cDrag');
		var dragSt = cDrag.getElements('div')[colindex];
		var scrollX = this.container.getElement('div.bDiv').getScroll().x;

		// calculate the total width
		this.sumWidth = 0;
		for (var c = 0; c < this.options.columnModel.length; c++){
			var columnModel = this.options.columnModel[c];

			if (c == colindex){
				// adjust column position based on new width
				var pos = dragSt.getStyle('left').toInt() + scrollX - this.sumWidth - (Browser.Engine.trident ? -1 : 1 );
			} else if (!columnModel.hidden)
				this.sumWidth += columnModel.width;
		}

		if (pos < 30) pos = 30; // minimize size of the column

		this.options.columnModel[colindex].width = pos;
		this.sumWidth += pos;

		this.ulBody.setStyle('width', this.sumWidth + this.visibleColumns * (Browser.Engine.trident ? 1 : 1 ));
		var hDivBox = this.container.getElement('div.hDivBox');

		hDivBox.setStyle('width', this.sumWidth + this.visibleColumns * 2);

		// header
		var columns = hDivBox.getElements('div.th');
		var columnObj = columns[colindex];

		columnObj.setStyle('width', pos - (Browser.Engine.trident ? 6 : 6 ));

		var visibleColumns = this.visibleColumns; // used in each below
		var elements = this.ulBody.getElements('li.tr'); // for Accordion

		// all columns in the body
		elements.each(function(el){
			el.setStyle('width', this.sumWidth + 2 * visibleColumns);

			if (!el.hasClass('section')){
				var columns = el.getElements('div.td');
				var columnObj = columns[colindex];
				columnObj.setStyle('width', pos - (Browser.Engine.trident ? 6 : 6 ));
			}

		});

		this.rePosDrag();
	},

	onColumnDragStart: function(){
		this.dragging = true;
	},

	onColumnDragging: function(target){
		target.setStyle('top', 1);
	},

	overDragColumn: function(evt){
		evt.target.addClass('dragging');
	},

	outDragColumn: function(evt){
		evt.target.removeClass('dragging');
	},


	// ------------------------- Header events --------------------------------
	clickHeaderColumn: function(evt){
		if (this.dragging) return;

		var colIndex = evt.target.retrieve('column');
		var columnModel = this.options.columnModel[colIndex];

		evt.target.removeClass(columnModel.sort);
		columnModel.sort = (columnModel.sort == 'ASC') ? 'DESC' : 'ASC';
		evt.target.addClass(columnModel.sort);

		this.sort(colIndex);
	},

	overHeaderColumn: function(evt){
		if (this.dragging) return;

		var colIndex = evt.target.retrieve('column');
		var columnModel = this.options.columnModel[colIndex];

		evt.target.addClass(columnModel.sort);
	},

	outHeaderColumn: function(evt){
		if (this.dragging) return;

		var colindex = evt.target.retrieve('column');
		var columnModel = this.options.columnModel[colindex];

		evt.target.removeClass(columnModel.sort);
	},

	getBodyHeight: function(){
		// the total height of the entire grid is this.options.height have in the body header
		// header
		var headerHeight = this.options.showHeader ? 24 + 2 : 0;  //+2 for the border
		// toolbar
		var toolbarHeight = this.options.buttons ? this.container.getElement('.tDiv').getStyle('height').toInt() : 0;
		// pagination toolbar height 25px + 1px bottom border
		var paginationToolbar = this.options.pagination ? 26 : 0;
		return this.options.height - headerHeight - toolbarHeight - paginationToolbar - 2; //+2 for the border
	},

	renderData: function(){
		this.ulBody.empty();
		this.inlineEditSafe = null;

		if (this.options.data && this.options.data.length){
			var columnCount = this.options.columnModel.length;
			var rowCount = this.options.data.length;

			for (var r = 0; r < rowCount; r++){
				var rowData = this.options.data[r];

				var li = new Element('li');
				li.setStyle('width', this.sumWidth + 2 * this.visibleColumns); 
				li.store('row', r);
				li.addClass('tr');

				this.ulBody.appendChild(li);
				if (this.options.tooltip) this.options.tooltip.attach(tr);

				var firstVisible = -1;
				for (var c = 0; c < columnCount; c++)
				{
					var columnModel = this.options.columnModel[c];

					var div = new Element('div', {'class':'td'});
					div.setStyle('width', columnModel.width - 6); // because of the padding in FF
					li.appendChild(div);

					firstVisible = (!columnModel.hidden && firstVisible == -1) ? c : firstVisible;

					var toggleIcon = "";
					if (firstVisible == c && this.options.accordion && this.options.showToggleIcon) toggleIcon = "<div class='toggleicon'></div>";

					if (columnModel.hidden) div.setStyle('display', 'none');
					if (columnModel.onMouseOver) div.onmouseover = this.onMouseOver.bind(this, {element:div, columnModel:columnModel, data:rowData });

					// title
					if (columnModel.title) div.title = rowData[columnModel.title];

					if (columnModel.dataType == "checkbox"){
						var input = new Element('input', {type:"checkbox"});
						if (columnModel.onChange) input.onclick = this.onSelect.bind(this, {columnModel:columnModel, row:r, input:input});
						div.appendChild(input);

						var val = rowData[columnModel.dataIndex];
						if (val == 1 || val == 't') input.set('checked', true);
					} else if (columnModel.type == "image"){
					} else if (columnModel.type == 'custom'){
						//columnModel.labelFunction(td, this.options.data[r], r);
					} else if (columnModel.labelFunction != null){
						div.innerHTML = columnModel.labelFunction(rowData, r, columnModel);
					} else {
						var str = new String(rowData[columnModel.dataIndex]); // must be a string, and if reaches 0 as the number of error
						if (str == null || str == 'null' || str == 'undefined' || str == "") str = '&nbsp;';

						var trimmed = str.replace(/^\s+|\s+$/g, ''); // see if string is empty
						if (trimmed.length == 0) str = '&nbsp;';

						div.innerHTML = toggleIcon + str;

						// *** reg. event to toggleicon ***
						if (firstVisible == c && this.options.accordion && this.options.showToggleIcon)
							div.getElement('.toggleicon').addEvent('click', this.toggleIconClick.bind(this));
					}
				} // for column

				if (this.options.accordion){
					var li2 = new Element('li');
					li2.addClass('section');
					li2.addClass('section-' + r);
					li2.setStyle('width', this.sumWidth + 2 * this.visibleColumns);

					this.ulBody.appendChild(li2);
					if (this.options.accordionRenderer) this.options.accordionRenderer({parent:li2, row:r, grid:this, rowdata: rowData});
				}
			}
		}
	},

	// --- Main draw function
	draw: function(){
		this.removeAll(); // reset variables and only empty ulBody
		this.container.empty(); // empty all

		// --- common
		var width = this.options.width - (Browser.Engine.trident ? 2 : 2 ); //-2 for the borders
		var columnCount = this.options.columnModel ? this.options.columnModel.length : 0;
		// --- common

		// --- container
		if (this.options.width)	this.container.setStyle('width', this.options.width);
		this.container.addClass('omnigrid');
		// --- container

		// --- toolbar
		if (this.options.buttons){
			var tDiv = new Element('div');
			tDiv.addClass('tDiv');
			tDiv.setStyle('width', width);
			tDiv.setStyle('height', 25 + (Browser.Engine.trident ? 2 : 0 ));// for the borders in FF
			this.container.appendChild(tDiv);

			var bt = this.options.buttons;
			for (var i = 0; i < bt.length; i++){
				var fBt = new Element('div');
				tDiv.appendChild(fBt);
				if (bt[i].separator){
					fBt.addClass('btnseparator');
					continue;
				}

				fBt.addClass('fbutton');

				var cBt = new Element('div');
				cBt.addEvent('click', bt[i].onclick.bind(this, [bt[i].bclass, this]));
				cBt.addEvent('mouseover', function(){
					this.addClass('fbOver');
				});
				cBt.addEvent('mouseout', function(){
					this.removeClass('fbOver');
				});

				fBt.appendChild(cBt);

				var spanBt = new Element('span');
				spanBt.addClass(bt[i].bclass);
				spanBt.setStyle('padding-left', 20);
				spanBt.set('html', bt[i].name);
				cBt.appendChild(spanBt);
			}
		}
		// --- toolbar

		// --- header
		var hDiv = new Element('div');
		hDiv.addClass('hDiv');
		hDiv.setStyle('width', width); // borderi u FF
		this.container.appendChild(hDiv);

		var hDivBox = new Element('div');
		hDivBox.addClass('hDivBox');

		hDiv.appendChild(hDivBox);

		this.sumWidth = 0;
		this.visibleColumns = 0; // differs from the columnCount because data for some columns are of reading but are not shown
		var columnModel,c;
		for (c = 0; c < columnCount; c++){
			columnModel = this.options.columnModel[c];

			var div = new Element('div');
			// default settings columnModel
			if (columnModel.width == null)  this.options.columnModel[c].width = 100;
			columnModel.sort = 'ASC';

			// Header events
			if (this.options.sortHeader){
				div.addEvent('click', this.clickHeaderColumn.bind(this));
				div.addEvent('mouseout', this.outHeaderColumn.bind(this));
				div.addEvent('mouseover', this.overHeaderColumn.bind(this));
			}

			div.store('column', c);
			div.store('dataType', columnModel.dataType);
			div.addClass('th');
			div.setStyle('width', columnModel.width - (Browser.Engine.trident ? 6 : 6 ));
			hDivBox.appendChild(div);

			if (columnModel.hidden) div.setStyle('display', 'none');
			else {
				this.sumWidth += columnModel.width;
				this.visibleColumns++;
			}

			var header = columnModel.header;
			if (header) div.innerHTML = header;
		}
		hDivBox.setStyle('width', this.sumWidth + this.visibleColumns * 2);
		if (!this.options.showHeader) hDiv.setStyle('display', 'none');
		// --- header

		// --- Column size drag
		if (this.options.height){
			var bodyHeight = this.getBodyHeight();
			this.container.setStyle('height', this.options.height);
		}

		if (this.options.resizeColumns){
			var cDrag = new Element('div');
			cDrag.addClass('cDrag');
			var toolbarHeight = this.options.buttons ? tDiv.getStyle('height').toInt() : 0; // toolbar
			cDrag.setStyle('top', toolbarHeight);
			this.container.appendChild(cDrag);

			var dragTempWidth = 0;
			for (c = 0; c < columnCount; c++){
				columnModel = this.options.columnModel[c];

				var dragSt = new Element('div');
				var headerHeight = this.options.showHeader ? 24 + 2 : 0; // +2 border

				dragSt.setStyles({top:1,left: dragTempWidth + columnModel.width, height: headerHeight, display:'block'}); // bodyHeight+
				dragSt.store('column', c);
				cDrag.appendChild(dragSt);

				// Events
				dragSt.addEvent('mouseout', this.outDragColumn.bind(this));
				dragSt.addEvent('mouseover', this.overDragColumn.bind(this));

				var dragMove = new Drag(dragSt, {snap:0});
				dragMove.addEvent('drag', this.onColumnDragging.bind(this));
				dragMove.addEvent('start', this.onColumnDragStart.bind(this));
				dragMove.addEvent('complete', this.onColumnDragComplete.bind(this));

				if (columnModel.hidden) dragSt.setStyle('display', 'none');
				else dragTempWidth += columnModel.width;
			}
		}
		// --- Column size drag

		// --- body
		var bDiv = new Element('div');
		bDiv.addClass('bDiv');

		if (this.options.width) bDiv.setStyle('width', width);

		bDiv.setStyle('height', bodyHeight);
		this.container.appendChild(bDiv);

		//  scroll event
		this.onBodyScrollBind = this.onBodyScroll.bind(this);
		bDiv.addEvent('scroll', this.onBodyScrollBind);
		this.ulBody = new Element('ul');
		this.ulBody.setStyle('width', this.sumWidth + this.visibleColumns * (Browser.Engine.trident ? 1 : 1 ));
		bDiv.appendChild(this.ulBody);

		if (this.options.pagination && !this.container.getElement('div.pDiv')){
			var pDiv = new Element('div');
			pDiv.addClass('pDiv');
			pDiv.setStyle('width', width);
			pDiv.setStyle('height', 25);
			this.container.appendChild(pDiv);

			var pDiv2 = new Element('div');
			pDiv2.addClass('pDiv2');
			pDiv.appendChild(pDiv2);

			var h = '<div class="pGroup"><select class="rp" name="rp">';

			var optIdx;
			var setDefaultPerPage = false;
			for (optIdx = 0; optIdx < this.options.perPageOptions.length; optIdx++){
				if (this.options.perPageOptions[optIdx] != this.options.perPage)
					h += '<option value="' + this.options.perPageOptions[optIdx] + '">' + this.options.perPageOptions[optIdx] + '</option>';
				else {
					setDefaultPerPage = true;
					h += '<option selected="selected" value="' + this.options.perPageOptions[optIdx] + '">' + this.options.perPageOptions[optIdx] + '</option>';
				}
			}

			h += '</select></div>';

			h += '<div class="btnseparator"></div><div class="pGroup"><div class="pFirst pButton"></div><div class="pPrev pButton"></div></div>';
			h += '<div class="btnseparator"></div><div class="pGroup"><span class="pcontrol"><input class="cpage" type="text" value="1" size="4" style="text-align:center"/> / <span></span></span></div>';
			h += '<div class="btnseparator"></div><div class="pGroup"><div class="pNext pButton"></div><div class="pLast pButton"></div></div>';
			h += '<div class="btnseparator"></div><div class="pGroup"><div class="pReload pButton"></div></div>';
			h += '<div class="btnseparator"></div><div class="pGroup"><span class="pPageStat"></div>';

			if (this.options.filterInput) h += '<div class="btnseparator"></div><div class="pGroup"><span class="pcontrol"><input class="cfilter" type="text" value="" style="" /><span></div>';

			pDiv2.innerHTML = h;

			// set this.options.perPage value from this.options.perPageOptions array
			var rpObj = pDiv2.getElement('.rp');
			if (!setDefaultPerPage && rpObj.options.length > 0){
				this.options.perPage = rpObj.options[0].value;
				rpObj.options[0].selected = true;
			}

			pDiv2.getElement('.pFirst').addEvent('click', this.firstPage.bind(this));
			pDiv2.getElement('.pPrev').addEvent('click', this.prevPage.bind(this));
			pDiv2.getElement('.pNext').addEvent('click', this.nextPage.bind(this));
			pDiv2.getElement('.pLast').addEvent('click', this.lastPage.bind(this));
			pDiv2.getElement('.pReload').addEvent('click', this.refresh.bind(this));
			pDiv2.getElement('.rp').addEvent('change', this.perPageChange.bind(this));
			pDiv2.getElement('input.cpage').addEvent('keyup', this.pageChange.bind(this));

			if (this.options.filterInput) pDiv2.getElement('input.cfilter').addEvent('change', this.firstPage.bind(this)); // goto 1 & refresh
		}
		// --- body
	},

	firstPage: function(){
		this.options.page = 1;
		this.refresh();
	},

	prevPage: function(){
		if (this.options.page > 1){
			this.options.page--;
			this.refresh();
		}
	},

	nextPage: function(){
		if ((this.options.page + 1) > this.options.maxpage) return;
		this.options.page++;
		this.refresh();
	},

	lastPage: function(){
		this.options.page = this.options.maxpage;
		this.refresh();
	},

	perPageChange: function(){
		this.options.page = 1;
		this.options.perPage = this.container.getElement('.rp').value;
		this.refresh();
	},

	pageChange: function(){
		var np = this.container.getElement('div.pDiv2 input').value;

		if (np > 0 && np <= this.options.maxpage){
			if (this.refreshDelayID) $clear(this.refreshDelayID);
			this.options.page = np;
			this.refreshDelayID = this.refresh.delay(1000, this);
		}
	},

	// API
	gotoPage: function(p){
		if (p > 0 && p <= this.options.maxpage){
			this.options.page = p;
			this.refresh();
		}
	},

	setPerPage: function(p){
		if (p > 0){
			this.options.perPage = p;
			this.refresh();
		}
	},

	// API, not doc
	sort: function(index, by){
		if (index < 0 || index >= this.options.columnModel.length) return;

		if (this.options.onStart) this.fireEvent('onStart');

		var header = this.container.getElements('.th');
		var el = header[index];

		if (by != null) el.addClass(by.toLowerCase());
		if (el.hasClass('ASC')) el.sortBy = 'ASC';
		else if (el.hasClass('DESC')) el.sortBy = 'DESC';

		if (this.options.serverSort){
			this.options.sortOn = this.options.columnModel[index].dataIndex;
			this.options.sortBy = el.sortBy;
			this.refresh();
		} else {
			// Sorting...
			this.elements.sort(el.compare);
			this.elements.injectInside(this.ulBody);

			// Update selection array because indices has been changed
			this.selected = new Array();
			this.elements.each(function(el){
				if (el.hasClass('selected')) this.selected.push(el.retrieve('row'));
			}, this);

			// Filter
			if (this.filtered) this.filteredAltRow();
			else this.altRow();
		}
	},

	altRow: function(){
		this.elements.each(function(el,i){
			if(i % 2) el.removeClass('erow');
			else el.addClass('erow');
		});
	},

	filteredAltRow: function(){
		this.ulBody.getElements('.'+this.options.filterSelectedCls).each(function(el,i){
			if(i % 2) el.removeClass('erow');
			else el.addClass('erow');
		});
	},

	// API
	filter: function(form){
		var key = '';
		if (!(form.length > 0)) this.clearFilter();
		key = form;

		if (key){
			for (var i = 0; i < this.options.data.length; i++){
				var dat = this.options.data[i];

				for (var c = 0; c < this.options.columnModel.length; c++){
					var columnModel = this.options.columnModel[c];
					if (columnModel.type == "checkbox") continue;

					var el = this.elements[i];
					if (this.options.filterHide) el.removeClass('erow');

					if (dat[columnModel.dataIndex] != null && dat[columnModel.dataIndex].toLowerCase().indexOf(key) > -1){
						el.addClass(this.options.filterSelectedCls);
						if (this.options.filterHide) el.removeClass(this.options.filterHideCls);
						break;
					} else {
						el.removeClass(this.options.filterSelectedCls);
						if (this.options.filterHide) el.addClass(this.options.filterHideCls);
					}
				}
			}

			if (this.options.filterHide){
				this.filteredAltRow();
				this.filtered = true;
			}
		}
	},

	// API
	clearFilter: function(){
		this.elements.each(function(el){
			el.removeClass(this.options.filterSelectedCls);
			if(this.options.filterHide) el.removeClass(this.options.filterHideCls);
		}, this);
		if(this.options.filterHide){
			this.altRow();
			this.filtered = false;
		}
	}
});
