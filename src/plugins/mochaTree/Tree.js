/*

Script: Tree.js
	Creates a generic tree control

Copyright:
	Copyright (c) 2010 Chris Doty, <http://polaropposite.com/>.

License:
	MIT-style license.

*/

MUI.files[MUI.path.plugins + 'mochaTree/Tree.js'] = 'loaded';

MUI.TreeItem = new Class({
    Implements: [Options],
    
    options: {
         Text:          ''
        ,Value:         ''        
        ,Expanded:      0
        ,HasChildren:   0
        ,Selected:      0
        ,Checked:       0
        ,Tip:           null
        ,Image:         null
        ,Nodes:         $A([])
        ,Data:          null
    },
    
    initialize: function(options,tree,parentNode) {
        this.setOptions(options);
        this.Tree=tree;
        this.Data=options;
        this.ParentNode=parentNode;
        if(options) {
            var topt=this.Tree.options;
            if(!options.Text) this.options.Text=options[topt.TextField];
            if(!options.Value) this.options.Value=options[topt.ValueField];
            if(!options.Tip) this.options.Tip=options[topt.TipField];        
            this.setNodes(options.Nodes);        
        }
    },

    setNodes: function(nodes) {
        if (!nodes) return;
        var o=this;

        var options = o.options;
        options.Nodes=$A([]);
        if (nodes && nodes.length > 0) {
            for (var i = 0; i < nodes.length; i++) {
                options.Nodes[options.Nodes.length] = new MUI.TreeItem(nodes[i],this.Tree,o);
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

        chk = o.createField('checkbox',options.Value,'');
        a = new Element('a');
        s = new Element('span');
        t = document.createTextNode(options.Text);
        l.appendChild(a);
        a.appendChild(s);
        s.appendChild(t);

        if (!nosave) o.DOM = l;
        if (a) {
            if (options.Tip) a.title = options.Tip;
            a.href = '#' + options.Value;
        }

        if (chk) chk.checked = options.Checked;

        if (o.Tree && o.Tree.options.SelectedValue == options.Value) {
            o.Tree.DOM.getElements('.sel').removeClass('sel');
            if (a) a.className = 'sel';
            o.Tree.options.SelectedNode = o;
        }

        if (options.Image) {
            s.style.background = 'transparent url(' + options.Image + ') no-repeat scroll left top';
            s.style.paddingLeft = '20px';
        }

        if (options.Nodes && options.Nodes.length > 0) {
            if (!u) {
                u = new Element('ul');
                l.appendChild(u);
            }
            if (options.Expanded == 0 && topt.Depth<=depth) u.style.display = 'none';

            for (var i = 0; i < options.Nodes.length; i++) {
                u.appendChild(options.Nodes[i].toDOM(false,false,depth+1));
            }
            u.childNodes[u.childNodes.length - 1].addClass('last');
        }
        if (options.Expanded != 0) l.className = 'O';
        else l.className = 'C';
        if ((!options.Nodes || options.Nodes.length == 0) && options.HasChildren == 0) l.className = 'nochild';

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
            if (ul && options.Expanded == 1) {
                ul.style.display = 'none';
                itm.className = 'C' + last;
                options.Expanded = 0;
                return;
            }
            else if (ul && options.Expanded == 0) {
                ul.style.display = '';
                itm.className = 'O' + last;
                options.Expanded = 1;
                if (options.Nodes.length > 0) return;
            }
        }
       
        if(options.HasChildren == 1 && options.Nodes.length == 0) {
            o.Tree.fireEvent('onNodeExpanded',[e,o]);
        }
        o.Tree.selectValue(o.options.Value,e);
    },

    click: function(e) {
        var o = this;
        e=new Event(e);
        e.stop();
        o.Tree.selectValue(o.options.Value,e);
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
        if(!o.ParentNode) return o.options.Value;
        return o.ParentNode.getPath()+'/'+o.options.Value;
    }
});

MUI.Tree = new Class({
Implements: [Events, Options],
options: {
     CssClass:      'treeView'
    ,Nodes:         $A([])
    ,TextField:     'Text'
    ,ValueField:    'Value'
    ,TipField:      'Tip'
    ,SelectedValue: ''
    ,SelectedNode:  null
    ,Expanded:      null
    ,ParentElement: false
    ,Depth:         2
    ,ID: ''
    
    ,onNodeExpanded:$empty
    ,onNodeChecked: $empty
    ,onNodeSelected:$empty
},

initialize: function( options )
{
    this.setOptions(options);
    PO.addControl(this);
    if(options) this.setNodes(options.Nodes)
},

setNodes: function(nodes) 
{   
    if (!nodes) return;
      
    var options=this.options;
    options.Nodes=$A([]);    
    if (nodes && nodes.length > 0) {
        for (var i = 0; i < nodes.length; i++) {
            options.Nodes[options.Nodes.length] = new MUI.TreeItem(nodes[i],this);
        }
    }    
    
    this.options=options;
},

toDOM: function() 
{
    var o=this;        
    var options=o.options;
    
    var d=$(options.ID);    
    var u;
    if(!d) { 
        d=new Element('div');
        d.id=options.ID;    
    } else u=d.getElement('ul');
    if(!u) {
        u=new Element('ul');
        d.appendChild(u);    
    } else u.empty();
    if(options.CssClass) { 
        d.className = options.CssClass;
        u.className = options.CssClass;
    }
    o.DOM = d;   
    
    var nodes=options.Nodes;
    if(options.Nodes.length>1) {
        var l=new Element('li');
        l.setStyle('border','solid 1px white;');
        u.appendChild(l);
        u=new Element('ul');  
        l.appendChild(u);      
    }
    nodes.each(function(node){ u.appendChild(node.toDOM(false,false,1)); });
    var last=u.getChildren().getLast();
    if(last) last.addClass('last');
      
    if(options.ParentElement) options.ParentElement.appendChild(d);
    o.options.Depth=0;
    
    return d;
},

selectValue: function(val,e) 
{
    var o=this;
    var n=o.nodeFind(o,val);
    o=o.options;
    if(n && n.DOM) {
        if(o.SelectedNode && o.SelectedNode.DOM) o.SelectedNode.DOM.getElement('a').className='';
        o.SelectedNode = n;
        n.DOM.getElement('a').className = 'sel';
    }
    o.SelectedValue = val;    
    if(n) this.fireEvent('onNodeSelected',[e,n]);
},

updateNode: function(data) 
{
    if(!data) return;
    
    var o=this;
    var n=o.nodeFind(o,data.Value);
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
