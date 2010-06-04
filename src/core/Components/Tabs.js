/*
---

name: Tabs

script: Tabs.js

description: Functionality for window tabs.

copyright: (c) 2007-2008 Greg Houston, <http://greghoustondesign.com/>.	

license: MIT-style license.

requires:
  - MochaUI/MUI
  - MochaUI/MUI.Windows
  - MochaUI/MUI.Column
  - MochaUI/MUI.Panel

provides: [MUI.initializeTabs]

...
*/

MUI.extend({
	/*

	Function: initializeTabs
		Add click event to each list item that fires the selected function.

	*/
	initializeTabs: function(el, target){
		$(el).setStyle('list-style', 'none'); // This is to fix a glitch that occurs in IE8 RC1 when dynamically switching themes
		$(el).getElements('li').each(function(listitem){
			var link = listitem.getFirst('a').addEvent('click', function(e){
				e.preventDefault();
			});
			listitem.addEvent('click', function(e){
				MUI.updateContent({
					'element':  $(target),
					'url':      link.get('href')
				});
				MUI.selected(this, el);
			});
		});
	},
	/*

	Function: selected
		Add "selected" class to current list item and remove it from sibling list items.

	Syntax:
		(start code)
			selected(el, parent);
		(end)

Arguments:
	el - the list item
	parent - the ul

	*/
	selected: function(el, parent){
		$(parent).getChildren().each(function(listitem){
			listitem.removeClass('selected');
		});
		el.addClass('selected');
	}
});

