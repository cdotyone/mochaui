/*
 ---

 name: SelectList

 script: selectlist.js

 description: MUI - Create a list with check boxes next to each item.

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

 provides: [MUI.SelectList]
 ...
 */

MUI.files['{controls}selectList/selectList.js'] = 'loaded';

MUI.SelectList = new NamedClass('MUI.SelectList', {

	Implements: [Events, Options],

	options: {
		id:					'',				// id of the primary element, and id os control that is registered with mocha
		container:			null,			// the parent control in the document to add the control to
		clearContainer:		false,			// should the control clear its parent container before it appends itself
		drawOnInit:			true,			// true to add tree to container when control is initialized
		cssClass:			'slb',			// the primary css tag

		content:			false,			// used to load content
		items:				[],				// the array list of nodes

		textField:			'text',			// the name of the field that has the item's text
		valueField:			'value',		// the name of the field that has the item's value
		titleField:			'title',		// the name of the field that has the item's tip text
		isSelectedField:	'selected',		// the name of the field that has the item's isSelected state

		isDropList:			true,			// show this control as a drop list
		dropCssClass:		'dslb',			// the class to use when displaying the drop list parent control
		dropText:			'{$} Selected',	// the text to show on the drop list when items are selected

		alternateRows:		false,			// show the items with alternating background color
		width:				0,				// width of the control
		height:				0,				// height of the control when not in drop list mode, or height of drop
		canMultiSelect:		true,			// can the user select multiple items
		showCheckBox:		true,			// true to show checkBoxes
		value:				'',				// the currently selected item's value
		selectedItem:		null,			// the last selected item
		selectedItems:		[]				// all of the the currently selected item

		//onItemSelected:	null			// event: when a node is selected
	},

	initialize: function(options){
		this.setOptions(options);
		options = this.options;

		// If selectList has no ID, give it one.
		this.id = options.id = options.id || 'selectList' + (++MUI.idCount);
		MUI.set(this.id, this);

		if (options.content){
			options.content.instance = this;
			MUI.Content.update(options.content);
		}

		// create sub items if available
		if (options.drawOnInit && options.items.length > 0) this.draw();
	},

	draw: function(container){
		var o = this.options;
		if (!container) container = o.container;

		var id = o.id;
		var drop;
		if (o.isDropList){
			var panel = o.element ? o.element : $(o.id);
			if (!panel){
				panel = new Element('div', {id:id});
				if (o.width) panel.setStyle('width', parseInt('' + o.width) + 'px');
			}
			panel.empty();

			drop = new Element('div', {id:id + '_droplist','class':o.dropCssClass,styles:{'width':parseInt('' + o.width) + 'px'}}).inject(panel);
			this.dropElement = drop;
			drop.addEvent('click', function(e){
				this._open(e);
			}.bind(this));

			this.textElement = new Element('div', {id:id + '_text','class':'text','text':'1 selected',styles:{'width':(parseInt('' + o.width) - 24) + 'px'}}).inject(drop);
			this.buttonElement = new Element('div', {id:id + '_button','class':'button','html':'&nbsp;'}).inject(drop);

			o.id += '_list';
			o.isOpen = false;
		}

		var div = o.element ? o.element : $(o.id);
		var isNew = false;
		if (!div){
			div = new Element('div', {'id':id});
			if (o.width) div.setStyle('width', (parseInt('' + o.width) - 2) + 'px');
			if (o.height) div.setStyle('height', parseInt('' + o.height) + 'px');
			isNew = true;
		}
		this.element = div.addClass(o.cssClass);

		div.empty();

		var ul = new Element('ul').inject(div);

		for (var i = 0; i < o.items.length; i++){
			if (o.items[i].isBar) this._buildBar(o.items[i], ul);
			else this._buildItem(o.items[i], ul, (i % 2));
		}

		// add to container
		var addToContainer = function(){
			if (typeOf(container) == 'string') container = $(container);
			if (o.clearContainer) o._container.empty();

			container.setStyle('padding', '0');
			if (drop){
				var selectText = this.options.dropText.replace('{$}', this.getSelectedCount());
				this.textElement.set('text', selectText);
				div.addEvent('click', function(e){
					e.stop();
				});
				drop.inject(container);
				document.body.appendChild(div);
				div.addClass('notop');
				div.setStyles({'display':'none','position':'absolute','z-index':999});
			}
			if (div.getParent() == null) div.inject(container);
		}.bind(this);
		if (!isNew || typeOf(container) == 'element') addToContainer();
		else window.addEvent('domready', addToContainer);

		return this;
	},

	getSelectedCount: function(){
		var self = this;
		var o = self.options;
		var selectCount = 0;
		for (var i = 0; i < o.items.length; i++){
			var isSelected = MUI.getData(o.items[i], o.isSelectedField);
			if (isSelected) selectCount++;
		}
		return selectCount;
	},

	addItem: function(item){
		var self = this;
		var o = self.options;

		var isSelected = MUI.getData(item, o.isSelectedField);
		if (!isSelected) item[o.isSelectedField] = false;

		this.options.items.push(item);
		return item;
	},

	addBar: function(){
		var bar = {isBar:true};
		this.options.items.push(bar);
		return bar;
	},

	update: function(items){
		var self = this;
		self.options.items = items;
		self.draw();
	},

	_selected: function(e, item){
		var self = this;
		var o = self.options;
		if (e.target && e.target.tagName == 'INPUT') return true;

		if (!o.canMultiSelect){
			var items = this.options.items;
			for (var i = 0; i < items.length; i++){
				var isSelected = MUI.getData(items[i], o.isSelectedField);
				if (isSelected && item != items[i]){
					items[i][o.isSelectedField] = false;
					items[i]._element.removeClass('C');
				}
			}
			o.value = item.value;
		}

		item[o.isSelectedField] = !item[o.isSelectedField];
		if (item._checkBox) item._checkBox.checked = item[o.isSelectedField];
		if (item[o.isSelectedField]) item._element.addClass('C');
		else item._element.removeClass('C');

		self.fireEvent('itemSelected', [item,item[o.isSelectedField],self,e]);

		if (self.textElement){
			var selectText = o.dropText.replace('{$}', self.getSelectedCount());
			self.textElement.set('text', selectText);
		}
	},

	_checked: function(e, item){
		e.stopPropagation();
		var self = this;
		var o = self.options;
		var checked = item._checkBox.checked;

		item[o.isSelectedField] = checked;
		if (checked) item._element.addClass('C');
		else item._element.removeClass('C');

		self.fireEvent('itemSelected', [item,checked,self,e]);
		return true;
	},

	_over: function(e, item){
		item._element.addClass('O');
	},

	_out: function(e, item){
		item._element.removeClass('O');
	},

	_open: function(){
		var self = this;
		var pos = self.dropElement.getCoordinates();
		var element = self.element;
		var button = self.dropElement;
		element.setStyles({'display':'','top':pos.bottom + 2,'left':pos.left});
		var close = function(){
			element.setStyles({'display':'none'});
			element.removeEvent('mouseleave');
			button.removeEvent('click');
			button.addEvent('click', function(e){
				self._open(e);
			});
		};
		element.addEvent('mouseleave', close);
		button.removeEvent('click');
		button.addEvent('click', close);
	},

	_buildItem: function(item, ul, alt){
		var self = this;
		var o = self.options;

		var li = new Element('li', {'class':'item'}).inject(ul);
		var title = MUI.getData(item, o.titleField);
		if (title) li.set('title', title);
		if (alt && o.alternateRows) li.addClass('alt');
		var isSelected = MUI.getData(item, o.isSelectedField);
		if (isSelected) li.addClass('C');
		li.addEvent('click', function(e){
			self._selected(e, item);
		});
		li.addEvent('mouseover', function(e){
			self._over(e, item);
		});
		li.addEvent('mouseout', function(e){
			self._out(e, item);
		});
		item._element = li;

		if (o.showCheckBox){
			var value = MUI.getData(item, o.valueField);
			var id = o.id + '$' + value;
			var input = new Element('input', { 'type': 'checkbox', 'name': id, 'id': id, 'value':value }).inject(li);
			if (isSelected) input.checked = true;
			input.addEvent('click', function(e){
				self._checked(e, item);
			});
			item._checkBox = input;
		}

		var text = MUI.getData(item, o.textField);
		new Element('span', {'text':text}).inject(li);

		return li;
	},

	_buildBar: function(item, ul){
		var li = new Element('li', {'class':'bar'}).inject(ul);
		item._element = $(li);
		new Element('hr').inject(li);
		return li;
	},

	updateStart: function(content){
		content.loadMethod = 'json';
	},

	updateEnd: function(content){
		this.options.items = MUI.Content.getRecords(content);
		if (this.options.items) this.draw();
	}

});
