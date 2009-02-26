/* 

Script: Core.js
	MochaUI - A Web Applications User Interface Framework.

Copyright:
	Copyright (c) 2007-2009 Greg Houston, <http://greghoustondesign.com/>.

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
		advancedEffects: false, // Effects that require fast browsers and are cpu intensive.
		standardEffects: true   // Basic effects that tend to run smoothly.
	}),	

	ieSupport: 'excanvas',  // Makes it easier to switch between Excanvas and Moocanvas for testing	

	// Functionality for queuing content updates. This is currently used for Opera only.
	// Opera gets confused when several XMLHttpRequests and DOM Javascript injections are going on concurrently.
	queue: [],
	updating: false,
	nextInQueue: function(){
		if (MochaUI.queue.length) {
			MochaUI.updateContent(MochaUI.queue.shift(), true);			
		}
		else {
			MochaUI.updating = false;
			return false;			
		}				
	},	
	/*
	
	Function: updateContent
		Replace the content of a window or panel.
		
	Arguments:
		updateOptions - (object)
		next - (boolean) True if next in download queu.
	
	updateOptions:
		element - The parent window or panel.
		childElement - The child element of the window or panel recieving the content.
		method - ('get', or 'post') The way data is transmitted.
		data - (hash) Data to be transmitted
		title - (string) Change this if you want to change the title of the window or panel.
		content - (string or element) An html loadMethod option.
		loadMethod - ('html', 'xhr', or 'iframe')
		url - Used if loadMethod is set to 'xhr' or 'iframe'.
		scrollbars - (boolean)		
		padding - (object)
		onContentLoaded - (function)

	*/	
	updateContent: function(updateOptions, next){

		if (Browser.Engine.presto) {
			if (MochaUI.updating == true && !next) {
				MochaUI.queue.push(updateOptions);
				return;
			}
			MochaUI.updating = true;
		}
	
		var options = {
			'element':      null,
			'childElement': null,
			'method':	    null,
			'data':		    null,
			'title':        null,
			'content':      null,
			'loadMethod':   null,
			'url':          null,
			'scrollbars':   null,			
			'padding':      null,
			'onContentLoaded': $empty
		};
		$extend(options, updateOptions);

		if (!options.element) return;
		var element = options.element;

		if (MochaUI.Windows.instances.get(element.id)){
			var recipient = 'window';
			var currentInstance = MochaUI.Windows.instances.get(element.id);
			var spinnerEl = currentInstance.spinnerEl;
			if (options.title) currentInstance.titleEl.set('html', options.title);			
		}
		else {
			var recipient = 'panel';
			var currentInstance = MochaUI.Panels.instances.get(element.id);
			if (options.title) currentInstance.titleEl.set('html', options.title);			
		}

		var contentEl = currentInstance.contentEl;
		var contentContainer = options.childElement != null ? options.childElement : currentInstance.contentEl;		
		var loadMethod = options.loadMethod != null ? options.loadMethod : currentInstance.options.loadMethod;
		var method = options.method != null ? options.method : "get";
				
		// Set scrollbars if loading content in main content container.
		// Always use 'hidden' for iframe windows
		var scrollbars = options.scrollbars != null ? options.scrollbars : currentInstance.options.scrollbars;	
		if (contentContainer == currentInstance.contentEl) {
			currentInstance.contentWrapperEl.setStyles({
				'overflow': scrollbars != false && loadMethod != 'iframe' ? 'auto' : 'hidden'
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
		if (contentContainer == contentEl) {
			contentEl.empty().show();			
			// Panels are not loaded into the padding div, so we remove them separately.
			contentEl.getAllNext('.column').destroy();
			contentEl.getAllNext('.columnHandle').destroy();
		}
		
		var onContentLoaded = function(){
			options.onContentLoaded ? options.onContentLoaded() : currentInstance.fireEvent('onContentLoaded', element);
		};		
				
		// Load new content.
		switch(loadMethod){
			case 'xhr':			
				var data = options.data != null ? new Hash(options.data).toQueryString() : "";
				new Request.HTML({
					url: options.url,
					update: contentContainer, // Using update for some reason preserves whitespace in IE6 and 7. It is fine in IE8.
					method: method,
					data: data, 
					evalScripts: currentInstance.options.evalScripts,
					evalResponse: currentInstance.options.evalResponse,				
					onRequest: function(){
						if (recipient == 'window' && contentContainer == contentEl){
							currentInstance.showSpinner(spinnerEl);
						}
						else if (recipient == 'panel' && contentContainer == contentEl && $('spinner')){
							$('spinner').show();	
						}
					}.bind(this),
					onFailure: function(response){
						if (contentContainer == contentEl){

							var getTitle = new RegExp("<title>[\n\r\s]*(.*)[\n\r\s]*</title>", "gmi");
							var error = getTitle.exec(response.responseText);
							if (!error) error = 'Unknown';							 
							contentContainer.set('html', '<h3>Error: ' + error[1] + '</h3>');					

							if (recipient == 'window') currentInstance.hideSpinner(spinnerEl);						
							else if (recipient == 'panel' && $('spinner')) $('spinner').hide();
							MochaUI.nextInQueue();							
						}
					}.bind(this),
					onException: function(){
						MochaUI.nextInQueue();
					}.bind(this),
					onSuccess: function(){
						if (contentContainer == contentEl){
							if (recipient == 'window') currentInstance.hideSpinner(spinnerEl);							
							else if (recipient == 'panel' && $('spinner')) $('spinner').hide();							
						}
						Browser.Engine.trident4 ? onContentLoaded.delay(50) : onContentLoaded();						
						MochaUI.nextInQueue();
					}.bind(this),
					onComplete: function(){}.bind(this)
				}).send();
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
					if (recipient == 'window') currentInstance.hideSpinner(spinnerEl);					
					else if (recipient == 'panel' && contentContainer == contentEl && $('spinner')) $('spinner').hide();
					Browser.Engine.trident4 ? onContentLoaded.delay(50) : onContentLoaded();
					MochaUI.nextInQueue();	
				}.bind(this));
				if (recipient == 'window') currentInstance.showSpinner(spinnerEl);				
				else if (recipient == 'panel' && contentContainer == contentEl && $('spinner')) $('spinner').show();				
				break;
			case 'html':
			default:
				var elementTypes = new Array('element', 'textnode', 'whitespace', 'collection');
				
				if (elementTypes.contains($type(options.content))){
					options.content.inject(contentContainer);
				} else {
					contentContainer.set('html', options.content);
				}				
				if (contentContainer == contentEl){
					if (recipient == 'window') currentInstance.hideSpinner(spinnerEl);					
					else if (recipient == 'panel' && $('spinner')) $('spinner').hide();									
				}
				Browser.Engine.trident4 ? onContentLoaded.delay(50) : onContentLoaded();				
				MochaUI.nextInQueue();	
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
		Browser.Engine.gecko ? $(iframe).src = $(iframe).src : top.frames[iframe].location.reload(true);		
	},
	collapseToggle: function(windowEl){
		var instances = MochaUI.Windows.instances;
		var currentInstance = instances.get(windowEl.id);
		var handles = currentInstance.windowEl.getElements('.handle');
		if (currentInstance.isMaximized == true) return;		
		if (currentInstance.isCollapsed == false) {
			currentInstance.isCollapsed = true;
			handles.hide();
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
			currentInstance.drawWindowCollapsed();
		}
		else {
			currentInstance.isCollapsed = false;
			currentInstance.drawWindow();
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
			handles.show();
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
			$('modalFix').hide();
		}
		
		if (MochaUI.options.advancedEffects == false){			
			if (currentInstance.options.type == 'modal' || currentInstance.options.type == 'modal2'){
				$('modalOverlay').setStyle('opacity', 0);
			}			
			MochaUI.closingJobs(windowEl);			
			return true;	
		}
		else {
			// Redraws IE windows without shadows since IE messes up canvas alpha when you change element opacity
			if (Browser.Engine.trident) currentInstance.drawWindow(false);
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
		// Destroy throws an error in IE8
		if (Browser.Engine.trident) {
			windowEl.dispose();
		}
		else {
			windowEl.destroy();
		}
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
		MochaUI.Windows.focusingWindow = true;
		var windowClicked = function(){
			MochaUI.Windows.focusingWindow = false;
		};
		windowClicked.delay(170, this);
		
		// Only focus when needed
		if ($$('.mocha').length == 0) return;
		if (windowEl != $(windowEl) || windowEl.hasClass('isFocused')) return;

		var instances =  MochaUI.Windows.instances;
		var currentInstance = instances.get(windowEl.id);
	
		if (currentInstance.options.type == 'notification'){
			windowEl.setStyle('zIndex',11001);
			return;
		};

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
		windowEl.addClass('isFocused');

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
		if (MochaUI.Windows.focusingWindow == false) {
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
		if (windowPosTop < -currentInstance.options.shadowBlur){
			windowPosTop = -currentInstance.options.shadowBlur;
		}
		var windowPosLeft =	(dimensions.width * .5) - (windowEl.offsetWidth * .5);
		if (windowPosLeft < -currentInstance.options.shadowBlur){
			windowPosLeft = -currentInstance.options.shadowBlur;
		}
		if (MochaUI.options.advancedEffects == true){
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
				shadowBlur: 5	
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
		
		contentWrapperEl.setStyles({
			'height': contentEl.offsetHeight,
			'width': contentEl.offsetWidth
		});				
		currentInstance.drawWindow();
	},
	/*
	  	
	Function: toggleEffects
		Turn effects on and off

	*/
	toggleAdvancedEffects: function(link){
		if (MochaUI.options.advancedEffects == false) {
			MochaUI.options.advancedEffects = true;
			if (link){
				this.toggleAdvancedEffectsLink = new Element('div', {
					'class': 'check',
					'id': 'toggleAdvancedEffects_check'
				}).inject(link);
			}			
		}
		else {
			MochaUI.options.advancedEffects = false;
			if (this.toggleAdvancedEffectsLink) {
				this.toggleAdvancedEffectsLink.destroy();
			}		
		}
	},
	/*
	  	
	Function: toggleStandardEffects
		Turn standard effects on and off

	*/
	toggleStandardEffects: function(link){
		if (MochaUI.options.standardEffects == false) {
			MochaUI.options.standardEffects = true;
			if (link){
				this.toggleStandardEffectsLink = new Element('div', {
					'class': 'check',
					'id': 'toggleStandardEffects_check'
				}).inject(link);
			}			
		}
		else {
			MochaUI.options.standardEffects = false;
			if (this.toggleStandardEffectsLink) {
				this.toggleStandardEffectsLink.destroy();
			}		
		}
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

window.addEvent('domready', function(){
	MochaUI.underlayInitialize();
});

window.addEvent('resize', function(){
	if ($('windowUnderlay')) {
		MochaUI.setUnderlaySize();
	}
	else {
		MochaUI.underlayInitialize();
	}
});

Element.implement({
	hide: function(){
		this.setStyle('display', 'none');
		return this;
	},
	show: function(){
		this.setStyle('display', 'block');
		return this;
	}	
});	

/*

Shake effect by Uvumi Tools
http://tools.uvumi.com/element-shake.html

Function: shake

Example:
	Shake a window.
	(start code)
	$('parametrics').shake()
	(end)
  
*/

Element.implement({
	shake: function(radius,duration){
		radius = radius || 3;
		duration = duration || 500;
		duration = (duration/50).toInt() - 1;
		var parent = this.getParent();
		if(parent != $(document.body) && parent.getStyle('position') == 'static'){
			parent.setStyle('position','relative');
		}
		var position = this.getStyle('position');
		if(position == 'static'){
			this.setStyle('position','relative');
			position = 'relative';
		}
		if(Browser.Engine.trident){
			parent.setStyle('height',parent.getStyle('height'));
		}
		var coords = this.getPosition(parent);
		if(position == 'relative' && !Browser.Engine.presto){
			coords.x -= parent.getStyle('paddingLeft').toInt();
			coords.y -= parent.getStyle('paddingTop').toInt();
		}
		var morph = this.retrieve('morph');
		if (morph){
			morph.cancel();
			var oldOptions = morph.options;
		}
		var morph = this.get('morph',{
			duration:50,
			link:'chain'
		});
		for(var i=0 ; i < duration ; i++){
			morph.start({
				top:coords.y+$random(-radius,radius),
				left:coords.x+$random(-radius,radius)
			});
		}
		morph.start({
			top:coords.y,
			left:coords.x
		}).chain(function(){
			if(oldOptions){
				this.set('morph',oldOptions);
			}
		}.bind(this));
		return this;
	}
});

// This makes it so Request will work to some degree locally
if (location.protocol == "file:"){

	Request.implement({
		isSuccess : function(status){
			return (status == 0 || (status >= 200) && (status < 300));
		}
	});

	Browser.Request = function(){
		return $try(function(){
			return new ActiveXObject('MSXML2.XMLHTTP');
		}, function(){
			return new XMLHttpRequest();
		});
	};
	
}

/* Fix an Opera bug in Mootools 1.2 */
Asset.extend({

	javascript: function(source, properties){
		properties = $extend({
			onload: $empty,
			document: document,
			check: $lambda(true)
		}, properties);
		
		if ($(properties.id)) {
			properties.onload();
			return $(properties.id);
		}		
		
		var script = new Element('script', {'src': source, 'type': 'text/javascript'});
		
		var load = properties.onload.bind(script), check = properties.check, doc = properties.document;
		delete properties.onload; delete properties.check; delete properties.document;
		
		if (!Browser.Engine.webkit419 && !Browser.Engine.presto){
			script.addEvents({
				load: load,
				readystatechange: function(){
					if (Browser.Engine.trident && ['loaded', 'complete'].contains(this.readyState)) 
						load();
				}
			}).setProperties(properties);
		}
		else {
			var checker = (function(){
				if (!$try(check)) return;
				$clear(checker);
				// Opera has difficulty with multiple scripts being injected into the head simultaneously. We need to give it time to catch up.
				Browser.Engine.presto ? load.delay(500) : load();
			}).periodical(50);
		}	
		return script.inject(doc.head);
	}
	
});

String.implement({
 
	parseQueryString: function() {
		var vars = this.split(/[&;]/);
		var rs = {};
		if (vars.length) vars.each(function(val) {
			var keys = val.split('=');
			if (keys.length && keys.length == 2) rs[decodeURIComponent(keys[0])] = decodeURIComponent(keys[1]);
		});
		return rs;
	}
 
});
