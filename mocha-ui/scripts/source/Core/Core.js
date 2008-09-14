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

Todo:
	Consider making title tooltips optional and using them more often.

*/

var MochaUI = new Hash({
	options: new Hash({
		useEffects: true  // Toggles the majority of window fade and move effects.
	}),
	Columns: {
		instances:      new Hash()
	},
	Panels: {
		instances:      new Hash()
	},		
	Windows: {	  
		instances:      new Hash(),
		indexLevel:     100,          // Used for z-Index
		windowIDCount:  0,	          // Used for windows without an ID defined by the user
		windowsVisible: true          // Ctrl-Alt-Q to toggle window visibility
	},	
	ieSupport:  'excanvas',   // Makes it easier to switch between Excanvas and Moocanvas for testing
	focusingWindow: 'false',
	/*
	
	Function: updateContent
		Replace the content of a window or panel.
		
	Arguments:
		element - The parent window or panel.
		childElement - The child element of the window or panel recieving the content.
		title - (string) Change this if you want to change the title of the window or panel.
		content - (string or element) An html loadMethod option.
		loadMethod - ('html', 'xhr', or 'iframe') Defaults to 'html'.
		url - Used if loadMethod is set to 'xhr' or 'iframe'.
		padding - (object)

	*/	
	updateContent: function(updateOptions){

		var options = {
			'element':      null,
			'childElement': null,
			'title':        null,
			'content':      null,
			'loadMethod':   null,
			'url':          null,
			'padding':      null
		};
		$extend(options, updateOptions);

		if (!options.element) return;
		var element = options.element;

		if (MochaUI.Windows.instances.get(element.id)) {
			var recipient = 'window';
			var currentInstance = MochaUI.Windows.instances.get(element.id);
			var spinnerEl = currentInstance.spinnerEl;
			if (options.title) {
				currentInstance.titleEl.set('html', options.title);
			}
		}
		else {
			var recipient = 'panel';
			var currentInstance = MochaUI.Panels.instances.get(element.id);
			if (options.title) {
				currentInstance.titleEl.set('html', options.title);
			}
		}

		var contentEl = currentInstance.contentEl;
		if (options.childElement != null) {
			var contentContainer = options.childElement;
		}
		else {
			var contentContainer = currentInstance.contentEl;
		}
		
		var loadMethod = options.loadMethod != null ? options.loadMethod : currentInstance.options.loadMethod;
		
		// Set scrollbars if loading content in main content container.
		// Always use 'hidden' for iframe windows
		if (contentContainer == currentInstance.contentEl) {
			currentInstance.contentWrapperEl.setStyles({
				'overflow': currentInstance.options.scrollbars == true && loadMethod != 'iframe' ? 'auto' : 'hidden'
			});
		}

		var contentWrapperEl = currentInstance.contentWrapperEl;
		
		if (options.padding != null) {
			contentEl.setStyles({
				'padding-top': options.padding.top,
				'padding-bottom': options.padding.bottom,
				'padding-left': options.padding.left,
				'padding-right': options.padding.right
			});
		}

		// Remove old content.
		if (contentContainer == contentEl){
			contentEl.empty();
		}

		// Load new content.
		switch(loadMethod){
			case 'xhr':
				new Request.HTML({
					url: options.url,
					update: contentContainer,
					evalScripts: currentInstance.options.evalScripts,
					evalResponse: currentInstance.options.evalResponse,
					onRequest: function(){
						if (recipient == 'window' && contentContainer == contentEl){
							currentInstance.showSpinner(spinnerEl);
						}
						else if (recipient == 'panel' && contentContainer == contentEl && $('spinner')){
							$('spinner').setStyle('visibility','visible');	
						}
					}.bind(this),
					onFailure: function(){
						if (contentContainer == contentEl){
							contentContainer.set('html','<p><strong>Error Loading XMLHttpRequest</strong></p>');
							if (recipient == 'window') {
								currentInstance.hideSpinner(spinnerEl);
							}
							else if (recipient == 'panel' && $('spinner')) {
								$('spinner').setStyle('visibility', 'hidden');
							}
						}
					}.bind(this),
					onException: function(){}.bind(this),
					onSuccess: function(){
						if (contentContainer == contentEl){
							if (recipient == 'window'){
								currentInstance.hideSpinner(spinnerEl);
							}
							else if (recipient == 'panel' && $('spinner')){
								$('spinner').setStyle('visibility', 'hidden');
							}
							currentInstance.fireEvent('onContentLoaded', element);
						}
					}.bind(this),
					onComplete: function(){}.bind(this)
				}).get();
				break;
			case 'iframe': // May be able to streamline this if the iframe already exists.
				if ( currentInstance.options.contentURL == '' || contentContainer != contentEl) {
					break;
				}
				currentInstance.iframeEl = new Element('iframe', {
					'id': currentInstance.options.id + '_iframe',
					'name':  currentInstance.options.id + '_iframe',
					'class': 'mochaIframe',
					'src': options.url,
					'marginwidth':  0,
					'marginheight': 0,
					'frameBorder':  0,
					'scrolling':    'auto',
					'styles': {
						'height': contentWrapperEl.offsetHeight - contentWrapperEl.getStyle('border-top').toInt() - contentWrapperEl.getStyle('border-bottom').toInt(),
						'width': currentInstance.panelEl ? contentWrapperEl.offsetWidth - contentWrapperEl.getStyle('border-left').toInt() - contentWrapperEl.getStyle('border-right').toInt() : '100%'	
					}
				}).injectInside(contentEl);

				// Add onload event to iframe so we can hide the spinner and run onContentLoaded()
				currentInstance.iframeEl.addEvent('load', function(e) {
					if (recipient == 'window') {
						currentInstance.hideSpinner(spinnerEl);
					}
					else if (recipient == 'panel' && contentContainer == contentEl && $('spinner')) {
						$('spinner').setStyle('visibility', 'hidden');
					}
					currentInstance.fireEvent('onContentLoaded', element);
				}.bind(this));
				if (recipient == 'window') {
					currentInstance.showSpinner(spinnerEl);
				}
				else if (recipient == 'panel' && contentContainer == contentEl && $('spinner')){
					$('spinner').setStyle('visibility', 'visible');	
				}
				break;
			case 'html':
			default:
				// Need to test injecting elements as content.
				var elementTypes = new Array('element', 'textnode', 'whitespace', 'collection');
				if (elementTypes.contains($type(options.content))){
					options.content.inject(contentContainer);
				} else {
					contentContainer.set('html', options.content);
				}
				currentInstance.fireEvent('onContentLoaded', element);
				break;
		}

	},
	/*
	
	Function: reloadIframe
		Reload an iframe. Fixes an issue in Firefox when trying to use location.reload on an iframe that has been destroyed and recreated.

	Arguments:
		iframe - This should be both the name and the id of the iframe.

	Syntax:
		(start code)
		MochaUI.reloadIframe(element);
		(end)

	Example:
		To reload an iframe from within another iframe:
		(start code)
		parent.MochaUI.reloadIframe('myIframeName');
		(end)

	*/
	reloadIframe: function(iframe){
		if (Browser.Engine.gecko) {
			$(iframe).src = $(iframe).src;
		}
		else {
			top.frames[iframe].location.reload(true);
		}
	},
	collapseToggle: function(windowEl){
		var instances = MochaUI.Windows.instances;
		var currentInstance = instances.get(windowEl.id);
		var handles = currentInstance.windowEl.getElements('.handle');
		if (currentInstance.isMaximized == true) return;		
		if (currentInstance.isCollapsed == false) {
			currentInstance.isCollapsed = true;
			handles.setStyle('display', 'none');
			if ( currentInstance.iframeEl ) {
				currentInstance.iframeEl.setStyle('visibility', 'hidden');
			}
			currentInstance.contentBorderEl.setStyles({
				visibility: 'hidden',
				position: 'absolute',
				top: -10000,
				left: -10000
			});
			if(currentInstance.toolbarWrapperEl){
				currentInstance.toolbarWrapperEl.setStyles({
					visibility: 'hidden',
					position: 'absolute',
					top: -10000,
					left: -10000
				});
			}
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
			if(currentInstance.toolbarWrapperEl){
				currentInstance.toolbarWrapperEl.setStyles({
					visibility: 'visible',
					position: null,
					top: null,
					left: null
				});
			}
			if ( currentInstance.iframeEl ) {
				currentInstance.iframeEl.setStyle('visibility', 'visible');
			}
			handles.setStyle('display', 'block');
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
		windowEl - the ID of the window to be closed

	Returns:
		true - the window was closed
		false - the window was not closed

	*/
	closeWindow: function(windowEl){
		// Does window exist and is not already in process of closing ?

		var instances = MochaUI.Windows.instances;
		var currentInstance = instances.get(windowEl.id);
		if (windowEl != $(windowEl) || currentInstance.isClosing) return;
			
		currentInstance.isClosing = true;
		currentInstance.fireEvent('onClose', windowEl);
		if (currentInstance.check) currentInstance.check.destroy();

		if ((currentInstance.options.type == 'modal' || currentInstance.options.type == 'modal2') && Browser.Engine.trident4){
				$('modalFix').setStyle('display', 'none');
		}

		if (MochaUI.options.useEffects == false){
			if (currentInstance.options.type == 'modal' || currentInstance.options.type == 'modal2'){
				$('modalOverlay').setStyle('opacity', 0);
			}
			MochaUI.closingJobs(windowEl);
			return true;	
		}
		else {
			// Redraws IE windows without shadows since IE messes up canvas alpha when you change element opacity
			if (Browser.Engine.trident) currentInstance.drawWindow(windowEl, false);
			if (currentInstance.options.type == 'modal' || currentInstance.options.type == 'modal2'){
				MochaUI.Modal.modalOverlayCloseMorph.start({
					'opacity': 0
				});
			}
			var closeMorph = new Fx.Morph(windowEl, {
				duration: 120,
				onComplete: function(){
					MochaUI.closingJobs(windowEl);
					return true;
				}.bind(this)
			});
			closeMorph.start({
				'opacity': .4
			});
		}

	},
	closingJobs: function(windowEl){

		var instances = MochaUI.Windows.instances;
		var currentInstance = instances.get(windowEl.id);
		windowEl.setStyle('visibility', 'hidden');
		windowEl.destroy();
		currentInstance.fireEvent('onCloseComplete');
		
		if (currentInstance.options.type != 'notification'){
			var newFocus = this.getWindowWithHighestZindex();
			this.focusWindow(newFocus);
		}

		instances.erase(currentInstance.options.id);
		if (this.loadingWorkspace == true) {
			this.windowUnload();
		}

		if (MochaUI.Dock && $(MochaUI.options.dock) && currentInstance.options.type == 'window') {
			var currentButton = $(currentInstance.options.id + '_dockTab');
			if (currentButton != null) {
				MochaUI.Dock.dockSortables.removeItems(currentButton).destroy();
			}
			// Need to resize everything in case the dock becomes smaller when a tab is removed
			MochaUI.Desktop.setDesktopSize();
		}
	},
	/*
	
	Function: closeAll	
		Close all open windows.

	*/
	closeAll: function() {		
		$$('div.mocha').each(function(windowEl){
			this.closeWindow(windowEl);
		}.bind(this));
	},
	/*

	Function: toggleWindowVisibility
		Toggle window visibility with Ctrl-Alt-Q.

	*/	
	toggleWindowVisibility: function(){
		MochaUI.Windows.instances.each(function(instance){
			if (instance.options.type == 'modal' || instance.options.type == 'modal2' || instance.isMinimized == true) return;									
			var id = $(instance.options.id);
			if (id.getStyle('visibility') == 'visible'){
				if (instance.iframe){
					instance.iframeEl.setStyle('visibility', 'hidden');
				}
				if (instance.toolbarEl){
					instance.toolbarWrapperEl.setStyle('visibility', 'hidden');
				}
				instance.contentBorderEl.setStyle('visibility', 'hidden');
				id.setStyle('visibility', 'hidden');
				MochaUI.Windows.windowsVisible = false;
			}
			else {
				id.setStyle('visibility', 'visible');
				instance.contentBorderEl.setStyle('visibility', 'visible');
				if (instance.iframe){
					instance.iframeEl.setStyle('visibility', 'visible');
				}
				if (instance.toolbarEl){
					instance.toolbarWrapperEl.setStyle('visibility', 'visible');
				}
				MochaUI.Windows.windowsVisible = true;
			}
		}.bind(this));

	},
	focusWindow: function(windowEl, fireEvent){

		// This is used with blurAll
		MochaUI.focusingWindow = 'true';
		var windowClicked = function(){
			MochaUI.focusingWindow = 'false';
		};		
		windowClicked.delay(170, this);

		// Only focus when needed
		if ($$('.mocha').length == 0) return;
		if (windowEl != $(windowEl) || windowEl.hasClass('isFocused')) return;

		var instances =  MochaUI.Windows.instances;
		var currentInstance = instances.get(windowEl.id);
	
		if (currentInstance.options.type == 'notification') return;

		MochaUI.Windows.indexLevel += 2;
		windowEl.setStyle('zIndex', MochaUI.Windows.indexLevel);

		// Used when dragging and resizing windows
		$('windowUnderlay').setStyle('zIndex', MochaUI.Windows.indexLevel - 1).inject($(windowEl),'after');

		// Fire onBlur for the window that lost focus.
		instances.each(function(instance){
			if (instance.windowEl.hasClass('isFocused')){
				instance.fireEvent('onBlur', instance.windowEl);
			}
			instance.windowEl.removeClass('isFocused');
		});

		if (MochaUI.Dock && $(MochaUI.options.dock) && currentInstance.options.type == 'window') {
			MochaUI.Dock.makeActiveTab();
		}
		currentInstance.windowEl.addClass('isFocused');

		if (fireEvent != false){
			currentInstance.fireEvent('onFocus', windowEl);
		}

	},
	getWindowWithHighestZindex: function(){
		this.highestZindex = 0;
		$$('div.mocha').each(function(element){
			this.zIndex = element.getStyle('zIndex');
			if (this.zIndex >= this.highestZindex) {
				this.highestZindex = this.zIndex;
			}	
		}.bind(this));
		$$('div.mocha').each(function(element){
			if (element.getStyle('zIndex') == this.highestZindex) {
				this.windowWithHighestZindex = element;
			}
		}.bind(this));
		return this.windowWithHighestZindex;
	},
	blurAll: function(){
		if (MochaUI.focusingWindow == 'false') {
			$$('.mocha').each(function(windowEl){
				var instances =  MochaUI.Windows.instances;
				var currentInstance = instances.get(windowEl.id);
				if (currentInstance.options.type != 'modal' && currentInstance.options.type != 'modal2'){
					windowEl.removeClass('isFocused');
				}
			});
			$$('div.dockTab').removeClass('activeDockTab');
		}
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

	Function: centerWindow
		Center a window in it's container. If windowEl is undefined it will center the window that has focus.

	*/
	centerWindow: function(windowEl){
		
		if(!windowEl){
			MochaUI.Windows.instances.each(function(instance){
				if (instance.windowEl.hasClass('isFocused')){
					windowEl = instance.windowEl;
				}
			});
		}

		var currentInstance = MochaUI.Windows.instances.get(windowEl.id);
		var options = currentInstance.options;
		var dimensions = options.container.getCoordinates();
				
		var windowPosTop = window.getScroll().y + (window.getSize().y * .5) - (windowEl.offsetHeight * .5);
		if (windowPosTop < 0) {
			windowPosTop = 0;
		}
		var windowPosLeft =	(dimensions.width * .5) - (windowEl.offsetWidth * .5);
		if (windowPosLeft < 0) {
			windowPosLeft = 0;
		}
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
	notification: function(message){
			new MochaUI.Window({
				loadMethod: 'html',
				closeAfter: 1500,
				type: 'notification',
				addClass: 'notification',
				content: message,
				width: 220,
				height: 40,
				y: 53,
				padding:  { top: 10, right: 12, bottom: 10, left: 12 },
				shadowBlur: 5,
				bodyBgColor: [255, 255, 255]	
			});
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
	garbageCleanUp: function(){
		$$('div.mocha').each(function(el){
			el.destroy();
		}.bind(this));
	},
	/*
	
	The underlay is inserted directly under windows when they are being dragged or resized
	so that the cursor is not captured by iframes or other plugins (such as Flash)
	underneath the window.
	
	*/
	underlayInitialize: function(){
		var windowUnderlay = new Element('div', {
			'id': 'windowUnderlay',
			'styles': {
				'height': parent.getCoordinates().height,
				'opacity': .01,
				'display': 'none'
			}
		}).inject(document.body);
	},
	setUnderlaySize: function(){
		$('windowUnderlay').setStyle('height', parent.getCoordinates().height);
	}
});

/* 

function: fixPNG
	Bob Osola's PngFix for IE6.

example:
	(begin code)
	<img src="xyz.png" alt="foo" width="10" height="20" onload="fixPNG(this)">
	(end)

note:
	You must have the image height and width attributes specified in the markup.

*/

function fixPNG(myImage){
	if (Browser.Engine.trident4 && document.body.filters){
		var imgID = (myImage.id) ? "id='" + myImage.id + "' " : "";
		var imgClass = (myImage.className) ? "class='" + myImage.className + "' " : "";
		var imgTitle = (myImage.title) ? "title='" + myImage.title  + "' " : "title='" + myImage.alt + "' ";
		var imgStyle = "display:inline-block;" + myImage.style.cssText;
		var strNewHTML = "<span " + imgID + imgClass + imgTitle
			+ " style=\"" + "width:" + myImage.width
			+ "px; height:" + myImage.height
			+ "px;" + imgStyle + ";"
			+ "filter:progid:DXImageTransform.Microsoft.AlphaImageLoader"
			+ "(src=\'" + myImage.src + "\', sizingMethod='scale');\"></span>";
		myImage.outerHTML = strNewHTML;		
	}
}

// Toggle window visibility with Ctrl-Alt-Q
document.addEvent('keydown', function(event){
	if (event.key == 'q' && event.control && event.alt) {
		MochaUI.toggleWindowVisibility();
	}
});

// Blur all windows if user clicks anywhere else on the page
document.addEvent('mousedown', function(event){
	MochaUI.blurAll.delay(50);
});

document.addEvent('domready', function(){
	MochaUI.underlayInitialize();
});

window.addEvent('resize', function(){
		MochaUI.setUnderlaySize();
});
