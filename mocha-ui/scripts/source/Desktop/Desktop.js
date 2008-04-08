/*

Script: Desktop.js
	Creates a desktop. Enables window maximize. 
	
License:
	MIT-style license.	

Requires:
	Core.js, Window.js
	
Options:
	useHeaderCanvas - Toggle canvas header gradient.
	headerStartColor - Header gradient's top color - RGB.
	headerStopColor - Header gradient's bottom color.
	sidebarLimitX - Sidebar minimum and maximum widths when resizing.

*/

MochaUI.Desktop = new Class({
							
	Extends: MochaUI.Window,
	
	Implements: [Events, Options],
	
	options: {
		useHeaderCanvas: true,          		
		// Naming options:
		// If you change the IDs of the Mocha Desktop containers in your HTML, you need to change them here as well.
		desktop:                'mochaDesktop',
		desktopHeader:          'mochaDesktopHeader',
		desktopTitlebarWrapper: 'mochaDesktopTitlebarWrapper',
		desktopNavBar:          'mochaDesktopNavbar',
		pageWrapper:            'mochaPageWrapper',
		page:                   'mochaPage',
		sidebarWrapper:         'mochaSidebarWrapper',		
		sidebar:                'mochaSidebar',
		sidebarContentWrapper:  'mochaSidebarContentWrapper',		
		sidebarMinimize:        'mochaSidebarControl',
		sidebarHandle:          'mochaSidebarHandle',
		// Style options:
		headerStartColor:       [250, 250, 250],  // Header gradient's top color - RGB.
		headerStopColor:        [229, 229, 229],  // Header gradient's bottom color.
		// Sidebar options:
		sidebarLimitX:          [180, 280]        // Sidebar minimum and maximum widths when resizing.
	},	
	initialize: function(options){
		this.setOptions(options);
		this.desktop                = $(this.options.desktop);
		this.desktopHeader          = $(this.options.desktopHeader);
		this.desktopTitlebarWrapper = $(this.options.desktopTitlebarWrapper);		
		this.desktopNavBar          = $(this.options.desktopNavBar);
		this.pageWrapper            = $(this.options.pageWrapper);
		this.page                   = $(this.options.page);
		this.sidebarWrapper         = $(this.options.sidebarWrapper);		
		this.sidebar                = $(this.options.sidebar);
		this.sidebarContentWrapper  = $(this.options.sidebarContentWrapper);
		this.sidebarMinimize        = $(this.options.sidebarMinimize);
		this.sidebarHandle          = $(this.options.sidebarHandle);		
		
		//Insert canvas
		if (this.options.useHeaderCanvas){		
		this.desktopHeaderHeight = 35; //this.desktopTitlebarWrapper.offsetHeight;
			this.titlebarCanvas = new Element('canvas', {
				'id':     'titlebarCanvas',
				'width':  1000,
				'height': this.desktopHeaderHeight
			}).injectBottom(this.desktopTitlebarWrapper);
		}

		// Dynamically initialize canvas using excanvas. This is only required by IE
		if ( Browser.Engine.trident && MochaUI.ieSupport == 'excanvas'  ) {
			G_vmlCanvasManager.initElement(this.titlebarCanvas);			
		}
		
		this.setDesktopSize();
		this.menuInitialize();
		
		if(this.sidebar){
			this.sidebarInitialize();
		}

		// Resize desktop, page wrapper, modal overlay, and maximized windows when browser window is resized
		window.addEvent('resize', function(){
			this.onBrowserResize();
		}.bind(this));		
	},
	drawHeaderCanvas: function(){
		var windowDimensions = document.getCoordinates();
		
		$('titlebarCanvas').setProperty('width', windowDimensions.width);	
		
		var ctx = $('titlebarCanvas').getContext('2d');		
		// Create gradient
		// Opera doesn't make gradients tall enough
		if (Browser.Engine.presto != null ){
			var lingrad = ctx.createLinearGradient(0, 0, 0, 35 + 10);
		}
		else {
			var lingrad = ctx.createLinearGradient(0, 0, 0, 35);
		}

		lingrad.addColorStop(0, 'rgba(' + this.options.headerStartColor.join(',') + ', 1)');
		lingrad.addColorStop(1, 'rgba(' + this.options.headerStopColor.join(',') + ', 1)');		
		
		ctx.fillStyle = lingrad;

		ctx.fillRect(0, 0, windowDimensions.width, this.desktopHeaderHeight);			
	},
	menuInitialize: function(){
		// Fix for dropdown menus in IE6
		if (Browser.Engine.trident4 && this.desktopNavBar){
			this.desktopNavBar.getElements('li').each(function(element) {
				element.addEvent('mouseenter', function(){
					this.addClass('ieHover');
				});
				element.addEvent('mouseleave', function(){
					this.removeClass('ieHover');
				});
			});
		};
	},
	onBrowserResize: function(){
		this.setDesktopSize();
		// Resize maximized windows to fit new browser window size
		setTimeout( function(){
			MochaUI.Windows.instances.each(function(instance){
				if (instance.isMaximized) {

					// Hide iframe while resize for better performance
					if ( instance.iframeEl ) {
						instance.iframeEl.setStyle('visibility', 'hidden');
					}

					var windowDimensions = document.getCoordinates();
					instance.contentWrapperEl.setStyles({
						'height': windowDimensions.height - instance.options.headerHeight - instance.options.footerHeight,
						'width': windowDimensions.width
					});

					instance.drawWindow($(instance.options.id));
					if ( instance.iframeEl ) {
						instance.iframeEl.setStyles({
							'height': instance.contentWrapperEl.getStyle('height')
						});
						instance.iframeEl.setStyle('visibility', 'visible');
					}

				}
			}.bind(this));
		}.bind(this), 100);
	},
	setDesktopSize: function(){
		var windowDimensions = window.getCoordinates();

		if (this.options.useHeaderCanvas){
			this.drawHeaderCanvas.delay(10, this);
		}

		var mochaDock = $(MochaUI.options.dock);
		var mochaDockWrapper = $(MochaUI.options.dockWrapper);
		
		if ( this.desktop ){
			this.desktop.setStyle('height', windowDimensions.height);
		}

		// Set pageWrapper height so the dock doesn't cover the pageWrapper scrollbars.
		if (this.pageWrapper && this.desktopHeader) {
					
			var dockOffset = MochaUI.dockVisible ? mochaDockWrapper.offsetHeight : 0;
			
			var pageWrapperHeight = windowDimensions.height - this.desktopHeader.offsetHeight - dockOffset;
			
			if ( pageWrapperHeight < 0 ) {
				pageWrapperHeight = 0;
			}
			this.pageWrapper.setStyle('height', pageWrapperHeight + 'px');
		}
		
		if (this.sidebar){
			var sidebarBorderOffset = Browser.Engine.trident4 ? 3 : 2;  
			this.sidebarContentWrapper.setStyle('height', pageWrapperHeight - sidebarBorderOffset + 'px');
			this.sidebarMinimize.setStyle('top', ((pageWrapperHeight * .5) - (this.sidebarMinimize.offsetHeight * .5))  + 'px');
			this.sidebarHandle.setStyle('height', pageWrapperHeight - sidebarBorderOffset + 'px');			
		}
	},
	/*
	
	Function: maximizeWindow
		Maximize a window.
	
	Syntax:
		(start code)
		MochaUI.Desktop.maximizeWindow(windowEl);
		(end)	

	*/	
	maximizeWindow: function(windowEl) {

		currentWindowClass = MochaUI.Windows.instances.get(windowEl.id);

		// If window no longer exists or is maximized, stop
		if ( !(windowEl = $(windowEl)) || currentWindowClass.isMaximized )
			return;			

		currentWindowClass.isMaximized = true;

		currentWindowClass.fireEvent('onMaximize', windowEl);
		
		// Save original position
		currentWindowClass.oldTop = windowEl.getStyle('top');
		currentWindowClass.oldLeft = windowEl.getStyle('left');
		
		// Save original dimensions
		currentWindowClass.contentWrapperEl.oldWidth = currentWindowClass.contentWrapperEl.getStyle('width');
		currentWindowClass.contentWrapperEl.oldHeight = currentWindowClass.contentWrapperEl.getStyle('height');
		
		// Hide iframe
		// Iframe should be hidden when minimizing, maximizing, and moving for performance and Flash issues
		if ( currentWindowClass.iframe ) {
			currentWindowClass.iframeEl.setStyle('visibility', 'hidden');
		}

		var windowDimensions = document.getCoordinates();

		if (MochaUI.options.useEffects == false){
			windowEl.setStyles({
				'top': -currentWindowClass.options.shadowWidth,
				'left': -currentWindowClass.options.shadowWidth
			});
			currentWindowClass.contentWrapperEl.setStyles({
				'height': windowDimensions.height - currentWindowClass.options.headerHeight - currentWindowClass.options.footerHeight,
				'width':  windowDimensions.width
			});
			currentWindowClass.drawWindow(windowEl);
			// Show iframe
			if ( currentWindowClass.iframe ) {
				currentWindowClass.iframeEl.setStyle('visibility', 'visible');
			}
		}
		else {
			
			// Todo: Initialize the variables for these morphs once and reuse them
			
			//var maximizePositionMorph = new Fx.Morph(windowEl, {
			//	'duration': 300
			//});
			var maximizeSizeMorph = new Fx.Elements([currentWindowClass.contentWrapperEl, windowEl], { 
				'duration': 70,
				'onStart': function(windowEl){
						currentWindowClass.maximizeAnimation = currentWindowClass.drawWindow.periodical(20, currentWindowClass, currentWindowClass.windowEl);
				}.bind(this),
				'onComplete': function(windowEl){
					$clear(currentWindowClass.maximizeAnimation);
					currentWindowClass.drawWindow(windowEl);
					// Show iframe
					if ( currentWindowClass.iframe ) {
						currentWindowClass.iframeEl.setStyle('visibility', 'visible');
					}
				}.bind(this)
			});
			maximizeSizeMorph.start({
				'0': {	'height': windowDimensions.height - currentWindowClass.options.headerHeight - currentWindowClass.options.footerHeight,
						'width':  windowDimensions.width
				},
				'1': {	'top':  -currentWindowClass.options.shadowWidth, // Takes shadow width into account
						'left': -currentWindowClass.options.shadowWidth  // Takes shadow width into account
				}
			});		
		}		

	},
	/*
	
	Function: restoreWindow
		Restore a maximized window.
	
	Syntax:
		(start code)
		MochaUI.Desktop.restoreWindow(windowEl);
		(end)	

	*/	
	restoreWindow: function(windowEl) {	
	
		currentWindowClass = MochaUI.Windows.instances.get(windowEl.id);
		
		// Window exists and is maximized ?
		if ( !(windowEl = $(windowEl)) || !currentWindowClass.isMaximized )
			return;		
		
		currentWindowClass.isMaximized = false;			

		// Hide iframe
		// Iframe should be hidden when minimizing, maximizing, and moving for performance and Flash issues
		if ( currentWindowClass.iframe ) {
			currentWindowClass.iframeEl.setStyle('visibility', 'hidden');
		}

		if (MochaUI.options.useEffects == false){
			currentWindowClass.contentWrapperEl.setStyles({
				'width':  currentWindowClass.contentWrapperEl.oldWidth,
				'height': currentWindowClass.contentWrapperEl.oldHeight
			});
			currentWindowClass.drawWindow(windowEl);
			windowEl.setStyles({
				'top': currentWindowClass.oldTop,
				'left': currentWindowClass.oldLeft
			});
		}
		else {
			var restoreMorph = new Fx.Elements([currentWindowClass.contentWrapperEl, windowEl], { 
				'duration':   150,
				'onStart': function(windowEl){
						currentWindowClass.maximizeAnimation = currentWindowClass.drawWindow.periodical(20, currentWindowClass, currentWindowClass.windowEl);			
				}.bind(this),
				'onComplete': function(el){
					$clear(currentWindowClass.maximizeAnimation);
					currentWindowClass.drawWindow(windowEl);
					if ( currentWindowClass.iframe ) {
						currentWindowClass.iframeEl.setStyle('visibility', 'visible');
					}
				}.bind(this)
			});
			restoreMorph.start({ 
				'0': {	'height': currentWindowClass.contentWrapperEl.oldHeight,
						'width':  currentWindowClass.contentWrapperEl.oldWidth
				},
				'1': {	'top':  currentWindowClass.oldTop,
						'left': currentWindowClass.oldLeft
				}
			});
		}
	},
	sidebarInitialize: function(){
		this.sidebarResizable = this.sidebar.makeResizable({
			handle: this.sidebarHandle ? this.sidebarHandle : false,
			modifiers: {
				x: 'width',
				y: false				
			},
			limit: {
				x: this.options.sidebarLimitX
			},
			onBeforeStart: function(){
 				// Using postion fixed fixes a minor display glitch while resizing the sidebar in Firefox PC
				// Mac Firefox needs position fixed all the time though it does not render as well as absolute
				if (!Browser.Platform.mac && Browser.Engine.gecko){
					$$('div.mocha').setStyle('position', 'fixed');	
				}
			},
			onComplete: function(){
				if (!Browser.Platform.mac && Browser.Engine.gecko){
					$$('div.mocha').setStyle('position', 'absolute');	
				}
			}			
		});
		
		// Part of IE6 3px jox bug fix
		if (Browser.Engine.trident4){
			this.page.set('margin-left', -3);
		}		
			
		this.sidebarWrapper.setStyle('display', 'block');

		this.sidebarIsMinimized = false;
		this.sidebarMinimize.addEvent('click', function(event){
			this.sidebarMinimizeToggle();
		}.bind(this));
		
		// Add check mark to menu if link exists in menu
		if ($('sidebarLinkCheck')){			
			this.sidebarCheck = new Element('div', {
				'class': 'check',
				'id': 'sidebar_check'
			}).injectInside($('sidebarLinkCheck'));
		}		
	},
	/*
	
	Function: sidebarToggle
		Toggles the display of the sidebar.
	
	Syntax:
		(start code)
		MochaUI.Desktop.sidebarToggle();
		(end)	

	*/		
	sidebarToggle: function(){
		if (this.sidebarWrapper.getStyle('display') == 'block'){
			this.sidebarWrapper.setStyle('display', 'none');
			this.sidebarCheck.setStyle('display', 'none');
			// Part of IE6 3px jox bug fix			
			if (Browser.Engine.trident4){
				this.page.set('margin-left', 0);
			}
		}
		else {
			// If the sidebar is minimized when toggling it's visibility on the sidebar will be restored.
			if (this.sidebarIsMinimized){			
				this.sidebarMinimizeToggle();			
			}			
			this.sidebarWrapper.setStyle('display', 'block');
			this.sidebarCheck.setStyle('display', 'block');
			// Part of IE6 3px jox bug fix
			if (Browser.Engine.trident4){
				this.page.set('margin-left', -3);
			}			
		}
	},
	/*
	
	Function: sidebarMinimizeToggle
		Minimize and restore the sidebar.
	
	Syntax:
		(start code)
		MochaUI.Desktop.sidebarMinimizeToggle();
		(end)	

	*/		
	sidebarMinimizeToggle: function(){
			if (!this.sidebarIsMinimized){				
				this.sidebarResizable.detach();
				this.sidebarHandle.setStyle('cursor', 'default');						
				this.sidebar.setStyle('display', 'none');
				// Part of IE6 3px jox bug fix			
				if (Browser.Engine.trident4){
					this.sidebarMinimize.setStyle('margin-right', 0);
				}
				this.sidebarIsMinimized = true;				
			}
			else {
				this.sidebarResizable.attach();	
				this.sidebarHandle.setStyles({
					'cursor': 'e-resize', /* This is for Opera which does not support the col-resize cursor */
					'cursor': 'col-resize'
				});				
				this.sidebar.setStyle('display', 'block');				
				if (Browser.Engine.trident4){
					this.sidebarMinimize.setStyle('margin-right', 1);
				}				
				this.sidebarIsMinimized = false;
			}				
	}
});
MochaUI.Desktop.implement(new Options, new Events);
