/*
 ---

 name: SelectList Load From HTML

 script: selectlist_html.js

 description: MUI - Create a list with check boxes next to each item.

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

 provides: [MUI.SelectList]
 ...
 */

MUI.SelectList.implement({

	fromHTML: function(el){
		var self = this;
		var o = self.options;
		el = $(el);
		if (el){
			var nItems = new Array();

			o.cssClass = el.get('class');
			var list = el.getElement('table');
			if (list){
				var rows = list.getElements('TR');
				for (var i = 0; i < rows.length; i++){
					self._itemFromHTML(rows[i]);
				}
			}

			o.items = nItems;
			el.style.visibility = 'visible';
		}
		return this;
	},

	_itemFromHTML: function(rw){
		var item = new Hash;
		rw = $(rw);
		item._element = rw;

		var inp = rw.getElement('input');
		if (inp){
			item.id = inp.id;
			item.name = inp.name;
			item.value = inp.value;
			item.isSelected = inp.checked;
			item._checkBox = inp;
		}

		if (rw.getElement('hr')) item.isBar = true;
		else {
			var c = rw.getElements('TD');
			if (c.length > 1){
				item.text = c[1].innerText;
			} else {
				item.text = c[0].innerText;
			}
		}

		this.options.items.push(item);
	}

});
