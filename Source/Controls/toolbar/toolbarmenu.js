/*
 ---

 name: ToolbarMenu

 script: toolbardock.js

 description: MUI - Creates a toolbar dock control.

 copyright: (c) 2010 Contributors in (/AUTHORS.txt).

 license: MIT-style license in (/MIT-LICENSE.txt).

 requires:
 - Core/Element
 - Core/Class
 - Core/Options
 - Core/Events
 - MUI
 - MUI.Core

 provides: [MUI.ToolbarMenu]
 ...
 */

MUI.files['{controls}toolbar/toolbarmenu.js'] = 'loaded';

MUI.ToolbarMenu = new Class({

	Implements: [Events, Options],

	options: {
		id:				'',				// id of the primary element, and id os control that is registered with mocha
		container:		null,			// the parent control in the document to add the control to
		drawOnInit:		true,			// true to add tree to container when control is initialized

		content:		false,			// used to load content
		items:			{},				// menu items for the menu to draw

		cssClass:		'toolMenu',		// css tag to add to control
		divider:		true,			// true if this toolbar has a divider
		orientation:	'left'			// left or right side of dock.  default is left
	},

	initialize: function(options){
		options.instance = this;
		this.setOptions(options);

		var o = this.options;
		this.el = {};

		// make sure this controls has an ID
		var id = o.id;
		if (!id){
			id = 'toolbarMenu' + (++MUI.IDCount);
			o.id = id;
		}
		this.id = id;

		if (o.content) o.content.instance = this;
		this.draw();

		MUI.set(id, this);
	},

	draw: function(containerEl){
		var self = this;
		var o = self.options;

		var isNew = false;
		var div;

		div = $(o.id);
		if (!div){
			div = new Element('div', {'id': o.id});
			isNew = true;
		}
		div.empty();

		div.addClass('toolbar');
		if (o.cssClass) div.addClass(o.cssClass);
		if (o.divider) div.addClass('divider');
		if (o.orientation) div.addClass(o.orientation);

		self.el.element = div.store('instance', this);
		var ul = new Element('ul').inject(div);

		this._buildItems(ul, o.items, false);

		if (!isNew) return;
		if (o._container) o._container.inject(div);
		else window.addEvent('domready', function(){
			if (!o._container){
				o._container = $(containerEl ? containerEl : o.container);
				if (o._container) o._container.inject(div);
			}
		});

		return div;
	},

	_buildItems:function(ul, items, addArrow){
		for (var i = 0; i < items.length; i++){
			var item = items[i];
			var li = new Element('li').inject(ul);
			var a = new Element('a', {text:item.text}).inject(li);
			if (item.type == 'radio') new Element('div', {'class':(item.selected ? 'radio' : 'noradio')}).inject(a);
			if (item.type == 'check') new Element('div', {'class':(item.selected ? 'check' : 'nocheck')}).inject(a);

			var url = item.url;
			if (!url){
				url = '';
				a.addEvent('click',function(){return false;})
			}
			a.setAttribute('href', MUI.replacePaths(url));

			if (Browser.ie6){
				li.addEvent('mouseenter', function(){
					this.addClass('ieHover');
				})
						.addEvent('mouseleave', function(){
					this.removeClass('ieHover');
				});
			}

			if (item.items && item.items.length > 0){
				if (addArrow) a.addClass('arrow-right');
				var ul2 = new Element('ul').inject(li);
				this._buildItems(ul2, item.items, true);
			}
		}
	}

});

