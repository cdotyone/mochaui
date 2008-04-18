/*

Script: Dock.js
	Create windows from a form

License:
	MIT-style license.

Requires:
	Core.js, Window.js, Desktop.js	

Todo:
	- Make it so the dock requires no initial html markup.
	- Make dock buttons sortable.

*/

MochaUI.options.extend({			   
		// Naming options:
		// If you change the IDs of the Mocha Desktop containers in your HTML, you need to change them here as well.
		dockWrapper: 'dockWrapper',
		dock:        'dock'
});

MochaUI.dockVisible = true;


MochaUI.Dock = new Class({
	Extends: MochaUI.Window,
	
	Implements: [Events, Options],
	
	options: {
		useControls: true, // Toggles autohide and dock placement controls - NOT FULLY IMPLEMENTED		
		// Style options
		dockButtonColor:   [255, 255, 255]
	},
	initialize: function(options){
		// Stops if MochaUI.Desktop is not implemented
		if (!MochaUI.Desktop) return;
		this.setOptions(options);
		
		this.dockWrapper   = $(MochaUI.options.dockWrapper);		
		this.dock          = $(MochaUI.options.dock);
		this.autoHideEvent = null;

		this.dockAutoHide  = false;  // True when dock autohide is set to on, false if set to off

		this.dockWrapper.setStyles({
			'display':  'block',
			'position': 'absolute',
			'top':      null,
			'bottom':   0,
			'left':     0
		});	

		if ( this.options.useControls) { this.initializeDockControls(); }

		// Add check mark to menu if link exists in menu
		if ($('dockLinkCheck')){			
			this.sidebarCheck = new Element('div', {
				'class': 'check',
				'id': 'dock_check'
			}).injectInside($('dockLinkCheck'));
		}

		MochaUI.Desktop.setDesktopSize();
		
		// Resize desktop, page wrapper, modal overlay, and maximized windows when browser window is resized		
		this.installed     = true;		
	},
	initializeDockControls: function (){
		
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
		$('dockPlacement').setProperty('title','Position Dock Top');

		// Auto Hide toggle switch
		$('dockAutoHide').setProperty('title','Turn Auto Hide On');

		// Attach event
		$('dockPlacement').addEvent('click', function(event){
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
				ctx.clearRect(0, 0, 100, 100);
				MochaUI.circle(ctx, 5, 4, 3, [0, 255, 0], 1.0); // green
				MochaUI.circle(ctx, 5, 14, 3, [150, 150, 150], 1.0); // gray
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
				this.dockWrapper.setProperty('dockPosition','Bottom');
				ctx.clearRect(0, 0, 100, 100);
				MochaUI.circle(ctx, 5, 4, 3, [255, 70, 70], 1.0); // orange
				MochaUI.circle(ctx, 5 , 14, 3, [255, 70, 70], 1.0); // orange 
				$('dockPlacement').setProperty('title', 'Position Dock Top');
				$('dockAutoHide').setProperty('title', 'Turn Auto Hide On');
			}

		}.bind(this));

		// Attach event Auto Hide 
		$('dockAutoHide').addEvent('click', function(event){
			if ( this.dockWrapper.getProperty('dockPosition') == 'Top' )
				return false;
			
			var ctx = $('dockCanvas').getContext('2d');
			this.dockAutoHide = !this.dockAutoHide;	// Toggle
			if ( this.dockAutoHide ) {
				$('dockAutoHide').setProperty('title', 'Turn Auto Hide Off');
				ctx.clearRect(0, 11, 100, 100);				
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
				$('dockAutoHide').setProperty('title', 'Turn Auto Hide On');
				ctx.clearRect(0, 11, 100, 100);
				MochaUI.circle(ctx, 5 , 14, 3, [255, 70, 70], 1.0); // orange
				// Remove event
				document.removeEvent('mousemove', this.autoHideEvent);
			}
		}.bind(this));
		
		// Draw dock controls
		var ctx = $('dockCanvas').getContext('2d');
		ctx.clearRect(0, 0, 100, 100);
		MochaUI.circle(ctx, 5 , 4, 3, [255, 70, 70], 1.0);  // orange
		MochaUI.circle(ctx, 5 , 14, 3, [255, 70, 70], 1.0); // orange
		
	},
	minimizeWindow: function(windowEl) {		
		if (windowEl != $(windowEl))
			return;
			
		currentWindowClass = MochaUI.Windows.instances.get(windowEl.id);
		currentWindowClass.isMinimized = true;

		// Hide iframe
		// Iframe should be hidden when minimizing, maximizing, and moving for performance and Flash issues
		if ( currentWindowClass.iframe ) {
			currentWindowClass.iframeEl.setStyle('visibility', 'hidden');
		}
		
		if (currentWindowClass.options.shape == 'gauge'){
			currentWindowClass.canvasControlsEl.setStyle('opacity', 0);
		}

		var title = currentWindowClass.titleEl; //?
		var titleText = title.innerHTML; //?

		// Hide window and add to dock
		windowEl.setStyle('visibility', 'hidden');

		 // Fixes a scrollbar issue in Mac FF2
		if (Browser.Platform.mac && Browser.Engine.gecko){
			currentWindowClass.contentWrapperEl.setStyle('overflow', 'hidden');
		}
		
		var dockButton = new Element('div', {
			'id': currentWindowClass.options.id + '_dockButton',
			'class': 'dockButton',
			'title': titleText
		}).injectInside($(MochaUI.options.dock));
		
		dockButton.addEvent('click', function(event) {
			MochaUI.Dock.restoreMinimized(windowEl);
		}.bind(this));		
		
		//Insert canvas
		var dockButtonCanvas = new Element('canvas', {
			'id': currentWindowClass.options.id + '_dockButtonCanvas',
			'class': 'dockCanvas', 
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
			'class': 'dockText'
		}).set('html', titleText.substring(0,18) + (titleText.length > 18 ? '...' : '')).injectInside($(dockButton));		
		
		// Fixes a scrollbar issue in Mac FF2.
		// Have to use timeout because window gets focused when you click on the minimize button 	
		setTimeout(function(){ windowEl.setStyle('zIndex', 1); }.bind(this),100);
		currentWindowClass.isFocused = false;
		currentWindowClass.fireEvent('onMinimize', windowEl);		
	},
	restoreMinimized: function(windowEl) {

		$(MochaUI.options.dock).getElementById(currentWindowClass.options.id + '_dockButton').destroy(); // getElementByID?

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

		currentWindowClass.fireEvent('onRestore', windowEl);		
	}	
});
MochaUI.Dock.implement(new Options, new Events);
