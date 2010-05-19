/*

Script: Tree.js
	Creates a generic tree control

Copyright:
	Copyright (c) 2010 Chris Doty, <http://polaropposite.com/>.

License:
	MIT-style license.

*/

MUI.files[MUI.path.plugins + 'mochaTree/Tree.js'] = 'loaded';

MUI.Tree = new Class({

Implements: [Events, Options],

options: {
     cssClass:      'treeView'
    ,nodes:         $A([])
    ,textField:     'text'
    ,valueField:    'value'
    ,tipField:      'tip'
    ,selectedValue: ''
    ,selectedNode:  null
    ,expanded:      null
    ,parentElement: false
    ,depth:         2
    ,id: ''
    
    ,onNodeExpanded:$empty
    ,onNodeChecked: $empty
    ,onNodeSelected:$empty
},

initialize: function( options )
{
    this.setOptions(options);

    // make sure this controls has an ID
    var id=this.options.id;
    if(!id) { id='tree' + (++MUI.IDCount); this.options.id=id; }

    // create sub items if available
    if(this.options.createOnInit && this.options.nodes.length>0) this.toDOM();

    MUI.set(id,this);    
},

toDOM: function() 
{
    var self=this;        
    var o=self.options;
    
    var d=$(o.id);
    var u;
    if(!d) { 
        d=new Element('div');
        d.id=o.id;
    } else u=d.getElement('ul');
    if(!u) {
        u=new Element('ul');
        d.appendChild(u);    
    } else u.empty();
    if(o.cssClass) {
        d.set('class',o.cssClass);
        u.set('class',o.cssClass);
    }
    self.element = d;   
    
    var nodes=o.nodes;
    if(o.nodes.length>1) {
        var l=new Element('li',{styles:{'border':'solid 1px white;'}}).inject(u);
        u=new Element('ul').inject(l);
    }
    nodes.each(function(node) { self.buildNode(node,self,u); });
    var last=u.getChildren().getLast();
    if(last) last.addClass('last');
      
    if(o.parentElement) o.parentElement.appendChild(d);
    self.options.depth=0;
    
    return d;
},

selectValue: function(val,e) 
{
    var o=this;
    var n=o.nodeFind(o,val);
    o=o.options;
    if(n && n.DOM) {
        if(o.selectedNode && o.selectedNode.DOM) o.selectedNode.DOM.getElement('a').className='';
        o.selectedNode = n;
        n.DOM.getElement('a').className = 'sel';
    }
    o.selectedValue = val;
    if(n) this.fireEvent('onNodeSelected',[e,n]);
},

updateNode: function(data) 
{
    if(!data) return;
    
    var o=this;
    var n=o.nodeFind(o,data.value);
    if(n) {    
        var dom = n.DOM;
        n.fromJSON(data);
        if(dom) {         
            n.toDOM(false,dom);
            o.setLast(dom.getParent());
        }
    }   
},

setLast: function(node) 
{
    if(node.childNodes) 
    {
        var u=node;
        if(node.nodeName!='UL') u=node.getElement('ul');
        if(u) {
            var children=u.getChildren();
            if(children){
                children.removeClass('last');
                children.getLast().addClass('last');
            }
        }
    }
}
    
});


/*
MUI.TreeItem = new Class({
    Implements: [Options],

    options: {
         text:          ''
        ,value:         ''
        ,expanded:      0
        ,hasChildren:   0
        ,selected:      0
        ,checked:       0
        ,tip:           null
        ,image:         null
        ,nodes:         $A([])
        ,data:          null
    },

    initialize: function(options,tree,parentNode) {
        this.setOptions(options);
        this.Tree=tree;
        this.data=options;
        this.ParentNode=parentNode;
        if(options) {
            var topt=this.Tree.options;
            if(!options.text) this.options.text=options[topt.TextField];
            if(!options.value) this.options.value=options[topt.ValueField];
            if(!options.tip) this.options.tip=options[topt.TipField];
            this.setNodes(options.nodes);
        }
    },

    setNodes: function(nodes) {
        if (!nodes) return;
        var o=this;

        var options = o.options;
        options.nodes=$A([]);
        if (nodes && nodes.length > 0) {
            for (var i = 0; i < nodes.length; i++) {
                options.nodes[options.nodes.length] = new MUI.TreeItem(nodes[i],this.Tree,o);
            }
        }
        this.options=options;
    },

    toDOM: function(nosave, l, depth) {
        var o = this;
        var options=this.options;
        var topt=this.Tree.options;
        if(!depth) depth=1;

        var a, s, t, u, chk;
        if(l==null && o.DOM!=null) {l=o.DOM;}
        if(!l) l = new Element('li');
        else l.empty();

        chk = o.createField('checkbox',options.value,'');
        a = new Element('a');
        s = new Element('span');
        t = document.createTextNode(options.text);
        l.appendChild(a);
        a.appendChild(s);
        s.appendChild(t);

        if (!nosave) o.DOM = l;
        if (a) {
            if (options.tip) a.title = options.tip;
            a.href = '#' + options.value;
        }

        if (chk) chk.checked = options.checked;

        if (o.Tree && o.Tree.options.SelectedValue == options.value) {
            o.Tree.DOM.getElements('.sel').removeClass('sel');
            if (a) a.className = 'sel';
            o.Tree.options.SelectedNode = o;
        }

        if (options.image) {
            s.style.background = 'transparent url(' + options.image + ') no-repeat scroll left top';
            s.style.paddingLeft = '20px';
        }

        if (options.nodes && options.nodes.length > 0) {
            if (!u) {
                u = new Element('ul');
                l.appendChild(u);
            }
            if (options.expanded == 0 && topt.Depth<=depth) u.style.display = 'none';

            for (var i = 0; i < options.nodes.length; i++) {
                u.appendChild(options.nodes[i].toDOM(false,false,depth+1));
            }
            u.childNodes[u.childNodes.length - 1].addClass('last');
        }
        if (options.expanded != 0) l.className = 'O';
        else l.className = 'C';
        if ((!options.nodes || options.nodes.length == 0) && options.hasChildren == 0) l.className = 'nochild';

        o.setEvents();

        return l;
    },

    toHTML: function() {
        var e = new Element('div');
        e.appendChild(this.toDOM(true));
        return e.innerHTML;
    },

    expand: function(e) {
        var o = this;
        var options=o.options;

        var itm=o.DOM;
        var mY=0;
        var mX=0;
        if(e) {
            e = new Event(e);
            e.stop();
            var c = itm.getCoordinates();
            mY = e.client.y - c.top;
            mX = e.client.x - c.left;
        }

        if (mX < 20 && mY < 20) {
            var last = '';
            if (itm.className.indexOf('last') > -1) last = ' last';
            var ul = itm.getElement('ul');
            if (ul && options.expanded == 1) {
                ul.style.display = 'none';
                itm.className = 'C' + last;
                options.expanded = 0;
                return;
            }
            else if (ul && options.expanded == 0) {
                ul.style.display = '';
                itm.className = 'O' + last;
                options.expanded = 1;
                if (options.nodes.length > 0) return;
            }
        }

        if(options.hasChildren == 1 && options.nodes.length == 0) {
            o.Tree.fireEvent('onNodeExpanded',[e,o]);
        }
        o.Tree.selectValue(o.options.value,e);
    },

    click: function(e) {
        var o = this;
        e=new Event(e);
        e.stop();
        o.Tree.selectValue(o.options.value,e);
    },

    check: function(e) {
        var o = this;
        e=new Event(e);
        e.stop();
        o.Tree.fireEvent('onNodeChecked',[e,o]);
    },

    setEvents: function() {
        var o = this;
        if (o.DOM) {
            var li = $(o.DOM);
            var a = li.getElement('a');
            var inp = li.getElement('input');
            if (!a) return;

            if (li) {
                if (inp) {
                    inp.removeEvents('click');
                    inp.addEvent('click', function(e) { new Event(e).stop(); o.check(e) });
                }
                li.removeEvents('click');
                li.addEvent('click', function(e) { new Event(e).stop(); o.expand(e) });
                a.removeEvents('click');
                a.addEvent('click', function(e) { new Event(e).stop(); o.click(e) });
            }
        }
    },

    refreshNode: function() {
        this.toDOM();
        this.Tree.setLast(this.DOM.getParent());
    },

    getPath: function() {
        var o=this;
        if(!o.ParentNode) return o.options.value;
        return o.ParentNode.getPath()+'/'+o.options.value;
    }
});
*/
