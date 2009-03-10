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
		var contentWrapperEl = instance.contentWrapperEl;

		var loadMethod = options.loadMethod != null ? options.loadMethod : instance.options.loadMethod;
				
		// Set scrollbars if loading content in main content container.
		// Always use 'hidden' for iframe windows
		var scrollbars = options.scrollbars || instance.options.scrollbars;
		if (contentContainer == instance.contentEl) {
			contentWrapperEl.setStyles({
				'overflow': scrollbars != false && loadMethod != 'iframe' ? 'auto' : 'hidden'
			});
		}		

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
				this.updateContentXHR(instance, options, recipient, contentEl, contentContainer, onContentLoaded);
				break;
			case 'iframe':
				this.updateContentIframe(instance, options, recipient, contentEl, contentWrapperEl, contentContainer, onContentLoaded);				
				break;
			case 'html':
			default:
				this.updateContentHTML(instance, options, recipient, contentEl, contentContainer, onContentLoaded);
				break;
		}

	},
	updateContentXHR: function(instance, options, recipient, contentEl, contentContainer, onContentLoaded){
		new Request.HTML({
			url: options.url,
			update: contentContainer,
			method: options.method != null ? options.method : 'get',
			data: options.data != null ? new Hash(options.data).toQueryString() : '', 
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
					if (recipient == 'window'){
						instance.hideSpinner();
					}							
					else if (recipient == 'panel' && $('spinner')){
						$('spinner').hide();
					}	
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
	},
	updateContentIframe: function(instance, options, recipient, contentEl, contentWrapperEl, contentContainer, onContentLoaded){
		if ( instance.options.contentURL == '' || contentContainer != contentEl) {
			return;
		}
		instance.iframeEl = new Element('iframe', {
			'id': instance.options.id + '_iframe',
			'name': instance.options.id + '_iframe',
			'class': 'mochaIframe',
			'src': options.url,
			'marginwidth': 0,
			'marginheight': 0,
			'frameBorder': 0,
			'scrolling': 'auto',
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
	},
	updateContentHTML: function(instance, options, recipient, contentEl, contentContainer, onContentLoaded){
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

// Mootools Patch: Fixes issues in Safari, Chrome, and Internet Explorer caused by processing text as XML. 
Request.HTML.implement({
 
	processHTML: function(text){
		var match = text.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
		text = (match) ? match[1] : text;           
		var container = new Element('div');           
		return container.set('html', text);
	}
   
});

/*

	Examples:
		(start code)	
		getCSSRule('.myRule');
		getCSSRule('#myRule');
		(end)
  
*/
MochaUI.getCSSRule = function(ruleName, deleteFlag) {
   ruleName=ruleName.toLowerCase();
   if (document.styleSheets) {
      for (var i=0; i<document.styleSheets.length; i++) {
         var styleSheet=document.styleSheets[i];
         var ii=0;
         var cssRule=false;
         do {
            if (styleSheet.cssRules) { 
               cssRule = styleSheet.cssRules[ii]; 
            } else {
               cssRule = styleSheet.rules[ii]; 
            }
            if (cssRule)  {
               if (cssRule.selectorText.toLowerCase()==ruleName) {
                  if (deleteFlag=='delete') {
                     if (styleSheet.cssRules) {
                        styleSheet.deleteRule(ii);
                     } else {
                        styleSheet.removeRule(ii);
                     }
                     return true;
                  } else {
                     return cssRule;
                  }
               }
            }
            ii++;
         } while (cssRule)
      }
   }
   return false;
}

function killCSSRule(ruleName) { 
   return getCSSRule(ruleName,'delete');
}
function addCSSRule(ruleName) {
   if (document.styleSheets) {
      if (!getCSSRule(ruleName)) {
         if (document.styleSheets[0].addRule) {
            document.styleSheets[0].addRule(ruleName, null,0);
         } else {
            document.styleSheets[0].insertRule(ruleName+' { }', 0);
         }                                               
      } 
   }
   return getCSSRule(ruleName);
}
 
