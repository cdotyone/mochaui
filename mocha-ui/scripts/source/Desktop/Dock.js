/*

Script: Dock.js
	Implements the dock/taskbar. Enables window minimize.
	
Copyright:
	Copyright (c) 2007-2008 Greg Houston, <http://greghoustondesign.com/>.	

License:
	MIT-style license.

Requires:
	Core.js, Window.js, Desktop.js	

Todo:
	- Make it so the dock requires no initial html markup.

*/

MochaUI.options.extend({			   
		// Naming options:
		// If you change the IDs of the Mocha Desktop containers in your HTML, you need to change them here as well.
		dockWrapper: 'dockWrapper',
		dock:        'dock'
});

MochaUI.dockVisible = true;

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
		useCanvasTabs:        true,     // Toggle use of canvas tab graphics. NOT YET IMPLEMENTED
		dockPosition:         'bottom',  // Position the dock starts in, top or bottom.
		// Style options
		dockTabColor:         [255, 255, 255],
		trueButtonColor:      [70, 245, 70],     // Color for autohide on		
		enabledButtonColor:   [255, 70, 70], 
		disabledButtonColor:  [150, 150, 150]		
	},
	initialize: function(options){
		// Stops if MochaUI.Desktop is not implemented
		if (!MochaUI.Desktop) return;
		this.setOptions(options);
		
		this.dockWrapper   = $(MochaUI.options.dockWrapper);		
		this.dock          = $(MochaUI.options.dock);
		this.autoHideEvent = null;		
		this.dockAutoHide  = false;  // True when dock autohide is set to on, false if set to off

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
		this.installed     = true;		
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
				MochaUI.circle(ctx, 5 , 14, 3, this.options.trueButtonColor, 1.0); // green
				
				// Define event
				this.autoHideEvent = function(event) {
					if (!this.dockAutoHide)
						return;
					if (event.client.y > (document.getCoordinates().height - 25)){
						if (!MochaUI.dockVisible){
							this.dockWrapper.setStyle('display', 'block');
							MochaUI.dockVisible = true;
							MochaUI.Desktop.setDesktopSize();
						}
					} else {
						if (MochaUI.dockVisible){
							this.dockWrapper.setStyle('display', 'none');
							MochaUI.dockVisible = false;
							MochaUI.Desktop.setDesktopSize();
						}
					}
				}.bind(this);
				
				// Add event
				document.addEvent('mousemove', this.autoHideEvent);				
				
			} else {
				$('dockAutoHide').setProperty('title', 'Turn Auto Hide On');
				//ctx.clearRect(0, 11, 100, 100);
				MochaUI.circle(ctx, 5 , 14, 3, this.options.enabledButtonColor, 1.0); // red
				// Remove event
				document.removeEvent('mousemove', this.autoHideEvent);
			}
			
		}.bind(this));
		
		// Draw dock controls
		var ctx = $('dockCanvas').getContext('2d');
		ctx.clearRect(0, 0, 100, 100);
		MochaUI.circle(ctx, 5 , 4, 3, this.options.enabledButtonColor, 1.0);  // red
		MochaUI.circle(ctx, 5 , 14, 3, this.options.enabledButtonColor, 1.0); // red
		
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
				MochaUI.circle(ctx, 5, 4, 3, this.options.trueButtonColor, 1.0); // green
				MochaUI.circle(ctx, 5, 14, 3, this.options.disabledButtonColor, 1.0); // gray
				$('dockPlacement').setProperty('title', 'Position Dock Bottom');
				$('dockAutoHide').setProperty('title', 'Auto Hide Disabled in Top Dock Position');
				this.dockAutoHide = false;
			}
			// Move dock to bottom position
			else {
				this.dockWrapper.setStyles({
					'position':      'absolute',
					'bottom':        0
				});
				this.dockWrapper.removeClass('top');				
				MochaUI.Desktop.setDesktopSize();
				this.dockWrapper.setProperty('dockPosition', 'bottom');
				ctx.clearRect(0, 0, 100, 100);
				MochaUI.circle(ctx, 5, 4, 3, this.options.enabledButtonColor, 1.0); // red
				MochaUI.circle(ctx, 5 , 14, 3, this.options.enabledButtonColor, 1.0); // red 
				$('dockPlacement').setProperty('title', 'Position Dock Top');
				$('dockAutoHide').setProperty('title', 'Turn Auto Hide On');
			}		
	},
	minimizeWindow: function(windowEl){		
		if (windowEl != $(windowEl)) return;
			
		var currentInstance = MochaUI.Windows.instances.get(windowEl.id);
		currentInstance.isMinimized = true;

		// Hide iframe
		// Iframe should be hidden when minimizing, maximizing, and moving for performance and Flash issues
		if ( currentInstance.iframe ) {
			currentInstance.iframeEl.setStyle('visibility', 'hidden');
		}
		
		var titleText = currentInstance.titleEl.innerHTML;

		// Hide window and add to dock	
		currentInstance.contentBorderEl.setStyle('visibility', 'hidden');
		if(currentInstance.toolbarWrapperEl){		
			currentInstance.toolbarWrapperEl.setStyle('visibility', 'hidden');
		}
		windowEl.setStyle('visibility', 'hidden');

		 // Fixes a scrollbar issue in Mac FF2
		if (Browser.Platform.mac && Browser.Engine.gecko){
			currentInstance.contentWrapperEl.setStyle('overflow', 'hidden');
		}
		
		var dockTab = new Element('div', {
			'id': currentInstance.options.id + '_dockTab',
			'class': 'dockTab',
			'title': titleText
		}).inject($('dockClear'), 'before');
		
		dockTab.addEvent('mousedown', function(e){
			this.timeDown = $time();			
		});
		
		dockTab.addEvent('mouseup', function(e){
			this.timeUp = $time();
			if ((this.timeUp - this.timeDown) < 275){
				MochaUI.Dock.restoreMinimized.delay(25, MochaUI.Dock, windowEl);
			}
		});		

		this.dockSortables.addItems(dockTab);

		//Insert canvas
		if (this.options.useCanvasTabs){	
			var dockTabCanvas = new Element('canvas', {
				'id': currentInstance.options.id + '_dockTabCanvas',
				'class': 'dockCanvas', 
				'width': 120,
				'height': 20			
			}).inject(dockTab);	
			
			// Dynamically initialize canvas using excanvas. This is only required by IE
			if (Browser.Engine.trident && MochaUI.ieSupport == 'excanvas') {
				G_vmlCanvasManager.initElement(dockTabCanvas);
			}

			var ctx = $(currentInstance.options.id + '_dockTabCanvas').getContext('2d');
			MochaUI.roundedRect(ctx, 0, 0, 120, 20, 5, this.options.dockTabColor, 1);
		}
		
		var dockTabText = new Element('div', {
			'id': currentInstance.options.id + '_dockTabText',
			'class': 'dockText'
		}).set('html', titleText.substring(0,18) + (titleText.length > 18 ? '...' : '')).inject($(dockTab));
		
		MochaUI.Desktop.setDesktopSize();
		
		// Fixes a scrollbar issue in Mac FF2.
		// Have to use timeout because window gets focused when you click on the minimize button 	
		setTimeout(function(){ windowEl.setStyle('zIndex', 1); }.bind(this),100);
		currentInstance.isFocused = false;
		currentInstance.fireEvent('onMinimize', windowEl);		
	},
	restoreMinimized: function(windowEl) {

		if (MochaUI.Windows.windowsVisible == false){
			MochaUI.toggleWindowVisibility();
		}

		var currentInstance = MochaUI.Windows.instances.get(windowEl.id);
		currentButton = $(currentInstance.options.id + '_dockTab');				
		
		this.dockSortables.removeItems(currentButton ).destroy();
		MochaUI.Desktop.setDesktopSize();

		 // Part of Mac FF2 scrollbar fix
		if (currentInstance.options.scrollbars == true && currentInstance.iframe == false){ 
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
		if ( currentInstance.iframe ) {
			currentInstance.iframeEl.setStyle('visibility', 'visible');
		}
		currentInstance.isMinimized = false;
		MochaUI.focusWindow(windowEl);
		currentInstance.fireEvent('onRestore', windowEl);		
	}	
});
MochaUI.Dock.implement(new Options, new Events);
