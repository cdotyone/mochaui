/*

Script: Window.js
	Build windows.

Copyright:
	Copyright (c) 2007-2009 Greg Houston, <http://greghoustondesign.com/>.

License:
	MIT-style license.	

Requires:
	Core.js

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
	id - The ID of the window. If not defined, it will be set to 'win' + windowIDCount.
	title - The title of the window.
	icon - Place an icon in the window's titlebar. This is either set to false or to the url of the icon. It is set up for icons that are 16 x 16px.
	type - ('window', 'modal', 'modal2', or 'notification') Defaults to 'window'.
	loadMethod - ('html', 'xhr', or 'iframe') Defaults to 'html'.
	contentURL - Used if loadMethod is set to 'xhr' or 'iframe'.
	closeAfter - Either false or time in milliseconds. Closes the window after a certain period of time in milliseconds. This is particularly useful for notifications.
	evalScripts - (boolean) An xhr loadMethod option. Defaults to true.
	evalResponse - (boolean) An xhr loadMethod option. Defaults to false.
	content - (string or element) An html loadMethod option.
	toolbar - (boolean) Create window toolbar. Defaults to false. This can be used for tabs, media controls, and so forth.
	toolbarPosition - ('top' or 'bottom') Defaults to top.
	toolbarHeight - (number)
	toolbarURL - (url) Defaults to 'pages/lipsum.html'.
	toolbarContent - (string)
	toolbarOnload - (function)
	toolbar2 - (boolean) Create window toolbar. Defaults to false. This can be used for tabs, media controls, and so forth.
	toolbar2Position - ('top' or 'bottom') Defaults to top.
	toolbar2Height - (number)
	toolbar2URL - (url) Defaults to 'pages/lipsum.html'.
	toolbar2Content - (string)
	toolbar2Onload - (function)	
	container - (element ID) Element the window is injected in. The container defaults to 'desktop'. If no desktop then to document.body. Use 'pageWrapper' if you don't want the windows to overlap the toolbars.
	restrict - (boolean) Restrict window to container when dragging.
	shape - ('box' or 'gauge') Shape of window. Defaults to 'box'.
	collapsible - (boolean) Defaults to true.
	minimizable - (boolean) Requires MochaUI.Desktop and MochaUI.Dock. Defaults to true if dependenices are met. 
	maximizable - (boolean) Requires MochaUI.Desktop. Defaults to true if dependenices are met.
	closable - (boolean) Defaults to true.
	modalOverlayClose - (boolean) Whether or not you can close a modal by clicking on the modal overlay. Defaults to true.
	draggable - (boolean) Defaults to false for modals; otherwise true.
	draggableGrid - (false or number) Distance in pixels for snap-to-grid dragging. Defaults to false. 
	draggableLimit - (false or number) An object with x and y properties used to limit the movement of the Window. Defaults to false.
	draggableSnap - (boolean) The distance to drag before the Window starts to respond to the drag. Defaults to false.
	resizable - (boolean) Defaults to false for modals, notifications and gauges; otherwise true.
	resizeLimit - (object) Minimum and maximum width and height of window when resized.
	addClass - (string) Add a class to the window for more control over styling.	
	width - (number) Width of content area.	
	height - (number) Height of content area.
	headerHeight - (number) Height of window titlebar.
	footerHeight - (number) Height of window footer.
	cornerRadius - (number)	
	x - (number) If x and y are left undefined the window is centered on the page.
	y - (number)
	scrollbars - (boolean)
	padding - (object)
	shadowBlur - (number) Width of shadows.
	shadowOffset - Should be positive and not be greater than the ShadowBlur.
	controlsOffset - Change this if you want to reposition the window controls.
	useCanvas - (boolean) Set this to false if you don't want a canvas body.
	useCanvasControls - (boolean) Set this to false if you wish to use images for the buttons.
	useSpinner - (boolean) Toggles whether or not the ajax spinners are displayed in window footers. Defaults to true.
	headerStartColor - ([r,g,b,]) Titlebar gradient's top color
	headerStopColor - ([r,g,b,]) Titlebar gradient's bottom color
	bodyBgColor - ([r,g,b,]) Background color of the main canvas shape
	minimizeBgColor - ([r,g,b,]) Minimize button background color
	minimizeColor - ([r,g,b,]) Minimize button color
	maximizeBgColor - ([r,g,b,]) Maximize button background color
	maximizeColor - ([r,g,b,]) Maximize button color
	closeBgColor - ([r,g,b,]) Close button background color
	closeColor - ([r,g,b,]) Close button color
	resizableColor - ([r,g,b,]) Resizable icon color
	onBeforeBuild - (function) Fired just before the window is built.
	onContentLoaded - (function) Fired when content is successfully loaded via XHR or Iframe.
	onFocus - (function)  Fired when the window is focused.
	onBlur - (function) Fired when window loses focus.
	onResize - (function) Fired when the window is resized.
	onMinimize - (function) Fired when the window is minimized.
	onMaximize - (function) Fired when the window is maximized.
	onRestore - (function) Fired when a window is restored from minimized or maximized.
	onClose - (function) Fired just before the window is closed.
	onCloseComplete - (function) Fired after the window is closed.

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

	If you wish to add links in windows that open other windows remember to add events to those links when the windows are created.

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


	Loading Content with an XMLHttpRequest(xhr):
		For content to load via xhr all the files must be online and in the same domain. If you need to load content from another domain or wish to have it work offline, load the content in an iframe instead of using the xhr option.
	
	Iframes:
		If you use the iframe loadMethod your iframe will automatically be resized when the window it is in is resized. If you want this same functionality when using one of the other load options simply add class="mochaIframe" to those iframes and they will be resized for you as well.

*/

// Having these options outside of the Class allows us to add, change, and remove
// individual options without rewriting all of them.

MochaUI.extend({
	Windows: {	  
		instances:      new Hash(),
		indexLevel:     100,          // Used for window z-Index
		windowIDCount:  0,            // Used for windows without an ID defined by the user
		windowsVisible: true,         // Ctrl-Alt-Q to toggle window visibility
		focusingWindow: false		
	}	
});	

MochaUI.Windows.windowOptions = {
	id:                null,
	title:             'New Window',
	icon:              false,
	type:              'window',

	loadMethod:        'html',
	method:	           'get',
	contentURL:        'pages/lipsum.html',
	data:              null,

	closeAfter:        false,

	// xhr options
	evalScripts:       true,
	evalResponse:      false,

	// html options
	content:           'Window content',

	// Toolbar
	toolbar:           false,
	toolbarPosition:   'top',
	toolbarHeight:     29,
	toolbarURL:        'pages/lipsum.html',
	toolbarData:	   null,
	toolbarContent:    '',
	toolbarOnload:     $empty,

	// Toolbar
	toolbar2:           false,
	toolbar2Position:   'bottom',
	toolbar2Height:     29,
	toolbar2URL:        'pages/lipsum.html',
	toolbar2Data:	    null,
	toolbar2Content:    '',
	toolbar2Onload:     $empty,	

	// Container options
	container:         null,
	restrict:          true,
	shape:             'box',

	// Window Controls
	collapsible:       true,
	minimizable:       true,
	maximizable:       true,
	closable:          true,

	// Modal Options	
	modalOverlayClose: true,

	// Draggable
	draggable:         null,
	draggableGrid:     false,
	draggableLimit:    false,
	draggableSnap:     false,

	// Resizable
	resizable:         null,
	resizeLimit:       {'x': [250, 2500], 'y': [125, 2000]},
	
	// Style options:
	addClass:          '',
	width:             300,
	height:            125,
	headerHeight:      25,
	footerHeight:      25,
	cornerRadius:      8,	
	x:                 null,
	y:                 null,
	scrollbars:        true,
	padding:   		   { top: 10, right: 12, bottom: 10, left: 12 },
	shadowBlur:        5,
	shadowOffset:      {'x': 0, 'y': 1},
	controlsOffset:    {'right': 6, 'top': 6},
	useCanvas:         true,
	useCanvasControls: true,
	useSpinner:        true,

	// Color options:
	headerStartColor:  [250, 250, 250],
	headerStopColor:   [229, 229, 229],
	bodyBgColor:       [229, 229, 229],
	minimizeBgColor:   [255, 255, 255],
	minimizeColor:     [0, 0, 0],
	maximizeBgColor:   [255, 255, 255],
	maximizeColor:     [0, 0, 0],
	closeBgColor:      [255, 255, 255],
	closeColor:        [0, 0, 0],
	resizableColor:    [254, 254, 254],

	// Events
	onBeforeBuild:     $empty,
	onContentLoaded:   $empty,
	onFocus:           $empty,
	onBlur:            $empty,
	onResize:          $empty,
	onMinimize:        $empty,
	onMaximize:        $empty,
	onRestore:         $empty,
	onClose:           $empty,
	onCloseComplete:   $empty
};

MochaUI.Windows.windowOptionsOriginal = $merge(MochaUI.Windows.windowOptions);

MochaUI.Window = new Class({
	options: MochaUI.Windows.windowOptions,
	initialize: function(options){
		this.setOptions(options);

		// Shorten object chain
		var options = this.options;

		$extend(this, {
			mochaControlsWidth: 0,
			minimizebuttonX:  0,  // Minimize button horizontal position
			maximizebuttonX: 0,  // Maximize button horizontal position
			closebuttonX: 0,  // Close button horizontal position
			headerFooterShadow: options.headerHeight + options.footerHeight + (options.shadowBlur * 2),
			oldTop: 0,
			oldLeft: 0,
			isMaximized: false,
			isMinimized: false,
			isCollapsed: false,
			timestamp: $time()
		});
		
		// May be better to use if type != window
		if (options.type != 'window'){
			options.container = document.body;
			options.minimizable = false;
		}
		if (!options.container){
			options.container = MochaUI.Desktop && MochaUI.Desktop.desktop ? MochaUI.Desktop.desktop : document.body;
		}

		// Set this.options.resizable to default if it was not defined
		if (options.resizable == null){
			if (options.type != 'window' || options.shape == 'gauge'){
				options.resizable = false;
			}
			else {
				options.resizable = true;	
			}
		}

		// Set this.options.draggable if it was not defined
		if (options.draggable == null){
			options.draggable = options.type != 'window' ? false : true;
		}

		// Gauges are not maximizable or resizable
		if (options.shape == 'gauge' || options.type == 'notification'){
			options.collapsible = false;
			options.maximizable = false;
			options.contentBgColor = 'transparent';
			options.scrollbars = false;
			options.footerHeight = 0;
		}
		if (options.type == 'notification'){
			options.closable = false;
			options.headerHeight = 0;
		}
		
		// Minimizable, dock is required and window cannot be modal
		if (MochaUI.Dock && $(MochaUI.options.dock)){
			if (MochaUI.Dock.dock && options.type != 'modal' && options.type != 'modal2'){
				options.minimizable = options.minimizable;
			}
		}
		else {
			options.minimizable = false;
		}

		// Maximizable, desktop is required
		options.maximizable = MochaUI.Desktop && MochaUI.Desktop.desktop && options.maximizable && options.type != 'modal' && options.type != 'modal2';

		if (this.options.type == 'modal2') {
			this.options.shadowBlur = 0;
			this.options.shadowOffset = {'x': 0, 'y': 0};
			this.options.useSpinner = false;
			this.options.useCanvas = false;
			this.options.footerHeight = 0;
			this.options.headerHeight = 0;
		}
		
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
		var instanceID = instances.get(this.options.id);
		var options = this.options;
	
		// Here we check to see if there is already a class instance for this window
		if (instanceID) var currentInstance = instanceID;		

		// Check if window already exists and is not in progress of closing
		if ( this.windowEl && !this.isClosing ){
			 // Restore if minimized
			if (currentInstance.isMinimized){
				MochaUI.Dock.restoreMinimized(this.windowEl);
			}
			// Expand and focus if collapsed
			if (currentInstance.isCollapsed){
				MochaUI.collapseToggle(this.windowEl);
				setTimeout(MochaUI.focusWindow.pass(this.windowEl, this),10);
			}
			// Else focus
			else {
				var coordinates = document.getCoordinates();
				if (this.windowEl.getStyle('left').toInt() > coordinates.width || this.windowEl.getStyle('top').toInt() > coordinates.height){
					MochaUI.centerWindow(this.windowEl);	
				}
				setTimeout(MochaUI.focusWindow.pass(this.windowEl, this),10);
				if (MochaUI.options.standardEffects == true) {
					this.windowEl.shake();
				}	
			}
			return;
		}
		else {
			instances.set(options.id, this);
		}

		this.isClosing = false;
		this.fireEvent('onBeforeBuild');

		// Create window div
		MochaUI.Windows.indexLevel++;
		this.windowEl = new Element('div', {
			'class': 'mocha',
			'id': options.id,
			'styles': {
				'position': 'absolute',
				'width': options.width,
				'height': options.height,
				'display': 'block',
				'opacity': 0,
				'zIndex': MochaUI.Windows.indexLevel += 2
			}
		});

		this.windowEl.addClass(options.addClass);
		
		if (options.type == 'modal2') {
			this.windowEl.addClass('modal2');
		}

		// Fix a mouseover issue with gauges in IE7
		if ( Browser.Engine.trident && options.shape == 'gauge') {
			this.windowEl.setStyle('background', 'url(../images/spacer.gif)');
		}

		if ((this.options.type == 'modal' || options.type == 'modal2' ) && Browser.Platform.mac && Browser.Engine.gecko){
			if (/Firefox[\/\s](\d+\.\d+)/.test(navigator.userAgent)) {
				var ffversion = new Number(RegExp.$1);
				if (ffversion < 3) {
					this.windowEl.setStyle('position', 'fixed');
				}
			}
		}

		if (options.loadMethod == 'iframe') {
			options.padding = { top: 0, right: 0, bottom: 0, left: 0 };
		}

		// Insert sub elements inside windowEl
		this.insertWindowElements();

		// Set title
		this.titleEl.set('html', options.title);

		// Set scrollbars, always use 'hidden' for iframe windows
		this.contentWrapperEl.setStyle('overflow', 'hidden');

		this.contentEl.setStyles({
			'padding-top': options.padding.top,
			'padding-bottom': options.padding.bottom,
			'padding-left': options.padding.left,
			'padding-right': options.padding.right
		});

		if (options.shape == 'gauge'){
			if (options.useCanvasControls){
				this.canvasControlsEl.setStyle('visibility', 'hidden');
			}
			else {
				this.controlsEl.setStyle('visibility', 'hidden');
			}
			this.windowEl.addEvent('mouseover', function(){
				this.mouseover = true;
				var showControls = function(){
					if (this.mouseover != false){
						if (options.useCanvasControls){
							this.canvasControlsEl.setStyle('visibility', 'visible');
						}
						else {
							this.controlsEl.setStyle('visibility', 'visible');
						}
						this.canvasHeaderEl.setStyle('visibility', 'visible');
						this.titleEl.show();
					}
				};
				showControls.delay(0, this);

			}.bind(this));
			this.windowEl.addEvent('mouseleave', function(){
				this.mouseover = false;
				if (this.options.useCanvasControls){
					this.canvasControlsEl.setStyle('visibility', 'hidden');
				}
				else {
					this.controlsEl.setStyle('visibility', 'hidden');
				}
				this.canvasHeaderEl.setStyle('visibility', 'hidden');
				this.titleEl.hide();
			}.bind(this));
		}

		// Inject window into DOM
		this.windowEl.inject(options.container);
		
		// Convert CSS colors to Canvas colors.
		this.setColors();
		
		if (options.type != 'notification'){
			this.setMochaControlsWidth();
		}		

		// Add content to window.
		MochaUI.updateContent({
			'element': this.windowEl,
			'content': options.content,
			'method': options.method,
			'url': options.contentURL,
			'data': options.data,
			'onContentLoaded': null
		});	
		
		// Add content to window toolbar.
		if (this.options.toolbar == true){
			MochaUI.updateContent({
				'element': this.windowEl,
				'childElement': this.toolbarEl,
				'content': options.toolbarContent,
				'loadMethod': 'xhr',
				'method': options.method,
				'url': options.toolbarURL,
				'data':	options.toolbarData,
				'onContentLoaded': options.toolbarOnload
			});
		}

		// Add content to window toolbar.
		if (this.options.toolbar2 == true){
			MochaUI.updateContent({
				'element': this.windowEl,
				'childElement': this.toolbar2El,
				'content': options.toolbar2Content,
				'loadMethod': 'xhr',
				'method': options.method,
				'url': options.toolbar2URL,
				'data':	options.toolbar2Data,
				'onContentLoaded': options.toolbar2Onload
			});
		}
				        
		this.drawWindow();
				
		// Attach events to the window
		this.attachDraggable(); 
		this.attachResizable();
		this.setupEvents();
		
		if (options.resizable){
			this.adjustHandles();
		}
		
		// Position window. If position not specified by user then center the window on the page.
		if (options.container == document.body || options.container == MochaUI.Desktop.desktop){
			var dimensions = window.getSize();
		}
		else {
			var dimensions = $(this.options.container).getSize();
		}

		if (!options.y) {
			if (MochaUI.Desktop && MochaUI.Desktop.desktop) {
				var y = (dimensions.y * .5) - (this.windowEl.offsetHeight * .5);
				if (y < -options.shadowBlur) y = -options.shadowBlur;			
			}
			else {
				var y = window.getScroll().y + (window.getSize().y * .5) - (this.windowEl.offsetHeight * .5);
				if (y < -options.shadowBlur) y = -options.shadowBlur;
			}
		}
		else {
			var y = options.y - options.shadowBlur;
		}

		if (!this.options.x) {
			var x =	(dimensions.x * .5) - (this.windowEl.offsetWidth * .5);
			if (x < -options.shadowBlur) x = -options.shadowBlur;
		}
		else {
			var x = options.x - options.shadowBlur;
		}

		this.windowEl.setStyles({
			'top': y,
			'left': x
		});
		
		// Create opacityMorph
		if (MochaUI.options.advancedEffects == true){
			// IE cannot handle both element opacity and VML alpha at the same time.
			if (Browser.Engine.trident){
				this.drawWindow(false);
			}
			this.opacityMorph = new Fx.Morph(this.windowEl, {
				'duration': 350,
				transition: Fx.Transitions.Sine.easeInOut,
				onComplete: function(){
					if (Browser.Engine.trident){
						this.drawWindow();
					}
				}.bind(this)
			});
		}

		if (options.type == 'modal' || options.type == 'modal2') {
			MochaUI.currentModal = this.windowEl;
			if (Browser.Engine.trident4){				
				$('modalFix').show();
			}
			$('modalOverlay').show();
			if (MochaUI.options.advancedEffects == false){
				$('modalOverlay').setStyle('opacity', .6);
				this.windowEl.setStyles({
					'zIndex': 11000,
					'opacity': 1
				});
			}
			else {
				MochaUI.Modal.modalOverlayCloseMorph.cancel();
				MochaUI.Modal.modalOverlayOpenMorph.start({
					'opacity': .6
				});
				this.windowEl.setStyles({
					'zIndex': 11000
				});
				this.opacityMorph.start({
					'opacity': 1
				});
			}

			$$('.dockTab').removeClass('activeDockTab');
			$$('.mocha').removeClass('isFocused');
			this.windowEl.addClass('isFocused');
			
		}
		else if (MochaUI.options.advancedEffects == false){
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
			}).inject(this.windowEl.id + 'LinkCheck');
		}
		
		if (this.options.closeAfter != false){
			MochaUI.closeWindow.delay(this.options.closeAfter, this, this.windowEl);
		}

		if (MochaUI.Dock && $(MochaUI.options.dock) && this.options.type == 'window' ){
			MochaUI.Dock.createDockTab(this.windowEl);
		}
		
	},
	setupEvents: function() {
		var windowEl = this.windowEl;
		// Set events
		// Note: if a button does not exist, its due to properties passed to newWindow() stating otherwice
		if (this.closeButtonEl){
			this.closeButtonEl.addEvent('click', function(e) {
				new Event(e).stop();
				MochaUI.closeWindow(windowEl);
			}.bind(this));
		}

		if (this.options.type == 'window'){
			windowEl.addEvent('mousedown', function(e) {
				if (Browser.Engine.trident) {
					new Event(e).stop();
				}
				MochaUI.focusWindow(windowEl);
				if (windowEl.getStyle('top').toInt() < -this.options.shadowBlur) {
					windowEl.setStyle('top', -this.options.shadowBlur);
				}	
			}.bind(this));
		}

		if (this.minimizeButtonEl) {
			this.minimizeButtonEl.addEvent('click', function(e) {
				new Event(e).stop();
				MochaUI.Dock.minimizeWindow(windowEl);
		}.bind(this));
		}

		if (this.maximizeButtonEl) {
			this.maximizeButtonEl.addEvent('click', function(e) {
				new Event(e).stop(); 
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
			
			if (Browser.Engine.trident) {
				this.titleBarEl.addEvent('mousedown', function(e) {
					this.titleEl.setCapture();				
				}.bind(this));
				this.titleBarEl.addEvent('mouseup', function(e) {
						this.titleEl.releaseCapture();
				}.bind(this));
			}
	
			this.titleBarEl.addEvent('dblclick', function(e) {
				e = new Event(e).stop();
				MochaUI.collapseToggle(this.windowEl);
			}.bind(this));
		}

	},
	/*

	Internal Function: attachDraggable()
		Make window draggable.
		
	*/
	attachDraggable: function(){
		var windowEl = this.windowEl;
		if (!this.options.draggable) return;
		this.windowDrag = new Drag.Move(windowEl, {
			handle: this.titleBarEl,
			container: this.options.restrict == true ? $(this.options.container) : false,
			grid: this.options.draggableGrid,
			limit: this.options.draggableLimit,
			snap: this.options.draggableSnap,
			onStart: function() {
				if (this.options.type != 'modal' && this.options.type != 'modal2'){ 
					MochaUI.focusWindow(windowEl);
					$('windowUnderlay').show();
				}
				if (this.iframeEl) {
					if (!Browser.Engine.trident) {
						this.iframeEl.setStyle('visibility', 'hidden');
					}
					else {
						this.iframeEl.hide();
					}
				}	
			}.bind(this),
			onComplete: function() {
				if (this.options.type != 'modal' && this.options.type != 'modal2') {
					$('windowUnderlay').hide();
				}
				if ( this.iframeEl ){
					if (!Browser.Engine.trident) {
						this.iframeEl.setStyle('visibility', 'visible');
					}
					else {
						this.iframeEl.show();
					}
				}
				// Store new position in options.
				this.saveValues();
			}.bind(this)
		});
	},
	/*

	Internal Function: attachResizable
		Make window resizable.

	*/
	attachResizable: function(){
		var windowEl = this.windowEl;
		if (!this.options.resizable) return;
		this.resizable1 = this.windowEl.makeResizable({
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
			onStart: function(){
				this.resizeOnStart();
				this.coords = this.contentWrapperEl.getCoordinates();
				this.y2 = this.coords.top.toInt() + this.contentWrapperEl.offsetHeight;
			}.bind(this),
			onDrag: function(){
				this.coords = this.contentWrapperEl.getCoordinates();
				this.contentWrapperEl.setStyle('height', this.y2 - this.coords.top.toInt());
				this.resizeOnDrag();
			}.bind(this),
			onComplete: function(){
				this.resizeOnComplete();
			}.bind(this)
		});

		this.resizable2 = this.contentWrapperEl.makeResizable({
			handle: [this.e, this.ne],
			limit: {
				x: [this.options.resizeLimit.x[0] - (this.options.shadowBlur * 2), this.options.resizeLimit.x[1] - (this.options.shadowBlur * 2) ]
			},	
			modifiers: {x: 'width', y: false},
			onStart: function(){
				this.resizeOnStart();
			}.bind(this),
			onDrag: function(){
				this.resizeOnDrag();
			}.bind(this),
			onComplete: function(){
				this.resizeOnComplete();
			}.bind(this)
		});

		this.resizable3 = this.contentWrapperEl.makeResizable({
			container: this.options.restrict == true ? $(this.options.container) : false,
			handle: this.se,
			limit: {
				x: [this.options.resizeLimit.x[0] - (this.options.shadowBlur * 2), this.options.resizeLimit.x[1] - (this.options.shadowBlur * 2) ],
				y: [this.options.resizeLimit.y[0] - this.headerFooterShadow, this.options.resizeLimit.y[1] - this.headerFooterShadow]
			},
			modifiers: {x: 'width', y: 'height'},
			onStart: function(){
				this.resizeOnStart();
			}.bind(this),
			onDrag: function(){
				this.resizeOnDrag();
			}.bind(this),
			onComplete: function(){
				this.resizeOnComplete();
			}.bind(this)	
		});

		this.resizable4 = this.contentWrapperEl.makeResizable({
			handle: [this.s, this.sw],
			limit: {
				y: [this.options.resizeLimit.y[0] - this.headerFooterShadow, this.options.resizeLimit.y[1] - this.headerFooterShadow]
			},
			modifiers: {x: false, y: 'height'},
			onStart: function(){
				this.resizeOnStart();
			}.bind(this),
			onDrag: function(){
				this.resizeOnDrag();
			}.bind(this),
			onComplete: function(){
				this.resizeOnComplete();
			}.bind(this)
		});

		this.resizable5 = this.windowEl.makeResizable({
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
			onStart: function(){
				this.resizeOnStart();
				this.coords = this.contentWrapperEl.getCoordinates();
				this.x2 = this.coords.left.toInt() + this.contentWrapperEl.offsetWidth;
			}.bind(this),
			onDrag: function(){
				this.coords = this.contentWrapperEl.getCoordinates();
				this.contentWrapperEl.setStyle('width', this.x2 - this.coords.left.toInt());
				this.resizeOnDrag();
			}.bind(this),
			onComplete: function(){
				this.resizeOnComplete();
			}.bind(this)
		});

	},
	resizeOnStart: function(){
		$('windowUnderlay').show();
		if (this.iframeEl){
			if (!Browser.Engine.trident) {
				this.iframeEl.setStyle('visibility', 'hidden');
			}
			else {
				this.iframeEl.hide();
			}
		}	
	},
	resizeOnDrag: function(){
		// Fix for a rendering glitch in FF when resizing a window with panels in it
		if (Browser.Engine.gecko) {
			this.windowEl.getElements('.panel').each(function(panel){
				panel.store('oldOverflow', panel.getStyle('overflow'));
				panel.setStyle('overflow', 'visible');
			});
		}	
		this.drawWindow();
		this.adjustHandles();
		if (Browser.Engine.gecko) {
			this.windowEl.getElements('.panel').each(function(panel){
				panel.setStyle('overflow', panel.retrieve('oldOverflow')); // Fix for a rendering bug in FF
			});
		}			
	},		
	resizeOnComplete: function(){
		$('windowUnderlay').hide();
		if (this.iframeEl){
			if (!Browser.Engine.trident) {
				this.iframeEl.setStyle('visibility', 'visible');
			}
			else {
				this.iframeEl.show();
				// The following hack is to get IE8 RC1 IE8 Standards Mode to properly resize an iframe
				// when only the vertical dimension is changed.
				this.iframeEl.setStyle('width', '99%');
				this.iframeEl.setStyle('height', this.contentWrapperEl.offsetHeight);
				this.iframeEl.setStyle('width', '100%');
				this.iframeEl.setStyle('height', this.contentWrapperEl.offsetHeight);					
			}
		}
		
		// Resize panels if there are any
		if (this.contentWrapperEl.getChildren('.column') != null) {
			MochaUI.rWidth(this.contentWrapperEl);
			this.contentWrapperEl.getChildren('.column').each(function(column){
				MochaUI.panelHeight(column);
			});
		}
				
		this.fireEvent('onResize', this.windowEl);
	},
	adjustHandles: function(){

		var shadowBlur = this.options.shadowBlur;
		var shadowBlur2x = shadowBlur * 2;
		var shadowOffset = this.options.shadowOffset;
		var top = shadowBlur - shadowOffset.y - 1;
		var right = shadowBlur + shadowOffset.x - 1;
		var bottom = shadowBlur + shadowOffset.y - 1;
		var left = shadowBlur - shadowOffset.x - 1;
		
		var coordinates = this.windowEl.getCoordinates();
		var width = coordinates.width - shadowBlur2x + 2;
		var height = coordinates.height - shadowBlur2x + 2;

		this.n.setStyles({
			'top': top,
			'left': left + 10,
			'width': width - 20
		});
		this.e.setStyles({
			'top': top + 10,
			'right': right,
			'height': height - 30
		});
		this.s.setStyles({
			'bottom': bottom,
			'left': left + 10,
			'width': width - 30
		});
		this.w.setStyles({
			'top': top + 10,
			'left': left,
			'height': height - 20
		});
		this.ne.setStyles({
			'top': top,
			'right': right	
		});
		this.se.setStyles({
			'bottom': bottom,
			'right': right
		});
		this.sw.setStyles({
			'bottom': bottom,
			'left': left
		});
		this.nw.setStyles({
			'top': top,
			'left': left
		});
	},
	detachResizable: function(){
			this.resizable1.detach();
			this.resizable2.detach();
			this.resizable3.detach();
			this.resizable4.detach();
			this.resizable5.detach();
			this.windowEl.getElements('.handle').hide();
	},
	reattachResizable: function(){
			this.resizable1.attach();
			this.resizable2.attach();
			this.resizable3.attach();
			this.resizable4.attach();
			this.resizable5.attach();
			this.windowEl.getElements('.handle').show();
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
				'id': id + '_zIndexFix',
				'class': 'zIndexFix',
				'scrolling': 'no',
				'marginWidth': 0,
				'marginHeight': 0,
				'src': '',
				'styles': {
					'position': 'absolute' // This is set here to make theme transitions smoother
				}
			}).inject(this.windowEl);
		}

		cache.overlayEl = new Element('div', {
			'id': id + '_overlay',
			'class': 'mochaOverlay',
			'styles': {
				'position': 'absolute', // This is set here to make theme transitions smoother
				'top': 0,
				'left': 0
			}
		}).inject(this.windowEl);

		cache.titleBarEl = new Element('div', {
			'id': id + '_titleBar',
			'class': 'mochaTitlebar',
			'styles': {
				'cursor': options.draggable ? 'move' : 'default'
			}
		}).inject(cache.overlayEl, 'top');

		cache.titleEl = new Element('h3', {
			'id': id + '_title',
			'class': 'mochaTitle'
		}).inject(cache.titleBarEl);

		if (options.icon != false){
			cache.titleEl.setStyles({
				'padding-left': 25,
				'background': 'url(' + options.icon + ') no-repeat'
			});
		}
		
		cache.contentBorderEl = new Element('div', {
			'id': id + '_contentBorder',
			'class': 'mochaContentBorder'
		}).inject(cache.overlayEl);

		if (options.toolbar){
			cache.toolbarWrapperEl = new Element('div', {
				'id': id + '_toolbarWrapper',
				'class': 'mochaToolbarWrapper',
				'styles': { 'height': options.toolbarHeight }
			}).inject(cache.contentBorderEl, options.toolbarPosition == 'bottom' ? 'after' : 'before');

			if (options.toolbarPosition == 'bottom') {
				cache.toolbarWrapperEl.addClass('bottom');
			}
			cache.toolbarEl = new Element('div', {
				'id': id + '_toolbar',
				'class': 'mochaToolbar',
				'styles': { 'height': options.toolbarHeight }
			}).inject(cache.toolbarWrapperEl);
		}

		if (options.toolbar2){
			cache.toolbar2WrapperEl = new Element('div', {
				'id': id + '_toolbar2Wrapper',
				'class': 'mochaToolbarWrapper',
				'styles': { 'height': options.toolbar2Height }
			}).inject(cache.contentBorderEl, options.toolbar2Position == 'bottom' ? 'after' : 'before');

			if (options.toolbar2Position == 'bottom') {
				cache.toolbar2WrapperEl.addClass('bottom');
			}
			cache.toolbar2El = new Element('div', {
				'id': id + '_toolbar2',
				'class': 'mochaToolbar',
				'styles': { 'height': options.toolbar2Height }
			}).inject(cache.toolbar2WrapperEl);
		}

		cache.contentWrapperEl = new Element('div', {
			'id': id + '_contentWrapper',
			'class': 'mochaContentWrapper',
			'styles': {
				'width': width + 'px',
				'height': height + 'px'
			}
		}).inject(cache.contentBorderEl);
		
		if (this.options.shape == 'gauge'){
			cache.contentBorderEl.setStyle('borderWidth', 0);
		}

		cache.contentEl = new Element('div', {
			'id': id + '_content',
			'class': 'mochaContent'
		}).inject(cache.contentWrapperEl);

		if (this.options.useCanvas == true && Browser.Engine.trident != true) {
			cache.canvasEl = new Element('canvas', {
				'id': id + '_canvas',
				'class': 'mochaCanvas',
				'width': 10,
				'height': 10
			}).inject(this.windowEl);
		}
		
		if (this.options.useCanvas == true && Browser.Engine.trident) {
			cache.canvasEl = new Element('canvas', {
				'id': id + '_canvas',
				'class': 'mochaCanvas',
				'width': 50000, // IE8 excanvas requires these large numbers
				'height': 20000,
				'styles': {
					'position': 'absolute',
					'top': 0,
					'left': 0
				}
			}).inject(this.windowEl);

			if (MochaUI.ieSupport == 'excanvas'){
				G_vmlCanvasManager.initElement(cache.canvasEl);
				cache.canvasEl = this.windowEl.getElement('.mochaCanvas');
			}
		}		

		cache.controlsEl = new Element('div', {
			'id': id + '_controls',
			'class': 'mochaControls'
		}).inject(cache.overlayEl, 'after');

		if (options.useCanvasControls == true){
			cache.canvasControlsEl = new Element('canvas', {
				'id': id + '_canvasControls',
				'class': 'mochaCanvasControls',
				'width': 14,
				'height': 14
			}).inject(this.windowEl);

			if (Browser.Engine.trident && MochaUI.ieSupport == 'excanvas'){
				G_vmlCanvasManager.initElement(cache.canvasControlsEl);
				cache.canvasControlsEl = this.windowEl.getElement('.mochaCanvasControls');
			}
		}

		if (options.closable){
			cache.closeButtonEl = new Element('div', {
				'id': id + '_closeButton',
				'class': 'mochaCloseButton mochaWindowButton',
				'title': 'Close'
			}).inject(cache.controlsEl);
		}

		if (options.maximizable){
			cache.maximizeButtonEl = new Element('div', {
				'id': id + '_maximizeButton',
				'class': 'mochaMaximizeButton mochaWindowButton',
				'title': 'Maximize'
			}).inject(cache.controlsEl);
		}

		if (options.minimizable){
			cache.minimizeButtonEl = new Element('div', {
				'id': id + '_minimizeButton',
				'class': 'mochaMinimizeButton mochaWindowButton',
				'title': 'Minimize'
			}).inject(cache.controlsEl);
		}

		if (options.useSpinner == true && options.shape != 'gauge' && options.type != 'notification'){
			cache.spinnerEl = new Element('div', {
				'id': id + '_spinner',
				'class': 'mochaSpinner',
				'width': 16,
				'height': 16
			}).inject(this.windowEl, 'bottom');
		}

		if (this.options.shape == 'gauge'){
			cache.canvasHeaderEl = new Element('canvas', {
				'id': id + '_canvasHeader',
				'class': 'mochaCanvasHeader',
				'width': this.options.width,
				'height': 26
			}).inject(this.windowEl, 'bottom');
		
			if (Browser.Engine.trident && MochaUI.ieSupport == 'excanvas'){
				G_vmlCanvasManager.initElement(cache.canvasHeaderEl);
				cache.canvasHeaderEl = this.windowEl.getElement('.mochaCanvasHeader');
			}
		}

		if ( Browser.Engine.trident ){
			cache.overlayEl.setStyle('zIndex', 2);
		}

		// For Mac Firefox 2 to help reduce scrollbar bugs in that browser
		if (Browser.Platform.mac && Browser.Engine.gecko){
			if (/Firefox[\/\s](\d+\.\d+)/.test(navigator.userAgent)){
				var ffversion = new Number(RegExp.$1);
				if (ffversion < 3){
					cache.overlayEl.setStyle('overflow', 'auto');
				}
			}
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
		
	},
	/*
	
	Convert CSS colors to Canvas colors. 
	  
	*/	
	setColors: function(){
		
		if (this.options.useCanvas == true) {

			// Set TitlebarColor
			var pattern = /\?(.*?)\)/;
			if (this.titleBarEl.getStyle('backgroundImage') != 'none'){
				var gradient = this.titleBarEl.getStyle('backgroundImage');								
				gradient = gradient.match(pattern)[1];
				gradient = gradient.parseQueryString();
				var gradientFrom = gradient.from; 
				var gradientTo = gradient.to.replace(/\"/, ''); // IE7 was adding a quotation mark in. No idea why.						
				
				this.options.headerStartColor = new Color(gradientFrom);
				this.options.headerStopColor = new Color(gradientTo);
				this.titleBarEl.addClass('replaced');
			}			
			else if (this.titleBarEl.getStyle('background-color') !== '' && this.titleBarEl.getStyle('background-color') !== 'transparent') {			
				this.options.headerStartColor = new Color(this.titleBarEl.getStyle('background-color')).mix('#fff', 20);			
				this.options.headerStopColor = new Color(this.titleBarEl.getStyle('background-color')).mix('#000', 20);
				this.titleBarEl.addClass('replaced');
			}
			
			// Set BodyBGColor
			if (this.windowEl.getStyle('background-color') !== '' && this.windowEl.getStyle('background-color') !== 'transparent') {			
				this.options.bodyBgColor = new Color(this.windowEl.getStyle('background-color'));
				this.windowEl.addClass('replaced');		
			}
			
			// Set resizableColor, the color of the SE corner resize handle			
			if (this.options.resizable && this.se.getStyle('background-color') !== '' && this.se.getStyle('background-color') !== 'transparent') {			
				this.options.resizableColor = new Color(this.se.getStyle('background-color'));
				this.se.addClass('replaced');		
			}									

		}
		
		if (this.options.useCanvasControls == true){

			if (this.minimizeButtonEl){

				// Set Minimize Button Foreground Color
				if (this.minimizeButtonEl.getStyle('color') !== '' && this.minimizeButtonEl.getStyle('color') !== 'transparent') {			
					this.options.minimizeColor = new Color(this.minimizeButtonEl.getStyle('color'));					
				}

				// Set Minimize Button Background Color
				if (this.minimizeButtonEl.getStyle('background-color') !== '' && this.minimizeButtonEl.getStyle('background-color') !== 'transparent') {			
					this.options.minimizeBgColor = new Color(this.minimizeButtonEl.getStyle('background-color'));
					this.minimizeButtonEl.addClass('replaced');
				}				
				
			}
						
			if (this.maximizeButtonEl){

				// Set Maximize Button Foreground Color
				if (this.maximizeButtonEl.getStyle('color') !== '' && this.maximizeButtonEl.getStyle('color') !== 'transparent') {			
					this.options.maximizeColor = new Color(this.maximizeButtonEl.getStyle('color'));					
				}
			
				// Set Maximize Button Background Color
				if (this.maximizeButtonEl.getStyle('background-color') !== '' && this.maximizeButtonEl.getStyle('background-color') !== 'transparent') {			
					this.options.maximizeBgColor = new Color(this.maximizeButtonEl.getStyle('background-color'));
					this.maximizeButtonEl.addClass('replaced');
				}
			
			}
			
			if (this.closeButtonEl){

				// Set Close Button Foreground Color
				if (this.closeButtonEl.getStyle('color') !== '' && this.closeButtonEl.getStyle('color') !== 'transparent') {			
					this.options.closeColor = new Color(this.closeButtonEl.getStyle('color'));					
				}
			
				// Set Close Button Background Color
				if (this.closeButtonEl.getStyle('background-color') !== '' && this.closeButtonEl.getStyle('background-color') !== 'transparent') {			
					this.options.closeBgColor = new Color(this.closeButtonEl.getStyle('background-color'));
					this.closeButtonEl.addClass('replaced');
				}
									
			}
		}
	},
	/*

	Internal function: drawWindow
		This is where we create the canvas GUI	

	Arguments: 
		windowEl: the $(window)
		shadows: (boolean) false will draw a window without shadows

	*/	
	drawWindow: function(shadows) {		
		
		if (this.drawingWindow == true) return;
		this.drawingWindow = true;
				
		if (this.isCollapsed){
			this.drawWindowCollapsed(shadows);
			return;
		}
		
		var windowEl = this.windowEl;

		var options = this.options;
		var shadowBlur = options.shadowBlur;
		var shadowBlur2x = shadowBlur * 2;
		var shadowOffset = this.options.shadowOffset;

		this.overlayEl.setStyles({
			'width': this.contentWrapperEl.offsetWidth
		});

		// Resize iframe when window is resized
		if (this.iframeEl) {
			this.iframeEl.setStyle('height', this.contentWrapperEl.offsetHeight);
		}

		var borderHeight = this.contentBorderEl.getStyle('border-top').toInt() + this.contentBorderEl.getStyle('border-bottom').toInt();
		var toolbarHeight = this.toolbarWrapperEl ? this.toolbarWrapperEl.getStyle('height').toInt() + this.toolbarWrapperEl.getStyle('border-top').toInt() : 0;
		var toolbar2Height = this.toolbar2WrapperEl ? this.toolbar2WrapperEl.getStyle('height').toInt() + this.toolbar2WrapperEl.getStyle('border-top').toInt() : 0;

		this.headerFooterShadow = options.headerHeight + options.footerHeight + shadowBlur2x;
		var height = this.contentWrapperEl.getStyle('height').toInt() + this.headerFooterShadow + toolbarHeight + toolbar2Height + borderHeight;
		var width = this.contentWrapperEl.getStyle('width').toInt() + shadowBlur2x;
		this.windowEl.setStyles({
			'height': height,
			'width': width
		});

		this.overlayEl.setStyles({
			'height': height,
			'top': shadowBlur - shadowOffset.y,
			'left': shadowBlur - shadowOffset.x
		});		

		if (this.options.useCanvas == true) {
			if (Browser.Engine.trident) {
				this.canvasEl.height = 20000;
				this.canvasEl.width = 50000;
			}
			this.canvasEl.height = height;
			this.canvasEl.width = width;
		}

		// Part of the fix for IE6 select z-index bug
		if (Browser.Engine.trident4){
			this.zIndexFixEl.setStyles({
				'width': width,
				'height': height
			})
		}

		this.titleBarEl.setStyles({
			'width': width - shadowBlur2x,
			'height': options.headerHeight
		});

		// Make sure loading icon is placed correctly.
		if (options.useSpinner == true && options.shape != 'gauge' && options.type != 'notification'){
			this.spinnerEl.setStyles({
				'left': shadowBlur - shadowOffset.x + 3,
				'bottom': shadowBlur + shadowOffset.y +  4
			});
		}
		
		if (this.options.useCanvas != false) {
		
			// Draw Window
			var ctx = this.canvasEl.getContext('2d');
			ctx.clearRect(0, 0, width, height);
			
			switch (options.shape) {
				case 'box':
					this.drawBox(ctx, width, height, shadowBlur, shadowOffset, shadows);
					break;
				case 'gauge':
					this.drawGauge(ctx, width, height, shadowBlur, shadowOffset, shadows);
					break;
			}

			if (options.resizable){ 
				MochaUI.triangle(
					ctx,
					width - (shadowBlur + shadowOffset.x + 17),
					height - (shadowBlur + shadowOffset.y + 18),
					11,
					11,
					options.resizableColor,
					1.0
				);
			}

			// Invisible dummy object. The last element drawn is not rendered consistently while resizing in IE6 and IE7
			if (Browser.Engine.trident){
				MochaUI.triangle(ctx, 0, 0, 10, 10, options.resizableColor, 0);
			}
		}
		
		if (options.type != 'notification' && options.useCanvasControls == true){
			this.drawControls(width, height, shadows);
		}
		
		// Resize panels if there are any
		if (MochaUI.Desktop && this.contentWrapperEl.getChildren('.column').length != 0) {
			MochaUI.rWidth(this.contentWrapperEl);
			this.contentWrapperEl.getChildren('.column').each(function(column){
				MochaUI.panelHeight(column);
			});
		}
		
		this.drawingWindow = false;
		return this;		

	},
	drawWindowCollapsed: function(shadows) {

		var windowEl = this.windowEl;
		
		var options = this.options;
		var shadowBlur = options.shadowBlur;
		var shadowBlur2x = shadowBlur * 2;
		var shadowOffset = options.shadowOffset;
		
		var headerShadow = options.headerHeight + shadowBlur2x + 2;
		var height = headerShadow;
		var width = this.contentWrapperEl.getStyle('width').toInt() + shadowBlur2x;
		this.windowEl.setStyle('height', height);
		
		this.overlayEl.setStyles({
			'height': height,
			'top': shadowBlur - shadowOffset.y,
			'left': shadowBlur - shadowOffset.x
		});		

		// Part of the fix for IE6 select z-index bug
		if (Browser.Engine.trident4){
			this.zIndexFixEl.setStyles({
				'width': width,
				'height': height
			});
		}

		// Set width
		this.windowEl.setStyle('width', width);
		this.overlayEl.setStyle('width', width);
		this.titleBarEl.setStyles({
			'width': width - shadowBlur2x,
			'height': options.headerHeight
		});
	
		// Draw Window
		if (this.options.useCanvas != false) {
			this.canvasEl.height = height;
			this.canvasEl.width = width;

			var ctx = this.canvasEl.getContext('2d');
			ctx.clearRect(0, 0, width, height);
			
			this.drawBoxCollapsed(ctx, width, height, shadowBlur, shadowOffset, shadows);
			if (options.useCanvasControls == true) {
				this.drawControls(width, height, shadows);
			}
			
			// Invisible dummy object. The last element drawn is not rendered consistently while resizing in IE6 and IE7
			if (Browser.Engine.trident){
				MochaUI.triangle(ctx, 0, 0, 10, 10, options.resizableColor, 0);
			}
		}
		
		this.drawingWindow = false;
		return this;

	},	
	drawControls : function(width, height, shadows){
		var options = this.options;
		var shadowBlur = options.shadowBlur;
		var shadowOffset = options.shadowOffset;
		var controlsOffset = options.controlsOffset;
		
		// Make sure controls are placed correctly.
		this.controlsEl.setStyles({
			'right': shadowBlur + shadowOffset.x + controlsOffset.right,
			'top': shadowBlur - shadowOffset.y + controlsOffset.top
		});

		this.canvasControlsEl.setStyles({
			'right': shadowBlur + shadowOffset.x + controlsOffset.right,
			'top': shadowBlur - shadowOffset.y + controlsOffset.top
		});

		// Calculate X position for controlbuttons
		//var mochaControlsWidth = 52;
		this.closebuttonX = options.closable ? this.mochaControlsWidth - 7 : this.mochaControlsWidth + 12;
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
					// Invisible dummy object. The last element drawn is not rendered consistently while resizing in IE6 and IE7
			if (Browser.Engine.trident){
				MochaUI.circle(ctx2, 0, 0, 3, this.options.resizableColor, 0);
			}
		
	},
	drawBox: function(ctx, width, height, shadowBlur, shadowOffset, shadows){

		var options = this.options;
		var shadowBlur2x = shadowBlur * 2;
		var cornerRadius = this.options.cornerRadius;

		// This is the drop shadow. It is created onion style.
		if ( shadows != false ) {	
			for (var x = 0; x <= shadowBlur; x++){
				MochaUI.roundedRect(
					ctx,
					shadowOffset.x + x,
					shadowOffset.y + x,
					width - (x * 2) - shadowOffset.x,
					height - (x * 2) - shadowOffset.y,
					cornerRadius + (shadowBlur - x),
					[0, 0, 0],
					x == shadowBlur ? .29 : .065 + (x * .01)
				);
			}
		}
		// Window body.
		this.bodyRoundedRect(
			ctx,                          // context
			shadowBlur - shadowOffset.x,  // x
			shadowBlur - shadowOffset.y,  // y
			width - shadowBlur2x,         // width
			height - shadowBlur2x,        // height
			cornerRadius,                 // corner radius
			options.bodyBgColor      // Footer color
		);

		if (this.options.type != 'notification'){
		// Window header.
			this.topRoundedRect(
				ctx,                          // context
				shadowBlur - shadowOffset.x,  // x
				shadowBlur - shadowOffset.y,  // y
				width - shadowBlur2x,         // width
				options.headerHeight,         // height
				cornerRadius,                 // corner radius
				options.headerStartColor,     // Header gradient's top color
				options.headerStopColor       // Header gradient's bottom color
			);
		}	
	},
	drawBoxCollapsed: function(ctx, width, height, shadowBlur, shadowOffset, shadows){

		var options = this.options;
		var shadowBlur2x = shadowBlur * 2;
		var cornerRadius = options.cornerRadius;
	
		// This is the drop shadow. It is created onion style.
		if ( shadows != false ){
			for (var x = 0; x <= shadowBlur; x++){
				MochaUI.roundedRect(
					ctx,
					shadowOffset.x + x,
					shadowOffset.y + x,
					width - (x * 2) - shadowOffset.x,
					height - (x * 2) - shadowOffset.y,
					cornerRadius + (shadowBlur - x),
					[0, 0, 0],
					x == shadowBlur ? .3 : .06 + (x * .01)
				);
			}
		}

		// Window header
		this.topRoundedRect2(
			ctx,                          // context
			shadowBlur - shadowOffset.x,  // x
			shadowBlur - shadowOffset.y,  // y
			width - shadowBlur2x,         // width
			options.headerHeight + 2,     // height
			cornerRadius,                 // corner radius
			options.headerStartColor,     // Header gradient's top color
			options.headerStopColor       // Header gradient's bottom color
		);

	},	
	drawGauge: function(ctx, width, height, shadowBlur, shadowOffset, shadows){
		var options = this.options;
		var radius = (width * .5) - (shadowBlur) + 16;
		if (shadows != false) {	
			for (var x = 0; x <= shadowBlur; x++){
				MochaUI.circle(
					ctx,
					width * .5 + shadowOffset.x,
					(height  + options.headerHeight) * .5 + shadowOffset.x,
					(width *.5) - (x * 2) - shadowOffset.x,
					[0, 0, 0],
					x == shadowBlur ? .75 : .075 + (x * .04)
				);
			}
		}
		MochaUI.circle(
			ctx,
			width * .5  - shadowOffset.x,
			(height + options.headerHeight) * .5  - shadowOffset.y,
			(width *.5) - shadowBlur,
			options.bodyBgColor,
			1
		);

		// Draw gauge header
		this.canvasHeaderEl.setStyles({
			'top': shadowBlur - shadowOffset.y,
			'left': shadowBlur - shadowOffset.x
		});		
		var ctx = this.canvasHeaderEl.getContext('2d');
		ctx.clearRect(0, 0, width, 100);
		ctx.beginPath();
		ctx.lineWidth = 24;
		ctx.lineCap = 'round';
		ctx.moveTo(13, 13);
		ctx.lineTo(width - (shadowBlur*2) - 13, 13);
		ctx.strokeStyle = 'rgba(0, 0, 0, .65)';
		ctx.stroke();
	},
	bodyRoundedRect: function(ctx, x, y, width, height, radius, rgb){
		ctx.fillStyle = 'rgba(' + rgb.join(',') + ', 1)';
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
	topRoundedRect: function(ctx, x, y, width, height, radius, headerStartColor, headerStopColor){
		var lingrad = ctx.createLinearGradient(0, 0, 0, height);
		lingrad.addColorStop(0, 'rgb(' + headerStartColor.join(',') + ')');
		lingrad.addColorStop(1, 'rgb(' + headerStopColor.join(',') + ')');		
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
		// Chrome is having trouble rendering the LinearGradient in this particular case
		if (navigator.userAgent.toLowerCase().indexOf('chrome') > -1) {
			ctx.fillStyle = 'rgba(' + headerStopColor.join(',') + ', 1)';
		}
		else {
			var lingrad = ctx.createLinearGradient(0, this.options.shadowBlur - 1, 0, height + this.options.shadowBlur + 3);
			lingrad.addColorStop(0, 'rgb(' + headerStartColor.join(',') + ')');
			lingrad.addColorStop(1, 'rgb(' + headerStopColor.join(',') + ')');
			ctx.fillStyle = lingrad;
		}
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
		ctx.arc(x, y, 7, 0, Math.PI*2, true);
		ctx.fillStyle = 'rgba(' + rgbBg.join(',') + ',' + aBg + ')';
		ctx.fill();
		// X sign
		ctx.strokeStyle = 'rgba(' + rgb.join(',') + ',' + a + ')';
		ctx.lineWidth = 2;	
		ctx.beginPath();
		ctx.moveTo(x, y - 3.25);
		ctx.lineTo(x, y + 3.25);
		ctx.moveTo(x - 3.25, y);
		ctx.lineTo(x + 3.25, y);
		ctx.stroke();
	},
	closebutton: function(ctx, x, y, rgbBg, aBg, rgb, a){
		// Circle
		ctx.beginPath();
		ctx.arc(x, y, 7, 0, Math.PI*2, true);
		ctx.fillStyle = 'rgba(' + rgbBg.join(',') + ',' + aBg + ')';
		ctx.fill();
		// Plus sign
		ctx.strokeStyle = 'rgba(' + rgb.join(',') + ',' + a + ')';
		ctx.lineWidth = 2;		
		ctx.beginPath();
		ctx.moveTo(x - 2.75, y - 2.75);
		ctx.lineTo(x + 2.75, y + 2.75);
		ctx.moveTo(x + 2.75, y - 2.75);
		ctx.lineTo(x - 2.75, y + 2.75);
		ctx.stroke();
	},
	minimizebutton: function(ctx, x, y, rgbBg, aBg, rgb, a){
		// Circle
		ctx.beginPath();
		ctx.arc(x,y,7,0,Math.PI*2,true);
		ctx.fillStyle = 'rgba(' + rgbBg.join(',') + ',' + aBg + ')';
		ctx.fill();
		// Minus sign
		ctx.strokeStyle = 'rgba(' + rgb.join(',') + ',' + a + ')';
		ctx.lineWidth = 2;		
		ctx.beginPath();
		ctx.moveTo(x - 3.25, y);
		ctx.lineTo(x + 3.25, y);
		ctx.stroke();
	},
	/*

	Function: hideSpinner
		Hides the spinner.
		
	*/	
	hideSpinner: function(spinner) {
		if (!this.options.useSpinner || this.options.shape == 'gauge' || this.options.type == 'notification') return;
		if ($(spinner))	$(spinner).hide();
	},
	/*

	Function: showSpinner
		Shows the spinner.
	
	*/	
	showSpinner: function(spinner){
		if (!this.options.useSpinner || this.options.shape == 'gauge' || this.options.type == 'notification') return;
		$(spinner).show();
	},
	/* 

	Function: close
		Closes the window. This is an alternative to using MochaUI.Core.closeWindow().
		
	 */
	close: function( ) {
		if ( !this.isClosing )
			MochaUI.closeWindow( $(this.options.id) );
		return this;
	},
	/*

	Function: minimize
		Minimizes the window.

	 */
	minimize: function( ) {
		MochaUI.Dock.minimizeWindow( $(this.options.id) )
		return this;
	},
	/*

	Function: maximize
		Maximizes the window.

	 */
	maximize: function( ) {
		if ( this.isMinimized )
			MochaUI.Dock.restoreMinimized( $(this.options.id) );
		MochaUI.Desktop.maximizeWindow( $(this.options.id) );
		return this;
	},
	/*

	Function: restore
		Restores a minimized/maximized window to its original size.

	 */
	restore: function( ) {
		if ( this.isMinimized )
			MochaUI.Dock.restoreMinimized( $(this.options.id) );
		else if ( this.isMaximized )
			MochaUI.Desktop.restoreWindow( $(this.options.id) );
		return this;
	},
	setMochaControlsWidth: function(){
		this.mochaControlsWidth = 0;
		var options = this.options;
		if (options.minimizable){
			this.mochaControlsWidth += (this.minimizeButtonEl.getStyle('margin-left').toInt() + this.minimizeButtonEl.getStyle('width').toInt());
		}
		if (options.maximizable){
			this.mochaControlsWidth += (this.maximizeButtonEl.getStyle('margin-left').toInt() + this.maximizeButtonEl.getStyle('width').toInt());
		}
		if (options.closable){
			this.mochaControlsWidth += (this.closeButtonEl.getStyle('margin-left').toInt() + this.closeButtonEl.getStyle('width').toInt());
		}
		this.controlsEl.setStyle('width', this.mochaControlsWidth);
		if (options.useCanvasControls == true){
			this.canvasControlsEl.setProperty('width', this.mochaControlsWidth);
		}
	}
});
MochaUI.Window.implement(new Options, new Events);
