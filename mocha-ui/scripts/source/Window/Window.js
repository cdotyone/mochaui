/*

Script: Window.js
	Build windows.	

License:
	MIT-style license.	

Requires:
	Core.js

Todo:
	- Try setting window opacity to .99 for IE. See if opacity effects will work with shadows then.

*/
   
/*
Class: Window
	Creates a single MochaUI window.
	
Syntax:
	(start code)
	new MochaUI.Window(options);
	(end)	

Arguments:
	options

Options:
	to be listed

Returns:
	Window object.
	
Example:
	Define a window. It is suggested you name the function the same as your window ID + "Window".
	(start code)
	var mywindowWindow = function(){ 
		new MochaUI.Window({
			id: 'mywindow',
			title: 'My Window',
			loadMethod: 'xhr',
			contentURL: 'pages/lipsum.html',
			width: 340,
			height: 150
		});
	}
	(end)
	
Example:
	Create window onDomReady.
	(start code)	
	window.addEvent('domready', function(){
		mywindow();
	});
	(end)
	
Example:	
	Add link events to build future windows. It is suggested you give your anchor the same ID as your window + "WindowLink" or + "WindowLinkCheck". Use the latter if it is a link in the menu toolbar.
	(start code)	
	// Javascript:
	if ($('mywindowLink')){
		$('mywindowLink').addEvent('click', function(e) {
			new Event(e).stop();
			mywindow();			
		});
	}
	
	// HTML:
	<a id="mywindowLink" href="pages/lipsum.html">My Window</a>	
	(end)

*/   

// Having these options outside of the Class allows us to add, change, and remove individual options without rewriting all of them.
windowOptions = {
	id:                null,
	title:             'New Window',
	modal:             false,
	
	loadMethod:        'html', 	             // Can be set to 'html', 'xhr', or 'iframe'.
	contentURL:        'pages/lipsum.html',	 // Used if loadMethod is set to 'xhr' or 'iframe'.

	// xhr options
	evalScripts:       true,       
	evalResponse:      false,         
	
	// html options
	content:           'Window content',
	
	// Container options
	container:         null,  // Element the window is injected in. Defaults to MochaUI.Desktop.deskop. If no desktop then to document.body.
	restrict:          true,  // Restrict window to container when dragging.
	
	// Window Events  
	minimizable:       true,  // Requires MochaUI.Desktop and MochaUI.Dock.
	maximizable:       true,  // Requires MochaUI.Desktop.
	closable:          true,

	// Draggable
	draggable:         true,
	draggableGrid:     false, // Distance in pixels for snap-to-grid dragging.
	draggableLimit:    false, // An object with x and y properties used to limit the movement of the Window.	
	draggableSnap:     false, // The distance to drag before the Window starts to respond to the drag.

	// Resizable
	resizable:         true, 	
	resizableLimitX:   [250, 2500],  // Minimum and maximum width of window when resized.
	resizableLimitY:   [100, 2000],  // Minimum and maximum height of window when resized.
	
	// Style options:
	addClass:          null,    // Add a class to your window to give you more control over styling.	
	width:             300,
	height:            125,
	x:                 null,
	y:                 null,
	scrollbars:        true,
	padding:   		   { top: 10, right: 12, bottom: 10, left: 12 },
	shadowBlur:        4,       // Width of shadows.
	
	// Color options:		
	headerHeight:      25,               // Height of window titlebar
	footerHeight:      27,
	cornerRadius:      10,
	bodyBgColor:	   '#fff',           // Body background color - Hex
	headerStartColor:  [250, 250, 250],  // Header gradient's top color - RGB
	headerStopColor:   [229, 229, 229],  // Header gradient's bottom color
	footerBgColor:     [229, 229, 229],	 // Background color of the main canvas shape
	minimizeColor:     [250, 250, 250],  // Minimize button color
	maximizeColor:     [250, 250, 250],  // Maximize button color
	closeColor:        [250, 250, 250],  // Close button color
	resizableColor:    [254, 254, 254],  // Resizable icon color

	// Events
	onBeforeBuild:     $empty,  // Fired just before the window is built.
	onContentLoaded:   $empty,  // Fired when content is successfully loaded via XHR or Iframe.
	onFocus:           $empty,  // Fired when the window is focused.
	onBlur:            $empty,  // Fired when window loses focus. NOT YET IMPLEMENTED.
	onResize:          $empty,  // Fired when the window is resized.
	onMinimize:        $empty,  // Fired when the window is minimized.
	onMaximize:        $empty,  // Fired when the window is maximized.
	onRestore:         $empty,  // Fired when a window is restored from minimized or maximized. NOT YET IMPLEMENTED.
	onClose:           $empty,  // Fired just before the window is closed.
	onCloseComplete:   $empty   // Fired after the window is closed.
};

MochaUI.Window = new Class({
	options: windowOptions,
	initialize: function(options){
		this.setOptions(options);
		
		// Private properties
		this.accordianTimer     = ''; // Used with accordian - should go somewhere else maybe?
		this.mochaControlsWidth = 0;
		this.minimizebuttonX    = 0;  // Minimize button horizontal position
		this.maximizebuttonX    = 0;  // Maximize button horizontal position
		this.closebuttonX       = 0;  // Close button horizontal position
		this.HeaderFooterShadow = this.options.headerHeight + this.options.footerHeight + (this.options.shadowBlur * 2);
		this.oldTop             = 0;
		this.oldLeft            = 0;

		// Always use close buttons for modal windows
		this.options.closable  =  this.options.closable || this.options.modal;

		// Minimizable, dock is required and window cannot be modal
		this.minimizable = MochaUI.options.dock && this.options.minimizable && !this.options.modal;

		// Maximizable, desktop is required
		this.maximizable = MochaUI.Desktop.desktop && this.options.maximizable && !this.options.modal;
		this.iframe      = this.options.loadMethod == 'iframe' ? true : false;

		this.isMaximized = false;
		this.isMinimized = false;

		this.windowEl = $(this.options.id);
		
		// Run methods	
		this.newWindow();
		
		// Return window object
		return this;
	},
	saveValues: function(){
		//var currentWindowClass = MochaUI.Windows.instances.get(this.options.id);		
		this.options.x = this.windowEl.getStyle('left').toInt();
		this.options.y = this.windowEl.getStyle('top').toInt();
		//currentWindowClass.options.x = this.windowEl.getStyle('left');
		//currentWindowClass.options.y = this.windowEl.getStyle('top');	
	},	
	/*
	
	Internal Function: newWindow
	
	Arguments: 
		properties

	*/	
	newWindow: function(properties){ // options is not doing anything
		
		// Here we check to see if there is already a class instance for this window
		if (MochaUI.Windows.instances.get(this.options.id)){			
			var currentWindowClass = MochaUI.Windows.instances.get(this.options.id);		
		}
		
		// Check if window already exists and is not in progress of closing
		if ( this.windowEl && !this.isClosing ) {
			if (currentWindowClass.isMinimized) { // If minimized -> restore
				MochaUI.Dock.restoreMinimized(this.windowEl);
			}
			else { // else focus
				setTimeout(MochaUI.focusWindow.pass(this.windowEl, this),10);	
			}
			return;
		}
		else {			
			MochaUI.Windows.instances.set(this.options.id, this);
		}
		
		this.isClosing = false;
		
		this.fireEvent('onBeforeBuild');		
		
		// Create window div
		this.windowEl = new Element('div', {
			'class': 'mocha',
			'id':    this.options.id && this.options.id != null ? this.options.id : 'win' + (++MochaUI.windowIDCount),
			'styles': {
				'width':   this.options.width,
				'height':  this.options.height,
				'display': 'block',
				'opacity': 0
			}
		});		

		this.windowEl.addClass(this.options.addClass);		

		// Part of fix for scrollbar issues in Mac FF2
		if (Browser.Platform.mac && Browser.Engine.gecko){
			this.windowEl.setStyle('position', 'fixed');	
		}

		if (this.options.loadMethod == 'iframe') {
			// Iframes have their own scrollbars and padding.
			this.options.scrollbars = false;
			this.options.padding = { top: 0, right: 0, bottom: 0, left: 0 };
		}
		
		// Insert sub elements inside windowEl and cache them locally while creating the new window
		this.insertWindowElements();
		
		// Set title		
		this.titleEl.set('html',this.options.title);

		// Add content to window
		switch(this.options.loadMethod) {
			case 'xhr':
				new Request.HTML({
					url: this.options.contentURL,
					update: this.contentEl,
					evalScripts: this.options.evalScripts,
					evalResponse: this.options.evalResponse,
					onRequest: function(){
						this.showLoadingIcon(this.canvasIconEl);
					}.bind(this),
					onFailure: function(){
						this.contentEl.set('html','<p><strong>Error Loading XMLHttpRequest</strong></p><p>Make sure all of your content is uploaded to your server, and that you are attempting to load a document from the same domain as this page. XMLHttpRequests will not work on your local machine.</p>');
						this.hideLoadingIcon.delay(150, this, this.canvasIconEl);
					}.bind(this),
					onSuccess: function() {
						this.hideLoadingIcon.delay(150, this, this.canvasIconEl);
						this.fireEvent('onContentLoaded', this.windowEl);
					}.bind(this)
				}).get();
				break;
			case 'iframe':
				if ( this.options.contentURL == '') {
					break;
				}
				this.iframeEl = new Element('iframe', {
					'id': this.options.id + '_iframe', 
					'class': 'mochaIframe',
					'src': this.options.contentURL,
					'marginwidth':  0,
					'marginheight': 0,
					'frameBorder':  0,
					'scrolling':    'auto'
				}).injectInside(this.contentEl);
				
				// Add onload event to iframe so we can stop the loading icon and run onContentLoaded()
				this.iframeEl.addEvent('load', function(e) {
					this.hideLoadingIcon.delay(150, this, this.canvasIconEl);
					this.fireEvent('onContentLoaded', this.windowEl);
				}.bind(this));
				this.showLoadingIcon(this.canvasIconEl);
				break;
			case 'html':
			default:
				this.contentEl.set('html', this.options.content);
				this.fireEvent('onContentLoaded', this.windowEl);
				break;
		}

		// Set scrollbars, always use 'hidden' for iframe windows
		this.contentWrapperEl.setStyles({
			'overflow': this.options.scrollbars && !this.options.iframe ? 'auto' : 'hidden',
			'background': this.options.bodyBgColor
		});

		// Set content padding
		this.contentEl.setStyles({
			'padding-top': this.options.padding.top,
			'padding-bottom': this.options.padding.bottom,
			'padding-left': this.options.padding.left,
			'padding-right': this.options.padding.right
		});

		// Inject window into DOM		
		if (!this.options.container){
			this.options.container = MochaUI.Desktop.desktop ? MochaUI.Desktop.desktop : document.body;			 
		}

		this.windowEl.injectInside(this.options.container);
		this.drawWindow(this.windowEl);

		// Attach events to the window
		this.attachDraggable(this.windowEl, this.titleBarEl);		
		this.attachResizable(this.windowEl);
		this.setupEvents(this.windowEl);

		// Move new window into position. If position not specified by user then center the window on the page.
		// We do this last so that the effects are as smooth as possible, not interrupted by other functions.
		var dimensions = document.getCoordinates();

		if (!this.options.y) {
			var windowPosTop = (dimensions.height * .5) - ((this.options.height + this.HeaderFooterShadow) * .5);
		}
		else {
			var windowPosTop = this.options.y - this.options.shadowBlur;
		}

		if (!this.options.x) {
			var windowPosLeft =	(dimensions.width * .5) - (this.options.width * .5);
		}
		else {
			var windowPosLeft = this.options.x - this.options.shadowBlur;
		}

		this.windowEl.setStyles({
			'top': windowPosTop,
			'left': windowPosLeft
		});

		if (MochaUI.options.useEffects == true){
			this.windowEl.opacityMorph = new Fx.Morph(this.windowEl, {
				'duration': 500 // !!! Todo: need to draw windows without shadows in IE, and then with them.
			});
		}

		if (this.options.modal) {
			$('mochaModalOverlay').setStyle('display', 'block');
			if (MochaUI.options.useEffects == false){			
				$('mochaModalOverlay').setStyle('opacity', .55);
				this.windowEl.setStyles({
					'zIndex': 11000,
					'opacity': 1
				});			
			}
			else {
				MochaUI.Modal.modalOverlayCloseMorph.cancel();
				MochaUI.Modal.modalOverlayOpenMorph.start({
					'opacity': .55
				});
				this.windowEl.setStyles({
					'zIndex': 11000
				});				
				this.windowEl.opacityMorph.start({
					'opacity': 1
				});				
			}
		}
		else if (MochaUI.options.useEffects == false){
			this.windowEl.setStyle('opacity', 1);
		}
		else {
			this.windowEl.opacityMorph.start({
				'opacity': 1
			});
			setTimeout(MochaUI.focusWindow.pass(this.windowEl, this),10);
		}
		
		// Add check mark to menu if link exists in menu
		// Need to make sure the check mark is not added to links not in menu
						
		if ($(this.windowEl.id + 'LinkCheck')){
			this.check = new Element('div', {
				'class': 'check',
				'id': this.options.id + '_check'
			}).injectInside(this.windowEl.id + 'LinkCheck');
		}

	},	
	setupEvents: function(windowEl) {

		// Set events
		// Note: if a button does not exist, its due to properties passed to newWindow() stating otherwice
		if ( this.closeButtonEl )
			this.closeButtonEl.addEvent('click', function() { MochaUI.closeWindow(windowEl); }.bind(this));

		if ( !this.options.modal )		
			windowEl.addEvent('click', function() { MochaUI.focusWindow(windowEl); }.bind(this));

		if ( this.minimizeButtonEl )
			this.minimizeButtonEl.addEvent('click', function() { MochaUI.Dock.minimizeWindow(windowEl); }.bind(this));

		if ( this.maximizeButtonEl ) {
			this.maximizeButtonEl.addEvent('click', function() { 
				if ( this.isMaximized ) {
					MochaUI.Desktop.restoreWindow(windowEl);
					this.maximizeButtonEl.setProperty('title', 'Maximize');
				} else {
					MochaUI.Desktop.maximizeWindow(windowEl); 
					this.maximizeButtonEl.setProperty('title', 'Restore');
				}
			}.bind(this));
		}
	},
	/*
	
	Internal Function: attachDraggable()
		make window draggable
		
	Arguments:
		windowEl
		
	*/
	attachDraggable: function(windowEl, handleEl){
		if ( !this.options.draggable )
			return;
		new Drag.Move(windowEl, {
			handle: handleEl,
			container: this.options.restrict ? $(this.options.container) : false,			
			grid: this.options.draggableGrid,
			limit: this.options.draggableLimit,
			snap: this.options.draggableSnap,
			onStart: function() {
				if (!this.options.modal){ 
					MochaUI.focusWindow(windowEl);
				}
				if ( this.iframe )
					this.iframeEl.setStyle('visibility', 'hidden');
			}.bind(this),
			onComplete: function() {
				if ( this.iframe ){
					this.iframeEl.setStyle('visibility', 'visible');
				}
				// Store new position in options.
				this.saveValues();
				// Used by the shadow blur slider to adjust window position in relation to shadow width
				//alert(windowEl.adjusted);
				//currentWindowClass = MochaUI.Windows.instances.get(windowEl.id);
				//currentWindowClass.adjusted = false;
				//if (currentWindowClass.adjusted == true) {
					currentWindowClass.moved = true;
				//}
			}.bind(this)
		});
	},
	/*
	
	Internal Function: attachResizable
		Make window resizable.
		
	Arguments:
		windowEl
		
	*/
	attachResizable: function(windowEl){
		if ( !this.options.resizable )
			return;
		this.contentWrapperEl.makeResizable({
			handle: this.resizeHandleEl,		
			modifiers: {
				x: 'width',
				y: 'height'
			},
			limit: {
				x: this.options.resizableLimitX,
				y: this.options.resizableLimitY
			},
			onStart: function() {
				if ( this.iframeEl )
					this.iframeEl.setStyle('visibility', 'hidden');
			}.bind(this),
			onDrag: function() {
				this.drawWindow(windowEl);
			}.bind(this),
			onComplete: function() {
				if ( this.iframeEl )
					this.iframeEl.setStyle('visibility', 'visible');
				this.fireEvent('onResize', windowEl);
			}.bind(this)
		});
	},
	/*
	
	Internal Function: insertWindowElements
	
	Arguments:
		windowEl
			
	*/
	insertWindowElements: function(){
		
		var height = this.options.height;
		var width = this.options.width;
		
		if (Browser.Engine.trident4){
			this.zIndexFixEl = new Element('iframe', {
				'class': 'zIndexFix',
				'scrolling': 'no',
				'marginWidth': 0,
				'marginHeight': 0,
				'src': '',
				'id': this.options.id + '_zIndexFix'
			}).injectInside(this.windowEl);
		}

		this.overlayEl = new Element('div', {
			'class': 'mochaOverlay',
			'id': this.options.id + '_overlay'
		}).injectInside(this.windowEl);

		//Insert mochaTitlebar
		this.titleBarEl = new Element('div', {
			'class': 'mochaTitlebar',
			'id': this.options.id + '_titleBar',
			'styles': {
				'cursor': this.options.draggable ? 'move' : 'default'
			}
		}).injectTop(this.overlayEl);

		// Create window header
		this.titleEl = new Element('h3', {
			'class': 'mochaTitle',
			'id': this.options.id + '_title'
		}).injectInside(this.titleBarEl);
		
		this.contentBorderEl = new Element('div', {
			'class': 'mochaContentBorder',
			'id': this.options.id + '_contentBorder'
		}).injectInside(this.overlayEl);		
		
		this.contentWrapperEl = new Element('div', {
			'class': 'mochaContentWrapper',
			'id': this.options.id + '_contentWrapper',
			'styles': {
				'width': width + 'px',
				'height': height + 'px'
			}
		}).injectInside(this.contentBorderEl);

		this.contentEl = new Element('div', {
			'class': 'mochaContent',
			'id': this.options.id + '_content'
		}).injectInside(this.contentWrapperEl);

		//Insert canvas
		this.canvasEl = new Element('canvas', {
			'class': 'mochaCanvas',
			'width': 1,
			'height': 1,
			'id': this.options.id + '_canvas'
		}).injectInside(this.windowEl);

		// Dynamically initialize canvas using excanvas. This is only required by IE
		if ( Browser.Engine.trident && MochaUI.ieSupport == 'excanvas'  ) {
			G_vmlCanvasManager.initElement(this.canvasEl);
			// This is odd, .getContext() method does not exist before retrieving the
			// element via getElement
			this.canvasEl = this.windowEl.getElement('.mochaCanvas');
		}

		//Insert resize handles
		if (this.options.resizable){
			this.resizeHandleEl = new Element('div', {
				'class': 'resizeHandle',
				'id': this.options.id + '_resizeHandle'
			}).injectAfter(this.overlayEl);
			
			if ( Browser.Engine.trident ){
				this.resizeHandleEl.setStyle('zIndex', 2);
			}
		}
		
		//Insert mochaTitlebar controls
		this.controlsEl = new Element('div', {
			'class': 'mochaControls',
			'id': this.options.id + '_controls'
		}).injectAfter(this.overlayEl);
		
		//Insert close button
		if (this.options.closable){
			this.closeButtonEl = new Element('div', {
				'class': 'mochaClose',
				'title': 'Close Window',
				'id': this.options.id + '_closeButton'
			}).injectInside(this.controlsEl);
		}

		//Insert maximize button
		if (this.maximizable){
			this.maximizeButtonEl = new Element('div', {
				'class': 'maximizeToggle',
				'title': 'Maximize',
				'id': this.options.id + '_maximizeButton'
			}).injectInside(this.controlsEl);
		}
		//Insert minimize button
		if (this.minimizable){
			this.minimizeButtonEl = new Element('div', {
				'class': 'minimizeToggle',
				'title': 'Minimize',
				'id': this.options.id + '_minimizeButton'
			}).injectInside(this.controlsEl);
		}
		
		//Insert canvas
		this.canvasIconEl = new Element('canvas', {
			'class': 'mochaLoadingIcon',
			'width': 18,
			'height': 18,
			'id': this.options.id + '_canvasIcon'
		}).injectBottom(this.windowEl);	
		
		// Dynamically initialize canvas using excanvas. This is only required by IE
		if (Browser.Engine.trident && MochaUI.ieSupport == 'excanvas') {
			G_vmlCanvasManager.initElement(this.canvasIconEl);
			// This is odd, .getContext() method does not exist before retrieving the
			// element via getElement
			this.canvasIconEl = this.windowEl.getElement('.mochaLoadingIcon');
		}

		if ( Browser.Engine.trident ) {
			this.controlsEl.setStyle('zIndex', 2);
			this.overlayEl.setStyle('zIndex', 2);
		}

		// For Mac Firefox 2 to help reduce scrollbar bugs in that browser
		if (Browser.Platform.mac && Browser.Engine.gecko) {
			this.overlayEl.setStyle('overflow', 'auto');
		}
		this.setMochaControlsWidth();
		
	},
	/*

	Internal function: drawWindow
		This is where we create the canvas GUI	

	Arguments: 
		windowEl: the $(window)
		shadows: (boolean) false will draw a window without shadows

	*/	
	drawWindow: function(windowEl, shadows) {
		
		this.contentBorderEl.setStyles({
			'width': this.contentWrapperEl.offsetWidth
		});

		// Resize iframe when window is resized
		if ( this.iframe ) {
			this.iframeEl.setStyles({
				'height': this.contentWrapperEl.offsetHeight
			});
		}

		this.HeaderFooterShadow = this.options.headerHeight + this.options.footerHeight + (this.options.shadowBlur * 2);
		var height = this.contentWrapperEl.getStyle('height').toInt() + this.HeaderFooterShadow;
		var width = this.contentWrapperEl.getStyle('width').toInt() + (this.options.shadowBlur * 2);

		this.windowEl.setStyle('height', height);
		
		/* this.windowEl.setStyles({
			'height': height,
			'top': this.options.y - this.options.shadowBlur,
			'left': this.options.x - this.options.shadowBlur
		}); */		
		
		this.overlayEl.setStyles({
			'height': height,
			'top': this.options.shadowBlur,
			'left': this.options.shadowBlur
		});		

		// If opera height and width must be set like this, when resizing:
		this.canvasEl.height = Browser.Engine.webkit ? 4000 : height;
		this.canvasEl.width = Browser.Engine.webkit ? 2000 : width;

		// Part of the fix for IE6 select z-index bug and FF on Mac scrollbar z-index bug
		if ( Browser.Engine.trident4 ){
			this.zIndexFixEl.setStyles({
				'width': width,
				'height': height
			})
		}

		// Set width
		this.windowEl.setStyle('width', width);
		this.overlayEl.setStyle('width', width);
		this.titleBarEl.setStyles({
			'width': width - (this.options.shadowBlur * 2),
			'height': this.options.headerHeight
		});

		// Draw shapes
		var ctx = this.canvasEl.getContext('2d');
		var dimensions = document.getCoordinates();
		ctx.clearRect(0, 0, dimensions.width, dimensions.height);
		
		// This is the drop shadow. It is created onion style with three layers
		if ( shadows != false ) {	

		this.options.shadowBlur	
			for (var x = 0; x <= this.options.shadowBlur; x++){
				MochaUI.roundedRect(ctx, x, x, width - (x * 2), height - (x * 2), this.options.cornerRadius + (this.options.shadowBlur - x), [0, 0, 0], x == this.options.shadowBlur ? .3 : .06 + (x * .01) );
			}
		}
		
		// Make sure controls are placed correctly.
		this.controlsEl.setStyles({
			'right': this.options.shadowBlur + 5,
			'top': this.options.shadowBlur + 5	
		})
		
		// Make sure loading icon is placed correctly.
		this.canvasIconEl.setStyles({
			'left': this.options.shadowBlur + 3,
			'bottom': this.options.shadowBlur + 4
		})
		
		// Mocha body
		this.bodyRoundedRect(
			ctx,                                    // context
			this.options.shadowBlur,                // x
			this.options.shadowBlur - 1,            // y
			width - (this.options.shadowBlur * 2),  // width
			height - (this.options.shadowBlur * 2), // height
			this.options.cornerRadius,              // corner radius
			this.options.footerBgColor              // Footer color
		);

		// Mocha header
		this.topRoundedRect(
			ctx,                                   // context
			this.options.shadowBlur,               // x
			this.options.shadowBlur - 1,           // y
			width - (this.options.shadowBlur * 2), // width
			this.options.headerHeight,             // height
			this.options.cornerRadius,             // corner radius
			this.options.headerStartColor,         // Header gradient's top color
			this.options.headerStopColor           // Header gradient's bottom color
		);

		// Calculate X position for controlbuttons
		this.closebuttonX = width - (this.options.closable ? (this.options.shadowBlur + 12) : (this.options.shadowBlur - 7));
		this.maximizebuttonX = this.closebuttonX - (this.maximizable ? 19 : 0);
		this.minimizebuttonX = this.maximizebuttonX - (this.minimizable ? 19 : 0);

		if ( this.options.closable )
			this.closebutton(ctx, this.closebuttonX, (this.options.shadowBlur + 12), this.options.closeColor, 1.0);
		if ( this.maximizable )
			this.maximizebutton(ctx, this.maximizebuttonX, (this.options.shadowBlur + 12), this.options.maximizeColor, 1.0);
		if ( this.minimizable )
			this.minimizebutton(ctx, this.minimizebuttonX, (this.options.shadowBlur + 12), this.options.minimizeColor, 1.0); // Minimize
		if ( this.options.resizable ) 
			MochaUI.triangle(ctx, width - (this.options.shadowBlur + 17), height - (this.options.shadowBlur + 18), 12, 12, this.options.resizableColor, 1.0); // Resize handle

		// Invisible dummy object. The last element drawn is not rendered consistently while resizing in IE6 and IE7
		MochaUI.triangle(ctx, 0, 0, 10, 10, this.options.resizableColor, 0);	

	},
	// Window body
	bodyRoundedRect: function(ctx, x, y, width, height, radius, rgb){
		ctx.fillStyle = 'rgba(' + rgb.join(',') + ', 100)';
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
	topRoundedRect: function(ctx, x, y, width, height, radius, headerStartColor, headerStopColor){

		// Create gradient
		if (Browser.Engine.presto != null ){
			var lingrad = ctx.createLinearGradient(0, 0, 0, this.options.headerHeight + 2);
		}
		else {
			var lingrad = ctx.createLinearGradient(0, 0, 0, this.options.headerHeight);
		}

		lingrad.addColorStop(0, 'rgba(' + headerStartColor.join(',') + ', 100)');
		lingrad.addColorStop(1, 'rgba(' + headerStopColor.join(',') + ', 100)');
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
	maximizebutton: function(ctx, x, y, rgb, a){ // This could reuse the circle method above
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
	closebutton: function(ctx, x, y, rgb, a){ // This could reuse the circle method above
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
	minimizebutton: function(ctx, x, y, rgb, a){ // This could reuse the circle method above
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
	hideLoadingIcon: function(canvas) {
		if (!MochaUI.options.useLoadingIcon) return;		
		$(canvas).setStyle('display', 'none');		
		$clear(canvas.iconAnimation);
	},
	showLoadingIcon: function(canvas) {
		if (!MochaUI.options.useLoadingIcon) return;		
		
		$(canvas).setStyles({
			'display': 'block'
		});		
		var t = 1;	  	
		var iconAnimation = function(canvas){ 
			var ctx = $(canvas).getContext('2d');
			ctx.clearRect(0, 0, 18, 18); // Clear canvas
			ctx.save();
			ctx.translate(9, 9);
			ctx.rotate(t*(Math.PI / 8));	
			var color = 0;
			for (i=0; i < 8; i++){ // Draw individual dots
				color = Math.floor(255 / 8 * i);
				ctx.fillStyle = "rgb(" + color + "," + color + "," + color + ")";
				ctx.rotate(-Math.PI / 4);
				ctx.beginPath();
				ctx.arc(0, 7, 2, 0, Math.PI*2, true);
				ctx.fill();
			}
				ctx.restore();
			t++;
		}.bind(this);
		canvas.iconAnimation = iconAnimation.periodical(125, this, canvas);
	},	
	setMochaControlsWidth: function(){
		var controlWidth = 14;
		var marginWidth = 5;
		this.mochaControlsWidth = 0;
		if ( this.minimizable )
			this.mochaControlsWidth += (marginWidth + controlWidth);
		if ( this.maximizable ) {
			this.mochaControlsWidth += (marginWidth + controlWidth);
			this.maximizeButtonEl.setStyle('margin-left', marginWidth);
		}
		if ( this.options.closable ) {
			this.mochaControlsWidth += (marginWidth + controlWidth);
			this.closeButtonEl.setStyle('margin-left', marginWidth);
		}
		this.controlsEl.setStyle('width', this.mochaControlsWidth);
	}
});
MochaUI.Window.implement(new Options, new Events);
