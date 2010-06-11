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

    Implements: [Events, Options],

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
        ,textPlacement:     'after'
        ,value:             ''              // the currently selected item's value
    },

    initialize: function(options) {
        this.setOptions(options);

        // make sure this controls has an ID
        var id = this.options.id;
        if (!id) {
            id = 'checkBoxGrid' + (++MUI.IDCount);
            this.options.id = id;
        }

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
        });

        return this;
    },

    buildItem: function(item,fs,num)
    {
        var self = this,o = this.options;

        var inp=new Element('input',{'id':o.id+num,'name':o.id,'type':o.type}).inject(fs);
        var isSelected=self._getData(item,o.isSelectedField);
        if(isSelected) inp.set('checked','true');
        item._element=inp;

        var text=self._getData(item,o.textField);
        new Element('label',{'text':text,'for':o.id+num}).inject(fs,o.textPlacement);

        return inp;
    }    
});
