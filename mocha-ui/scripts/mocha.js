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
	version: '0.9.5 development',
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
		if (MochaUI.queue.length){
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

		if (Browser.Engine.presto){
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
		}
		else {
			var recipient = 'panel';		
		}
		var instance = element.retrieve('instance');
		if (options.title) instance.titleEl.set('html', options.title);			

		var contentEl = instance.contentEl;
		var contentContainer = options.childElement != null ? options.childElement : instance.contentEl;		
		var loadMethod = options.loadMethod != null ? options.loadMethod : instance.options.loadMethod;
		var method = options.method != null ? options.method : "get";
				
		// Set scrollbars if loading content in main content container.
		// Always use 'hidden' for iframe windows
		var scrollbars = options.scrollbars || instance.options.scrollbars;
		if (contentContainer == instance.contentEl) {
			instance.contentWrapperEl.setStyles({
				'overflow': scrollbars != false && loadMethod != 'iframe' ? 'auto' : 'hidden'
			});
		}		

		var contentWrapperEl = instance.contentWrapperEl;
		
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
			options.onContentLoaded ? options.onContentLoaded() : instance.fireEvent('onContentLoaded', element);
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
					evalScripts: instance.options.evalScripts,
					evalResponse: instance.options.evalResponse,				
					onRequest: function(){
						if (recipient == 'window' && contentContainer == contentEl){
							instance.showSpinner();
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

							if (recipient == 'window') instance.hideSpinner();						
							else if (recipient == 'panel' && $('spinner')) $('spinner').hide();
							MochaUI.nextInQueue();							
						}
					}.bind(this),
					onException: function(){
						MochaUI.nextInQueue();
					}.bind(this),
					onSuccess: function(){
						if (contentContainer == contentEl){
							if (recipient == 'window') instance.hideSpinner();							
							else if (recipient == 'panel' && $('spinner')) $('spinner').hide();							
						}
						Browser.Engine.trident4 ? onContentLoaded.delay(50) : onContentLoaded();						
						MochaUI.nextInQueue();
					}.bind(this),
					onComplete: function(){}.bind(this)
				}).send();
				break;
			case 'iframe': // May be able to streamline this if the iframe already exists.
				if ( instance.options.contentURL == '' || contentContainer != contentEl) {
					break;
				}
				instance.iframeEl = new Element('iframe', {
					'id': instance.options.id + '_iframe',
					'name':  instance.options.id + '_iframe',
					'class': 'mochaIframe',
					'src': options.url,
					'marginwidth':  0,
					'marginheight': 0,
					'frameBorder':  0,
					'scrolling':    'auto',
					'styles': {
						'height': contentWrapperEl.offsetHeight - contentWrapperEl.getStyle('border-top').toInt() - contentWrapperEl.getStyle('border-bottom').toInt(),
						'width': instance.panelEl ? contentWrapperEl.offsetWidth - contentWrapperEl.getStyle('border-left').toInt() - contentWrapperEl.getStyle('border-right').toInt() : '100%'	
					}
				}).injectInside(contentEl);

				// Add onload event to iframe so we can hide the spinner and run onContentLoaded()
				instance.iframeEl.addEvent('load', function(e) {
					if (recipient == 'window') instance.hideSpinner();					
					else if (recipient == 'panel' && contentContainer == contentEl && $('spinner')) $('spinner').hide();
					Browser.Engine.trident4 ? onContentLoaded.delay(50) : onContentLoaded();
					MochaUI.nextInQueue();	
				}.bind(this));
				if (recipient == 'window') instance.showSpinner();				
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
					if (recipient == 'window') instance.hideSpinner();					
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
		ctx.arc(x, y, diameter, 0, Math.PI*2, true);
		ctx.fillStyle = 'rgba(' + rgb.join(',') + ',' + a + ')';
		ctx.fill();
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
		$$('.mocha').each(function(el){
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
/*

Script: Themes.js
	Allows for switching themes dynamically.

Copyright:
	Copyright (c) 2007-2009 Greg Houston, <http://greghoustondesign.com/>.	

License:
	MIT-style license.

Requires:
	Core.js
	
Notes:
	Themes are new and experimental.	
	
Syntax:
	(start code)
	new MochaUI.Themes.init(newTheme);
	(end)
	
Example:
	(start code)
	new MochaUI.Themes.init('charcoal');
	(end)		

Arguments:
	newTheme - (string) The theme name	

*/
	
MochaUI.Themes = {
	options: {
		themesDir:      'themes',    // Path to themes directory
		theme:          'default'

	},

	/*
	
	Function: themeInit
		Initialize a theme. This is experimental and not fully implemented yet.
		
	*/	
	init: function(newTheme){
		this.newTheme = newTheme.toLowerCase();
		if (!this.newTheme || this.newTheme == null || this.newTheme == this.options.theme.toLowerCase()) return;
				
		if ($('spinner')) $('spinner').show();

		/* Add old style sheets to an array */
		this.oldSheets = [];
		$$('link').each( function(link){
			var href = this.options.themesDir + '/' + this.newTheme + '/css/' + link.id.substring(3) +'.css';			
			if (link.href.contains(href)) return;
			
			if (link.id.substring(0,3) == 'css') {
				this.oldSheets.push(link);				
			}
		}.bind(this));
	
		this.sheetsToLoad = this.oldSheets.length;
		this.sheetsLoaded = 0;
		
		/* Download new stylesheets and add them to an array */
		this.newSheets = [];
		this.oldSheets.each( function(link){
			var href = this.options.themesDir + '/' + this.newTheme + '/css/' + link.id.substring(3) +'.css';
								
				var id = link.id;
				
				var cssRequest = new Request({
					method: 'get',
					url: href,
					onComplete: function(response) { 
						var newSheet = new Element('link', {
							'id': id,
							'rel': 'stylesheet',
							'media': 'screen',
							'type': 'text/css',
							'href': href
						});
						this.newSheets.push(newSheet);											
					}.bind(this),
					onFailure: function(response){
						this.themeLoadSuccess = false;
						if ($('spinner')) $('spinner').hide();						
						MochaUI.notification('Stylesheets did not load.');						
					},					
					onSuccess: function(){						
						this.sheetsLoaded++;
						if (this.sheetsLoaded == this.sheetsToLoad) {
							this.updateThemeStylesheets();
							this.themeLoadSuccess = true;
						}  
					}.bind(this)
				});
				cssRequest.send();				

		}.bind(this));
								
	},
	updateThemeStylesheets: function(){

		this.oldSheets.each( function(sheet){
			sheet.destroy();
		});

		this.newSheets.each( function(sheet){
			sheet.inject(document.head);
		});		

		// Delay gives the stylesheets time to take effect. IE6 needs more delay.	
		if (Browser.Engine.trident){
			this.redraw.delay(1250, this);
		}
		else {
			this.redraw.delay(250, this);
		}	
	
	},	
	redraw: function(){

		$$('.replaced').removeClass('replaced');

		// Redraw open windows		
		$$('.mocha').each( function(element){			
			var instance = element.retrieve('instance');
			
			// Convert CSS colors to Canvas colors.
			instance.setColors();							
			instance.drawWindow();			
			
		});

		// Reformat layout
		if (MochaUI.Desktop.desktop){
			var checker = (function(){
				// Make sure the style sheets are really ready.				
				if (MochaUI.Desktop.desktop.getStyle('overflow') != 'hidden'){					
					return;
				}
				$clear(checker);								
				MochaUI.Desktop.setDesktopSize();				
			}).periodical(50);
		}
		
		if ($('spinner')) $('spinner').hide();		
		this.options.theme = this.newTheme;
						
	}
};
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
		options.id = options.id || 'win' + (++MochaUI.Windows.windowIDCount);
		
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
		var instanceID = MochaUI.Windows.instances.get(this.options.id);
		var options = this.options;
	
		// Here we check to see if there is already a class instance for this window
		if (instanceID) var instance = instanceID;		

		// Check if window already exists and is not in progress of closing
		if ( this.windowEl && !this.isClosing ){
			 // Restore if minimized
			if (instance.isMinimized){
				MochaUI.Dock.restoreMinimized(this.windowEl);
			}
			// Expand and focus if collapsed
			if (instance.isCollapsed){
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

		this.windowEl.store('instance', this);

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
		// It returns the windowEl element rather than this Class.
		this.morph = new Fx.Morph(this.windowEl, {
			'duration': 200
		});
		this.windowEl.store('morph', this.morph);

		this.resizeMorph = new Fx.Elements([this.contentWrapperEl, this.windowEl], { 
			duration: 400,
			transition: Fx.Transitions.Sine.easeInOut,
			onStart: function(){
				this.resizeAnimation = this.drawWindow.periodical(20, this);
			}.bind(this),
			onComplete: function(){
				$clear(this.resizeAnimation);
				this.drawWindow();
				// Show iframe
				if ( this.iframeEl ) {
					this.iframeEl.setStyle('visibility', 'visible');
				}	
			}.bind(this)
		});
		this.windowEl.store('resizeMorph', this.resizeMorph);	

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
		ctx.moveTo(x, y - 3.5);
		ctx.lineTo(x, y + 3.5);
		ctx.moveTo(x - 3.5, y);
		ctx.lineTo(x + 3.5, y);
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
		ctx.moveTo(x - 3, y - 3);
		ctx.lineTo(x + 3, y + 3);
		ctx.moveTo(x + 3, y - 3);
		ctx.lineTo(x - 3, y + 3);
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
		ctx.moveTo(x - 3.5, y);
		ctx.lineTo(x + 3.5, y);
		ctx.stroke();
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
	},
	/*

	Function: hideSpinner
		Hides the spinner.
		
	Example:	
		(start code)
		$('myWindow').retrieve('instance').hideSpinner();
		(end)		
		
	*/	
	hideSpinner: function() {
		if (this.spinnerEl)	this.spinnerEl.hide();
		return this;
	},
	/*

	Function: showSpinner
		Shows the spinner.
		
	Example:	
		(start code)
		$('myWindow').retrieve('instance').showSpinner();
		(end)		
	
	*/	
	showSpinner: function(){		
		if (this.spinnerEl) this.spinnerEl.show();
		return this;
	},	
	/* 

	Function: close
		Closes the window. This is an alternative to using MochaUI.Core.closeWindow().
		
	Example:	
		(start code)
		$('myWindow').retrieve('instance').close();
		(end)		
		
	 */
	close: function( ) {
		if (!this.isClosing) MochaUI.closeWindow(this.windowEl);
		return this;
	},
	/*

	Function: minimize
		Minimizes the window.
		
	Example:	
		(start code)
		$('myWindow').retrieve('instance').minimize();
		(end)		

	 */
	minimize: function( ){
		MochaUI.Dock.minimizeWindow(this.windowEl);
		return this;
	},
	/*

	Function: maximize
		Maximizes the window.
		
	Example:	
		(start code)
		$('myWindow').retrieve('instance').maximize();
		(end)		

	 */
	maximize: function( ) {
		if (this.isMinimized){
			MochaUI.Dock.restoreMinimized(this.windowEl);
		}	
		MochaUI.Desktop.maximizeWindow(this.windowEl);
		return this;
	},
	/*

	Function: restore
		Restores a minimized/maximized window to its original size.
		
	Example:	
		(start code)
		$('myWindow').retrieve('instance').restore();
		(end)		

	 */
	restore: function() {
		if ( this.isMinimized )
			MochaUI.Dock.restoreMinimized(this.windowEl);
		else if ( this.isMaximized )
			MochaUI.Desktop.restoreWindow(this.windowEl);
		return this;
	},
	/*

	Function: resize
		Resize a window.
		
	Notes:
		If Advanced Effects are on the resize is animated. If centered is set to true the window remains centered as it resizes.	
			
	Example:	
		(start code)
		$('myWindow').retrieve('instance').resize({width:500,height:300,centered:true});
		(end)		

	 */	
	resize: function(options){		
		MochaUI.resizeWindow(this.windowEl, options);
		return this;
	},	
	/*

	Function: center
		Center a window.
			
	Example:	
		(start code)
		$('myWindow').retrieve('instance').center();
		(end)		

	 */
	center: function() {
		MochaUI.centerWindow(this.windowEl);
		return this;
	},	
	
	hide: function(){
		this.windowEl.setStyle('display', 'none');
		return this;
	},
	
	show: function(){
		this.windowEl.setStyle('display', 'block');
		return this;
	}	
			
});
MochaUI.Window.implement(new Options, new Events);

MochaUI.extend({
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

		var instance = windowEl.retrieve('instance');
		
		// Does window exist and is not already in process of closing ?
		if (windowEl != $(windowEl) || instance.isClosing) return;
			
		instance.isClosing = true;
		instance.fireEvent('onClose', windowEl);
		if (instance.check) instance.check.destroy();

		if ((instance.options.type == 'modal' || instance.options.type == 'modal2') && Browser.Engine.trident4){
			$('modalFix').hide();
		}
		
		if (MochaUI.options.advancedEffects == false){			
			if (instance.options.type == 'modal' || instance.options.type == 'modal2'){
				$('modalOverlay').setStyle('opacity', 0);
			}			
			MochaUI.closingJobs(windowEl);			
			return true;	
		}
		else {
			// Redraws IE windows without shadows since IE messes up canvas alpha when you change element opacity
			if (Browser.Engine.trident) instance.drawWindow(false);
			if (instance.options.type == 'modal' || instance.options.type == 'modal2'){
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
		var instance = instances.get(windowEl.id);		
		windowEl.setStyle('visibility', 'hidden');
		// Destroy throws an error in IE8
		if (Browser.Engine.trident) {
			windowEl.dispose();
		}
		else {
			windowEl.destroy();
		}
		instance.fireEvent('onCloseComplete');		
		
		if (instance.options.type != 'notification'){
			var newFocus = this.getWindowWithHighestZindex();
			this.focusWindow(newFocus);
		}

		instances.erase(instance.options.id);
		if (this.loadingWorkspace == true) {
			this.windowUnload();
		}

		if (MochaUI.Dock && $(MochaUI.options.dock) && instance.options.type == 'window') {
			var currentButton = $(instance.options.id + '_dockTab');
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
		$$('.mocha').each(function(windowEl){
			this.closeWindow(windowEl);
		}.bind(this));
	},
	/*
	  	
	Function: collapseToggle
		Collapses an expanded window. Expands a collapsed window.

	*/
	collapseToggle: function(windowEl){
		var instance = windowEl.retrieve('instance');
		var handles = windowEl.getElements('.handle');
		if (instance.isMaximized == true) return;		
		if (instance.isCollapsed == false) {
			instance.isCollapsed = true;
			handles.hide();
			if ( instance.iframeEl ) {
				instance.iframeEl.setStyle('visibility', 'hidden');
			}
			instance.contentBorderEl.setStyles({
				visibility: 'hidden',
				position: 'absolute',
				top: -10000,
				left: -10000
			});
			if(instance.toolbarWrapperEl){
				instance.toolbarWrapperEl.setStyles({
					visibility: 'hidden',
					position: 'absolute',
					top: -10000,
					left: -10000
				});
			}
			instance.drawWindowCollapsed();
		}
		else {
			instance.isCollapsed = false;
			instance.drawWindow();
			instance.contentBorderEl.setStyles({
				visibility: 'visible',
				position: null,
				top: null,
				left: null
			});
			if(instance.toolbarWrapperEl){
				instance.toolbarWrapperEl.setStyles({
					visibility: 'visible',
					position: null,
					top: null,
					left: null
				});
			}
			if ( instance.iframeEl ) {
				instance.iframeEl.setStyle('visibility', 'visible');
			}
			handles.show();
		}
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
		var instance = instances.get(windowEl.id);
	
		if (instance.options.type == 'notification'){
			windowEl.setStyle('zIndex', 11001);
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

		if (MochaUI.Dock && $(MochaUI.options.dock) && instance.options.type == 'window') {
			MochaUI.Dock.makeActiveTab();
		}
		windowEl.addClass('isFocused');

		if (fireEvent != false){
			instance.fireEvent('onFocus', windowEl);
		}

	},
	getWindowWithHighestZindex: function(){
		this.highestZindex = 0;
		$$('.mocha').each(function(element){
			this.zIndex = element.getStyle('zIndex');
			if (this.zIndex >= this.highestZindex) {
				this.highestZindex = this.zIndex;
			}	
		}.bind(this));
		$$('.mocha').each(function(element){
			if (element.getStyle('zIndex') == this.highestZindex) {
				this.windowWithHighestZindex = element;
			}
		}.bind(this));
		return this.windowWithHighestZindex;
	},
	blurAll: function(){		
		if (MochaUI.Windows.focusingWindow == false) {
			$$('.mocha').each(function(windowEl){
				var instance = windowEl.retrieve('instance');
				if (instance.options.type != 'modal' && instance.options.type != 'modal2'){
					windowEl.removeClass('isFocused');
				}
			});
			$$('.dockTab').removeClass('activeDockTab');
		}
	},
	centerWindow: function(windowEl){
		
		if(!windowEl){
			MochaUI.Windows.instances.each(function(instance){
				if (instance.windowEl.hasClass('isFocused')){
					windowEl = instance.windowEl;
				}
			});
		}

		var instance = windowEl.retrieve('instance');
		var options = instance.options;
		var dimensions = options.container.getCoordinates();
				
		var windowPosTop = window.getScroll().y + (window.getSize().y * .5) - (windowEl.offsetHeight * .5);
		if (windowPosTop < -instance.options.shadowBlur){
			windowPosTop = -instance.options.shadowBlur;
		}
		var windowPosLeft =	(dimensions.width * .5) - (windowEl.offsetWidth * .5);
		if (windowPosLeft < -instance.options.shadowBlur){
			windowPosLeft = -instance.options.shadowBlur;
		}
		if (MochaUI.options.advancedEffects == true){
			instance.morph.start({
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
	resizeWindow: function(windowEl, options){
		var instance = windowEl.retrieve('instance');
		
		$extend({
			width: null,
			height: null,
			top: null,
			left: null,
			centered: true
		}, options);
				
		var oldWidth = windowEl.getStyle('width').toInt();
		var oldHeight = windowEl.getStyle('height').toInt();
		var oldTop = windowEl.getStyle('top').toInt();
		var oldLeft = windowEl.getStyle('left').toInt();
		
		if (options.centered){
			var top = options.top || oldTop - ((options.height - oldHeight) * .5);
			var left = options.left || oldLeft - ((options.width - oldWidth) * .5);
		}
		else {
			var top =  options.top || oldTop;
			var left = options.left || oldLeft;
		}				
		
		if (MochaUI.options.advancedEffects == false){
			windowEl.setStyles({
				'top': top,
				'left': left
			});
			instance.contentWrapperEl.setStyles({
				'height': options.height,
				'width':  options.width
			});
			instance.drawWindow();
			// Show iframe
			if (instance.iframeEl){
				if (!Browser.Engine.trident) {
					instance.iframeEl.setStyle('visibility', 'visible');
				}
				else {
					instance.iframeEl.show();
				}
			}
		}
		else {
			windowEl.retrieve('resizeMorph').start({
				'0': {	'height': options.height,
						'width':  options.width
				},
				'1': {	'top': top,
						'left': left 
				}
			});		
		}
		return instance;
	},
	/*

	Internal Function: dynamicResize
		Use with a timer to resize a window as the window's content size changes, such as with an accordian.

	*/
	dynamicResize: function(windowEl){
		var instance = windowEl.retrieve('instance');
		var contentWrapperEl = instance.contentWrapperEl;
		var contentEl = instance.contentEl;
		
		contentWrapperEl.setStyles({
			'height': contentEl.offsetHeight,
			'width': contentEl.offsetWidth
		});				
		instance.drawWindow();
	}	
});

// Toggle window visibility with Ctrl-Alt-Q
document.addEvent('keydown', function(event){
	if (event.key == 'q' && event.control && event.alt) {
		MochaUI.toggleWindowVisibility();
	}
});
/*

Script: Modal.js
	Create modal dialog windows.

Copyright:
	Copyright (c) 2007-2009 Greg Houston, <http://greghoustondesign.com/>.	

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
		
		window.addEvent('resize', function(){
			this.setModalSize();
		}.bind(this));

	},
	modalInitialize: function(){
		var modalOverlay = new Element('div', {
			'id': 'modalOverlay',
			'styles': {
				'height': document.getCoordinates().height,				
				'opacity': .6
			}
		}).inject(document.body);
		
		modalOverlay.setStyles({
				'position': Browser.Engine.trident4 ? 'absolute' : 'fixed'
		});
		
		modalOverlay.addEvent('click', function(e){
			var instance = MochaUI.Windows.instances.get(MochaUI.currentModal.id);
			if (instance.options.modalOverlayClose == true) {
				MochaUI.closeWindow(MochaUI.currentModal);
			}
		});
		
		if (Browser.Engine.trident4){
			var modalFix = new Element('iframe', {
				'id': 'modalFix',
				'scrolling': 'no',
				'marginWidth': 0,
				'marginHeight': 0,
				'src': '',
				'styles': {
					'height': document.getCoordinates().height
				}
			}).inject(document.body);
		}

		this.modalOverlayOpenMorph = new Fx.Morph($('modalOverlay'), {
			'duration': 150
		});
		this.modalOverlayCloseMorph = new Fx.Morph($('modalOverlay'), {
			'duration': 150,
			onComplete: function(){
				$('modalOverlay').hide();
				if (Browser.Engine.trident4){
					$('modalFix').hide();
				}
			}.bind(this)
		});
	},
	setModalSize: function(){
		$('modalOverlay').setStyle('height', document.getCoordinates().height);
		if (Browser.Engine.trident4){
			$('modalFix').setStyle('height', document.getCoordinates().height);
		}
	}
});
MochaUI.Modal.implement(new Options, new Events);
/*

Script: Windows-from-html.js
	Create windows from html markup in page.

Copyright:
	Copyright (c) 2007-2009 Greg Houston, <http://greghoustondesign.com/>.	

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
		$$('.mocha').each(function(el) {
			// Get the window title and destroy that element, so it does not end up in window content
			if ( Browser.Engine.presto || Browser.Engine.trident5 ){
				el.hide(); // Required by Opera, and probably IE7
			}
			var title = el.getElement('h3.mochaTitle');
			
			if(Browser.Engine.presto) el.show();
			
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

Copyright:
	Copyright (c) 2007-2009 Greg Houston, <http://greghoustondesign.com/>.	

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

Note: 
	Windows created from JSON are not compatible with the current cookie based version
	of Save and Load Workspace.  	

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

Script: Arrange-cascade.js
	Cascade windows.

Copyright:
	Copyright (c) 2007-2009 Greg Houston, <http://greghoustondesign.com/>.	

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
	viewportTopOffset:  30,    // Use a negative number if neccessary to place first window where you want it
	viewportLeftOffset: 20,
	windowTopOffset:    50,    // Initial vertical spacing of each window
	windowLeftOffset:   40     // Initial horizontal spacing of each window	
});

MochaUI.extend({   
	arrangeCascade: function(){
		// See how much space we have to work with
		var coordinates = document.getCoordinates();
		
		var openWindows = 0;
		MochaUI.Windows.instances.each(function(instance){
			if (!instance.isMinimized && instance.options.draggable) openWindows ++; 
		});
		
		if ((this.options.windowTopOffset * (openWindows + 1)) >= (coordinates.height - this.options.viewportTopOffset)) {
			var topOffset = (coordinates.height - this.options.viewportTopOffset) / (openWindows + 1);
		}
		else {
			var topOffset = this.options.windowTopOffset;
		}
		
		if ((this.options.windowLeftOffset * (openWindows + 1)) >= (coordinates.width - this.options.viewportLeftOffset - 20)) {
			var leftOffset = (coordinates.width - this.options.viewportLeftOffset - 20) / (openWindows + 1);
		}
		else {
			var leftOffset = this.options.windowLeftOffset;
		}

		var x = this.options.viewportLeftOffset;
		var y = this.options.viewportTopOffset;
		$$('.mocha').each(function(windowEl){
			var instance = windowEl.retrieve('instance');
			if (!instance.isMinimized && !instance.isMaximized && instance.options.draggable){
				id = windowEl.id;
				MochaUI.focusWindow(windowEl);
				x += leftOffset;
				y += topOffset;

				if (MochaUI.options.advancedEffects == false){
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

Script: Arrange-tile.js
	Cascade windows.
	
Copyright:
	Copyright (c) 2007-2009 Greg Houston, <http://greghoustondesign.com/>.	

Authors:
	Harry Roberts and Greg Houston

License:
	MIT-style license.	

Requires:
	Core.js, Window.js

Syntax:
	(start code)
	MochaUI.arrangeTile();
	(end)

*/
 
MochaUI.extend({
	arrangeTile: function(){
		var x = 10;
		var y = 80;
	
		var instances =  MochaUI.Windows.instances;

		var windowsNum = 0;

		instances.each(function(instance){
			if (!instance.isMinimized && !instance.isMaximized){
				windowsNum++;
			}
		});

		var cols = 3;
		var rows = Math.ceil(windowsNum / cols);
		
		var coordinates = document.getCoordinates();
	
		var col_width = ((coordinates.width - this.options.viewportLeftOffset) / cols);
		var col_height = ((coordinates.height - this.options.viewportTopOffset) / rows);
		
		var row = 0;
		var col = 0;
		
		instances.each(function(instance){
			if (!instance.isMinimized && !instance.isMaximized && instance.options.draggable ){
				
				var content = instance.contentWrapperEl;
				var content_coords = content.getCoordinates();
				var window_coords = instance.windowEl.getCoordinates();
				
				// Calculate the amount of padding around the content window
				var padding_top = content_coords.top - window_coords.top;
				var padding_bottom = window_coords.height - content_coords.height - padding_top;
				var padding_left = content_coords.left - window_coords.left;
				var padding_right = window_coords.width - content_coords.width - padding_left;

				/*

				// This resizes the windows
				if (instance.options.shape != 'gauge' && instance.options.resizable == true){
					var width = (col_width - 3 - padding_left - padding_right);
					var height = (col_height - 3 - padding_top - padding_bottom);

					if (width > instance.options.resizeLimit.x[0] && width < instance.options.resizeLimit.x[1]){
						content.setStyle('width', width);
					}
					if (height > instance.options.resizeLimit.y[0] && height < instance.options.resizeLimit.y[1]){
						content.setStyle('height', height);
					}

				}*/

				var left = (x + (col * col_width));
				var top = (y + (row * col_height));

				instance.drawWindow();
				
				MochaUI.focusWindow(instance.windowEl);
				
				if (MochaUI.options.advancedEffects == false){
					instance.windowEl.setStyles({
						'top': top,
						'left': left
					});
				}
				else {
					var tileMorph = new Fx.Morph(instance.windowEl, {
						'duration': 550
					});
					tileMorph.start({
						'top': top,
						'left': left
					});
				}				

				if (++col === cols) {
					row++;
					col = 0;
				}
			}
		}.bind(this));
	}
});
/*

Script: Tabs.js
	Functionality for window tabs.

Copyright:
	Copyright (c) 2007-2009 Greg Houston, <http://greghoustondesign.com/>.	

License:
	MIT-style license.

Requires:
	Core.js, Window.js (for tabbed windows) or Layout.js (for tabbed panels)

*/

MochaUI.extend({
	/*

	Function: initializeTabs
		Add click event to each list item that fires the selected function.

	*/
	initializeTabs: function(el){
		$(el).setStyle('list-style', 'none'); // This is to fix a glitch that occurs in IE8 RC1 when dynamically switching themes
		$(el).getElements('li').each(function(listitem){
			listitem.addEvent('click', function(e){
				MochaUI.selected(this, el);
			});
		});
	},
	/*

	Function: selected
		Add "selected" class to current list item and remove it from sibling list items.

	Syntax:
		(start code)
			selected(el, parent);
		(end)

Arguments:
	el - the list item
	parent - the ul

	*/
	selected: function(el, parent){
		$(parent).getChildren().each(function(listitem){
			listitem.removeClass('selected');
		});
		el.addClass('selected');
	}
});

/*

Script: Layout.js
	Create web application layouts. Enables window maximize.
	
Copyright:
	Copyright (c) 2007-2009 Greg Houston, <http://greghoustondesign.com/>.

License:
	MIT-style license.	

Requires:
	Core.js, Window.js
	
*/

MochaUI.extend({
	Columns: {
		instances: new Hash(),
		columnIDCount: 0 // Used for columns without an ID defined by the user
	},
	Panels: {
		instances: new Hash(),
		panelIDCount: 0 // Used for panels without an ID defined by the user
	}
});

MochaUI.Desktop = new Class({

	Extends: MochaUI.Window,

	Implements: [Events, Options],
	
	options: {
		// Naming options:
		// If you change the IDs of the Mocha Desktop containers in your HTML, you need to change them here as well.
		desktop:             'desktop',
		desktopHeader:       'desktopHeader',
		desktopFooter:       'desktopFooter',
		desktopNavBar:       'desktopNavbar',
		pageWrapper:         'pageWrapper',
		page:                'page',
		desktopFooter:       'desktopFooterWrapper'
	},	
	initialize: function(options){
		this.setOptions(options);
		this.desktop         = $(this.options.desktop);
		this.desktopHeader   = $(this.options.desktopHeader);
		this.desktopNavBar   = $(this.options.desktopNavBar);
		this.pageWrapper     = $(this.options.pageWrapper);
		this.page            = $(this.options.page);
		this.desktopFooter   = $(this.options.desktopFooter);
		
		if (this.desktop) {
			($$('body')).setStyles({
				overflow: 'hidden',
				height: '100%',
				margin: 0
			});
			($$('html')).setStyles({
				overflow: 'hidden',
				height: '100%'
			});			
		}		
	
		// This is run on dock initialize so no need to do it twice.
		if (!MochaUI.Dock){
			this.setDesktopSize();
		}
		this.menuInitialize();		

		// Resize desktop, page wrapper, modal overlay, and maximized windows when browser window is resized
		window.addEvent('resize', function(e){
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
				if (instance.isMaximized){

					// Hide iframe while resize for better performance
					if ( instance.iframeEl ){
						instance.iframeEl.setStyle('visibility', 'hidden');
					}

					var coordinates = document.getCoordinates();
					var borderHeight = instance.contentBorderEl.getStyle('border-top').toInt() + instance.contentBorderEl.getStyle('border-bottom').toInt();
					var toolbarHeight = instance.toolbarWrapperEl ? instance.toolbarWrapperEl.getStyle('height').toInt() + instance.toolbarWrapperEl.getStyle('border-top').toInt() : 0;
					instance.contentWrapperEl.setStyles({
						'height': coordinates.height - instance.options.headerHeight - instance.options.footerHeight - borderHeight - toolbarHeight,
						'width': coordinates.width
					});

					instance.drawWindow();
					if ( instance.iframeEl ){
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

			if (pageWrapperHeight < 0){
				pageWrapperHeight = 0;
			}
			this.pageWrapper.setStyle('height', pageWrapperHeight);
		}

		if (MochaUI.Columns.instances.getKeys().length > 0){ // Conditional is a fix for a bug in IE6 in the no toolbars demo.
			MochaUI.Desktop.resizePanels();
		}		
	},
	resizePanels: function(){
		MochaUI.panelHeight();
		MochaUI.rWidth();	
	},	
	/*
	
	Function: maximizeWindow
		Maximize a window.
	
	Syntax:
		(start code)
		MochaUI.Desktop.maximizeWindow(windowEl);
		(end)	

	*/	
	maximizeWindow: function(windowEl){

		var instance = MochaUI.Windows.instances.get(windowEl.id);
		var options = instance.options;
		var windowDrag = instance.windowDrag;

		// If window no longer exists or is maximized, stop
		if (windowEl != $(windowEl) || instance.isMaximized ) return;
		
		if (instance.isCollapsed){
			MochaUI.collapseToggle(windowEl);	
		}

		instance.isMaximized = true;
		
		// If window is restricted to a container, it should not be draggable when maximized.
		if (instance.options.restrict){
			windowDrag.detach();
			if (options.resizable) {
				instance.detachResizable();
			}
			instance.titleBarEl.setStyle('cursor', 'default');
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
		instance.oldTop = windowEl.getStyle('top');
		instance.oldLeft = windowEl.getStyle('left');

		var contentWrapperEl = instance.contentWrapperEl;

		// Save original dimensions
		contentWrapperEl.oldWidth = contentWrapperEl.getStyle('width');
		contentWrapperEl.oldHeight = contentWrapperEl.getStyle('height');

		// Hide iframe
		// Iframe should be hidden when minimizing, maximizing, and moving for performance and Flash issues
		if ( instance.iframeEl ) {
			if (!Browser.Engine.trident) {
				instance.iframeEl.setStyle('visibility', 'hidden');
			}
			else {
				instance.iframeEl.hide();
			}
		}
		
		var windowDimensions = document.getCoordinates();
		var options = instance.options;
		var shadowBlur = options.shadowBlur;
		var shadowOffset = options.shadowOffset;
		var newHeight = windowDimensions.height - options.headerHeight - options.footerHeight;
		newHeight -= instance.contentBorderEl.getStyle('border-top').toInt();
		newHeight -= instance.contentBorderEl.getStyle('border-bottom').toInt();
		newHeight -= (instance.toolbarWrapperEl ? instance.toolbarWrapperEl.getStyle('height').toInt() + instance.toolbarWrapperEl.getStyle('border-top').toInt() : 0);
		
		MochaUI.resizeWindow(windowEl, {
			width: windowDimensions.width,
			height: newHeight,
			top: shadowOffset.y - shadowBlur,
			left: shadowOffset.x - shadowBlur
		});
		instance.fireEvent('onMaximize', windowEl);
		
		if (instance.maximizeButtonEl) {
			instance.maximizeButtonEl.setProperty('title', 'Restore');
		}
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
	restoreWindow: function(windowEl){	
	
		var instance = windowEl.retrieve('instance');
		
		// Window exists and is maximized ?
		if (windowEl != $(windowEl) || !instance.isMaximized) return;
			
		var options = instance.options;
		instance.isMaximized = false;
		
		if (options.restrict){
			instance.windowDrag.attach();
			if (options.resizable){
				instance.reattachResizable();
			}			
			instance.titleBarEl.setStyle('cursor', 'move');
		}		
		
		// Hide iframe
		// Iframe should be hidden when minimizing, maximizing, and moving for performance and Flash issues
		if ( instance.iframeEl ) {
			if (!Browser.Engine.trident) {
				instance.iframeEl.setStyle('visibility', 'hidden');
			}
			else {
				instance.iframeEl.hide();
			}
		}
		
		var contentWrapperEl = instance.contentWrapperEl;	
		
		MochaUI.resizeWindow(windowEl,{
			width: contentWrapperEl.oldWidth,
			height: contentWrapperEl.oldHeight,
			top: instance.oldTop,
			left: instance.oldLeft
		});
		instance.fireEvent('onRestore', windowEl);
				
		if (instance.maximizeButtonEl){		
			instance.maximizeButtonEl.setProperty('title', 'Maximize');
		}
	}
});
MochaUI.Desktop.implement(new Options, new Events);

/*

Class: Column
	Create a column. Columns should be created from left to right.

Syntax:
(start code)
	MochaUI.Column();
(end)

Arguments:
	options

Options:
	id - The ID of the column. This must be set when creating the column.
	container - Defaults to MochaUI.Desktop.pageWrapper. 	
	placement - Can be 'right', 'main', or 'left'. There must be at least one column with the 'main' option.
	width - 'main' column is fluid and should not be given a width.
	resizeLimit - resizelimit of a 'right' or 'left' column.
	onResize - (function) Fired when the column is resized.
	onCollapse - (function) Fired when the column is collapsed.
	onExpand - (function) Fired when the column is expanded.
		
*/
MochaUI.Column = new Class({

	Extends: MochaUI.Desktop,

	Implements: [Events, Options],

	options: {
		id:            null,
		container:     null,
		placement:     null, 
		width:         null,
		resizeLimit:   [],

		// Events
		onResize:     $empty, 
		onCollapse:   $empty,
		onExpand:     $empty

	},
	initialize: function(options){
		this.setOptions(options);
		
		$extend(this, {
			timestamp: $time(),
			isCollapsed: false,
			oldWidth: 0
		});
		
		// If column has no ID, give it one.
		if (this.options.id == null){
			this.options.id = 'column' + (++MochaUI.Columns.columnIDCount);
		}		

		// Shorten object chain
		var options = this.options;
		var instances = MochaUI.Columns.instances;
		var instanceID = instances.get(options.id);

		if (options.container == null) {
			options.container = MochaUI.Desktop.pageWrapper
		}
		else {
			$(options.container).setStyle('overflow', 'hidden');
		}

		// Check to see if there is already a class instance for this Column
		if (instanceID){
			var instance = instanceID;
		}

		// Check if column already exists
		if ( this.columnEl ){
			return;
		}
		else {			
			instances.set(options.id, this);
		}		
		
		// If loading columns into a panel, hide the regular content container.
		if ($(options.container).getElement('.pad') != null) {
			$(options.container).getElement('.pad').hide();
		}
		
		// If loading columns into a window, hide the regular content container.
		if ($(options.container).getElement('.mochaContent') != null) {
			$(options.container).getElement('.mochaContent').hide();
		}
		
		this.columnEl = new Element('div', {
			'id': this.options.id,
			'class': 'column expanded',
			'styles': {
				'width': options.placement == 'main' ? null : options.width
			}
		}).inject($(options.container));
		
		this.columnEl.store('instance', this);
		
		var parent = this.columnEl.getParent();
		var columnHeight = parent.getStyle('height').toInt();
		this.columnEl.setStyle('height', columnHeight);
		
		if (options.placement == 'main'){
			this.columnEl.addClass('rWidth');
		}
		
		this.spacerEl = new Element('div', {
			'id': this.options.id + '_spacer',
			'class': 'horizontalHandle'
		}).inject(this.columnEl);

		switch (this.options.placement) {
			case 'left':
				this.handleEl = new Element('div', {
					'id': this.options.id + '_handle',
					'class': 'columnHandle'
				}).inject(this.columnEl, 'after');

				this.handleIconEl = new Element('div', {
					'id': options.id + '_handle_icon',
					'class': 'handleIcon'
				}).inject(this.handleEl);

				addResizeRight(this.columnEl, options.resizeLimit[0], options.resizeLimit[1]);
				break;
			case 'right':
				this.handleEl = new Element('div', {
					'id': this.options.id + '_handle',
					'class': 'columnHandle'
				}).inject(this.columnEl, 'before');

				this.handleIconEl = new Element('div', {
					'id': options.id + '_handle_icon',
					'class': 'handleIcon'
				}).inject(this.handleEl);
				addResizeLeft(this.columnEl, options.resizeLimit[0], options.resizeLimit[1]);
				break;
		}

		if (this.handleEl != null){
			this.handleEl.addEvent('dblclick', function(){
				this.columnToggle();
			}.bind(this));
		}

		MochaUI.rWidth();

	},
	columnToggle: function(){
		var column = this.columnEl;
		
		// Collapse
		if (this.isCollapsed == false){
			this.oldWidth = column.getStyle('width').toInt();

			this.resize.detach();
			this.handleEl.removeEvents('dblclick');
			this.handleEl.addEvent('click', function(){
				this.columnToggle();
			}.bind(this));
			this.handleEl.setStyle('cursor', 'pointer').addClass('detached');
			
			column.setStyle('width', 0);
			this.isCollapsed = true;
			column.addClass('collapsed');
			column.removeClass('expanded');
			MochaUI.rWidth();		
			this.fireEvent('onCollapse');
		}
		// Expand
		else {
			column.setStyle('width', this.oldWidth);
			this.isCollapsed = false;
			column.addClass('expanded');
			column.removeClass('collapsed');

			this.handleEl.removeEvents('click');
			this.handleEl.addEvent('dblclick', function(){
				this.columnToggle();
			}.bind(this));
			this.resize.attach();
			this.handleEl.setStyle('cursor', Browser.Engine.webkit ? 'col-resize' : 'e-resize').addClass('attached');

			MochaUI.rWidth();
			this.fireEvent('onExpand');
		}
	}
});
MochaUI.Column.implement(new Options, new Events);

/*

Class: Panel
	Create a panel. Panels go one on top of another in columns. Create your columns first and then add your panels. Panels should be created from top to bottom, left to right.

Syntax:
(start code)
	MochaUI.Panel();
(end)

Arguments:
	options

Options:
	id - The ID of the panel. This must be set when creating the panel.
	column - Where to inject the panel. This must be set when creating the panel.
	loadMethod - ('html', 'xhr', or 'iframe')
	contentURL - Used if loadMethod is set to 'xhr' or 'iframe'.
	method - ('get', or 'post') The method used to get the data. Defaults to 'get'.
	data - (hash) Data to send with the URL. Defaults to null.
	evalScripts - (boolean) An xhr loadMethod option. Defaults to true.
	evalResponse - (boolean) An xhr loadMethod option. Defaults to false.
	content - (string or element) An html loadMethod option.
	tabsURL - (url)	
	tabsData - (hash) Data to send with the URL. Defaults to null.
	tabsOnload - (function)
	header - (boolean) Display the panel header or not
	headerToolbox: (boolean)
	headerToolboxURL: (url)
	headerToolboxOnload: (function)	
	footer - (boolean) Add a panel footer or not
	footerURL - (url)
	footerData - (hash) Data to send with the URL. Defaults to null.
	footerOnload - (function)
	height - (number) Height of content area.
	addClass - (string) Add a class to the panel.
	scrollbars - (boolean)
	padding - (object)
	collapsible - (boolean)
	onBeforeBuild - (function) Fired before the panel is created.
	onContentLoaded - (function) Fired after the panel's conten is loaded.
	onResize - (function) Fired when the panel is resized.
	onCollapse - (function) Fired when the panel is collapsed.
	onExpand - (function) Fired when the panel is expanded.
		
*/
MochaUI.Panel = new Class({
							
	Extends: MochaUI.Desktop,
	
	Implements: [Events, Options],
	
	options: {
		id:                 null,
		title:              'New Panel',
		column:             null,
		loadMethod:         'html',
		contentURL:         'pages/lipsum.html',
	
		// xhr options
		method:             'get',
		data:               null,
		evalScripts:        true,
		evalResponse:       false,
	
		// html options
		content:            'Panel content',
		
		// Tabs
		tabsURL:            null,
		tabsData:           null,
		tabsOnload:         $empty,

		header:             true,		
		headerToolbox:      false,
		headerToolboxURL:   'pages/lipsum.html',
		headerToolboxOnload: $empty,		

		footer:             false,
		footerURL:          'pages/lipsum.html',
		footerData:         null,
		footerOnload:       $empty,
		
		// Style options:
		height:             125,
		addClass:           '',
		scrollbars:         true,
		padding:   		    { top: 8, right: 8, bottom: 8, left: 8 },
		
		// Other:
		collapsible:	    true,

		// Events
		onBeforeBuild:       $empty,
		onContentLoaded:     $empty,
		onResize:            $empty,
		onCollapse:          $empty,
		onExpand:            $empty

	},	
	initialize: function(options){
		this.setOptions(options);

		$extend(this, {
			timestamp: $time(),
			isCollapsed: false, // This is probably redundant since we can check for the class
			oldHeight: 0,
			partner: null
		});

		// If panel has no ID, give it one.
		if (this.options.id == null){
			this.options.id = 'panel' + (++MochaUI.Panels.panelIDCount);
		}

		// Shorten object chain
		var instances = MochaUI.Panels.instances;
		var instanceID = instances.get(this.options.id);
		var options = this.options;
	
		// Check to see if there is already a class instance for this panel
		if (instanceID){
			var instance = instanceID;
		}

		// Check if panel already exists
		if ( this.panelEl ){
			return;
		}
		else {			
			instances.set(this.options.id, this);
		}

		this.fireEvent('onBeforeBuild');		
		
		if (options.loadMethod == 'iframe') {
			// Iframes have their own padding.
			options.padding = { top: 0, right: 0, bottom: 0, left: 0 };
		}

		this.showHandle = true;
		if ($(options.column).getChildren().length == 0) {
			this.showHandle = false;
		}
		
		this.panelEl = new Element('div', {
			'id': this.options.id,
			'class': 'panel expanded',
			'styles': {
				'height': options.height
			}
		}).inject($(options.column));
		
		this.panelEl.store('instance', this);
		
		this.panelEl.addClass(options.addClass);
		
		this.contentEl = new Element('div', {
			'id': options.id + '_pad',
			'class': 'pad'
		}).inject(this.panelEl);
		
		if (options.footer) {
			this.footerWrapperEl = new Element('div', {
				'id': options.id + '_panelFooterWrapper',
				'class': 'panel-footerWrapper'
			}).inject(this.panelEl);
			
			this.footerEl = new Element('div', {
				'id': options.id + '_panelFooter',
				'class': 'panel-footer'
			}).inject(this.footerWrapperEl);
			
			MochaUI.updateContent({
				'element': this.panelEl,
				'childElement': this.footerEl,
				'loadMethod': 'xhr',
				'data': options.footerData,
				'url': options.footerURL,
				'onContentLoaded': options.footerOnload
			});
			
		}

		// This is in order to use the same variable as the windows do in updateContent.
		// May rethink this.
		this.contentWrapperEl = this.panelEl;
		
		this.contentEl.setStyles({
			'padding-top': options.padding.top,
			'padding-bottom': options.padding.bottom,
			'padding-left': options.padding.left,
			'padding-right': options.padding.right
		});
		
		this.panelHeaderEl = new Element('div', {
			'id': this.options.id + '_header',
			'class': 'panel-header',
			'styles': {
				'display': options.header ? 'block' : 'none'
			}
		}).inject(this.panelEl, 'before');
		
		if (this.options.collapsible) {
			this.collapseToggleInit();
		}
		
		if (this.options.headerToolbox) {
			this.panelHeaderToolboxEl = new Element('div', {
				'id': options.id + '_headerToolbox',
				'class': 'panel-header-toolbox'
			}).inject(this.panelHeaderEl);
			
			MochaUI.updateContent({
				'element': this.panelEl,
				'childElement': this.panelHeaderToolboxEl,
				'loadMethod': 'xhr',
				'url': options.headerToolboxURL,
				'onContentLoaded': options.headerToolboxOnload
			});
		}
		this.panelHeaderContentEl = new Element('div', {
			'id': options.id + '_headerContent',
			'class': 'panel-headerContent'
		}).inject(this.panelHeaderEl);
		
		this.titleEl = new Element('h2', {
			'id': options.id + '_title'
		}).inject(this.panelHeaderContentEl);
		
		if (options.tabsURL == null) {
			this.titleEl.set('html', options.title);
		} else {
			this.panelHeaderContentEl.addClass('tabs');
			MochaUI.updateContent({
				'element': this.panelEl,
				'childElement': this.panelHeaderContentEl,
				'loadMethod': 'xhr',
				'url': options.tabsURL,
				'data': options.tabsData,
				'onContentLoaded': options.tabsOnload
			});
		}

		this.handleEl = new Element('div', {
			'id': options.id + '_handle',
			'class': 'horizontalHandle',
			'styles': {
				'display': this.showHandle == true ? 'block' : 'none'
			}
		}).inject(this.panelEl, 'after');
		
		this.handleIconEl = new Element('div', {
			'id': options.id + '_handle_icon',
			'class': 'handleIcon'
		}).inject(this.handleEl);
		
		addResizeBottom(options.id);
		
		// Add content to panel.
		MochaUI.updateContent({
			'element': this.panelEl,
			'content': options.content,
			'method': options.method,
			'data': options.data,
			'url': options.contentURL,
			'onContentLoaded': null
		});
		
		// Do this when creating and removing panels
		$(options.column).getChildren('.panel').each( function(panel){
			panel.removeClass('bottomPanel');
		});
		$(options.column).getChildren('.panel').getLast().addClass('bottomPanel');
		
		MochaUI.panelHeight(options.column, this.panelEl, 'new');

	},
	collapseToggleInit: function(options){

		var options = this.options;

		this.panelHeaderCollapseBoxEl = new Element('div', {
			'id': options.id + '_headerCollapseBox',
			'class': 'toolbox'
		}).inject(this.panelHeaderEl);

		if (options.headerToolbox) {
			this.panelHeaderCollapseBoxEl.addClass('divider');
		}

		this.collapseToggleEl = new Element('div', {
			'id': options.id + '_collapseToggle',
			'class': 'panel-collapse icon16',
			'styles': {
				'width': 16,
				'height': 16
			},
			'title': 'Collapse Panel'
		}).inject(this.panelHeaderCollapseBoxEl);

		this.collapseToggleEl.addEvent('click', function(event){
			var panel = this.panelEl;
			
			// Get siblings and make sure they are not all collapsed.
			var instances = MochaUI.Panels.instances;
			var expandedSiblings = [];
			panel.getAllPrevious('.panel').each(function(sibling){
				var instance = instances.get(sibling.id);
				if (instance.isCollapsed == false){
					expandedSiblings.push(sibling);
				}
			});
			panel.getAllNext('.panel').each(function(sibling){
				var instance = instances.get(sibling.id);
				if (instance.isCollapsed == false){
					expandedSiblings.push(sibling);
				}
			});

			if (this.isCollapsed == false) {
				var currentColumn = MochaUI.Columns.instances.get($(options.column).id);

				if (expandedSiblings.length == 0 && currentColumn.options.placement != 'main'){
					var currentColumn = MochaUI.Columns.instances.get($(options.column).id);
					currentColumn.columnToggle();
					return;
				}
				else if (expandedSiblings.length == 0 && currentColumn.options.placement == 'main'){
					return;
				}
				this.oldHeight = panel.getStyle('height').toInt();
				if (this.oldHeight < 10) this.oldHeight = 20;
				this.contentEl.setStyle('position', 'absolute'); // This is so IE6 and IE7 will collapse the panel all the way		
				panel.setStyle('height', 0);								
				this.isCollapsed = true;
				panel.addClass('collapsed');				
				panel.removeClass('expanded');
				MochaUI.panelHeight(options.column, panel, 'collapsing');
				MochaUI.panelHeight(); // Run this a second time for panels within panels
				this.collapseToggleEl.removeClass('panel-collapsed');
				this.collapseToggleEl.addClass('panel-expand');
				this.collapseToggleEl.setProperty('title','Expand Panel');
				this.fireEvent('onCollapse');				
			}
			else {
				this.contentEl.setStyle('position', null); // This is so IE6 and IE7 will collapse the panel all the way				
				panel.setStyle('height', this.oldHeight);
				this.isCollapsed = false;
				panel.addClass('expanded');
				panel.removeClass('collapsed');				
				MochaUI.panelHeight(this.options.column, panel, 'expanding');
				MochaUI.panelHeight(); // Run this a second time for panels within panels
				this.collapseToggleEl.removeClass('panel-expand');
				this.collapseToggleEl.addClass('panel-collapsed');
				this.collapseToggleEl.setProperty('title','Collapse Panel');
				this.fireEvent('onExpand');
			}
		}.bind(this));	
	}	
});
MochaUI.Panel.implement(new Options, new Events);


MochaUI.extend({
	// Panel Height	
	panelHeight: function(column, changing, action){
		if (column != null) {
			MochaUI.panelHeight2($(column), changing, action);
		}
		else {
			$$('.column').each(function(column){
				MochaUI.panelHeight2(column);
			}.bind(this));
		}
	},
	/*

	actions can be new, collapsing or expanding.

	*/
	panelHeight2: function(column, changing, action){

		var instances = MochaUI.Panels.instances;
		
		var parent = column.getParent();
		var columnHeight = parent.getStyle('height').toInt();
		if (Browser.Engine.trident4 && parent == MochaUI.Desktop.pageWrapper) {
			columnHeight -= 1;
		}
		column.setStyle('height', columnHeight);
		
		var panels = column.getChildren('.panel'); // All the panels in the column.
		var panelsExpanded = column.getChildren('.expanded'); // All the expanded panels in the column.
		var panelsToResize = []; // All the panels in the column whose height will be effected.
		var tallestPanel; // The panel with the greatest height
		var tallestPanelHeight = 0;
		
		this.panelsHeight = 0; // Height of all the panels in the column	
		this.height = 0; // Height of all the elements in the column	
		// Set panel resize partners
		panels.each(function(panel){
			instance = instances.get(panel.id);
			if (panel.hasClass('expanded') && panel.getNext('.expanded')) {
				instance.partner = panel.getNext('.expanded');
				instance.resize.attach();
				instance.handleEl.setStyles({
					'display': 'block',
					'cursor': Browser.Engine.webkit ? 'row-resize' : 'n-resize'
				}).removeClass('detached');
			} else {
				instance.resize.detach();
				instance.handleEl.setStyle('cursor', null).addClass('detached');
			}
			if (panel.getNext('.panel') == null) {
				instance.handleEl.hide();
			}
		}.bind(this));
			
		// Get the total height of all the column's children
		column.getChildren().each(function(el){

		if (el.hasClass('panel')){
			var instance = instances.get(el.id);

			// Are any next siblings Expanded?
			areAnyNextSiblingsExpanded = function(el){
				var test;
					el.getAllNext('.panel').each(function(sibling){
						var siblingInstance = instances.get(sibling.id);
						if (siblingInstance.isCollapsed == false){
							test = true;
						}
					}.bind(this));
					return test;
				}.bind(this);

				// If a next sibling is expanding, are any of the nexts siblings of the expanding sibling Expanded?
				areAnyExpandingNextSiblingsExpanded = function(){
					var test;
					changing.getAllNext('.panel').each(function(sibling){
						var siblingInstance = instances.get(sibling.id);
						if (siblingInstance.isCollapsed == false){
							test = true;
						}
					}.bind(this));
					return test;
				}.bind(this);
					
				// Resize panels that are not collapsed or "new"
				if (action == 'new' ) {
					if (instance.isCollapsed != true && el != changing) {
						panelsToResize.push(el);
					}
					
					// Height of panels that can be resized
					if (instance.isCollapsed != true && el != changing) {
						this.panelsHeight += el.offsetHeight.toInt();
					}
				}
				// Resize panels that are not collapsed. If a panel is collapsing
				// resize any expanded panels below. If there are no expanded panels
				// below it, resize the expanded panels above it.
				else if (action == null || action == 'collapsing' ){
					if (instance.isCollapsed != true && (el.getAllNext('.panel').contains(changing) != true || areAnyNextSiblingsExpanded(el) != true)){
						panelsToResize.push(el);
					}
					
					// Height of panels that can be resized
					if (instance.isCollapsed != true && (el.getAllNext('.panel').contains(changing) != true || areAnyNextSiblingsExpanded(el) != true)){
						this.panelsHeight += el.offsetHeight.toInt();
					}
				}
				// Resize panels that are not collapsed and are not expanding.
				// Resize any expanded panels below the expanding panel. If there are no expanded panels
				// below it, resize the first expanded panel above it.
				else if (action == 'expanding'){
					   
					if (instance.isCollapsed != true && (el.getAllNext('.panel').contains(changing) != true || (areAnyExpandingNextSiblingsExpanded() != true && el.getNext('.expanded') == changing)) && el != changing){
						panelsToResize.push(el);
					}
					// Height of panels that can be resized
					if (instance.isCollapsed != true && (el.getAllNext('.panel').contains(changing) != true || (areAnyExpandingNextSiblingsExpanded() != true && el.getNext('.expanded') == changing)) && el != changing){
						this.panelsHeight += el.offsetHeight.toInt();
					}
				}

				if (el.style.height){
					this.height += el.getStyle('height').toInt();
				}
			}
			else {
				this.height += el.offsetHeight.toInt();
			}
		}.bind(this));

		// Get the remaining height
		var remainingHeight = column.offsetHeight.toInt() - this.height;
		
		this.height = 0;

		// Get height of all the column's children
		column.getChildren().each(function(el){
			this.height += el.offsetHeight.toInt();
		}.bind(this));
				
		var remainingHeight = column.offsetHeight.toInt() - this.height;

		panelsToResize.each(function(panel){
			var ratio = this.panelsHeight / panel.offsetHeight.toInt();
			var newPanelHeight = panel.getStyle('height').toInt() + (remainingHeight / ratio);
			if (newPanelHeight < 1){
				newPanelHeight = 0;
			}
			panel.setStyle('height', newPanelHeight);
		}.bind(this));	

		// Make sure the remaining height is 0. If not add/subtract the
		// remaining height to the tallest panel. This makes up for browser resizing,
		// off ratios, and users trying to give panels too much height.
			
		// Get height of all the column's children
		this.height = 0;
		column.getChildren().each(function(el){
			this.height += el.offsetHeight.toInt();
			if (el.hasClass('panel') && el.getStyle('height').toInt() > tallestPanelHeight){
				tallestPanel = el;
				tallestPanelHeight = el.getStyle('height').toInt();
			}
		}.bind(this));

		var remainingHeight = column.offsetHeight.toInt() - this.height;

		if ((remainingHeight > 0 || remainingHeight < 0) && tallestPanelHeight > 0){
			tallestPanel.setStyle('height', tallestPanel.getStyle('height').toInt() + remainingHeight );
			if (tallestPanel.getStyle('height') < 1){
				tallestPanel.setStyle('height', 0 );
			}
		}

		parent.getChildren('.columnHandle').each(function(handle){
			var parent = handle.getParent();
			if (parent.getStyle('height').toInt() < 1) return; // Keeps IE7 and 8 from throwing an error when collapsing a panel within a panel
			var handleHeight = parent.getStyle('height').toInt() - handle.getStyle('border-top').toInt() - handle.getStyle('border-bottom').toInt();
			if (Browser.Engine.trident4 && parent == MochaUI.Desktop.pageWrapper){
				handleHeight -= 1;
			}
			handle.setStyle('height', handleHeight);
		});
			
		panelsExpanded.each(function(panel){
			MochaUI.resizeChildren(panel);
		}.bind(this));			
			
	},
	// May rename this resizeIframeEl()
	resizeChildren: function(panel){
		var instances = MochaUI.Panels.instances;
		var instance = instances.get(panel.id);
		var contentWrapperEl = instance.contentWrapperEl;

		if (instance.iframeEl) {
			if (!Browser.Engine.trident) {
				instance.iframeEl.setStyles({
					'height': contentWrapperEl.getStyle('height'),
					'width': contentWrapperEl.offsetWidth - contentWrapperEl.getStyle('border-left').toInt() - contentWrapperEl.getStyle('border-right').toInt()
				});
			}
			else {
				// The following hack is to get IE8 RC1 IE8 Standards Mode to properly resize an iframe
				// when only the vertical dimension is changed.
				instance.iframeEl.setStyles({
					'height': contentWrapperEl.getStyle('height'),
					'width': contentWrapperEl.offsetWidth - contentWrapperEl.getStyle('border-left').toInt() - contentWrapperEl.getStyle('border-right').toInt() - 1
				});
				instance.iframeEl.setStyles({
					'width': contentWrapperEl.offsetWidth - contentWrapperEl.getStyle('border-left').toInt() - contentWrapperEl.getStyle('border-right').toInt()
				});			
			}			
		}				
		
	},
	// Remaining Width
	rWidth: function(container){
		if (container == null) {
			var container = MochaUI.Desktop.desktop;
		}
		container.getElements('.rWidth').each(function(column){
			var currentWidth = column.offsetWidth.toInt();
			currentWidth -= column.getStyle('border-left').toInt();
			currentWidth -= column.getStyle('border-right').toInt();
			
			var parent = column.getParent();
			this.width = 0;
			
			// Get the total width of all the parent element's children
			parent.getChildren().each(function(el){
				if (el.hasClass('mocha') != true) {
					this.width += el.offsetWidth.toInt();
				}
			}.bind(this));
			
			// Add the remaining width to the current element
			var remainingWidth = parent.offsetWidth.toInt() - this.width;
			var newWidth = currentWidth + remainingWidth;
			if (newWidth < 1) newWidth = 0;
			column.setStyle('width', newWidth);
			column.getChildren('.panel').each(function(panel){
				panel.setStyle('width', newWidth - panel.getStyle('border-left').toInt() - panel.getStyle('border-right').toInt());
				MochaUI.resizeChildren(panel);
			}.bind(this));
			
		});
	}

});

function addResizeRight(element, min, max){
	if (!$(element)) return;
	element = $(element);
	
	var instances = MochaUI.Columns.instances;
	var instance = instances.get(element.id);
	
	var handle = element.getNext('.columnHandle');
	handle.setStyle('cursor', Browser.Engine.webkit ? 'col-resize' : 'e-resize');
	if (!min) min = 50;
	if (!max) max = 250;
	if (Browser.Engine.trident) {
		handle.addEvents({
			'mousedown': function(){
				handle.setCapture();
			},
			'mouseup': function(){
				handle.releaseCapture();
			}
		});
	}
	instance.resize = element.makeResizable({
		handle: handle,
		modifiers: {
			x: 'width',
			y: false
		},
		limit: {
			x: [min, max]
		},
		onStart: function(){
			element.getElements('iframe').setStyle('visibility', 'hidden');
			element.getNext('.column').getElements('iframe').setStyle('visibility', 'hidden');
		}.bind(this),
		onDrag: function(){
			if (Browser.Engine.gecko) {
				$$('.panel').each(function(panel){
					if (panel.getElements('.mochaIframe').length == 0) {
						panel.hide(); // Fix for a rendering bug in FF
					}
				});
			}
			MochaUI.rWidth(element.getParent());
			if (Browser.Engine.gecko) {
				$$('.panel').show(); // Fix for a rendering bug in FF			
			}
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
			MochaUI.rWidth(element.getParent());
			element.getElements('iframe').setStyle('visibility', 'visible');
			element.getNext('.column').getElements('iframe').setStyle('visibility', 'visible');
			instance.fireEvent('onResize');
		}.bind(this)
	});
}

function addResizeLeft(element, min, max){
	if (!$(element)) return;
	element = $(element);

	var instances = MochaUI.Columns.instances;
	var instance = instances.get(element.id);

	var handle = element.getPrevious('.columnHandle');
	handle.setStyle('cursor', Browser.Engine.webkit ? 'col-resize' : 'e-resize');
	var partner = element.getPrevious('.column');
	if (!min) min = 50;
	if (!max) max = 250;
	if (Browser.Engine.trident){	
		handle.addEvents({
			'mousedown': function(){
				handle.setCapture();
			},	
			'mouseup': function(){
				handle.releaseCapture();
			}
		});
	}
	instance.resize = element.makeResizable({
		handle: handle,
		modifiers: {x: 'width' , y: false},
		invert: true,
		limit: { x: [min, max] },
		onStart: function(){
			$(element).getElements('iframe').setStyle('visibility','hidden');
			partner.getElements('iframe').setStyle('visibility','hidden');
		}.bind(this),
		onDrag: function(){
			MochaUI.rWidth(element.getParent());
		}.bind(this),
		onComplete: function(){
			MochaUI.rWidth(element.getParent());
			$(element).getElements('iframe').setStyle('visibility','visible');
			partner.getElements('iframe').setStyle('visibility','visible');
			instance.fireEvent('onResize');			
		}.bind(this)
	});
}

function addResizeBottom(element){
	if (!$(element)) return;
	var element = $(element);
	
	var instances = MochaUI.Panels.instances;
	var instance = instances.get(element.id);
	var handle = instance.handleEl;
	handle.setStyle('cursor', Browser.Engine.webkit ? 'row-resize' : 'n-resize');
	partner = instance.partner;
	min = 0;
	max = function(){
		return element.getStyle('height').toInt() + partner.getStyle('height').toInt();
	}.bind(this);
	
	if (Browser.Engine.trident) {
		handle.addEvents({
			'mousedown': function(){
				handle.setCapture();
			},
			'mouseup': function(){
				handle.releaseCapture();
			}
		});
	}
	instance.resize = element.makeResizable({
		handle: handle,
		modifiers: {x: false, y: 'height'},
		limit: { y: [min, max] },
		invert: false,
		onBeforeStart: function(){
			partner = instance.partner;
			this.originalHeight = element.getStyle('height').toInt();
			this.partnerOriginalHeight = partner.getStyle('height').toInt();
		}.bind(this),
		onStart: function(){
			if (instance.iframeEl) {
				if (!Browser.Engine.trident) {
					instance.iframeEl.setStyle('visibility', 'hidden');
					partner.getElements('iframe').setStyle('visibility','hidden');
				}
				else {
					instance.iframeEl.hide();
					partner.getElements('iframe').hide();
				}
			}
			
		}.bind(this),
		onDrag: function(){
			partnerHeight = partnerOriginalHeight;
			partnerHeight += (this.originalHeight - element.getStyle('height').toInt());
			partner.setStyle('height', partnerHeight);
			MochaUI.resizeChildren(element, element.getStyle('height').toInt());
			MochaUI.resizeChildren(partner, partnerHeight);
			element.getChildren('.column').each( function(column){
				MochaUI.panelHeight(column);
			});
			partner.getChildren('.column').each( function(column){
				MochaUI.panelHeight(column);
			});						
		}.bind(this),
		onComplete: function(){
			partnerHeight = partnerOriginalHeight;
			partnerHeight += (this.originalHeight - element.getStyle('height').toInt());
			partner.setStyle('height', partnerHeight);
			MochaUI.resizeChildren(element, element.getStyle('height').toInt());
			MochaUI.resizeChildren(partner, partnerHeight);
			element.getChildren('.column').each( function(column){
				MochaUI.panelHeight(column);
			});
			partner.getChildren('.column').each( function(column){
				MochaUI.panelHeight(column);
			});			
			if (instance.iframeEl) {
				if (!Browser.Engine.trident) {
					instance.iframeEl.setStyle('visibility', 'visible');
					partner.getElements('iframe').setStyle('visibility','visible');
				}
				else {
					instance.iframeEl.show();
					partner.getElements('iframe').show();
					// The following hack is to get IE8 Standards Mode to properly resize an iframe
					// when only the vertical dimension is changed.
					var width = instance.iframeEl.getStyle('width').toInt();
					instance.iframeEl.setStyle('width', width - 1);
					MochaUI.rWidth();
					instance.iframeEl.setStyle('width', width);									
				}
			}		
			instance.fireEvent('onResize');
		}.bind(this)
	});
}

MochaUI.extend({
	/*

	Function: closeColumn
		Destroys/removes a column.

	Syntax:
	(start code)
		MochaUI.closeColumn();
	(end)

	Arguments: 
		columnEl - the ID of the column to be closed

	Returns:
		true - the column was closed
		false - the column was not closed

	*/	
	closeColumn: function(columnEl){
		var instances = MochaUI.Columns.instances;
		var instance = instances.get(columnEl.id);
		if (columnEl != $(columnEl) || instance.isClosing) return;
			
		instance.isClosing = true;
		
		// Destroy all the panels in the column.
		var panels = columnEl.getChildren('.panel');		
		panels.each(function(panel){
			MochaUI.closePanel($(panel.id));
		}.bind(this));				
		
		if (Browser.Engine.trident) {
			columnEl.dispose();
			if (instance.handleEl != null) {
				instance.handleEl.dispose();
			}			
		}
		else {
			columnEl.destroy();
			if (instance.handleEl != null) {
				instance.handleEl.destroy();
			}			
		}
		if (MochaUI.Desktop) {
			MochaUI.Desktop.resizePanels();
		}	
		instances.erase(instance.options.id);
		return true;		
	},
	/*

	Function: closePanel
		Destroys/removes a panel.

	Syntax:
	(start code)
		MochaUI.closePanel();
	(end)

	Arguments: 
		panelEl - the ID of the panel to be closed

	Returns:
		true - the panel was closed
		false - the panel was not closed

	*/	
	closePanel: function(panelEl){
		var instances = MochaUI.Panels.instances;
		var instance = instances.get(panelEl.id);
		if (panelEl != $(panelEl) || instance.isClosing) return;
		
		var column = instance.options.column;
		
		instance.isClosing = true;
		
		if (Browser.Engine.trident) {
			instance.panelHeaderEl.dispose();
			panelEl.dispose();
			if (instance.handleEl != null) {
				instance.handleEl.dispose();
			}
		}
		else {
			instance.panelHeaderEl.destroy();
			panelEl.destroy();
			if (instance.handleEl != null) {
				instance.handleEl.destroy();
			}
		}
		if (MochaUI.Desktop) {
			MochaUI.Desktop.resizePanels();
		}
		
		// Do this when creating and removing panels
		$(column).getChildren('.panel').each(function(panel){
			panel.removeClass('bottomPanel');
		});
		$(column).getChildren('.panel').getLast().addClass('bottomPanel');
		
		instances.erase(instance.options.id);
		return true;
		
	}
});
/*

Script: Dock.js
	Implements the dock/taskbar. Enables window minimize.

Copyright:
	Copyright (c) 2007-2009 Greg Houston, <http://greghoustondesign.com/>.	

License:
	MIT-style license.

Requires:
	Core.js, Window.js, Layout.js	

Todo:
	- Make it so the dock requires no initial html markup.

*/

MochaUI.options.extend({
		// Naming options:
		// If you change the IDs of the Mocha Desktop containers in your HTML, you need to change them here as well.
		dockWrapper: 'dockWrapper',
		dock:        'dock'
});

MochaUI.extend({
	/*

	Function: minimizeAll
		Minimize all windows that are minimizable.

	*/	
	minimizeAll: function() {
		$$('.mocha').each(function(windowEl){
			var instance = windowEl.retrieve('instance');
			if (!instance.isMinimized && instance.options.minimizable == true){
				MochaUI.Dock.minimizeWindow(windowEl);
			}
		}.bind(this));
	}
});

MochaUI.Dock = new Class({
	Extends: MochaUI.Window,

	Implements: [Events, Options],

	options: {
		useControls:          true,      // Toggles autohide and dock placement controls.
		dockPosition:         'bottom',  // Position the dock starts in, top or bottom.
		// Style options
		dockTabColor:         [255, 255, 255],
		trueButtonColor:      [70, 245, 70],     // Color for autohide on
		enabledButtonColor:   [115, 153, 191], 
		disabledButtonColor:  [170, 170, 170]
	},
	initialize: function(options){
		// Stops if MochaUI.Desktop is not implemented
		if (!MochaUI.Desktop) return;
		this.setOptions(options);
		
		MochaUI.dockVisible = true;
		this.dockWrapper   = $(MochaUI.options.dockWrapper);
		this.dock          = $(MochaUI.options.dock);
		this.autoHideEvent = null;		
		this.dockAutoHide  = false;  // True when dock autohide is set to on, false if set to off

		if (!this.dockWrapper) return;

		if (!this.options.useControls){
			if($('dockPlacement')){
				$('dockPlacement').setStyle('cursor', 'default');
			}
			if($('dockAutoHide')){
				$('dockAutoHide').setStyle('cursor', 'default');
			}
		}

		this.dockWrapper.setStyles({
			'display':  'block',
			'position': 'absolute',
			'top':      null,
			'bottom':   MochaUI.Desktop.desktopFooter ? MochaUI.Desktop.desktopFooter.offsetHeight : 0,
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
			opacity: 1,
			constrain: true,
			clone: false,
			revert: false
		});

		MochaUI.Desktop.setDesktopSize();
	},
	initializeDockControls: function(){
		
		if (this.options.useControls){
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
				MochaUI.circle(ctx, 5 , 14, 3, this.options.trueButtonColor, 1.0);

				// Define event
				this.autoHideEvent = function(event) {
					if (!this.dockAutoHide)
						return;
					if (!MochaUI.Desktop.desktopFooter) {
						var dockHotspotHeight = this.dockWrapper.offsetHeight;
						if (dockHotspotHeight < 25) dockHotspotHeight = 25;
					}
					else if (MochaUI.Desktop.desktopFooter) {
						var dockHotspotHeight = this.dockWrapper.offsetHeight + MochaUI.Desktop.desktopFooter.offsetHeight;
						if (dockHotspotHeight < 25) dockHotspotHeight = 25;
					}						
					if (!MochaUI.Desktop.desktopFooter && event.client.y > (document.getCoordinates().height - dockHotspotHeight)){
						if (!MochaUI.dockVisible){
							this.dockWrapper.show();
							MochaUI.dockVisible = true;
							MochaUI.Desktop.setDesktopSize();
						}
					}
					else if (MochaUI.Desktop.desktopFooter && event.client.y > (document.getCoordinates().height - dockHotspotHeight)){
						if (!MochaUI.dockVisible){
							this.dockWrapper.show();
							MochaUI.dockVisible = true;
							MochaUI.Desktop.setDesktopSize();
						}
					}
					else if (MochaUI.dockVisible){
						this.dockWrapper.hide();
						MochaUI.dockVisible = false;
						MochaUI.Desktop.setDesktopSize();
						
					}
				}.bind(this);

				// Add event
				document.addEvent('mousemove', this.autoHideEvent);

			} else {
				$('dockAutoHide').setProperty('title', 'Turn Auto Hide On');
				//ctx.clearRect(0, 11, 100, 100);
				MochaUI.circle(ctx, 5 , 14, 3, this.options.enabledButtonColor, 1.0);
				// Remove event
				document.removeEvent('mousemove', this.autoHideEvent);
			}

		}.bind(this));

		// Draw dock controls
		var ctx = $('dockCanvas').getContext('2d');
		ctx.clearRect(0, 0, 100, 100);
		MochaUI.circle(ctx, 5 , 4, 3, this.options.enabledButtonColor, 1.0);
		MochaUI.circle(ctx, 5 , 14, 3, this.options.enabledButtonColor, 1.0);
		
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
				MochaUI.circle(ctx, 5, 4, 3, this.options.enabledButtonColor, 1.0);
				MochaUI.circle(ctx, 5, 14, 3, this.options.disabledButtonColor, 1.0);
				$('dockPlacement').setProperty('title', 'Position Dock Bottom');
				$('dockAutoHide').setProperty('title', 'Auto Hide Disabled in Top Dock Position');
				this.dockAutoHide = false;
			}
			// Move dock to bottom position
			else {
				this.dockWrapper.setStyles({
					'position':      'absolute',
					'bottom':        MochaUI.Desktop.desktopFooter ? MochaUI.Desktop.desktopFooter.offsetHeight : 0
				});
				this.dockWrapper.removeClass('top');
				MochaUI.Desktop.setDesktopSize();
				this.dockWrapper.setProperty('dockPosition', 'bottom');
				ctx.clearRect(0, 0, 100, 100);
				MochaUI.circle(ctx, 5, 4, 3, this.options.enabledButtonColor, 1.0);
				MochaUI.circle(ctx, 5 , 14, 3, this.options.enabledButtonColor, 1.0);
				$('dockPlacement').setProperty('title', 'Position Dock Top');
				$('dockAutoHide').setProperty('title', 'Turn Auto Hide On');
			}
	},
	createDockTab: function(windowEl){

		var instance = windowEl.retrieve('instance');

		var dockTab = new Element('div', {
			'id': instance.options.id + '_dockTab',
			'class': 'dockTab',
			'title': titleText
		}).inject($('dockClear'), 'before');
		
		dockTab.addEvent('mousedown', function(e){
			new Event(e).stop();
			this.timeDown = $time();
		});
		
		dockTab.addEvent('mouseup', function(e){
			this.timeUp = $time();
			if ((this.timeUp - this.timeDown) < 275){
				// If the visibility of the windows on the page are toggled off, toggle visibility on.
				if (MochaUI.Windows.windowsVisible == false) {
					MochaUI.toggleWindowVisibility();
					if (instance.isMinimized == true) {
						MochaUI.Dock.restoreMinimized.delay(25, MochaUI.Dock, windowEl);
					}
					else {
						MochaUI.focusWindow(windowEl);
					}
					return;
				}
				// If window is minimized, restore window.
				if (instance.isMinimized == true) {
					MochaUI.Dock.restoreMinimized.delay(25, MochaUI.Dock, windowEl);
				}
				else{
					// If window is not minimized and is focused, minimize window.
					if (instance.windowEl.hasClass('isFocused') && instance.options.minimizable == true){
						MochaUI.Dock.minimizeWindow(windowEl)
					}
					// If window is not minimized and is not focused, focus window.	
					else{
						MochaUI.focusWindow(windowEl);
					}
					// if the window is not minimized and is outside the viewport, center it in the viewport.
					var coordinates = document.getCoordinates();
					if (windowEl.getStyle('left').toInt() > coordinates.width || windowEl.getStyle('top').toInt() > coordinates.height){
						MochaUI.centerWindow(windowEl);	
					}
				}
			}
		});

		this.dockSortables.addItems(dockTab);

		var titleText = instance.titleEl.innerHTML;

		var dockTabText = new Element('div', {
			'id': instance.options.id + '_dockTabText',
			'class': 'dockText'
		}).set('html', titleText.substring(0,19) + (titleText.length > 19 ? '...' : '')).inject($(dockTab));

		// If I implement this again, will need to also adjust the titleText truncate and the tab's
		// left padding.
		if (instance.options.icon != false){
			// dockTabText.setStyle('background', 'url(' + instance.options.icon + ') 4px 4px no-repeat');
		}
		
		// Need to resize everything in case the dock wraps when a new tab is added
		MochaUI.Desktop.setDesktopSize();

	},
	makeActiveTab: function(){

		// getWindowWith HighestZindex is used in case the currently focused window
		// is closed.		
		var windowEl = MochaUI.getWindowWithHighestZindex();
		var instance = windowEl.retrieve('instance');
		
		$$('.dockTab').removeClass('activeDockTab');
		if (instance.isMinimized != true) {
			
			instance.windowEl.addClass('isFocused');

			var currentButton = $(instance.options.id + '_dockTab');
			if (currentButton != null) {
				currentButton.addClass('activeDockTab');
			}
		}
		else {
			instance.windowEl.removeClass('isFocused');
		}	
	},	
	minimizeWindow: function(windowEl){
		if (windowEl != $(windowEl)) return;
		
		var instance = windowEl.retrieve('instance');
		instance.isMinimized = true;

		// Hide iframe
		// Iframe should be hidden when minimizing, maximizing, and moving for performance and Flash issues
		if ( instance.iframeEl ) {
			// Some elements are still visible in IE8 in the iframe when the iframe's visibility is set to hidden.
			if (!Browser.Engine.trident) {
				instance.iframeEl.setStyle('visibility', 'hidden');
			}
			else {
				instance.iframeEl.hide();
			}
		}

		// Hide window and add to dock	
		instance.contentBorderEl.setStyle('visibility', 'hidden');
		if(instance.toolbarWrapperEl){		
			instance.toolbarWrapperEl.hide();
		}
		windowEl.setStyle('visibility', 'hidden');

		 // Fixes a scrollbar issue in Mac FF2
		if (Browser.Platform.mac && Browser.Engine.gecko){
			if (/Firefox[\/\s](\d+\.\d+)/.test(navigator.userAgent)){
				var ffversion = new Number(RegExp.$1);
				if (ffversion < 3) {
					instance.contentWrapperEl.setStyle('overflow', 'hidden');
				}
			}
		}
	
		MochaUI.Desktop.setDesktopSize();

		// Have to use timeout because window gets focused when you click on the minimize button
		setTimeout(function(){
			windowEl.setStyle('zIndex', 1);
			windowEl.removeClass('isFocused');
			this.makeActiveTab();	
		}.bind(this),100);	

		instance.fireEvent('onMinimize', windowEl);
	},
	restoreMinimized: function(windowEl) {

		var instance = windowEl.retrieve('instance');

		if (instance.isMinimized == false) return;

		if (MochaUI.Windows.windowsVisible == false){
			MochaUI.toggleWindowVisibility();
		}

		MochaUI.Desktop.setDesktopSize();

		 // Part of Mac FF2 scrollbar fix
		if (instance.options.scrollbars == true && !instance.iframeEl){ 
			instance.contentWrapperEl.setStyle('overflow', 'auto');
		}

		if (instance.isCollapsed) {
			MochaUI.collapseToggle(windowEl);
		}

		windowEl.setStyle('visibility', 'visible');
		instance.contentBorderEl.setStyle('visibility', 'visible');
		if(instance.toolbarWrapperEl){
			instance.toolbarWrapperEl.show();
		}

		// Show iframe
		if (instance.iframeEl){
			if (!Browser.Engine.trident){
				instance.iframeEl.setStyle('visibility', 'visible');
			}
			else {
				instance.iframeEl.show();
			}
		}

		instance.isMinimized = false;
		MochaUI.focusWindow(windowEl);
		instance.fireEvent('onRestore', windowEl);

	}
});
MochaUI.Dock.implement(new Options, new Events);
/*

Script: Workspaces.js
	Save and load workspaces. The Workspaces emulate Adobe Illustrator functionality remembering what windows are open and where they are positioned. There will be two versions, a limited version that saves state to a cookie, and a fully functional version that saves state to a database.

Copyright:
	Copyright (c) 2007-2009 Greg Houston, <http://greghoustondesign.com/>.

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
			instance.saveValues();
			this.cookie.set(instance.options.id, {
				'id': instance.options.id,
				'top': instance.options.y,
				'left': instance.options.x,
				'width': instance.contentWrapperEl.getStyle('width').toInt(),
				'height': instance.contentWrapperEl.getStyle('height').toInt()
			});
		}.bind(this));
		this.cookie.save();

		new MochaUI.Window({
			loadMethod: 'html',
			type: 'notification',
			addClass: 'notification',
			content: 'Workspace saved.',
			closeAfter: '1400',
			width: 200,
			height: 40,
			y: 53,
			padding:  { top: 10, right: 12, bottom: 10, left: 12 },
			shadowBlur: 5,
			bodyBgColor: [255, 255, 255]
		});
		
	},
	windowUnload: function(){
		if ($$('.mocha').length == 0 && this.myChain){
			this.myChain.callChain();
		}		
	},
	loadWorkspace2: function(workspaceWindows){		
		workspaceWindows.each(function(workspaceWindow){				
			windowFunction = eval('MochaUI.' + workspaceWindow.id + 'Window');
			if (windowFunction){
				eval('MochaUI.' + workspaceWindow.id + 'Window({width:'+ workspaceWindow.width +',height:' + workspaceWindow.height + '});');
				var windowEl = $(workspaceWindow.id);
				windowEl.setStyles({
					'top': workspaceWindow.top,
					'left': workspaceWindow.left
				});
				var instance = windowEl.retrieve('instance');
				instance.contentWrapperEl.setStyles({
					'width': workspaceWindow.width,
					'height': workspaceWindow.height
				});
				instance.drawWindow();
			}
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
		cookie = new Hash.Cookie('mochaUIworkspaceCookie', {duration: 3600});
		workspaceWindows = cookie.load();

		if(!cookie.getKeys().length){
			new MochaUI.Window({
				loadMethod: 'html',
				type: 'notification',
				addClass: 'notification',
				content: 'You have no saved workspace.',
				closeAfter: '1400',
				width: 220,
				height: 40,
				y: 25,
				padding:  { top: 10, right: 12, bottom: 10, left: 12 },
				shadowBlur: 5,
				bodyBgColor: [255, 255, 255]
			});
			return;
		}

		if ($$('.mocha').length != 0){
			this.loadingWorkspace = true;
			this.myChain = new Chain();
			this.myChain.chain(
				function(){
					$$('.mocha').each(function(el) {
						this.closeWindow(el);
					}.bind(this));
				}.bind(this),
				function(){
					this.loadWorkspace2(workspaceWindows);
				}.bind(this)
			);
			this.myChain.callChain();
		}
		else {
			this.loadWorkspace2(workspaceWindows);
		}

	}
});
