/*
 ---
 name: Tabs - Load From HTML

 script: tabs_html.js

 description: MUI - Creates a tab list control.

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

MUI.Tabs.implement({

	fromHTML: function(el){
		var self = this;
		var o = self.options;
		if (!el) el = $(o.id);
		else el = $(el);
		if (!el) return;

		var tabs = [];
		el.getElements('li').each(function(li){
			var tab = {};

			var value = li.get('id');
			if (!value) value = 'tab' + (++MUI.idCount);

			var a = li.getElement('a');
			var title = a.get('title');

			tab[o.valueField] = value;
			tab[o.textField] = a.get('text');
			tab[o.urlField] = a.get('href');
			if (title) tab[o.titleField] = title;

			tabs.push(tab);
		});
		o.tabs = tabs;
		self.draw();
	}

});
