/*

Script: Layout.js
	Create web application layouts. Enables window maximize. 
	
Copyright:
	Copyright (c) 2007-2008 Greg Houston, <http://greghoustondesign.com/>.		
	
License:
	MIT-style license.	

Requires:
	Core.js, Window.js
	
*/

MochaUI.Desktop = new Class({
							
	Extends: MochaUI.Window,
	
	Implements: [Events, Options],
	
	options: {         		
		// Naming options:
		// If you change the IDs of the Mocha Desktop containers in your HTML, you need to change them here as well.
		desktop:                'desktop',
		desktopHeader:          'desktopHeader',
		desktopFooter:          'desktopFooter',		
		desktopNavBar:          'desktopNavbar',
		pageWrapper:            'pageWrapper',
		page:                   'page',
		desktopFooter:          'desktopFooterWrapper',
		sidebarWrapper:         'sideColumn1',		
		sidebar:                'sidebar',
		sidebarContentWrapper:  'sidebarContentWrapper',		
		sidebarMinimize:        'sidebarControl',
		sidebarHandle:          'sidebarHandle',
		// Sidebar options:
		sidebarLimitX:          [180, 280]        // Sidebar minimum and maximum widths when resizing.
	},	
	initialize: function(options){
		this.setOptions(options);
		this.desktop                = $(this.options.desktop);
		this.desktopHeader          = $(this.options.desktopHeader);
		this.desktopFooter          = $(this.options.desktopFooter);				
		this.desktopNavBar          = $(this.options.desktopNavBar);
		this.pageWrapper            = $(this.options.pageWrapper);
		this.page                   = $(this.options.page);
		this.desktopFooter          = $(this.options.desktopFooter);		
		this.sidebarWrapper         = $(this.options.sidebarWrapper);		
		this.sidebar                = $(this.options.sidebar);
		this.sidebarContentWrapper  = $(this.options.sidebarContentWrapper);
		this.sidebarMinimize        = $(this.options.sidebarMinimize);
		this.sidebarHandle          = $(this.options.sidebarHandle);		
	
		// This is run on dock initialize so no need to do it twice.
		if (!MochaUI.Dock) {
			this.setDesktopSize();
		}
		this.menuInitialize();		
		
		this.sidebarInitialize();		

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

					var coordinates = document.getCoordinates();
					var borderHeight = instance.contentBorderEl.getStyle('border-top').toInt() + instance.contentBorderEl.getStyle('border-bottom').toInt();
					var toolbarHeight = instance.toolbarWrapperEl ? instance.toolbarWrapperEl.getStyle('height').toInt() + instance.toolbarWrapperEl.getStyle('border-top').toInt() : 0;					
					instance.contentWrapperEl.setStyles({
						'height': coordinates.height - instance.options.headerHeight - instance.options.footerHeight - borderHeight - toolbarHeight,
						'width': coordinates.width
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

		// var dock = $(MochaUI.options.dock);
		var dockWrapper = $(MochaUI.options.dockWrapper);
		
		// Setting the desktop height may only be needed by IE7
		if (this.desktop){
			this.desktop.setStyle('height', windowDimensions.height);
		}

		// Set pageWrapper height so the dock doesn't cover the pageWrapper scrollbars.
		if (this.pageWrapper) {
		
			var dockOffset = MochaUI.dockVisible ? dockWrapper.offsetHeight : 0;
			var pageWrapperHeight = windowDimensions.height;
			pageWrapperHeight -= this.pageWrapper.getStyle('border-top').toInt();
			pageWrapperHeight -= this.pageWrapper.getStyle('border-bottom').toInt();
			if (this.desktopHeader){ pageWrapperHeight -= this.desktopHeader.offsetHeight; }
			if (this.desktopFooter){ pageWrapperHeight -= this.desktopFooter.offsetHeight; }
			pageWrapperHeight -= dockOffset;
									
			if (pageWrapperHeight < 0) {
				pageWrapperHeight = 0;
			}
			this.pageWrapper.setStyle('height', pageWrapperHeight + 'px');
		}

		this.resizePanels();		
	},

	resizePanels: function(){
		if (Browser.Engine.trident4) {
			$$('.pad').setStyle('display', 'none');
			$$('.rHeight').setStyle('height', 1);
		}
		panelHeight();
		rWidth();
		if (Browser.Engine.trident4) $$('.pad').setStyle('display', 'block');		
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
		var options = currentInstance.options;
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
			if (options.resizable) {
				currentInstance.detachResizable();
			}
			currentInstance.titleBarEl.setStyle('cursor', 'default');
		}	
		
		// If the window has a container that is not the desktop
		// temporarily move the window to the desktop while it is minimized.
		if (options.container != this.desktop){
			this.desktop.grab(windowEl);
			if (this.options.restrict){
			windowDrag.container = this.desktop;
			}
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
		var shadowOffset = options.shadowOffset;
		var newHeight = windowDimensions.height - options.headerHeight - options.footerHeight;
		newHeight -= currentInstance.contentBorderEl.getStyle('border-top').toInt();
		newHeight -= currentInstance.contentBorderEl.getStyle('border-bottom').toInt();
		newHeight -= (  currentInstance.toolbarWrapperEl ? currentInstance.toolbarWrapperEl.getStyle('height').toInt() + currentInstance.toolbarWrapperEl.getStyle('border-top').toInt() : 0);

		if (MochaUI.options.useEffects == false){
			windowEl.setStyles({
				'top': shadowOffset.y - shadowBlur,
				'left': shadowOffset.x - shadowBlur
			});
			currentInstance.contentWrapperEl.setStyles({
				'height': newHeight,
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
						
			// Todo: Initialize the variables for these morphs once in an initialize function and reuse them
			
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
				'0': {	'height': newHeight,
						'width':  windowDimensions.width
				},
				'1': {	'top': shadowOffset.y - shadowBlur,
						'left': shadowOffset.x - shadowBlur 
				}
			});		
		}
		currentInstance.maximizeButtonEl.setProperty('title', 'Restore');
		MochaUI.focusWindow(windowEl);

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
		if (windowEl != $(windowEl) || !currentInstance.isMaximized) return;
			
		var options = currentInstance.options;		
		currentInstance.isMaximized = false;
		
		if (options.restrict){
			currentInstance.windowDrag.attach();
			if (options.resizable) {
				currentInstance.reattachResizable();
			}			
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
			if (currentInstance.container != this.desktop){
				$(options.container).grab(windowEl);
				if (options.restrict){
					currentInstance.windowDrag.container = $(options.container);
				}
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
					if (options.container != this.desktop){
						$(options.container).grab(windowEl);
						if (options.restrict){	
							currentInstance.windowDrag.container = $(options.container);
						}
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
		/*

		this.sidebarIsMinimized = false;
		this.sidebarMinimize.addEvent('click', function(event){
			this.sidebarMinimizeToggle();
		}.bind(this));
		
		*/
		
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
		// Hide sidebar.
		if (this.sidebarWrapper.getStyle('display') == 'block'){
			this.sidebarWrapper.setStyle('display', 'none');
			this.sidebarCheck.setStyle('display', 'none');
		}
		// Show sidebar.
		else {
			// If the sidebar is minimized when toggling it's visibility on the sidebar will be restored.
			if (this.sidebarIsMinimized){			
				this.sidebarMinimizeToggle();			
			}			
			this.sidebarWrapper.setStyle('display', 'block');
			this.sidebarCheck.setStyle('display', 'block');			
		}
		this.resizePanels();		
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
		// Expand sidebar.
		var windows = $$('div.mocha');
		if (!this.sidebarIsMinimized){				
			this.sidebarResizable.detach();
			this.sidebarHandle.setStyle('cursor', 'default');						
			this.sidebar.setStyle('display', 'none');
			if (!Browser.Platform.mac && Browser.Engine.gecko){
				windows.setStyle('position', 'absolute');	
			}			
			this.sidebarIsMinimized = true;				
		}
		// Collapse sidebar
		else {
			this.sidebarResizable.attach();	
			this.sidebarHandle.setStyles({
				'cursor': Browser.Engine.presto ? 'e-resize' : 'col-resize'
			});				
			this.sidebar.setStyle('display', 'block');
			if (!Browser.Platform.mac && Browser.Engine.gecko){
				windows.setStyle('position', 'absolute');	
			}			
			this.sidebarIsMinimized = false;
		}				
	},
	panelMinimizeToggle: function(el){
		el.addClass('panel-closed');
	}
});
MochaUI.Desktop.implement(new Options, new Events);

	// Remaining Height
	function rHeight(){	
		$$('.rHeight').each(function(el){
			var currentHeight = el.offsetHeight.toInt();
			currentHeight -= el.getStyle('border-top').toInt();		
			currentHeight -= el.getStyle('border-bottom').toInt();						
		
			var parent = el.getParent();		
			this.height = 0;
		
			// Get the total height of all the parent element's children
			parent.getChildren().each(function(el){
				this.height += el.offsetHeight.toInt();												
			}.bind(this));
		
			// Add the remaining height to the current element
			var remainingHeight = parent.offsetHeight.toInt() - this.height;			
			el.setStyle('height', currentHeight + remainingHeight);

		});
	}
	
	// Panel Height
	
	/*
	For each column, find the column height. Get the available space.
	Add available space to any panel that does not have its height set.
	If there is more than one, divide the available space among them.
	If all panels have their height set, divide the available space among
	the open panels equally.
	
	*/
	
	function panelHeight(){
		$$('.column').each(function(column){
			
			var columnHeight = column.offsetHeight.toInt();			
			var heightNotSet = []; // Panels than do not have their height set
			var heightIsZero = []; // Panels whose height is zero. NOT USED YET
			var panels = []; // All the panels in the column
			var panelsFixed = []; // Panels with the fixed class. NOT USED YET
			this.panelsHeight = 0;			
			this.height = 0;
			
			// Get the total height of all the column's children
			column.getChildren().each(function(el){			

				if (el.hasClass('panel')){

					panels.push(el);
					this.panelsHeight += el.offsetHeight.toInt();
					if (el.style.height) {
						this.height += el.getStyle('height').toInt();
					}
					// Add children without height set to an array
					else {
						heightNotSet.push(el);
					}	
				}
				else {
					this.height += el.offsetHeight.toInt();	
				}											
			}.bind(this));
		
			// Get the remaining height
			var remainingHeight = column.offsetHeight.toInt() - this.height;		
			
			// If any of the panels do not have their height set, i.e., on startup or a panel
			// was dynamically added ...				
			if (heightNotSet.length != 0) {				
				var heightToAdd = remainingHeight / heightNotSet.length;
				heightNotSet.each(function(panel){
					panel.setStyle('height', heightToAdd);
					var instances = MochaUI.Panels.instances;
					var contentEl = instances.get(panel.id).contentEl;
					contentEl.setStyle('height', newPanelHeight - contentEl.getStyle('padding-top').toInt() - contentEl.getStyle('padding-bottom').toInt());	
					contentEl.getChildren('iframe').setStyle('height', newPanelHeight - contentEl.getStyle('padding-top').toInt() - contentEl.getStyle('padding-bottom').toInt());						
				});
			}
			
			// If all the panels have their height set ...
			else {
				this.height = 0;				
				
				column.getChildren().each(function(el){
					this.height += el.offsetHeight.toInt();												
				}.bind(this));
				
				var remainingHeight = column.offsetHeight.toInt() - this.height;				
				
				// Todo: Need to check each panel. If it's height is less than zero we shouldn't
				// try to subtract more height from it. Instead the height should be subtracted
				// from panels with height greater than 0. This gets more complicated if the
				// panel has a height of 5 and we want to subtract 10px from it. We need to
				// subtract the five and split the difference to the other panels.
				//
				// Once a panel reaches 0 or there abouts the ratio is broken for returning to later.
								
				panels.each(function(panel){
					var ratio = this.panelsHeight / panel.offsetHeight.toInt();
					var newPanelHeight = panel.getStyle('height').toInt() + (remainingHeight / ratio);
					if (newPanelHeight < 1) {
						newPanelHeight = 0;
					}
					panel.setStyle('height', newPanelHeight);
					
					resizeChildren(panel, newPanelHeight);

				});	
			}			
		});
	}
	
	function resizeChildren(element, newPanelHeight){
		var instances = MochaUI.Panels.instances;
		var currentInstance = instances.get(element.id);
		var contentEl = currentInstance.contentEl;
		
		// The following line was causing an issue in IE6 and it probably isn't needed.
		// contentEl.setStyle('height', newPanelHeight - contentEl.getStyle('padding-top').toInt() - contentEl.getStyle('padding-bottom').toInt());
		if (currentInstance.iframeEl) {
			currentInstance.iframeEl.setStyle('height', newPanelHeight - contentEl.getStyle('padding-top').toInt() - contentEl.getStyle('padding-bottom').toInt());
		}
	}
	
	
	// Remaining Width
	function rWidth(){	
		$$('.rWidth').each(function(el){
			var currentWidth = el.offsetWidth.toInt();
			currentWidth -= el.getStyle('border-left').toInt();		
			currentWidth -= el.getStyle('border-right').toInt();						
		
			var parent = el.getParent();		
			this.width = 0;
			
			// Get the total width of all the parent element's children
			parent.getChildren().each(function(el){
				this.width += el.offsetWidth.toInt();														
			}.bind(this));
		
			// Add the remaining width to the current element
			var remainingWidth = parent.offsetWidth.toInt() - this.width;		
			el.setStyle('width', currentWidth + remainingWidth);			
		});
	}
	
function addResizeRight(element, min, max){
	if (!$(element)) return;
	element = $(element);	
	var handle = element.getNext('.columnHandle');
	handle.setStyle('cursor', 'e-resize');
	var sibling = element.getNext('.column');	
	if (!min) min = 50;
	if (!max) {
		// var sibling = $(element).getNext('.column');
		// max = $(element).offsetWidth + sibling.offsetWidth;
		max = 250;
	}
	if (Browser.Engine.trident) {	
		handle.addEvent('mousedown', function(e) {
			handle.setCapture();
		}.bind(this));
		handle.addEvent('mouseup', function(e) {
			handle.releaseCapture();
		}.bind(this));								  													   
	}		
	element.makeResizable({
		handle: handle,
		modifiers: {x: 'width', y: false},
		limit: { x: [min, max] },
		onStart: function(){
			element.getElements('iframe').setStyle('visibility','hidden');
			sibling.getElements('iframe').setStyle('visibility','hidden');
		}.bind(this),							
		onDrag: function(){
			rWidth();
			if (Browser.Engine.trident4) {
				element.getChildren().each(function(el){
					var width = $(element).getStyle('width').toInt();
					width -= el.getStyle('border-right').toInt();
					width -= el.getStyle('border-left').toInt();
					width -= el.getStyle('padding-right').toInt();
					width -= el.getStyle('padding-left').toInt();
					el.setStyle('width', width);
				}.bind(this));
			}						
		}.bind(this),
		onComplete: function(){
			rWidth();
			element.getElements('iframe').setStyle('visibility','visible');
			sibling.getElements('iframe').setStyle('visibility','visible');			
		}.bind(this)		
	});	
}

function addResizeLeft(element, min, max){
	if (!$(element)) return;
	element = $(element);	
	var handle = element.getPrevious('.columnHandle');
	handle.setStyle('cursor', 'e-resize');
	var sibling = $(element).getPrevious('.column');	
	if (!min) min = 50;
	if (!max) {
		// var sibling = $(element).getPrevious('.column');
		// max = $(element).offsetWidth + sibling.offsetWidth;
		max = 250;		
	}
	if (Browser.Engine.trident) {	
		handle.addEvent('mousedown', function(e) {
			handle.setCapture();
		}.bind(this));
		handle.addEvent('mouseup', function(e) {
			handle.releaseCapture();
		}.bind(this));								  													   
	}		
	element.makeResizable({
		handle: handle,
		modifiers: {x: 'width' , y: false},
		invert: true,
		limit: { x: [min, max] },
		onStart: function(){
			$(element).getElements('iframe').setStyle('visibility','hidden');
			sibling.getElements('iframe').setStyle('visibility','hidden');
		}.bind(this),									
		onDrag: function(){	
			rWidth();	
		}.bind(this),
		onComplete: function(){
			rWidth();
			$(element).getElements('iframe').setStyle('visibility','visible');
			sibling.getElements('iframe').setStyle('visibility','visible');			
		}.bind(this)		
	});
}
// May remove the ability to set min and max as an option
function addResizeBottom(element, min, max){
	if (!$(element)) return;
	var handle = $(element).getNext('.horizontalHandle');
	handle.setStyle('cursor', 'n-resize');
	if (!min) min = 0;
	if (!max) {
		var sibling = $(element).getNext('.panel');
		max = function(){
			return $(element).getStyle('height').toInt() + sibling.getStyle('height').toInt();
		}.bind(this)
	}
	if (Browser.Engine.trident) {	
		handle.addEvent('mousedown', function(e) {
			handle.setCapture();
		}.bind(this));
		handle.addEvent('mouseup', function(e) {
			handle.releaseCapture();
		}.bind(this));								  													   
	}		
	$(element).makeResizable({
		handle: handle,
		modifiers: {x: false, y: 'height'},
		limit: { y: [min, max] },
		onBeforeStart: function(){
			this.originalHeight = $(element).getStyle('height').toInt();
			this.siblingOriginalHeight = sibling.getStyle('height').toInt();
		}.bind(this),							
		onDrag: function(){
			sibling.setStyle('height', siblingOriginalHeight + (this.originalHeight - $(element).getStyle('height').toInt()));
		}.bind(this),
		onComplete: function(){
			sibling.setStyle('height', siblingOriginalHeight + (this.originalHeight - $(element).getStyle('height').toInt()));
		}.bind(this)		
	});	
}

function addResizeTop(element, min, max){
	if (!$(element)) return;
	var handle = $(element+'_handle');
	handle.setStyle('cursor', 'n-resize');
	var sibling = $(element).getPrevious('.panel');	
	if (!min) min = 0;
	if (!max) {
		max = function(){
			return $(element).getStyle('height').toInt() + sibling.getStyle('height').toInt();
		}.bind(this)
	}
	if (Browser.Engine.trident) {	
		handle.addEvent('mousedown', function(e) {
			handle.setCapture();
		}.bind(this));
		handle.addEvent('mouseup', function(e) {
			handle.releaseCapture();
		}.bind(this));								  													   
	}		
	$(element).makeResizable({
		handle: handle,
		modifiers: {x: false, y: 'height'},
		limit: { y: [min, max] },
		invert: true,		
		onBeforeStart: function(){
			this.originalHeight = $(element).getStyle('height').toInt();
			this.siblingOriginalHeight = sibling.getStyle('height').toInt();
		}.bind(this),
		onStart: function(){
			$(element).getElements('iframe').setStyle('visibility','hidden');
			sibling.getElements('iframe').setStyle('visibility','hidden');
		}.bind(this),							
		onDrag: function(){
			siblingHeight = siblingOriginalHeight + (this.originalHeight - $(element).getStyle('height').toInt());
			sibling.setStyle('height', siblingHeight);
			resizeChildren($(element), $(element).getStyle('height').toInt());
			resizeChildren(sibling, siblingHeight);
		}.bind(this),
		onComplete: function(){
			siblingHeight = siblingOriginalHeight + (this.originalHeight - $(element).getStyle('height').toInt());
			sibling.setStyle('height', siblingHeight);
			resizeChildren($(element), $(element).getStyle('height').toInt());
			resizeChildren(sibling, siblingHeight);
			$(element).getElements('iframe').setStyle('visibility','visible');	
			sibling.getElements('iframe').setStyle('visibility','visible');			
		}.bind(this)		
	});
}

/*

Class: Column
	Create a column.

Syntax:
(start code)
	MochaUI.Panel();
(end)
		
*/
MochaUI.Column = new Class({
							
	Extends: MochaUI.Desktop,
	
	Implements: [Events, Options],
	
	options: {
		id:               null        // This must be set when creating the column

	},	
	initialize: function(options){
		this.setOptions(options);
		
		$extend(this, {
			isCollapsed: false,
			timestamp: $time()
		});
		
		this.columnEl = new Element('div', {
			'id': this.options.id,												   
			'class': 'column'			
		}).inject($(MochaUI.Desktop.pageWrapper));		
		
	}
});	
MochaUI.Column.implement(new Options, new Events);		

/*

Class: Panel
	Create a panel.

Syntax:
(start code)
	MochaUI.Panel();
(end)
		
*/
MochaUI.Panel = new Class({
							
	Extends: MochaUI.Desktop,
	
	Implements: [Events, Options],
	
	options: {
		id:               null,        // This must be set when creating the panel
		title:            'New Panel',
		column:           null,        // Where to inject the panel. This must be set when creating the panel
		loadMethod:       'html',
		contentURL:       'pages/lipsum.html',	
	
		// xhr options
		evalScripts:      true,
		evalResponse:     false,
	
		// html options
		content:          'Panel content',		
		
		// Tabs
		tabsURL:          null,				

		footer:           false,
		
		// Style options:
		height:           125,
		addClass:         '',   // NOT YET IMPLEMENTED   
		scrollbars:       true, // NOT YET IMPLEMENTED
		padding:   		  { top: 8, right: 8, bottom: 8, left: 8 },
		
		// Color options:		
		panelBackground:   '#f1f1f1',			
		
		// Events
		onBeforeBuild:     $empty, // NOT YET IMPLEMENTED
		onContentLoaded:   $empty,
		onResize:          $empty, // NOT YET IMPLEMENTED
		onMinimize:        $empty, // NOT YET IMPLEMENTED
		onRestore:         $empty, // NOT YET IMPLEMENTED
		onClose:           $empty, // NOT YET IMPLEMENTED
		onCloseComplete:   $empty  // NOT YET IMPLEMENTED				
		
	},	
	initialize: function(options){
		this.setOptions(options);
		
		$extend(this, {
			isCollapsed: false,
			iframe: options.loadMethod == 'iframe' ? true : false,			
			timestamp: $time()
		});		
		
		this.originalHeight = this.options.height; // NOT USED YET
		
		// Shorten object chain
		var instances = MochaUI.Panels.instances;
		var instanceID = instances.get(this.options.id);
	
		// Here we check to see if there is already a class instance for this panel
		if (instanceID){			
			var currentInstance = instanceID;		
		}
		
		// Check if window already exists and is not in progress of closing
		if ( this.panelEl ) {
			return;
		}
		else {			
			instances.set(this.options.id, this);
		}
		
		if (this.options.loadMethod == 'iframe') {
			// Iframes have their own scrollbars and padding.
			this.options.scrollbars = false;
			this.options.padding = { top: 0, right: 0, bottom: 0, left: 0 };
		}				

		var addHandle = true;
		if ($(this.options.column).getChildren().length == 0) {
			addHandle = false;
		}

		this.panelEl = new Element('div', {
			'id': this.options.id,												   
			'class': 'panel',
			'styles': {
				'height': this.options.height,
				'background': this.options.panelBackground
			}			
		}).inject($(this.options.column));
		
		this.contentEl = new Element('div', {
			'id': this.options.id + '_pad',												   
			'class': 'pad'
		}).inject(this.panelEl);
		
		this.contentWrapperEl = this.panelEl;
		
		
		// Set scrollbars, always use 'hidden' for iframe windows
		this.contentWrapperEl.setStyles({
			'overflow': this.options.scrollbars && !this.options.iframe ? 'auto' : 'hidden'
		});

		this.contentEl.setStyles({
			'padding-top': this.options.padding.top,
			'padding-bottom': this.options.padding.bottom,
			'padding-left': this.options.padding.left,
			'padding-right': this.options.padding.right
		});			
		
		this.panelHeaderEl = new Element('div', {
			'id': this.options.id + '_header',												   
			'class': 'panel-header'
		}).inject(this.panelEl, 'before');
		
		this.panelHeaderToolboxEl = new Element('div', {
			'id': this.options.id + '_headerToolbox',										   
			'class': 'panel-header-toolbox'
		}).inject(this.panelHeaderEl);

		this.panelCollapseToggle = new Element('div', {
			'id': this.options.id + '_minmize',
			'class': 'panel-collapse icon16',
			'styles': {
				'width': 16,
				'height': 16
			},
			'title': 'Minimize Panel',
			'background': '#f00'
		}).inject(this.panelHeaderToolboxEl);
        
		this.panelCollapseToggle.addEvent('click', function(event){
 			var panel = this.panelEl;
			if (this.isCollapsed == false) {
				panel.setStyle('height', 0);
				this.isCollapsed = true;
				panelHeight();
				panel.removeClass('panel-collapsed');
				panel.addClass('panel-expand');
			}
			else {
				panel.setStyle('height', 300);
				this.isCollapsed = false;
				panelHeight();
				panel.removeClass('panel-expand');
				panel.addClass('panel-collapsed');
			}
		}
		.bind(this));							
		
		this.titleEl = new Element('h2', {
			'id': this.options.id + '_title'
		}).inject(this.panelHeaderEl);		
		
		if (this.options.tabsURL == null) {
			this.titleEl.set('html', this.options.title);
		}
		else {
			MochaUI.updateContent({
				'element':      this.panelEl,
				'childElement': this.panelHeaderEl,
				'loadMethod':   'xhr',								
				'url':          this.options.tabsURL
			});		
		}
		
		// Only add handle if not only panel in column		
		if (addHandle == true) {		
			this.panelHandleEl = new Element('div', {
				'id': this.options.id + '_handle',
				'class': 'horizontalHandle'
			}).inject(this.panelHeaderEl, 'before');
			addResizeTop(this.options.id);
		}
			
		// Add content to panel.
		MochaUI.updateContent({
			'element': this.panelEl,
			'content':  this.options.content,
			'url':      this.options.contentURL
		});			

		// Todo: Make this so it only effects the column in question
		// This should probably happen before updateContent
		panelHeight();				
					
	}
});
MochaUI.Panel.implement(new Options, new Events);	

function initLayout(){	
	$$('.columnHandle').setStyle('visibility','visible');
	$$('.column').setStyle('visibility','visible');
}
