/*

Script: CheckListBox.js
	Create a list with check boxes next to each item

Copyright:
	Copyright (c) 2010 Chris Doty, <http://polaropposite.com/>.

License:
	MIT-style license.

*/

MUI.files[MUI.path.plugins + 'mochaCheckedListBox/CheckedListBox.js'] = 'loaded';

MUI.CheckedListBox = new NamedClass('MUI.CheckedListBox',{

    Implements: [Events, Options],

    options: {
        items: $A([]),
        id: null,
        createOnInit: true,
        isDropList: true,
        dropCssClass: 'dclb',
        dropText: '{$} Selected',
        canSelect: false,
        canMultiSelect: false,
        cssClass: 'clb',
        barCssClass: 'clb',
        itemCssClass: 'clb',
        alternateItems: false,
        container: null,
        width:0,
        height:0,
        onSelected: $empty,
        onChecked:  $empty
    },

    initialize: function( options )
    {
        this.setOptions(options);

        // make sure this controls has an ID
        var id=this.options.id;
        if(!id) { id='checkedListBox' + (++MUI.IDCount); this.options.id=id; }

        // create sub items if available
        if(this.options.createOnInit && this.options.items.length>0) this.toDOM();
        else if($(id)) this.fromHTML(id);

        MUI.set(id,this);
    },

    fromHTML: function(el)
    {
        var self=this;
        var o=self.options;
        el=$(el);
        if(el) {
            var nItems = new Array();

            o.cssClass = el.get('class');
            var list=el.getElement('table');
            if(list) {
                var rows=list.getElements('TR');
                for(var i=0;i<rows.length;i++)
                {
                    self.itemFromHTML(rows[i]);
                }
            }

            o.items = nItems;
            el.style.visibility='visible';
        }
        return this;
    },

    toDOM: function(containerEl)
    {
        var o=this.options;
        var self=this;

        var id=o.id;
        var drop;
        if(o.isDropList) {
            var panel=$(id);
            if(!panel) {
                panel=new Element('div',{id:id});
                if(o.width) panel.setStyle('width',parseInt(''+o.width)+'px');
            }
            panel.empty();

            drop=new Element('div',{id:id+'_droplist','class':o.dropCssClass,styles:{'width':parseInt(''+o.width)+'px'}}).inject(panel);
            self.dropElement=drop;
            
            self.textElement=new Element('div',{id:id+'_text','class':'text','text':'1 selected',styles:{'width':(parseInt(''+o.width)-24)+'px'}}).inject(drop);
            self.buttonElement = new Element('div',{id:id+'_button','class':'button','html':'&nbsp;'}).inject(drop).addEvent('click',function(e) { self.onOpen(e); });

            o.id+='_list';
            o.isOpen = false;
        }

        var div=$(id);
        var isNew=false;
        if(!div) {
            div=new Element('div',{'id':id,'class':o.cssClass});
            if(o.width) div.setStyle('width',(parseInt(''+o.width)-2)+'px');
            if(o.height) div.setStyle('height',parseInt(''+o.height)+'px');
            isNew = true;
        }
        if(o.cssClass) div.set('class',o.cssClass);
        this.element = div;

        div.empty();

        var ul=new Element('ul').inject(div);

        var selectCount=0;
        for(var i=0;i<o.items.length;i++) {
            if(o.items[i].isChecked) selectCount++;
            if(o.items[i].isBar) this.buildBar(o.items[i],ul);
            else this.buildItem(o.items[i],ul,(i%2));
        }

        if(!isNew) return this;

        window.addEvent('domready', function() {
            var container=$(containerEl ? containerEl : o.container);
            if(drop) {

                var selectText=self.options.dropText.replace('{$}',selectCount);
                self.textElement.set('text',selectText);

                container.appendChild(drop);
                drop.appendChild(div);
                div.addClass('notop');
                div.setStyles({'display':'none','position':'absolute','z-index':999});
            }
            else container.appendChild(div);
        });

        return this;
    },

    getSelectedCount: function() {
        var o=this.options;
        var selectCount=0;
        for(var i=0;i<o.items.length;i++) {
            if(o.items[i].isChecked) selectCount++;
        }
        return selectCount;
    },

    addItem: function(item)
    {
        if(!item.isSelected) item.isSelected=false;
        if(!item.isChecked) item.isChecked=false;
        this.options.items.push(item);
        return item;
    },

    addBar: function()
    {
        var bar={isBar:true};
        this.options.items.push(bar);
        return bar;
    },

    update: function(items)
    {
        var self=this;
        self.options.items = items;
        self.toDOM();
    },

    onSelected: function(e,item)
    {
        var self=this;
        var o=self.options;
        if(o.canSelect) {
            if(!o.canMultiSelect)
            {
               var items=this.options.items;
               for(var i=0;i<items.length;i++)
               {
                  if(items[i].isSelected && item!=items[i]) {
                    items[i].isSelected=false;
                    items[i]._element.removeClass('C');
                  }
               }
               o.value = item.value;
            }

            item.isSelected=!item.isSelected;
            if(item.isSelected) item._element.addClass('C');
            else item._element.removeClass('C');

            if(o.onSelected) o.onSelected(item);
            //o.List.DoCommand('selected',o.Value+'#'+item.isSelected,null);
        }
        else {
            item._checkBox.checked = !item._checkBox.checked;
            item.isChecked=item._checkBox.checked;
            if(o.onChecked) o.onChecked(item);
            if(item.isChecked) item._element.addClass('C');
            else item._element.removeClass('C');

            if(self.textElement) {
                var selectText=o.dropText.replace('{$}',self.getSelectedCount());
                self.textElement.set('text',selectText);
            }
            //o.List.DoCommand('checked',o.Value+'#'+item.isChecked,null);
        }

        self.fireEvent('selected',[item,e] );
    },

    onChecked: function(e)
    {
        e.cancelBubble=true;
        // o.List.DoCommand('Checked',o.Value+'#'+o.CheckBox.checked,null);
        return true;
    },

    onOver: function(e,item)
    {
        item._element.addClass('O');
    },

    onOut: function(e,item)
    {
        item._element.removeClass('O');
    },

    onOpen: function() 
    {
        var self=this;
        var pos=self.dropElement.getCoordinates();
        var element=self.element;
        var button=self.buttonElement;
        element.setStyles({'display':'','top':pos.bottom+2,'left':pos.left});
        var close=function() {
            element.setStyles({'display':'none'});
            element.removeEvent('mouseleave');
            button.removeEvent('click');
            button.addEvent('click',function(e) { self.onOpen(e); });
        };
        element.addEvent('mouseleave',close);
        button.removeEvent('click');
        button.addEvent('click',close);
    },

    buildItem: function(item,ul,alt)
    {
        var self=this;
        var o=self.options;

        var li=new Element('li',{'class':this.options.itemCssClass}).inject(ul);
        if(alt && o.alternateItems) li.addClass('alt');
        if(item.isSelected && o.canSelect) li.addClass('C');
        li.addEvent('click',function(e) { self.onSelected(e,item); });
        li.addEvent('mouseover',function(e) { self.onOver(e,item); } );
        li.addEvent('mouseout',function(e) { self.onOut(e,item); } );
        item._element=li;

        var id=o.id+'$'+item.value;
        var input=new Element('input', { 'type': 'checkbox', 'name': id, 'id': id, 'value': item.value }).inject(li);
        input.checked = item.isChecked;
        input.addEvent('click',function(e) { self.fireEvent('checked',[item,e]); });
        item._checkBox = input;

        if(!o.canSelect) {
            if(item.isChecked) item._element.addClass('C');
            else item._element.removeClass('C');
        }

        new Element('span',{'text':item.text}).inject(li);

        return li;
    },

    buildBar: function(item,ul)
    {
        var li=new Element('li',{'class':this.options.barCssClass}).inject(ul);
        item._element=$(li);
        new Element('hr').inject(li);
        return li;
    },

    itemFromHTML: function(rw)
    {
        var item=new Hash;
        rw=$(rw);
        item._element=rw;

        var inp=rw.getElement('input');
        if(inp) {
            item.id=inp.id;
            item.name=inp.name;
            item.value=inp.value;
            item.isChecked=inp.checked;
            item._checkBox = inp;
        }

        if(rw.getElement('hr')) item.isBar=true;
        else {
            var c=rw.getElements('TD');
            if(c.length>1) {
                item.text=c[1].innerText;
                item.canSelect=true;
            } else {
                item.text=c[0].innerText;
            }
        }

        this.options.items.push(item);
    }
});                        
