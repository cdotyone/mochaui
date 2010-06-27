/*
 ---

 name: Core

 script: core.js

 description: MUI - A Web Applications User Interface Framework.

 copyright: (c) 2010 Contributors in (/AUTHORS.txt).

 license: MIT-style license in (/MIT-LICENSE.txt).

 note:
 This documentation is taken directly from the javascript source files. It is built using Natural Docs.

 requires:
 - Core/Array
 - Core/Element
 - Core/Browser
 - Core/Request
 - Core/Request.HTML
 - Hash
 - More/Assets

 provides: [MUI, MochaUI, MUI.Require]

 ...
 */

var MUI = MochaUI = new Hash({
	version: '0.9.8',

	instances: new Hash(),
	IDCount: 0,

	options: new Hash({
		theme: 'default',
		advancedEffects: false, // Effects that require fast browsers and are cpu intensive.
		standardEffects: true   // Basic effects that tend to run smoothly.
	}),

	path: {
		source:  '../mui/',			 // Path to MochaUI source JavaScript
		themes:  '../themes/',		  // Path to MochaUI Themes
		plugins: '../plugins/',		 // Path to Plugins
		controls:'../mui-controls/',	// Path to Mocha Owned Plugins
		utils:   '../mui-util/'		 // Path to Mocha On Demand Functionality
	},

	// Returns the path to the current theme directory
	themePath: function(){
		return MUI.path.themes + MUI.options.theme + '/';
	},

	files: new Hash(),

	getID: function(el){
		if (type == 'string') return el;
		var type = $type(el);
		if (type == 'element') return el.id; else
		if (type == 'object' && el.id) return el.id; else
		if (type == 'object' && el.options && el.options.id) return el.options.id;
		return el;
	},

	get: function(el){
		el = this.getID(el);
		return this.instances[el];
	},

	set: function(el, instance){
		el = this.getID(el);
		this.instances.set(el, instance);
		return instance;
	},

	erase: function(el){
		el = this.getID(el);
		return this.instances.erase(el);
	},

	each: function(func){
		this.instances.each(func);
		return this;
	}

});

var NamedClass = function(name, members){
	members.className = name;
	members.isTypeOf = function(cName){
		if (cName == this.className) return true;
		if (!this.constructor || !this.constructor.parent) return false;
		return this.isTypeOf.run(cName, this.constructor.parent.prototype);
	};
	return new Class(members);
};

MUI.files[MUI.path.source + 'core.js'] = 'loaded';

MUI.extend({
	ieSupport: 'excanvas',  // Makes it easier to switch between Excanvas and Moocanvas for testing

	/*

	 Function: reloadIframe
	 Reload an iframe. Fixes an issue in Firefox when trying to use location.reload on an iframe that has been destroyed and recreated.

	 Arguments:
	 iframe - This should be both the name and the id of the iframe.

	 Syntax:
	 (start code)
	 MUI.reloadIframe(element);
	 (end)

	 Example:
	 To reload an iframe from within another iframe:
	 (start code)
	 parent.MUI.reloadIframe('myIframeName');
	 (end)

	 */
	reloadIframe: function(iframe){
		var src = $(iframe).src;
		Browser.Engine.gecko ? $(iframe).src = src : top.frames[iframe].location.reload(true);
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
		ctx.arc(x, y, diameter, 0, Math.PI * 2, true);
		ctx.fillStyle = 'rgba(' + rgb.join(',') + ',' + a + ')';
		ctx.fill();
	},

	notification: function(message){
		new MUI.Window({
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
	toggleAdvancedEffects: function(link) {
		if (MUI.options.advancedEffects) {
			MUI.options.advancedEffects = false;
			if (this.toggleAdvancedEffectsLink) {
				this.toggleAdvancedEffectsLink.destroy();
			}
		} else {
			MUI.options.advancedEffects = true;
			if (link) {
				this.toggleAdvancedEffectsLink = new Element('div', {
					'class': 'check',
					'id': 'toggleAdvancedEffects_check'
				}).inject(link);
			}
		}
	},

	/*
	 Function: toggleStandardEffects
	 Turn standard effects on and off
	 */
	toggleStandardEffects: function(link) {
		if (MUI.options.standardEffects) {
			MUI.options.standardEffects = false;
			if (this.toggleStandardEffectsLink) {
				this.toggleStandardEffectsLink.destroy();
			}
		} else {
			MUI.options.standardEffects = true;
			if (link) {
				this.toggleStandardEffectsLink = new Element('div', {
					'class': 'check',
					'id': 'toggleStandardEffects_check'
				}).inject(link);
			}
		}
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
		var imgTitle = (myImage.title) ? "title='" + myImage.title + "' " : "title='" + myImage.alt + "' ";
		var imgStyle = "display:inline-block;" + myImage.style.cssText;
		myImage.outerHTML = "<span " + imgID + imgClass + imgTitle
				+ " style=\"" + "width:" + myImage.width
				+ "px; height:" + myImage.height
				+ "px;" + imgStyle + ";"
				+ "filter:progid:DXImageTransform.Microsoft.AlphaImageLoader"
				+ "(src=\'" + myImage.src + "\', sizingMethod='scale');\"></span>";
	}
}

// Blur all windows if user clicks anywhere else on the page
document.addEvent('mousedown', function(){
	MUI.blurAll.delay(50);
});

window.addEvent('domready', function(){
	MUI.underlayInitialize();
});

window.addEvent('resize', function(){
	if ($('windowUnderlay')){
		MUI.setUnderlaySize();
	}
	else {
		MUI.underlayInitialize();
	}
});

Element.implement({

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
	shake: function(radius, duration){
		radius = radius || 3;
		duration = duration || 500;
		duration = (duration / 50).toInt() - 1;
		var parent = this.getParent();
		if (parent != $(document.body) && parent.getStyle('position') == 'static'){
			parent.setStyle('position', 'relative');
		}
		var position = this.getStyle('position');
		if (position == 'static'){
			this.setStyle('position', 'relative');
			position = 'relative';
		}
		if (Browser.Engine.trident){
			parent.setStyle('height', parent.getStyle('height'));
		}
		var coords = this.getPosition(parent);
		if (position == 'relative' && !Browser.Engine.presto){
			coords.x -= parent.getStyle('paddingLeft').toInt();
			coords.y -= parent.getStyle('paddingTop').toInt();
		}
		var morph = this.retrieve('morph');
		if (morph){
			morph.cancel();
			var oldOptions = morph.options;
		}
		morph = this.get('morph', {
			duration:50,
			link:'chain'
		});
		for (var i = 0; i < duration; i++){
			morph.start({
				top:coords.y + $random(-radius, radius),
				left:coords.x + $random(-radius, radius)
			});
		}
		morph.start({
			top:coords.y,
			left:coords.x
		}).chain(function(){
			if (oldOptions){
				this.set('morph', oldOptions);
			}
		}.bind(this));
		return this;
	},		

	hide: function(){
		var instance = MUI.get(this.id);
		if (instance != null && instance.hide != null) {
			instance.hide();
			return;
		}

		this.setStyle('display', 'none');
		return this;
	},

	show: function(){
		var instance = MUI.get(this.id);
		if (instance != null && instance.show != null) {
			instance.show();
			return;
		}

		this.setStyle('display', 'block');
		return this;
	},

	close: function(){
		var instance = MUI.get(this.id);
		if (instance == null || instance.isClosing || instance.close == null) return;
		instance.close();
	},

	/*
	 Function: hideSpinner
	 Hides the spinner.

	 Example:
	 (start code)
	 $('id').hideSpinner(element);
	 (end)
	 */
	hideSpinner: function(instance){
		if(instance == null) instance = MUI.get(this.id);
		if(instance == null){
			if($('spinner')) $('spinner').hide();
			return;
		}
		if (instance != null && instance.hideSpinner == null){
			if (instance.spinnerEl)	instance.spinnerEl.hide();
		} else instance.hideSpinner();

		return this;
	},

	/*
	 Function: showSpinner
	 Shows the spinner.

	 Example:
	 (start code)
	 $('id').showSpinner(element);
	 (end)
	 */
	showSpinner: function(instance){
		if(instance == null) instance = MUI.get(this.id);
		if(instance == null){
			if($('spinner')) $('spinner').show();
			return;
		}
		if (instance != null && instance.showSpinner == null){
			if (instance.spinnerEl)	instance.spinnerEl.show();
		} else instance.showSpinner();
		return this;
	},

	/*
	 Function: resize a control

	 Example:
	 (start code)
	 MUI.resize(element,{width:500,height:300,centered:true});
	 (end)
	 */
	resize: function(options){
		var instance = MUI.get(this.id);
		if (instance == null || instance.resize == null) {
			if(options.width!=null) this.setStyle('width',options.width);
			if(options.height!=null) this.setStyle('height',options.height);
		} else instance.resize(options);
		return this;
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

// This makes it so Request will work to some degree locally
if (location.protocol == 'file:'){

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

MUI.Require = new Class({

	Implements: [Options],

	options: {
		css: [],
		images: [],
		js: [],
		onload: $empty
	},

	initialize: function(options){
		this.setOptions(options);
		options = this.options;

		this.assetsToLoad = options.css.length + options.images.length + options.js.length;
		this.assetsLoaded = 0;

		var cssLoaded = 0;

		// Load CSS before images and JavaScript

		if (options.css.length){
			options.css.each(function(sheet){

				this.getAsset(sheet, function(){
					if (cssLoaded == options.css.length - 1){

						if (this.assetsLoaded == this.assetsToLoad - 1){
							this.requireOnload();
						}
						else {
							// Add a little delay since we are relying on cached CSS from XHR request.
							this.assetsLoaded++;
							this.requireContinue.delay(50, this);
						}
					}
					else {
						cssLoaded++;
						this.assetsLoaded++;
					}
				}.bind(this));
			}.bind(this));
		}
		else if (!options.js.length && !options.images.length){
			this.options.onload();
			return true;
		}
		else {
			this.requireContinue.delay(50, this); // Delay is for Safari
		}

	},

	requireOnload: function(){
		this.assetsLoaded++;
		if (this.assetsLoaded == this.assetsToLoad){
			this.options.onload();
			return true;
		}

	},

	requireContinue: function(){

		var options = this.options;
		if (options.images.length){
			options.images.each(function(image){
				this.getAsset(image, this.requireOnload.bind(this));
			}.bind(this));
		}

		if (options.js.length){
			options.js.each(function(script){
				this.getAsset(script, this.requireOnload.bind(this));
			}.bind(this));
		}

	},

	getAsset: function(source, onload){

		// If the asset is loaded, fire the onload function.
		if (MUI.files[source] == 'loaded'){
			if (typeof onload == 'function'){
				onload();
			}
			return true;
		}

		// If the asset is loading, wait until it is loaded and then fire the onload function.
		// If asset doesn't load by a number of tries, fire onload anyway.
		else if (MUI.files[source] == 'loading'){
			var tries = 0;
			var checker = (function(){
				tries++;
				if (MUI.files[source] == 'loading' && tries < '100') return;
				$clear(checker);
				if (typeof onload == 'function'){
					onload();
				}
			}).periodical(50);
		}

		// If the asset is not yet loaded or loading, start loading the asset.
		else {
			MUI.files[source] = 'loading';

			properties = {
				'onload': onload != 'undefined' ? onload : $empty
			};

			// Add to the onload function
			var oldonload = properties.onload;
			properties.onload = function(){
				MUI.files[source] = 'loaded';
				if (oldonload){
					oldonload();
				}
			}.bind(this);

			switch (source.match(/\.\w+$/)[0]){
				case '.js': return Asset.javascript(source, properties);
				case '.css': return Asset.css(source, properties);
				case '.jpg':
				case '.png':
				case '.gif': return Asset.image(source, properties);
			}

			alert('The required file "' + source + '" could not be loaded');
		}
	}

});

$extend(Asset, {

	// Get the CSS with XHR before appending it to document.head so that we can have an onload callback.
	css: function(source, properties){

		properties = $extend({
			id: null,
			media: 'screen',
			onload: $empty
		}, properties);

		new Request({
			method: 'get',
			url: source,
			onComplete: function(){
				newSheet = new Element('link', {
					'id': properties.id,
					'rel': 'stylesheet',
					'media': properties.media,
					'type': 'text/css',
					'href': source
				}).inject(document.head);
				properties.onload();
			}.bind(this),
			onFailure: function(){
			},
			onSuccess: function(){
			}.bind(this)
		}).send();
	},

	/*
	 Examples:
	 (start code)
	 getCSSRule('.myRule');
	 getCSSRule('#myRule');
	 (end)
	 */
	getCSSRule: function(selector){
		for (var ii = 0; ii < document.styleSheets.length; ii++){
			var mySheet = document.styleSheets[ii];
			var myRules = mySheet.cssRules ? mySheet.cssRules : mySheet.rules;
			for (var i = 0; i < myRules.length; i++){
				if (myRules[i].selectorText == selector){
					return myRules[i];
				}
			}
		}
		return false;
	}

});

/*

 REGISTER PLUGINS

 Register Components and Plugins for Lazy Loading

 How this works may take a moment to grasp. Take a look at MUI.Window below.
 If we try to create a new Window and Window.js has not been loaded then the function
 below will run. It will load the CSS required by the MUI.Window Class and then
 then it will load Window.js. Here is the interesting part. When Window.js loads,
 it will overwrite the function below, and new MUI.Window(arg) will be ran
 again. This time it will create a new MUI.Window instance, and any future calls
 to new MUI.Window(arg) will immediately create new windows since the assets
 have already been loaded and our temporary function below has been overwritten.

 Example:

 MyPlugins.extend({

 MyGadget: function(arg){
 new MUI.Require({
 css: [MUI.path.plugins + 'myGadget/css/style.css'],
 images: [MUI.path.plugins + 'myGadget/images/background.gif']
 js: [MUI.path.plugins + 'myGadget/scripts/myGadget.js'],
 onload: function(){
 new MyPlguins.MyGadget(arg);
 }
 });
 }

 });

 -------------------------------------------------------------------- */

MUI.extend({

	newWindowsFromHTML: function(arg){
		new MUI.Require({
			js: [MUI.path.utils + 'window-from-html.js'],
			onload: function(){
				new MUI.newWindowsFromHTML(arg);
			}
		});
	},

	newWindowsFromJSON: function(arg){
		new MUI.Require({
			js: [MUI.path.utils + 'window-from-json.js'],
			onload: function(){
				new MUI.newWindowsFromJSON(arg);
			}
		});
	},

	arrangeCascade: function(){
		new MUI.Require({
			js: [MUI.path.utils + 'window-cascade.js'],
			onload: function(){
				new MUI.arrangeCascade();
			}
		});
	},

	arrangeTile: function(){
		new MUI.Require({
			js: [MUI.path.utils + 'window-tile.js'],
			onload: function(){
				new MUI.arrangeTile();
			}
		});
	},

	saveWorkspace: function(){
		new MUI.Require({
			js: [MUI.path.utils + 'workspace.js'],
			onload: function(){
				new MUI.saveWorkspace();
			}
		});
	},

	loadWorkspace: function(){
		new MUI.Require({
			js: [MUI.path.utils + 'workspace.js'],
			onload: function(){
				new MUI.loadWorkspace();
			}
		});
	}

});

if (Browser.Engine.webkit){
	new MUI.Require({
		js: [MUI.path.utils + 'window-webkit-shadow.js']
	});
}