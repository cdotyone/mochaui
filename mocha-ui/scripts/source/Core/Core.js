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
	updateContent: function(windowEl, content, url, element, loadMethod){
		
		if (!windowEl) return;		
		
		//alert('test');
		
		var currentInstance = MochaUI.Windows.instances.get(windowEl.id);
		var contentEl = currentInstance.contentEl;
		var options = currentInstance.options;
		if (element != null){
			var contentContainer = element; 
		}
		else {
			var contentContainer = currentInstance.contentEl;
		}
		var canvasIconEl = currentInstance.canvasIconEl;
		
		// Remove old content.
		if (contentContainer == contentEl){
			currentInstance.contentEl.empty();
		}		
		
		//alert(loadMethod);
		var loadMethod = loadMethod ? loadMethod : currentInstance.options.loadMethod;

		// Load new content.
		switch(loadMethod) {
			case 'xhr':
				new Request.HTML({
					url: url,
					update: contentContainer,
					evalScripts: options.evalScripts,
					evalResponse: options.evalResponse,
					onRequest: function(){
						if (contentContainer == contentEl){
							currentInstance.showLoadingIcon(canvasIconEl);
						}
					}.bind(this),
					onFailure: function(){
						if (contentContainer == contentEl){
							contentContainer.set('html','<p><strong>Error Loading XMLHttpRequest</strong></p>');
							currentInstance.hideLoadingIcon(canvasIconEl);
						}
					}.bind(this),
					onSuccess: function() {
						if (contentContainer == contentEl){
							currentInstance.hideLoadingIcon(canvasIconEl);
							currentInstance.fireEvent('onContentLoaded', windowEl);
						}
					}.bind(this)
				}).get();
				break;
			case 'iframe': // May be able to streamline this if the iframe already exists.
				if ( options.contentURL == '' || contentContainer != contentEl) {
					break;
				}
				currentInstance.iframeEl = new Element('iframe', {
					'id': currentInstance.options.id + '_iframe',
					'name':  currentInstance.options.id + '_iframe',
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
					content.inject(contentContainer);
				} else {
					contentContainer.set('html', content);
				}				
				currentInstance.fireEvent('onContentLoaded', windowEl);
				break;
		}

	},
	collapseToggle: function(windowEl){
		var instances = MochaUI.Windows.instances;
		var currentInstance = instances.get(windowEl.id);
		var handles = currentInstance.windowEl.getElements('.handle');		
		if (currentInstance.isCollapsed == false) {
			currentInstance.isCollapsed = true;
			handles.setStyle('display', 'none');
			if ( currentInstance.iframe ) {
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
			if ( currentInstance.iframe ) {
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

		if (MochaUI.options.useEffects == false){
			if (currentInstance.options.type == 'modal'){
				$('modalOverlay').setStyle('opacity', 0);
				$('modalFix').setStyle('display', 'block');
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
			if (currentInstance.options.type == 'modal'){
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
		Close all open windows.

	*/
	closeAll: function() {		
		$$('div.mocha').each(function(windowEl){
			this.closeWindow(windowEl);			
		}.bind(this));
		MochaUI.Windows.instances.empty();				
		$$('div.dockTab').destroy();
	},
	/*
	
	Function: toggleWindowVisibility
		Toggle window visibility with Ctrl-Alt-Q.
	
	*/	
	toggleWindowVisibility: function(){		
		MochaUI.Windows.instances.each(function(instance){
			if (instance.options.type == 'modal' || instance.isMinimized == true) return;									
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
		if (windowEl != $(windowEl)) return;
		
		var instances =  MochaUI.Windows.instances;
		
		var currentInstance = instances.get(windowEl.id);			
		// Only focus when needed
		if ( windowEl.getStyle('zIndex') == MochaUI.Windows.indexLevel || currentInstance.isFocused == true)
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
		if (fireEvent != false){
			currentInstance.fireEvent('onFocus', windowEl);
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
	garbageCleanUp: function(){
		$$('div.mocha').each(function(el){
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
