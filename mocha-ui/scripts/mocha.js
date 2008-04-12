/* 

Script: Core.js
	MochaUI - A Web Applications User Interface Framework.
	
Copyright:
	Copyright (c) 2007-2008 Greg Houston, <http://greghoustondesign.com/>.
	
License:
	MIT-style license.

Contributors:
	- Scott F. Frederick
	- Joel Lindau
	
Todo:		
	- Ctrl-Tab to toggle window visibility.

To fix:
	- With effects disabled maximizing caused an error
	
Note:
	This documentation is taken directly from the javascript source files. It is built using Natural Docs.
	
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
	windowsVisible: true,         // Ctrl-Alt-Q to toggle window visibility
	/*
	
	Function: closeWindow
		Closes a window.

	Syntax:
	(start code)
		MochaUI.closeWindow();
	(end)

	Arguments: 
		windowEl: the ID of the window to be closed
		
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
		currentWindowClass.fireEvent('onClose', windowEl);

		if (MochaUI.options.useEffects == false){
			if (currentWindowClass.options.modal) {
				$('mochaModalOverlay').setStyle('opacity', 0);
			}
			windowEl.destroy();
			currentWindowClass.fireEvent('onCloseComplete');
			MochaUI.Windows.instances.erase(currentWindowClass.options.id); // see how this effects on close complete
			if(this.loadingWorkspace == true){
				this.windowUnload();
			}
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
					if(this.loadingWorkspace == true){
						this.windowUnload();
					}
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
		MochaUI.Windows.instances.empty();				
		$$('div.mochaDockButton').destroy();
		return true;
	},	
	/*
	
	Function: toggleWindowVisibility
		Toggle window visibility with Ctrl-Alt-Q.
	
	Todo:
		Don't toggle modal visibility. If new window is created make all windows visible except for those that are minimized. If window is restored from dock make all windows visible except for any others that are still minimized.

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
		currentWindowClass.fireEvent('onFocus', windowEl);
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
	serialize: function(obj) {
		var newobj = {};
		$each(obj, function(prop,i) {
			newobj[i] = prop.toString().clean();
		}, this);
		return newobj;
	},
	unserialize: function(obj) {
		var newobj = {};
		$each(obj, function(prop,i) {
			eval("newobj[i] = " + prop);
		}, this);
		return newobj;
	},	
	/*
	
	Function: saveWorkspace
		This is experimental. This version saves the ID of each open window to a cookie, and reloads those windows using the functions in mocha-init.js. A future version may be set up to save all the current options and events of each open window to a database.
	
	Note: EXPERIMENTAL - PARTIALLY IMPLEMENTED.
	
	Syntax:
	(start code)
		MochaUI.saveWorkspace();
	(end)
	
	*/	
	saveWorkspace: function(){
		this.cookie = new Hash.Cookie('mochaUIworkspaceCookie', {duration: 3600});
		this.cookie.empty();		
		MochaUI.Windows.instances.each(function(instance) {											

		this.cookie.set(instance.options.id, {
			'id': instance.options.id,
			'top': instance.options.y,
			'left': instance.options.x
		});
		
		}.bind(this));		
		this.cookie.save();
	},
	windowUnload: function(){
		if ($$('div.mocha').length == 0){
			if(this.myChain){
				this.myChain.callChain();
			}
		}		
	},
	loadWorkspace2: function(){
		this.cookie = new Hash.Cookie('mochaUIworkspaceCookie', {duration: 3600});
		workspaceWindows = this.cookie.load();
		workspaceWindows.each(function(instance) {		
			eval('MochaUI.' + instance.id + 'Window();');			
		}.bind(this));
		this.loadingWorkspace = false;
	},
	loadWorkspace: function(){
		if ($$('div.mocha').length != 0){
			this.loadingWorkspace = true;
			this.myChain = new Chain();
			this.myChain.chain(
    			function(){					
					$$('div.mocha').each(function(el) {
						this.closeWindow(el);
					}.bind(this));
					$$('div.mochaDockButton').destroy();
				}.bind(this),			
    			function(){
					this.loadWorkspace2();			
				}.bind(this)
			);
			this.myChain.callChain();
		}
		else {
			this.loadWorkspace2();
		}
	
	},
	/*
	
	Function: dynamicResize
		Use with a timer to resize a window as the window's content size changes, such as with an accordian.
		
	*/		
	dynamicResize: function (windowEl){
		currentWindowClass = MochaUI.Windows.instances.get(windowEl.id);		
		currentWindowClass.contentWrapperEl.setStyle('height', currentWindowClass.contentEl.offsetHeight);
		currentWindowClass.contentWrapperEl.setStyle('width', currentWindowClass.contentEl.offsetWidth);			
		currentWindowClass.drawWindow(windowEl);
	},	
	/*
	
	Function: garbageCleanUp
		Empties all windows of their children, and removes and garbages the windows. It is does not trigger onClose() or onCloseComplete(). This is useful to clear memory before the pageUnload.
		
	Syntax:
	(start code)
		MochaUI.garbageCleanUp();
	(end)
	
	*/	
	garbageCleanUp: function() {
		$$('div.mocha').each(function(el) {
			el.destroy();
		}.bind(this));		
	}	
});
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
	// The container defaults to 'mochaDesktop'. If no desktop then to document.body. Use 'mochaPageWrapper' if you don't want the windows to overlap the toolbars.
	container:         null,  // Element the window is injected in. 
	restrict:          true,  // Restrict window to container when dragging.
	shape:             'box',   // Shape of window; box or gauge.
	
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
	resizeLimit:       {'x': [250, 2500], 'y': [125, 2000]},	// Minimum and maximum width and height of window when resized.
	
	// Style options:
	addClass:          null,    // Add a class to your window to give you more control over styling.	
	width:             300,     // Width of content area.	
	height:            125,     // Height of content area.
	x:                 null,    // If x and y are left undefined the window is centered on the page. !!! NEED TO MAKE THIS WORK WITH THE CONTAINER OPTION. 
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
		
		// Modal windows are not resizable or draggable.
		// Remove the following lines if you want them to be
		if (this.options.modal == true){
			this.options.resizable = false;
			this.options.draggable = false;
		}
		
		// Gauges are not maximizable or resizable
		if (this.options.shape == 'gauge'){
			this.options.resizable = false;
			this.options.maximizable = false;
			this.options.bodyBgColor = 'transparent';
			this.options.scrollbars = false;			
		}

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
		if (!this.options.container || this.options.modal == true){
			this.options.container = MochaUI.Desktop.desktop ? MochaUI.Desktop.desktop : document.body;			 
		}

		this.windowEl.injectInside(this.options.container);
		this.drawWindow(this.windowEl);

		// Attach events to the window
		this.attachDraggable(this.windowEl, this.titleBarEl);		
		this.attachResizable(this.windowEl);
		this.setupEvents(this.windowEl);
		
		if (this.options.resizable){
			this.adjustHandles();
		}

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
		this.windowDrag = new Drag.Move(windowEl, {
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
		if (!this.options.resizable){
			return;
		}
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
			modifiers: {'x': false, y: 'top'},
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
				y: [this.options.resizeLimit.y[0] - this.HeaderFooterShadow, this.options.resizeLimit.y[1] - this.HeaderFooterShadow]					
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
				y: [this.options.resizeLimit.y[0] - this.HeaderFooterShadow, this.options.resizeLimit.y[1] - this.HeaderFooterShadow]	
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
			modifiers: {'x': 'left', y: false},
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
		
		if (this.options.shape == 'gauge'){
			this.contentBorderEl.setStyle('borderWidth', 0);
		}
		
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

	
		
		//Insert mochaTitlebar controls
		this.controlsEl = new Element('div', {
			'class': 'mochaControls',
			'id': this.options.id + '_controls'
		}).injectAfter(this.overlayEl);
		
		//Insert close button
		if (this.options.closable){
			this.closeButtonEl = new Element('div', {
				'class': 'mochaClose',
				'title': 'Close',
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
		
		//Insert resize handles
		
		if (this.options.resizable){
			
			this.n = new Element('div', {
				'id': this.options.id + '_resizeHandle_n',
				'class': 'handle',		
				'styles': {
					'top': 0,
					'left': 10,
					'cursor': 'n-resize'
				}
			}).inject(this.overlayEl, 'after');
			
			this.ne = new Element('div', {
				'id': this.options.id + '_resizeHandle_ne',
				'class': 'handle corner',		
				'styles': {
					'top': 0,
					'right': 0,
					'cursor': 'ne-resize'
				}
			}).inject(this.overlayEl, 'after');
			
			this.e = new Element('div', {
				'id': this.options.id + '_resizeHandle_e',
				'class': 'handle',		
				'styles': {
					'top': 10,
					'right': 0,
					'cursor': 'e-resize'
				}
			}).inject(this.overlayEl, 'after');
			
			this.se = new Element('div', {
				'id': this.options.id + '_resizeHandle_se',
				'class': 'handle cornerSE',		
				'styles': {
					'bottom': 0,
					'right': 0,
					'cursor': 'se-resize'
				}
			}).inject(this.overlayEl, 'after');
			
			this.s = new Element('div', {
				'id': this.options.id + '_resizeHandle_s',
				'class': 'handle',		
				'styles': {
					'bottom': 0,
					'left': 10,
					'cursor': 's-resize'
				}
			}).inject(this.overlayEl, 'after');
			
			this.sw = new Element('div', {
				'id': this.options.id + '_resizeHandle_sw',
				'class': 'handle corner',		
				'styles': {
					'bottom': 0,
					'left': 0,
					'cursor': 'sw-resize'
				}
			}).inject(this.overlayEl, 'after');
			
			this.w = new Element('div', {
				'id': this.options.id + '_resizeHandle_w',
				'class': 'handle',		
				'styles': {
					'top': 10,
					'left': 0,
					'cursor': 'w-resize'
				}
			}).inject(this.overlayEl, 'after');
			
			this.nw = new Element('div', {
				'id': this.options.id + '_resizeHandle_nw',
				'class': 'handle corner',		
				'styles': {
					'top': 0,
					'left': 0,
					'cursor': 'nw-resize'
				}
			}).inject(this.overlayEl, 'after');
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
		
		// Calculate X position for controlbuttons
		this.closebuttonX = width - (this.options.closable ? (this.options.shadowBlur + 12) : (this.options.shadowBlur - 7));
		this.maximizebuttonX = this.closebuttonX - (this.maximizable ? 19 : 0);
		this.minimizebuttonX = this.maximizebuttonX - (this.minimizable ? 19 : 0);		

		// Draw shapes
		var ctx = this.canvasEl.getContext('2d');
		var dimensions = document.getCoordinates();
		ctx.clearRect(0, 0, dimensions.width, dimensions.height);	

		switch(this.options.shape) {
			case 'box':
				this.drawBox(ctx, width, height, shadows);
				break;
			case 'gauge':
				this.drawGauge(ctx, width, height, shadows);
				break;				
		}		

	},
	drawBox: function(ctx, width, height, shadows){
	
		// This is the drop shadow. It is created onion style with three layers
		if ( shadows != false ) {	
			for (var x = 0; x <= this.options.shadowBlur; x++){
				MochaUI.roundedRect(ctx, x, x, width - (x * 2), height - (x * 2), this.options.cornerRadius + (this.options.shadowBlur - x), [0, 0, 0], x == this.options.shadowBlur ? .3 : .06 + (x * .01) );
			}
		}	

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

		if ( this.options.closable )
			this.closebutton(ctx, this.closebuttonX, (this.options.shadowBlur + 12), this.options.closeBgColor, 1.0, this.options.closeColor, 1.0);
		if ( this.maximizable )
			this.maximizebutton(ctx, this.maximizebuttonX, (this.options.shadowBlur + 12), this.options.maximizeBgColor, 1.0, this.options.maximizeColor, 1.0);
		if ( this.minimizable )
			this.minimizebutton(ctx, this.minimizebuttonX, (this.options.shadowBlur + 12), this.options.minimizeBgColor, 1.0, this.options.minimizeColor, 1.0); // Minimize
		if ( this.options.resizable ) 
			MochaUI.triangle(ctx, width - (this.options.shadowBlur + 17), height - (this.options.shadowBlur + 18), 11, 11, this.options.resizableColor, 1.0); // Resize handle

		// Invisible dummy object. The last element drawn is not rendered consistently while resizing in IE6 and IE7
		if ( Browser.Engine.trident4 ){
			MochaUI.triangle(ctx, 0, 0, 10, 10, this.options.resizableColor, 0);
		}

	},
	drawGauge: function(ctx, width, height, shadows){
		
		// This is the drop shadow. It is created onion style with three layers
		if ( shadows != false ) {	
			for (var x = 0; x <= this.options.shadowBlur; x++){
				
				MochaUI.circle(ctx, width * .5, height * .5, (width *.5) - (x * 2), [0, 0, 0], x == this.options.shadowBlur ? .6 : .06 + (x * .04));
			}
		}
		MochaUI.circle(ctx, width * .5, height * .5, (width *.5) - (this.options.shadowBlur), [250, 250, 250], 1);
		
		if ( this.options.closable )
			this.closebutton(ctx, this.closebuttonX, (this.options.shadowBlur + 12), this.options.closeBgColor, 1.0, this.options.closeColor, 1.0);
		if ( this.minimizable )
			this.minimizebutton(ctx, this.minimizebuttonX, (this.options.shadowBlur + 12), this.options.minimizeBgColor, 1.0, this.options.minimizeColor, 1.0); // Minimize		
		
		
	},		
	// Window body
	bodyRoundedRect: function(ctx, x, y, width, height, radius, rgb){
		with (ctx) {
			fillStyle = 'rgba(' + rgb.join(',') + ', 100)';
			beginPath();
			moveTo(x, y + radius);
			lineTo(x, y + height - radius);
			quadraticCurveTo(x, y + height, x + radius, y + height);
			lineTo(x + width - radius, y + height);
			quadraticCurveTo(x + width, y + height, x + width, y + height - radius);
			lineTo(x + width, y + radius);
			quadraticCurveTo(x + width, y, x + width - radius, y);
			lineTo(x + radius, y);
			quadraticCurveTo(x, y, x, y + radius);
			fill();
		}
	},
	// Window header with gradient background
	topRoundedRect: function(ctx, x, y, width, height, radius, headerStartColor, headerStopColor){

		// Create gradient
	//	if (Browser.Engine.presto != null ){
	//		var lingrad = ctx.createLinearGradient(0, 0, 0, this.options.headerHeight + 2);
	//	}
	//	else {
			var lingrad = ctx.createLinearGradient(0, 0, 0, this.options.headerHeight);
	//	}

		lingrad.addColorStop(0, 'rgba(' + headerStartColor.join(',') + ', 1)');
		lingrad.addColorStop(1, 'rgba(' + headerStopColor.join(',') + ', 1)');
		
		with (ctx) {
			fillStyle = lingrad;
			// Draw header
			beginPath();
			moveTo(x, y);
			lineTo(x, y + height);
			lineTo(x + width, y + height);
			lineTo(x + width, y + radius);
			quadraticCurveTo(x + width, y, x + width - radius, y);
			lineTo(x + radius, y);
			quadraticCurveTo(x, y, x, y + radius);
			fill();
		}
	},
	maximizebutton: function(ctx, x, y, rgbBg, aBg, rgb, a){ // This could reuse the circle method above
		with (ctx) {	
			// Circle
			beginPath();
			moveTo(x, y);
			arc(x, y, 7, 0, Math.PI*2, true);
			fillStyle = 'rgba(' + rgbBg.join(',') + ',' + aBg + ')';
			fill();
			// X sign
			strokeStyle = 'rgba(' + rgb.join(',') + ',' + a + ')';		
			beginPath();
			moveTo(x, y - 4);
			lineTo(x, y + 4);
			stroke();
			beginPath();
			moveTo(x - 4, y);
			lineTo(x + 4, y);
			stroke();
		}
	},
	closebutton: function(ctx, x, y, rgbBg, aBg, rgb, a){ // This could reuse the circle method above
		with (ctx) {
			// Circle
			beginPath();
			moveTo(x, y);
			arc(x, y, 7, 0, Math.PI*2, true);
			fillStyle = 'rgba(' + rgbBg.join(',') + ',' + aBg + ')';
			fill();
			// Plus sign
			strokeStyle = 'rgba(' + rgb.join(',') + ',' + a + ')';		
			beginPath();
			moveTo(x - 3, y - 3);
			lineTo(x + 3, y + 3);
			stroke();
			beginPath();
			moveTo(x + 3, y - 3);
			lineTo(x - 3, y + 3);
			stroke();
		}
	},
	minimizebutton: function(ctx, x, y, rgbBg, aBg, rgb, a){ // This could reuse the circle method above
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
/*

Script: Modal.js
	Create modal dialog windows.

License:
	MIT-style license.	

Requires:
	Core.js, Window.js
	
See Also:
	<Window>	
	
*/

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
/*

Script: Windows-from-html.js
	Create windows from html markup in page.

License:
	MIT-style license.	

Requires:
	Core.js, Window.js
	
Example:
	HTML markup.
	(start code)
<div class="mocha" id="mywindow" style="width:300px;height:255px;top:50px;left:350px">
	<h3 class="mochaTitle">My Window</h3>
	<p>My Window Content</p>
</div>	
	(end)

See Also:
	<Window>

*/

MochaUI.extend({
	NewWindowsFromHTML: function(){
		$$('div.mocha').each(function(el) {
			// Get the window title and destroy that element, so it does not end up in window content
			if ( Browser.Engine.presto || Browser.Engine.trident5 ){
				el.setStyle('display','block'); // Required by Opera, and probably IE7
			}
			var title = el.getElement('h3.mochaTitle');
			var elDimensions = el.getStyles('height', 'width');
			var properties = {
				id: el.getProperty('id'),
				height: elDimensions.height.toInt(),
				width: elDimensions.width.toInt(),
				x: el.getStyle('left').toInt(),
				y: el.getStyle('top').toInt()
			};
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
/*

Script: Windows-from-json.js
	Create one or more windows from JSON data. You can define all the same properties as you can for new MochaUI.Window(). Undefined properties are set to their defaults.

License:
	MIT-style license.	

Syntax:
	(start code)
	MochaUI.newWindowsFromJSON(properties);
	(end)

Example:
	(start code)
	MochaUI.jsonWindows = function(){
		var url = 'data/json-windows-data.js';
		var request = new Request.JSON({
			url: url,
			method: 'get',										  
			onComplete: function(properties) {
				MochaUI.newWindowsFromJSON(properties.windows);
			}
		}).send();		
	}
	(end)
	
See Also:
	<Window>	

*/

MochaUI.extend({	
	newWindowsFromJSON: function(properties){
		properties.each(function(properties) {
				new MochaUI.Window(properties);
		}.bind(this));
	}
});
/*

Script: Window-from-form.js
	Create a window from a form.

License:
	MIT-style license.
	
Requires:
	Core.js, Window.js
	
See Also:
	<Window>	

*/

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
/*

Script: Arrange-cascade.js
	Cascade windows.

License:
	MIT-style license.	

Requires:
	Core.js, Window.js
	
Syntax:
	(start code)
	MochaUI.arrangeCascade();
	(end)

*/

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
		var x = this.options.desktopLeftOffset;
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
		//if (Browser.Engine.presto != null ){
		//	var lingrad = ctx.createLinearGradient(0, 0, 0, 35 + 10);
		//}
		//else {
			var lingrad = ctx.createLinearGradient(0, 0, 0, 35);
		//}

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
		
		// If the window has a container that is not the desktop
		// temporarily move the window to the desktop while it is minimized.
		if (currentWindowClass.options.container != this.options.desktop){
			this.desktop.grab(windowEl);
			currentWindowClass.windowDrag.container = this.desktop;
		}		
		
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
				'top': -currentWindowClass.options.shadowBlur,
				'left': -currentWindowClass.options.shadowBlur
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
				'1': {	'top':  -currentWindowClass.options.shadowBlur, // Takes shadow width into account
						'left': -currentWindowClass.options.shadowBlur  // Takes shadow width into account
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
			if (currentWindowClass.options.container != this.options.desktop){
				$(currentWindowClass.options.container).grab(windowEl);
				currentWindowClass.windowDrag.container = $(currentWindowClass.options.container);
			}			
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
					if (currentWindowClass.options.container != this.options.desktop){
						$(currentWindowClass.options.container).grab(windowEl);
						currentWindowClass.windowDrag.container = $(currentWindowClass.options.container);
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
		dockWrapper: 'mochaDockWrapper',
		dock:        'mochaDock'
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
		
		// Draw dock controls
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
		currentWindowClass.fireEvent('onMinimize', windowEl);

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
/*

Script: Workspaces.js
	Create multiple workspaces.
	
License:
	MIT-style license.

Requires:
	Core.js, Window.js, Desktop.js

Notes:
	This will become Tabs, which will use workspaces. The Workspaces emulate Adobe Illustrator functionality. This is experimental.

Todo: 
	- Make an easy way for Workspaces to have different css.
	
	- Each screen should be a separate workspace with it's own windows.
	
	- Workspaces change the styling of MochaDesktop and which windows are visible and in the dock.
	
	- Dynamically create new Workspaces.	

	- Workspace content should be loaded like windows are.

*/

MochaUI.Workspaces = new Class({
	options: {
		index:       0,     // Default screen
		background:  '#8caac7'
	},
	initialize: function(options){
		this.setOptions(options);
		this.setTab(this.options);
		this.currentWorkspace = this.options.index;
	},
	setTab: function(properties) {
		
		// MAKE IF index = current index return
		
		// Merge new options with defaults
		var options = new Hash(this.options);
		options.extend(properties);
		
		if (this.currentWorkspace == options.index) {
			return;
		}
		else {
			this.currentWorkspace = options.index;	
		}
		
		MochaUI.Desktop.pageWrapper.setStyles({
			'background': options.background ? options.background : options.background					
		});			
	/*	$$('#mochaWorkspaces div.workspace').each(function(el,i) {
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
		});	*/	
	}
});
MochaUI.Workspaces.implement(new Options);
/*

Script: Corner-slider.js
	Initializes the corner radius slider.

License:
	MIT-style license.
	
Requires:
	Core.js, Window.js		

*/

MochaUI.extend({
	addRadiusSlider: function(){
		if ($('radiusSliderarea')) {
			var sliderFirst = true;
			mochaSlide = new Slider($('radiusSliderarea'), $('radiusSliderknob'), {
				steps: 20,
				offset: 0,
				onChange: function(pos){
					$('radiusUpdatevalue').set('html', pos);
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
	},
	addShadowSlider: function(){
		if ($('shadowSliderarea')) {
			var sliderFirst = true;
			mochaSlide = new Slider($('shadowSliderarea'), $('shadowSliderknob'), {
				range: [1, 10],											 
				offset: 0,
				onStart: function(){
					// Set variable to adjust position in relation to shadow width
					MochaUI.Windows.instances.each(function(instance) {
						instance.adjusted = false;
					}.bind(this));			
				}.bind(this),
				onChange: function(pos){
					$('shadowUpdatevalue').set('html', pos);					
					// Change default shadow width of the original class
					windowOptions.shadowBlur = pos;					
					MochaUI.Window.implement({ options: windowOptions });					
					// Don't redraw windows the first time the slider is initialized
					// !!! Probably need to make this separate from the corner radius slider
					if (sliderFirst == true) { 
						sliderFirst = false;
						return;
					}					
					// Change shadow width of all active classes and their windows
					MochaUI.Windows.instances.each(function(instance) {															
						instance.oldshadowBlur = instance.options.shadowBlur;									
						instance.options.shadowBlur = pos;					
						instance.windowEl.setStyles({
							'top': instance.windowEl.getStyle('top').toInt() - (instance.options.shadowBlur - instance.oldshadowBlur) ,
							'left': instance.windowEl.getStyle('left').toInt() - (instance.options.shadowBlur - instance.oldshadowBlur)
						});
						instance.drawWindow($(instance.options.id));
					}.bind(this));					
					MochaUI.indexLevel++; 
				}.bind(this),
				onComplete: function(){
					MochaUI.Windows.instances.each(function(instance) {
						if (instance.options.resizable){										
							instance.adjustHandles();
						}
					}.bind(this));			
				}.bind(this)				
			}).set(windowOptions.shadowBlur);
		}
	}	
});
