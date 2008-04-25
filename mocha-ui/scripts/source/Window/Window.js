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
MochaUI.Windows.windowOptions = {
	id:                null,
	title:             'New Window',
	type:              'window',  // window, modal or notification.
	
	loadMethod:        'html', 	             // Can be set to 'html', 'xhr', or 'iframe'.
	contentURL:        'pages/lipsum.html',	 // Used if loadMethod is set to 'xhr' or 'iframe'.  

	// xhr options
	evalScripts:       true,       
	evalResponse:      false,         
	
	// html options
	content:           'Window content',
	
	// Container options
	// The container defaults to 'desktop'. If no desktop then to document.body. Use 'pageWrapper' if you don't want the windows to overlap the toolbars.
	container:         null,  // Element the window is injected in. 
	restrict:          true,  // Restrict window to container when dragging.
	shape:             'box', // Shape of window; box or gauge.
	
	// Window Events
	collapsible:       true,
	minimizable:       true,  // Requires MochaUI.Desktop and MochaUI.Dock.
	maximizable:       true,  // Requires MochaUI.Desktop.
	closable:          true,  

	// Draggable
	draggable:         null,  // Defaults to false for modals; otherwise true.
	draggableGrid:     false, // Distance in pixels for snap-to-grid dragging.
	draggableLimit:    false, // An object with x and y properties used to limit the movement of the Window.	
	draggableSnap:     false, // The distance to drag before the Window starts to respond to the drag.

	// Resizable
	resizable:         null,  // Defaults to false for modals, notifications and gauges; otherwise true.
	resizeLimit:       {'x': [250, 2500], 'y': [125, 2000]}, // Minimum and maximum width and height of window when resized.
	
	// Style options:
	addClass:          '',    // Add a class to your window to give you more control over styling.	
	width:             300,     // Width of content area.	
	height:            125,     // Height of content area.
	x:                 null,    // If x and y are left undefined the window is centered on the page. !!! NEED TO MAKE THIS WORK WITH THE CONTAINER OPTION. 
	y:                 null,    
	scrollbars:        true,
	padding:   		   { top: 10, right: 12, bottom: 10, left: 12 },
	shadowBlur:        3,       // Width of shadows.
	
	// Color options:		
	headerHeight:      25,               // Height of window titlebar
	footerHeight:      27,
	cornerRadius:      10,
	bodyBgColor:	   '#fff',           // Body background color - Hex
	headerStartColor:  [250, 250, 250],  // Header gradient's top color - RGB
	headerStopColor:   [229, 229, 229],  // Header gradient's bottom color
	footerBgColor:     [229, 229, 229],	 // Background color of the main canvas shape
	minimizeBgColor:   [255, 255, 255],  // Minimize button background color
	minimizeColor:     [0, 0, 0],        // Minimize button color	
	maximizeBgColor:   [255, 255, 255],  // Maximize button background color
	maximizeColor:     [0, 0, 0],        // Maximize button color	
	closeBgColor:      [255, 255, 255],  // Close button background color
	closeColor:        [0, 0, 0],        // Close button color	
	resizableColor:    [254, 254, 254],  // Resizable icon color

	// Events
	onBeforeBuild:     $empty,  // Fired just before the window is built.
	onContentLoaded:   $empty,  // Fired when content is successfully loaded via XHR or Iframe.
	onFocus:           $empty,  // Fired when the window is focused.
	onBlur:            $empty,  // Fired when window loses focus.
	onResize:          $empty,  // Fired when the window is resized.
	onMinimize:        $empty,  // Fired when the window is minimized.
	onMaximize:        $empty,  // Fired when the window is maximized.
	onRestore:         $empty,  // Fired when a window is restored from minimized or maximized.
	onClose:           $empty,  // Fired just before the window is closed.
	onCloseComplete:   $empty   // Fired after the window is closed.
};

MochaUI.Window = new Class({
	options: MochaUI.Windows.windowOptions,
	initialize: function(options){
		this.setOptions(options);

		// Shorten object chain
		var options = this.options;

		$extend(this, {		
			accordianTimer: '', // Used with accordian - should go somewhere else maybe?
			mochaControlsWidth: 0,
			minimizebuttonX:  0,  // Minimize button horizontal position
			maximizebuttonX: 0,  // Maximize button horizontal position
			closebuttonX: 0,  // Close button horizontal position
			headerFooterShadow: options.headerHeight + options.footerHeight + (options.shadowBlur * 2),
			oldTop: 0,
			oldLeft: 0,
			iframe: options.loadMethod == 'iframe' ? true : false,
			isMaximized: false,
			isMinimized: false,
			isCollapsed: false
		});
		
		// May be better to use if type != window
		if (options.type == 'modal' || options.type == 'notification'){
			options.container = document.body;			 
		}		
		if (!options.container){
			options.container = MochaUI.Desktop.desktop ? MochaUI.Desktop.desktop : document.body;			 
		}

		// Set this.options.resizable to default if it was not defined
		if (options.resizable == null){
			if (options.type == 'modal' || options.shape == 'gauge' || options.type == 'notification'){
				options.resizable = false;
			}
			else {
				options.resizable = true;	
			}
		}
		
		// Set this.options.draggable if it was not defined
		if (options.draggable == null){
			if (options.type == 'modal' || options.type == 'notification'){
				options.draggable = false;
			}
			else {
				options.draggable = true;	
			}
		}		
		
		// Gauges are not maximizable or resizable
		if (options.shape == 'gauge'|| options.type == 'notification'){
			options.collapsible = false;
			options.maximizable = false;
			options.bodyBgColor = 'transparent';
			options.scrollbars = false;
			options.footerHeight = 0;			
		}
		if (options.type == 'notification'){
			options.minimizable = false;
			options.closable = false;
			options.headerHeight = 0;
		}
		
		// Minimizable, dock is required and window cannot be modal
		options.minimizable = MochaUI.options.dock && options.minimizable && options.type != 'modal';		

		// Maximizable, desktop is required
		options.maximizable = MochaUI.Desktop.desktop && options.maximizable && options.type != 'modal';
		
		// If window has no ID, give it one.
		if (options.id == null){
			options.id = 'win' + (++MochaUI.Windows.windowIDCount);		
		}
		this.windowEl = $(options.id);
		
		this.newWindow();
		
		// Return window object
		return this;
	},
	saveValues: function(){	
		var coordinates = this.windowEl.getCoordinates();
		this.options.x = coordinates.left.toInt();
		this.options.y = coordinates.top.toInt();	
	},	
	/*
	
	Internal Function: newWindow
	
	Arguments: 
		properties

	*/	
	newWindow: function(properties){ // options is not doing anything

		// Shorten object chain
		var instances = MochaUI.Windows.instances;
		var instanceID = instances.get(this.options.id)
	
		// Here we check to see if there is already a class instance for this window
		if (instanceID){			
			var currentInstance = instanceID;		
		}
		
		// Check if window already exists and is not in progress of closing
		if ( this.windowEl && !this.isClosing ) {
			 // Restore if minimized
			if (currentInstance.isMinimized) {
				MochaUI.Dock.restoreMinimized(this.windowEl);
			}
			// Expand and focus if collapsed			
			if (currentInstance.isCollapsed) {
				MochaUI.collapseToggle(this.windowEl);
				setTimeout(MochaUI.focusWindow.pass(this.windowEl, this),10);					
			}			
			// Else focus
			else {
				setTimeout(MochaUI.focusWindow.pass(this.windowEl, this),10);	
			}
			return;
		}
		else {			
			instances.set(this.options.id, this);
		}
		
		this.isClosing = false;		
		this.fireEvent('onBeforeBuild');		
		
		// Create window div
		this.windowEl = new Element('div', {
			'class': 'mocha',
			'id':    this.options.id,
			'styles': {
				'width':   this.options.width,
				'height':  this.options.height,
				'display': 'block',
				'opacity': 0
			}
		});		

		this.windowEl.addClass(this.options.addClass);		

		if ((this.options.type == 'modal' && !Browser.Engine.gecko && !Browser.Engine.trident) || (Browser.Platform.mac && Browser.Engine.gecko)){
			this.windowEl.setStyle('position', 'fixed');	
		}

		if (this.options.loadMethod == 'iframe') {
			// Iframes have their own scrollbars and padding.
			this.options.scrollbars = false;
			this.options.padding = { top: 0, right: 0, bottom: 0, left: 0 };
		}
		
		// Insert sub elements inside windowEl
		this.insertWindowElements();
				
		// Set title		
		this.titleEl.set('html',this.options.title);

		// Add content to window
		MochaUI.updateContent(this.windowEl, this.options.content, this.options.contentURL);	
		
		// Set scrollbars, always use 'hidden' for iframe windows
		this.contentWrapperEl.setStyles({
			'overflow': this.options.scrollbars && !this.options.iframe ? 'auto' : 'hidden',
			'background': this.options.bodyBgColor
		});

		this.contentEl.setStyles({
			'padding-top': this.options.padding.top,
			'padding-bottom': this.options.padding.bottom,
			'padding-left': this.options.padding.left,
			'padding-right': this.options.padding.right
		});		
		
		/*
		if (this.options.shape == 'gauge'){
			this.canvasControlsEl.setStyle('opacity', 0);
			this.windowEl.addEvent('mouseover', function(){
				this.canvasControlsEl.setStyle('opacity', 1);
			}.bind(this));
			this.windowEl.addEvent('mouseleave', function(){
				this.canvasControlsEl.setStyle('opacity', 0);
			}.bind(this));			
		} */

		// Inject window into DOM		
		this.windowEl.injectInside(this.options.container);
		this.drawWindow(this.windowEl);

		// Attach events to the window
		this.attachDraggable(this.windowEl);		
		this.attachResizable(this.windowEl);
		this.setupEvents(this.windowEl);
		
		if (this.options.resizable){
			this.adjustHandles();
		}

		// Move window into position. If position not specified by user then center the window on the page.	
		
		if (this.options.container == document.body || this.options.container == MochaUI.Desktop.desktop){
			var dimensions = window.getSize();
		}
		else {
			var dimensions = this.options.container.getCoordinates();			
		}

		if (!this.options.y) {
			var y = (dimensions.y * .5) - ((this.options.height + this.headerFooterShadow) * .5);
		}
		else {
			var y = this.options.y - this.options.shadowBlur;
		}

		if (!this.options.x) {
			var x =	(dimensions.x * .5) - (this.options.width * .5);
		}
		else {
			var x = this.options.x - this.options.shadowBlur;
		}

		this.windowEl.setStyles({
			'top': y,
			'left': x
		});
		
		// Create opacityMorph
		if (MochaUI.options.useEffects == true){
			// IE cannot handle both element opacity and VML alpha at the same time.
			if (Browser.Engine.trident){
				this.drawWindow(this.windowEl, false);
			}
			this.opacityMorph = new Fx.Morph(this.windowEl, {
				'duration': 500,
				onComplete: function(){
					if (Browser.Engine.trident){
						this.drawWindow(this.windowEl);
					}
				}.bind(this)
			});
		}

		if (this.options.type == 'modal') {
			if (Browser.Engine.trident4){
				$('modalFix').setStyle('display', 'block');	
			}
			$('modalOverlay').setStyle('display', 'block');			
			if (MochaUI.options.useEffects == false){			
				$('modalOverlay').setStyle('opacity', .55);
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
				this.opacityMorph.start({
					'opacity': 1
				});				
			}
		}
		else if (MochaUI.options.useEffects == false){
			this.windowEl.setStyle('opacity', 1);
			setTimeout(MochaUI.focusWindow.pass(this.windowEl, this), 10);			
		}
		else {
			this.opacityMorph.start({
				'opacity': 1
			});
			setTimeout(MochaUI.focusWindow.pass(this.windowEl, this), 10);
		}

		// This is a generic morph that can be reused later by functions like centerWindow()
		this.morph = new Fx.Morph(this.windowEl, {
			'duration': 200
		});

		// Add check mark to menu if link exists in menu
		// Need to make sure the check mark is not added to links not in menu		
	
		if ($(this.windowEl.id + 'LinkCheck')){
			this.check = new Element('div', {
				'class': 'check',
				'id': this.options.id + '_check'
			}).injectInside(this.windowEl.id + 'LinkCheck');
		}
		
		if (this.options.type == 'notification'){
			MochaUI.closeWindow.delay(1400, this, this.windowEl);	
		}

	},
	setupEvents: function(windowEl) {

		// Set events
		// Note: if a button does not exist, its due to properties passed to newWindow() stating otherwice
		if (this.closeButtonEl){
			this.closeButtonEl.addEvent('click', function() {
				MochaUI.closeWindow(windowEl);
			}.bind(this));
		}

		if (this.options.type == 'window'){		
			windowEl.addEvent('click', function() {
				MochaUI.focusWindow(windowEl);
			}.bind(this));
		}

		if (this.minimizeButtonEl) {
			this.minimizeButtonEl.addEvent('click', function() {
				MochaUI.Dock.minimizeWindow(windowEl);
		}.bind(this));
		}

		if (this.maximizeButtonEl) {
			this.maximizeButtonEl.addEvent('click', function() { 
				if (this.isMaximized) {
					MochaUI.Desktop.restoreWindow(windowEl);					
				} else {
					MochaUI.Desktop.maximizeWindow(windowEl); 					
				}
			}.bind(this));			
		}
		
		if (this.options.collapsible == true){
			// Keep titlebar text from being selected on double click in Safari.
			this.titleEl.addEvent('selectstart', function(e) {
				e = new Event(e).stop();							  													   
			}.bind(this));
			// Keep titlebar text from being selected on double click in Opera.			
			this.titleBarEl.addEvent('mousedown', function(e) {
				e = new Event(e).stop();							  													   
			}.bind(this));		
			this.titleBarEl.addEvent('dblclick', function(e) {
				e = new Event(e).stop();
				MochaUI.collapseToggle(this.windowEl);
			}.bind(this));			
		}		
		
	},
	/*
	
	Internal Function: attachDraggable()
		Make window draggable.
		
	Arguments:
		windowEl
		
	*/
	attachDraggable: function(windowEl){
		if (!this.options.draggable) return;
		this.windowDrag = new Drag.Move(windowEl, {
			handle: this.titleBarEl,
			container: this.options.restrict ? $(this.options.container) : false,			
			grid: this.options.draggableGrid,
			limit: this.options.draggableLimit,
			snap: this.options.draggableSnap,
			onStart: function() {
				if (this.options.type != 'modal'){ 
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
		if (!this.options.resizable) return;	
		this.windowEl.makeResizable({
			handle: [this.n, this.ne, this.nw],
			limit: {
				y: [
					function(){
						return this.windowEl.getStyle('top').toInt() + this.windowEl.getStyle('height').toInt() - this.options.resizeLimit.y[1];
					}.bind(this),
				   function(){
					   return this.windowEl.getStyle('top').toInt() + this.windowEl.getStyle('height').toInt() - this.options.resizeLimit.y[0];
					}.bind(this)
				]
			},	
			modifiers: {x: false, y: 'top'},
			onBeforeStart: function(){this.resizeOnBeforeStart();}.bind(this),		
			onStart: function(){
				this.coords = this.contentWrapperEl.getCoordinates();			
				this.y2 = this.coords.top.toInt() + this.contentWrapperEl.offsetHeight;
			}.bind(this),
			onDrag: function(){
				this.coords = this.contentWrapperEl.getCoordinates();
				this.contentWrapperEl.setStyle('height', this.y2 - this.coords.top.toInt());
				this.drawWindow(windowEl);
				this.adjustHandles();
			}.bind(this),
			onComplete: function(){this.resizeOnComplete();}.bind(this)		
		});
	
		this.contentWrapperEl.makeResizable({
			handle: [this.e, this.ne],
			limit: {
				x: [this.options.resizeLimit.x[0] - (this.options.shadowBlur * 2), this.options.resizeLimit.x[1] - (this.options.shadowBlur * 2) ]		
			},	
			modifiers: {x: 'width', y: false},
			onBeforeStart: function(){this.resizeOnBeforeStart();}.bind(this),		
			onDrag: function(){
				this.drawWindow(windowEl);
				this.adjustHandles();
			}.bind(this),
			onComplete: function(){this.resizeOnComplete();}.bind(this)	
		});	
	
		this.contentWrapperEl.makeResizable({
			handle: this.se,
			limit: {
				x: [this.options.resizeLimit.x[0] - (this.options.shadowBlur * 2), this.options.resizeLimit.x[1] - (this.options.shadowBlur * 2) ],
				y: [this.options.resizeLimit.y[0] - this.headerFooterShadow, this.options.resizeLimit.y[1] - this.headerFooterShadow]					
			},	
			modifiers: {x: 'width', y: 'height'},
			onBeforeStart: function(){this.resizeOnBeforeStart();}.bind(this),		
			onDrag: function(){
				this.drawWindow(windowEl);	
				this.adjustHandles();
			}.bind(this),
			onComplete: function(){this.resizeOnComplete();}.bind(this)	
		});		
		
		this.contentWrapperEl.makeResizable({
			handle: [this.s, this.sw],
			limit: {
				y: [this.options.resizeLimit.y[0] - this.headerFooterShadow, this.options.resizeLimit.y[1] - this.headerFooterShadow]	
			},	
			modifiers: {x: false, y: 'height'},
			onBeforeStart: function(){this.resizeOnBeforeStart();}.bind(this),		
			onDrag: function(){
				this.drawWindow(windowEl);			
				this.adjustHandles();
			}.bind(this),
			onComplete: function(){this.resizeOnComplete();}.bind(this)	
		});
		
		this.windowEl.makeResizable({
			handle: [this.w, this.sw, this.nw],
			limit: {
				x: [
					function(){
						return this.windowEl.getStyle('left').toInt() + this.windowEl.getStyle('width').toInt() - this.options.resizeLimit.x[1];
					}.bind(this),
				   function(){
					   return this.windowEl.getStyle('left').toInt() + this.windowEl.getStyle('width').toInt() - this.options.resizeLimit.x[0];
					}.bind(this)
				]
			},	
			modifiers: {x: 'left', y: false},
			onBeforeStart: function(){this.resizeOnBeforeStart();}.bind(this),		
			onStart: function(){
				this.coords = this.contentWrapperEl.getCoordinates();			
				this.x2 = this.coords.left.toInt() + this.contentWrapperEl.offsetWidth;
			}.bind(this),
			onDrag: function(){
				this.coords = this.contentWrapperEl.getCoordinates();
				this.contentWrapperEl.setStyle('width', this.x2 - this.coords.left.toInt());
				this.drawWindow(windowEl);
				this.adjustHandles();
			}.bind(this),
			onComplete: function(){this.resizeOnComplete();}.bind(this)
		});
	
	},
	resizeOnBeforeStart: function(){
		if (this.iframeEl){
			this.iframeEl.setStyle('visibility', 'hidden');
		}	
	},	
	resizeOnComplete: function(){
		if (this.iframeEl){
			this.iframeEl.setStyle('visibility', 'visible');
		}
		this.fireEvent('onResize', this.windowEl);	
	},
	adjustHandles: function(){
		this.coords = this.windowEl.getCoordinates();
		this.n.setStyles({
			'top': this.options.shadowBlur - 1,	
			'left': this.options.shadowBlur - 1 + 10,				
			'width': this.coords.width - (this.options.shadowBlur * 2) + 2 - 20
		});
		this.e.setStyles({
			'top': this.options.shadowBlur - 1 + 10,						 
			'right': this.options.shadowBlur - 1,			 
			'height': this.coords.height - (this.options.shadowBlur * 2) + 2 - 30
		});
		this.s.setStyles({
			'bottom': this.options.shadowBlur - 1,
			'left': this.options.shadowBlur - 1 + 10,			
			'width': this.coords.width - (this.options.shadowBlur * 2) + 2 - 30
		});
		this.w.setStyles({
			'top': this.options.shadowBlur - 1 + 10,						 
			'left': this.options.shadowBlur - 1,			 
			'height': this.coords.height - (this.options.shadowBlur * 2) + 2 - 20
		});
		this.ne.setStyles({
			'top': this.options.shadowBlur - 1,			 
			'right': this.options.shadowBlur - 1	
		});
		this.se.setStyles({
			'bottom': this.options.shadowBlur - 1,			 
			'right': this.options.shadowBlur - 1	
		});
		this.sw.setStyles({
			'bottom': this.options.shadowBlur - 1,			 
			'left': this.options.shadowBlur - 1	
		});
		this.nw.setStyles({
			'top': this.options.shadowBlur - 1,			 
			'left': this.options.shadowBlur - 1	
		});			
	},	
	/*
	
	Internal Function: insertWindowElements
	
	Arguments:
		windowEl
			
	*/
	insertWindowElements: function(){
		
		var options = this.options;
		var height = options.height;
		var width = options.width;
		var id = options.id;
		
		var cache = {};
		
		if (Browser.Engine.trident4){
			cache.zIndexFixEl = new Element('iframe', {
				'class': 'zIndexFix',
				'scrolling': 'no',
				'marginWidth': 0,
				'marginHeight': 0,
				'src': '',
				'id': id + '_zIndexFix'
			}).inject(this.windowEl);
		}
		
		cache.overlayEl = new Element('div', {
			'class': 'mochaOverlay',
			'id': id + '_overlay'
		}).inject(this.windowEl);

		cache.titleBarEl = new Element('div', {
			'class': 'mochaTitlebar',
			'id': id + '_titleBar',
			'styles': {
				'cursor': options.draggable ? 'move' : 'default'
			}
		}).inject(cache.overlayEl, 'top');

		cache.titleEl = new Element('h3', {
			'class': 'mochaTitle',
			'id': id + '_title'
		}).inject(cache.titleBarEl);
		
		cache.contentBorderEl = new Element('div', {
			'class': 'mochaContentBorder',
			'id': id + '_contentBorder'
		}).inject(cache.overlayEl);

		cache.contentWrapperEl = new Element('div', {
			'class': 'mochaContentWrapper',
			'id': id + '_contentWrapper',
			'styles': {
				'width': width + 'px',
				'height': height + 'px'
			}
		}).inject(cache.contentBorderEl);
		
		if (this.options.shape == 'gauge'){
			cache.contentBorderEl.setStyle('borderWidth', 0);
		}		
		
		cache.contentEl = new Element('div', {
			'class': 'mochaContent',
			'id': id + '_content'
		}).inject(cache.contentWrapperEl);

		cache.canvasEl = new Element('canvas', {
			'class': 'mochaCanvas',
			'width': 1,
			'height': 1,
			'id': id + '_canvas'
		}).inject(this.windowEl);
		
		if ( Browser.Engine.trident && MochaUI.ieSupport == 'excanvas'  ) {
			G_vmlCanvasManager.initElement(cache.canvasEl);			
			// getContext() method does not exist before retrieving the element via getElement
			cache.canvasEl = this.windowEl.getElement('.mochaCanvas');			
		}	
		
		cache.controlsEl = new Element('div', {
			'class': 'mochaControls',
			'id': id + '_controls'
		}).inject(cache.overlayEl, 'after');
		
		cache.canvasControlsEl = new Element('canvas', {
			'class': 'mochaCanvasControls',
			'width': 14,
			'height': 16,
			'id': id + '_canvasControls'
		}).inject(this.windowEl);
		
		if ( Browser.Engine.trident && MochaUI.ieSupport == 'excanvas'  ) {
			G_vmlCanvasManager.initElement(cache.canvasControlsEl);			
			// getContext() method does not exist before retrieving the element via getElement
			cache.canvasControlsEl = this.windowEl.getElement('.mochaCanvasControls');			
		}
		
		if (options.closable){
			cache.closeButtonEl = new Element('div', {
				'class': 'mochaClose',
				'title': 'Close',
				'id': id + '_closeButton'
			}).inject(cache.controlsEl);
		}

		if (options.maximizable){
			cache.maximizeButtonEl = new Element('div', {
				'class': 'maximizeToggle',
				'title': 'Maximize',
				'id': id + '_maximizeButton'
			}).inject(cache.controlsEl);
		}

		if (options.minimizable){
			cache.minimizeButtonEl = new Element('div', {
				'class': 'minimizeToggle',
				'title': 'Minimize',
				'id': id + '_minimizeButton'
			}).inject(cache.controlsEl);
		}
		
		if (options.shape != 'gauge' && options.type != 'notification'){
			cache.canvasIconEl = new Element('canvas', {
				'class': 'mochaLoadingIcon',
				'width': 18,
				'height': 18,
				'id': id + '_canvasIcon'
			}).inject(this.windowEl, 'bottom');	
		
			if (Browser.Engine.trident && MochaUI.ieSupport == 'excanvas') {
				G_vmlCanvasManager.initElement(cache.canvasIconEl);
			    // getContext() method does not exist before retrieving the element via getElement
				// element via getElement
				cache.canvasIconEl = this.windowEl.getElement('.mochaLoadingIcon');
			}
		}
		
		if ( Browser.Engine.trident ) {
			cache.overlayEl.setStyle('zIndex', 2);
		}

		// For Mac Firefox 2 to help reduce scrollbar bugs in that browser
		if (Browser.Platform.mac && Browser.Engine.gecko) {
			cache.overlayEl.setStyle('overflow', 'auto');
		}

		if (options.resizable){			
			cache.n = new Element('div', {
				'id': id + '_resizeHandle_n',
				'class': 'handle',		
				'styles': {
					'top': 0,
					'left': 10,
					'cursor': 'n-resize'
				}
			}).inject(cache.overlayEl, 'after');
			
			cache.ne = new Element('div', {
				'id': id + '_resizeHandle_ne',
				'class': 'handle corner',		
				'styles': {
					'top': 0,
					'right': 0,
					'cursor': 'ne-resize'
				}
			}).inject(cache.overlayEl, 'after');
			
			cache.e = new Element('div', {
				'id': id + '_resizeHandle_e',
				'class': 'handle',		
				'styles': {
					'top': 10,
					'right': 0,
					'cursor': 'e-resize'
				}
			}).inject(cache.overlayEl, 'after');
			
			cache.se = new Element('div', {
				'id': id + '_resizeHandle_se',
				'class': 'handle cornerSE',		
				'styles': {
					'bottom': 0,
					'right': 0,
					'cursor': 'se-resize'
				}
			}).inject(cache.overlayEl, 'after');
			
			cache.s = new Element('div', {
				'id': id + '_resizeHandle_s',
				'class': 'handle',		
				'styles': {
					'bottom': 0,
					'left': 10,
					'cursor': 's-resize'
				}
			}).inject(cache.overlayEl, 'after');
			
			cache.sw = new Element('div', {
				'id': id + '_resizeHandle_sw',
				'class': 'handle corner',		
				'styles': {
					'bottom': 0,
					'left': 0,
					'cursor': 'sw-resize'
				}
			}).inject(cache.overlayEl, 'after');
			
			cache.w = new Element('div', {
				'id': id + '_resizeHandle_w',
				'class': 'handle',		
				'styles': {
					'top': 10,
					'left': 0,
					'cursor': 'w-resize'
				}
			}).inject(cache.overlayEl, 'after');
			
			cache.nw = new Element('div', {
				'id': id + '_resizeHandle_nw',
				'class': 'handle corner',		
				'styles': {
					'top': 0,
					'left': 0,
					'cursor': 'nw-resize'
				}
			}).inject(cache.overlayEl, 'after');
		}

		$extend(this, cache);
		
		if (options.type != 'notification'){
			this.setMochaControlsWidth();
		}
		
		
	},
	/*

	Internal function: drawWindow
		This is where we create the canvas GUI	

	Arguments: 
		windowEl: the $(window)
		shadows: (boolean) false will draw a window without shadows

	*/	
	drawWindow: function(windowEl, shadows) {
		
		if (this.isCollapsed){
			this.drawWindowCollapsed(windowEl, shadows);
			return;
		}
		
		var options = this.options;
		var shadowBlur = options.shadowBlur;
		var shadowBlur2x = shadowBlur * 2;
		
		this.contentBorderEl.setStyles({
			'width': this.contentWrapperEl.offsetWidth
		});

		// Resize iframe when window is resized
		if (this.iframe) {
			this.iframeEl.setStyles({
				'height': this.contentWrapperEl.offsetHeight
			});
		}
		
		this.headerFooterShadow = options.headerHeight + options.footerHeight + shadowBlur2x;
		var height = this.contentWrapperEl.getStyle('height').toInt() + this.headerFooterShadow;
		var width = this.contentWrapperEl.getStyle('width').toInt() + shadowBlur2x;
		this.windowEl.setStyle('height', height);
		
		this.overlayEl.setStyles({
			'height': height,
			'top': shadowBlur,
			'left': shadowBlur
		});		

		// Opera requires the canvas height and width be set this way when resizing:
		this.canvasEl.height = height;
		this.canvasEl.width = width;

		// Part of the fix for IE6 select z-index bug and FF on Mac scrollbar z-index bug
		if (Browser.Engine.trident4){
			this.zIndexFixEl.setStyles({
				'width': width,
				'height': height
			})
		}

		// Set width
		this.windowEl.setStyle('width', width);
		this.overlayEl.setStyle('width', width);
		this.titleBarEl.setStyles({
			'width': width - shadowBlur2x,
			'height': options.headerHeight
		});
	
		// Make sure loading icon is placed correctly.
		if (options.shape != 'gauge' && options.type != 'notification'){
			this.canvasIconEl.setStyles({
				'left': shadowBlur + 3,
				'bottom': shadowBlur + 4
			})
		}
		
		// Draw Window
		var ctx = this.canvasEl.getContext('2d');
		ctx.clearRect(0, 0, width, height);	

		switch(options.shape) {
			case 'box':
				this.drawBox(ctx, width, height, shadows);
				break;
			case 'gauge':
				this.drawGauge(ctx, width, height, shadows);
				break;				
		}		
		
		if (this.options.type != 'notification'){
			this.drawControls(width, height, shadows);
		}

		if (this.options.resizable){ 
			MochaUI.triangle(
				ctx,
				width - (shadowBlur + 17),
				height - (shadowBlur + 18),
				11,
				11,
				options.resizableColor,
				1.0
			);
		}

		// Invisible dummy object. The last element drawn is not rendered consistently while resizing in IE6 and IE7
		if ( Browser.Engine.trident ){
			MochaUI.triangle(ctx, 0, 0, 10, 10, options.resizableColor, 0);
		}		

	},
	drawWindowCollapsed: function(windowEl, shadows) {
		
		var options = this.options;
		var shadowBlur = options.shadowBlur;
		var shadowBlur2x = shadowBlur * 2;
		
		var headerShadow = options.headerHeight + shadowBlur2x + 3;
		var height = headerShadow;
		var width = this.contentWrapperEl.getStyle('width').toInt() + shadowBlur2x;
		this.windowEl.setStyle('height', height);
		
		this.overlayEl.setStyles({
			'height': height,
			'top': shadowBlur,
			'left': shadowBlur
		});		

		// Opera height and width must be set like this, when resizing:
		this.canvasEl.height = height;
		this.canvasEl.width = width;

		// Part of the fix for IE6 select z-index bug and FF on Mac scrollbar z-index bug
		if (Browser.Engine.trident4){
			this.zIndexFixEl.setStyles({
				'width': width,
				'height': height
			})
		}

		// Set width
		this.windowEl.setStyle('width', width);
		this.overlayEl.setStyle('width', width);
		this.titleBarEl.setStyles({
			'width': width - shadowBlur2x,
			'height': options.headerHeight
		});
	
		// Draw Window
		var ctx = this.canvasEl.getContext('2d');
		ctx.clearRect(0, 0, width, height);
		
		this.drawBoxCollapsed(ctx, width, height, shadows);		
		this.drawControls(width, height, shadows);

		// Invisible dummy object. The last element drawn is not rendered consistently while resizing in IE6 and IE7
		if ( Browser.Engine.trident ){
			MochaUI.triangle(ctx, 0, 0, 10, 10, options.resizableColor, 0);
		}		

	},	
	drawControls : function(width, height, shadows){
		var options = this.options;
		var shadowBlur = options.shadowBlur;		
		
		// Make sure controls are placed correctly.
		this.controlsEl.setStyles({
			'right': shadowBlur + 5,
			'top': shadowBlur + 5	
		});

		this.canvasControlsEl.setStyles({
			'right': shadowBlur + 5,
			'top': shadowBlur + 5	
		});

		// Calculate X position for controlbuttons
		this.closebuttonX = options.closable ? this.mochaControlsWidth - 12 : this.mochaControlsWidth + 7;
		this.maximizebuttonX = this.closebuttonX - (options.maximizable ? 19 : 0);
		this.minimizebuttonX = this.maximizebuttonX - (options.minimizable ? 19 : 0);
		
		var ctx2 = this.canvasControlsEl.getContext('2d');
		ctx2.clearRect(0, 0, 100, 100);

		if (this.options.closable){
			this.closebutton(
				ctx2,
				this.closebuttonX,
				7,
				options.closeBgColor,
				1.0,
				options.closeColor,
				1.0
			);
		}
		if (this.options.maximizable){
			this.maximizebutton(
				ctx2,
				this.maximizebuttonX,
				7,
				options.maximizeBgColor,
				1.0,
				options.maximizeColor,
				1.0
			);
		}
		if (this.options.minimizable){
			this.minimizebutton(
				ctx2,
				this.minimizebuttonX,
				7,
				options.minimizeBgColor,
				1.0,
				options.minimizeColor,
				1.0
			);
		}		
		
	},
	drawBox: function(ctx, width, height, shadows){	

		var shadowBlur = this.options.shadowBlur;
		var shadowBlur2x = shadowBlur * 2;
		var cornerRadius = this.options.cornerRadius		
	
		// This is the drop shadow. It is created onion style.
		if ( shadows != false ) {	
			for (var x = 0; x <= shadowBlur; x++){
				MochaUI.roundedRect(
					ctx, x, x,
					width - (x * 2),
					height - (x * 2),
					cornerRadius + (shadowBlur - x),
					[0, 0, 0],
					x == shadowBlur ? .3 : .06 + (x * .01)
				);
			}
		}
		// Window body.
		this.bodyRoundedRect(
			ctx,                         // context
			shadowBlur,                  // x
			shadowBlur - 1,              // y
			width - shadowBlur2x,        // width
			height - shadowBlur2x,       // height
			cornerRadius,                // corner radius
			this.options.footerBgColor   // Footer color
		);

		if (this.options.type != 'notification'){
		// Window header.
			this.topRoundedRect(
				ctx,                            // context
				shadowBlur,                     // x
				shadowBlur - 1,                 // y
				width - shadowBlur2x,           // width
				this.options.headerHeight,      // height
				cornerRadius,                   // corner radius
				this.options.headerStartColor,  // Header gradient's top color
				this.options.headerStopColor    // Header gradient's bottom color
			);		
		}	
	},
	drawBoxCollapsed: function(ctx, width, height, shadows){	
	
		// Shorten object chain
		var shadowBlur = this.options.shadowBlur;
		var shadowBlur2x = shadowBlur * 2;
		var cornerRadius = this.options.cornerRadius		
	
		// This is the drop shadow. It is created onion style.
		if ( shadows != false ) {	
			for (var x = 0; x <= shadowBlur; x++){
				MochaUI.roundedRect(
					ctx, x, x,
					width - (x * 2),
					height - (x * 2),
					cornerRadius + (shadowBlur - x),
					[0, 0, 0],
					x == shadowBlur ? .3 : .06 + (x * .01)
				);
			}
		}

		// Mocha header
		this.topRoundedRect2(
			ctx,                            // context
			shadowBlur,                     // x
			shadowBlur - 1,                 // y
			width - shadowBlur2x,           // width
			this.options.headerHeight + 3,  // height
			cornerRadius,                   // corner radius
			this.options.headerStartColor,  // Header gradient's top color
			this.options.headerStopColor    // Header gradient's bottom color
		);

	},	
	drawGauge: function(ctx, width, height, shadows){

		var shadowBlur = this.options.shadowBlur;
		
		var radius = (width *.5) - (shadowBlur) + 16;
		var shadowOpacity = 1;		

		// This is the drop shadow. It is created onion style.
		if (shadows != false) {	
			for (var x = 0; x <= shadowBlur; x++){				
				MochaUI.circle(
					ctx,
					width * .5,
					(height  + this.options.headerHeight )* .5,
					(width *.5) - (x * 2),
					[0, 0, 0],
					x == shadowBlur ? .6 : .06 + (x * .04)
				);
			}
		}
		
		if (shadows != false) {	
			for (var x = 0; x <= shadowBlur; x++){				
			
			if (x == shadowBlur){
				shadowOpacity = .6;
			}
			else {
				shadowOpacity = .04 + (x * .01);	
			}
			
			ctx.lineWidth = 24 + (shadowBlur * 2) - (x * 2);
			ctx.lineCap = 'round';

			ctx.beginPath();
			ctx.moveTo(shadowBlur + 12, shadowBlur + 12);
			ctx.lineTo(width - shadowBlur - 12, shadowBlur + 12);
			ctx.strokeStyle = 'rgba(0, 0, 0,' + shadowOpacity + ')';
			ctx.stroke();				
				
			}
		}
		ctx.beginPath();		
		ctx.lineWidth = 24;
		ctx.lineCap = 'round';
		
		ctx.moveTo(shadowBlur + 12, shadowBlur + 12);
		ctx.lineTo(width - shadowBlur - 12, shadowBlur + 12);
		ctx.strokeStyle = 'rgba(230, 230, 230, 1)';
		ctx.stroke();
		
		MochaUI.circle(
			ctx,
			width * .5,
			(height  + this.options.headerHeight )* .5,
			(width *.5) - (shadowBlur),
			[250, 250, 250],
			1
		); 

		//var arcStartAngle = Math.PI * (- 0.5 + 2 * 0); // -0.5 sets set the start to be top
		//var arcEndAngle = Math.PI * (- 0.5 + 2 * .125);

		/*
		ctx.arc(
			width * .5,
			(height  + this.options.headerHeight )* .5,
			radius,         // radius
			arcStartAngle,         // Start angle
			arcEndAngle, // End angle
			false
		);
		ctx.strokeStyle = 'rgba(250,250,250,.5)';
		ctx.stroke();
		*/
		
		/*
		ctx.arc(
			width * .5,
			(height  + this.options.headerHeight )* .5,
			(width *.5) - (shadowBlur) - 3,         // radius
			arcEndAngle,     
			arcStartAngle,
			true
		);

		ctx.closePath();
		ctx.fill();	
		*/		
		
	},		
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
		var lingrad = ctx.createLinearGradient(0, 0, 0, this.options.headerHeight);
		lingrad.addColorStop(0, 'rgba(' + headerStartColor.join(',') + ', 1)');
		lingrad.addColorStop(1, 'rgba(' + headerStopColor.join(',') + ', 1)');		
		ctx.fillStyle = lingrad;
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
	topRoundedRect2: function(ctx, x, y, width, height, radius, headerStartColor, headerStopColor){
		var lingrad = ctx.createLinearGradient(0, this.options.shadowBlur - 1, 0, height + this.options.shadowBlur + 3);
		lingrad.addColorStop(0, 'rgba(' + headerStartColor.join(',') + ', 1)');
		lingrad.addColorStop(1, 'rgba(' + headerStopColor.join(',') + ', 1)');
		ctx.fillStyle = lingrad;		
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
	maximizebutton: function(ctx, x, y, rgbBg, aBg, rgb, a){
		// Circle
		ctx.beginPath();
		ctx.moveTo(x, y);
		ctx.arc(x, y, 7, 0, Math.PI*2, true);
		ctx.fillStyle = 'rgba(' + rgbBg.join(',') + ',' + aBg + ')';
		ctx.fill();
		// X sign
		ctx.strokeStyle = 'rgba(' + rgb.join(',') + ',' + a + ')';		
		ctx.beginPath();
		ctx.moveTo(x, y - 4);
		ctx.lineTo(x, y + 4);
		ctx.stroke();
		ctx.beginPath();
		ctx.moveTo(x - 4, y);
		ctx.lineTo(x + 4, y);
		ctx.stroke();
	},
	closebutton: function(ctx, x, y, rgbBg, aBg, rgb, a){
		// Circle
		ctx.beginPath();
		ctx.moveTo(x, y);
		ctx.arc(x, y, 7, 0, Math.PI*2, true);
		ctx.fillStyle = 'rgba(' + rgbBg.join(',') + ',' + aBg + ')';
		ctx.fill();
		// Plus sign
		ctx.strokeStyle = 'rgba(' + rgb.join(',') + ',' + a + ')';		
		ctx.beginPath();
		ctx.moveTo(x - 3, y - 3);
		ctx.lineTo(x + 3, y + 3);
		ctx.stroke();
		ctx.beginPath();
		ctx.moveTo(x + 3, y - 3);
		ctx.lineTo(x - 3, y + 3);
		ctx.stroke();
	},
	minimizebutton: function(ctx, x, y, rgbBg, aBg, rgb, a){
		// Circle
		ctx.beginPath();
		ctx.moveTo(x,y);
		ctx.arc(x,y,7,0,Math.PI*2,true);
		ctx.fillStyle = 'rgba(' + rgbBg.join(',') + ',' + aBg + ')';
		ctx.fill();
		// Minus sign
		ctx.strokeStyle = 'rgba(' + rgb.join(',') + ',' + a + ')';		
		ctx.beginPath();
		ctx.moveTo(x - 4, y);
		ctx.lineTo(x + 4, y);
		ctx.stroke();
	},
	hideLoadingIcon: function(canvas) {
		if (!MochaUI.options.useLoadingIcon || this.options.shape == 'gauge' || this.options.type == 'notification') return;		
		$(canvas).setStyle('display', 'none');		
		$clear(canvas.iconAnimation);
	},
	showLoadingIcon: function(canvas) {
		if (!MochaUI.options.useLoadingIcon || this.options.shape == 'gauge' || this.options.type == 'notification') return;		
		$(canvas).setStyles({
			'display': 'block'
		});		
		var t = 1;	  	
		var iconAnimation = function(canvas){ 
			var ctx = $(canvas).getContext('2d');
			ctx.clearRect(0, 0, 18, 18);
			ctx.save();
			ctx.translate(9, 9);
			ctx.rotate(t*(Math.PI / 8));	
			var color = 0;
			for (var i=0; i < 8; i++){
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
		if ( this.options.minimizable )
			this.mochaControlsWidth += (marginWidth + controlWidth);
		if ( this.options.maximizable ) {
			this.mochaControlsWidth += (marginWidth + controlWidth);
			this.maximizeButtonEl.setStyle('margin-left', marginWidth);
		}
		if ( this.options.closable ) {
			this.mochaControlsWidth += (marginWidth + controlWidth);
			this.closeButtonEl.setStyle('margin-left', marginWidth);
		}
		this.controlsEl.setStyle('width', this.mochaControlsWidth - marginWidth);
		this.canvasControlsEl.setProperty('width', this.mochaControlsWidth - marginWidth);
	}
});
MochaUI.Window.implement(new Options, new Events);
