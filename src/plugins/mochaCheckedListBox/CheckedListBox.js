/*

Script: CheckListBox.js
	Create a list with check boxes next to each item

Copyright:
	Copyright (c) 2010 Chris Doty, <http://polaropposite.com/>.

License:
	MIT-style license.

*/

MUI.files[MUI.path.plugins + 'mochaCheckedListBox/CheckedListBox.js'] = 'loaded';

MUI.CheckedListBoxItem = new Class({
initialize: function(item)
{   
    if(item) this.fromJSON(item);    
    this.Event = {}; 
},

toDOM: function() 
{
    var o=this;        
    
    var tr=new Element('tr');    
    tr.className=o.List.CssClass;
    o.Row=$(tr);
    
    var td=new Element('td');
    tr.appendChild(td);

    var id=o.List.Name+'$'+o.Value;
    var input=new Element('INPUT', { 'type': 'checkbox', 'name': id, 'id': id, 'value': o.Value });
    td.appendChild(input);
    input.checked = o.Checked;
    o.CheckBox = input;
    
    if(o.List.CanSelect) {
        td=$(new Element('td'));
        td.style.width="100%";        
        o.setEvents(td,input);       
        tr.appendChild(td);
    } else o.setEvents(td,input);

    td.appendChild(document.createTextNode(o.Text));
    
    return tr;
},

fromHTML: function(rw) 
{
    var o=this;
    rw=$(rw);
    o.Row=rw;
    
    var inp=rw.getElement('input');                
    o.ID=inp.id;             
    o.Name=inp.Name;
    o.Value=o.ID.split('_').pop();
    o.CheckBox = inp;
    
    var c=rw.getElements('TD');    
    if(c.length>1) {                    
        o.Text=c[1].innerText;
        o.setEvents(c[1],inp);
        o.List.CanSelect=true;
    } else {
        o.Text=c[0].innerText;
        o.setEvents(c[0],inp);
    }
},

setList: function(l) 
{
    this.List = l;
},

addEvent:function(name,func)
{
    this.Event[name]=func;
},

setEvents: function(td,inp)
{
    var o=this;
    if(td) {
        if(!this.Event['click']) this.Event['click']=function(e) {o.onSelect(e)};
        if(!this.Event['mouseover']) this.Event['mouseover']=function(e) {o.onOver(e)};
        if(!this.Event['mouseout']) this.Event['mouseout']=function(e) {o.onOut(e)};
        
        td.addEvent('click',this.Event['click']);    
        td.addEvent('mouseover',this.Event['mouseover']);    
        td.addEvent('mouseout',this.Event['mouseout']);    
    } else {
        if(!this.Event['click']) this.Event['click']=function(e) {o.onChecked(e)};
    }
    if(inp) inp.addEvent('click',function(e) {e=new Event(e);e.stopPropagation();o.onChecked(e)});
},

onSelect: function(e)
{
    var o=this;
    if(o.List.CanSelect) {
        if(!o.List.MultiSelect) 
        {
           for(var i=0;i<o.List.Items.length;i++) 
           {
              if(o.List.Items[i].Selected) {
                o.List.Items[i].Selected=false;
                o.List.Items[i].onOut();
              }
           }
           o.List.SelectedValue = o.Value;
        }
                
        o.Selected=!o.Selected;
        o.Row.className = this.List.CssClass+'C';
        o.List.DoCommand('Selected',o.Value+'#'+o.CheckBox.checked,null);
    }
    else { 
        o.CheckBox.checked = !o.CheckBox.checked; 
        o.Checked=o.CheckBox.checked;
        o.onChecked(e);
    }
},

onChecked: function(e)
{
    e.cancelBubble=true;
    var o=this;
    o.List.DoCommand('Checked',o.Value+'#'+o.CheckBox.checked,null);
    return true;
},

onOver: function()
{    
    this.Row.className = this.List.CssClass+'O';
},

onOut: function() 
{
    var o=this;
    o.Row.className = o.List.CssClass + (o.Selected?'C':'');
}

});  


MUI.CheckedListBoxBar = new Class({
initialize: function(item)
{   
    if(item) this.fromJSON(item);   
},

toDOM: function() 
{
    var o=this;        
    
    var tr=new Element('tr');    
    tr.className=o.List.CssClass;
    o.Row=$(tr);
    
    var td=new Element('td');
    tr.appendChild(td);
    td.set('html','<hr/>');    
    if(o.List.CanSelect) td.set('colspan',2);       
   
    return tr;
},

setList: function(l) 
{
    this.List = l;
}

});   
                      

MUI.CheckedListBox = new Class({
initialize: function( list  )
{    
    if(list) this.fromJSON(list);   
},

fromJSON: function(json) 
{
    var o=this;

    var items=json.Items;
    json.Items=null;
    o.parent(json);    
    o.Items=new Array();
    
//    o.AttachCommand();    

    if(!items) return;    
    for(var i=0;i<items.length;i++) 
    {
        var g=new mochaCheckedListBoxItem(items[i]);
        o.Items[o.Items.length]=g;
        g.setList(o);
    }        
},

fromHTML: function() 
{
    var o=this;
    var d=$(o.ID);
    if(d) {       
        o.DOM=d; 
//        o.AttachCommand();
        o.Items = new Array();
                        
        this.CssClass = d.className;
        var l=d.getElement('table');
        if(l) {
            var rows=l.getElements('TR');
            for(var i=0;i<rows.length;i++) 
            {
                var itm=new MUI.CheckedListBoxItem();
                itm.setList(o);
                itm.fromHTML(rows[i]);
            }            
        }    
        
        d.style.visibility='visible';
    }
    
    o.saveState();
},

toDOM: function() 
{
    var o=this;        
    
    var d=$(o.ID);
    if(!d) { 
        d=new Element('div');
        d.className = o.CssClass;
        if(o.Width) o.style.width=parseInt(o.Width)+'px';
        if(o.Height) o.style.height=parseInt(o.Height)+'px';        
        d.id=o.ID;    
    }
    if(o.CssClass) d.className = o.CssClass;
    o.DOM = d;
    
    while(d.getElement('table'))
        d.removeChild(d.getElement('table'));
    
    var t=new Element('table');
    t.cellSpacing=0;
    t.cellPadding=0;
    t.style.width='100%';
    d.appendChild(t);
    
    var tb=new Element('tbody');
    t.appendChild(tb);
    
    for(var i=0;i<o.Items.length;i++) {
        tb.appendChild(o.Items[i].toDOM());
    }
    
    return $(d);
},

addItem: function(value,text,checked,selected)
{
    if(!selected) selected=false;
    if(!checked) checked=false;
    var itm=new MUI.CheckedListBoxItem({'Value':value,'Text':text,'Checked':checked,'Selected':selected});
    this.Items.push(itm);
    itm.setList(this);
    return itm;
},

addBar: function()
{
    var bar=new MUI.CheckedListBoxBar();
    this.Items.push(bar);
    bar.setList(this);
    return bar;
},

update: function(json)
{
    var o=this;
    if(json) o.fromJSON(json);
    o.toDOM();
}

});                        
