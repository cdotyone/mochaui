/*
 ---

 name: Tabs

 script: tabs.js

 description: MUI.Tabs - Creates a tab list control.

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

 provides: [MUI.Tabs]
 ...
 */

MUI.Tabs = new NamedClass('MUI.Tabs', {

	Implements: [Events, Options],

	options: {
		id:				'',				// id of the primary element, and id os control that is registered with mocha
		container:		null,			// the parent control in the document to add the control to
		drawOnInit:		true,			// true to add tree to container when control is initialized
		cssClass:		'tabs',			// the primary css tag

		tabs:			[],			 // the list of tabs

		textField:		'text',			// the name of the field that has the tab's text
		valueField:		'value',		// the name of the field that has the tab's value
		titleField:		'title',		// the name of the field that has the tab's tip text

		partner:		null,			// element or id of
		urlField:		'url',			// the name of the field that has the tab's url to load content from and put content into options.partner
		contentField:	'content',		// the name of the field that has the tab's content insert into options.partner
		updateOptions:	null,			// the options used to load the content into the partner element, panel, or window

		value:			'',				// the currently selected tab's value
		selectedTab:	null,			// the currently selected tab
		position:		null			// container is a panel or window this tell tabs where the tabs should go, 'header' or 'footer'

		//onTabSelected:null			// event: when a node is checked
	},

	initialize: function(options){
		this.setOptions(options);
		this.el = {};

		// If tabs has no ID, give it one.
		this.id = this.options.id = this.options.id || 'tabs' + (++MUI.idCount);
		MUI.set(this.id, this);

		if(this.options.drawOnInit && this.options.tabs.length > 0) this.draw();
	},

	draw: function(container){
		var o = this.options;
		if (!container) container = o.container;

		var isNew = false;
		var div = o.element ? o.element : $(o.id);
		if (!div){
			div = new Element('div', {'id': o.id});
			isNew = true;
		}
		div.addClass(o.cssClass);

		var ul = div.getElement('ul');
		if (!ul) ul = new Element('ul', {'class': o.cssClass}).inject(div);
		else ul.set('class', o.cssClass).empty();
		this.el.element = div;

		// if no tab selected, then select first tab for them
		if (o.tabs.length > 0 && (o.value == null || o.value == '')){
			o.value = MUI.getData(o.tabs[0], o.valueField);
			if (o.value == null || o.value == ''){
				o.valueField = o.textField;
				o.value = MUI.getData(o.tabs[0], o.valueField);
			}
		}

		// build all tabs
		o.tabs.each(function(tab){
			this._buildTab(tab, ul);
			if (MUI.getData(tab, o.valueField) == o.value) o.selectedTab = tab;
		},this);

		// add a formatting div
		new Element('div', {'class': 'clear'}).inject(ul);

		if (!isNew){
			div.removeClass('toolbar');
			if (o.selectedTab) o.selectedTab.element.fireEvent('click');
			return this;
		}

		// add to container
		var addToContainer = function(){
			if (typeOf(container) == 'string') container = $(container);
			if (div.getParent() == null) div.inject(container);

			// select current tab
			if (o.selectedTab) o.selectedTab.fireEvent('click');
		}.bind(this);
		if (!isNew || typeOf(container) == 'element') addToContainer();
		else window.addEvent('domready', addToContainer);

		return div;
	},

	_buildTab: function(tab, ul){
		var o = this.options;

		var value = MUI.getData(tab, o.valueField);
		if (!value) value = 'tab' + (++MUI.idCount);
		var text = MUI.getData(tab, o.textField);
		var title = MUI.getData(tab, o.titleField);
		var liClass = MUI.getData(tab, 'class');

		var li = new Element('li', {'class': liClass}).inject(ul);
		var a = new Element('a', {'text': text}).inject(li);
		tab.element = li;

		li.addEvent('click', function(e){
			this._tabClick(tab, ul, e);
		}.bind(this));
		a.addEvent('click', function(e){
			e.preventDefault();
		});
		if (title) a.set('title', title);
		else a.set('title', text);

		if (o.value == value) li.addClass('sel');
	},

	_tabClick: function(tab, ul, e){
		var o = this.options;
		if (e) e.stopPropagation();

		var value = MUI.getData(tab, o.valueField);
		if (value == null) value = MUI.getData(tab, o.textField);
		o.value = value;
		o.selectedTab = tab;

		ul.getChildren().each(function(listItem){
			listItem.removeClass('sel');
		});
		tab.element.addClass('sel');

		var url = MUI.getData(tab, o.urlField);
		if (o.partner && url){
			var content = MUI.getData(tab, o.contentField);
			var instance = MUI.get(o.partner);

			var uOptions = {
				instance: instance,
				element: o.partner,
				content: content,
				url: url,
				onLoaded: function(){
					this.fireEvent('tabSelected', [tab, value, this, e]);
				}.bind(this)
			};

			if (o.updateOptions) uOptions = Object.merge(uOptions, o.updateOptions);
			else {
				if (instance && instance.el && instance.el.iframe) uOptions.loadMethod = 'iframe';
			}

			MUI.Content.update(uOptions);
		} else {
			this.fireEvent('tabSelected', [tab, value, this, e]);
		}
	}

});
