/*

Script: Dock.js
	Implements the dock/taskbar. Enables window minimize.

Copyright:
	Copyright (c) 2007-2009 Greg Houston, <http://greghoustondesign.com/>.	

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

MochaUI.extend({
	/*

	Function: minimizeAll
		Minimize all windows that are minimizable.

	*/	
	minimizeAll: function() {
		$$('.mocha').each(function(windowEl){
			var instance = windowEl.retrieve('instance');
			if (!instance.isMinimized && instance.options.minimizable == true){
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
		enabledButtonColor:   [115, 153, 191], 
		disabledButtonColor:  [170, 170, 170]
	},
	initialize: function(options){
		// Stops if MochaUI.Desktop is not implemented
		if (!MochaUI.Desktop) return;
		this.setOptions(options);
		
		MochaUI.dockVisible = true;
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
			'bottom':   MochaUI.Desktop.desktopFooter ? MochaUI.Desktop.desktopFooter.offsetHeight : 0,
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
			opacity: 1,
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
					if (!MochaUI.Desktop.desktopFooter) {
						var dockHotspotHeight = this.dockWrapper.offsetHeight;
						if (dockHotspotHeight < 25) dockHotspotHeight = 25;
					}
					else if (MochaUI.Desktop.desktopFooter) {
						var dockHotspotHeight = this.dockWrapper.offsetHeight + MochaUI.Desktop.desktopFooter.offsetHeight;
						if (dockHotspotHeight < 25) dockHotspotHeight = 25;
					}						
					if (!MochaUI.Desktop.desktopFooter && event.client.y > (document.getCoordinates().height - dockHotspotHeight)){
						if (!MochaUI.dockVisible){
							this.dockWrapper.show();
							MochaUI.dockVisible = true;
							MochaUI.Desktop.setDesktopSize();
						}
					}
					else if (MochaUI.Desktop.desktopFooter && event.client.y > (document.getCoordinates().height - dockHotspotHeight)){
						if (!MochaUI.dockVisible){
							this.dockWrapper.show();
							MochaUI.dockVisible = true;
							MochaUI.Desktop.setDesktopSize();
						}
					}
					else if (MochaUI.dockVisible){
						this.dockWrapper.hide();
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

		var instance = windowEl.retrieve('instance');

		var dockTab = new Element('div', {
			'id': instance.options.id + '_dockTab',
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
					if (instance.isMinimized == true) {
						MochaUI.Dock.restoreMinimized.delay(25, MochaUI.Dock, windowEl);
					}
					else {
						MochaUI.focusWindow(windowEl);
					}
					return;
				}
				// If window is minimized, restore window.
				if (instance.isMinimized == true) {
					MochaUI.Dock.restoreMinimized.delay(25, MochaUI.Dock, windowEl);
				}
				else{
					// If window is not minimized and is focused, minimize window.
					if (instance.windowEl.hasClass('isFocused') && instance.options.minimizable == true){
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

		var titleText = instance.titleEl.innerHTML;

		var dockTabText = new Element('div', {
			'id': instance.options.id + '_dockTabText',
			'class': 'dockText'
		}).set('html', titleText.substring(0,19) + (titleText.length > 19 ? '...' : '')).inject($(dockTab));

		// If I implement this again, will need to also adjust the titleText truncate and the tab's
		// left padding.
		if (instance.options.icon != false){
			// dockTabText.setStyle('background', 'url(' + instance.options.icon + ') 4px 4px no-repeat');
		}
		
		// Need to resize everything in case the dock wraps when a new tab is added
		MochaUI.Desktop.setDesktopSize();

	},
	makeActiveTab: function(){

		// getWindowWith HighestZindex is used in case the currently focused window
		// is closed.		
		var windowEl = MochaUI.getWindowWithHighestZindex();
		var instance = windowEl.retrieve('instance');
		
		$$('.dockTab').removeClass('activeDockTab');
		if (instance.isMinimized != true) {
			
			instance.windowEl.addClass('isFocused');

			var currentButton = $(instance.options.id + '_dockTab');
			if (currentButton != null) {
				currentButton.addClass('activeDockTab');
			}
		}
		else {
			instance.windowEl.removeClass('isFocused');
		}	
	},	
	minimizeWindow: function(windowEl){
		if (windowEl != $(windowEl)) return;
		
		var instance = windowEl.retrieve('instance');
		instance.isMinimized = true;

		// Hide iframe
		// Iframe should be hidden when minimizing, maximizing, and moving for performance and Flash issues
		if ( instance.iframeEl ) {
			// Some elements are still visible in IE8 in the iframe when the iframe's visibility is set to hidden.
			if (!Browser.Engine.trident) {
				instance.iframeEl.setStyle('visibility', 'hidden');
			}
			else {
				instance.iframeEl.hide();
			}
		}

		// Hide window and add to dock	
		instance.contentBorderEl.setStyle('visibility', 'hidden');
		if(instance.toolbarWrapperEl){		
			instance.toolbarWrapperEl.hide();
		}
		windowEl.setStyle('visibility', 'hidden');

		 // Fixes a scrollbar issue in Mac FF2
		if (Browser.Platform.mac && Browser.Engine.gecko){
			if (/Firefox[\/\s](\d+\.\d+)/.test(navigator.userAgent)){
				var ffversion = new Number(RegExp.$1);
				if (ffversion < 3) {
					instance.contentWrapperEl.setStyle('overflow', 'hidden');
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

		instance.fireEvent('onMinimize', windowEl);
	},
	restoreMinimized: function(windowEl) {

		var instance = windowEl.retrieve('instance');

		if (instance.isMinimized == false) return;

		if (MochaUI.Windows.windowsVisible == false){
			MochaUI.toggleWindowVisibility();
		}

		MochaUI.Desktop.setDesktopSize();

		 // Part of Mac FF2 scrollbar fix
		if (instance.options.scrollbars == true && !instance.iframeEl){ 
			instance.contentWrapperEl.setStyle('overflow', 'auto');
		}

		if (instance.isCollapsed) {
			MochaUI.collapseToggle(windowEl);
		}

		windowEl.setStyle('visibility', 'visible');
		instance.contentBorderEl.setStyle('visibility', 'visible');
		if(instance.toolbarWrapperEl){
			instance.toolbarWrapperEl.show();
		}

		// Show iframe
		if (instance.iframeEl){
			if (!Browser.Engine.trident){
				instance.iframeEl.setStyle('visibility', 'visible');
			}
			else {
				instance.iframeEl.show();
			}
		}

		instance.isMinimized = false;
		MochaUI.focusWindow(windowEl);
		instance.fireEvent('onRestore', windowEl);

	}
});
MochaUI.Dock.implement(new Options, new Events);
