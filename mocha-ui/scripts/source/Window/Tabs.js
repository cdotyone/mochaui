/*

Script: Tabs.js
	Functionality for window tabs.

Copyright:
	Copyright (c) 2007-2008 Greg Houston, <http://greghoustondesign.com/>.	

License:
	MIT-style license.

Requires:
	Core.js, Window.js (for tabbed windows) or Layout.js (for tabbed panels)

*/

MochaUI.extend({
	/*

	Function: initializeTabs
		Add click event to each list item that fires the selected function.

	*/
	initializeTabs: function(el){
		$(el).getElements('li').each(function(listitem){
			listitem.addEvent('click', function(e){
				MochaUI.selected(this, el);
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

