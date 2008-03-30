/* 

Script: Core.js
	MochaUI - A Web Applications User Interface Framework.
	
Copyright:
	Copyright (c) 2007-2008 Greg Houston, <http://greghoustondesign.com/>.
	
License:
	MIT-style license.

Contributors:
	Scott F. Frederick
	Joel Lindau
	
Todo:		
	- Tab to toggle window visibility
	- Make dock buttons sortable
	
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
	windowsVisible: true, // Ctrl-Tab to toggle window visibility
	/*
	
	Function: closeWindow
	
	Arguments: 
		el: the $(window) to be closed
		
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
		currentWindowClass.fireEvent('onClose');

		if (MochaUI.options.useEffects == false){
			if (currentWindowClass.options.modal) {
				$('mochaModalOverlay').setStyle('opacity', 0);
			}
			windowEl.destroy();
			currentWindowClass.fireEvent('onCloseComplete');
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
		MochaUI.Windows.instances.each(function(instance) {		
			MochaUI.Windows.instances.empty();
		}.bind(this));		
		$$('div.mochaDockButton').destroy();		
		return true;
	},
	/*
	
	Function: toggleWindowVisibility
	
	Todo: Don't toggle modal visibility. If new window is created make all windows visible except for
	those that are minimized. If window is restored from dock make all windows visible except for any
	others that are still minimized.

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
		currentWindowClass.fireEvent('onFocus');
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
	/*
	
	Function: saveWorkspace
	
	Note: NOT YET IMPLEMENTED. If you want to work on this let me know.

	*/	
	saveWorkspace: function(){

		var mochaUIcookie = new Hash.Cookie('mochaUIworkspaceCookie', {duration: 3600});

	},
	/*
	
	Function: garbageCleanup
	
	Description: Empties all windows of their children, and removes and garbages the windows.
	It is does not trigger onClose() or onCloseComplete().
	This is useful to clear memory before the pageUnload. 
	
	*/	
	garbageCleanUp: function() {
		$$('div.mocha').each(function(el) {
			el.destroy();
		}.bind(this));		
	}	
});


/*

Script: Window.js
	Contains Function Prototypes like create, bind, pass, and delay.

License:
	MIT-style license.	

*/
   
/*
Class: MochaUI.Window
	Creates a single MochaUI window	

Example:
	new MochaUI.Window();

*/   
   

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
	
	// Events
	onContentLoaded:   $empty,  // Event, fired when content is successfully loaded via XHR.
	onFocus:           $empty,  // Event, fired when the window is focused.
	onResize:          $empty,  // Event, fired when the window is resized.
	onMinimize:        $empty,  // Event, fired when the window is minimized.
	onMaximize:        $empty,  // Event, fired when the window is maximized.
	onClose:           $empty,  // Event, fired just before the window is closed.
	onCloseComplete:   $empty,  // Event, fired after the window is closed.
	
	// Style options:
	addClass:          null,    // Add a class to your window to give you more control over styling.	
	width:             300,
	height:            125,
	x:                 null,
	y:                 null,
	scrollbars:        true,
	padding:   		   { top: 10, right: 12, bottom: 10, left: 12 },
	
	// Color options:		
	headerHeight:      25,               // Height of window titlebar
	footerHeight:      26,
	cornerRadius:      9,
	bodyBgColor:	   '#fff',           // Body background color - Hex
	headerStartColor:  [250, 250, 250],  // Header gradient's top color - RGB
	headerStopColor:   [228, 228, 228],  // Header gradient's bottom color
	footerBgColor:     [246, 246, 246],	 // Background color of the main canvas shape
	minimizeColor:     [230, 230, 210],  // Minimize button color
	maximizeColor:     [218, 230, 218],  // Maximize button color
	closeColor:        [230, 218, 218],  // Close button color
	resizableColor:    [209, 209, 209]   // Resizable icon color
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
		this.shadowWidth        = 3;
		this.shadowOffset       = this.shadowWidth * 2;
		this.HeaderFooterShadow = this.options.headerHeight + this.options.footerHeight + this.shadowOffset;
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
	},
	/*
	
	Method: newWindow
	
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
			else // else focus
				setTimeout(function(){ MochaUI.focusWindow(this.windowEl); }.bind(this),10);
			return;
		}
		else {
			MochaUI.Windows.instances.set(this.options.id, this);
		}
		
		this.isClosing = false;
		
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
						this.fireEvent('onContentLoaded');
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
					this.fireEvent('onContentLoaded');
				}.bind(this));
				this.showLoadingIcon(this.canvasIconEl);
				break;
			case 'html':
			default:
				this.contentEl.set('html', this.options.content);
				this.fireEvent('onContentLoaded');
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

		this.windowEl.injectInside(MochaUI.Desktop.desktop ? MochaUI.Desktop.desktop : document.body);
		this.drawWindow(this.windowEl);

		// Attach events to the window
		this.attachResizable(this.windowEl);
		this.setupEvents(this.windowEl);

		// Drag.Move() does not work in IE until element has been injected, thus setting here
		this.attachDraggable(this.windowEl, this.titleBarEl);
		
		// Move new window into position. If position not specified by user then center the window on the page.
		// We do this last so that the effects are as smooth as possible, not interrupted by other functions.
		var dimensions = document.getCoordinates();

		if (!this.options.y) {
			var windowPosTop = (dimensions.height * .5) - ((this.options.height + this.HeaderFooterShadow) * .5);
		}
		else {
			var windowPosTop = this.options.y
		}

		if (!this.options.x) {
			var windowPosLeft =	(dimensions.width * .5) - (this.options.width * .5);
		}
		else {
			var windowPosLeft = this.options.x
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
			setTimeout(function(){ MochaUI.focusWindow(this.windowEl); }.bind(this), 10);
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
	/* -- START Private Methods -- */
	
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
		Method: attachDraggable()
		Description: make window draggable
		Usage: internal
		
		Arguments:
			windowEl
	*/
	attachDraggable: function(windowEl, handleEl){
		if ( !this.options.draggable )
			return;
		new Drag.Move(windowEl, {
			handle: handleEl,
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
				if ( this.iframe )
					this.iframeEl.setStyle('visibility', 'visible');
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
				this.fireEvent('onResize');
			}.bind(this)
		});
	},
	/*
		Method: insertWindowElements
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
			
			if ( Browser.Engine.trident )
				this.resizeHandleEl.setStyle('zIndex', 2);
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
			this.controlsEl.setStyle('zIndex', 2)
			this.overlayEl.setStyle('zIndex', 2)
		}

		// For Mac Firefox 2 to help reduce scrollbar bugs in that browser
		if (Browser.Platform.mac && Browser.Engine.gecko)
			this.overlayEl.setStyle('overflow', 'auto');
		this.setMochaControlsWidth(this.windowEl);
		
	},
	/*

	Function: drawWindow()

	Arguments: 
		windowEl: the $(window)
		shadows: (boolean) false will draw a window without shadows

	Notes: This is where we create the canvas GUI	

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

		var height = this.contentWrapperEl.getStyle('height').toInt() + this.HeaderFooterShadow;
		var width = this.contentWrapperEl.getStyle('width').toInt() + this.shadowOffset;

		this.overlayEl.setStyle('height', height);
		this.windowEl.setStyle('height', height);

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
			'width': width - this.shadowOffset,
			'height': this.options.headerHeight
		});

		// Draw shapes
		var ctx = this.canvasEl.getContext('2d');
		var dimensions = document.getCoordinates();
		ctx.clearRect(0, 0, dimensions.width, dimensions.height);
		
		// This is the drop shadow. It is created onion style with three layers
		if ( shadows != false ) {
			MochaUI.roundedRect(ctx, 0, 0, width, height, this.options.cornerRadius, [0, 0, 0], 0.06);
			MochaUI.roundedRect(ctx, 1, 1, width - 2, height - 2, this.options.cornerRadius, [0, 0, 0], 0.08);
			MochaUI.roundedRect(ctx, 2, 2, width - 4, height - 4, this.options.cornerRadius, [0, 0, 0], 0.3);
		}
		
		// Mocha body
		this.bodyRoundedRect(
			ctx,                         // context
			this.shadowWidth,            // x
			this.shadowWidth,            // y
			width - this.shadowOffset,   // width
			height - this.shadowOffset,  // height
			this.options.cornerRadius,   // corner radius
			this.options.footerBgColor   // Footer color
		);

		// Mocha header
		this.topRoundedRect(
			ctx,                            // context
			this.shadowWidth,               // x
			this.shadowWidth,               // y
			width - this.shadowOffset,      // width
			this.options.headerHeight,      // height
			this.options.cornerRadius,      // corner radius
			this.options.headerStartColor,  // Header gradient's top color
			this.options.headerStopColor    // Header gradient's bottom color
		);

		// Calculate X position for controlbuttons
		this.closebuttonX = width - (this.options.closable ? 15 : -4);
		this.maximizebuttonX = this.closebuttonX - (this.maximizable ? 19 : 0);
		this.minimizebuttonX = this.maximizebuttonX - (this.minimizable ? 19 : 0);

		if ( this.options.closable )
			this.closebutton(ctx, this.closebuttonX, 15, this.options.closeColor, 1.0);
		if ( this.maximizable )
			this.maximizebutton(ctx, this.maximizebuttonX, 15, this.options.maximizeColor, 1.0);
		if ( this.minimizable )
			this.minimizebutton(ctx, this.minimizebuttonX, 15, this.options.minimizeColor, 1.0); // Minimize
		if ( this.options.resizable ) 
			MochaUI.triangle(ctx, width - 20, height - 20, 12, 12, this.options.resizableColor, 1.0); // Resize handle

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
	setMochaControlsWidth: function(windowEl){
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
	},
	dynamicResize: function (windowEl){
			this.contentWrapperEl.setStyle('height', this.contentEl.offsetHeight);
			this.drawWindow(windowEl);
	}
});
MochaUI.Window.implement(new Options, new Events);

/* -----------------------------------------------------------------

Script: Modal.js
	Contains Function Prototypes like create, bind, pass, and delay.

License:
	MIT-style license.	

Plugin: MochaUI.Modal

Requirements:
	MochaUI.Window, MochaUI

   ----------------------------------------------------------------- */

MochaUI.Modal = new Class({
	Extends: MochaUI.Window,
	
	Implements: [Events, Options],
	initialize: function(options){
		this.modalInitialize();
		this.installed = true;
		
		window.addEvent('resize', function(){
			this.setModalSize();
		}.bind(this));

	},
	modalInitialize: function(){
		var modalOverlay = new Element('div', {
			'id': 'mochaModalOverlay',
			'styles': {
				'height': document.getCoordinates().height
			}
		});
		modalOverlay.injectInside(MochaUI.Desktop.desktop ? MochaUI.Desktop.desktop : document.body);
		
		modalOverlay.setStyle('opacity', .4);
		this.modalOverlayOpenMorph = new Fx.Morph($('mochaModalOverlay'), {
				'duration': 200
				});
		this.modalOverlayCloseMorph = new Fx.Morph($('mochaModalOverlay'), {
			'duration': 200,
			onComplete: function(){
				$('mochaModalOverlay').setStyle('display', 'none');
			}.bind(this)
		});
	},
	setModalSize: function(){
		$('mochaModalOverlay').setStyle('height', document.getCoordinates().height);
	}
});
MochaUI.Modal.implement(new Options, new Events);

/* -----------------------------------------------------------------

	Plugin: MochaUI.Desktop

	Requirements: MochaUI.Window, MochaUI

   ----------------------------------------------------------------- */

MochaUI.Desktop = new Class({
	Extends: MochaUI.Window,
	
	Implements: [Events, Options],
	
	options: {
		// Naming options:
		// If you change the IDs of the Mocha Desktop containers in your HTML, you need to change them here as well.
		desktop:               'mochaDesktop',
		desktopHeader:         'mochaDesktopHeader',
		desktopNavBar:         'mochaDesktopNavbar',
		pageWrapper:           'mochaPageWrapper',
		page:                  'mochaPage',
		sidebarWrapper:        'mochaSidebarWrapper',		
		sidebar:               'mochaSidebar',
		sidebarContentWrapper: 'mochaSidebarContentWrapper',		
		sidebarMinimize:       'mochaSidebarMinimize',
		sidebarHandle:         'mochaSidebarHandle'		
	},	
	initialize: function(options){
		this.setOptions(options);
		this.desktop               = $(this.options.desktop);
		this.desktopHeader         = $(this.options.desktopHeader);
		this.desktopNavBar         = $(this.options.desktopNavBar);
		this.pageWrapper           = $(this.options.pageWrapper);
		this.page                  = $(this.options.page);
		this.sidebarWrapper        = $(this.options.sidebarWrapper);		
		this.sidebar               = $(this.options.sidebar);
		this.sidebarContentWrapper = $(this.options.sidebarContentWrapper);
		this.sidebarMinimize       = $(this.options.sidebarMinimize);
		this.sidebarHandle         = $(this.options.sidebarHandle);		

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
	menuInitialize: function(){
		// Fix for dropdown menus in IE6
		if (Browser.Engine.trident4 && this.desktopNavBar){
			this.desktopNavBar.getElements('li').each(function(element) {
				element.addEvent('mouseenter', function(){
					this.addClass('ieHover');
				})
				element.addEvent('mouseleave', function(){
					this.removeClass('ieHover');
				})
			})
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

		var mochaDock = $(MochaUI.options.dock);
		
		if ( this.desktop ){
			this.desktop.setStyle('height', windowDimensions.height);
		}

		// Set pageWrapper height so the dock doesn't cover the pageWrapper scrollbars.

		if (this.pageWrapper && this.desktopHeader) {
					
			var dockOffset = MochaUI.dockVisible ? mochaDock.offsetHeight + mochaDock.getStyle('margin-top').toInt() + mochaDock.getStyle('margin-bottom').toInt() + 1 : 0;
			
			var pageWrapperHeight = windowDimensions.height - this.desktopHeader.offsetHeight - dockOffset;
			
			if ( pageWrapperHeight < 0 ) {
				pageWrapperHeight = 0;
			}
			this.pageWrapper.setStyle('height', pageWrapperHeight + 'px');
		}
		
		if (this.sidebar){
			var sidebarBorderOffset = Browser.Engine.trident4 ? 3 : 2;  
			this.sidebarContentWrapper.setStyle('height', pageWrapperHeight - sidebarBorderOffset + 'px');
			this.sidebarMinimize.setStyle('height', pageWrapperHeight - sidebarBorderOffset + 'px');
			this.sidebarHandle.setStyle('height', pageWrapperHeight - sidebarBorderOffset + 'px');			
		}
	},
	/*
	
	Function: MochaUI.Desktop.maximizeWindow()
	
	Requires: MochaUI.Desktop

	*/	
	maximizeWindow: function(windowEl) {

		currentWindowClass = MochaUI.Windows.instances.get(windowEl.id);

		// If window no longer exists or is maximized, stop
		if ( !(windowEl = $(windowEl)) || currentWindowClass.isMaximized )
			return;			

		currentWindowClass.isMaximized = true;

		currentWindowClass.fireEvent('onMaximize');
		
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
				'top': -currentWindowClass.shadowWidth,
				'left': -currentWindowClass.shadowWidth
			});
			contentWrapper.setStyles({
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
				'1': {	'top':  -currentWindowClass.shadowWidth, // Takes shadow width into account
						'left': -currentWindowClass.shadowWidth  // Takes shadow width into account
				}
			});		
		}		

	},
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
		this.sidebar.makeResizable({
			handle: this.sidebarHandle ? this.sidebarHandle : false,
			modifiers: {
				x: 'width',
				y: false				
			},
			limit: {
				x: [180, 280]
			},
			onBeforeStart: function(){
 				// Using postion fixed fixes a minor display glitch while resizing the sidebar in Firefox PC
				// Mac Firefox needs position fixed all the time though it does not render as well as absolute
				if (!Browser.Platform.mac && Browser.Engine.gecko){
					$$('div.mocha').setStyle('position', 'fixed');	
				}
			},
			onBeforeComplete: function(){
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
	sidebarMinimizeToggle: function(){
			if (!this.sidebarIsMinimized){											
				this.sidebar.setStyle('display', 'none');
				this.sidebarHandle.setStyle('display', 'none');
				// Part of IE6 3px jox bug fix			
				if (Browser.Engine.trident4){
					this.sidebarMinimize.setStyle('margin-right', 0);
				}				
				this.sidebarIsMinimized = true;
			}
			else {
				this.sidebar.setStyle('display', 'block');
				this.sidebarHandle.setStyle('display', 'block');
				if (Browser.Engine.trident4){
					this.sidebarMinimize.setStyle('margin-right', 1);
				}				
				this.sidebarIsMinimized = false;
			}		
	}
});
MochaUI.Desktop.implement(new Options, new Events);

/* -----------------------------------------------------------------

	Plugin: MochaUI.Dock

	Requirements: MochaUI.Desktop, MochaUI.Window, MochaUI
	
	Todo: Make it so the dock requires no initial html markup		

   ----------------------------------------------------------------- */

MochaUI.options.extend({
		// Naming options:
		// If you change the IDs of the Mocha Desktop containers in your HTML, you need to change them here as well.
		dock: 'mochaDock'
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
		this.dock          = $(MochaUI.options.dock);
		this.autoHideEvent = null;

		this.dockAutoHide  = false;  // True when dock autohide is set to on, false if set to off

		if ( this.dock ) { this.initializeDock(); }

		MochaUI.Desktop.setDesktopSize();
		
		// Resize desktop, page wrapper, modal overlay, and maximized windows when browser window is resized		
		this.installed     = true;		
	},
	initializeDock: function (){
			this.dock.setStyles({
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
			if (this.dock.getStyle('position') != 'relative'){
				this.dock.setStyles({
					'position':      'relative',
					'bottom':         null
				})
				this.dock.addClass('top');
				MochaUI.Desktop.setDesktopSize();
				this.dock.setProperty('dockPosition','Top');	
				MochaUI.circle(ctx, 5, 4, 3, [0, 255, 0], 1.0); // green
				MochaUI.circle(ctx, 5, 14, 3, [150, 150, 150], 1.0); // gray
				$('mochaDockPlacement').setProperty('title', 'Position Dock Bottom');
				$('mochaDockAutoHide').setProperty('title', 'Auto Hide Disabled in Top Dock Position');
				this.dockAutoHide = false;
			}
			// Move dock to bottom position
			else {
				this.dock.setStyles({
					'position':      'absolute',
					'bottom':        0
				})
				this.dock.removeClass('top');				
				MochaUI.Desktop.setDesktopSize();
				this.dock.setProperty('dockPosition','Bottom');
				MochaUI.circle(ctx, 5, 4, 3, [255, 70, 70], 1.0); // orange
				MochaUI.circle(ctx, 5 , 14, 3, [255, 70, 70], 1.0); // orange 
				$('mochaDockPlacement').setProperty('title', 'Position Dock Top');
				$('mochaDockAutoHide').setProperty('title', 'Turn Auto Hide On');
			}

		}.bind(this));

		// Attach event Auto Hide 
		$('mochaDockAutoHide').addEvent('click', function(event){
			if ( this.dock.getProperty('dockPosition') == 'Top' )
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
							this.dock.setStyle('display', 'block');
							MochaUI.dockVisible = true;
							MochaUI.Desktop.setDesktopSize();
						}
					} else {
						if ( MochaUI.dockVisible ) {
							this.dock.setStyle('display', 'none');
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

/* -----------------------------------------------------------------

	Plugin: MochaUI Workspaces
	
	Requirements: MochaUI.Desktop, MochaUI.Window, MochaUI
	

	Todo: 
		Make an easy way for Workspaces to have different css.
	
		Each screen should be a separate workspace with it's own windows.
	
		Workspaces change the styling of MochaDesktop and which windows are visible and in the dock.
	
		Dynamically create new Workspaces.	

		Workspace content should be loaded like windows are.


   ----------------------------------------------------------------- */

MochaUI.Workspaces = new Class({
	options: {
		index: 0,     // Default screen
		background:   '#8caac7'
	},
	initialize: function(options){
		this.setOptions(options);
		this.setWorkspace(this.options);
		this.currentWorkspace = this.options.index;
	},
	setWorkspace: function(properties) {
		
		// MAKE IF index = current index return
		
		// Merge new options with defaults
		var options = new Hash(this.options);
		options.extend(properties);
		
		if (this.currentWorkspace == options.index) {
			return;
		}
		else {
			this.currentWorkspace = options.index	
		}
		
		if ( !$('mochaWorkspaces') )
			return;
		MochaUI.Desktop.pageWrapper.setStyles({
			'background': options.background ? options.background : options.background					
		})			
		$$('#mochaWorkspaces div.workspace').each(function(el,i) {
			el.setStyle('display', i == options.index ? 'block' : 'none');

			// Add check mark to menu if link exists in menu
			var id = el.getProperty('id');
			if ($(id + 'LinkCheck')){
				if (i == options.index){
					el.check = new Element('div', {
						'class': 'check',
						'id': id + '_check'
					}).injectInside($(id + 'LinkCheck'));
				}
				else {
					if (el.check) el.check.destroy();
				}
			}			
		});		
	}
});
MochaUI.Workspaces.implement(new Options);


/* -----------------------------------------------------------------

	Plugin: NewWindowsFromXHTML

   ----------------------------------------------------------------- */

MochaUI.extend({
	NewWindowsFromXHTML: function(){
		$$('div.mocha').each(function(el) {
			// Get the window title and destroy that element, so it does not end up in window content
			if ( Browser.Engine.presto || Browser.Engine.trident5 )
				el.setStyle('display','block'); // Required by Opera, and probably IE7
			var title = el.getElement('h3.mochaTitle');
			var elDimensions = el.getStyles('height', 'width');
			var properties = {
				id: el.getProperty('id'),
				height: elDimensions.height.toInt(),
				width: elDimensions.width.toInt(),
				x: el.getStyle('left'),
				y: el.getStyle('top')
			}
			// If there is a title element, set title and destroy the element so it does not end up in window content
			if ( title ) {
				properties.title = title.innerHTML;
				title.destroy();
			}
		
			// Get content and destroy the element
			properties.content = el.innerHTML;
			el.destroy();
			
			// Create window
			new MochaUI.Window(properties, true);
		}.bind(this));
	}
});

/* -----------------------------------------------------------------

	Plugin: NewWindowsFromJSON
	
	Description: Create one or more windows from JSON data. You can define all the same properties
	             as you can for new Mocha.Window(). Undefined properties are set to their defaults.
	
	Syntax: MochaUI.newWindowsFromJSON(properties);
	
	Example:
	
		var url = 'data/json-windows-data.js';
		var request = new Json.Remote(url, {
			onComplete: function(properties) {
				MochaUI.newWindowsFromJSON(properties.windows);
			}
		}).send();


   ----------------------------------------------------------------- */

MochaUI.extend({	
	newWindowsFromJSON: function(properties){
		properties.each(function(properties) {
				new MochaUI.Window(properties);
		}.bind(this));
	}
});

/* -----------------------------------------------------------------

	Plugin: WindowUI.WindowForm

   ----------------------------------------------------------------- */

MochaUI.WindowForm = new Class({
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
		y: null
	},
	initialize: function(options){
		this.setOptions(options);
		this.options.id = 'win' + (++MochaUI.windowIDCount);
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
		new MochaUI.Window(this.options);
	}
});
MochaUI.WindowForm.implement(new Options);

/* -----------------------------------------------------------------

	Plugin: arrangeCascade

   ----------------------------------------------------------------- */

MochaUI.options.extend({
	desktopTopOffset:  30,    // Use a negative number if neccessary to place first window where you want it
	desktopLeftOffset: 20,
	mochaTopOffset:    50,    // Initial vertical spacing of each window
	mochaLeftOffset:   40     // Initial horizontal spacing of each window	
});

MochaUI.extend({
	cascadeInstalled:  true
});

MochaUI.extend({   
	arrangeCascade: function(){
		var x = this.options.desktopLeftOffset
		var y = this.options.desktopTopOffset;
		$$('div.mocha').each(function(windowEl){
			var currentWindowClass = MochaUI.Windows.instances.get(windowEl.id);
			if (!currentWindowClass.isMinimized && !currentWindowClass.isMaximized){
				id = windowEl.id;
				MochaUI.focusWindow(windowEl);
				x += this.options.mochaLeftOffset;
				y += this.options.mochaTopOffset;

				if (MochaUI.options.useEffects == false){
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
	}
});

/* -----------------------------------------------------------------

	Plugin: addSlider

	Description: This is the corner radius slider

   ----------------------------------------------------------------- */

MochaUI.extend({
	addSlider: function(){
		if ($('sliderarea')) {
			var sliderFirst = true;
			mochaSlide = new Slider($('sliderarea'), $('sliderknob'), {
				steps: 20,
				offset: 5,
				onChange: function(pos){
					$('updatevalue').set('html', pos);
					// Change default corner radius of the original class
					windowOptions.cornerRadius = pos;
					MochaUI.Window.implement({ options: windowOptions });
					// Don't redraw windows the first time the slider is initialized
					if (sliderFirst == true) {
						sliderFirst = false;
						return;
					}
					// Change corner radius of all active classes and their windows
					MochaUI.Windows.instances.each(function(instance) {
						instance.options.cornerRadius = pos;
						instance.drawWindow($(instance.options.id));
					}.bind(this));
					
					MochaUI.indexLevel++; 
				}.bind(this)
			}).set(windowOptions.cornerRadius);
		}
	}
});

// Initialize MochaUI on DomReady
window.addEvent('domready', function(){
	MochaUI.Desktop = new MochaUI.Desktop();									 
	MochaUI.Dock = new MochaUI.Dock();									 
	MochaUI.Workspaces = new MochaUI.Workspaces();	
	MochaUI.Modal = new MochaUI.Modal();
	// used by basic.html and basic2.html examples
	MochaUI.NewWindowsFromXHTML = new MochaUI.NewWindowsFromXHTML();
	
	window.addEvent('keydown', function(event){												
		var key = event.code;
		if (key == 9 && event.control) MochaUI.toggleWindowVisibility();					
	});	
	
});

// This runs when a person leaves your page.
window.addEvent('unload', function(){
	if (MochaUI) MochaUI.garbageCleanUp();
});
