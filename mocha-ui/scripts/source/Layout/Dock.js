/*

Script: Dock.js
	Implements the dock/taskbar. Enables window minimize.
	
Copyright:
	Copyright (c) 2007-2008 Greg Houston, <http://greghoustondesign.com/>.	

License:
	MIT-style license.

Requires:
	Core.js, Window.js, Layout.js	

Todo:
	- Make it so the dock requires no initial html markup.

*/

MochaUI.options.extend({			   
		// Naming options:
		// If you change the IDs of the Mocha Desktop containers in your HTML, you need to change them here as well.
		dockWrapper: 'dockWrapper',
		dock:        'dock'
});

// Used by Desktop.js before MochaUI.Dock is initialized.
window.addEvent('domready', function(){	
	if ($('dockWrapper')) {
		MochaUI.dockVisible = true;
	}
});

MochaUI.extend({
	/*

	Function: minimizeAll
		Minimize all windows.

	*/	
	minimizeAll: function() {		
		$$('div.mocha').each(function(windowEl){
		var currentInstance = MochaUI.Windows.instances.get(windowEl.id);									  
			if (!currentInstance.isMinimized){
				MochaUI.Dock.minimizeWindow(windowEl);
			}			
		}.bind(this));		
	}
});	

MochaUI.Dock = new Class({
	Extends: MochaUI.Window,
	
	Implements: [Events, Options],
	
	options: {
		useControls:          true,      // Toggles autohide and dock placement controls.
		dockPosition:         'top',     // Position the dock starts in, top or bottom.
		// Style options
		dockTabColor:         [255, 255, 255],
		trueButtonColor:      [70, 245, 70],     // Color for autohide on		
		enabledButtonColor:   [108, 152, 217], 
		disabledButtonColor:  [170, 170, 170]		
	},
	initialize: function(options){
		// Stops if MochaUI.Desktop is not implemented
		if (!MochaUI.Desktop) return;
		this.setOptions(options);
		
		this.dockWrapper   = $(MochaUI.options.dockWrapper);		
		this.dock          = $(MochaUI.options.dock);
		this.autoHideEvent = null;		
		this.dockAutoHide  = false;  // True when dock autohide is set to on, false if set to off

		if (!this.dockWrapper) return;

		if (!this.options.useControls){
			if($('dockPlacement')){
				$('dockPlacement').setStyle('cursor', 'default');
			}
			if($('dockAutoHide')){
				$('dockAutoHide').setStyle('cursor', 'default');
			}
		}

		this.dockWrapper.setStyles({
			'display':  'block',
			'position': 'absolute',
			'top':      null,
			'bottom':   0,
			'left':     0
		});	

		if (this.options.useControls){
			this.initializeDockControls();
		}

		// Add check mark to menu if link exists in menu
		if ($('dockLinkCheck')){			
			this.sidebarCheck = new Element('div', {
				'class': 'check',
				'id': 'dock_check'
			}).inject($('dockLinkCheck'));
		}
		
		this.dockSortables = new Sortables('#dockSort', {
			opacity: Browser.Engine.trident ? 1 : .5,
    		constrain: true,
    		clone: false,
    		revert: false			
		});		

		MochaUI.Desktop.setDesktopSize();
	},
	initializeDockControls: function(){
		
		if (this.options.useControls){
			// Insert canvas
			var canvas = new Element('canvas', {
				'id':     'dockCanvas',
				'width':  '15',
				'height': '18'
			}).inject(this.dock);
		
			// Dynamically initialize canvas using excanvas. This is only required by IE
			if (Browser.Engine.trident && MochaUI.ieSupport == 'excanvas'){
				G_vmlCanvasManager.initElement(canvas);
			}
		}
		
		var dockPlacement = $('dockPlacement');
		var dockAutoHide = $('dockAutoHide');

		// Position top or bottom selector
		dockPlacement.setProperty('title','Position Dock Top');

		// Attach event
		dockPlacement.addEvent('click', function(){
			this.moveDock();
		}.bind(this));

		// Auto Hide toggle switch
		dockAutoHide.setProperty('title','Turn Auto Hide On');
		
		// Attach event Auto Hide 
		dockAutoHide.addEvent('click', function(event){
			if ( this.dockWrapper.getProperty('dockPosition') == 'top' )
				return false;
			
			var ctx = $('dockCanvas').getContext('2d');
			this.dockAutoHide = !this.dockAutoHide;	// Toggle
			if (this.dockAutoHide){
				$('dockAutoHide').setProperty('title', 'Turn Auto Hide Off');
				//ctx.clearRect(0, 11, 100, 100);				
				MochaUI.circle(ctx, 5 , 14, 3, this.options.trueButtonColor, 1.0);
				
				// Define event
				this.autoHideEvent = function(event) {
					if (!this.dockAutoHide)
						return;
					if (!MochaUI.Desktop.footer && event.client.y > (document.getCoordinates().height - 25)){
						if (!MochaUI.dockVisible){
							this.dockWrapper.setStyle('display', 'block');
							MochaUI.dockVisible = true;
							MochaUI.Desktop.setDesktopSize();
						}
					}
					else if (MochaUI.Desktop.desktopFooter && event.client.y > (document.getCoordinates().height - 25 - MochaUI.Desktop.desktopFooter.offsetHeight)){
						if (!MochaUI.dockVisible){
							this.dockWrapper.setStyle('display', 'block');
							MochaUI.dockVisible = true;
							MochaUI.Desktop.setDesktopSize();
						}
					}					
					else if (MochaUI.dockVisible){
						this.dockWrapper.setStyle('display', 'none');
						MochaUI.dockVisible = false;
						MochaUI.Desktop.setDesktopSize();
						
					}
				}.bind(this);
				
				// Add event
				document.addEvent('mousemove', this.autoHideEvent);				
				
			} else {
				$('dockAutoHide').setProperty('title', 'Turn Auto Hide On');
				//ctx.clearRect(0, 11, 100, 100);
				MochaUI.circle(ctx, 5 , 14, 3, this.options.enabledButtonColor, 1.0);
				// Remove event
				document.removeEvent('mousemove', this.autoHideEvent);
			}
			
		}.bind(this));
		
		// Draw dock controls
		var ctx = $('dockCanvas').getContext('2d');
		ctx.clearRect(0, 0, 100, 100);
		MochaUI.circle(ctx, 5 , 4, 3, this.options.enabledButtonColor, 1.0); 
		MochaUI.circle(ctx, 5 , 14, 3, this.options.enabledButtonColor, 1.0);
		
		if (this.options.dockPosition == 'top'){
			this.moveDock();	
		}		
		
	},
	moveDock: function(){
			var ctx = $('dockCanvas').getContext('2d');
			// Move dock to top position
			if (this.dockWrapper.getStyle('position') != 'relative'){
				this.dockWrapper.setStyles({
					'position': 'relative',
					'bottom':   null
				});
				this.dockWrapper.addClass('top');
				MochaUI.Desktop.setDesktopSize();
				this.dockWrapper.setProperty('dockPosition','top');
				ctx.clearRect(0, 0, 100, 100);
				MochaUI.circle(ctx, 5, 4, 3, this.options.enabledButtonColor, 1.0);
				MochaUI.circle(ctx, 5, 14, 3, this.options.disabledButtonColor, 1.0);
				$('dockPlacement').setProperty('title', 'Position Dock Bottom');
				$('dockAutoHide').setProperty('title', 'Auto Hide Disabled in Top Dock Position');
				this.dockAutoHide = false;
			}
			// Move dock to bottom position
			else {
				this.dockWrapper.setStyles({
					'position':      'absolute',
					'bottom':        MochaUI.Desktop.desktopFooter ? MochaUI.Desktop.desktopFooter.offsetHeight : 0
				});
				this.dockWrapper.removeClass('top');				
				MochaUI.Desktop.setDesktopSize();
				this.dockWrapper.setProperty('dockPosition', 'bottom');
				ctx.clearRect(0, 0, 100, 100);
				MochaUI.circle(ctx, 5, 4, 3, this.options.enabledButtonColor, 1.0);
				MochaUI.circle(ctx, 5 , 14, 3, this.options.enabledButtonColor, 1.0);
				$('dockPlacement').setProperty('title', 'Position Dock Top');
				$('dockAutoHide').setProperty('title', 'Turn Auto Hide On');
			}		
	},
	createDockTab: function(windowEl){

		var currentInstance = MochaUI.Windows.instances.get(windowEl.id);

		var dockTab = new Element('div', {
			'id': currentInstance.options.id + '_dockTab',
			'class': 'dockTab',
			'title': titleText
		}).inject($('dockClear'), 'before');
		
		dockTab.addEvent('mousedown', function(e){
			new Event(e).stop();
			this.timeDown = $time();			
		});
		
		dockTab.addEvent('mouseup', function(e){
			this.timeUp = $time();
			if ((this.timeUp - this.timeDown) < 275){
				// If the visibility of the windows on the page are toggled off, toggle visibility on.
				if (MochaUI.Windows.windowsVisible == false) {
					MochaUI.toggleWindowVisibility();
					if (currentInstance.isMinimized == true) {
						MochaUI.Dock.restoreMinimized.delay(25, MochaUI.Dock, windowEl);
					}
					else {
						MochaUI.focusWindow(windowEl);
					}										
					return;
				}
				// If window is minimized, restore window.							
				if (currentInstance.isMinimized == true) {
					MochaUI.Dock.restoreMinimized.delay(25, MochaUI.Dock, windowEl);
				}
				else{
					// If window is not minimized and is focused, minimize window.
					if (currentInstance.windowEl.hasClass('isFocused')) {
						MochaUI.Dock.minimizeWindow(windowEl)
					}
					// If window is not minimized and is not focused, focus window.	
					else{
						MochaUI.focusWindow(windowEl);
					}
					// if the window is not minimized and is outside the viewport, center it in the viewport.
					var coordinates = document.getCoordinates();
					if (windowEl.getStyle('left').toInt() > coordinates.width || windowEl.getStyle('top').toInt() > coordinates.height){
						MochaUI.centerWindow(windowEl);	
					}					
				}					
			}
		});			

		this.dockSortables.addItems(dockTab);
	
		var titleText = currentInstance.titleEl.innerHTML;		
		
		var dockTabText = new Element('div', {
			'id': currentInstance.options.id + '_dockTabText',
			'class': 'dockText'
		}).set('html', titleText.substring(0,20) + (titleText.length > 20 ? '...' : '')).inject($(dockTab));

		// If I implement this again, will need to also adjust the titleText truncate and the tab's
		// left padding.
		if (currentInstance.options.icon != false){
			// dockTabText.setStyle('background', 'url(' + currentInstance.options.icon + ') 4px 4px no-repeat'); 	
		}
		
		// Need to resize everything in case the dock wraps when a new tab is added
		MochaUI.Desktop.setDesktopSize();
			
	},
	makeActiveTab: function(){

		// getWindowWith HighestZindex is used in case the currently focused window
		// is closed.		
		var windowEl = MochaUI.getWindowWithHighestZindex();
		var currentInstance = MochaUI.Windows.instances.get(windowEl.id);
		
		$$('div.dockTab').removeClass('activeDockTab');		
		if (currentInstance.isMinimized != true) {
			
			currentInstance.windowEl.addClass('isFocused');			

			currentButton = $(currentInstance.options.id + '_dockTab');			
			currentButton.addClass('activeDockTab');
		}
		else {
			currentInstance.windowEl.removeClass('isFocused');
		}	
	},	
	minimizeWindow: function(windowEl){		
		if (windowEl != $(windowEl)) return;
		
		var currentInstance = MochaUI.Windows.instances.get(windowEl.id);		
		currentInstance.isMinimized = true;		

		// Hide iframe
		// Iframe should be hidden when minimizing, maximizing, and moving for performance and Flash issues
		if ( currentInstance.iframeEl ) {
			currentInstance.iframeEl.setStyle('visibility', 'hidden');
		}
		
		// Hide window and add to dock	
		currentInstance.contentBorderEl.setStyle('visibility', 'hidden');
		if(currentInstance.toolbarWrapperEl){		
			currentInstance.toolbarWrapperEl.setStyle('visibility', 'hidden');
		}
		windowEl.setStyle('visibility', 'hidden');

		 // Fixes a scrollbar issue in Mac FF2
		if (Browser.Platform.mac && Browser.Engine.gecko){
			if (/Firefox[\/\s](\d+\.\d+)/.test(navigator.userAgent)) {
				var ffversion = new Number(RegExp.$1);
				if (ffversion < 3) {					
					currentInstance.contentWrapperEl.setStyle('overflow', 'hidden');
				}					
			}
		}
	
		MochaUI.Desktop.setDesktopSize();

		// Have to use timeout because window gets focused when you click on the minimize button 	
		setTimeout(function(){		
			windowEl.setStyle('zIndex', 1);
			windowEl.removeClass('isFocused');		
			this.makeActiveTab();	
		}.bind(this),100);	

		currentInstance.fireEvent('onMinimize', windowEl);		
	},
	restoreMinimized: function(windowEl) {

		var currentInstance = MochaUI.Windows.instances.get(windowEl.id);

		if (currentInstance.isMinimized == false) return;

		if (MochaUI.Windows.windowsVisible == false){
			MochaUI.toggleWindowVisibility();
		}

		MochaUI.Desktop.setDesktopSize();

		 // Part of Mac FF2 scrollbar fix
		if (currentInstance.options.scrollbars == true && !currentInstance.iframeEl){ 
			currentInstance.contentWrapperEl.setStyle('overflow', 'auto');
		}

		if (currentInstance.isCollapsed) {
			MochaUI.collapseToggle(windowEl);					
		}

		windowEl.setStyle('visibility', 'visible');
		currentInstance.contentBorderEl.setStyle('visibility', 'visible');
		if(currentInstance.toolbarWrapperEl){		
			currentInstance.toolbarWrapperEl.setStyle('visibility', 'visible');
		}		

		// Show iframe
		if ( currentInstance.iframeEl ) {
			currentInstance.iframeEl.setStyle('visibility', 'visible');
		}

		currentInstance.isMinimized = false;
		MochaUI.focusWindow(windowEl);
		currentInstance.fireEvent('onRestore', windowEl);
		
	}	
});
MochaUI.Dock.implement(new Options, new Events);
