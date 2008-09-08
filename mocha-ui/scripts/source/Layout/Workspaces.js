/*

Script: Workspaces.js
	Save and load workspaces. The Workspaces emulate Adobe Illustrator functionality remembering what windows are open and where they are positioned. There will be two versions, a limited version that saves state to a cookie, and a fully functional version that saves state to a database.

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
	
	Function: saveWorkspace
		Save the current workspace.
	
	Syntax:
	(start code)
		MochaUI.saveWorkspace();
	(end)
	
	Notes:
		This is experimental. This version saves the ID of each open window to a cookie, and reloads those windows using the functions in mocha-init.js. This requires that each window have a function in mocha-init.js used to open them. Functions must be named the windowID + "Window". So if your window is called mywindow, it needs a function called mywindowWindow in mocha-init.js.
	
	*/
	saveWorkspace: function(){
		this.cookie = new Hash.Cookie('mochaUIworkspaceCookie', {duration: 3600});
		this.cookie.empty();
		MochaUI.Windows.instances.each(function(instance) {
			instance.saveValues();
			this.cookie.set(instance.options.id, {
				'id': instance.options.id,
				'top': instance.options.y,
				'left': instance.options.x
			});
		}.bind(this));
		this.cookie.save();

		new MochaUI.Window({
			loadMethod: 'html',
			type: 'notification',
			addClass: 'notification',
			content: 'Workspace saved.',
			closeAfter: '1400',
			width: 200,
			height: 40,
			y: 53,
			padding:  { top: 10, right: 12, bottom: 10, left: 12 },
			shadowBlur: 5,
			bodyBgColor: [255, 255, 255]
		});
		
	},
	windowUnload: function(){
		if ($$('div.mocha').length == 0 && this.myChain){
			this.myChain.callChain();
		}		
	},
	loadWorkspace2: function(workspaceWindows){		
		workspaceWindows.each(function(instance){
			windowFunction = eval('MochaUI.' + instance.id + 'Window');
			if (windowFunction){
				eval('MochaUI.' + instance.id + 'Window();');
				$(instance.id).setStyles({
					top: instance.top,
					left: instance.left
				});
			}
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
		cookie = new Hash.Cookie('mochaUIworkspaceCookie', {duration: 3600});
		workspaceWindows = cookie.load();

		if(!cookie.getKeys().length){
			new MochaUI.Window({
				loadMethod: 'html',
				type: 'notification',
				addClass: 'notification',
				content: 'You have no saved workspace.',
				closeAfter: '1400',
				width: 220,
				height: 40,
				y: 25,
				padding:  { top: 10, right: 12, bottom: 10, left: 12 },
				shadowBlur: 5,
				bodyBgColor: [255, 255, 255]
			});
			return;
		}

		if ($$('div.mocha').length != 0){
			this.loadingWorkspace = true;
			this.myChain = new Chain();
			this.myChain.chain(
				function(){
					$$('div.mocha').each(function(el) {
						this.closeWindow(el);
					}.bind(this));
				}.bind(this),
				function(){
					this.loadWorkspace2(workspaceWindows);
				}.bind(this)
			);
			this.myChain.callChain();
		}
		else {
			this.loadWorkspace2(workspaceWindows);
		}

	}
});
