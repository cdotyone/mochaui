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
     cssClass:      'tree'
    ,nodes:         $A([])
    ,showCheckBox:  true
    ,textField:     'text'
    ,valueField:    'value'
    ,tipField:      'tip'
    ,selectedValue: ''
    ,selectedNode:  null
    ,expanded:      null
    ,container:     null
    ,depth:         2
    ,id: ''
    ,createOnInit:  true
    
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

toDOM: function(containerEl)
{
    var self=this;        
    var o=self.options;

    var isNew = false;
    var div=$(o.id);
    var ul;
    if(!div) { 
        div=new Element('div');
        div.id=o.id;
        isNew=true;
    } else ul=div.getElement('ul');
    if(!ul) {
        ul=new Element('ul').inject(div);
    } else ul.empty();
    if(o.cssClass) {
        div.set('class',o.cssClass);
        ul.set('class',o.cssClass);
    }
    self.element = div;   
    
    var nodes=o.nodes;
    if(o.nodes.length>1) {
        var li=new Element('li',{styles:{'border':'solid 1px white;'}}).inject(ul);
        ul=new Element('ul').inject(li);
    }
    nodes.each(function(node) {
        self.buildNode(node,ul,o.depth);
    });
    var last=ul.getChildren().getLast();
    if(last) last.addClass('last');
      
    o.depth=0;

    if(!isNew) return this;

    window.addEvent('domready', function() {
        var container=$(containerEl ? containerEl : o.container);
        container.appendChild(div);
    });

    return div;
},

selectValue: function(val,e) 
{
    var self=this;
    var node=self.nodeFind(val);
    self=self.options;
    if(node && node.DOM) {
        if(self.selectedNode && self.selectedNode._element) self.selectedNode._element.getElement('a').removeClass('sel');
        self.selectedNode = node;
        node._element.getElement('a').addClass('sel');
    }
    self.selectedValue = val;
    if(node) this.fireEvent('onNodeSelected',[e,node]);
},

updateNode: function(node) 
{
    if(!node) return;
    
    var self=this;
    var n=self.nodeFind(node.value);
    if(n) {    
        var el = node._element;
        n.fromJSON(node);
        if(el) {
            self.buildNode(node,el.getParent());
            self.setLast(el.getParent());
        }
    }   
},

buildNode: function(node, parent, depth) {
    var self = this;
    var o=this.options;
    if(!depth) depth=1;

    var a, span, t, ul, chk, li;
    if(node._element!=null) {li=node._element;}
    if(!li) li = new Element('li');
    else li.empty();

    if(parent) {
        if(parent._ul) li.inject(parent._ul);
        else li.inject(parent); 
    }

    if(o.showCheckBox) chk = new Element('INPUT', { 'type':'checkbox', 'value': node.value });
    a = new Element('a',{'href':'#' + node.value}).inject(li);
    span = new Element('span',{'text':node.text}).inject(a);

    self._element = li;
    if (node.tip) a.title = node.tip;

    if (chk) chk.checked = node.checked;

    if (o.selectedValue == node.value) {
        self.element.getElements('.sel').removeClass('sel');
        a.className = 'sel';
        o.selectedNode = self;
    }

    if (node.image) {
        span.style.background = 'transparent url(' + node.image + ') no-repeat scroll left top';
        span.style.paddingLeft = '20px';
    }

    if (node.nodes && node.nodes.length > 0) {
        if (!ul) ul = new Element('ul').inject(li);
        if (!node.isExpanded && o.depth<=depth) {
            ul.style.display = 'none';
            node.isExpanded=true;
        }
        node._ul =ul;
        
        for (var i = 0; i < node.nodes.length; i++) {
            self.buildNode(node.nodes[i],node,ul,depth+1);
        }
        ul.childNodes[ul.childNodes.length - 1].addClass('last');
    }
    if (node.isExpanded) li.set('class','O');
    else li.set('class','C');
    if ((!node.nodes || node.nodes.length == 0) && node.hasChildren == 0) li.set('class','nochild');


    // set events
    if (chk) {
        chk.removeEvents('click');
        chk.addEvent('click', function(e) { self.onNodeCheck(node,e); });
    }
    li.removeEvents('click');
    li.addEvent('click', function(e) { self.onNodeExpand(node,e); });
    a.removeEvents('click');
    a.addEvent('click', function(e) { self.onNodeClick(node,e); });

    return self;
},

nodeFind: function(val,node) {
    if (node!=null && node.options!=null && node.value && node.value + '' == val + '') { return node; }
    var nodes;
    if(node.options) nodes=node.options.nodes;
    if(nodes==null) nodes=node.nodes;
    if (nodes) {
        var l = nodes.length;
        for (var i = 0; i < l; i++) {
            var snode = this.nodeFind(val,nodes[i]);
            if (snode) return snode;
        }
    }
    return null;
},

nodeRefresh: function(node) {
    if(!node._element) return;
    this.buildNode(node,node._element.getParent());
    this.setLast(node._element.getParent());
},

nodeGetPath: function(node) {
    if(!node._parent) return node.value;
    return this.getPath(node._parent)+'/'+node.value;
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
},

onNodeExpand: function(node,e) {
    var self = this;
    var o=self.options;

    var itm=self._element;
    var mY=0;
    var mX=0;
    if(e) {
        e = new Event(e).stop();
        var c = itm.getCoordinates();
        mY = e.client.y - c.top;
        mX = e.client.x - c.left;
    }

    if (mX < 20 && mY < 20) {
        itm.addClass('last');
        var ul = itm.getElement('ul');
        if (ul && node.isExpanded) {
            ul.style.display = 'none';
            itm.removeClass('O');
            itm.addClass('C');
            node.isExpanded = false;
            return;
        }
        else if (ul && !node.isExpanded) {
            ul.style.display = '';
            itm.removeClass('C');
            itm.addClass('O');
            node.isExpanded = true;
            if (node.nodes.length > 0) return;
        }
    }

    if(o.hasChildren == 1 && o.nodes.length == 0) {
        self.fireEvent('nodeExpanded',[e,self]);
    }
    self.selectValue(node.value,e);
},

onNodeClick: function(node,e) {
    var self = this;
    e=new Event(e).stop();
    self.selectValue(node.value,e);
},

onNodeCheck: function(node,e) {
    var self = this;
    e=new Event(e).stop();
    self.fireEvent('nodeChecked',[node,self,e]);
}

});
