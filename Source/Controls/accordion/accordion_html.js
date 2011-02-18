/*
 ---

 name: Accordion Load From HTML

 script: accordion_html.js

 description: MUI - Creates a generic accordion control.

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

 provides: [MUI.Accordion]

 ...
 */

MUI.Accordion.implement({

	fromHTML: function(el){
		var self = this;
		var o = self.options;
		if (!el) el = $(o.id);
		else el = $(el);
		if (!el) return;

		o.cssClass = el.get('class');

		var panels = [];
		var togglerEls = el.getElements('h3.toggler');
		var panelEls = el.getElements('div.element');

		for (var i = 0; i < togglerEls.length; i++){
			var togglerEl = togglerEls[i];
			if (i >= panelEls.length) break;

			var toggler = {};

			var value = togglerEl.get('id');
			var text = togglerEl.get('text');
			if (!value) value = text;
			if (togglerEl.hasClass('open')) o.value = value;

			var title = togglerEl.get('title');
			if (title) toggler[o.titleField] = title;

			toggler[o.valueField] = value;
			toggler[o.textField] = text;
			toggler[o.contentField] = panelEls[i].get('html');
			panels.push(toggler);
		}

		o.panels = panels;
		self.draw();
	}

});
