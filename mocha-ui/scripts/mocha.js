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
	
Note:
	This documentation is taken directly from the javascript source files. It is built using Natural Docs.
	
*/

var MochaUI = new Hash({
	options: new Hash({
		useEffects: true,     // Toggles the majority of window fade and move effects.
		useLoadingIcon: true  // Toggles whether or not the ajax spinners are displayed in window footers.

	}),	
	Windows: {	  
		instances:      new Hash(),
		indexLevel:     1,            // Used for z-Index
		windowIDCount:  0,	          // Used for windows without an ID defined by the user
		windowsVisible: true          // Ctrl-Alt-Q to toggle window visibility		
	},
	ieSupport:  'excanvas',   // Makes it easier to switch between Excanvas and Moocanvas for testing
	/*
	
	Function: updateContent
		Replace the content of a window.
		
	Arguments:
		windowEl, content, url
		
	*/	
	updateContent: function(windowEl, content, url){
		
		if (!windowEl) return;		
		
		var currentInstance = MochaUI.Windows.instances.get(windowEl.id);
		var options = currentInstance.options;
		var contentEl = currentInstance.contentEl;
		var canvasIconEl = currentInstance.canvasIconEl;
		
		// Remove old content.
		currentInstance.contentEl.empty();

		// Load new content.
		switch(currentInstance.options.loadMethod) {
			case 'xhr':
				new Request.HTML({
					url: url,
					update: contentEl,
					evalScripts: options.evalScripts,
					evalResponse: options.evalResponse,
					onRequest: function(){
						currentInstance.showLoadingIcon(canvasIconEl);
					}.bind(this),
					onFailure: function(){
						contentEl.set('html','<p><strong>Error Loading XMLHttpRequest</strong></p><p>Make sure all of your content is uploaded to your server, and that you are attempting to load a document from the same domain as this page. XMLHttpRequests will not work on your local machine.</p>');
						currentInstance.hideLoadingIcon.delay(150, currentInstance, canvasIconEl);
					}.bind(this),
					onSuccess: function() {
						currentInstance.hideLoadingIcon.delay(150, currentInstance, canvasIconEl);
						currentInstance.fireEvent('onContentLoaded', windowEl);
					}.bind(this)
				}).get();
				break;
			case 'iframe': // May be able to streamline this if the iframe already exists.
				if ( options.contentURL == '') {
					break;
				}
				currentInstance.iframeEl = new Element('iframe', {
					'id': currentInstance.options.id + '_iframe', 
					'class': 'mochaIframe',
					'src': url,
					'marginwidth':  0,
					'marginheight': 0,
					'frameBorder':  0,
					'scrolling':    'auto',
					'styles': {
						'height': currentInstance.contentWrapperEl.offsetHeight	
					}
				}).injectInside(contentEl);
				
				// Add onload event to iframe so we can stop the loading icon and run onContentLoaded()
				currentInstance.iframeEl.addEvent('load', function(e) {
					currentInstance.hideLoadingIcon.delay(150, currentInstance, canvasIconEl);
					currentInstance.fireEvent('onContentLoaded', windowEl);
				}.bind(this));
				currentInstance.showLoadingIcon(canvasIconEl);
				break;
			case 'html':
			default:
				// Need to test injecting elements as content.
				var elementTypes = new Array('element', 'textnode', 'whitespace', 'collection');
				if (elementTypes.contains($type(content))) {
					content.inject(contentEl);
				} else {
					contentEl.set('html', content);
				}				
				currentInstance.fireEvent('onContentLoaded', windowEl);
				break;
		}

	},
	collapseToggle: function(windowEl){
		var instances = MochaUI.Windows.instances;
		var currentInstance = instances.get(windowEl.id);		
		if (currentInstance.isCollapsed == false) {
			currentInstance.isCollapsed = true;
			if ( currentInstance.iframe ) {
				currentInstance.iframeEl.setStyle('visibility', 'hidden');
			}			
			currentInstance.contentBorderEl.setStyles({
				visibility: 'hidden',
				position: 'absolute',
				top: -10000,
				left: -10000
			});				
			currentInstance.drawWindowCollapsed(windowEl);
		}
		else {			
			currentInstance.isCollapsed = false;
			currentInstance.drawWindow(windowEl);					
			currentInstance.contentBorderEl.setStyles({
				visibility: 'visible',
				position: null,
				top: null,
				left: null
			});
			if ( currentInstance.iframe ) {
				currentInstance.iframeEl.setStyle('visibility', 'visible');
			}			
		}		
	},
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

		var instances = MochaUI.Windows.instances;
		var currentInstance = instances.get(windowEl.id);
		if (windowEl != $(windowEl) || currentInstance.isClosing )	return;
			
		currentInstance.isClosing = true;
		currentInstance.fireEvent('onClose', windowEl);

		if (MochaUI.options.useEffects == false){
			if (currentInstance.options.type == 'modal') {
				$('modalOverlay').setStyle('opacity', 0);
			}
			windowEl.destroy();
			currentInstance.fireEvent('onCloseComplete');
			instances.erase(currentInstance.options.id); // see how this effects on close complete
			if(this.loadingWorkspace == true){
				this.windowUnload();
			}
		}
		else {
			// Redraws IE windows without shadows since IE messes up canvas alpha when you change element opacity
			if (Browser.Engine.trident) currentInstance.drawWindow(windowEl, false);
			if (currentInstance.options.type == 'modal') {
				MochaUI.Modal.modalOverlayCloseMorph.start({
					'opacity': 0
				});
			}
			var closeMorph = new Fx.Morph(windowEl, {
				duration: 180,
				onComplete: function(){
					windowEl.destroy();
					currentInstance.fireEvent('onCloseComplete');
					instances.erase(currentInstance.options.id); // see how this effects on close complete
					if(this.loadingWorkspace == true){
						this.windowUnload();
					}
				}.bind(this)
			});
			closeMorph.start({
				'opacity': .4
			});
		}
		if (currentInstance.check) currentInstance.check.destroy();
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
		$$('div.dockButton').destroy();
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
			var id = $(instance.options.id);									
			if (id.getStyle('visibility') == 'visible'){												
				id.setStyle('visibility', 'hidden');
				MochaUI.Windows.windowsVisible = false;
			}
			else {
				id.setStyle('visibility', 'visible');
				MochaUI.Windows.windowsVisible = true;
			}
		}.bind(this));

	},	
	focusWindow: function(windowEl){
		if (windowEl != $(windowEl)) return;
		
		var instances =  MochaUI.Windows.instances;
		
		var currentInstance = instances.get(windowEl.id);			
		// Only focus when needed
		if ( windowEl.getStyle('zIndex').toInt() == MochaUI.Windows.indexLevel || currentInstance.isFocused == true)
			return;

		MochaUI.Windows.indexLevel++;
		windowEl.setStyle('zIndex', MochaUI.Windows.indexLevel);

		// Fire onBlur for the window that lost focus.
		instances.each(function(instance){
			if (instance.isFocused == true){
				instance.fireEvent('onBlur', instance.windowEl);
			}
			instance.isFocused = false;			
		});			
		currentInstance.isFocused = true;		
		currentInstance.fireEvent('onFocus', windowEl);
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
	
	Function: centerWindow
		Center a window in it's container. If windowEl is undefined it will center the window that has focus.
		
	*/	
	centerWindow: function(windowEl){
		
		if(!windowEl){
			MochaUI.Windows.instances.each(function(instance){
				if (instance.isFocused == true){
					windowEl = instance.windowEl;
				}				
			});		
		}
		
		var currentInstance = MochaUI.Windows.instances.get(windowEl.id);
		var options = currentInstance.options;
		var dimensions = options.container.getCoordinates();
		var windowPosTop = (dimensions.height * .5) - ((options.height + currentInstance.headerFooterShadow) * .5);
		var windowPosLeft =	(dimensions.width * .5) - (options.width * .5);
		
		if (MochaUI.options.useEffects == true){
			currentInstance.morph.start({
				'top': windowPosTop,
				'left': windowPosLeft
			});
		}
		else {
			windowEl.setStyles({
				'top': windowPosTop,
				'left': windowPosLeft
			});
		}
	},
	/*
	
	Function: dynamicResize
		Use with a timer to resize a window as the window's content size changes, such as with an accordian.
		
	*/		
	dynamicResize: function(windowEl){
		var currentInstance = MochaUI.Windows.instances.get(windowEl.id);
		var contentWrapperEl = currentInstance.contentWrapperEl;
		var contentEl = currentInstance.contentEl;
		
		contentWrapperEl.setStyle('height', contentEl.offsetHeight);
		contentWrapperEl.setStyle('width', contentEl.offsetWidth);			
		currentInstance.drawWindow(windowEl);
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

// Toggle window visibility with Ctrl-Alt-Q
document.addEvent('keydown', function(event){							 
	if (event.key == 'q' && event.control && event.alt) {
		MochaUI.toggleWindowVisibility();
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
MochaUI.Windows.windowOptions = {
	id:                null,
	title:             'New Window',
	modal:             false,
	type:              'window',  // window, modal or notification. NOT YET IMPLEMENTED	
	
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
	minimizable:       true,  // Requires MochaUI.Desktop and MochaUI.Dock.
	maximizable:       true,  // Requires MochaUI.Desktop.
	closable:          true,  

	// Draggable
	draggable:         null,  // Defaults to false for modals; otherwise true.
	draggableGrid:     false, // Distance in pixels for snap-to-grid dragging.
	draggableLimit:    false, // An object with x and y properties used to limit the movement of the Window.	
	draggableSnap:     false, // The distance to drag before the Window starts to respond to the drag.

	// Resizable
	resizable:         null,  // Defaults to false for modals and gauges; otherwise true.
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
			options.maximizable = false;
			options.bodyBgColor = 'transparent';
			options.scrollbars = false;
			options.footerHeight = 0;			
		}
		if (options.type == 'notification'){
			options.minimizable = false;
			options.closable = false;			
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
			if (currentInstance.isMinimized) { // If minimized -> restore
				MochaUI.Dock.restoreMinimized(this.windowEl);
			}
			else { // else focus
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

		if ((this.options.type == 'modal') || (Browser.Platform.mac && Browser.Engine.gecko)){
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

		// Move new window into position. If position not specified by user then center the window on the page.
		// We do this last so that the effects are as smooth as possible, not interrupted by other functions.
		var dimensions = this.options.container.getCoordinates();

		if (!this.options.y) {
			var windowPosTop = (dimensions.height * .5) - ((this.options.height + this.headerFooterShadow) * .5);
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

		if (this.options.type != 'modal'){		
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
		
		this.drawControls(width, height, shadows);

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
		if ( Browser.Engine.trident4 ){
			MochaUI.triangle(
				ctx, 0, 0, 10, 10, options.resizableColor, 0);
		}		

	},
	drawWindowCollapsed: function(windowEl, shadows) {
		
		var options = this.options;
		var shadowBlur = options.shadowBlur;
		var shadowBlur2x = shadowBlur * 2;
		
		this.headerFooterShadow = options.headerHeight + shadowBlur2x + 3;
		var height = this.headerFooterShadow;
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
		if ( Browser.Engine.trident4 ){
			MochaUI.triangle(
				ctx, 0, 0, 10, 10, options.resizableColor, 0);
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
			this.options.headerHeight + 3,      // height
			cornerRadius,                   // corner radius
			this.options.headerStartColor,  // Header gradient's top color
			this.options.headerStopColor    // Header gradient's bottom color
		);

	},	
	drawBox: function(ctx, width, height, shadows){	
	
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
		// Mocha body
		this.bodyRoundedRect(
			ctx,                         // context
			shadowBlur,                  // x
			shadowBlur - 1,              // y
			width - shadowBlur2x,        // width
			height - shadowBlur2x,       // height
			cornerRadius,                // corner radius
			this.options.footerBgColor   // Footer color
		);

		// Mocha header
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

	},
	drawGauge: function(ctx, width, height, shadows){
		
		// Shorten object chain
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
		var lingrad = ctx.createLinearGradient(0, 0, 0, this.options.headerHeight);
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
			'id': 'modalOverlay',
			'styles': {
				'height': document.getCoordinates().height
			}
		});
		modalOverlay.injectInside(document.body);
		
		modalOverlay.setStyle('opacity', .4);
		this.modalOverlayOpenMorph = new Fx.Morph($('modalOverlay'), {
				'duration': 200
				});
		this.modalOverlayCloseMorph = new Fx.Morph($('modalOverlay'), {
			'duration': 200,
			onComplete: function(){
				$('modalOverlay').setStyle('display', 'none');
			}.bind(this)
		});
	},
	setModalSize: function(){
		$('modalOverlay').setStyle('height', document.getCoordinates().height);
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
		this.options.id = 'win' + (++MochaUI.Windows.windowIDCount);
		this.options.title = $('newWindowHeaderTitle').value;
		if ($('htmlLoadMethod').checked){
			this.options.loadMethod = 'html';
		}
		if ($('iframeLoadMethod').checked){
			this.options.loadMethod = 'iframe';
		}
		this.options.content = $('newWindowContent').value;
		
		// Remove eval(), javascript:, and script from User Provided Markup		
		this.options.content = this.options.content.replace(/\<(.*)script(.*)\<\/(.*)script(.*)\>/g, ""); 
    	this.options.content = this.options.content.replace(/[\"\'][\s]*javascript:(.*)[\"\']/g, "\"\"");    
    	this.options.content = this.options.content.replace(/eval\((.*)\)/g, "");		
		
		if ($('newWindowContentURL').value){
			this.options.contentURL = $('newWindowContentURL').value;
		}		
		if ($('newWindowModal').checked) {
			this.options.modal = true;
		}
		this.options.width = $('newWindowWidth').value.toInt();
		this.options.height = $('newWindowHeight').value.toInt();	
		this.options.x = $('newWindowX').value.toInt();
		this.options.y = $('newWindowY').value.toInt();
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
	
Todo: Add dblclick to window titlebars to maximize/restore	

*/

MochaUI.Desktop = new Class({
							
	Extends: MochaUI.Window,
	
	Implements: [Events, Options],
	
	options: {
		useHeaderCanvas: true,          		
		// Naming options:
		// If you change the IDs of the Mocha Desktop containers in your HTML, you need to change them here as well.
		desktop:                'desktop',
		desktopHeader:          'desktopHeader',
		desktopTitlebarWrapper: 'desktopTitlebarWrapper',
		desktopNavBar:          'desktopNavbar',
		pageWrapper:            'pageWrapper',
		page:                   'page',
		sidebarWrapper:         'sidebarWrapper',		
		sidebar:                'sidebar',
		sidebarContentWrapper:  'sidebarContentWrapper',		
		sidebarMinimize:        'sidebarControl',
		sidebarHandle:          'sidebarHandle',
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
		var lingrad = ctx.createLinearGradient(0, 0, 0, 35);

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

		// var dock = $(MochaUI.options.dock);
		var dockWrapper = $(MochaUI.options.dockWrapper);
		
		// Setting the desktop height may only be needed by IE7
		if (this.desktop){
			this.desktop.setStyle('height', windowDimensions.height);
		}

		// Set pageWrapper height so the dock doesn't cover the pageWrapper scrollbars.
		if (this.pageWrapper && this.desktopHeader) {
					
			var dockOffset = MochaUI.dockVisible ? dockWrapper.offsetHeight : 0;			
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

		var currentInstance = MochaUI.Windows.instances.get(windowEl.id);
		var windowDrag = currentInstance.windowDrag;

		// If window no longer exists or is maximized, stop
		if (windowEl != $(windowEl) || currentInstance.isMaximized ) return;
		
		if (currentInstance.isCollapsed){
			MochaUI.collapseToggle(windowEl);	
		}

		currentInstance.isMaximized = true;
		
		// If window is restricted to a container, it should not be draggable when maximized.
		if (currentInstance.options.restrict){
			windowDrag.detach();
			currentInstance.titleBarEl.setStyle('cursor', 'default');
		}	
		
		// If the window has a container that is not the desktop
		// temporarily move the window to the desktop while it is minimized.
		if (currentInstance.options.container != this.options.desktop){
			this.desktop.grab(windowEl);
			windowDrag.container = this.desktop;
		}		
		
		// Save original position
		currentInstance.oldTop = windowEl.getStyle('top');
		currentInstance.oldLeft = windowEl.getStyle('left');
		
		var contentWrapperEl = currentInstance.contentWrapperEl;
		
		// Save original dimensions
		contentWrapperEl.oldWidth = contentWrapperEl.getStyle('width');
		contentWrapperEl.oldHeight = contentWrapperEl.getStyle('height');
		
		// Hide iframe
		// Iframe should be hidden when minimizing, maximizing, and moving for performance and Flash issues
		if ( currentInstance.iframe ) {
			currentInstance.iframeEl.setStyle('visibility', 'hidden');
		}

		var windowDimensions = document.getCoordinates();
		var options = currentInstance.options;
		var shadowBlur = options.shadowBlur;

		if (MochaUI.options.useEffects == false){
			windowEl.setStyles({
				'top': -shadowBlur,
				'left': -shadowBlur
			});
			currentInstance.contentWrapperEl.setStyles({
				'height': windowDimensions.height - options.headerHeight - options.footerHeight,
				'width':  windowDimensions.width
			});
			currentInstance.drawWindow(windowEl);
			// Show iframe
			if ( currentInstance.iframe ) {
				currentInstance.iframeEl.setStyle('visibility', 'visible');
			}
			currentInstance.fireEvent('onMaximize', windowEl);
		}
		else {
			
			// Todo: Initialize the variables for these morphs once and reuse them
			
			//var maximizePositionMorph = new Fx.Morph(windowEl, {
			//	'duration': 300
			//});
			var maximizeMorph = new Fx.Elements([contentWrapperEl, windowEl], { 
				duration: 70,
				onStart: function(windowEl){
						currentInstance.maximizeAnimation = currentInstance.drawWindow.periodical(20, currentInstance, windowEl);
				}.bind(this),
				onComplete: function(windowEl){
					$clear(currentInstance.maximizeAnimation);
					currentInstance.drawWindow(windowEl);
					// Show iframe
					if ( currentInstance.iframe ) {
						currentInstance.iframeEl.setStyle('visibility', 'visible');
					}
					currentInstance.fireEvent('onMaximize', windowEl);	
				}.bind(this)
			});
			maximizeMorph.start({
				'0': {	'height': windowDimensions.height - options.headerHeight - options.footerHeight,
						'width':  windowDimensions.width
				},
				'1': {	'top':  -shadowBlur,
						'left': -shadowBlur
				}
			});		
		}
		currentInstance.maximizeButtonEl.setProperty('title', 'Restore');

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
	
		var currentInstance = MochaUI.Windows.instances.get(windowEl.id);
		
		// Window exists and is maximized ?
		if ( !(windowEl = $(windowEl)) || !currentInstance.isMaximized )
			return;
			
		var options = currentInstance.options;			
		
		currentInstance.isMaximized = false;
		
		if (options.restrict){
			currentInstance.windowDrag.attach();
			currentInstance.titleBarEl.setStyle('cursor', 'move');
		}		
		
		// Hide iframe
		// Iframe should be hidden when minimizing, maximizing, and moving for performance and Flash issues
		if ( currentInstance.iframe ) {
			currentInstance.iframeEl.setStyle('visibility', 'hidden');
		}
		
		var contentWrapperEl = currentInstance.contentWrapperEl;
		
		if (MochaUI.options.useEffects == false){
			contentWrapperEl.setStyles({
				'width':  contentWrapperEl.oldWidth,
				'height': contentWrapperEl.oldHeight
			});
			currentInstance.drawWindow(windowEl);
			windowEl.setStyles({
				'top': currentInstance.oldTop,
				'left': currentInstance.oldLeft
			});
			if (container != this.options.desktop){
				$(options.container).grab(windowEl);
				currentInstance.windowDrag.container = $(options.container);
			}
			currentInstance.fireEvent('onRestore', windowEl);
		}
		else {
			var restoreMorph = new Fx.Elements([contentWrapperEl, windowEl], { 
				'duration':   150,
				'onStart': function(windowEl){
					currentInstance.maximizeAnimation = currentInstance.drawWindow.periodical(20, currentInstance, windowEl);			
				}.bind(this),
				'onComplete': function(el){
					$clear(currentInstance.maximizeAnimation);
					currentInstance.drawWindow(windowEl);
					if ( currentInstance.iframe ) {
						currentInstance.iframeEl.setStyle('visibility', 'visible');
					}
					if (options.container != this.options.desktop){
						$(options.container).grab(windowEl);
						currentInstance.windowDrag.container = $(options.container);
					}
					currentInstance.fireEvent('onRestore', windowEl);
				}.bind(this)
			});
			restoreMorph.start({ 
				'0': {	'height': contentWrapperEl.oldHeight,
						'width':  contentWrapperEl.oldWidth
				},
				'1': {	'top':  currentInstance.oldTop,
						'left': currentInstance.oldLeft
				}
			});
		}
		currentInstance.maximizeButtonEl.setProperty('title', 'Maximize');		
		
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
		useControls:          true,       // Toggles autohide and dock placement controls - NOT FULLY IMPLEMENTED
		dockPosition:         'bottom',   // Position the dock starts in, top or bottom.
		// Style options
		dockTabColor:         [255, 255, 255],
		trueButtonColor:      [70, 245, 70],     // Color for autohide on		
		enabledButtonColor:   [255, 70, 70], 
		disabledButtonColor:  [150, 150, 150]		
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
			opacity: Browser.Engine.trident ? 1 : .5,
    		constrain: true,
    		clone: false,
    		revert: false			
		});		

		MochaUI.Desktop.setDesktopSize();		
		this.installed     = true;		
	},
	initializeDockControls: function(){
		
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
				MochaUI.circle(ctx, 5 , 14, 3, this.options.trueButtonColor, 1.0); // green
				
				// Define event
				this.autoHideEvent = function(event) {
					if (!this.dockAutoHide)
						return;
					if (event.client.y > (document.getCoordinates().height - 25)){
						if (!MochaUI.dockVisible){
							this.dockWrapper.setStyle('display', 'block');
							MochaUI.dockVisible = true;
							MochaUI.Desktop.setDesktopSize();
						}
					} else {
						if (MochaUI.dockVisible){
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
				//ctx.clearRect(0, 11, 100, 100);
				MochaUI.circle(ctx, 5 , 14, 3, this.options.enabledButtonColor, 1.0); // red
				// Remove event
				document.removeEvent('mousemove', this.autoHideEvent);
			}
			
		}.bind(this));
		
		// Draw dock controls
		var ctx = $('dockCanvas').getContext('2d');
		ctx.clearRect(0, 0, 100, 100);
		MochaUI.circle(ctx, 5 , 4, 3, this.options.enabledButtonColor, 1.0);  // red
		MochaUI.circle(ctx, 5 , 14, 3, this.options.enabledButtonColor, 1.0); // red
		
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
				MochaUI.circle(ctx, 5, 4, 3, this.options.trueButtonColor, 1.0); // green
				MochaUI.circle(ctx, 5, 14, 3, this.options.disabledButtonColor, 1.0); // gray
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
				this.dockWrapper.setProperty('dockPosition', 'bottom');
				ctx.clearRect(0, 0, 100, 100);
				MochaUI.circle(ctx, 5, 4, 3, this.options.enabledButtonColor, 1.0); // red
				MochaUI.circle(ctx, 5 , 14, 3, this.options.enabledButtonColor, 1.0); // red 
				$('dockPlacement').setProperty('title', 'Position Dock Top');
				$('dockAutoHide').setProperty('title', 'Turn Auto Hide On');
			}		
	},
	minimizeWindow: function(windowEl){		
		if (windowEl != $(windowEl)) return;
			
		var currentInstance = MochaUI.Windows.instances.get(windowEl.id);
		currentInstance.isMinimized = true;

		// Hide iframe
		// Iframe should be hidden when minimizing, maximizing, and moving for performance and Flash issues
		if ( currentInstance.iframe ) {
			currentInstance.iframeEl.setStyle('visibility', 'hidden');
		}
		
		if (currentInstance.options.shape == 'gauge'){
			currentInstance.canvasControlsEl.setStyle('opacity', 0);
		}
		
		var titleText = currentInstance.titleEl.innerHTML;

		// Hide window and add to dock
		currentInstance.contentBorderEl.setStyle('visibility', 'hidden');
		windowEl.setStyle('visibility', 'hidden');

		 // Fixes a scrollbar issue in Mac FF2
		if (Browser.Platform.mac && Browser.Engine.gecko){
			currentInstance.contentWrapperEl.setStyle('overflow', 'hidden');
		}
		
		var dockTab = new Element('div', {
			'id': currentInstance.options.id + '_dockTab',
			'class': 'dockTab',
			'title': titleText
		}).inject($('dockClear'), 'before');
		
		dockTab.addEvent('mousedown', function(e){
			this.timeDown = $time();			
		});
		
		dockTab.addEvent('mouseup', function(e){
			this.timeUp = $time();
			if ((this.timeUp - this.timeDown) < 275){
				MochaUI.Dock.restoreMinimized.delay(25, MochaUI.Dock, windowEl);
			}
		});		

		this.dockSortables.addItems(dockTab);

		//Insert canvas
		var dockTabCanvas = new Element('canvas', {
			'id': currentInstance.options.id + '_dockTabCanvas',
			'class': 'dockCanvas', 
			'width': 120,
			'height': 20			
		}).inject(dockTab);	
		
		// Dynamically initialize canvas using excanvas. This is only required by IE
		if (Browser.Engine.trident && MochaUI.ieSupport == 'excanvas') {
			G_vmlCanvasManager.initElement(dockTabCanvas);
		}

		var ctx = $(currentInstance.options.id + '_dockTabCanvas').getContext('2d');
		MochaUI.roundedRect(ctx, 0, 0, 120, 20, 5, this.options.dockTabColor, 1);	
		
		var dockTabText = new Element('div', {
			'id': currentInstance.options.id + '_dockTabText',
			'class': 'dockText'
		}).set('html', titleText.substring(0,18) + (titleText.length > 18 ? '...' : '')).inject($(dockTab));
		
		MochaUI.Desktop.setDesktopSize();
		
		// Fixes a scrollbar issue in Mac FF2.
		// Have to use timeout because window gets focused when you click on the minimize button 	
		setTimeout(function(){ windowEl.setStyle('zIndex', 1); }.bind(this),100);
		currentInstance.isFocused = false;
		currentInstance.fireEvent('onMinimize', windowEl);		
	},
	restoreMinimized: function(windowEl) {

		var currentInstance = MochaUI.Windows.instances.get(windowEl.id);
		currentButton = $(currentInstance.options.id + '_dockTab');		
		
		this.dockSortables.removeItems(currentButton ).destroy();
		MochaUI.Desktop.setDesktopSize();

		 // Part of Mac FF2 scrollbar fix
		if (currentInstance.options.scrollbars == true && currentInstance.iframe == false){ 
			currentInstance.contentWrapperEl.setStyle('overflow', 'auto');
		}

		windowEl.setStyle('visibility', 'visible');
		currentInstance.contentBorderEl.setStyle('visibility', 'visible');		

		// Show iframe
		if ( currentInstance.iframe ) {
			currentInstance.iframeEl.setStyle('visibility', 'visible');
		}
		currentInstance.isMinimized = false;
		MochaUI.focusWindow(windowEl);
		currentInstance.fireEvent('onRestore', windowEl);		
	}	
});
MochaUI.Dock.implement(new Options, new Events);
/*

Script: Workspaces.js
	Save and load workspaces. The Workspaces emulate Adobe Illustrator functionality remembering what windows are open and where they are positioned. There will be two versions, a limited version that saves state to a cookie, and a fully functional version that saves state to a database.
	
License:
	MIT-style license.

Requires:
	Core.js, Window.js

To do:
	- Move to Window

*/

MochaUI.extend({			   
	/*
	
	Function: saveWorkspace
		Save the current workspace.
	
	Syntax:
	(start code)
		MochaUI.saveWorkspace();
	(end)
	
	Notes:
		This is experimental. This version saves the ID of each open window to a cookie, and reloads those windows using the functions in mocha-init.js. This requires that each window have a function in mocha-init.js used to open them. Functions must be named the windowID + "Window". So if your window is called mywindow, it needs a function called mywindowWindow in mocha-init.js.	
	
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
		
		new MochaUI.Window({
			loadMethod: 'html',
			type: 'notification',
			addClass: 'notification',
			content: 'Workspace saved.',
			width: 200,
			height: 25,
			y: 25,
			padding:  { top: 3, right: 12, bottom: 5, left: 12 },
			shadowBlur: 5,
			headerStartColor:  [255, 255, 255],
			headerStopColor:   [245, 245, 245],
			footerBgColor:     [245, 245, 245]	
		});
		
	},
	windowUnload: function(){
		if ($$('div.mocha').length == 0 && this.myChain){
			this.myChain.callChain();			
		}		
	},
	loadWorkspace2: function(){
		this.cookie = new Hash.Cookie('mochaUIworkspaceCookie', {duration: 3600});
		workspaceWindows = this.cookie.load();
		workspaceWindows.each(function(instance) {		
			eval('MochaUI.' + instance.id + 'Window();');
			$(instance.id).setStyles({
				top: instance.top,
				left: instance.left
			});
		}.bind(this));
		this.loadingWorkspace = false;
	},
	/*
		
	Function: loadWorkspace
		Load the saved workspace.
	
	Syntax:
	(start code)
		MochaUI.loadWorkspace();
	(end)
	
	*/
	loadWorkspace: function(){
		if ($$('div.mocha').length != 0){
			this.loadingWorkspace = true;
			this.myChain = new Chain();
			this.myChain.chain(
    			function(){					
					$$('div.mocha').each(function(el) {
						this.closeWindow(el);
					}.bind(this));
					$$('div.dockButton').destroy();
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
	
	}
});
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
			var windowOptions = MochaUI.Windows.windowOptions;
			var sliderFirst = true;
			var mochaSlide = new Slider($('radiusSliderarea'), $('radiusSliderknob'), {
				steps: 14,
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
					MochaUI.Windows.indexLevel++; 
				}.bind(this)
			}).set(windowOptions.cornerRadius);
		}
	},
	addShadowSlider: function(){
		if ($('shadowSliderarea')) {
			var windowOptions = MochaUI.Windows.windowOptions;			
			var sliderFirst = true;
			var mochaSlide = new Slider($('shadowSliderarea'), $('shadowSliderknob'), {
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
					MochaUI.Windows.indexLevel++; 
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
