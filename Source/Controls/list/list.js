/*
 ---

 name: List

 script: list.js

 description: MUI.List - Creates a generic list.

 copyright: (c) 2011 Contributors in (/AUTHORS.txt).

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

 provides: [MUI.List]
 ...
 */

MUI.List = new NamedClass('MUI.List', {

	Implements: [Events, Options],

	options: {
		id:					'',			// id of the primary element, and id os control that is registered with mocha
		container:			null,		// the parent control in the document to add the control to
		clearContainer:		false,		// should the control clear its parent container before it appends itself
		drawOnInit:			true,		// true to add tree to container when control is initialized
		cssClass:			'list',		// the primary css tag

		showCommand:		true,		// turns row commands on or off
		commands:			[],			// commands to be used

		content:			false,		// used to load content
		items:				[],			// the array list of nodes
		columns:			[],			// the list of columns to be used

		alternateRows:		false,		// show the items with alternating background color
		showCheckBox:		false,		// true to show checkBoxes
		navigateURL:		'',			// the base url to navigate from
		canSelect:			true,		// can the user select a row by clicking it
		value:				'',			// the currently selected item's value
		selectedItem:		null		// the currently selected item

		//onItemCommand:	null,		// event: when a command is performed
		//onItemSelected:	null,		// event: when a node is selected
		//onItemChecked:	null,		// event: when a node is selected
		//onItemColumnBound:null		// event: when a node's column is bound to the data
	},

	initialize: function(options){
		this.setOptions(options);
		options = this.options;

		// If list has no ID, give it one.
		this.id = options.id = options.id || 'list' + (++MUI.idCount);
		MUI.set(this.id, this);

		if(options.content) {
			options.content.loadMethod = MUI.getDefaultJsonProvider(options.content.loadMethod);
			options.content.onLoaded = (function(element, options) {
				this.options.items = MUI.Content.getRecords(options);
				this.draw();
			}).bind(this);
			MUI.Content.update(options.content);
			return;
		}

		// create sub items if available
		if (this.options.drawOnInit && this.options.items.length > 0) this.draw();
	},

	draw: function(container){
		var o = this.options;
		if (!container) container = o.container;

		// see if we need build columns automagically
		if (o.columns == null || o.columns.length == 0){
			var ii = 0;
			o.columns = [];
			var first = o.items[0];
			Object.each(first,function(value, key){
				var h = {'text':key,'name':key};
				if (typeOf(value) == 'boolean') h.type = 'checkbox';
				if (ii == 0) h['value'] = key;
				o.columns.push(h);
				i++;
			});
		}

		// build control's wrapper div
		var isNew = false;
		var div = o.element ? o.element : $(o.id);
		if (!div){
			div = new Element('div', {'id': o.id});
			isNew = true;
		}
		if (o.cssClass) div.set('class', o.cssClass);
		this.element = div;

		//-------------------------
		// build table
		var table = div.getElement('table');
		if (!table){
			table = new Element('table', {'cellSpacing':0,'cellPadding':0,'styles':{'width':'100%'}}).inject(div);
		}

		// build column headers
		var tbody = table.getElement('tbody');
		var i,tr;
		if (!tbody){
			tbody = new Element('tbody').inject(table);

			tr = new Element('tr', {'class':'head'}).inject(tbody);
			var cl = o.columns;
			for (i = 0; i < cl.length; i++){
				var td = new Element('td', {'html':cl[i].text.replace(new RegExp(/\|/g), '<br/>'),'valign':'bottom'}).inject(tr);
				if (i == 0){
					td.addClass('first');
				}
				if (cl[i].align){
					td.set('align', cl[i].align);
				}
			}

			// add command headers if they have commands
			if (o.commands && o.commands.length > 0){
				tr.appendChild(new Element('td', {'class':'head','html':'&nbsp;'}));
			}
		}

		// determine currently selected item
		var value = o.value;

		// build rows
		var items = o.items;
		if (items){
			for (i = 0; i < items.length; i++){
				// build the row
				var item = items[i];
				this._buildItem(item, tbody);
				tr = item._element;

				// select row if it needs to selected
				var sel = (item.value == value && value != '');
				item.selected = sel;
				if (sel) tr.addClass('C');
				else if (i % 2 && o.alternateRows) tr.addClass('alt');
			}
		}

		// add to container
		var addToContainer = function(){
			if (typeOf(container) == 'string') container = $(container);
			if( o.clearContainer ) container.empty();
			if (div.getParent() == null) div.inject(container);

			container.setStyle('overflow','auto');

			var instance=MUI.get(container);
			if(instance && instance.el && instance.el.content)
				instance.el.content.setStyle('padding','0');
		}.bind(this);
		if (!isNew || typeOf(container) == 'element') addToContainer();
		else window.addEvent('domready', addToContainer);

		return this;
	},

	_buildItem: function(item, parent){
		var self = this;
		var o = self.options;
		var id = o.id;

		var cl = o.columns;
		var value = '' + MUI.getData(item, cl[0].value);
		if (!value) value = '' + parent.childNodes.length;
		var rid = id + '_' + value.replace(/[\s\.]/g, '_');

		var tr = $(rid);
		if (!tr) tr = $(new Element('tr', { 'id': rid })).inject(parent);
		item._element = tr;

		var i,td,tid,img,a;
		for (i = 0; i < cl.length; i++){
			var col = cl[i];
			tid = rid + '_' + i;
			td = tr.getElementById(tid);

			// create column cell
			if (td) td.empty();
			else {
				td = new Element('td', { 'id': tid }).inject(tr);
			}
			if (col.align){
				td.set('align', col.align);
			}
			if (col.cssClass) td.set('class', col.cssClass);

			// create items text node
			var txt = document.createTextNode(MUI.getData(item, col.name));

			if (i == 0){
				// special handling of first column
				if (o.showCheckBox){
					var cb = new Element('input', { 'type': 'checkbox', 'name': id + '$checked', 'value': value }).inject(td);
					cb.addEvent('click', function(event){
						event.stopPropagation();
						self.fireEvent('itemChecked', [item,self,parent]);
					});
				} /*else if (!self.value) td.addEvent('click', function(event){
					event.stopPropagation();
				});*/

				// create image if needed
				if (col.image){
					var cImage = MUI.getData(item, col.image);
					cImage=MUI.replacePaths(cImage);
					if (cImage) img = new Element('img', {'alt':'','src':cImage});
				}

				if (o.canSelect){
					a = new Element('a');

					// add tip
					if (col.tipTitle){
						tip = MUI.getData(item, col.tipTitle);
						if (tip){
							a.store('tip:title', tip);
							a.set('class', 'Tips');
						}
					}
					if (col.tipText){
						tip = MUI.getData(item, col.tipText);
						if (tip){
							a.store('tip:text', tip);
							a.set('class', 'Tips');
						}
					}

					// add navigational link
					if (col.URL){
						if (col.Target){
							var tgt = MUI.getData(item, col.target);
							if (tgt){
								a.target = tgt;
							}
						}
						if (col.urlCssClass){
							var cls = MUI.getData(item, col.Target, col.urlCssClass);
							if (cls){
								a.set('class', tgt);
							}
						}

						var url = MUI.getData(item, col.Target, col.urlCssClass);
						if (url){
							url = url.replace(/~/, o.navigateURL);
							a.set('href', url);
						}
					} else a.setStyle('text-decoration', 'none');

					// add image
					if (img){
						a.setStyle('text-decoration', 'none');
						a.appendChild(img);
						var s = new Element('a').inject(a);
						s.appendChild(txt);
					} else a.appendChild(txt);

					td.appendChild(a);

					// create tip object
					if (col.tipTitle) var tip = new Tips(new Array(a), { maxTitleChars: 50 });
				} else {
					if (img) td.appendChild(img);
					td.appendChild(txt);
				}
			} else {
				// add columns
				if (col.type == "checkbox"){
					var chk = new Element('input', { 'type': 'checkbox', 'name': id + '_' + col.name, id:id + '_' + col.name + i ,'value':value }).inject(td);
					if (('' + MUI.getData(item, col.name)) == 'true') chk.set('checked', 'true');
				} else td.appendChild(txt);
			}
			self.fireEvent('itemColumnBound', [item,self,col,td]);
		}

		var cm = o.commands;
		if (cm && cm.length > 0 && o.showCommand){
			tid = rid + '_commands';

			// create command cell
			td = tr.getElementById(tid);
			if (td) td.empty();
			else {
				td = new Element('td', { 'id': tid });
				tr.appendChild(td);
			}

			Object.each(cm,function(cmd) {
				// show event is used to determine if commands should be displayed
				var showEvt = self.canShowEvent(self, item, cmd.name);
				if (showEvt){
					a = $(new Element('a'));
					a.title = cmd.text;
					a.href = "#" + cmd.name;
					a.addEvent('click', function(e){
						self._itemCommand(e, item, parent, cmd);
						return false;
					});

					td.appendChild(a);

					if (cmd.image){
						img = new Element('img');
						img.alt = cmd.text;
						img.src = cImage=MUI.replacePaths(cmd.image);
						a.appendChild(img);
					} else {
						a.set('html', cmd.text);
					}
				}
			});
		}

		// add select events
		if (o.canSelect){
			tr.removeEvents('mouseover');
			tr.removeEvents('mouseout');
			tr.removeEvents('click');
			tr.addEvent('mouseover', function(e){
				self._itemOver(e, item, parent);
			});
			tr.addEvent('mouseout', function(e){
				self._itemOut(e, item, parent);
			});
			tr.addEvent('click', function(e){
				self._itemClick(e, item, parent);
			});
		}

		return tr;
	},

	_itemCommand: function(e, item, parent, cmd){
		var self = this;
		e = new Event(e);
		e.stop();
		var t = $(e.target);
		if (t.nodeName != 'A') t = t.getParent('a');
		var img = t.getElement('img');
		self.fireEvent('itemCommand', [item,self,cmd,img]);
	},

	_itemClick: function(e, item, parent){
		var self = this;
		var o = self.options;

		// set last selected for entire control
		o.value = item.value;
		o.selectedItem = item;

		self.fireEvent('itemSelected', [item,self,parent]);
		if (item._element || parent){
			if (!parent) parent = item._element.getParent();
			parent.getElements('.C').removeClass('C');
			item._element.addClass('C');
		}
		return this;
	},

	_itemOver: function(e, item){
		if (item._element){
			item._element.addClass('O');
		}
		return this;
	},

	_itemOut: function(e, item){
		if (item._element){
			item._element.removeClass('O');
		}
		return this;
	},

	canShowEvent: function(){
		return true;
	},

	update: function(items){
		var self = this;
		self.options.items = items;
		self.draw();
	}

});
