/*

Script: Workspaces.js
	Save and load workspaces. The Workspaces emulate Adobe Illustrator functionality remembering what windows are open and where they are positioned. There will be two versions, a limited version that saves state to a cookie, and a fully functional version that saves state to a database. NOT FULLY IMPLEMENTED YET.	
	
License:
	MIT-style license.

Requires:
	Core.js, Window.js

To do:
	- Move to Window

*/

MochaUI.extend({			   
	/*
	
	Function: saveWorkspace
		This is experimental. This version saves the ID of each open window to a cookie, and reloads those windows using the functions in mocha-init.js. This requires that each window have a function in mocha-init.js used to open them. Functions must be named the windowID + "Window". So if your window is called mywindow, it needs a function called mywindowWindow in mocha-init.js.
	
	Syntax:
	(start code)
		MochaUI.saveWorkspace();
	(end)
	
	*/	
	saveWorkspace: function(){
		this.cookie = new Hash.Cookie('mochaUIworkspaceCookie', {duration: 3600});
		this.cookie.empty();		
		MochaUI.Windows.instances.each(function(instance) {											

		this.cookie.set(instance.options.id, {
			'id': instance.options.id,
			'top': instance.options.y,
			'left': instance.options.x
		});
		
		}.bind(this));		
		this.cookie.save();
	},
	windowUnload: function(){
		if ($$('div.mocha').length == 0){
			if(this.myChain){
				this.myChain.callChain();
			}
		}		
	},
	loadWorkspace2: function(){
		this.cookie = new Hash.Cookie('mochaUIworkspaceCookie', {duration: 3600});
		workspaceWindows = this.cookie.load();
		workspaceWindows.each(function(instance) {		
			eval('MochaUI.' + instance.id + 'Window();');
			$(instance.id).setStyles({
				top: instance.top,
				left: instance.left
			});
		}.bind(this));
		this.loadingWorkspace = false;
	},
	/*
		
	Function: loadWorkspace
		Load the saved workspace.
	
	Syntax:
	(start code)
		MochaUI.loadWorkspace();
	(end)
	
	*/
	loadWorkspace: function(){
		if ($$('div.mocha').length != 0){
			this.loadingWorkspace = true;
			this.myChain = new Chain();
			this.myChain.chain(
    			function(){					
					$$('div.mocha').each(function(el) {
						this.closeWindow(el);
					}.bind(this));
					$$('div.mochaDockButton').destroy();
				}.bind(this),			
    			function(){
					this.loadWorkspace2();			
				}.bind(this)
			);
			this.myChain.callChain();
		}
		else {
			this.loadWorkspace2();
		}
	
	}
});

MochaUI.Workspaces = new Class({
	options: {
		index:       0,     // Default screen
		background:  '#8caac7'
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
