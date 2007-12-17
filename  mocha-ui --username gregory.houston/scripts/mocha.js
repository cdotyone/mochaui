/* -----------------------------------------------------------------

	Script: 
		mocha.js v.0.7
	
	Copyright:
		Copyright (c) 2007 Greg Houston, <http://greghoustondesign.com/>
	
	License:
		MIT-style license

	Contributors:
		Scott F. Frederick
		Joel Lindau
	
   ----------------------------------------------------------------- */

var MochaDesktop = new Class({
	options: {
		draggable: true,
		resizable: true,
		minimizable: true, // this is automatically reset to false if there is no dock
		maximizable: true, // this is automatically reset to false if #mochaDesktop is not present
		closable: true,
		headerHeight: 25,
		footerHeight: 30,
		cornerRadius: 9,
		desktopTopOffset: 20, // use a negative number if neccessary to place first window where you want it
		desktopLeftOffset: 290,
		mochaTopOffset: 70, // initial vertical spacing of each window
		mochaLeftOffset: 70, // initial horizontal spacing of each window
		newWindowPosTop: 0, // In the current setup this just initializes the variable and does not effect the position
		newWindowPosLeft: 0, // In the current setup this just initializes the variable and does not effect the position
		minWidth: 250, // minimum width of windows when resized
		maxWidth: 2500, // maximum width of windows when resized
		minHeight: 100,	// minimum height of windows when resized	
		maxHeight: 2000 // maximum height of windows when resized	
	},
	initialize: function(options){
		this.setOptions(options);
		// Private properties		
		this.indexLevel = 1;
		this.mochaControlsWidth = 0;
		this.minimizebuttonX = 0;
		this.maximizebuttonX = 0;
		this.closebuttonX = 0;
		this.scrollWidthOffset = 6;
		this.windowIDCount = 0;
		new Element('canvas');

		//$$('div.mocha').setStyle('display', 'block');
		if ($('mochaDesktop')) {
			this.setDesktopSize();
		}
		else {
			this.options.maximizable = false;
		}
		if ($('mochaDock')) { 
			if (this.options.minimizable == true){
				$('mochaDock').setStyles({
					'position': 'absolute',
					'top': null,
					'bottom': 0,
					'left': 0
				});
				this.initDock($('mochaDock'));
				this.drawDock($('mochaDock'));
			}
			else {
				$('mochaDock').setStyle('display', 'none');	
			}
		}
		else {
			this.options.minimizable = false;
		}
		$$('div.mocha').each(function(el, i) {
			// Get the window title and dispose that element, so it does not end up in window content
			var titleEl = el.getElement('h3.mochaTitle');
			var properties = {
				title: '[Title not found]',
				id: el.getProperty('id'),
				height: el.getStyle('height'),
				width: el.getStyle('width')
			}
			if ( titleEl ) {
				properties.title = titleEl.innerHTML;
				titleEl.dispose();
			}
			properties.content = el.innerHTML;
			el.dispose();
			this.newWindow(properties);
		}.bind(this));
		
		this.arrangeCascade();

		// Modal initialization
		var mochaModal = new Element('div', {
			'id': 'mochaModalBackground'
		});		

		if ($('mochaDesktop')){
			mochaModal.injectInside($('mochaDesktop'));
		}
		else {
			mochaModal.injectInside(document.body);
		}
		this.setModalSize();

		mochaModal.setStyle('opacity', .4);
		this.modalOpenMorph = new Fx.Morph($('mochaModalBackground'), {
				'duration': 200
				});
		this.modalCloseMorph = new Fx.Morph($('mochaModalBackground'), {
			'duration': 200,
			onComplete: function(){
				$('mochaModalBackground').setStyle('display', 'none');
			}.bind(this)
		});		
		
		 // Fix for dropdown menus in IE
 		if (Browser.Engine.trident && $("mochaDesktopNavbar")){
 			$('mochaDesktopNavbar').getElements('li').each(function(element) {
 				element.addEvent('mouseenter', function(){		
 					this.addClass('ieHover');
 				})
 				element.addEvent('mouseleave', function(){	
 					this.removeClass('ieHover');
 				})
 			})
 		};
		
		window.onresize = function(){
			this.setDesktopSize();
			this.setModalSize();
		}.bind(this)
	},
	/*
	
	Method: newWindow
	
	Arguments: 
		properties

	*/	
	newWindow: function(properties){
		windowProperties = $extend({
			id: null,
			title: 'New Window',
			loadMethod: 'html', 				// html, xhr, or iframe
			content: '', 						// used if loadMethod is set to 'html'
			contentURL: 'pages/lipsum.html',	// used if loadMethod is set to 'xhr' or 'iframe'			
			modal: false,
			width: 300,
			height: 125, 
			scrollbars: true,
			x: null,
			y: null,
			paddingVertical: 10,
			paddingHorizontal: 12,
			bgColor: '#fff',
			onContentLoaded: $empty,			// Event, fired when content is successfully loaded via XHR
			onFocus: $empty,					// Event, fired when the window is focused
			onResize: $empty,					// Event, fired when the window is resized
			onMinimize: $empty,					// Event, fired when the window is minimized
			onMaximize: $empty,					// Event, fired when the window is maximized
			onClose: $empty,					// Event, fired just before the window is closed
			onCloseComplete: $empty			    // Event, fired after the window is closed			
		}, properties || {});

		// Check if window already exists
		if ( $(windowProperties.id) ) {
			if ( $(windowProperties.id).isMinimized )	// If minimized -> restore
				this.restoreWindow($(windowProperties.id));
			else // else focus
				setTimeout(function(){ this.focusWindow($(windowProperties.id)); }.bind(this),10);			
			return;
		}
		
		// Create window div
		var mochaNewWindow = new Element('div', {
			'class': 'mocha',
			'id': windowProperties.id ? windowProperties.id : 'win' + (++this.windowIDCount)
		});
				
		// Set height and width of window
		mochaNewWindow.setStyles({
			'width': windowProperties.width,
			'height': windowProperties.height,
			'display': 'block'
		});

		// Extend our window
		mochaNewWindow = $extend(mochaNewWindow, {
			// Custom properties
			oldTop: 0,
			oldLeft: 0,
			oldWidth: 0,
			oldHeight: 0,
			modal: windowProperties.modal,
			//iframe: windowProperties.loadMethod == 'iframe' ? true : false,
			isMaximized: false,
			isMinimized: false,
			// Custom events
			onFocus: windowProperties.onFocus,
			onResize: windowProperties.onResize,
			onMinimize: windowProperties.onMinimize,
			onMaximize: windowProperties.onMaximize,
			onClose: windowProperties.onClose,
			onCloseComplete: windowProperties.onCloseComplete
		});
		
		//
		// NOTE: Saw a note in revision 31 regarding a Mac FF2 scrollbar issue, position set to absolute here (which it already is now). Check / Joel
		// 

		// Inject window in the page
		if ($('mochaDesktop')){
			mochaNewWindow.injectInside($('mochaDesktop'));
		}
		else {
			mochaNewWindow.injectInside(document.body);
		}

		mochaNewWindow.subElements = this.insertWindowElements(mochaNewWindow);

		// Set title
		mochaNewWindow.subElements.title.setHTML(windowProperties.title);

		// Add content to window		
		switch(windowProperties.loadMethod) {
			case 'xhr':
				new Request({
					url: windowProperties.contentURL,
					onRequest: function(){
					},
					onFailure: function(){
						mochaNewWindow.subElements.content.setHTML('<p><strong>Error Loading XMLHttpRequest</strong></p><p>Make sure all of your content is uploaded to your server, and that you are attempting to load a document from the same domain as this page. XMLHttpRequests will not work on your local machine.</p>');
					},
					onSuccess: function(response) {
						mochaNewWindow.subElements.content.setHTML(response);
						windowProperties.onContentLoaded();
					}
				}).get();
				break;
			case 'iframe':
				if ( windowProperties.contentURL == '')
					break;
				mochaNewWindow.subElements.iframe = new Element('iframe', {
					'id': mochaNewWindow.id + 'Iframe',						  
					'class': 'mochaIframe',
					'src': windowProperties.contentURL,
					'marginwidth': 0,
					'marginheight': 0,
					'frameBorder': 0,
					'scrolling': 'auto'
				}).injectInside(mochaNewWindow.subElements.content);
				//mochaIframe.setStyle('height', windowElements.content.getStyle('height'));
				// Should be possible have onContentLoaded for iframe also
				break;
			case 'html':
			default:
				mochaNewWindow.subElements.content.setHTML(windowProperties.content);
				windowProperties.onContentLoaded();
				break;
		}
	

		// Set scrollbars, always use 'hidden' for iframe windows
		mochaNewWindow.subElements.scroller.setStyles({
			'overflow': windowProperties.scrollbars && !mochaNewWindow.subElements.iframe ? 'auto' : 'hidden',
			'background': windowProperties.bgColor
		});

		// Set content padding
		mochaNewWindow.subElements.content.setStyles({
			'padding-top': windowProperties.paddingVertical,
			'padding-bottom': windowProperties.paddingVertical,
			'padding-left': windowProperties.paddingHorizontal,
			'padding-right': windowProperties.paddingHorizontal
		});

		// Add canvas gui to new window
		this.drawWindow(mochaNewWindow);
		
		// Attach events to the window
		if (!mochaNewWindow.modal) {
			this.attachDraggable(mochaNewWindow);
			this.attachResizable(mochaNewWindow);
		}
		this.setupEvents(mochaNewWindow);
		//this.attachClose([mochaNewWindow]);

		// Move new window into position
		if (windowProperties.x && windowProperties.y) {
			this.options.newWindowPosTop = windowProperties.y;
			this.options.newWindowPosLeft = windowProperties.x;
		}
		else {
			this.options.newWindowPosTop = (this.getWindowHeight() * .5) - (mochaNewWindow.offsetHeight * .5);
			this.options.newWindowPosLeft = (this.getWindowWidth() * .5) - (mochaNewWindow.offsetWidth * .5);
		}
		
		if (mochaNewWindow.modal) {
			$('mochaModalBackground').setStyle('display', 'block');
			this.modalOpenMorph.start({
				'opacity': .55
			});
			mochaNewWindow.setStyles({
				'top': this.options.newWindowPosTop,
				'left': this.options.newWindowPosLeft
			});
		} 
		else {
			var mochaMorph = new Fx.Morph(mochaNewWindow, {
				'duration': 300
			});
			mochaMorph.start({
				'top': this.options.newWindowPosTop,
				'left': this.options.newWindowPosLeft
			});
		}

		// Set the zIndex for the new window
		if (windowProperties.modal) {
			mochaNewWindow.setStyles({
				'zIndex': 11000
			});
		}
		else {
			setTimeout(function(){ this.focusWindow(mochaNewWindow); }.bind(this), 10);
		}
		// Return window element ?
		// return mochaWindow;
	},
	/*
	
	Method: closeWindow
	
	Arguments: 
		el: the $(window) to be closed

	Returns:
		true: the window was closed
		false: the window was not closed

	*/
	closeWindow: function(windowEl) {
		// Does window exist and is not already in process of closing ?
		if ( !(windowEl = $(windowEl)) || windowEl.isClosing )
			return;
		
		windowEl.isClosing = true;
		windowEl.onClose();
		
		// redraws IE windows without shadows since IE messes up canvas alpha when you change element opacity
		if (Browser.Engine.trident) this.drawWindow(windowEl, false); 
		
		if (windowEl.modal) {
			this.modalCloseMorph.start({
				opacity: 0
			});
		}
		
		var closeMorph = new Fx.Morph(windowEl, {
			duration: 250,
			onComplete: function(){
				windowEl.dispose();
				windowEl.onCloseComplete();
			}.bind(this)
		});

		closeMorph.start({
			opacity: .4
		});

		return true;
	},
	focusWindow: function(windowEl){
		if ( !(windowEl = $(windowEl)) )
			return;
		this.indexLevel++;
		windowEl.setStyle('zIndex', this.indexLevel);
		windowEl.onFocus();
	},
	maximizeWindow: function(windowEl) {
		// Window exists and is not already maximized ?
		if ( !(windowEl = $(windowEl)) || windowEl.isMaximized )
			return;
		windowEl.onMaximize();
		windowEl.oldTop = windowEl.getStyle('top');
		windowEl.oldLeft = windowEl.getStyle('left');
		windowEl.subElements.contentWrapper.oldWidth = windowEl.subElements.contentWrapper.getStyle('width');
		windowEl.subElements.contentWrapper.oldHeight = windowEl.subElements.contentWrapper.getStyle('height');

		var mochaMorph = new Fx.Morph(windowEl, { 
			'duration': 200,
			'onComplete': function(windowEl){
				windowEl.subElements.contentWrapper.setStyles({
					'height': (this.getWindowHeight() - this.options.headerHeight - this.options.footerHeight + 6),
					'width': this.getWindowWidth()
				});
				this.drawWindow(windowEl);
			}.bind(this)
		});
		mochaMorph.start({
			'top': -3, // takes shadow width into account
			'left': -3 // takes shadow width into account
		});
		windowEl.isMaximized = true;
	},
	restoreWindow: function(windowEl) {
		// Window exists and is maximized ?
		if ( !(windowEl = $(windowEl)) || !windowEl.isMaximized )
			return;
		windowEl.subElements.contentWrapper.setStyles({
			'width': windowEl.subElements.contentWrapper.oldWidth,
			'height': windowEl.subElements.contentWrapper.oldHeight
		});

		windowEl.isMaximized = false;
		this.drawWindow(windowEl);
		var mochaMorph = new Fx.Morph(windowEl, { 
			'duration': 150
		});
		mochaMorph.start({
			'top': windowEl.oldTop,
			'left': windowEl.oldLeft
		});
	},
	minimizeWindow: function(windowEl) {
		if ( !(windowEl = $(windowEl)) )
			return;
		var mochaContent = windowEl.getElement('.mochaContent');
		var titleText = windowEl.subElements.title.innerHTML;
		windowEl.onMinimize();

		// Hide window and add to dock
		windowEl.setStyle('display', 'none');
		windowEl.isMinimized = true;
		var dockButton = new Element('button', {
			'class': 'mochaDockButton',
			'title': windowEl.subElements.title.innerHTML
		}).setHTML(titleText.substring(0,13) + (titleText.length > 13 ? '...' : '')).injectInside($('mochaDock'));
		dockButton.addEvent('click', function(event) {
			windowEl.setStyle('display', 'block');
			windowEl.isMinimized = false;
			this.focusWindow(windowEl);
			event.target.dispose();
		}.bind(this));		
	},
	/* -- START Private Methods -- */
	
	/*
		Method: setupControlEvents()
		Usage: internal

		Arguments:
			windowEl
	*/
	setupEvents: function(windowEl) {
		if ( !(windowEl = $(windowEl)) )
			return;
            
		// Set events
		// Note: if a button does not exist, its due to properties passed to newWindow() stating otherwice
		if ( windowEl.subElements.closeButton )
			windowEl.subElements.closeButton.addEvent('click', function() { this.closeWindow(windowEl); }.bind(this));
		
		if ( !windowEl.modal )		
			windowEl.addEvent('click', function() { this.focusWindow(windowEl); }.bind(this));
		
		if ( windowEl.subElements.minimizeButton )
			windowEl.subElements.minimizeButton.addEvent('click', function() { this.minimizeWindow(windowEl); }.bind(this));
		
		if ( windowEl.subElements.maximizeButton ) {
			windowEl.subElements.maximizeButton.addEvent('click', function() { 
				if ( windowEl.isMaximized ) {
					this.restoreWindow(windowEl);
					windowEl.subElements.maximizeButton.setProperty('title', 'Maximize');
				} else {
					this.maximizeWindow(windowEl); 
					windowEl.subElements.maximizeButton.setProperty('title', 'Restore');
				}
			}.bind(this));
		}
	},
	/*
		Method: attachDraggable()
		Description: make window draggable
		Usage: internal
		
		Arguments:
			windowEl
	*/
	attachDraggable: function(windowEl){
		if ( !this.options.draggable || windowEl.modal )
			return;
		
		new Drag.Move(windowEl, {
			handle: windowEl.subElements.titleBar,
			onStart: function() {
				this.focusWindow(windowEl);
				if ( windowEl.subElements.iframe )
					windowEl.subElements.iframe.setStyle('visibility', 'hidden');
			}.bind(this),
			onComplete: function() {
				if ( windowEl.subElements.iframe )
					windowEl.subElements.iframe.setStyle('visibility', 'visible');
			}
		});
	},
	/*
		Method: attachResizable()
		Description: make window resizable
		Usage: internal
		
		Arguments:
			windowEl
	*/
	attachResizable: function(windowEl){
		if ( !this.options.resizable || windowEl.modal )
			return;
		windowEl.subElements.contentWrapper.makeResizable({
			handle: windowEl.subElements.resizeHandle,
			modifiers: {
				x: 'width',
				y: 'height'
			},
			limit: {
				x: [this.options.minWidth, this.options.maxWidth],
				y: [this.options.minHeight, this.options.maxHeight]
			},
			onStart: function() {
				if ( windowEl.subElements.iframe )
					windowEl.subElements.iframe.setStyle('visibility', 'hidden');
			},
			onDrag: function() {
				this.drawWindow(windowEl);
			}.bind(this),
			onComplete: function() {
				if ( windowEl.subElements.iframe )
					windowEl.subElements.iframe.setStyle('visibility', 'visible');
				windowEl.onResize();
			}
		});
	},
	getWindowWidth: function(){
		var windowDimensions = document.getCoordinates();
		return windowDimensions.width;
	},
	getWindowHeight: function(){
		var windowDimensions = document.getCoordinates();
		return windowDimensions.height;
	},	
	setDesktopSize: function(){
		if ($('mochaDesktop')) {
			$('mochaDesktop').setStyle('width', this.getWindowWidth() - 20); // To adjust for broswer scrollbar
			setTimeout( function(){
				$('mochaDesktop').setStyle('width', this.getWindowWidth());
			}.bind(this), 100);
			$('mochaDesktop').setStyle('height', this.getWindowHeight());
			if ($('mochaPageWrapper')){
				$('mochaPageWrapper').setStyle('height', this.getWindowHeight());
			}
		}
	},
	setModalSize: function(){
		$('mochaModalBackground').setStyle('height', this.getWindowHeight());
	},
	/*
		Method: insertWindowElements
		Arguments:
			windowEl
		Returns:
			object containing all elements created within [windowEl]
	*/
	insertWindowElements: function(windowEl){
		var windowElements = {
			overlay: null,
			titleBar: null,
			canvas: null,
		    title: null,        
            content: null,
            scroller: null,
            closeButton: null,
            minimizeButton: null,
            maximizeButton: null,
			resizeHandle: null
		};

		if (Browser.Engine.trident4){
			//windowEl.innerHTML = '<iframe class="zIndexFix" scrolling="no" marginwidth="0" src="" marginheight="0"></iframe>';
			windowElements.zIndexFix = new Element('iframe', {
				'class': 'zIndexFix',
				'scrolling': 'no',
				'marginWidth': 0,
				'marginHeight': 0,
				'src': ''
			});
		}
			
		windowElements.overlay = new Element('div', {
			'class': 'mochaOverlay'
		}).injectInside(windowEl);
		
		if (Browser.Engine.trident4){
			windowElements.overlay.setStyle('zIndex', 2)
		}
		// For Mac Firefox 2 to help reduce scrollbar bugs in that browser
		if (Browser.Platform.mac && Browser.Engine.gecko){
			windowElements.overlay.setStyle('overflow', 'auto');				
		}
		//Insert mochaTitlebar
		windowElements.titleBar = new Element('div', {
			'class': 'mochaTitlebar'
		}).injectTop(windowElements.overlay);

		// Create window header
		windowElements.title = new Element('h3', {
			'class': 'mochaTitle'
		}).injectInside(windowElements.titleBar);
		
		if (this.options.draggable && !windowEl.modal){
			windowElements.titleBar.setStyle('cursor', 'move');
		}

		windowElements.contentWrapper = new Element('div', {
			'class': 'mochaContent'
		}).injectInside(windowElements.overlay);

		windowElements.contentWrapper.setStyles({
			width: windowEl.getStyle('width'),
			height: windowEl.getStyle('height')
		});

		windowElements.scroller = new Element('div', {
			'class': 'mochaScroller'
		}).injectTop(windowElements.contentWrapper);

		windowElements.content = new Element('div', {
			'class': 'mochaScrollerpad'
		}).injectInside(windowElements.scroller);
		
			
		//Insert canvas
		windowElements.canvas = new Element('canvas', {
			'class': 'mochaCanvas',
			'width': 1,
			'height': 1
		}).injectInside(windowEl);
	
		//Insert resize handles
		if (this.options.resizable && !windowEl.modal){
			windowElements.resizeHandle = new Element('div', {
				'class': 'resizeHandle'
			}).injectAfter(windowElements.overlay);
			
			if ( Browser.Engine.trident )
				windowElements.resizeHandle.setStyle('zIndex', 2);
		}

		//Insert mochaTitlebar controls
		windowElements.controls = new Element('div', {
			'class': 'mochaControls'
		}).injectAfter(windowElements.overlay);
		
		if (Browser.Engine.trident){
			windowElements.controls.setStyle('zIndex', 2)
		}

		//Insert close button
		if (this.options.closable || windowEl.modal){
			windowElements.closeButton = new Element('div', {
				'class': 'mochaClose',
				'title': 'Close Window'
			}).injectInside(windowElements.controls);
		}				

		//Insert maximize button
		if (this.options.maximizable && !windowEl.modal){
			windowElements.maximizeButton = new Element('div', {
				'class': 'maximizeToggle',
				'title': 'Maximize'
			}).injectInside(windowElements.controls);
		}

		//Insert minimize button
		if (this.options.minimizable){
			windowElements.minimizeButton = new Element('div', {
				'class': 'minimizeToggle',
				'title': 'Minimize'
			}).injectInside(windowElements.controls);
		}
		// Dynamically initialize canvas using excanvas. This is only required by IE
		if ( Browser.Engine.trident ) {
			G_vmlCanvasManager.initElement(windowElements.canvas);
			// This is really odd, .getContext() method does not exist before retrieving the
			// element via getElement
			windowElements.canvas = windowEl.getElement('.mochaCanvas');
		}

		return windowElements;
	},
	/*
	
	Method: drawWindow
	
	Arguments: 
		el: the $(window)
		shadows: (boolean) false will draw a window without shadows
		
	Notes: This is where we create the canvas GUI	

	*/	
	drawWindow: function(windowEl, shadows) {
		var ctx = windowEl.subElements.canvas.getContext('2d');

		//This should probably be in the insertWindowElements method rather than here
		this.setMochaControlsWidth(windowEl);

		// Doesn't appear to be needed ?
		/*if ( windowEl.isMaximized ) {
			windowEl.subElements.content.setStyles({
				'height': (this.getWindowHeight() - this.options.headerHeight - this.options.footerHeight + 6),
				'width': this.getWindowWidth()
			});
		}*/
		windowEl.subElements.scroller.setStyles({
			'height': windowEl.subElements.contentWrapper.getStyle('height'),
			'width': windowEl.subElements.contentWrapper.getStyle('width')
		});
		
		//Resize iframe when window is resized
		if ( windowEl.subElements.iframe ) {
			windowEl.subElements.iframe.setStyles({
				'height': windowEl.subElements.contentWrapper.getStyle('height'),
				'width': windowEl.subElements.contentWrapper.getStyle('width')
			});
		}
	
		mochaHeight = windowEl.subElements.contentWrapper.scrollHeight;
		mochaWidth = windowEl.subElements.contentWrapper.scrollWidth + this.scrollWidthOffset;
		mochaHeight += this.options.headerHeight + this.options.footerHeight;
		
		
		windowEl.subElements.overlay.setStyle('height', mochaHeight);
		windowEl.setStyle('height', mochaHeight);
		
		// Set canvas width, webkit fix: 4000x2000 (not sure why / Joel)
		windowEl.subElements.canvas.setProperties({
			'width': (Browser.Engine.webkit ? 4000 : mochaWidth),
			'height': (Browser.Engine.webkit ? 2000 : mochaHeight)
		});

		// Part of the fix for IE6 select z-index bug and FF on Mac scrollbar z-index bug
		if ( Browser.Engine.trident4 ){
			windowEl.subElements.zIndexFix.setStyles({
				'width': mochaWidth,
				'height': mochaHeight
			})
		}

		// Set width		
		windowEl.setStyle('width', mochaWidth);
		windowEl.subElements.overlay.setStyle('width', mochaWidth); 
		windowEl.subElements.titleBar.setStyle('width', mochaWidth - 6);
	
		// Draw shapes
		ctx.clearRect(0, 0, this.getWindowWidth(), this.getWindowHeight());
		if (shadows == null || shadows == false && !Browser.Engine.trident){
			this.roundedRect(ctx, 0, 0, mochaWidth, mochaHeight, this.options.cornerRadius, 0, 0, 0, 0.06); //shadow
			this.roundedRect(ctx, 1, 1, mochaWidth - 2, mochaHeight - 2, this.options.cornerRadius, 0, 0, 0, 0.08); //shadow
			this.roundedRect(ctx, 2, 2, mochaWidth - 4, mochaHeight - 4, this.options.cornerRadius, 0, 0, 0, 0.3); //shadow
		}		
		this.roundedRect(ctx,3,2,mochaWidth-6,mochaHeight-6,this.options.cornerRadius,246,246,246,1.0);	//mocha body
		this.topRoundedRect(ctx,3,2,mochaWidth-this.scrollWidthOffset,this.options.headerHeight,this.options.cornerRadius); //mocha header

		if (this.options.closable && this.options.maximizable){
			this.minimizebuttonX = mochaWidth - 53;
		} else if (this.options.closable || this.options.maximizable){
			this.minimizebuttonX = mochaWidth - 34;
		} else {
			this.minimizebuttonX = mochaWidth - 15;
		}

		if (this.options.closable){
			this.maximizebuttonX = mochaWidth - 34;
		}
		else {
			this.maximizebuttonX = mochaWidth - 15;
		}

		this.closebuttonX = mochaWidth - 15;

		if (this.options.closable || windowEl.modal)
			this.closebutton(ctx, this.closebuttonX, 15, 229, 217, 217, 1.0);
		if (this.options.maximizable && !windowEl.modal)
			this.maximizebutton(ctx, this.maximizebuttonX, 15, 217, 229, 217, 1.0);
		if ( this.options.minimizable && !windowEl.modal )
			this.minimizebutton(ctx, this.minimizebuttonX, 15, 231, 231, 209, 1.0); //Minimize
		if ( this.options.resizable && !windowEl.modal ) 
			this.triangle(ctx, mochaWidth - 20, mochaHeight - 20, 12, 12, 209, 209, 209, 1.0); //resize handle
	
		this.triangle(ctx, mochaWidth - 20, mochaHeight - 20, 10, 10, 0, 0, 0, 0); //invisible dummy object. The last element drawn is not rendered consistently while resizing in IE6 and IE7.

	},
	//mocha body
	roundedRect: function(ctx,x,y,width,height,radius,r,g,b,a){
		ctx.fillStyle = 'rgba(' + r +',' + g + ',' + b + ',' + a + ')';
		ctx.beginPath();
		ctx.moveTo(x,y+radius);
		ctx.lineTo(x,y+height-radius);
		ctx.quadraticCurveTo(x,y+height,x+radius,y+height);
		ctx.lineTo(x+width-radius,y+height);
		ctx.quadraticCurveTo(x+width,y+height,x+width,y+height-radius);
		ctx.lineTo(x+width,y+radius);
		ctx.quadraticCurveTo(x+width,y,x+width-radius,y);
		ctx.lineTo(x+radius,y);
		ctx.quadraticCurveTo(x,y,x,y+radius);
		ctx.fill(); 
	},
	//mocha header with gradient background
	topRoundedRect: function(ctx,x,y,width,height,radius){

		// Create gradient
		if (Browser.Engine.presto != null ){
			var lingrad = ctx.createLinearGradient(0,0,0,this.options.headerHeight+2);
		}
		else {
			var lingrad = ctx.createLinearGradient(0,0,0,this.options.headerHeight);
		}
		lingrad.addColorStop(0, 'rgba(250,250,250,100)');
		lingrad.addColorStop(1, 'rgba(228,228,228,100)');
		ctx.fillStyle = lingrad;

		// draw header
		ctx.beginPath();
		ctx.moveTo(x,y);
		ctx.lineTo(x,y+height);
		ctx.lineTo(x+width,y+height);
		ctx.lineTo(x+width,y+radius);
		ctx.quadraticCurveTo(x+width,y,x+width-radius,y);
		ctx.lineTo(x+radius,y);
		ctx.quadraticCurveTo(x,y,x,y+radius);
		ctx.fill(); 
	},
	// resize handle
	triangle: function(ctx,x,y,width,height,r,g,b,a){
		ctx.beginPath();
		ctx.moveTo(x+width,y);
		ctx.lineTo(x,y+height);
		ctx.lineTo(x+width,y+height);
		ctx.closePath();
		ctx.fillStyle = 'rgba(' + r +',' + g + ',' + b + ',' + a + ')';
		ctx.fill();
	},
	drawCircle: function(ctx,x,y,diameter,r,g,b,a){
		//circle
		ctx.beginPath();
		ctx.moveTo(x,y);
		ctx.arc(x,y,diameter,0,Math.PI*2,true);
		ctx.fillStyle = 'rgba(' + r +',' + g + ',' + b + ',' + a + ')';
		ctx.fill();
	},
	maximizebutton: function(ctx,x,y,r,g,b,a){ // this could reuse the drawCircle method above
		//circle
		ctx.beginPath();
		ctx.moveTo(x,y);
		ctx.arc(x,y,7,0,Math.PI*2,true);
		ctx.fillStyle = 'rgba(' + r +',' + g + ',' + b + ',' + a + ')';
		ctx.fill();
		//X sign
		ctx.beginPath();
		ctx.moveTo(x,y-4);
		ctx.lineTo(x,y+4);
		ctx.stroke();
		ctx.beginPath();
		ctx.moveTo(x-4,y);
		ctx.lineTo(x+4,y);
		ctx.stroke();
	},
	closebutton: function(ctx,x,y,r,g,b,a){ // this could reuse the drawCircle method above
		//circle
		ctx.beginPath();
		ctx.moveTo(x,y);
		ctx.arc(x,y,7,0,Math.PI*2,true);
		ctx.fillStyle = 'rgba(' + r +',' + g + ',' + b + ',' + a + ')';
		ctx.fill();
		//plus sign
		ctx.beginPath();
		ctx.moveTo(x-3,y-3);
		ctx.lineTo(x+3,y+3);
		ctx.stroke();
		ctx.beginPath();
		ctx.moveTo(x+3,y-3);
		ctx.lineTo(x-3,y+3);
		ctx.stroke();
	},
	minimizebutton: function(ctx,x,y,r,g,b,a){ // this could reuse the drawCircle method above
		//circle
		ctx.beginPath();
		ctx.moveTo(x,y);
		ctx.arc(x,y,7,0,Math.PI*2,true);
		ctx.fillStyle = 'rgba(' + r +',' + g + ',' + b + ',' + a + ')';
		ctx.fill();
		//minus sign
		ctx.beginPath();
		ctx.moveTo(x-4,y);
		ctx.lineTo(x+4,y);
		ctx.stroke();
	},
	setMochaControlsWidth: function(el){
		this.mochaControlsWidth = 0;
		if (this.options.minimizable && !el.modal){
			this.mochaControlsWidth += 19;
			if (this.options.maximizable){
				el.getElement('.maximizeToggle').setStyle('margin-left', 5);
			}
		}
		if (this.options.maximizable && !el.modal){
			this.mochaControlsWidth += 19;

		}		
		if (this.options.closable || el.modal){
			this.mochaControlsWidth += 19;
			if (this.options.maximizable || this.options.minimizable){
				el.getElement('.mochaClose').setStyle('margin-left', 5);
			}
		}
		el.getElement('.mochaControls').setStyle('width', this.mochaControlsWidth - 5);
	},
	initDock: function (el){
		document.addEvent('mousemove', function (objDoc){
			if(objDoc.event.clientY > (document.body.clientHeight -10) && $('mochaDock').getProperty('autoHide')) { 
				$('mochaDock').setStyle('display','block');
			}
		});		

		//Insert canvas
		var canvas = new Element('canvas', {
			'class': 'mochaCanvas',
			'id': 'canv1'
		}).injectInside(el);
		
		canvas.setStyles({
			position: 'absolute',
			top: '4px',
			left: '2px',
			zIndex: 2
		});

		canvas.width=15;
		canvas.height=18;

		// Dynamically initialize canvas using excanvas. This is only required by IE
		if (Browser.Engine.trident) {
			G_vmlCanvasManager.initElement(canvas);
		}
		
		//Position top or bottom selector
		$('mochaDockPlacement').setProperty('title','Position Dock Top');
			
		//Auto Hide on/off 
		$('mochaDockAutoHide').setProperty('title','Turn Auto Hide On');
		
		//attach event
		$('mochaDockPlacement').addEvent('click', function(event){
			var objDock=event.target.parentNode;
			var ctx = el.getElement('.mochaCanvas').getContext('2d');
			
			//switch to top position
			if (objDock.getStyle('position') != 'absolute'){
				objDock.setStyles({
					'position': 'absolute',
					'bottom': 0,
					'border-top': '1px solid #bbb',
					'border-bottom': '1px solid #fff'
				})
				$('mochaDesktopHeader').setStyle('height', 54);
				objDock.setProperty('dockPosition','Bottom');
				this.drawCircle(ctx, 5, 4, 3, 241, 102, 116, 1.0); 

				if ($('mochaDock').getProperty('autoHide') != 'true' || $('mochaDock').getProperty('autoHideDisabled') != 'true') {
					this.drawCircle(ctx, 5 , 14, 3, 241, 102, 116, 1.0); 
				}
				} else {
					objDock.setStyles({
						'position': 'relative',
						'bottom': null,
						'border-top': '1px solid #fff',
						'border-bottom': '1px solid #bbb'
					})
					$('mochaDesktopHeader').setStyle('height', 74);
					objDock.setProperty('dockPosition','Top');	
					this.drawCircle(ctx, 5, 4, 3, 0, 255, 0, 1.0);
					this.drawCircle(ctx, 5, 14, 3, 212, 208, 200, 1.0);
				}

			//diasble/enable autohide and grey/orange/green out button
			if($('mochaDock').getProperty('autoHide') == 'true' || $('mochaDock').getProperty('autoHideDisabled') == 'true')
			{
				if (objDock.getProperty('dockPosition') == 'Bottom') {
					$('mochaDock').setProperty('autoHideDisabled', 'false');
					$('mochaDock').setProperty('autoHide', 'true')
					this.drawCircle(ctx, 5, 14, 3, 0, 255, 0, 1.0);
				}
				else{
					$('mochaDock').setProperty('autoHideDisabled', 'true');
					$('mochaDock').setProperty('autoHide', 'false')
				}

			}

			//update title tag
			$('mochaDockPlacement').setProperty('title',(objDock.getStyle('position') == 'relative')?'Position Dock Bottom':'Position Dock Top');
		}.bind(this));

		//attach event Auto Hide 
		$('mochaDockAutoHide').addEvent('click', function(event){
			var objDock=event.target.parentNode;
			var ctx = el.getElement('.mochaCanvas').getContext('2d');

			//disable auto hide when Dock bar on top
			if(objDock.getProperty('dockPosition')=='Top'){return false;}
		
			//update title tag
			if(objDock.getProperty('autoHide') == 'true'){
				$('mochaDockAutoHide').setProperty('title', 'Turn Auto Hide On');
				this.drawCircle(ctx, 5 , 14, 3, 241, 102, 116, 1.0);
				objDock.setProperty('autoHide','false');
				objDock.setStyle('display','block');
			}
			else{
				$('mochaDockAutoHide').setProperty('title','Turn Auto Hide Off');
				this.drawCircle(ctx, 5 , 14, 3, 0, 255, 0, 1.0); 
				objDock.setProperty('autoHide','true');
				objDock.setStyle('display','none');
			}
		}.bind(this));		

		$('mochaDock').addEvent('mouseleave', function(objDock)
		{	if(this.getProperty('autoHide') == 'true'){ //mozilla doesn't understand true evaluations, so made the property a string???
				if((objDock.event.clientY < (document.body.clientHeight - this.getStyle('height').toInt()))){
					this.setStyle('display', 'none');
				}
			}
		});
		
	},
	drawDock: function (el){
		var ctx = el.getElement('.mochaCanvas').getContext('2d');
		this.drawCircle(ctx, 5 , 4, 3, 241, 102, 116, 1.0); 
		this.drawCircle(ctx, 5 , 14, 3, 241, 102, 116, 1.0);
	},	
	/*
	
	Method: arrangeCascade
	
	*/	
	arrangeCascade: function(){
		var x = this.options.desktopLeftOffset
		var y = this.options.desktopTopOffset;
		$$('div.mocha').each(function(el){
			if (el.getStyle('display') != 'none'){
				this.focusWindow(el);
				x += this.options.mochaLeftOffset;
				y += this.options.mochaTopOffset;
				var mochaMorph = new Fx.Morph(el, {
					'duration': 550
				});
				mochaMorph.start({
					'top': y,
					'left': x
				});
			}
		}.bind(this));
	}
});
MochaDesktop.implement(new Options);

/* -----------------------------------------------------------------

	MOCHA SCREENS
	Notes: This class can be removed if you are not creating multiple screens/workspaces.

   ----------------------------------------------------------------- */

var MochaScreens = new Class({
	options: {
		defaultScreen: 0 // Default screen	
	},
	initialize: function(options){
		this.setOptions(options);
		this.setScreen(this.options.defaultScreen);
	},
	setScreen: function(index) {
		if ( !$('mochaScreens') )
			return;
		$$('#mochaScreens div.screen').each(function(el,i) {
			el.setStyle('display', i == index ? 'block' : 'none');
		});
	}
});
MochaScreens.implement(new Options);

/* -----------------------------------------------------------------

	MOCHA WINDOW FROM FORM
	Notes: This class can be removed if you are not creating new windows dynamically from a form.

   ----------------------------------------------------------------- */

var MochaWindowForm = new Class({
	options: {
		id: null,
		title: 'New Window',
		loadMethod: 'html', // html, xhr, or iframe
		content: '', // used if loadMethod is set to 'html'
		contentURL: 'pages/lipsum.html', // used if loadMethod is set to 'xhr' or 'iframe'
		modal: false,
		width: 300,
		height: 125,
		scrollbars: true, // true sets the overflow to auto and false sets it to hidden
		x: null, // if x or y is null or modal is false the new window is centered in the browser window
		y: null,
		paddingVertical: 10,
		paddingHorizontal: 12
	},
	initialize: function(options){
		this.setOptions(options);
		this.options.title = $('mochaNewWindowHeaderTitle').value;
		if ($('htmlLoadMethod').checked){
			this.options.loadMethod = 'html';
		}
		if ($('xhrLoadMethod').checked){
			this.options.loadMethod = 'xhr';
		}
		if ($('iframeLoadMethod').checked){
			this.options.loadMethod = 'iframe';
		}
		this.options.content = $('mochaNewWindowContent').value;
		if ($('mochaNewWindowContentURL').value){
			this.options.contentURL = $('mochaNewWindowContentURL').value;
		}		
		if ($('mochaNewWindowModal').checked) {
			this.options.modal = true;
		}
		this.options.width = $('mochaNewWindowWidth').value.toInt();
		this.options.height = $('mochaNewWindowHeight').value.toInt();	
		this.options.x = $('mochaNewWindowX').value.toInt();
		this.options.y = $('mochaNewWindowY').value.toInt();
		this.options.paddingVertical = $('mochaNewWindowPaddingVertical').value.toInt();
		this.options.paddingHorizontal = $('mochaNewWindowPaddingHorizontal').value.toInt();
		document.mochaDesktop.newWindow(this.options);		
	}
});
MochaWindowForm.implement(new Options);

/* -----------------------------------------------------------------

	ATTACH MOCHA LINK EVENTS
	Notes: Here is where you define your windows and the events that open them.
	If you are not using links to run Mocha methods you can remove this function.
	
	If you need to add link events to links within windows you are creating, do
	it in the onContentLoaded function of the new window.

   ----------------------------------------------------------------- */

function attachMochaLinkEvents(){
	
	if ($('ajaxpageLink')){ // Associated HTML: <a id="xhrpageLink" href="pages/lipsum.html">xhr Page</a>
		$('ajaxpageLink').addEvent('click', function(e){	
			new Event(e).stop();
			document.mochaDesktop.newWindow({
				id: 'ajaxpage',
				title: 'Content Loaded with an XMLHttpRequest',
				loadMethod: 'xhr',
				contentURL: 'pages/lipsum.html',
				width: 340,
				height: 150
			});
		});
	}
	
	if ($('mootoolsLink')){
		$('mootoolsLink').addEvent('click', function(e){	
			new Event(e).stop();
			document.mochaDesktop.newWindow({
				id: 'mootools',
				title: 'Mootools Forums in an Iframe',
				loadMethod: 'iframe',
				contentURL: 'http://forum.mootools.net/',
				width: 650,
				height: 400,
				scrollbars: false,
				paddingVertical: 0,
				paddingHorizontal: 0
			});
		});
	}

	if ($('spirographLink')){
		$('spirographLink').addEvent('click', function(e){	
			new Event(e).stop();
			document.mochaDesktop.newWindow({
				id: 'spirograph',
				title: 'Canvas Spirograph in an Iframe',
				loadMethod: 'iframe',
				contentURL: 'pages/spirograph.html',
				width: 340,
				height: 340,
				scrollbars: false,
				paddingVertical: 0,
				paddingHorizontal: 0,
				bgColor: '#c30'
			});
		});
	}
	
	if ($('cornerRadiusLink')){
		$('cornerRadiusLink').addEvent('click', function(e){	
			new Event(e).stop();
			document.mochaDesktop.newWindow({
				id: 'cornerRadius',
				title: 'Corner Radius Slider',
				loadMethod: 'xhr',
				contentURL: 'pages/corner_radius.html',
				onContentLoaded: function(){
					addSlider();
				},
				width: 300,
				height: 105,
				x: 20,
				y: 60
			});
		});
	}	

	if ($('eventsLink')){
		$('eventsLink').addEvent('click', function(e){
			new Event(e).stop();
			document.mochaDesktop.newWindow({
				id: 'events',
				title: 'Window Trigger Options',
				loadMethod: 'xhr',
				contentURL: 'pages/events.html',
				onContentLoaded: function(){
					alert('The window\'s content was loaded.');
				},			
				onClose: function(){
					alert('The window is closing.');
				},
				onMinimize: function(){
					alert('The window was minimized.');
				},
				onMaximize: function(){
					alert('The window was maximized.');
				},
				onFocus: function(){
					alert('The window was focused.');
				},
				onResize: function(){
					alert('The window was resized.');
				},
				width: 340,
				height: 250
			});
		});
	}	
	
	if ($('builderLink')){
		$('builderLink').addEvent('click', function(e){	
			new Event(e).stop();
			document.mochaDesktop.newWindow({
				id: 'windowbuilder',
				title: 'Window Builder',
				loadMethod: 'xhr',
				contentURL: 'pages/builder.html',
				onContentLoaded: function(){
					$('mochaNewWindowSubmit').addEvent('click', function(e){
						new Event(e).stop();
						new MochaWindowForm();
					});
				},
				width: 370,
				height: 400,
				x: 20,
				y: 60
			});
		});
	}
	
	if ($('faqLink')){
		$('faqLink').addEvent('click', function(e){	
			new Event(e).stop();
			document.mochaDesktop.newWindow({
				id: 'faq',
				title: 'FAQ',
				loadMethod: 'xhr',
				contentURL: 'pages/faq.html',
				width: 320,
				height: 320,
				x: 20,
				y: 60
			});
		});
	}
	
	if ($('docsLink')){
		$('docsLink').addEvent('click', function(e){	
			new Event(e).stop();
			document.mochaDesktop.newWindow({
				id: 'docs',
				title: 'Documentation',
				loadMethod: 'xhr',
				contentURL: 'pages/docs.html',
				width: 600,
				height: 350,
				x: 20,
				y: 60
			});
		});
	}
	
	if ($('overviewLink')){
		$('overviewLink').addEvent('click', function(e){	
			new Event(e).stop();
			document.mochaDesktop.newWindow({
				id: 'overview',
				title: 'Overview',
				loadMethod: 'xhr',
				contentURL: 'pages/overview.html',
				width: 300,
				height: 255,
				x: 20,
				y: 60
			});
		});
	}

	if ($('resourcesLink')){
		$('resourcesLink').addEvent('click', function(e){	
			new Event(e).stop();
			document.mochaDesktop.newWindow({
				id: 'resources',
				title: 'Resources',
				loadMethod: 'xhr',
				contentURL: 'pages/resources.html',
				width: 300,
				height: 275,
				x: 20,
				y: 60
			});
		});
	}
	
	if ($('workspace01Link')){
		$('workspace01Link').addEvent('click', function(e){	
			new Event(e).stop();
			document.mochaScreens.setScreen(0)
		});
	}
	
	if ($('workspace02Link')){
		$('workspace02Link').addEvent('click', function(e){	
			new Event(e).stop();
			document.mochaScreens.setScreen(1)
		});
	}
	
	if ($('workspace03Link')){
		$('workspace03Link').addEvent('click', function(e){	
			new Event(e).stop();
			document.mochaScreens.setScreen(2)
		});
	}	
	
	if ($('helpLink')){
		$('helpLink').addEvent('click', function(e){	
			new Event(e).stop();
			document.mochaDesktop.newWindow({
				id: 'help',
				title: 'Support',
				loadMethod: 'xhr',
				contentURL: 'pages/support.html',
				width: 320,
				height: 320,
				x: 20,
				y: 60
			});
		});
	}
	
	if ($('contributeLink')){
		$('contributeLink').addEvent('click', function(e){	
			new Event(e).stop();
			document.mochaDesktop.newWindow({
				id: 'contribute',
				title: 'Contribute',
				loadMethod: 'xhr',
				contentURL: 'pages/contribute.html',
				width: 320,
				height: 320,
				x: 20,
				y: 60
			});
		});
	}	
	
	if ($('aboutLink')){
		$('aboutLink').addEvent('click', function(e){	
			new Event(e).stop();
			document.mochaDesktop.newWindow({
				id: 'about',
				title: 'Mocha UI Version 0.7',
				loadMethod: 'xhr',
				contentURL: 'pages/about.html',
				modal: true,
				width: 300,
				height: 150
			});
		});
	}
	
	if ($('cascadeLink')){
		$('cascadeLink').addEvent('click', function(e){	
			new Event(e).stop();
			document.mochaDesktop.arrangeCascade();
		});
	}
 	if ($('youTubeLink')) {
 		$('youTubeLink').addEvent('click', function(e){
		new Event(e).stop();
			document.mochaDesktop.newWindow({
				id: 'youTube',
				title: 'YouTube in Iframe',
				loadMethod: 'iframe',
				contentURL: 'pages/youtube.html',
				width: 425,
				height: 355,
				scrollbars: false,
				paddingVertical: 0,
				paddingHorizontal: 0,
				bgColor: '#000'
			});
		});
	}

	// Deactivate menu header links
	$$('a.returnFalse').each(function(el){
		el.addEvent('click', function(e){
			new Event(e).stop();
		});
	});
	
}

/* -----------------------------------------------------------------

	Corner Radius Slider
	Notes: Remove this function and it's reference in onload if you are not
	using the example corner radius slider

   ----------------------------------------------------------------- */


function addSlider(){
	if ($('sliderarea')) {
		mochaSlide = new Slider($('sliderarea'), $('sliderknob'), {
			steps: 20,
			offset: 5,
			onChange: function(pos){
				$('updatevalue').setHTML(pos);
				document.mochaDesktop.options.cornerRadius = pos;
				$$('div.mocha').each(function(windowEl, i) {
					document.mochaDesktop.drawWindow(windowEl);
				});
				document.mochaDesktop.indexLevel++; 
			}
		}).set(document.mochaDesktop.options.cornerRadius);
	}
}

/* -----------------------------------------------------------------

	Initialize Everything onLoad

   ----------------------------------------------------------------- */

window.addEvent('load', function(){
		document.mochaScreens = new MochaScreens();
		document.mochaDesktop = new MochaDesktop();
		attachMochaLinkEvents();
		addSlider(); // remove this if you remove the example corner radius slider
});
