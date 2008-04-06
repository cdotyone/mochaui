/*
   tablesoort.js
   Javascript - fast sortable tables
   Author dirk hoeschen (www.dirk-hoeschen.de)
   this script is public domain
*/

tableSoort = new Class({
	options:{
		table: 'sorttable',
		column : -1
	},
	initialize: function (table) {
		this.options.table = table;
		if (Browser.Engine.gecko || Browser.Engine.webkit || Browser.Engine.presto){
			$(this.options.table).setStyle('width', '100%');			
		}
		
		// prepare table header cells
		this.titles = $$('#'+table+' thead th');
		i=0;
  	this.titles.each(function(cell) {
			cell.setProperty('column',i);
			cell.addEvent('click',function(){ this.sort(cell); }.bind(this));
			if (cell.className=="asc") this.options.column = i;
			i++;
		}.bind(this));
	},
	sort: function(cell) {	        		                 
		var column = cell.getProperty('column');
		var rows = $$('#'+this.options.table+' tbody tr');		
		if(!rows[0].childNodes[column]) return; //table is empty
    // Fill array with - values and IDs *fast*
    var values = new Array;
    for (var i = 0; i < rows.length; i++) {
       	values.push(rows[i].getElementsByTagName("td")[column].innerHTML+"|"+i);
    }
    this.asc = (cell.className == 'asc') ?  false : true;
    // reverse only if already sorted
    if (column==this.options.column) { 
   	   	   values.reverse();   
    } else {
      // use internal array sort -  special handling for numeric values
      switch (cell.getProperty('axis')) {
       	case 'string': values.sort(); break;       	     
       	case 'number': values.sort(this.numsort); break;       	     
      }
	   }            
     // rebuild table body into tbody element
     var tBody = new Element('tbody');
  	 for (var i = 0; i < values.length; i++) {
        	n = values[i].split("|").pop(); // get index;
        	rows[n].className = (i % 2) ? rows[n].className.replace('odd' , 'even') : rows[n].className.replace('even' , 'odd') ;        	
        	tBody.appendChild(rows[n])
    }
    /* IE doesnt allow replace table innerHTML... therefore we use a trick */
    //$(this.options.table).replaceChild(tBody,$(this.options.table).lastChild);
	$$('#' + this.options.table + ' tbody').destroy();
	tBody.injectAfter($(this.options.table).lastChild);
		if (this.options.column>=0)  this.titles[this.options.column].className = "";
		this.options.column = column;
    // Change table header class	
    cell.className = (this.asc) ? "asc" : "desc";
	},
	numsort: function(a,b) {
		a = parseInt(a.split("|").shift());
		b = parseInt(b.split("|").shift());
		return a-b;
	}
});
tableSoort.implement(new Options, new Events);