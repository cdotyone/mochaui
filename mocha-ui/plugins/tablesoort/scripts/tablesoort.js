/*
   tablesoort.js
   Javascript - fast sortable tables
   Author dirk hoeschen (www.dirk-hoeschen.de)
   this script is public domain
*/
 
tableSoort = new Class({
	Implements: Options,
 
	options: {
		table: 'sorttable',
		column : -1
	},
	initialize: function(table,options) {
		this.setOptions(options);
		this.table = $(table);
		this.titles = this.table.getElements('thead tr th');
		this.updateRowsClass();
		this.titles.each(function(cell,i) {
			cell.store('column',i);
			cell.addEvent('click', this.sort.bind(this,cell));
			if(cell.hasClass('asc')) this.options.column = i;
		},this);
	},
 
	sort: function(cell) {
		var column = cell.retrieve('column');
		var rows = this.table.getElements('tbody tr');		
		if(!rows[0].getChildren()[column]) return; //table is empty
		// Fill array with - values and IDs *fast*
		var values = new Array;
		rows.each(function(row,i){
			values.push(row.getChildren()[column].get('html')+"|"+i);
		});
		this.asc = (cell.hasClass('asc')) ?  false : true;
		// reverse only if already sorted
		if(column == this.options.column) {
			values.reverse();
		} else {
			// use internal array sort -  special handling for numeric values
			switch (cell.getProperty('axis')) {
				case 'string':
					values.sort();
					break;
				case 'number':
					values.sort(this.numsort);
					break;
			}
		}
		// rebuild table body into tbody element
		var tBody = new Element('tbody');
		values.each(function(value,i){
			n = value.split("|").pop(); // get index;   	
			rows[n].inject(tBody);
		});
 
		tBody.replaces(this.table.getElement('tbody'));
		if(this.options.column >= 0) this.titles[this.options.column].removeClass('asc').removeClass('desc');
		this.options.column = column;
		// Change table header class
		if(this.asc){
			cell.addClass('asc').removeClass('desc');
		}else{
			cell.addClass('desc').removeClass('asc');
		}
		this.updateRowsClass();
	},
 
	updateRowsClass:function(){
		this.table.getElements('tbody tr:even').removeClass('odd').addClass('even');
		this.table.getElements('tbody tr:odd').removeClass('even').addClass('odd');
	},
 
	numsort: function(a,b) {
		a = (a.split("|").shift()).toInt();
		b = (b.split("|").shift()).toInt();
		return a-b;
	}
});
tableSoort.implement(new Options, new Events);