/*

Script: Dock.js
	Create windows from a form
	
Dependencies: desktop.js, window.js, core.js	

License:
	MIT-style license.
	
Todo:
	- Make it so the dock requires no initial html markup.
	- Make dock buttons sortable.

*/

MochaUI.options.extend({
		// Naming options:
		// If you change the IDs of the Mocha Desktop containers in your HTML, you need to change them here as well.
		dockWrapper: 'mochaDockWrapper',
		dock:        'mochaDock'
});

MochaUI.dockVisible = true;


MochaUI.Dock = new Class({
	Extends: MochaUI.Window,
	
	Implements: [Events, Options],
	
	options: {
		// Style options
		dockButtonColor:   [100, 100, 100]
	},
	initialize: function(options){
		// Stops if MochaUI.Desktop is not implemented
		if (!MochaUI.Desktop) return;
		this.setOptions(options);
		
		this.dockWrapper   = $(MochaUI.options.dockWrapper);		
		this.dock          = $(MochaUI.options.dock);
		this.autoHideEvent = null;

		this.dockAutoHide  = false;  // True when dock autohide is set to on, false if set to off

		if ( this.dockWrapper ) { this.initializeDock(); }

		MochaUI.Desktop.setDesktopSize();
		
		// Resize desktop, page wrapper, modal overlay, and maximized windows when browser window is resized		
		this.installed     = true;		
	},
	initializeDock: function (){
			this.dockWrapper.setStyles({
				'display':  'block',
				'position': 'absolute',
				'top':      null,
				'bottom':   0,
				'left':     0
			});			

		// Insert canvas
		var canvas = new Element('canvas', {
			'id':     'dockCanvas',
			'width':  '15',
			'height': '18'
		}).injectInside(this.dock);
		
		// Dynamically initialize canvas using excanvas. This is only required by IE
		if (Browser.Engine.trident && MochaUI.ieSupport == 'excanvas') {
			G_vmlCanvasManager.initElement(canvas);
		}

		// Position top or bottom selector
		$('mochaDockPlacement').setProperty('title','Position Dock Top');

		// Auto Hide toggle switch
		$('mochaDockAutoHide').setProperty('title','Turn Auto Hide On');

		// Attach event
		$('mochaDockPlacement').addEvent('click', function(event){
			var ctx = $('dockCanvas').getContext('2d');

			// Move dock to top position
			if (this.dockWrapper.getStyle('position') != 'relative'){
				this.dockWrapper.setStyles({
					'position': 'relative',
					'bottom':   null
				});
				this.dockWrapper.addClass('top');
				MochaUI.Desktop.setDesktopSize();
				this.dockWrapper.setProperty('dockPosition','Top');	
				MochaUI.circle(ctx, 5, 4, 3, [0, 255, 0], 1.0); // green
				MochaUI.circle(ctx, 5, 14, 3, [150, 150, 150], 1.0); // gray
				$('mochaDockPlacement').setProperty('title', 'Position Dock Bottom');
				$('mochaDockAutoHide').setProperty('title', 'Auto Hide Disabled in Top Dock Position');
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
				this.dockWrapper.setProperty('dockPosition','Bottom');
				MochaUI.circle(ctx, 5, 4, 3, [255, 70, 70], 1.0); // orange
				MochaUI.circle(ctx, 5 , 14, 3, [255, 70, 70], 1.0); // orange 
				$('mochaDockPlacement').setProperty('title', 'Position Dock Top');
				$('mochaDockAutoHide').setProperty('title', 'Turn Auto Hide On');
			}

		}.bind(this));

		// Attach event Auto Hide 
		$('mochaDockAutoHide').addEvent('click', function(event){
			if ( this.dockWrapper.getProperty('dockPosition') == 'Top' )
				return false;
			
			var ctx = $('dockCanvas').getContext('2d');
			this.dockAutoHide = !this.dockAutoHide;	// Toggle
			if ( this.dockAutoHide ) {
				$('mochaDockAutoHide').setProperty('title', 'Turn Auto Hide Off');
				MochaUI.circle(ctx, 5 , 14, 3, [0, 255, 0], 1.0); // green
				
				// Define event
				this.autoHideEvent = function(event) {
					if ( !this.dockAutoHide )
						return;
					if ( event.client.y > (document.getCoordinates().height - 25) ) {
						if ( !MochaUI.dockVisible ) {
							this.dockWrapper.setStyle('display', 'block');
							MochaUI.dockVisible = true;
							MochaUI.Desktop.setDesktopSize();
						}
					} else {
						if ( MochaUI.dockVisible ) {
							this.dockWrapper.setStyle('display', 'none');
							MochaUI.dockVisible = false;
							MochaUI.Desktop.setDesktopSize();
						}
					}
				}.bind(this);
				
				// Add event
				document.addEvent('mousemove', this.autoHideEvent);				
				
			} else {
				$('mochaDockAutoHide').setProperty('title', 'Turn Auto Hide On');
				MochaUI.circle(ctx, 5 , 14, 3, [255, 70, 70], 1.0); // orange
				// Remove event
				document.removeEvent('mousemove', this.autoHideEvent);
			}
		}.bind(this));
		
		this.drawDock(this.dock);

		// Add check mark to menu if link exists in menu
		if ($('dockLinkCheck')){			
			this.sidebarCheck = new Element('div', {
				'class': 'check',
				'id': 'dock_check'
			}).injectInside($('dockLinkCheck'));
		}
		
	},
	drawDock: function (el){
		var ctx = $('dockCanvas').getContext('2d');
		MochaUI.circle(ctx, 5 , 4, 3, [255, 70, 70], 1.0);  // orange
		MochaUI.circle(ctx, 5 , 14, 3, [255, 70, 70], 1.0); // orange
	},
	minimizeWindow: function(windowEl) {		
		if ( !(windowEl = $(windowEl)))
			return;
			
		currentWindowClass = MochaUI.Windows.instances.get(windowEl.id);
		currentWindowClass.isMinimized = true;

		// Hide iframe
		// Iframe should be hidden when minimizing, maximizing, and moving for performance and Flash issues
		if ( currentWindowClass.iframe ) {
			currentWindowClass.iframeEl.setStyle('visibility', 'hidden');
		}

		var title = currentWindowClass.titleEl; //?
		//var mochaContentWrapper = this.contentWrapperEl;
		var titleText = title.innerHTML; //?
		currentWindowClass.fireEvent('onMinimize');

		// Hide window and add to dock
		windowEl.setStyle('visibility', 'hidden');

		 // Fixes a scrollbar issue in Mac FF2
		if (Browser.Platform.mac && Browser.Engine.gecko){
			currentWindowClass.contentWrapperEl.setStyle('overflow', 'hidden');
		}
		
		var dockButton = new Element('div', {
			'id': currentWindowClass.options.id + '_dockButton',
			'class': 'mochaDockButton',
			'title': titleText
		}).injectInside($(MochaUI.options.dock));
		
		dockButton.addEvent('click', function(event) {
			MochaUI.Dock.restoreMinimized(windowEl);
		}.bind(this));		
		
		//Insert canvas
		var dockButtonCanvas = new Element('canvas', {
			'id': currentWindowClass.options.id + '_dockButtonCanvas',
			'class': 'mochaDockCanvas', 
			'width': 120,
			'height': 20			
		}).injectInside(dockButton);	
		
		// Dynamically initialize canvas using excanvas. This is only required by IE
		if (Browser.Engine.trident && MochaUI.ieSupport == 'excanvas') {
			G_vmlCanvasManager.initElement(dockButtonCanvas);
		}

		var ctx = $(currentWindowClass.options.id + '_dockButtonCanvas').getContext('2d');
		MochaUI.roundedRect(ctx, 0, 0, 120, 20, 5, this.options.dockButtonColor, 1);	
		
		var dockButtonText = new Element('div', {
			'id': currentWindowClass.options.id + '_dockButtonText',
			'class': 'mochaDockText'
		}).set('html', titleText.substring(0,18) + (titleText.length > 18 ? '...' : '')).injectInside($(dockButton));		
		
		// Fixes a scrollbar issue in Mac FF2.
		// Have to use timeout because window gets focused when you click on the minimize button 	
		setTimeout(function(){ windowEl.setStyle('zIndex', 1); }.bind(this),100); 
	},
	restoreMinimized: function(windowEl) {
		
		// Get the Class for this window
		currentWindowClass = MochaUI.Windows.instances.get(windowEl.id);

		 // Part of Mac FF2 scrollbar fix
		if (currentWindowClass.options.scrollbars == true && currentWindowClass.iframe == false){ 
			currentWindowClass.contentWrapperEl.setStyle('overflow', 'auto');
		}

		windowEl.setStyle('visibility', 'visible');

		// Show iframe
		if ( currentWindowClass.iframe ) {
			currentWindowClass.iframeEl.setStyle('visibility', 'visible');
		}

		currentWindowClass.isMinimized = false;
		MochaUI.focusWindow(windowEl);
		$(MochaUI.options.dock).getElementById(currentWindowClass.options.id + '_dockButton').destroy(); // getElementByID?
	}	
});
MochaUI.Dock.implement(new Options, new Events);
