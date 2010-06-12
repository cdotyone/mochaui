/*

 Script: CheckBoxGrid.js
 Create a columns and rows of checkbox/radio buttons

 Copyright:
 Copyright (c) 2010 Chris Doty, <http://polaropposite.com/>.

 License:
 MIT-style license.

 */

MUI.files[MUI.path.plugins + 'MUI/CheckBoxGrid/CheckBoxGrid.js'] = 'loaded';

MUI.CheckBoxGrid = new NamedClass('MUI.CheckBoxGrid', {

    Implements: [Events, Options, Log],

    options: {
        id:                 ''              // id of the primary element, and id os control that is registered with mocha
        ,container:         null           // the parent control in the document to add the control to
        ,createOnInit:      true           // true to add tree to container when control is initialized
        ,cssClass:          'cbg'          // the primary css tag
        ,title:             false          // the title to place above the controls

        ,items:             $A([])         // the array list of nodes

        ,textField:         'text'          // the name of the field that has the item's text
        ,valueField:        'value'         // the name of the field that has the item's value
        ,isSelectedField:   'selected'      // the name of the field that has the item's isSelected state

        ,width:             0               // width of the control
        ,height:            0               // height of the control when not in drop list mode, or height of drop
        ,type:              'checkbox'      // can be 'checkbox' or 'radio'
        ,labelPlacement:    'right'         // can be 'left' or 'right'
        ,value:             ''              // the currently selected item's value

        ,onItemClick:       $empty
        ,onValueChanged:    $empty
    },

    initialize: function(options) {
        this.setOptions(options);

        // make sure this controls has an ID
        var id = this.options.id;
        if (!id) {
            id = 'checkBoxGrid' + (++MUI.IDCount);
            this.options.id = id;
        }
        
        this.enableLog().log('cbg:'+id+':init');

        // create sub items if available
        if (this.options.createOnInit && this.options.items.length > 0) this.toDOM(); else if ($(id)) this.fromHTML(id);

        MUI.set(id, this);
    },

    _getData: function(item,property){
        if(!item || !property) return '';
        if(item[property]==null) return '';
        return item[property];
    },
    
    toDOM: function(containerEl) {
        var self = this,o = this.options;

        // create main wrapper control
        var fs = $(o.id);
        var isNew = false;
        if (!fs) {
            fs = new Element('fieldset', {'id':o.id+'_field','class':o.cssClass});
            if (o.width) fs.setStyle('width', (parseInt('' + o.width) - 2));
            if (o.height) fs.setStyle('height', parseInt('' + o.height));
            isNew = true;
        }
        if (o.cssClass) fs.set('class', o.cssClass);
        self.element = fs;

        // add title if given
        if(o.title)  new Element('div',{'id':o.id+'_tle','text':o.title}).inject(fs);
        
        for(var i=0;i<o.items.length;i++) {
            self.buildItem(o.items[i],fs,i);
        }

        if (!isNew) return this;
        window.addEvent('domready', function() {
            fs.inject($(containerEl ? containerEl : o.container));
            self.convertToGrid.delay(1,self,[fs]);
        });

        return this;
    },

    buildItem: function(item,fs,num)
    {
        var self = this,o = this.options;

        item._span=new Element('span',{'id':o.id+num+'_field',styles:{'textAlign':o.labelPlacement=='left'?'right':'left'}}).inject(fs);

        var inp=new Element('input',{'id':o.id+num,'name':o.id,'type':o.type}).inject(item._span);
        var value=self._getData(item,o.valueField);
        if(value) inp.set('value',value);
        var isSelected=self._getData(item,o.isSelectedField);
        if(isSelected) inp.set('checked','true');
        item._input=inp;
        inp.addEvent('click',function(e) { self.click(inp,self,e); });

        var text=self._getData(item,o.textField);
        item._label = new Element('label',{'text':text,'for':o.id+num}).inject(item._span,o.labelPlacement=='left'?'top':'bottom');

        return inp;
    },

    click: function(inp,self,e) {
        self.fireEvent('itemClick',[inp.checked,inp,self,e]);

        var o = self.options;
        var values=[];
        $A(o.items).each(function(item){
            if(item._input.checked) values.push(item._input.value);
        });
        o.value = values.join(',');
        self.fireEvent('valueChanged',[o.value,self,e]);
    },
    
    convertToGrid: function(fs) {
        var self = this,o = this.options;
        if(!fs) fs = $(o.id);

        var reinject = function(pair,tr,colspan) {
            pair[1]=colspan;
            pair[0]._td=new Element('td',{'colspan':colspan}).inject(tr);
            pair[0]._span.getChildren().each(function(el) { el.dispose().inject(pair[0]._td); } );
            pair[0]._span.dispose();
            pair[0]._span=null;
            if(o.labelPlacement=='left') pair[0]._td.setStyle('text-align','right');
        };
        
        var rows=$H({});
        o.items.each(function(item) {
            var c=item._span.getCoordinates();
            if(!rows['row'+c.top]) rows['row'+c.top]=[];
            rows['row'+c.top].push([item,c.width]);
        });

        // find the row with the most columns
        var lv=0,lk;
        rows.each(function(row,k) {
            if(lv<row.length) { lk=k; lv=row.length; }
        });

        // now get widths of the columns
        var cols=$A([]),twidth=0;
        $A(rows[lk]).each(function(pair) {
            cols.push(pair[1]);
            twidth+=pair[1];
        });

        // check to make sure total width is used
        if(twidth<o.width) {
            for(var i=0;i<cols.length;i++) {
                cols[i]=Math.round((cols[i]/twidth)*o.width);
            }
        }

        // build table to hold newly arranged controls
        self._table=new Element('table',{'cellspacing':'0','cellpadding':'0','border':'0'}).inject(fs);
        self._tbody=new Element('tbody').inject(self._table);

        // determine colspan for other columns in other rows
        var clen=cols.length;
        rows.each(function(row) {
            // create table row for this row
            var tr=new Element('tr').inject(self._tbody);

            // rows with the same length as the largest rows do not need colspan determination
            if(row.length==clen) {
                for(var j=0;j<clen;j++) {
                    row[j][1]=reinject(row[j],tr,1);
                }
                return;
            }

            // determine colspan for this row
            var i=0,tspan=0;
            $A(row).each(function(col){
                var cwidth=col[1]
                    ,twidth=0
                    ,colspan=1;

                // keep increasing colspan until we have enough support this column
                for(var j=i; j<clen && i<clen; j++,i++,colspan++) {
                    twidth+=cols[j];
                    if(twidth>=cwidth) break;
                }

                // convert span to table cell
                reinject(col,tr,colspan);
                tspan+=colspan;
            });

            // make sure the total colspans in this row is at least the same as our largest row
            while(tspan<clen) {
                row[row.length-1][1]++;
                row[row.length-1][0]._td.set('colspan',row[row.length-1][1]);
                tspan++;
            }

            if(tspan>clen) {
                // went past the end of the longest row, so move all items to same cell
                row[0][0]._td.set('colspan',clen);
                for(i=1;i<row.length;i++) {
                    row[i][0]._td.getChildren().each(function(el) { el.dispose().inject(row[0][0]._td); } );
                    row[i][0]._td.dispose();
                    row[i][0]._td=null;
                }
            }
        });
    }
});
