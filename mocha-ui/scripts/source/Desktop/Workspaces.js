/*

Script: Workspaces.js
	Create multiple workspaces.
	
License:
	MIT-style license.

Requires:
	Core.js, Window.js, Desktop.js

Notes:
	This will become Tabs, which will use workspaces. The Workspaces emulate Adobe Illustrator functionality. This is experimental.

Todo: 
	- Make an easy way for Workspaces to have different css.
	
	- Each screen should be a separate workspace with it's own windows.
	
	- Workspaces change the styling of MochaDesktop and which windows are visible and in the dock.
	
	- Dynamically create new Workspaces.	

	- Workspace content should be loaded like windows are.

*/

MochaUI.Workspaces = new Class({
	options: {
		index:       0,     // Default screen
		background:  '#fff'
	},
	initialize: function(options){
		this.setOptions(options);
		this.setTab(this.options);
		this.currentWorkspace = this.options.index;
	},
	setTab: function(properties) {
		
		// MAKE IF index = current index return
		
		// Merge new options with defaults
		var options = new Hash(this.options);
		options.extend(properties);
		
		if (this.currentWorkspace == options.index) {
			return;
		}
		else {
			this.currentWorkspace = options.index;	
		}
		
		MochaUI.Desktop.pageWrapper.setStyles({
			'background': options.background ? options.background : options.background					
		});			
	/*	$$('#mochaWorkspaces div.workspace').each(function(el,i) {
			el.setStyle('display', i == options.index ? 'block' : 'none');

			// Add check mark to menu if link exists in menu
			var id = el.getProperty('id');
			if ($(id + 'LinkCheck')){
				if (i == options.index){
					el.check = new Element('div', {
						'class': 'check',
						'id': id + '_check'
					}).injectInside($(id + 'LinkCheck'));
				}
				else {
					if (el.check) el.check.destroy();
				}
			}			
		});	*/	
	}
});
MochaUI.Workspaces.implement(new Options);
