/*

Script: Form.js
	Builds a standard method to working with forms

Copyright:
	Copyright (c) 2010 Chris Doty, <http://polaropposite.com/>.

License:
	MIT-style license.

*/

MUI.files[MUI.path.plugins + 'MUI/Form/Form.js'] = 'loaded';

MUI.Form = new Class({
    Implements: [Events, Options],
    options: {
        id: ''
      , title: false
      , Padding: '0'
      , Width: 0
      , Height: 0
      , SubItems: $A([])
      , Rules: $H({})
      , Prefix: ''
      , HasRequired: false
      , onEventHandler: $empty
    },

    initialize: function(json, ignoreSystem, prefix) {
        if (!MUI.FormRules) {
            MUI.extend( {
                FormRules:{
                    Required : new MUI.FormRule({ 'Type': 'Required', 'LegendText': 'Required fields.',
                        'IconURL': 'images/required.gif',
                        'ErrIconURL': 'images/required-error.gif',
                        'hasRule': function(fld, options) {
                            return options.Fields.indexOf(fld) > -1;
                        },
                        'validate': function(fld, dom) { return [this.getValue(dom) != '', '']; },
                        CSS: 'R'
                    }),
                    IfRequired: new MUI.FormRule({ 'Type': 'IfRequired', 'LegendText': 'Required if other fields have values.',
                        'IconURL': 'images/if-required.gif',
                        'ErrIconURL': 'images/required-error.gif',
                        'hasRule': function(fld, options) { return options.Fields.indexOf(fld) > -1; },
                        'validate': function(fld, dom) {
                            var mochaForm = dom.getParent('.formBody');
                            var fields = mochaForm.getElements('input');
                            fields = fields.concat(mochaForm.getElements('select'));
                            fields = $A(fields.concat(mochaForm.getElements('textarea')));

                            var isRequired = false;
                            var getValue = this.getValue;
                            fields.each(function(inp) {
                                if (options.IfFields.indexOf(inp.id) > -1 && getValue(inp) != '') isRequired = true;
                            });

                            return [!isRequired || getValue(dom) != '', ''];
                        }
                    }),
                    AnyRequired: new MUI.FormRule({ 'Type': 'AnyRequired', 'LegendText': 'At Least One Field Required.',
                        'IconURL': 'images/any-required.gif',
                        'ErrIconURL': 'images/required-error.gif',
                        'hasRule': function(fld, options) {
                            return options.Fields.indexOf(fld) > -1;
                        },
                        'validate': function(fld, dom, options) {
                            var frm = dom.getParent('div.form');
                            var fields = options.Fields;
                            for (var iii = 0; iii < fields.length; iii++) {
                                if (this.getValue(frm.getElementById(fields[iii])) != '') {
                                    return [true, ''];
                                }
                            }

                            return [false, 'At least one field must have a value'];
                        },
                        CSS: 'R'
                    }),
                    Same: new MUI.FormRule({ 'Type': 'Same', 'LegendText': 'Fields must be identical.',
                        'IconURL': 'images/same-required.gif',
                        'ErrIconURL': 'images/required-error.gif',
                        'hasRule': function(fld, options) {
                            return options.Fields.indexOf(fld) > -1;
                        },
                        'validate': function(fld, dom, options) {
                            var frm = dom.getParent('div.form');
                            var fields = options.Fields;
                            var val = this.getValue(frm.getElementById(fields[0]));

                            for (var iii = 1; iii < fields.length; iii++) {
                                if (this.getValue(frm.getElementById(fields[iii])) != val) {
                                    return [false, 'Fields must be identical.'];
                                }
                            }

                            return [true, ''];
                        }
                    })
            }});
        }

        this.start();
        this.IgnoreSystem = ignoreSystem;
        if ($type(json) == 'string') if (PO.RS['Forms'][json]) json = PO.RS['Forms'][json];
        if (json) { this.fromJSON(json, !json.NoBuild, prefix); }
        else { this.options.Prefix = prefix; }
        if (this.options.id) this.DOM.id = this.options.id;
    },

    fromJSON: function(json, buildIt, prefix) {
        this.setOptions(json);
        if (prefix) { this.options.Prefix = prefix; }
        this.parent(json);
        if (this.options.Padding == "0") { this.options.Padding = 0; }
        PO.RS['Forms'][this.options.id] = this.options; // register the form
        if (buildIt) this.buildForm(this.options);
    },

    getRuleClass: function(fld, err) {
        var cssClass = '';

        var o = this;
        var keys = $H(o.options.Rules).getKeys();
        for (var ii = 0; ii < keys.length; ii++) {
            var rules = o.options.Rules[keys[ii]];
            for (var iii = 0; iii < rules.length; iii++) {
                if (rules[iii].hasRule(fld)) {
                    if (cssClass != '') cssClass += ' ';
                    if (err) cssClass += rules[iii].ErrCSS;
                    else cssClass += rules[iii].CSS;
                }
            }
        }
        return cssClass;
    },

    createRuleIcons: function(fld, parent, err) {
        var o = this;
        var keys = $H(o.options.Rules).getKeys();
        for (var ii = 0; ii < keys.length; ii++) {
            var rules = o.options.Rules[keys[ii]];
            for (var iii = 0; iii < rules.length; iii++) {
                if (rules[iii].hasRule(fld)) {
                    var url;
                    if (err) url = rules[iii].ErrIconURL;
                    else url = rules[iii].IconURL;
                    if (url) parent.appendChild(new Element('img', { 'src': url, 'alt': '', 'class': 'required' }));
                }
            }
        }
    },

    validateItem: function(fld, dom) {
        var o = this;
        var arval = [true];
        var keys = $H(o.options.Rules).getKeys();
        for (var ii = 0; ii < keys.length; ii++) {
            var rules = o.options.Rules[keys[ii]];
            for (var iii = 0; iii < rules.length; iii++) {
                if (rules[iii].hasRule(fld)) {
                    var rval = rules[iii].validate(fld, dom);
                    var td = dom.getParent('td');
                    var img = td.getElement('img.required');
                    if (!rval[0]) {
                        td.getElements('.' + rules[iii].CSS).each(function(el) { el.removeClass(rules[iii].CSS); el.addClass(rules[iii].ErrCSS); });
                        if (img) { img.set('src', rules[iii].ErrIconURL); }

                        arval[0] = false;
                        if (rval.length > 1) arval.push(rval[1]);
                    } else {
                        td.getElements('.' + rules[iii].ErrCSS).each(function(el) { el.removeClass(rules[iii].ErrCSS); el.addClass(rules[iii].CSS); });
                        if (img) { img.set('src', rules[iii].IconURL); }
                    }
                }
            }
        }
        return arval;
    },

    fillForm: function(data) {
        var o = this;
        if (!data) return;
        if (!o.flds) return;

        o.flds.each(function(fld) {
            if (fld.id) {
                var val = PO.GetItem(data, fld.id);
                var ctrl = o.DOM.getElementById(fld.id);
                if (val == '' || val == null) {
                    val = o.fdef[fld.id.toLowerCase()];
                    if (val != null && val.indexOf('{') > -1) val = PO.GetItem(data, val);
                }
                if (ctrl != null && val != null) {
                    var typ = ctrl.get('type');
                    var vals;
                    if (ctrl.nodeName == 'DIV') { ctrl.set('text', val); }
                    if ((ctrl.nodeName == 'INPUT' || ctrl.nodeName == 'TEXTAREA') && (ctrl.nodeName == 'TEXTAREA' || typ == 'text' || typ == 'password')) { ctrl.set('value', val); }
                    if (ctrl.nodeName == 'INPUT' && (typ == 'checkbox' || typ == 'radio')) {
                        vals = $A(val.split(','));
                        if (vals.indexOf(ctrl.get('value', val)) > -1) { ctrl.checked = true; }
                    }
                    if (ctrl.nodeName == 'SELECT') {
                        vals = $A(val.split(','));
                        vals.each(function(val) {
                            if (val) { $A(ctrl.options).each(function(opt) { if (opt.value == val) { opt.selected = true; } }); }
                        });
                    }
                }
            }
        });
    },

    start: function() {
        var o = this;
        o.f = new Element('div', { 'id': o.options.id, 'class': 'form' });
        o.DOM = o.f;
        o.aEvent = $A([]);
        o.Scripts = $A([]);

        o.Panel = $A([]);
        o.flds = $A([]);
        o.fdef = $H({});
        o.fldMap = $A([]);
    },

    buildForm: function(parentItem, prefix, exclude) {
        var o = this;
        if (!parentItem) parentItem = this.options;
        if (!parentItem || !parentItem.SubItems) return;

        var subitems = $A(parentItem.SubItems);
        var rules = $H(parentItem.Rules);
        var processSubItems = true;

        if (!prefix) { prefix = this.options.Prefix; }
        if (!prefix) { prefix = ''; }

        if ($type(exclude) == 'string') {
            var elist = $A([]);
            $A(exclude.split(',')).each(function(id) {
                elist.push(id.toLowerCase());
            });
            exclude = elist;
        }

        rules.each(function(val, key) {
            for (var ii = 0; ii < val.length; ii++) {
                if ($type(val[ii].getClass) != "function") {
                    if (!val[ii].Type) val[ii].Type = val[ii].options.Type;
                    if (val[ii].Type) { val[ii] = PO.FormRules[val[ii].Type].create(val[ii]); }
                }
            }
            o.options.Rules[key] = val;
        });

        subitems.each(function(item) {
            item = JSON.decode(JSON.encode(item));

            var id = prefix + item.id;
            if (exclude != null && exclude.indexOf(id.toLowerCase()) > -1) { return; }

            //            item.AltRequired=o.PrefixFields(item.AltRequired);
            //            item.RequiredIf=o.PrefixFields(item.RequiredIf);                      
            item.id = id;

            switch ('' + item.Type) {
                case 'systempanel':
                    if (!o.IgnoreSystem) { o.addSystemPanel(item); }
                    else o.addRow();
                    o.addCleanup(id);
                    processSubItems = false;
                    break;
                case 'indexer':
                    o.addIndexer(item);
                    break;
                case 'tabpanel':
                    o.addTabPanel(item);
                    break;
                case 'row':
                    o.addRow(item);
                    break;
                case 'col':
                    o.addCol(item);
                    break;
                case 'multiline':
                    o.addText(item);
                    break;
                case 'text':
                    o.addText(item);
                    break;
                case 'html':
                    o.addText(item);
                    break;
                case 'date':
                    o.addText(item);
                    break;
                case 'check':
                    o.AddCheck(item);
                    break;
                case 'radio':
                    o.AddCheck(item);
                    break;
                case 'password':
                    o.addText(item);
                    break;
                case 'button':
                    o.addButton(item);
                    break;
                case 'drop':
                    o.addDrop(item);
                    break;
                case 'list':
                    o.addDrop(item);
                    break;
                case 'objgrid':
                    o.AddObjGrid(item);
                    break;
                case 'grid':
                    o.addGrid(item);
                    break;
                case 'line':
                    o.addNewLine();
                    break;
                case 'event':
                    o.addEvent(item);
                    break;
                case 'form':
                    if ($type(exclude) == 'array') { if (item.Exclude) { exclude.push(item.Exclude); } }
                    else { exclude = item.Exclude; }
                    o.addForm(item.id, item.Prefix, exclude);
                    break;
            }
            if (processSubItems && item.SubItems != null) o.buildForm(item, prefix, exclude);
        });
    },

    prefixFields: function(prefix, list) {
        if ($type(list) == 'string') { list = $A(list.split(',')); }
        if ($type(list) == 'array') {
            var alst = $A([]);
            $A(list).each(function(f) {
                if (f.indexOf(prefix) < 0) f = prefix + f;
                if (f) alst.push(f);
            });
            return alst;
        }
        return null;
    },

//    addCleanup: function(id) {
//        PO.AddClean(function() {
//            $('mainPanel_handle').setStyle('display', 'none');
//            if ($(id)) {
//                $(id).destroy();
//                if ($(id + '_handle')) { $(id + '_handle').destroy(); }
//                if ($(id + '_header')) { $(id + '_header').destroy(); }
//            }
//        });
//    },

    tableCheck: function() {
        if (this.f.getParent('table.formTop') == null) {
            var el = new Element('table', { 'class': 'form formTop', 'cellSpacing': '0', 'cellPadding': '0', 'width': '100%' });
            this.f.appendChild(el);
            this.f = el;

            el = new Element('tbody', { 'class': 'formBody' });
            this.f.appendChild(el);
            this.f = el;
        }
    },

    addTabPanel: function(item) {
        var o = this;
        if (o.DOM == null) { o.start(); }

        if (o.DOM.childNodes.length > 0 && o.Panel.length == 0) {
            o.Panel.push({ "id": "General", "Form": o.DOM });
            o.DOM.id += '_General_Content';
            o.DOM.addClass('formContent');
        }
        if (o.options.HasRequired) { o.addRequired(); }

        o.f = new Element('div', { 'id': o.options.id + '_' + item.id + '_Content', 'class': 'formContent' });
        o.DOM = o.f;

        if (!o.ActivePanel) o.ActivePanel = item.id;
        o.Panel.push({ "id": item.id, "Form": o.DOM });
    },

    addRequired: function() {
        var o = this;
        o.addRow();
        o.addCol();
        o.DOM.appendChild(new Element('span', { 'class': 'R', 'html': 'Required fields are marked with&nbsp;<img src="images/required.gif" alt="required"/>' }));
        o.options.HasRequired = false;
    },

    addSystemPanel: function(item) {
        var html = '&nbsp;';
        if (!item.Width) item.Width = 0;
        if (!item.Height) item.Height = 0;
        if (item.Padding == null) item.Padding = '8px';

        var sform = new mochaForm();
        sform.options.id = item.id + '_SubForm';
        sform.options.Padding = item.Padding;
        sform.buildForm(item);

        new MochaUI.Panel({
            id: item.id,
            title: item.title,
            loadMethod: 'html',
            content: '&nbsp',
            column: item.Column,
            height: item.Height,
            width: item.Width,
            padding: item.Padding,
            panelBackground: '#fff',
            onContentLoaded: function(el) {
                el.empty();
                el.appendChild(sform.End());
                sform.Execute(el, item.id);
            }
        });
    },

    addForm: function(name, prefix, exclude) {
        var form = PO.RS['Forms'][name];
        if (form) this.buildForm(form, prefix, exclude);
    },

    addRow: function(jus) {
        if ($type(jus) == 'object') jus = jus.Align;
        var o = this;
        this.tableCheck();

        if (o.f.get('class') != 'formBody') { o.f = o.f.getParent('.formBody'); }

        var el = new Element('tr');
        o.f.appendChild(el);
        o.f = el;

        el = new Element('td');
        o.f.appendChild(el);
        o.f = el;
        if (!jus) { jus = 'left'; }
        el.set('align', jus);

        el = new Element('table', { 'class': 'form', 'cellSpacing': '0' });
        if (o.Panel.length == 0) el.set('width', '100%');
        o.f.appendChild(el);
        o.f = el;

        el = new Element('tbody');
        o.f.appendChild(el);
        o.f = el;

        el = new Element('tr', { 'class': 'formRow' });
        this.f.appendChild(el);
        this.f = el;
    },

    addCol: function(jus) {
        if ($type(jus) == 'object') jus = jus.Align;
        var o = this;

        this.tableCheck();
        var c = o.f.get('class');
        if (c == 'formBody') { o.addRow(); c = o.f.get('class'); }
        if (c != 'formRow') { o.f = o.f.getParent('.formRow'); }

        var el = new Element('td', { 'class': 'formC' });
        o.f.appendChild(el);
        o.f = el;
        if (!jus) { jus = 'left'; }
        el.set('align', jus);
    },

    addNewLine: function() {
        this.tableCheck();
        this.f.appendChild(new Element('br'));
    },

    addSpacer: function(wid) {
        this.tableCheck();
        this.f.appendChild(new Element('img', { 'width': wid, 'height': '1', 'src': '/images/spacer.gif', 'alt': '' }));
    },

    addButton: function(item) {
        this.tableCheck();
        var but = new Element('input', { 'type': 'button', 'id': item.id, 'value': item.text, 'class': 'B' });
        if (item.Width) { but.setStyle('width', item.Width + 'px'); }
        this.f.appendChild(but);
    },

    addIndexer: function(item) {
        var o = this;
        o.tableCheck();
        o.addCol();

        o.f.appendChild(new LinkButtonList({ id: item.id, List: item.List, selected: item.selected }).toDOM());
    },

    addGrid: function(item) {
        var o = this;
        o.tableCheck();
        o.addCol();

        o.f.appendChild(new mochaList({ id: item.id, groups: item.groups }).toDOM());

        var addAutoSize = function(id) {
            return function() { $(id).getParent().addEvent('onResize', function() { o.autoSize(id); }); };
        };

        o.Scripts.push(addAutoSize(item.id));
    },

    addText: function(item) {
        this.tableCheck();
        var o = this;
        if (!item.Label) item.Label = '';
        if (!item.title) item.title = item.Label;
        o.addCol(item.Align);

        var css = o.getRuleClass(item.id);
        if (css == '') css = 'L';

        if (item.Label) {
            var p = new Element('label', { 'id': item.id + 'item.Label', 'for': item.id, 'class': css, 'text': item.Label });
            o.f.appendChild(p);
            o.createRuleIcons(item.id, p);
        }
        var div = new Element('div', { 'class': 'L' });
        o.f.appendChild(div);

        var dom;

        var w = (('' + item.Width).indexOf('%') > 0) ? item.Width : item.Width + 'px';
        if (item.Type == "text") {
            dom = new Element('input', { 'type': 'text', 'id': item.id, 'title': item.title, 'value': item.value, 'class': css, 'maxlength': item.Length, styles: { 'width': w} });
        }

        if (item.Type == "multiline" || item.Type == "html") {
            var h;
            if (item.ReadOnly) {
                dom = new Element('div', { 'id': item.id, 'text': item.value, 'class': css, styles: { 'width': w} });
                if (!item.value) dom.set('html', '&nbsp;');
                if (item.Height) {
                    h = (('' + item.Height).indexOf('%') > 0) ? item.Height : item.Height + 'px';
                    dom.setStyles({ 'overflow': 'auto', 'height': h });
                }
            } else {
                //                if (!PO['wysiwyg'] && item.Type == "html") {
                //                    PO['wysiwyg'] = new Asset.javascript('/OMMS/wysiwyg/scripts/wysiwyg.js', { id: 'wysiwyg' });
                //                }
                h = (('' + item.Height).indexOf('%') > 0) ? item.Height : item.Height + 'px';
                dom = new Element('textarea', { 'id': item.id, 'title': item.title, 'value': item.value, 'class': css, 'maxlength': item.Length, styles: { 'width': w, 'height': h} });
            }
        }

        if (item.Type == "date") {
            dom = new Element('input', { 'type': 'text', 'id': item.id, 'title': item.title, 'value': item.value, 'class': 'calendar', 'maxlength': item.Length, styles: { 'width': w} });
            dom.addClass(css);

            var newCal = function(nam) {
                var h = {};
                h[nam] = 'm/d/Y';
                return function() { new Calendar(h, { classes: ['calendar'] }); };
            };
            o.Scripts.push(newCal(item.id));
        }

        if (item.Type == "password") {
            dom = new Element('input', { 'type': 'password', 'id': item.id, 'title': item.title, 'value': item.value, 'class': css, 'maxlength': item.Length, styles: { 'width': w} });
        }

        div.appendChild(dom);
        if (item.Type == "html") {
            //WYSIWYG.attach(item.ID);
            PO.Intervals['WYSIWYG_' + item.id] = setInterval("if($('" + item.id + "')!=null && PO.Intervals['WYSIWYG_" + item.id + "']!=null) { clearInterval(PO.Intervals['WYSIWYG_" + item.id + "']); PO.Intervals['WYSIWYG_" + item.id + "']=null; WYSIWYG.attach('" + item.id + "',false,'" + item.Height + "'); }", 200);
        }

        o.flds.push(item);
        o.fldMap.push([item, dom]);

        if (item.Default) { o.fdef[item.id.toLowerCase()] = item.Default; }
    },

    AddCheck: function(item) {
        this.tableCheck();
        var o = this;
        if (!item.value) item.value = '';
        o.addCol(item.Align);

        var css = o.getRuleClass(item.id);
        if (css == '') css = 'L';

        var p = o.f;
        if (item.Label) {
            p = new Element('label', { 'id': item.id + 'tle', 'for': item.id, 'class': css });
            o.f.appendChild(p);
            o.createRuleIcons(item.id, p);
        }
        var dom;
        if (item.Type == "check") {
            dom = new Element('input', { 'type': 'checkbox', 'id': item.id, 'value': item.value, 'class': css });
        } else {
            dom = new Element('input', { 'type': 'radio', 'id': item.id, 'value': item.value, 'class': css })
        }
        p.appendChild(dom);
        if (item.Label) { p.appendChild(new Element('span', { 'text': item.Label })); }

        o.flds.push(item);
        o.fldMap.push([item, dom]);

        if (item.Default) { o.fdef[item.id.toLowerCase()] = item.Default; }
    },

    addDrop: function(item) {
        this.tableCheck();
        var o = this;
        if (item.CanAdd == null) { item.CanAdd = true; }
        if (!item.title) { item.title = item.Label; }
        o.addCol(item.Align);

        var css = o.getRuleClass(item.id);
        if (css == '') css = 'L';

        if (item.Label) {
            var p = new Element('label', { 'id': item.id + 'lbl', 'for': item.id, 'class': css, 'text': item.Label });
            o.f.appendChild(p);
            o.createRuleIcons(item.id, p);
        }
        var div = new Element('div', { 'class': 'L' });
        var sel = new Element('select', { 'id': item.id, 'title': item.title, 'class': css, styles: { 'width': item.Width + 'px'} });
        if (item.Type == 'list') {
            if (item.Size) { sel.set('size', item.Size); }
            else { sel.set('size', 10); }
        }
        div.appendChild(sel);
        o.f.appendChild(div);

        var items = item.Items;
        if (item.CacheName) { items = PO.GetRS(item.CacheName); }

        if ($type(items) == 'array') {
            $A(items).each(function(row) {
                if (item.CanAdd) {
                    var opt = new Element('option', { 'value': row[item.valueField], 'text': row[item.textField] });
                    sel.appendChild(opt);
                }
            });
        }

        o.flds.push(item);
        o.fldMap.push([item, sel]);

        if (item.Default) { o.fdef[item.id.toLowerCase()] = item.Default; }
    },

    addEvent: function(item) {
        if (!item.IsButton) item.IsButton = false;
        if (!item.imageURL && item.imageURL != 'none') {
            switch (item.id) {
                case 'save':
                    item.imageURL = '/images/save.png';
                    break;
                case 'cancel':
                    item.imageURL = '/images/btn_cancel.png';
                    break;
                case 'delete':
                    item.imageURL = '/images/delete.gif';
                    break;
                case 'add':
                    item.imageURL = '/images/add.gif';
                    break;
                case 'gallery':
                    item.imageURL = '/images/btn_gallery.png';
                    break;
                case 'detail':
                    item.imageURL = '/images/btn_detail.png';
                    break;
                case 'edit':
                    item.imageURL = '/images/edit.png';
                    break;
                case 'permissions':
                    item.imageURL = '/images/permissions.gif';
                    break;
            }
        }
        this.aEvent.push(item);
    },

    End: function() {
        var o = this;

        if (o.options.HasRequired) { o.addRequired(); }
        if (o.Panel.length > 0) {
            o.DOM = new Element('div', { 'id': o.options.id, 'class': 'form' });

            var nav = new Element('div', { 'id': o.options.id + '_nav', 'class': 'formTab' });
            o.DOM.appendChild(nav);

            var ul = new Element('ul', { 'class': 'formTab' });
            nav.appendChild(ul);

            o.Panel.each(function(panel) {
                var id = panel.id.replace(new RegExp(/\s/g), '_');

                var li = new Element('li', { 'id': id + '_tab' });
                ul.appendChild(li);
                if (panel.id == o.ActivePanel) { li.set('class', 'C'); }

                var panelClick = function(id) {
                    return function(e) {
                        new Event(e).stop();
                        $(id + '_formpanel').getParent().getElements('.formPanel').setStyle('display', 'none');
                        $(id + '_formpanel').setStyle('display', '');
                        $(id + '_tab').getParent().getElements('.C').removeClass('C');
                        $(id + '_tab').addClass('C');
                    }
                };
                li.addEvent('click', panelClick(id));

                var a = new Element('a', { 'href': '#' });
                li.appendChild(a);
                a.appendChild(new Element('span', { 'text': panel.id }));
            });

            o.Panel.each(function(panel) {
                var id = panel.id.replace(new RegExp(/\s/g), '_');

                var p = new Element('div', { 'id': id + '_formpanel', 'class': 'formPanel' });
                if (panel.id != o.ActivePanel) { p.setStyle('display', 'none'); }

                p.appendChild(panel.Form);
                o.DOM.appendChild(p);
            });
        }

        var pad = o.options.Padding;
        if (pad != null && pad != '0') { o.DOM.setStyle('padding', pad); o.DOM.addClass('pad'); } else { o.DOM.setStyle('padding', '0'); }
        if (o.options.Width) { o.DOM.setStyle('width', (('' + o.options.Width).indexOf('%') > 0) ? o.options.Width : o.options.Width + 'px'); }
        if (o.options.Height) { o.DOM.setStyle('height', (('' + o.options.Height).indexOf('%') > 0) ? o.options.Height : o.options.Height + 'px'); }

        return o.DOM;
    },

    Execute: function() {
        this.Scripts.each(function(script) {
            if ($type(script) == 'string') eval(script);
            else script(this);
        });
    },

    GetEventButtons: function() {
        var btns = $A([]);

        this.aEvent.each(function(evt) {
            if (evt.IsButton) { btns.push(evt); }
        });

        if (btns.length == 0) return null;
        return btns;
    },

    BuildPanelTitle: function(panelID, prefix, suffix) {
        var tle = $(panelID + '_title');
        if (tle) {
            var txt = [];

            if (prefix) { txt.push(prefix); }
            if (this.options.title) { txt.push(this.options.title); }
            if (suffix) { txt.push(suffix); }

            tle.set('text', txt.join(' - '));
        }
    },

    BuildPanelButtons: function(panelID, empty) {
        var o = this;
        var min = $(panelID + '_minmize');
        if (min) { min.setStyle('float', 'right'); }

        var ev = o.GetEventButtons();
        if (!ev) return o;
        var done = $A([]);

        if (empty && $(panelID + '_buttonHolder') != null) $(panelID + '_buttonHolder').empty();
        ev.each(function(evt) {
            if (done.indexOf(evt.id) < 0) {
                done.push(evt.id);
                (new ImageButton({ "id": panelID + '_' + evt.id, "container": panelID, "text": evt.text, "imageURL": evt.imageURL, 'onClick': function(e) {
                    if (evt.NoValidation || o.CheckRequired()) {
                        var div = $(panelID + '_' + evt.id);
                        var img = div.getElement('img');
                        if (img) img.set('src', '/images/spinner.gif');
                        o.fireEvent('onEventHandler', [e, evt, o, img]);
                    }
                }
                })).toDOM();
            }
        });
        return o;
    },

    CheckRequired: function() {
        var o = this;
        var ok = true;

        o.fldMap.each(function(map) {
            var fld = map[1];
            if (fld) {
                var rVal = o.validateItem(map[0].id, fld);
                if (!rVal[0]) ok = false;
            }
        });

        return ok;
    },

    GetValues: function(h) {
        var o = this;
        if (h == null) { h = $H({}); }
        else { h = $H(h); }

        o.fldMap.each(function(map) {
            var fld = map[1];
            if (fld) {
                var id = $A(map[0].id.split(':'));
                var val = o.getValue(fld);
                if (id.length == 1) {
                    if (val != '') h[id[0]] = val;
                    else h.erase(id[0]);
                } else {
                    var ch = h;
                    for (var ii = 0, len = id.length; ii < len; ii++) {
                        var id2 = id[ii];
                        if (ii == len - 1) {
                            if (val != '') ch[id2] = fld.value;
                        } else {
                            if (!ch[id2]) { ch[id2] = {}; }
                            ch = ch[id2];
                        }
                    }
                }
            }
        });
        return h;
    },

    getValue: function(inp) {
        if (inp.value != '' && (inp.nodeName == 'INPUT' || inp.nodeName == 'TEXTAREA') && (inp.get('type') == 'text' || inp.nodeName == 'TEXTAREA' || inp.get('type') == 'password')) return inp.value;
        if (inp.value != '' && inp.nodeName == 'INPUT' && (inp.get('type') == 'radio' || inp.get('type') == 'checkbox') && inp.checked) return inp.value;
        if (inp.value != '' && inp.nodeName == 'SELECT') return inp.options[inp.selectedIndex].value;
        return '';
    },

    autoSize: function(id, p) {
        if ($type(p) == 'string') p = $(p);
        if ($type(p) != 'element') p = $(id).getParent();
        var c = p.getSize();
        $(id).setStyles({ 'width': c.x, 'height': c.y });
    }

});

//-------------------------
MUI.FormRule = new Class({
IconURL:null,
ErrIconURL:null,
CSS:'L',
ErrCSS:'Err',
LegendText:'',

initialize: function(json) {
    var o=this;
    $H(json).each(function(val,key) {
        o[key]=val;
    });
},

create: function(json) {
    var me=this;
    var o=new MUI.FormRule(json);
    o.Type=me.Type;   

    $H(me).each(function(val,key) {
        o[key]=val;
    });    
    $H(json).each(function(val,key) {
        o[key]=val;
    });
    o.hasRule = function(fld) { return me.hasRule(fld,o); };
    o.validate = function(fld,dom) { return me.validate(fld,dom,o); };
    
    return o;
},

getValue: function(inp) {
    if(inp.value!='' && (inp.nodeName=='INPUT' || inp.nodeName=='TEXTAREA') && (inp.get('type')=='text' || inp.nodeName=='TEXTAREA' || inp.get('type')=='password')) return inp.value;
    if(inp.value!='' && inp.nodeName=='INPUT' && (inp.get('type')=='radio' || inp.get('type')=='checkbox') && inp.checked) return inp.value;
    if(inp.value!='' && inp.nodeName=='SELECT') return inp.options[inp.selectedIndex].value;
    return '';
}

});


