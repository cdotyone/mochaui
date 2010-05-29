/*

Script: List.js
	Creates a generic list

Copyright:
	Copyright (c) 2010 Chris Doty, <http://polaropposite.com/>.

License:
	MIT-style license.

*/

MUI.files[MUI.path.plugins + 'mochaList/List.js'] = 'loaded';

MUI.List = new Class({
    Implements: [Events, Options],

    options: {
        id:                 ''          // id of the primary element, and id os control that is registered with mocha
       ,container:          null        // the parent control in the document to add the control to
       ,createOnInit:       true        // true to add tree to container when control is initialized
       ,cssClass:           'list'      // the primary css tag

       ,showCommand:        true        // turns row commands on or off
       ,commands:           $A([])      // commands to be used
       ,iconPath:           ''          // parent path to command icons

       ,items:              $A([])      // the array list of nodes
       ,columns:            $A([])      // the list of columns to be used

       ,showCheckBox:       false       // true to show checkBoxes
       ,navigateURL:        ''          // the base url to navigate from
       ,canSelect:          true        // can the user select a row by clicking it
       ,value:              ''          // the currently selected item's value
       ,selectedItem:       null        // the currently selected item

       ,onItemCommand:      $empty      // event: when a command is performed
       ,onItemSelected:     $empty      // event: when a node is selected
       ,onItemChecked:      $empty      // event: when a node is selected
       ,onItemColumnBound:  $empty      // event: when a node's column is bound to the data
    },

    initialize: function(options) {
        this.setOptions(options);

        // make sure this controls has an ID
        var id=this.options.id;
        if(!id) { id='list' + (++MUI.IDCount); this.options.id=id; }

        // create sub items if available
        if(this.options.createOnInit && this.options.items.length>0) this.toDOM();
        else if($(id)) this.fromHTML(id);

        MUI.set(id,this);        
    },

    toDOM: function(containerEl) {
        var self = this;
        var o = self.options;

        // see if we need build columns automagically
        if(o.columns==null || o.columns.length==0) {
            var ii=0;
            o.columns=[];
            var first=$H(o.items[0]);
            first.each(function(value,key) {
                var h={'text':key,'name':key};
                if($type(value)=='boolean') h.type='checkbox';
                if(ii==0) h['value'] = key;
                o.columns.push(h);
                i++;
            });
        }

        // build control's wrapper div
        var div = $(self.id);
        var isNew = false;
        if (!div) {                     // check to see if it is already on DOM
            div = new Element('div');
            div.id = o.id;
            isNew = true;
        }
        if (o.cssClass) div.set('class',o.cssClass);
        self.element = div;

        //-------------------------
        // build table
        var table = div.getElement('table');
        if(!table) { table=new Element('table',{'cellSpacing':0,'cellPadding':0,'styles':{'width':'100%'}}).inject(div); }

        // build column headers
        var tbody = table.getElement('tbody');
        var i,tr;
        if(!tbody) {
            tbody=new Element('tbody').inject(table);

            tr = new Element('tr',{'class':'head'}).inject(tbody);
            var cl = o.columns;
            for (i = 0; i < cl.length; i++) {
                var td = new Element('td',{'html':cl[i].text.replace(new RegExp(/\|/g), '<br/>'),'valign':'bottom'}).inject(tr);
                if (i == 0) { td.addClass('First'); }
                if(cl[i].align) { td.set('align',cl[i].align); }
            }

            // add command headers if they have commands
            if (o.commands && o.commands.length > 0) {
                tr.appendChild(new Element('td',{'class':'head','html':'&nbsp;'}));
            }
        }

        // determine currently selected item
        var value = o.value;

        // build rows
        var items = o.items;
        if(items) {
            for (i = 0; i < items.length; i++) {
                // build the row
                var item=items[i];
                self.buildItem(item,tbody);
                tr = item._element;

                // select row if it needs to selected
                var sel = (item.value == value && value!='');
                item.selected = sel;
                if (sel) tr.addClass('C');
                else if(i % 2) tr.addClass('alt');
            }
        }
        //-------------------------

        if(!isNew) return this;

        // add control to document
        window.addEvent('domready', function() {
            var container=$(containerEl ? containerEl : o.container);
            container.appendChild(div);
        });
        
        return self;
    },

    buildItem: function(item,parent) {
        var self = this;
        var o=self.options;
        var id = o.id;

        var cl = o.columns;
        var value = '' + self._getData(item, cl[0].value);
        if (!value) value = '' + parent.childNodes.length;
        var rid = id + '_' + value.replace(/[\s\.]/g, '_');

        var tr = $(rid);
        if (!tr) tr = $(new Element('tr', { 'id': rid })).inject(parent);
        item._element = tr;

        var i,td,tid,img,a;
        for (i = 0; i < cl.length; i++) {
            var col = cl[i];
            tid = rid + '_' + i;
            td = tr.getElementById(tid);

            // create column cell
            if (td) td.empty();
            else { td = new Element('td', { 'id': tid }).inject(tr); }
            if (col.align) { td.set('align', col.align); }
            if (col.cssClass) td.set('class',col.cssClass);

            // create items text node
            var txt = document.createTextNode(self._getData(item, col.name));

            if (i == 0) {
                // special handling of first column
                if (o.showCheckBox) {
                    var cb = new Element('input', { 'type': 'checkbox', 'name': id + '$checked', 'value': value }).inject(td);
                    cb.addEvent('click', function(event) { event.stopPropagation(); self.fireEvent('itemChecked', [item,self,parent]); });
                } else if (!self.value) td.addEvent('click', function(event) { event.stopPropagation(); });

                // create image if needed
                if (col.image) {
                    var cImage = self._getData(item, col.image);
                    cImage.replace(/~/g, o.iconPath);
                    if (cImage) img = new Element('img',{'alt':'','src':cImage});
                }

                if (o.canSelect) {
                    a = new Element('a', { 'styles': { 'text-decoration': 'underline'} });

                    // add tip
                    if (col.tipTitle) {
                        tip = self._getData(item, col.tipTitle);
                        if (tip) {
                            a.store('tip:title', tip);
                            a.set('class', 'Tips');
                        }
                    }
                    if (col.tipText) {
                        tip = self._getData(item, col.tipText);
                        if (tip) {
                            a.store('tip:text', tip);
                            a.set('class', 'Tips');
                        }
                    }

                    // add navigational link
                    if (col.URL) {
                        if (col.Target) {
                            var tgt = self._getData(item, col.target);
                            if (tgt) { a.target = tgt; }
                        }
                        if (col.urlCssClass) {
                            var cls = self._getData(item, col.Target, col.urlCssClass);
                            if (cls) { a.set('class', tgt); }
                        }

                        var url = self._getData(item, col.Target, col.urlCssClass);
                        if (url) {
                            url = url.replace(/~/, o.navigateURL);
                            a.set('href', url);
                        }
                    } else a.setStyle('text-decoration', 'none');

                    // add image
                    if (img) {
                        a.setStyle('text-decoration', 'none');
                        a.appendChild(img);
                        var s = new Element('a', { 'styles': { 'text-decoration': 'underline'} }).inject(a);
                        s.appendChild(txt);
                    } else a.appendChild(txt);

                    td.appendChild(a);

                    // create tip object
                    if (col.tipTitle) var tip = new Tips(new Array(a), { maxTitleChars: 50 });
                } else { if (img) td.appendChild(img); td.appendChild(txt); }
            } else {
                // add columns
                if(col.type == "checkbox") {
                    var chk=new Element('input', { 'type': 'checkbox', 'name': id + '_' + col.name, id:id + '_' + col.name + i ,'value':value }).inject(td);
                    if((''+self._getData(item, col.name))=='true') chk.set('checked','true');
                } else td.appendChild(txt);
            }
            self.fireEvent('itemColumnBound', [item,self,col,td] );
        }

        var cm=o.commands;
        if (cm && cm.length > 0 && o.showCommand) {
            tid = rid + '_commands';

            // create command cell
            td = tr.getElementById(tid);
            if (td) td.empty();
            else { td = new Element('td', { 'id': tid }); tr.appendChild(td); }

            for (i = 0; i < cm.length; i++) {
                var cmd = cm[i];

                // show event is used to determine if commands should be displayed
                var showEvt = self.canShowEvent(self,item,cmd.name);
                if (showEvt) {
                    a = $(new Element('a'));
                    a.title = cmd.text;
                    a.href = "#" + cmd.name;
                    a.addEvent('click', function(e) { self.onItemCommand(e,item,parent,cmd); return false; });

                    td.appendChild(a);

                    if(cmd.image) {
                        img = new Element('img');
                        img.alt = cmd.text;
                        img.src = o.iconPath + cmd.image;
                        a.appendChild(img);
                    } else {
                        a.set('html',cmd.text);
                    }
                }
            }
        }

        // add select events
        if (o.canSelect) {
            tr.removeEvents('mouseover');
            tr.removeEvents('mouseout');
            tr.removeEvents('click');
            tr.addEvent('mouseover', function(e) { self.onItemOver(e,item,parent); });
            tr.addEvent('mouseout', function(e) { self.onItemOut(e,item,parent); });
            tr.addEvent('click', function(e) { self.onItemClick(e,item,parent); });
        }

        return tr;
    },

    _getData: function(item,property){
        if(!item || !property) return '';
        if(item[property]==null) return '';
        return item[property]; 
    },

    onItemCommand: function(e,item,parent,cmd) {
        var self = this;
        e = new Event(e);
        e.stop();
        var t = $(e.target);
        if (t.nodeName != 'A') t = t.getParent('a');
        var img = t.getElement('img');
        self.fireEvent('itemCommand', [item,self,cmd,img]);
    },

    onItemClick: function(e,item,parent) {
        var self = this;
        var o=self.options;

        // set last selected for entire control
        o.value = item.value;
        o.selectedItem = item;

        self.fireEvent('itemSelected', [item,self,parent]);
        if (item._element || parent) {
            if(!parent) parent=item._element.getParent();
            parent.getElements('.C').removeClass('C');
            item._element.addClass('C');
        }
        return this;
    },

    onItemOver: function(e,item) {
        if (item._element) { item._element.addClass('O'); }
        return this;
    },

    onItemOut: function(e,item) {
        if (item._element) { item._element.removeClass('O'); }
        return this;
    },    

    canShowEvent: function() { return true; },

    update: function(items)
    {
        var self=this;
        self.options.items = items;
        self.toDOM();
    }
});

