/*

Script: Tabs.js	
	
Copyright:
	Copyright (c) 2007-2008 Greg Houston, <http://greghoustondesign.com/>.	
	
License:
	MIT-style license.

Requires:
	Core.js, Window.js

To do:
	- Move to Window

*/

MochaUI.extend({
	/*
	
	Function: initializeTabs		
		
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
		
	*/	
	selected: function(el, parent){
		$(parent).getChildren().each(function(listitem){
			listitem.removeClass('selected');						   
		});
		el.addClass('selected');	
	}	
});

