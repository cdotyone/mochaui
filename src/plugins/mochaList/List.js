/*

Script: List.js
	Creates a generic list

Copyright:
	Copyright (c) 2010 Chris Doty, <http://polaropposite.com/>.

License:
	MIT-style license.

*/

MUI.files[MUI.path.plugins + 'mochaList/List.js'] = 'loaded';

MUI.ListItem = new Class({
    initialize: function(data, group) {
        this.setGroup(group);
        this.setData(data);
    },

    setGroup: function(group) {
        this.Group = group;
    },

    setData: function(data) {
        var o = this;
        o.Data = data;
        o.Value = PO.GetItem(o.Data, o.Group.options.Columns[0].Value);
    },

    toDOM: function(parent) {
        var o = this;
        var id = o.Group.List.options.ID;

        var cl = o.Group.options.Columns;
        var value = '' + PO.GetItem(o.Data, cl[0].Value);
        if (!value) value = '' + parent.childNodes.length;
        var rid = id + '_' + o.Group.options.ID + '_' + value.replace(/[\s\.]/g, '_');

        var tr = $(rid);
        if (!tr) {
            tr = $(new Element('tr', { 'id': rid }));
            parent.appendChild(tr);
        }
        o.ROW = tr;

        var i,td,tid,img,a;
        for (i = 0; i < cl.length; i++) {
            var col = cl[i];
            tid = rid + '_' + i;
            td = tr.getElementById(tid);

            if (td) td.empty();
            else { td = new Element('td', { 'id': tid }); tr.appendChild(td); }

            if (col.Align) { td.set('align', col.Align); }
            if (col.CssClass) td.className = col.CssClass;

            var txt = document.createTextNode(PO.GetItem(o.Data, col.Name));

            if (i == 0) {
                if (o.Group.List.options.ShowCheckBoxes) {
                    var cb = new Element('input', { 'type': 'checkbox', 'name': id + '$checked', 'value': value });
                    td.appendChild(cb);
                    cb.addEvent('click', function(event) { event.stopPropagation(); });
                    td.removeEvents('click');
                    td.addEvent('click', function(event) { event.stopPropagation(); if (!o.Group.options.CanSelect) cb.checked = !cb.checked });
                } else if (!o.Value) td.addEvent('click', function(event) { event.stopPropagation(); });

                if (col.Image) {
                    var cImage = PO.GetItem(o.Data, col.Image);
                    cImage.replace(/\~/g, o.Group.List.IconPath);
                    if (cImage) {
                        img = new Element('img');
                        img.alt = '';
                        img.src = cImage;
                    }
                }

                if (o.Group.options.CanSelect) {
                    a = new Element('a', { 'styles': { 'text-decoration': 'underline'} });

                    if (col.TipTitle) {
                        tip = PO.GetItem(o.Data, col.TipTitle);
                        if (tip) {
                            a.store('tip:title', tip);
                            a.set('class', 'Tips');
                        }
                    }
                    if (col.TipText) {
                        tip = PO.GetItem(o.Data, col.TipText);
                        if (tip) {
                            a.store('tip:text', tip);
                            a.set('class', 'Tips');
                        }
                    }
                    if (col.URL) {
                        if (col.Target) {
                            var tgt = PO.GetItem(o.Data, col.Target);
                            if (tgt) { a.target = tgt; }
                        }
                        if (col.URLCssClass) {
                            var cls = PO.GetItem(o.Data, col.Target, col.URLCssClass);
                            if (cls) { a.set('class', tgt); }
                        }

                        var url = PO.GetItem(o.Data, col.Target, col.URLCssClass);
                        if (url) {
                            url = url.replace(/\~/, o.Group.List.options.NavigateURL);
                            a.set('href', url);
                        }
                    } else a.setStyle('text-decoration', 'none');

                    if (img) {
                        a.setStyle('text-decoration', 'none');
                        a.appendChild(img);
                        var s = new Element('a', { 'styles': { 'text-decoration': 'underline'} });
                        s.appendChild(txt);
                        a.appendChild(s);
                    } else a.appendChild(txt);

                    td.appendChild(a);

                    if (col.TipTitle) var tip = new Tips(new Array(a), { maxTitleChars: 50 });
                } else { if (img) td.appendChild(img); td.appendChild(txt); }
            } else {
                td.appendChild(txt);
            }
            o.Group.List.fireEvent('onItemColumnBound', [o,td,col] );
        }

        var cm = o.Group.options.Commands;
        if (cm && cm.length > 0 && o.Group.List.options.ShowCommand) {
            tid = rid + '_commands';

            td = tr.getElementById(tid);
            if (td) td.empty();
            else { td = new Element('td', { 'id': tid }); tr.appendChild(td); }

            for (i = 0; i < cm.length; i++) {
                var cmd = cm[i];

                var showEvt = o.Group.List.canShowEvent(o.Value, o.Data, o, cmd.Name);
                if (showEvt) {
                    a = $(new Element('a'));
                    a.title = cmd.Text;
                    a.href = "#" + cmd.Name;
                    a.addEvent('click', function(e) { o.command(e); return false; });

                    td.appendChild(a);

                    img = new Element('img');
                    img.alt = cmd.Text;
                    img.src = o.Group.List.options.IconPath + cmd.Image;
                    a.appendChild(img);
                }
            }
        } else {
            if (o.Group.options.Commands && o.Group.options.Commands.length > 0) {
                tr.appendChild(new Element('td', { 'html': '&nbsp;' }));
            }
        }

        if (o.Group.options.CanSelect) {
            tr.removeEvents('mouseover');
            tr.removeEvents('mouseout');
            tr.removeEvents('click');
            tr.addEvent('mouseover', function() { o.over(); });
            tr.addEvent('mouseout', function() { o.out(); });
            tr.addEvent('click', function() { o.click(); });
        }

        return tr;
    },

    command: function(e) {
        var o = this;
        e = new Event(e);
        e.stop();
        var t = $(e.target);
        if (t.nodeName != 'A') t = t.getParent('a');
        var cmd = t.href.split('#')[1];
        var img = t.getElement('img');
        o.Group.List.fireEvent('onCommand', [o.Value, o.Data, o, cmd, img]);
    },

    click: function() {
        var o = this;
        o.Group.List.options.Value = o.Value;
        o.Group.List.fireEvent('onItemSelected', [o.Value, o.Data, o]);
        if (o.ROW) {
            o.ROW.getParent().getElements('.Selected').removeClass('Selected');
            o.ROW.addClass('Selected');
        }
        return this;
    },

    over: function() {
        var o = this;
        if (o.ROW) { o.ROW.addClass('over'); }
        return this;
    },

    out: function() {
        var o = this;
        if (o.ROW) { o.ROW.removeClass('over'); }
        return this;
    }

});


MUI.ListGroup = new Class({
    Implements: [Options],

    options: {
        ID: ''
      , CssClass: 0
      , Value: 'id' 
      , Items: $A([])
      , CanSelect: true
      , Align: false
    },

    initialize: function(options) {
        this.setOptions(options);
        if (options) this.setItems(options.Items)
    },

    setItems: function(items) {
        if (!items) return;
        var o = this;

        if (items) {
            var Items = $A([]);
            Items = new Array();

            var oitems=o.options.Items;
            for (var i = 0; i < items.length; i++) {
                var g;
                if(oitems.length>i && oitems[i].options!=null) {
                    g = oitems[i];
                    Items[Items.length] = g;
                    g.setData(items[i]);
                } else {
                    g = new CSSListItem(items[i],o);
                    Items[Items.length] = g;
                    g.setGroup(this);
                }
            }

            o.options.Items = Items;
        }

        return o;
    },

    setList: function(l) {
        this.List = l;
    },

    toDOM: function(parent) {
        var o = this;
        o.ParentDOM=parent;
        var gid=o.List.options.ID+'_'+o.options.ID;
        
        var d = $(gid);
        if(!d) { d=new Element('div',{'id':gid}); parent.appendChild(d); }
        if (o.options.CssClass) d.className = o.options.CssClass;
        else if (o.List) d.className = o.List.options.CssClass;
        d.style.overflow = 'auto';

        var t = d.getElement('table');
        if(!t) { t=new Element('table'); d.appendChild(t); }
        t.cellSpacing = 0;
        t.cellPadding = 0;
        t.style.width = '100%';        

        var tb = t.getElement('tbody');
        var i,tr;
        if(!tb) { 
            tb=new Element('tbody'); 
            t.appendChild(tb); 

            tr = new Element('tr');
            var cl = o.options.Columns;
            for (i = 0; i < cl.length; i++) {
                var td = new Element('td',{'html':cl[i].Text.replace(new RegExp(/\|/g), '<br/>'),'class':d.className + 'Head','valign':'bottom'});
                if (i == 0) { td.addClass('First'); }
                if(cl[i].Align) { td.set('align',cl[i].Align); }
                tr.appendChild(td);
            }
            tb.appendChild(tr);

            if (o.options.Commands && o.options.Commands.length > 0) {
                tr.appendChild(new Element('td',{'class':d.className + 'Head','html':'&nbsp;'}));
            }
        }

        var sVal = o.List.options.Value;
        var items = o.options.Items;
        if(items) {
            for (i = 0; i < items.length; i++) {
                tr = items[i].toDOM(tb);
                var sel = (items[i].Value == sVal && sVal!='');
                items[i].Selected = sel;
                if (sel) tr.className = d.className + 'C';
                else tr.className = d.className + (i % 2);
            }
        }
        
        return d;
    },

    refresh: function(url,property) {
        var o=this;
        PO.GetRS(null,url,null,null,function(json) { 
            if(property) o.setItems(json[property]);
            else o.setItems(json); 
            o.toDOM(o.ParentDOM);          
        });
    }
});

MUI.List = new Class({
    Implements: [Events, Options],

    options: {
          ID: ''
        , CssClass: 'List'
        , Value: ''
        , ShowCheckBoxes: 0
        , Checked: 0
        , ShowCommand: true
        , Groups: $A([])
        , NavigateURL: ''
        , IconPath: ''

        , onCommand: $empty
        , onItemSelected: $empty
        , onItemColumnBound: $empty
    },

    initialize: function(options) {
        if(options!=null && $type(options.canShowEvent)=='function') {
            this.canShowEvent=options.canShowEvent;
            options.canShowEvent = null;
        }    
        this.setOptions(options);
        PO.addControl(this);
        if (options) this.setGroups(options.Groups)
    },

    setGroups: function(groups) {
        if (!groups) return;
        var o = this;

        if (groups) {
            var Groups = $A([]);
            Groups = new Array();

            for (var i = 0; i < groups.length; i++) {
                var g = new CSSListGroup(groups[i]);
                Groups[Groups.length] = g;
                g.setList(this);
            }

            o.options.Groups = Groups;
        }

        return o;
    },

    toDOM: function() {
        var o = this;
        var options = o.options;

        var d = $(o.ID);
        if (!d) {
            d = new Element('div');
            d.id = o.ID;
        }
        if (options.CssClass) d.className = options.CssClass;
        o.DOM = d;

        for (var i = 0; i < options.Groups.length; i++) {
            var g=options.Groups[i];
            if(!g.options.ID) g.options.ID='g'+i;
            g.toDOM(d);
        }

        return d;
    },

    saveState: function() {
        var o = this;

        if (o.options.ShowCheckBoxes) {
            var cb = $(o.ID).getElements('input');
            var v = new Array();
            for (var i = 0; i < cb.length; i++) {
                if (cb[i].checked) v.push(cb[i].value);
            }
            o.options.Checked = v.join(',');
        }

        return o.parent();
    },
    
    setData: function(data,property) {
        var o=this;
        var g=o.options.Groups[0];             
        if(property) g.setItems(data[property]);
        else g.setItems(data); 
        o.toDOM();              
    },
    
    refresh: function(url,property) {
        var o=this;
        PO.GetRS(null,url,null,null,function(json) { 
            o.setData(json,property);
        });
    },
    
    // parameters passed = val,data,item,command
    canShowEvent: function() { return true; }
});
    