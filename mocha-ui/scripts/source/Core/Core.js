/* 

Script: Core.js
	MochaUI - A Web Applications User Interface Framework.
	
Copyright:
	Copyright (c) 2007-2008 Greg Houston, <http://greghoustondesign.com/>.
	
License:
	MIT-style license.

Contributors:
	- Scott F. Frederick
	- Joel Lindau
	
Todo:		
	- Ctrl-Tab to toggle window visibility.

To fix:
	- With effects disabled maximizing caused an error
	
Note:
	This documentation is taken directly from the javascript source files. It is built using Natural Docs.
	
*/

var MochaUI = new Hash({
	Windows: {	  
		instances: new Hash()
	},	
	options: new Hash({
		useEffects: true,     // Toggles the majority of window fade and move effects.
		useLoadingIcon: true  // Toggles whether or not the ajax spinners are displayed in window footers.

	}),	
	ieSupport:      'excanvas',   // Makes it easier to switch between Excanvas and Moocanvas for testing	
	indexLevel:     1,            // Used for z-Index
	windowIDCount:  0,	          // Used for windows without an ID defined by the user
	windowsVisible: true,         // Ctrl-Alt-Q to toggle window visibility
	/*
	
	Function: closeWindow
		Closes a window.

	Syntax:
	(start code)
		MochaUI.closeWindow();
	(end)

	Arguments: 
		windowEl: the ID of the window to be closed
		
	Returns:
		true: the window was closed
		false: the window was not closed
		
	*/
	closeWindow: function(windowEl) {
		// Does window exist and is not already in process of closing ?		

		currentWindowClass = MochaUI.Windows.instances.get(windowEl.id);

		if ( !(windowEl = $(windowEl)) || currentWindowClass.isClosing )
			return;
			
		currentWindowClass.isClosing = true;
		currentWindowClass.fireEvent('onClose', windowEl);

		if (MochaUI.options.useEffects == false){
			if (currentWindowClass.options.modal) {
				$('mochaModalOverlay').setStyle('opacity', 0);
			}
			windowEl.destroy();
			currentWindowClass.fireEvent('onCloseComplete');
			MochaUI.Windows.instances.erase(currentWindowClass.options.id); // see how this effects on close complete
			if(this.loadingWorkspace == true){
				this.windowUnload();
			}
		}
		else {
			// Redraws IE windows without shadows since IE messes up canvas alpha when you change element opacity
			if (Browser.Engine.trident) currentWindowClass.drawWindow(windowEl, false);
			if (currentWindowClass.options.modal) {
				MochaUI.Modal.modalOverlayCloseMorph.start({
					'opacity': 0
				});
			}
			var closeMorph = new Fx.Morph(windowEl, {
				duration: 180,
				onComplete: function(){
					windowEl.destroy();
					currentWindowClass.fireEvent('onCloseComplete');
					MochaUI.Windows.instances.erase(currentWindowClass.options.id); // see how this effects on close complete
					if(this.loadingWorkspace == true){
						this.windowUnload();
					}
				}.bind(this)
			});
			closeMorph.start({
				'opacity': .4
			});
		}
		if (currentWindowClass.check) currentWindowClass.check.destroy();
		return true;
	},	
	/*
	
	Function: closeAll
	
	Notes: This closes all the windows

	Returns:
		true: the windows were closed
		false: the windows were not closed

	*/
	closeAll: function() {		
		$$('div.mocha').each(function(el) {
			this.closeWindow(el);			
		}.bind(this));
		MochaUI.Windows.instances.empty();				
		$$('div.mochaDockButton').destroy();
		return true;
	},	
	/*
	
	Function: toggleWindowVisibility
		Toggle window visibility with Ctrl-Alt-Q.
	
	Todo:
		Don't toggle modal visibility. If new window is created make all windows visible except for those that are minimized. If window is restored from dock make all windows visible except for any others that are still minimized.

	*/	
	toggleWindowVisibility: function() {		
		MochaUI.Windows.instances.each(function(instance) {
			if ($(instance.options.id).getStyle('visibility') == 'visible'){												
				$(instance.options.id).setStyle('visibility', 'hidden');
				MochaUI.windowsVisible = false;
			}
			else {
				$(instance.options.id).setStyle('visibility', 'visible');
				MochaUI.windowsVisible = true;
			}
		}.bind(this));

	},	
	focusWindow: function(windowEl){
		if ( !(windowEl = $(windowEl)) ) 
			return;
		currentWindowClass = MochaUI.Windows.instances.get(windowEl.id);			
		// Only focus when needed
		if ( windowEl.getStyle('zIndex').toInt() == MochaUI.indexLevel )
			return;
		MochaUI.indexLevel++;
		windowEl.setStyle('zIndex', MochaUI.indexLevel);
		currentWindowClass.fireEvent('onFocus', windowEl);
	},	
	roundedRect: function(ctx, x, y, width, height, radius, rgb, a){
		ctx.fillStyle = 'rgba(' + rgb.join(',') + ',' + a + ')';
		ctx.beginPath();
		ctx.moveTo(x, y + radius);
		ctx.lineTo(x, y + height - radius);
		ctx.quadraticCurveTo(x, y + height, x + radius, y + height);
		ctx.lineTo(x + width - radius, y + height);
		ctx.quadraticCurveTo(x + width, y + height, x + width, y + height - radius);
		ctx.lineTo(x + width, y + radius);
		ctx.quadraticCurveTo(x + width, y, x + width - radius, y);
		ctx.lineTo(x + radius, y);
		ctx.quadraticCurveTo(x, y, x, y + radius);
		ctx.fill(); 
	},
	triangle: function(ctx, x, y, width, height, rgb, a){
		ctx.beginPath();
		ctx.moveTo(x + width, y);
		ctx.lineTo(x, y + height);
		ctx.lineTo(x + width, y + height);
		ctx.closePath();
		ctx.fillStyle = 'rgba(' + rgb.join(',') + ',' + a + ')';
		ctx.fill();
	},
	circle: function(ctx, x, y, diameter, rgb, a){
		ctx.beginPath();
		ctx.moveTo(x, y);
		ctx.arc(x, y, diameter, 0, Math.PI*2, true);
		ctx.fillStyle = 'rgba(' + rgb.join(',') + ',' + a + ')';
		ctx.fill();
	},
	serialize: function(obj) {
		var newobj = {};
		$each(obj, function(prop,i) {
			newobj[i] = prop.toString().clean();
		}, this);
		return newobj;
	},
	unserialize: function(obj) {
		var newobj = {};
		$each(obj, function(prop,i) {
			eval("newobj[i] = " + prop);
		}, this);
		return newobj;
	},	
	/*
	
	Function: saveWorkspace
		This is experimental. This version saves the ID of each open window to a cookie, and reloads those windows using the functions in mocha-init.js. A future version may be set up to save all the current options and events of each open window to a database.
	
	Note: EXPERIMENTAL - PARTIALLY IMPLEMENTED.
	
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
		}.bind(this));
		this.loadingWorkspace = false;
	},
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
	
	},
	/*
	
	Function: dynamicResize
		Use with a timer to resize a window as the window's content size changes, such as with an accordian.
		
	*/		
	dynamicResize: function (windowEl){
		currentWindowClass = MochaUI.Windows.instances.get(windowEl.id);		
		currentWindowClass.contentWrapperEl.setStyle('height', currentWindowClass.contentEl.offsetHeight);
		currentWindowClass.contentWrapperEl.setStyle('width', currentWindowClass.contentEl.offsetWidth);			
		currentWindowClass.drawWindow(windowEl);
	},	
	/*
	
	Function: garbageCleanUp
		Empties all windows of their children, and removes and garbages the windows. It is does not trigger onClose() or onCloseComplete(). This is useful to clear memory before the pageUnload.
		
	Syntax:
	(start code)
		MochaUI.garbageCleanUp();
	(end)
	
	*/	
	garbageCleanUp: function() {
		$$('div.mocha').each(function(el) {
			el.destroy();
		}.bind(this));		
	}	
});
