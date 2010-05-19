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
          id: ''
        , createOnInit:     true
        , cssClass:         'list'
        , value:            ''
        , canSelect:        true
        , showCheckBoxes:   false
        , checked:          null
        , showCommand:      true
        , items:            $A([])
        , columns:          $A([])
        , commands:         $A([])         
        , groups:           $A([])
        , navigateURL:      ''
        , iconPath:         ''

        , onCommand:        $empty
        , onItemSelected:   $empty
        , onItemColumnBound:$empty
    },

    initialize: function(options) {

        this.setOptions(options);

        // make sure this controls has an ID
        var id=this.options.id;
        if(!id) { id='list' + (++MUI.IDCount); this.options.id=id; }

        // create sub items if available
        if(this.options.createOnInit && (this.options.items.length>0 || this.options.groups.length>0)) this.toDOM();
        else if($(id)) this.fromHTML(id);

        MUI.set(id,this);        
    },

    toDOM: function(containerEl) {
        var self = this;
        var o = self.options;

        var div = $(self.id);
        var isNew = false;
        if (!div) {
            div = new Element('div');
            div.id = o.id;
            isNew = true;
        }
        if (o.cssClass) div.set('class',o.cssClass);
        self.element = div;

        if(o.groups.length==0) {
            if(o.columns.length==0) return self;
            self.buildGroup({'columns':o.columns,'items':o.items,'commands':o.commands,'id':'g0'},div);
        } else {
            for (var i = 0; i < o.groups.length; i++) {
                var g=o.groups[i];
                if(!g.id) g.id='g'+i;
                self.buildGroup(g,div);
            }
        }

        if(!isNew) return this;

        window.addEvent('domready', function() {
            var container=$(containerEl ? containerEl : o.container);
            container.appendChild(div);
        });
        
        return self;
    },

    buildGroup: function(group,parent) {
        var self = this;
        var o=self.options;
        var gid=o.id+'_'+group.id;

        var div = $(gid);
        if(!div) { div=new Element('div',{'id':gid,'styles':{'overflow':'auto'}}).inject(parent); }
        if (group.cssClass) div.set('class',group.cssClass);
        else if (o.cssClass) div.set('class',o.cssClass);

        var table = div.getElement('table');
        if(!table) { table=new Element('table',{'cellSpacing':0,'cellPadding':0,'styles':{'width':'100%'}}).inject(div); }

        var tbody = table.getElement('tbody');
        var i,tr;
        if(!tbody) {
            tbody=new Element('tbody').inject(table);

            tr = new Element('tr',{'class':'head'}).inject(tbody);
            var cl = group.columns;
            for (i = 0; i < cl.length; i++) {
                var td = new Element('td',{'html':cl[i].text.replace(new RegExp(/\|/g), '<br/>'),'valign':'bottom'}).inject(tr);
                if (i == 0) { td.addClass('First'); }
                if(cl[i].align) { td.set('align',cl[i].align); }
            }

            if (group.commands && group.commands.length > 0) {
                tr.appendChild(new Element('td',{'class':div.className + 'Head','html':'&nbsp;'}));
            }
        }

        var value = o.value;
        var items = group.items;
        if(items) {
            for (i = 0; i < items.length; i++) {
                var item=items[i];
                self.buildItem(item,group,tbody);
                tr = item._element;

                var sel = (item.value == value && value!='');
                item.Selected = sel;
                if (sel) tr.addClass('C');
                else if(i % 2) tr.addClass('alt');
            }
        }

        return div;
    },

    buildItem: function(item,group,parent) {
        var self = this;
        var o=self.options;
        var id = self.options.id;

        var cl = group.columns;
        var value = '' + self._getItem(item, cl[0].value);
        if (!value) value = '' + parent.childNodes.length;
        var rid = id + '_' + group.id + '_' + value.replace(/[\s\.]/g, '_');

        var tr = $(rid);
        if (!tr) tr = $(new Element('tr', { 'id': rid })).inject(parent);
        item._element = tr;

        var i,td,tid,img,a;
        for (i = 0; i < cl.length; i++) {
            var col = cl[i];
            tid = rid + '_' + i;
            td = tr.getElementById(tid);

            if (td) td.empty();
            else { td = new Element('td', { 'id': tid }).inject(tr); }

            if (col.align) { td.set('align', col.align); }
            if (col.cssClass) td.set('class',col.cssClass);

            var txt = document.createTextNode(self._getItem(item, col.name));

            if (i == 0) {
                if (o.showCheckBoxes) {
                    var cb = new Element('input', { 'type': 'checkbox', 'name': id + '$checked', 'value': value }).inject(td);
                    cb.addEvent('click', function(event) { event.stopPropagation(); });
                    td.removeEvents('click');
                    td.addEvent('click', function(event) { event.stopPropagation(); if (!o.canSelect) cb.checked = !cb.checked });
                } else if (!self.value) td.addEvent('click', function(event) { event.stopPropagation(); });

                if (col.Image) {
                    var cImage = self._getItem(item, col.image);
                    cImage.replace(/~/g, o.iconPath);
                    if (cImage) img = new Element('img',{'alt':'','src':cImage});
                }

                if (o.canSelect) {
                    a = new Element('a', { 'styles': { 'text-decoration': 'underline'} });

                    if (col.tipTitle) {
                        tip = self._getItem(item, col.tipTitle);
                        if (tip) {
                            a.store('tip:title', tip);
                            a.set('class', 'Tips');
                        }
                    }
                    if (col.tipText) {
                        tip = self._getItem(item, col.tipText);
                        if (tip) {
                            a.store('tip:text', tip);
                            a.set('class', 'Tips');
                        }
                    }
                    if (col.URL) {
                        if (col.Target) {
                            var tgt = self._getItem(item, col.target);
                            if (tgt) { a.target = tgt; }
                        }
                        if (col.urlCssClass) {
                            var cls = self._getItem(item, col.Target, col.urlCssClass);
                            if (cls) { a.set('class', tgt); }
                        }

                        var url = self._getItem(item, col.Target, col.urlCssClass);
                        if (url) {
                            url = url.replace(/~/, o.navigateURL);
                            a.set('href', url);
                        }
                    } else a.setStyle('text-decoration', 'none');

                    if (img) {
                        a.setStyle('text-decoration', 'none');
                        a.appendChild(img);
                        var s = new Element('a', { 'styles': { 'text-decoration': 'underline'} }).inject(a);
                        s.appendChild(txt);
                    } else a.appendChild(txt);

                    td.appendChild(a);

                    if (col.tipTitle) var tip = new Tips(new Array(a), { maxTitleChars: 50 });
                } else { if (img) td.appendChild(img); td.appendChild(txt); }
            } else {
                if(col.type == "checkbox") {

                    var chk=new Element('input', { 'type': 'checkbox', 'name': id + '_' + col.name, id:id + '_' + col.name + i ,'value':value }).inject(td);
                    if((''+self._getItem(item, col.name))=='true') chk.set('checked','true');
                } else td.appendChild(txt);
            }
            self.fireEvent('itemColumnBound', [item,group,self,col,td] );
        }

        var cm = group.commands;
        if (cm && cm.length > 0 && o.showCommand) {
            tid = rid + '_commands';

            td = tr.getElementById(tid);
            if (td) td.empty();
            else { td = new Element('td', { 'id': tid }); tr.appendChild(td); }

            for (i = 0; i < cm.length; i++) {
                var cmd = cm[i];

                var showEvt = self.canShowEvent(self,item,group,cmd.name);
                if (showEvt) {
                    a = $(new Element('a'));
                    a.title = cmd.text;
                    a.href = "#" + cmd.name;
                    a.addEvent('click', function(e) { self.onItemCommand(e,item,group,parent,cmd); return false; });

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
        } else {
            if (group.commands && group.commands.length > 0) {
                tr.appendChild(new Element('td', { 'html': '&nbsp;' }));
            }
        }

        if (o.canSelect) {
            tr.removeEvents('mouseover');
            tr.removeEvents('mouseout');
            tr.removeEvents('click');
            tr.addEvent('mouseover', function(e) { self.onItemOver(e,item,group,parent); });
            tr.addEvent('mouseout', function(e) { self.onItemOut(e,item,group,parent); });
            tr.addEvent('click', function(e) { self.onItemClick(e,item,group,parent); });
        }

        return tr;
    },

    _getItem: function(item,property){
        if(!item || !property) return '';
        if(!item[property]) return '';
        return item[property]; 
    },

    onItemCommand: function(e,item,group,parent,cmd) {
        var self = this;
        e = new Event(e);
        e.stop();
        var t = $(e.target);
        if (t.nodeName != 'A') t = t.getParent('a');
        var img = t.getElement('img');
        self.fireEvent('command', [item,group,self,cmd,img]);
    },
    
    onItemClick: function(e,item,group,parent) {
        var self = this;
        self.value = item.value;

        self.fireEvent('itemSelected', [item,group,self,parent]);
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

    update: function(groups)
    {
        var self=this;
        self.options.groups = groups;
        self.toDOM();
    },

    updateItems: function(items)
    {
        var self=this;
        self.options.items = items;
        self.toDOM();
    }
});

