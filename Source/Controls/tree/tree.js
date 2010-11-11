/*
 ---

 name: Tree

 script: tree.js

 description: MUI - Creates a generic tree control.

 copyright: (c) 2010 Contributors in (/AUTHORS.txt).

 license: MIT-style license in (/MIT-LICENSE.txt).

 note:
 This documentation is taken directly from the javascript source files. It is built using Natural Docs.

 requires:
 - Core/Element
 - Core/Class
 - Core/Options
 - Core/Events
 - MUI
 - MUI.Core

 provides: [MUI.Tree]
 ...
 */

MUI.files['{controls}Tree/Tree.js'] = 'loaded';

MUI.Tree = new Class({

	Implements: [Events, Options],

	options: {
		id:					'',				// id of the primary element, and id os control that is registered with mocha
		container:			null,			// the parent control in the document to add the control to
		clearContainer:		true,			// should the control clear its parent container before it appends itself
		drawOnInit:			true,			// true to add tree to container when control is initialized
		cssClass:			'tree',			// the primary css tag

		content:			false,			// used to load content
		nodes:				[],				// the hierarchical list of nodes

		textField:			'text',			// the name of the field that has the node's text
		valueField:			'value',		// the name of the field that has the node's value
		idField:			'id',			// the name of the field that has anchors id value
		titleField:			'title',		// the name of the field that has the node's tip text
		isCheckedField:		'checked',		// the name of the field that has the node's isChecked state
		hasChildrenField:	'hasChildren',	// the name of the field that has the node's hasChildren flag
		imageField:			'image',		// the name of the field that has the node's image if imageOpenField and imageClosedField are not defined
		imageOpenField:		'imageOpen',	// the name of the field that has the node's open image
		imageClosedField:	'imageClosed',	// the name of the field that has the node's closed image
		showIcon:			true,

		showCheckBox:		false,			// true to show checkBoxes
		canSelect:			true,			// can the user select a node by clicking it
		value:				'',				// the currently selected node's value
		selectedNode:		null,			// the currently selected node
		depth:				2				// how deep to expand the nodes to

		//onNodeExpanded:	null			// event: called when node is expanded
		//onNodeChecked: 	null			// event: called when node's checkbox is checked
		//onNodeSelected:	null			// event: when a node is checked
		//onLoaded:		    null			// event: called when tree is done building itself
	},

	initialize: function(options){
		this.setOptions(options);

		// make sure this controls has an ID
		var id = this.options.id;
		if (!id){
			id = 'tree' + (++MUI.IDCount);
			this.options.id = id;
		}
		MUI.set(id, this);

		if (options.content){
			options.content.loadMethod = 'json';
			options.content.onLoaded = (function(element, options){
				this.options.nodes = MUI.Content.getRecords(options);
				this.draw();
			}).bind(this);
			MUI.Content.update(options.content);
		}

		// create sub items if available
		if (this.options.drawOnInit && this.options.nodes.length > 0) this.draw();
	},

	_getData: function(item, property){
		if (!item || !property) return '';
		if (item[property] == null) return '';
		return item[property];
	},

	draw: function(containerEl){
		var self = this;
		var o = self.options;

		var isNew = false;
		var div = $(o.id);
		var ul;
		if (!div){
			div = new Element('div', {'id': o.id, 'class': o.cssClass});
			isNew = true;
		} else ul = div.getElement('ul');
		if (!ul){
			div.empty();
			ul = new Element('ul', {'class': o.cssClass}).inject(div);
		} else ul.empty();
		self.element = div;

		var nodes = o.nodes;
		if (o.nodes.length > 1){
			var li = new Element('li').inject(ul);
			ul = new Element('ul').inject(li);
		}
		nodes.each(function(node){
			self.buildNode(node, ul, 1);
		});
		var first = ul.getFirst();
		if (first) first.addClass('first');
		var last = ul.getChildren().getLast();
		if (last) last.addClass('last');

		o.depth = 0;

		if (!isNew){
			self.fireEvent('loaded', [self]);
			return this;
		}

		window.addEvent('domready', function(){
			// determine parent container object
			if (!o._container && typeof(o.container) == 'string'){
				var instance = MUI.get(o.container);
				if (instance){
					div.setStyle('overflow', 'auto');
					if (instance.el.content) o._container = instance.el.content;
				}
				if (!o._container) o._container = $(containerEl ? containerEl : o.container);
			}

			if (o.clearContainer) o._container.empty();
			o._container.appendChild(div);

			self.fireEvent('loaded', [self]);
		});

		return div;
	},

	selectValue: function(val, e, suppressEvent){
		var self = this;
		var o = self.options;
		var node = self.nodeFind(val);
		if (!node) return;

		if (!o.canSelect){
			if (o.showCheckBox){
				node._checkbox.checked = !node._checkbox.checked;
				self.onNodeCheck(node, e);
			} else if (!suppressEvent) this.fireEvent('nodeSelected', [node, self, e]);
			return;
		}

		if (node._element){
			if (o.selectedNode && o.selectedNode._element) o.selectedNode._element.getElement('a').removeClass('sel');
			o.selectedNode = node;
			node._element.getElement('a').addClass('sel');
		}
		o.value = val;
		if (!suppressEvent) this.fireEvent('nodeSelected', [node, self, e]);
	},

	updateNode: function(node){
		if (!node) return;

		var self = this;
		var o = self.options;
		var n = node;
		if (!node._element) n = self.nodeFind(self._getData(node, o.valueField));
		if (n){
			var el = n._element;
			if (el){
				self.buildNode(node, el.getParent());
				self.setLast(el.getParent());
			}
		}
	},

	buildNode: function(node, parent, depth){
		var self = this;
		var o = this.options;
		if (!depth) depth = 1;

		var a, span, ul, li;
		var id = self._getData(node, o.idField);
		if (!id) id = 'tn' + (++MUI.IDCount);

		if (node._element != null) li = node._element;
		if (!li) li = new Element('li', {'id': id + '_li'});
		else li.empty();

		if (parent){
			if (parent._ul) li.inject(parent._ul);
			else li.inject(parent);
		}

		var value = self._getData(node, o.valueField);
		var text = self._getData(node, o.textField);
		if (o.showCheckBox) node._checkbox = new Element('INPUT', {'type': 'checkbox', 'value': value, 'id': id + '_cb'}).inject(li);
		node._a = new Element('a', {'href': '#' + value, 'id': id}).inject(li);
		node._span = new Element('span', {'text': text, 'id': id + '_tle'}).inject(node._a);
		if (o.showIcon) node._icon = new Element('span', {'class': 'treeIcon'}).inject(node._a, 'top');

		node._element = li;
		var title = self._getData(node, o.titleField);
		if (title) node._a.title = title;

		if (o.value == value){
			self.element.getElements('.sel').removeClass('sel');
			node._a.className = 'sel';
			o.selectedNode = self;
		}

		if (node.nodes && node.nodes.length > 0){
			if (!ul) ul = new Element('ul').inject(li);
			if (!node.isExpanded && o.depth <= depth){
				ul.style.display = 'none';
				node.isExpanded = false;
			} else node.isExpanded = true;
			node._ul = ul;

			for (var i = 0; i < node.nodes.length; i++){
				self.buildNode(node.nodes[i], node, ul, depth + 1);
			}
			ul.childNodes[ul.childNodes.length - 1].addClass('last');
		} else li.addClass('nochild');
		if (node.isExpanded) li.set('class', 'O');

		// add image to node if necessary
		this._nodeSetImage(node);

		var hasChildren = self._getData(node, o.hasChildrenField);
		if (hasChildren && li.hasClass('nochild')) li.removeClass('nochild').addClass('C');

		// set events
		if (node._checkbox){
			var isChecked = self._getData(node, o.isCheckedField);
			if (isChecked != null) node._checkbox.checked = isChecked;
			node._checkbox.removeEvents('click');
			node._checkbox.addEvent('click', function(e){
				self.onNodeCheck(node, e);
			});
		}
		li.removeEvents('click');
		li.addEvent('click', function(e){
			self.onNodeExpand(node, e);
		});
		node._a.removeEvents('click');
		node._a.addEvent('click', function(e){
			self.onNodeClick(node, e);
		});

		return self;
	},

	nodeFind: function(val, node){
		var self = this;
		var o = self.options;
		if (node != null){
			var value = self._getData(node, o.valueField);
			if (value && value + '' == val + '') return node;
		} else node = self;
		var nodes;
		if (node.options) nodes = node.options.nodes;
		if (nodes == null) nodes = node.nodes;
		if (nodes){
			var l = nodes.length;
			for (var i = 0; i < l; i++){
				var snode = this.nodeFind(val, nodes[i]);
				if (snode) return snode;
			}
		}
		return null;
	},

	nodeRefresh: function(node){
		if (!node._element) return;
		this.buildNode(node, node._element.getParent());
		this.setLast(node._element.getParent());
	},

	nodeGetPath: function(node){
		var self = this;
		var o = self.options;
		var value = self._getData(node, o.valueField);

		if (!node._parent) return value;
		return this.getPath(node._parent) + '/' + value;
	},

	setLast: function(node){
		if (!node) return this;
		if (node.childNodes){
			var u = node;
			if (node.nodeName != 'UL') u = node.getElement('ul');
			if (u){
				var children = u.getChildren();
				if (children){
					children.removeClass('last');
					children.getLast().addClass('last');
				}
			}
		}
		return this;
	},

	onNodeExpand: function(node, e){
		var self = this;

		var itm = node._element;
		var mY = 0;
		var mX = 0;
		if (e){
			e = new Event(e).stop();
			var c = itm.getCoordinates();
			mY = e.client.y - c.top;
			mX = e.client.x - c.left;
		}

		if (mX < 20 && mY < 20){
			var ul = itm.getElement('ul');
			if (ul && node.isExpanded){
				ul.style.display = 'none';
				itm.removeClass('O');
				itm.addClass('C');
				node.isExpanded = false;
				//return;
			} else if (ul && !node.isExpanded){
				ul.style.display = '';
				itm.removeClass('C');
				itm.addClass('O');
				node.isExpanded = true;
				//if (node.nodes.length > 0) return;
			}
			this._nodeSetImage(node);
		}

		self.fireEvent('nodeExpanded', [node, node.isExpanded, self, e]);
	},

	_nodeSetImage: function(node){
		var o = this.options;
		var span = node._span;
		var def = this._getData(node, o.imageField);
		var open = this._getData(node, o.imageOpenField) || def;
		var closed = this._getData(node, o.imageClosedField) || def;

		span.removeClass(closed).removeClass(open);

		if (closed && !node.isExpanded){
			if (closed.indexOf('.') < 0) span.addClass(closed);
			else span.setStyles({'background': 'transparent url(' + closed + ') no-repeat scroll left top', 'paddingLeft': '20px'});
		}
		if (open && node.isExpanded){
			if (open.indexOf('.') < 0) span.addClass(open);
			else span.setStyles({'background': 'transparent url(' + open + ') no-repeat scroll left top', 'paddingLeft': '20px'});
		}
	},

	onNodeClick: function(node, e){
		var self = this;
		var o = self.options;
		e = new Event(e).stop();
		self.selectValue(self._getData(node, o.valueField), e);
	},

	onNodeCheck: function(node, e){
		var self = this;
		e = new Event(e).stopPropagation();
		self.fireEvent('nodeChecked', [node, node._checkbox.checked, self, e]);
	}

});
