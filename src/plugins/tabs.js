/*
 ---

 name: Tabs

 script: Tabs.js

 description: Functionality for window tabs.

 copyright: (c) 2010 Contributors in (/AUTHORS.txt).

 license: MIT-style license in (/MIT-LICENSE.txt).

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
		$(el).getElements('li').each(function(listItem){
			var link = listItem.getFirst('a').addEvent('click', function(e){
				e.preventDefault();
			});
			listItem.addEvent('click', function(){
				MUI.updateContent({
					'element':  $(target),
					'url':	  link.get('href')
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
		$(parent).getChildren().each(function(listItem){
			listItem.removeClass('selected');
		});
		el.addClass('selected');
	}

});

