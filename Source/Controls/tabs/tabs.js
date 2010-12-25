/*
 ---

 name: Tabs

 script: tabs.js

 description: MUI - Creates a tab list control.

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

 provides: [MUI.Tabs]
 ...
 */

MUI.files['{controls}tabs/tabs.js'] = 'loaded';

MUI.Tabs = new Class({

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
		var self = this;
		self.setOptions(options);
		var o = self.options;
		this.el = {};

		// make sure this controls has an ID
		var id = o.id;
		if (!id){
			id = 'tabs' + (++MUI.IDCount);
			o.id = id;
		}
		this.id = id;

		// create sub items if available
		if (o.drawOnInit && o.tabs.length > 0) this.draw();

		MUI.set(id, this);
	},

	draw: function(containerEl){
		var self = this;
		var o = self.options;

		var isNew = false;
		var div = $(o.id);
		if (!div){
			div = new Element('div', {'id': o.id});
			isNew = true;
		}
		div.addClass(o.cssClass);

		var ul = div.getElement('ul');
		if (!ul) ul = new Element('ul', {'class': o.cssClass}).inject(div);
		else ul.set('class', o.cssClass).empty();
		self.el.element = div;

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
			self._buildTab(tab, ul);
			if (MUI.getData(tab, o.valueField) == o.value) o.selectedTab = tab;
		});

		// add a formatting div
		new Element('div', {'class': 'clear'}).inject(ul);

		if (!isNew){
			div.removeClass('toolbar');
			if (o.selectedTab) o.selectedTab._element.fireEvent('click');
			return this;
		}

		if (this.options._container){
			this.options._container.appendChild(div);
			if (o.selectedTab) o.selectedTab._element.fireEvent('click');
		}
		else window.addEvent('domready', function(){
			this.options._container = $(containerEl ? containerEl : o.container);
			this.options._container.appendChild(div);
			if (o.selectedTab) o.selectedTab._element.fireEvent('click');
		}.bind(this));

		return div;
	},

	_buildTab: function(tab, ul){
		var self = this;
		var o = self.options;

		var value = MUI.getData(tab, o.valueField);
		if (!value) value = 'tab' + (++MUI.IDCount);
		var text = MUI.getData(tab, o.textField);
		var title = MUI.getData(tab, o.titleField);
		var liClass = MUI.getData(tab, 'class');

		var li = new Element('li', {'class': liClass}).inject(ul);
		var a = new Element('a', {'text': text}).inject(li);
		tab._element = li;

		li.addEvent('click', function(e){
			self._tabClick(tab, ul, e);
		});
		a.addEvent('click', function(e){
			e.preventDefault();
		});
		if (title) a.set('title', title);
		else a.set('title', text);

		if (o.value == value) li.addClass('sel');
	},

	_tabClick: function(tab, ul, e){
		var self = this;
		var o = self.options;
		if (e) e.stopPropagation();

		var value = MUI.getData(tab, o.valueField);
		if (value == null) value = MUI.getData(tab, o.textField);
		o.value = value;
		o.selectedTab = tab;

		ul.getChildren().each(function(listItem){
			listItem.removeClass('sel');
		});
		tab._element.addClass('sel');

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
					self.fireEvent('tabSelected', [tab, value, self, e]);
				}
			};

			if (o.updateOptions) uOptions = Object.merge(uOptions, o.updateOptions);
			else {
				if (instance && instance.el && instance.el.iframe) uOptions.loadMethod = 'iframe';
			}

			MUI.Content.update(uOptions);
		} else {
			self.fireEvent('tabSelected', [tab, value, self, e]);
		}
	}

});
