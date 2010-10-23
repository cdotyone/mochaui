/*
 ---

 script: Core.js

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

 provides: [MUI, MochaUI, MUI.Require, NamedClass]

 ...
 */

var MochaUI;
var MUI = MochaUI = (MUI || {});

MUI.append = function(hash){
    Object.append(MUI, hash);
}.bind(MUI);

Browser.webkit = (Browser.safari || Browser.chrome);

MUI.append({
	'options': {
		theme: 'default',
		advancedEffects: false, // Effects that require fast browsers and are cpu intensive.
		standardEffects: true,  // Basic effects that tend to run smoothly.

		path: {
			source:  '../Source/',			// Path to MochaUI source JavaScript
			controls:'../Source/Controls/',	// Path to Mocha Owned Plugins
			themes:  '../Demo/themes/',		// Path to MochaUI Themes
			plugins: '../Demo/plugins/'		// Path to Plugins
		}
	}
});

MUI.append({
	version: '1.0.0',
	instances: new Hash(),
	IDCount: 0,
	ieSupport: 'excanvas',		// Makes it easier to switch between Excanvas and Moocanvas for testing
	classes: {},
	path: MUI.options.path,		// depreciated, will be removed

	initialize: function(options){
		if (options){
			if (options.path) options.path = Object.append(MUI.options.path, options.path);
			MUI.options.extend(options);
		}
	},

	replaceFields: function(str,values){
		if (values == null) return str;

		if (typeOf(str) == 'string'){
			var keys = str.match(/\{+(\w*)\}+/g);
			if (keys == null) return str;

			keys.each(function(key){
				var name = key.replace(/[\{\}]/g, '');
				if (name == null || name == '') return;

				var re = new RegExp('\\{' + name + '\\}', 'g');
				str = str.replace(re,values[name]);
			});
			return str;
		}
		if (typeOf(str) == 'array'){
			for (var i = 0; i < str.length; i++){
				str[i] = MUI.replaceFields(str[i]);
			}
		}
		return str;
	},

	replacePaths: function(files){
		var paths = Object.append({'theme':MUI.options.path.themes + MUI.options.theme + '/'}, MUI.options.path);
		return MUI.replaceFields(files,paths);
	},

	files: new Hash({'{source}Core/Core.js': 'loaded'}),

	getID: function(el){
		if (type == 'string') return el;
		var type = typeOf(el);
		if (type == 'element') return el.id; 
		else if (type == 'object' && el.id) return el.id;
		else if (type == 'object' && el.options && el.options.id) return el.options.id;
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
	},

	create:function(type,options,fromHTML){
		if (MUI.files['{controls}mui-controls.js'] != 'loaded'){
			new MUI.Require({
				'js':['{controls}mui-controls.js'],
				'onload':function(){
					MUI.create(type, options);
				}
			});
			return;
		}

		var name=type.replace(/(^MUI\.)/i,'');
		var sname=name.toLowerCase();
		if (MUI.classes[sname] == null) return null;

		var js=['{controls}' + sname + '/' + sname + '.js'];

		if (MUI.files[js[0]] == 'loaded' && !fromHTML){
			var klass = MUI[name];
			return new klass(options);
		}

		if (fromHTML) js.push('{controls}' + sname + '/' + sname + '_html.js');

		var additionalOptions = MUI.classes[sname];
		var css = [];
		if (additionalOptions.css) css = additionalOptions.css;

		var ret;
		new MUI.Require({
			'js':js,
			'css':css,
			'onload':function(){
				var klass = MUI[name];
				ret = new klass(options);
				if (fromHTML) ret.fromHTML();
			}
		});
		return ret;
	},

	reloadIframe: function(iframe){
		var src = $(iframe).src;
		Browser.firefox ? $(iframe).src = src : top.frames[iframe].location.reload(true);
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
			padding: {top: 10, right: 12, bottom: 10, left: 12},
			shadowBlur: 5
		});
	},

	toggleAdvancedEffects: function(link){
		if (MUI.options.advancedEffects){
			MUI.options.advancedEffects = false;
			if (this.toggleAdvancedEffectsLink) this.toggleAdvancedEffectsLink.destroy();
		} else {
			MUI.options.advancedEffects = true;
			if (link){
				this.toggleAdvancedEffectsLink = new Element('div', {
					'class': 'check',
					'id': 'toggleAdvancedEffects_check'
				}).inject(link);
			}
		}
	},

	toggleStandardEffects: function(link){
		if (MUI.options.standardEffects){
			MUI.options.standardEffects = false;
			if (this.toggleStandardEffectsLink) this.toggleStandardEffectsLink.destroy();
		} else {
			MUI.options.standardEffects = true;
			if (link){
				this.toggleStandardEffectsLink = new Element('div', {
					'class': 'check',
					'id': 'toggleStandardEffects_check'
				}).inject(link);
			}
		}
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

function fixPNG(myImage){
	if (Browser.ie4 && document.body.filters){
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

Element.implement({

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
		if (Browser.ie){
			parent.setStyle('height', parent.getStyle('height'));
		}
		var coords = this.getPosition(parent);
		if (position == 'relative' && !Browser.opera){
			coords.x -= parent.getStyle('paddingLeft').toInt();
			coords.y -= parent.getStyle('paddingTop').toInt();
		}
		var morph = this.retrieve('morph');
		var oldOptions;
		if (morph){
			morph.cancel();
			oldOptions = morph.options;
		}

		this.set('morph', {
			duration:50,
			link:'chain'
		});

		for (var i = 0; i < duration; i++){
			morph.start({
				top:coords.y + Number.random(-radius, radius),
				left:coords.x + Number.random(-radius, radius)
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
		if (instance != null && instance.hide != null){
			instance.hide();
			return;
		}

		this.setStyle('display', 'none');
		return this;
	},

	show: function(){
		var instance = MUI.get(this.id);
		if (instance != null && instance.show != null){
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

	hideSpinner: function(instance){
		if (instance == null) instance = MUI.get(this.id);
		var spinner = $('spinner');
		if (instance && instance.el && instance.el.spinner) spinner = instance.el.spinner;
		if ((instance == null || (instance && instance.hideSpinner == null) || spinner) && spinner){
			(function(){
				var count = this.retrieve("count");
				this.store("count", count ? count - 1 : 0);
				if (count <= 1) this.hide();
			}).delay(500, spinner);
			return;
		}
		if (instance && instance.hideSpinner) instance.hideSpinner();
		return this;
	},

	showSpinner: function(instance){
		if (instance == null) instance = MUI.get(this.id);
		var spinner = $('spinner');
		if (instance && instance.el && instance.el.spinner) spinner = instance.el.spinner;
		if ((instance == null || (instance && instance.hideSpinner == null) || spinner) && spinner){
			var count=spinner.retrieve("count");
			spinner.store("count",count ? count+1 : 1).show();
			return;
		}
		if (instance && instance.hideSpinner) instance.showSpinner();
		return this;
	},

	resize: function(options){
		var instance = MUI.get(this.id);
		if (instance == null || instance.resize == null){
			if (options.width != null) this.setStyle('width', options.width);
			if (options.height != null) this.setStyle('height', options.height);
		} else instance.resize(options);
		return this;
	}

});

/*// Mootools Patch: Fixes issues in Safari, Chrome, and Internet Explorer caused by processing text as XML.
Request.HTML.implement({

	processHTML: function(text){
		var match = text.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
		text = (match) ? match[1] : text;
		var container = new Element('div');
		return container.set('html', text);
	}

});*/

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
		js: []
		//onload: null
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
						if (this.assetsLoaded == this.assetsToLoad - 1) this.requireOnload();
						else {
							// Add a little delay since we are relying on cached CSS from XHR request.
							this.assetsLoaded++;
							this.requireContinue.delay(50, this);
						}
					} else {
						cssLoaded++;
						this.assetsLoaded++;
					}
				}.bind(this));
			}.bind(this));
		} else if (!options.js.length && !options.images.length){
			this.options.onload();
			return true;
		} else this.requireContinue.delay(50, this); // Delay is for Safari
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
				clearInterval(checker);
				if (typeof onload == 'function'){
					onload();
				}
			}).periodical(50);
		} else {  // If the asset is not yet loaded or loading, start loading the asset.
			MUI.files[source] = 'loading';

			properties = {
				'onload': onload != 'undefined' ? onload : null
			};

			// Add to the onload function
			var oldonload = properties.onload;
			properties.onload = function(){
				MUI.files[source] = 'loaded';
				if (oldonload) oldonload();
			}.bind(this);

			var sourcePath=MUI.replacePaths(source);
			switch (sourcePath.match(/\.\w+$/)[0]){
				case '.js': return Asset.javascript(sourcePath, properties);
				case '.css': return Asset.css(sourcePath, properties);
				case '.jpg':
				case '.png':
				case '.gif': return Asset.image(sourcePath, properties);
			}

			alert('The required file "' + source + '" could not be loaded');
		}
	}
});

Object.append(Asset, {
	// Get the CSS with XHR before appending it to document.head so that we can have an onload callback.
	css: function(source, properties){
		properties = Object.append({
			id: null,
			media: 'screen',
			onload: null
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
