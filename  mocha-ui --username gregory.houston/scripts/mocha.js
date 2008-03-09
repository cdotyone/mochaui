/* -----------------------------------------------------------------

	Script: 
		mocha.js version 0.8
	
	Copyright:
		Copyright (c) 2007-2008 Greg Houston, <http://greghoustondesign.com/>
	
	License:
		MIT-style license

	Contributors:
		Scott F. Frederick
		Joel Lindau
	
   ----------------------------------------------------------------- */

var MochaUI = new Class({
	options: {
		// Global options for windows.
		// Some of these options can be overriden for individual windows in newWindow()
		resizable:         true,
		draggable:         true,
		minimizable:       true,  // Requires dock
		maximizable:       true,  // Requires desktop
		closable:          true,
		effects:           true,  // Toggles the majority of window fade and move effects
		desktopTopOffset:  20,    // Use a negative number if neccessary to place first window where you want it
		desktopLeftOffset: 290,
		mochaTopOffset:    70,    // Initial vertical spacing of each window
		mochaLeftOffset:   70,    // Initial horizontal spacing of each window
		minWidth:          250,   // Minimum width of windows when resized
		maxWidth:          2500,  // Maximum width of windows when resized
		minHeight:         100,	  // Minimum height of windows when resized	
		maxHeight:         2000,  // Maximum height of windows when resized
		// Style options
		headerHeight:      25,    // Height of window titlebar	
		footerHeight:      26, 		
		cornerRadius:      9,		
		headerStartColor:  $RGB(250, 250, 250),  // Header gradient's top color
		headerStopColor:   $RGB(228, 228, 228),  // Header gradient's bottom color
		footerBgColor:     $RGB(246, 246, 246),	 // Background color of the main canvas shape
		minimizeColor:     $RGB(231, 231, 209),  // Minimize button color
		maximizeColor:     $RGB(217, 229, 217),  // Maximize button color
		closeColor:        $RGB(229, 217, 217),  // Close button color
		resizableColor:    $RGB(209, 209, 209)   // Resizable drag icon color		
	},
	initialize: function(options){
		this.setOptions(options);
		// Private properties
		this.indexLevel         = 1;  // Used for z-Index
		this.windowIDCount      = 0;		
		this.myTimer 			= ''; // Used with accordian
		this.iconAnimation      = ''; // Used with loading icon
		this.mochaControlsWidth = 0;
		this.minimizebuttonX    = 0;  // Minimize button horizontal position
		this.maximizebuttonX    = 0;  // Maximize button horizontal position
		this.closebuttonX       = 0;  // Close button horizontal position
		this.shadowWidth        = 3;
		this.shadowOffset       = this.shadowWidth * 2;		
		this.HeaderFooterShadow = this.options.headerHeight + this.options.footerHeight + this.shadowOffset;
		
		this.dockHeight	  = 0;      // Calculated height of dock
		this.headerHeight = 0;      // Calculated height of desktop header
		this.dockVisible  = true;   // True when dock is visible, false when not
		this.dockAutoHide = false;  // True when dock autohide is set to on, false if set to off
		this.hasDock      = true;		 
		this.hasDesktop	  = true;		
		var dock          = $('mochaDock');
		var desktop       = $('mochaDesktop');
		var desktopHeader = $('mochaDesktopHeader');
		
		if ( desktopHeader ) { this.headerHeight = this.calcElementHeight(desktopHeader); }
		
		// Make sure that hasDesktop and hasDock is set to false if the elements doesn't exist
		if ( !desktop ) this.hasDesktop = false;
		if ( !dock ) this.hasDock = false;

		if ( this.hasDock ) {
			dock.setStyles({
				'display':  'block',		   
				'position': 'absolute',
				'top':      null,
				'bottom':   0,
				'left':     0
			});
			this.dockHeight = this.calcElementHeight(dock);			
			this.initDock(dock);
			this.drawDock(dock);
		}
		
		// Set desktop size
		this.setDesktopSize(desktop);

		// Dynamically create windows defined in XHTML and remove the definitions from the DOM	
		this.newWindowsFromXHTML();
		
		// Modal initialization
		var mochaModal = new Element('div', {
			'id': 'mochaModalBackground',
			'styles': {
				'height': document.getCoordinates().height
			}
		});		
		mochaModal.injectInside(this.hasDesktop ? $('mochaDesktop') : document.body);
		
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
		
		 // Fix for dropdown menus in IE6
		if (Browser.Engine.trident4 && $("mochaDesktopNavbar")){
			$('mochaDesktopNavbar').getElements('li').each(function(element) {
				element.addEvent('mouseenter', function(){
					this.addClass('ieHover');
				})
				element.addEvent('mouseleave', function(){
					this.removeClass('ieHover');
				})
			})
		};
		
		// Resize desktop, modal background, and maximized windows when browser window is resized
		window.onresize = function(){
			this.onBrowserResize();
		}.bind(this);		
		
	},		
	onBrowserResize: function(){
		this.setDesktopSize();
		this.setModalSize();
		// Resize maximized windows to fit new browser window size
		setTimeout( function(){								 
			$$('div.mocha').each(function(el){				
				if (el.isMaximized) {

					var iframe = this.getSubElement(el, 'iframe');						
					if ( iframe ) {
						iframe.setStyle('visibility', 'hidden');
					}
				
					var windowDimensions = document.getCoordinates();
					var contentWrapper = this.getSubElement(el, 'contentWrapper');
					contentWrapper.setStyles({
						'height': (windowDimensions.height - this.options.headerHeight - this.options.footerHeight),
						'width': windowDimensions.width
					});
					
					this.drawWindow(el);						
					if ( iframe ) {
						iframe.setStyles({
							'height': contentWrapper.getStyle('height')
						});
						iframe.setStyle('visibility', 'visible');
					}						
					
				}				
			}.bind(this));
		}.bind(this), 100);
	},
	newWindowsFromXHTML: function(properties, cascade){		
		$$('div.mocha').each(function(el, i) {
			// Get the window title and destroy that element, so it does not end up in window content
			if ( Browser.Engine.presto || Browser.Engine.trident5 )
				el.setStyle('display','block'); // Required by Opera, and probably IE7
			var title = el.getElement('h3.mochaTitle');
			var elDimensions = el.getStyles('height', 'width');
			var properties = {
				id: el.getProperty('id'),
				height: elDimensions.height.toInt(),
				width: elDimensions.width.toInt()
			}
			// If there is a title element, set title and destroy the element so it does not end up in window content
			if ( title ) {
				properties.title = title.innerHTML;
				title.destroy();
			}
			
			/*
			// Make sure there are no null values
			for(var key in properties) {
				if ( !properties[key] )
					delete properties[key];
			} */
			
			// Get content and destroy the element
			properties.content = el.innerHTML;
			el.destroy();
			
			// Create window
			this.newWindow(properties, true);
		}.bind(this));
		
		this.arrangeCascade();
	},
	/*
	
	Method: newWindowsFromJSON
	
	Description: Create one or more windows from JSON data. You can define all the same properties
	             as you can for newWindow. Undefined properties are set to their defaults.
	
	*/	
	newWindowsFromJSON: function(properties){
		properties.each(function(properties) {						 
				this.newWindow(properties);		
		}.bind(this));				
	},		
	/*
	
	Method: newWindow
	
	Arguments: 
		properties
		cascade - boolean - this is set to true for windows parsed from the original XHTML

	*/	
	newWindow: function(properties, cascade){
		var windowProperties = $extend({
			id: null,
			title:            'New Window',
			loadMethod:       'html', 	             // html, xhr, or iframe
			content:           '',                   // used if loadMethod is set to 'html'
			contentURL:        'pages/lipsum.html',	 // used if loadMethod is set to 'xhr' or 'iframe'			
			modal:             false,
			draggable:         this.options.draggable,
			resizable:         this.options.resizable,			
			minimizable:       this.options.minimizable,
			maximizable:       this.options.maximizable,
			closable:          this.options.closable,
			width:             300,
			height:            125, 
			scrollbars:        true,
			x:                 null,
			y:                 null,
			paddingVertical:   10,
			paddingHorizontal: 12,
			bgColor:           '#fff',
			onContentLoaded:   $empty,  // Event, fired when content is successfully loaded via XHR
			onFocus:           $empty,  // Event, fired when the window is focused
			onResize:          $empty,  // Event, fired when the window is resized
			onMinimize:        $empty,  // Event, fired when the window is minimized
			onMaximize:        $empty,  // Event, fired when the window is maximized
			onClose:           $empty,  // Event, fired just before the window is closed
			onCloseComplete:   $empty   // Event, fired after the window is closed
		}, properties || {});
		var windowEl = $(windowProperties.id);
		
		// Check if window already exists and is not in progress of closing down
		if ( windowEl && !windowEl.isClosing ) {
			if ( windowEl.isMinimized )	// If minimized -> restore
				this.restoreMinimized(windowEl);
			else // else focus
				setTimeout(function(){ this.focusWindow(windowEl); }.bind(this),10);			
			return;
		}
		
		// Create window div
		var windowEl = new Element('div', {
			'class': 'mocha',			
			'id':    windowProperties.id ? windowProperties.id : 'win' + (++this.windowIDCount),
			'styles': {
				'width':   windowProperties.width,
				'height':  windowProperties.height,
				'display': 'block'
			}
		});
		
		// Part of fix for scrollbar issues in Mac FF2
		if (Browser.Platform.mac && Browser.Engine.gecko){
			windowEl.setStyle('position', 'fixed');	
		}
			
		// Extend our window element
		windowEl = $extend(windowEl, {
			// Custom properties
			oldTop:     0,
			oldLeft:    0,
			oldWidth:   0,
			oldHeight:  0,
			modal:      windowProperties.modal,
			scrollbars: windowProperties.scrollbars,
			// Always use close buttons for modal windows
			closable:   windowProperties.closable || windowProperties.modal,
			resizable:  windowProperties.resizable && !windowProperties.modal,
			draggable:  windowProperties.draggable && !windowProperties.modal,
			// Minimizable, dock is required and window cannot be modal
			minimizable: this.hasDock && windowProperties.minimizable && !windowProperties.modal,
			// Maximizable, desktop is required
			maximizable: this.hasDesktop && windowProperties.maximizable && !windowProperties.modal,
			iframe: windowProperties.loadMethod == 'iframe' ? true : false,
			isMaximized: false,
			isMinimized: false,
			// Custom events
			onFocus:         windowProperties.onFocus,
			onResize:        windowProperties.onResize,
			onMinimize:      windowProperties.onMinimize,
			onMaximize:      windowProperties.onMaximize,
			onClose:         windowProperties.onClose,
			onCloseComplete: windowProperties.onCloseComplete
		});

		// Insert subelements inside windowEl and cache them locally while creating the new window 
		var subElements = this.insertWindowElements(windowEl, windowProperties.height, windowProperties.width);
		
		// Set title
		subElements.title.setHTML(windowProperties.title);

		// Add content to window		
		switch(windowProperties.loadMethod) {
			case 'xhr':
				new Request({
					url: windowProperties.contentURL,
					onRequest: function(){
					},
					onFailure: function(){
						subElements.content.setHTML('<p><strong>Error Loading XMLHttpRequest</strong></p><p>Make sure all of your content is uploaded to your server, and that you are attempting to load a document from the same domain as this page. XMLHttpRequests will not work on your local machine.</p>');
					},
					onSuccess: function(response) {
						subElements.content.setHTML(response);
						windowProperties.onContentLoaded();
					}
				}).get();
				break;
			case 'iframe':
				if ( windowProperties.contentURL == '')
					break;
				subElements.iframe = new Element('iframe', {
					'id': windowEl.id + '_iframe', 
					'class': 'mochaIframe',
					'src': windowProperties.contentURL,
					'marginwidth':  0,
					'marginheight': 0,
					'frameBorder':  0,
					'scrolling':    'auto'
				}).injectInside(subElements.content);
				//mochaIframe.setStyle('height', windowElements.content.getStyle('height'));
				// Should be possible have onContentLoaded for iframe also
				break;
			case 'html':
			default:
				subElements.content.setHTML(windowProperties.content);
				windowProperties.onContentLoaded();
				break;
		}

		// Set scrollbars, always use 'hidden' for iframe windows
		subElements.contentWrapper.setStyles({
			'overflow': windowProperties.scrollbars && !windowProperties.iframe ? 'auto' : 'hidden',
			'background': windowProperties.bgColor
		});

		// Set content padding
		subElements.content.setStyles({
			'padding-top': windowProperties.paddingVertical,
			'padding-bottom': windowProperties.paddingVertical,
			'padding-left': windowProperties.paddingHorizontal,
			'padding-right': windowProperties.paddingHorizontal
		});

		// Attach events to the window
		this.attachResizable(windowEl, subElements);
		this.setupEvents(windowEl, subElements);
	
		// Move new window into position. If position not specified by user then center the window on the page		
		var dimensions = document.getCoordinates();
		var windowPosTop = windowProperties.y ? windowProperties.y : (dimensions.height * .5) - ((windowProperties.height + this.HeaderFooterShadow) * .5);
		var windowPosLeft = windowProperties.x ? windowProperties.x : (dimensions.width * .5) - (windowProperties.width * .5);
		
		if (windowEl.modal) {
			$('mochaModalBackground').setStyle('display', 'block');
			if (this.options.effects == false){			
				$('mochaModalBackground').setStyle('opacity', .55);
			}
			else {
				this.modalCloseMorph.cancel();
				this.modalOpenMorph.start({
					'opacity': .55
				});
			}
			windowEl.setStyles({
				'top': windowPosTop,
				'left': windowPosLeft,
				'zIndex': 11000
			});			
		}
		else if (cascade == true) {
			// do nothing		
		}
		else if (this.options.effects == false){	
			windowEl.setStyles({
				'top': windowPosTop,
				'left': windowPosLeft
			});
		}
		else {
			windowEl.positionMorph = new Fx.Morph(windowEl, {
				'duration': 300
			});
			windowEl.positionMorph.start({
				'top': windowPosTop,
				'left': windowPosLeft
			});
			setTimeout(function(){ this.focusWindow(windowEl); }.bind(this), 10);			
		}		

		// Inject window into DOM		
		
		windowEl.injectInside(this.hasDesktop ? $('mochaDesktop') : document.body);
		this.drawWindow(windowEl, subElements);
		
		// Drag.Move() does not work in IE until element has been injected, thus setting here
		this.attachDraggable(windowEl, subElements.titleBar);			
		
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
		
		if (this.options.effects == false){
			if (windowEl.modal) {
				$('mochaModalBackground').setStyle('opacity', 0);
			}
			windowEl.destroy();
			windowEl.onCloseComplete();			
		}
		else {
			// redraws IE windows without shadows since IE messes up canvas alpha when you change element opacity
			if (Browser.Engine.trident) this.drawWindow(windowEl, null, false);
			if (windowEl.modal) {
				this.modalCloseMorph.start({
					'opacity': 0
				});
			}		
			var closeMorph = new Fx.Morph(windowEl, {
				duration: 250,
				onComplete: function(){
					windowEl.destroy();
					windowEl.onCloseComplete();
				}.bind(this)
			});
			closeMorph.start({
				'opacity': .4
			});
		}
		return true;
	},
	/*
	
	Method: closeAll
	
	Notes: This closes all the windows

	Returns:
		true: the windows were closed
		false: the windows were not closed

	*/	
	closeAll: function() {
		$$('div.mocha').each(function(el) {
			this.closeWindow(el);
			$$('button.mochaDockButton').destroy();
		}.bind(this));
		
		return true;		
	},
	focusWindow: function(windowEl){
		if ( !(windowEl = $(windowEl)) )
			return;
		// Only focus when needed
		if ( windowEl.getStyle('zIndex').toInt() == this.indexLevel )
			return;
		this.indexLevel++;
		windowEl.setStyle('zIndex', this.indexLevel);
		windowEl.onFocus();
	},
	maximizeWindow: function(windowEl) {
		// If window no longer exists or is maximized, stop
		if ( !(windowEl = $(windowEl)) || windowEl.isMaximized )
			return;
		var contentWrapper = this.getSubElement(windowEl, 'contentWrapper');
		windowEl.onMaximize();
		
		// Save original position, width and height
		windowEl.oldTop = windowEl.getStyle('top');
		windowEl.oldLeft = windowEl.getStyle('left');
		contentWrapper.oldWidth = contentWrapper.getStyle('width');
		contentWrapper.oldHeight = contentWrapper.getStyle('height');
		
		// Hide iframe
		// Iframe should be hidden when minimizing, maximizing, and moving for performance and Flash issues
		if ( windowEl.iframe ) {
			this.getSubElement(windowEl, 'iframe').setStyle('visibility', 'hidden');
		}		

		var windowDimensions = document.getCoordinates();

		if (this.options.effects == false){	
			windowEl.setStyles({
				'top': -this.shadowWidth,
				'left': -this.shadowWidth
			});
			contentWrapper.setStyles({
				'height': windowDimensions.height - this.options.headerHeight - this.options.footerHeight,
				'width':  windowDimensions.width
			});			
			this.drawWindow(windowEl);
			// Show iframe
			if ( windowEl.iframe ) {
				this.getSubElement(windowEl, 'iframe').setStyle('visibility', 'visible');
			}			
		}
		else {
			var maximizeMorph = new Fx.Morph(windowEl, { 
				'duration': 200,
				'onComplete': function(windowEl){					
					contentWrapper.setStyles({
						'height': (windowDimensions.height - this.options.headerHeight - this.options.footerHeight),
						'width':  windowDimensions.width
					});
					this.drawWindow(windowEl);
					// Show iframe
					if ( windowEl.iframe ) {
						this.getSubElement(windowEl, 'iframe').setStyle('visibility', 'visible');
					}				
				}.bind(this)
			});
			maximizeMorph.start({
				'top':  -this.shadowWidth, // takes shadow width into account
				'left': -this.shadowWidth // takes shadow width into account
			});
		}		
		
		windowEl.isMaximized = true;
	},
	restoreWindow: function(windowEl) {
		// Window exists and is maximized ?
		if ( !(windowEl = $(windowEl)) || !windowEl.isMaximized )
			return;
			
		// Hide iframe
		// Iframe should be hidden when minimizing, maximizing, and moving for performance and Flash issues
		if ( windowEl.iframe ) {
			this.getSubElement(windowEl, 'iframe').setStyle('visibility', 'hidden');
		}				
		var contentWrapper = this.getSubElement(windowEl, 'contentWrapper');
		contentWrapper.setStyles({
			'width':  contentWrapper.oldWidth,
			'height': contentWrapper.oldHeight
		});

		windowEl.isMaximized = false;
		this.drawWindow(windowEl);
		
		if (this.options.effects == false){	
			windowEl.setStyles({
				'top': windowEl.oldTop,
				'left': windowEl.oldLeft
			});		
		}
		else {
			var mochaMorph = new Fx.Morph(windowEl, { 
				'duration':   150,
				'onComplete': function(el){
					if ( windowEl.iframe ) {
						this.getSubElement(windowEl, 'iframe').setStyle('visibility', 'visible');
					}
				}.bind(this)	
			});
			mochaMorph.start({
				'top': windowEl.oldTop,
				'left': windowEl.oldLeft
			});
		}
	},
	minimizeWindow: function(windowEl) {
		// What if there is no dock, react how ?? ignore request?
		if ( !(windowEl = $(windowEl)) || !this.hasDock )
			return;

		// Hide iframe
		// Iframe should be hidden when minimizing, maximizing, and moving for performance and Flash issues
		if ( windowEl.iframe ) {
			this.getSubElement(windowEl, 'iframe').setStyle('visibility', 'hidden');
		}

		var title = this.getSubElement(windowEl, 'title');
		var mochaContentWrapper = windowEl.getElement('.mochaContentWrapper');
		var titleText = title.innerHTML;
		windowEl.onMinimize();
		
		// Hide window and add to dock
		windowEl.setStyle('visibility', 'hidden');
		
		 // Fixes a scrollbar issue in Mac FF2
		if (Browser.Platform.mac && Browser.Engine.gecko){
			this.getSubElement(windowEl, 'contentWrapper').setStyle('overflow', 'hidden');
		}		
		
		windowEl.isMinimized = true;
		var dockButton = new Element('button', {
			'id': windowEl.id + '_dockButton',
			'class': 'mochaDockButton',
			'title': titleText
		}).setHTML(titleText.substring(0,13) + (titleText.length > 13 ? '...' : '')).injectInside($('mochaDock'));
		dockButton.addEvent('click', function(event) {
			this.restoreMinimized(windowEl);
		}.bind(this));
		// Fixes a scrollbar issue in Mac FF2.
		// Have to use timeout because window gets focused when you click on the minimize button 	
		setTimeout(function(){ windowEl.setStyle('zIndex', 1); }.bind(this),100); 
	},
	restoreMinimized: function(windowEl) {
		
		 // Part of Mac FF2 scrollbar fix
		if (windowEl.scrollbars == true && windowEl.iframe == false){ 
			this.getSubElement(windowEl, 'contentWrapper').setStyle('overflow', 'auto');		
		}
		
		windowEl.setStyle('visibility', 'visible');
		
		// Show iframe
		if ( windowEl.iframe ) {
			this.getSubElement(windowEl, 'iframe').setStyle('visibility', 'visible');
		}

		windowEl.isMinimized = false;
		this.focusWindow(windowEl);
		$('mochaDock').getElementById(windowEl.id + '_dockButton').destroy();
	},
		
	/* -- START Private Methods -- */
	
	/*
		Method: getSubElement()
		Description: 
			Get a single subElement within windowEl. Subelements have IDs that are made up of the windowEl ID plus
			an element key. e.g., myWindow_content or myWindow_iframe.
			Might rename these parentWindow and childElements in the future.
		Arguments: 
			windowEl, subElementKey
		Returns:
			subElement
	*/
		
	getSubElement: function(windowEl, subElementKey) {
		return windowEl.getElementById((windowEl.id + '_' + subElementKey));
	},
	/*
		Method: getSubElements()
		Description:
			Get subElements within windowEl referenced in array subElementsKeys 
		Arguments:
			windowEl, subElementKeys
		Returns:
			Object, where elements are object.key
	*/
	getSubElements: function(windowEl, subElementKeys) {
		var subElements = {};
		subElementKeys.each(function(key) {
			subElements[key] = this.getSubElement(windowEl, key);
		}.bind(this));
		return subElements;
	},
	/*
		Method: calcElementHeight()
		Description:
			Calculate an elements real height, including padding and borders
		Arguments:
			element
		Returns:
			Integer, height in pixels
	*/
	calcElementHeight: function(element) { // !!! This probably isn't necessary. Scrollheight should do all this
		var styleDimensions = element.getStyles('height', 'padding-top', 'padding-bottom', 'border-top', 'border-bottom');
		var heightPx = 0;
		for(var style in styleDimensions)
			heightPx += styleDimensions[style].toInt();
		return heightPx;
	},
	
	/*
		Method: setupControlEvents()
		Usage: internal

		Arguments:
			windowEl
	*/
	setupEvents: function(windowEl, subElements) {
		/*if ( !subElements )
			subElements = this.getSubElements(windowEl, ['closeButton','minimizeButton','maximizeButton']);*/
		
		// Set events
		// Note: if a button does not exist, its due to properties passed to newWindow() stating otherwice
		if ( subElements.closeButton )
			subElements.closeButton.addEvent('click', function() { this.closeWindow(windowEl); }.bind(this));
		
		if ( !windowEl.modal )		
			windowEl.addEvent('click', function() { this.focusWindow(windowEl); }.bind(this));
		
		if ( subElements.minimizeButton )
			subElements.minimizeButton.addEvent('click', function() { this.minimizeWindow(windowEl); }.bind(this));
		
		if ( subElements.maximizeButton ) {
			subElements.maximizeButton.addEvent('click', function() { 
				if ( windowEl.isMaximized ) {
					this.restoreWindow(windowEl);
					subElements.maximizeButton.setProperty('title', 'Maximize');
				} else {
					this.maximizeWindow(windowEl); 
					subElements.maximizeButton.setProperty('title', 'Restore');
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
	attachDraggable: function(windowEl, handleEl){
		if ( !windowEl.draggable )
			return;
		new Drag.Move(windowEl, {
			handle: handleEl,
			onStart: function() {
				this.focusWindow(windowEl);
				if ( windowEl.iframe )
					this.getSubElement(windowEl, 'iframe').setStyle('visibility', 'hidden');
			}.bind(this),
			onComplete: function() {
				if ( windowEl.iframe )
					this.getSubElement(windowEl, 'iframe').setStyle('visibility', 'visible');
			}.bind(this)
		});
	},
	/*
		Method: attachResizable()
		Description: make window resizable
		Usage: internal
		
		Arguments:
			windowEl
	*/
	attachResizable: function(windowEl, subElements){
		if ( !windowEl.resizable )
			return;
		subElements.contentWrapper.makeResizable({
			handle: subElements.resizeHandle,
			modifiers: {
				x: 'width',
				y: 'height'
			},
			limit: {
				x: [this.options.minWidth, this.options.maxWidth],
				y: [this.options.minHeight, this.options.maxHeight]
			},
			onStart: function() {
				this.cacheSubElements = this.getSubElements(windowEl, ['title', 'content', 'canvas', 'contentWrapper', 'overlay', 'titleBar', 'iframe', 'zIndexFix']);
				if ( this.cacheSubElements.iframe )
					this.cacheSubElements.iframe.setStyle('visibility', 'hidden');
			}.bind(this),
			onDrag: function() {
				this.drawWindow(windowEl, this.cacheSubElements);
			}.bind(this),
			onComplete: function() {
				if ( this.cacheSubElements.iframe )
					this.cacheSubElements.iframe.setStyle('visibility', 'visible');
				delete this.cacheSubElements;
				this.cacheSubElements = null;
				windowEl.onResize();
			}.bind(this)
		});
	},
	setDesktopSize: function(desktop){
		var windowDimensions = document.getCoordinates();
		var pageWrapper = null;
		if ( this.hasDesktop && (desktop || (desktop = $('mochaDesktop'))) ) // Why so many conditions?
			desktop.setStyle('height', windowDimensions.height);
		if ( (pageWrapper = $('mochaPageWrapper')) ) {
			var pageWrapperHeight = (windowDimensions.height- (this.headerHeight + (this.dockVisible ? this.dockHeight : 0)));
			if ( pageWrapperHeight < 0 )
				pageWrapperHeight = 0;
			pageWrapper.setStyle('height', pageWrapperHeight + 'px');
		}
	},	
	setModalSize: function(){
		$('mochaModalBackground').setStyle('height', document.getCoordinates().height);
	},
	/*
		Method: insertWindowElements
		Arguments:
			windowEl
		Returns:
			object containing all elements created within [windowEl]
	*/
	insertWindowElements: function(windowEl, height, width){
		var subElements = {};
		
		if (Browser.Engine.trident4){
			subElements.zIndexFix = new Element('iframe', {
				'class': 'zIndexFix',
				'scrolling': 'no',
				'marginWidth': 0,
				'marginHeight': 0,
				'src': '',
				'id': windowEl.id + '_zIndexFix'
			}).injectInside(windowEl);
		}
			
		subElements.overlay = new Element('div', {
			'class': 'mochaOverlay',
			'id': windowEl.id + '_overlay'
		}).injectInside(windowEl);
		
		//Insert mochaTitlebar
		subElements.titleBar = new Element('div', {
			'class': 'mochaTitlebar',
			'id': windowEl.id + '_titleBar',
			'styles': {
				'cursor': windowEl.draggable ? 'move' : 'default'
			}
		}).injectTop(subElements.overlay);

		// Create window header
		subElements.title = new Element('h3', {
			'class': 'mochaTitle',
			'id': windowEl.id + '_title'
		}).injectInside(subElements.titleBar);
		
		subElements.contentWrapper = new Element('div', {
			'class': 'mochaContentWrapper',
			'id': windowEl.id + '_contentWrapper',
			'styles': {
				'width': width + 'px',
				'height': height + 'px'
			}
		}).injectInside(subElements.overlay);
		
		subElements.content = new Element('div', {
			'class': 'mochaContent',
			'id': windowEl.id + '_content'
		}).injectInside(subElements.contentWrapper);
		
		//Insert canvas
		subElements.canvas = new Element('canvas', {
			'class': 'mochaCanvas',
			'width': 1,
			'height': 1,
			'id': windowEl.id + '_canvas'
		}).injectInside(windowEl);
		
		//Insert resize handles
		if (windowEl.resizable){
			subElements.resizeHandle = new Element('div', {
				'class': 'resizeHandle',
				'id': windowEl.id + '_resizeHandle'
			}).injectAfter(subElements.overlay);
			
			if ( Browser.Engine.trident )
				subElements.resizeHandle.setStyle('zIndex', 2);
		}
		
		//Insert mochaTitlebar controls
		subElements.controls = new Element('div', {
			'class': 'mochaControls',
			'id': windowEl.id + '_controls'
		}).injectAfter(subElements.overlay);
		
		//Insert close button
		if (windowEl.closable){
			subElements.closeButton = new Element('div', {
				'class': 'mochaClose',
				'title': 'Close Window',
				'id': windowEl.id + '_closeButton'
			}).injectInside(subElements.controls);
		}				

		//Insert maximize button
		if (windowEl.maximizable){
			subElements.maximizeButton = new Element('div', {
				'class': 'maximizeToggle',
				'title': 'Maximize',
				'id': windowEl.id + '_maximizeButton'
			}).injectInside(subElements.controls);
		}
		//Insert minimize button
		if (windowEl.minimizable){
			subElements.minimizeButton = new Element('div', {
				'class': 'minimizeToggle',
				'title': 'Minimize',
				'id': windowEl.id + '_minimizeButton'
			}).injectInside(subElements.controls);
		}
		
		if ( Browser.Engine.trident ) {
			subElements.controls.setStyle('zIndex', 2)
			subElements.overlay.setStyle('zIndex', 2)
		}
		
		// For Mac Firefox 2 to help reduce scrollbar bugs in that browser
		if (Browser.Platform.mac && Browser.Engine.gecko)
			subElements.overlay.setStyle('overflow', 'auto');
		this.setMochaControlsWidth(windowEl, subElements);
		return subElements;
	},	
	/*
	
	Method: drawWindow
	
	Arguments: 
		windowEl: the $(window)
		subElements: children of $(window)
		shadows: (boolean) false will draw a window without shadows
		
	Notes: This is where we create the canvas GUI	

	*/	
	drawWindow: function(windowEl, subElements, shadows) {
		if ( !subElements ) {
			subElements = this.getSubElements(windowEl, ['title', 'content', 'canvas', 'contentWrapper', 'overlay', 'titleBar', 'iframe', 'zIndexFix']);
		}
		
		//Resize iframe when window is resized
		if ( windowEl.iframe ) {
			subElements.iframe.setStyles({
				'height': subElements.contentWrapper.getStyle('height')
			});
		}
		
		var mochaHeight = subElements.contentWrapper.getStyle('height').toInt() + this.HeaderFooterShadow;		
		var mochaWidth = subElements.contentWrapper.getStyle('width').toInt() + this.shadowOffset;
			
		subElements.overlay.setStyle('height', mochaHeight);
		windowEl.setStyle('height', mochaHeight);
		
		// If opera height and width must be set like this, when resizing:
		subElements.canvas.height = Browser.Engine.webkit ? 4000 : mochaHeight;
		subElements.canvas.width = Browser.Engine.webkit ? 2000 : mochaWidth;
		
		// Part of the fix for IE6 select z-index bug and FF on Mac scrollbar z-index bug
		if ( Browser.Engine.trident4 ){
			subElements.zIndexFix.setStyles({
				'width': mochaWidth,
				'height': mochaHeight
			})
		}

		// Set width		
		windowEl.setStyle('width', mochaWidth);
		subElements.overlay.setStyle('width', mochaWidth); 
		subElements.titleBar.setStyles({
			'width': mochaWidth - this.shadowOffset,
			'height': this.options.headerHeight
		});	

		// Draw shapes
		var ctx = subElements.canvas.getContext('2d');
		var dimensions = document.getCoordinates();
		ctx.clearRect(0, 0, dimensions.width, dimensions.height);
		
		// This is the drop shadow. It is created onion style with three layers
		if ( shadows != false ) {
			this.roundedRect(ctx, 0, 0, mochaWidth, mochaHeight, this.options.cornerRadius, 0, 0, 0, 0.06); 
			this.roundedRect(ctx, 1, 1, mochaWidth - 2, mochaHeight - 2, this.options.cornerRadius, 0, 0, 0, 0.08);
			this.roundedRect(ctx, 2, 2, mochaWidth - 4, mochaHeight - 4, this.options.cornerRadius, 0, 0, 0, 0.3); 
		}
		
		// Mocha body
		this.bodyRoundedRect(
			ctx,							 // context		
			3,                               // x
			2,                               // y			
			mochaWidth - this.shadowOffset,  // width
			mochaHeight - this.shadowOffset, // height
			this.options.cornerRadius        // corner radius
		);
		
		// Mocha header
		this.topRoundedRect(
			ctx,							 // context
			3,                               // x
			2,                               // y
			mochaWidth - this.shadowOffset,  // width
			this.options.headerHeight,       // height
			this.options.cornerRadius        // corner radius
		);		

		// Calculate X position for controlbuttons
		this.closebuttonX = mochaWidth - (windowEl.closable ? 15 : -4);
		this.maximizebuttonX = this.closebuttonX - (windowEl.maximizable ? 19 : 0);
		this.minimizebuttonX = this.maximizebuttonX - (windowEl.minimizable ? 19 : 0);
		
		if ( windowEl.closable )
			this.closebutton(ctx, this.closebuttonX, 15, this.options.closeColor, 1.0);
		if ( windowEl.maximizable )
			this.maximizebutton(ctx, this.maximizebuttonX, 15, this.options.maximizeColor, 1.0);
		if ( windowEl.minimizable )
			this.minimizebutton(ctx, this.minimizebuttonX, 15, this.options.minimizeColor, 1.0); //Minimize
		if ( windowEl.resizable ) 
			this.triangle(ctx, mochaWidth - 20, mochaHeight - 20, 12, 12, this.options.resizableColor, 1.0); //resize handle
		
		// Invisible dummy object. The last element drawn is not rendered consistently while resizing in IE6 and IE7.
		this.triangle(ctx, 0, 0, 10, 10, this.options.resizableColor, 0); 

	},
	// Window body
	bodyRoundedRect: function(ctx, x, y, width, height, radius){
		ctx.fillStyle = 'rgba(' + this.options.footerBgColor.join(',') + ', 100)';
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
	roundedRect: function(ctx, x, y, width, height, radius, r, g, b, a){
		ctx.fillStyle = 'rgba(' + r +',' + g + ',' + b + ',' + a + ')';
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
	// Window header with gradient background
	topRoundedRect: function(ctx, x, y, width, height, radius){

		// Create gradient
		if (Browser.Engine.presto != null ){
			var lingrad = ctx.createLinearGradient(0, 0, 0, this.options.headerHeight + 2);
		}
		else {
			var lingrad = ctx.createLinearGradient(0, 0, 0, this.options.headerHeight);
		}

		lingrad.addColorStop(0, 'rgba(' + this.options.headerStartColor.join(',') + ', 100)');
		lingrad.addColorStop(1, 'rgba(' + this.options.headerStopColor.join(',') + ', 100)');
		ctx.fillStyle = lingrad;

		// Draw header
		ctx.beginPath();
		ctx.moveTo(x, y);
		ctx.lineTo(x, y + height);
		ctx.lineTo(x + width, y + height);
		ctx.lineTo(x + width, y + radius);
		ctx.quadraticCurveTo(x + width, y, x + width - radius, y);
		ctx.lineTo(x + radius, y);
		ctx.quadraticCurveTo(x, y, x, y + radius);
		ctx.fill(); 
	},
	// Resize handle
	triangle: function(ctx, x, y, width, height, rgb, a){
		ctx.beginPath();
		ctx.moveTo(x + width, y);
		ctx.lineTo(x, y + height);
		ctx.lineTo(x + width, y + height);
		ctx.closePath();
		ctx.fillStyle = 'rgba(' + this.options.resizableColor.join(',') + ',' + a + ')';
		ctx.fill();
	},
	drawCircle: function(ctx, x, y, diameter, r, g, b, a){
		// Circle
		ctx.beginPath();
		ctx.moveTo(x, y);
		ctx.arc(x, y, diameter, 0, Math.PI*2, true);
		ctx.fillStyle = 'rgba(' + r +',' + g + ',' + b + ',' + a + ')';
		ctx.fill();
	},
	maximizebutton: function(ctx, x, y, rgb, a){ // this could reuse the drawCircle method above
		// Circle
		ctx.beginPath();
		ctx.moveTo(x, y);
		ctx.arc(x, y, 7, 0, Math.PI*2, true);
		ctx.fillStyle = 'rgba(' + rgb.join(',') + ',' + a + ')';
		ctx.fill();
		// X sign
		ctx.beginPath();
		ctx.moveTo(x, y - 4);
		ctx.lineTo(x, y + 4);
		ctx.stroke();
		ctx.beginPath();
		ctx.moveTo(x - 4, y);
		ctx.lineTo(x + 4, y);
		ctx.stroke();
	},
	closebutton: function(ctx, x, y, rgb, a){ // this could reuse the drawCircle method above
		// Circle
		ctx.beginPath();
		ctx.moveTo(x, y);
		ctx.arc(x, y, 7, 0, Math.PI*2, true);
		ctx.fillStyle = 'rgba(' + rgb.join(',') + ',' + a + ')';
		ctx.fill();
		// Plus sign
		ctx.beginPath();
		ctx.moveTo(x - 3, y - 3);
		ctx.lineTo(x + 3, y + 3);
		ctx.stroke();
		ctx.beginPath();
		ctx.moveTo(x + 3, y - 3);
		ctx.lineTo(x - 3, y + 3);
		ctx.stroke();
	},
	minimizebutton: function(ctx, x, y, rgb, a){ // this could reuse the drawCircle method above
		// Circle
		ctx.beginPath();
		ctx.moveTo(x,y);
		ctx.arc(x,y,7,0,Math.PI*2,true);
		ctx.fillStyle = 'rgba(' + rgb.join(',') + ',' + a + ')';
		ctx.fill();
		// Minus sign
		ctx.beginPath();
		ctx.moveTo(x - 4, y);
		ctx.lineTo(x + 4, y);
		ctx.stroke();
	},
	loadingIcon: function(ctx,t) {
		var ctx = $('loadingIcon').getContext('2d');	
		ctx.clearRect(0, 0, 36, 36); // clear canvas
		ctx.translate(13, 22);
		ctx.rotate(t*(Math.PI / 8));
		ctx.save();	
		var color = 0;
		for (i=0; i < 8; i++){ // draw individual dots
			color = Math.floor(255 / 8 * i);
			ctx.fillStyle = "rgb(" + color + "," + color + "," + color + ")";  	
			ctx.rotate(-Math.PI / 4);
			ctx.beginPath();
			ctx.arc(0, 14, 4, 0, Math.PI*2, true);
			ctx.fill();
		}
    	ctx.restore();
	},
	startLoadingIcon: function() {
		$('loadingIcon').setStyles({
			'display': 'block'
		});
		var drawFunction = loadingIcon();
		this.canvasAnimatedRotate($('loadingIcon'), drawFunction, myIconAnimation, 12, 125);
	},
	stopLoadingIcon: function() {
		$('loadingIcon').setStyle('display', 'none');		
		clearInterval(this.iconAnimation);
	},	
	/*
	
	Method: canvasAnimatedRotate
	
	Arguments:
		canvas: the canvas element to rotate
		drawFunction: the variable name for the function that draws the shapes on your canvas
		animation: is the setInterval variable name. Use it to stop the animation 
		steps: the number of steps in one rotation
		speed: how fast the animation rotates
		
	Notes: This is used for the loading icon - NOT IMPLEMENTED YET

	*/	 
	canvasAnimatedRotate: function(canvas, drawFunction, animation, steps, speed) {
		var t = 1;	  	
		animation = setInterval( function(){
			var ctx = canvas.getContext('2d');
			ctx.clearRect(0, 0, 500, 500); // clear canvas
			ctx.save();
			ctx.rotate(-Math.PI / steps);
 			drawFunction(ctx,t);
 			ctx.restore();
			t++;			
		}, speed);	  
	},	
	setMochaControlsWidth: function(windowEl, subElements){
		var controlWidth = 14;
		var marginWidth = 5;
		this.mochaControlsWidth = 0;
		if ( windowEl.minimizable )
			this.mochaControlsWidth += (marginWidth + controlWidth);
		if ( windowEl.maximizable ) {
			this.mochaControlsWidth += (marginWidth + controlWidth);
			subElements.maximizeButton.setStyle('margin-left', marginWidth);
		}
		if ( windowEl.closable ) {
			this.mochaControlsWidth += (marginWidth + controlWidth);
			subElements.closeButton.setStyle('margin-left', marginWidth);
		}
		subElements.controls.setStyle('width', this.mochaControlsWidth);
	},
	initDock: function (el){
		// Probably: this event should be added/removed when toggling AutoHide, since we dont need it when AutoHide is turned off
		// this.dockVisible tracks the status of the dock, so that showing/hiding is not done when not needed
		document.addEvent('mousemove', function(event) {
			if ( !this.dockAutoHide )
				return;
			var ev = new Event(event);
			if ( ev.client.y > (document.getCoordinates().height - this.dockHeight) ) {
				if ( !this.dockVisible ) {
					$('mochaDock').setStyle('display', 'block'); 
					this.dockVisible = true;
					this.setDesktopSize();
				}
			} else {
				if ( this.dockVisible ) {
					$('mochaDock').setStyle('display', 'none'); 
					this.dockVisible = false;
					this.setDesktopSize();
				}
			}
		}.bind(this));

		// Insert canvas
		var canvas = new Element('canvas', {
			'class':  'mochaCanvas',
			'id':     'dockCanvas',
			'width':  '15',
			'height': '18'
		}).injectInside(el).setStyles({
			position: 'absolute',
			top:      '4px',
			left:     '2px',
			zIndex:   2
		});

		// Position top or bottom selector
		$('mochaDockPlacement').setProperty('title','Position Dock Top');
			
		// Auto Hide toggle switch
		$('mochaDockAutoHide').setProperty('title','Turn Auto Hide On');
		
		// Attach event
		$('mochaDockPlacement').addEvent('click', function(event){
			var objDock=event.target.parentNode;
			var ctx = el.getElement('.mochaCanvas').getContext('2d');
			
			// Move dock to top position
			if (objDock.getStyle('position') != 'relative'){
				objDock.setStyles({
					'position': 'relative',
					'bottom': null,
					'border-top': '1px solid #fff',
					'border-bottom': '1px solid #bbb'
				})
				$('mochaDesktopHeader').setStyle('height', 74);
				objDock.setProperty('dockPosition','Top');	
				this.drawCircle(ctx, 5, 4, 3, 0, 255, 0, 1.0); // green
				this.drawCircle(ctx, 5, 14, 3, 212, 208, 200, 1.0); // gray
				$('mochaDockPlacement').setProperty('title', 'Position Dock Bottom');				
				$('mochaDockAutoHide').setProperty('title', 'Auto Hide Disabled in Top Dock Position');
			}
			// Move dock to bottom position
			else {
				objDock.setStyles({
					'position': 'absolute',
					'bottom': 0,
					'border-top': '1px solid #bbb',
					'border-bottom': '1px solid #fff'
				})
				$('mochaDesktopHeader').setStyle('height', 54);
				objDock.setProperty('dockPosition','Bottom');
				this.drawCircle(ctx, 5, 4, 3, 241, 102, 116, 1.0); // orange		
				this.drawCircle(ctx, 5 , 14, 3, 241, 102, 116, 1.0); // orange 
				$('mochaDockPlacement').setProperty('title', 'Position Dock Top');					
				$('mochaDockAutoHide').setProperty('title', 'Turn Auto Hide On');	 		
			}

			if ( this.dockAutoHide ) {
				this.dockAutoHide = false;
			}

		}.bind(this));

		// Attach event Auto Hide 
		$('mochaDockAutoHide').addEvent('click', function(event){
			var objDock = event.target.parentNode;
			if ( objDock.getProperty('dockPosition') == 'Top' )
				return false;
			
			var ctx = el.getElement('.mochaCanvas').getContext('2d');
			this.dockAutoHide = !this.dockAutoHide;	// Toggle
			if ( this.dockAutoHide ) {
				$('mochaDockAutoHide').setProperty('title', 'Turn Auto Hide Off');
				this.drawCircle(ctx, 5 , 14, 3, 0, 255, 0, 1.0); // green
			} else {
				$('mochaDockAutoHide').setProperty('title', 'Turn Auto Hide On');
				this.drawCircle(ctx, 5 , 14, 3, 241, 102, 116, 1.0); // orange
			}
		}.bind(this));	
	},
	drawDock: function (el){
		var ctx = el.getElement('.mochaCanvas').getContext('2d');
		this.drawCircle(ctx, 5 , 4, 3, 241, 102, 116, 1.0);  // orange
		this.drawCircle(ctx, 5 , 14, 3, 241, 102, 116, 1.0); // orange
	},
	dynamicResize: function (windowEl){				
			this.getSubElement(windowEl, 'contentWrapper').setStyle('height', this.getSubElement(windowEl, 'content').scrollHeight);
			this.drawWindow(windowEl);		
	},
	/*
	
	Method: arrangeCascade
	
	*/	
	arrangeCascade: function(){
		var x = this.options.desktopLeftOffset
		var y = this.options.desktopTopOffset;
		$$('div.mocha').each(function(windowEl){
			if (windowEl.getStyle('display') != 'none'){
				this.focusWindow(windowEl);
				x += this.options.mochaLeftOffset;
				y += this.options.mochaTopOffset;
				
				if (this.options.effects == false){	
					windowEl.setStyles({
						'top': y,
						'left': x
					});
				}				
				else {
					var cascadeMorph = new Fx.Morph(windowEl, {
						'duration': 550
					});
					cascadeMorph.start({
						'top': y,
						'left': x
					});
				}
			}
		}.bind(this));
	},
	/*
	
	Method: garbageCleanup
	
	Notes: Empties an all windows of their children, removes and garbages the windows.
	This is useful to clear memory before the pageUnload. 
	
	*/	
	garbageCleanUp: function() {
		$$('div.mocha').each(function(el) {
			el.destroy();
		}.bind(this));		
	}	
});
MochaUI.implement(new Options);

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
		document.mochaUI.newWindow(this.options);		
	}
});
MochaWindowForm.implement(new Options);


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
				document.mochaUI.options.cornerRadius = pos;
				$$('div.mocha').each(function(windowEl, i) {
					document.mochaUI.drawWindow(windowEl);
				});
				document.mochaUI.indexLevel++; 
			}
		}).set(document.mochaUI.options.cornerRadius);
	}
}

/* -----------------------------------------------------------------

	Initialize Everything onLoad

   ----------------------------------------------------------------- */

window.addEvent('domready', function(){							 
		document.mochaScreens = new MochaScreens();
		document.mochaUI = new MochaUI();
		attachMochaLinkEvents(); // See mocha-events.js
		addSlider();             // remove this if you remove the example corner radius slider		
});

// This runs when a person leaves your page.
window.addEvent('unload', function(){
		if (document.mochaUI) document.mochaUI.garbageCleanUp();
});
