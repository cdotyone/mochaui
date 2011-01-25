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

 provides: [MUI.Menu]
 ...
 */

MUI.files['{controls}toolbar/toolbarmenu.js'] = 'loaded';

MUI.Menu = new NamedClass('MUI.Menu', {

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
		this.setOptions(options);
		this.el = {};

		// If menu has no ID, give it one.
		this.id = this.options.id = this.options.id || 'menu' + (++MUI.idCount);
		MUI.set(this.id, this);

		if(this.options.drawOnInit) this.draw();
	},

	draw: function(container){
		var o = this.options;
		if(!container) container=o.container;

		// determine element for this control
		var isNew = false;
		var div = o.element ? o.element : $(o.id);
		if (!div){
			div = new Element('div', {'id': o.id});
			isNew = true;
		}
		div.empty();

		div.addClass('toolbar');
		if (o.cssClass) div.addClass(o.cssClass);
		if (o.divider) div.addClass('divider');
		if (o.orientation) div.addClass(o.orientation);

		this.el.element = div.store('instance', this);
		var ul = new Element('ul').inject(div);

		this._buildItems(ul, o.items, false);

		// add to container
		var addToContainer = function(){
			if (typeOf(container) == 'string') container = $(container);
			if (div.getParent() == null) div.inject(container);
		}.bind(this);
		if (!isNew || typeOf(container) == 'element') addToContainer();
		else window.addEvent('domready', addToContainer);

		return this;
	},

	_buildItems:function(ul, items, addArrow){
		for (var i = 0; i < items.length; i++){
			var item = items[i];
			if (item.type == 'divider') continue;
			var li = new Element('li').inject(ul);
			if (i > 0 && items[i - 1].type == 'divider') li.addClass('divider');
			var a = new Element('a', {text:item.text}).inject(li);
			if (item.type == 'radio') new Element('div', {'class':(item.selected ? 'radio' : 'noradio')}).inject(a);
			if (item.type == 'check') new Element('div', {'class':(item.selected ? 'check' : 'nocheck')}).inject(a);

			var url = item.url;
			if (!url || item.registered){
				url = '';
				var callRegistered = function(){return false;};
				if (item.registered){
					callRegistered = (function(name,item){
						return function(ev){
							ev.stop();
							MUI.registered[name].apply(this,[ev,item]);
						};
					})(item.registered, item);
				}
				a.addEvent('click', callRegistered);
			}
			a.setAttribute('href', MUI.replacePaths(url));

			li.addEvent('mouseenter', function(){
				this.addClass('hover');
			}).addEvent('mouseleave', function(){
				this.removeClass('hover');
			});

			if (item.items && item.items.length > 0){
				if (addArrow) a.addClass('arrow-right');
				var ul2 = new Element('ul').inject(li);
				this._buildItems(ul2, item.items, true);
			}
		}
	}

});

