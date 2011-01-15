/*
 ---

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
			root:		'../',						// Path to root of other source folders
			source:		'{root}Source/',			// Path to MochaUI source JavaScript
			themes:		'{root}Source/Themes/'		// Path to MochaUI Themes
		},

		pluginGroups: {
			'controls':{path:'{root}Source/Controls/',singularName:'control'},
			'plugins':{path:'{root}Source/Plugins/',singularName:'plugin'}
		},

		themes: ['Default','Charcoal']
	}
});

MUI.append({
	version: '1.0.0',
	initialized: false,
	instances: new Hash(),
	IDCount: 0,
	ieSupport: 'excanvas',					// Makes it easier to switch between Excanvas and Moocanvas for testing
	//pluginGroups: ['controls','plugins'],
	path: MUI.options.path,					// depreciated, will be removed

	initialize: function(options){
		if (options){
			if (options.path) options.path = Object.append(MUI.options.path, options.path);
			if (options.pluginGroups) options.pluginGroups = Object.append(MUI.options.pluginGroups, options.pluginGroups);
			Object.append(MUI.options, options);
		}
		Object.each(MUI.options.pluginGroups, MUI.addPluginGroup);
		MUI.initialized = true;
	},

	replaceFields: function(str, values){
		if (values == null) return str;

		if (typeOf(str) == 'string'){
			var keys = str.match(/\{+(\w*)\}+/g);
			if (keys == null) return str;

			// make sure root path and plugin package paths are always checked for
			Object.each(MUI.options.pluginGroups, function(g, name){
				keys.push('{' + name + '}')
			});
			keys.push('{root}');

			keys.each(function(key){
				var name = key.replace(/[\{\}]/g, '');
				if (name == null || name == '') return;

				if (!values[name]) return;
				var re = new RegExp('\\{' + name + '\\}', 'g');
				str = str.replace(re, values[name]);
			});
			return str;
		}
		if (typeOf(str) == 'array'){
			for (var i = 0; i < str.length; i++){
				str[i] = MUI.replaceFields(str[i], values);
			}
		}
		return str;
	},

	replacePaths: function(files){
		if (!MUI.initialized) MUI.initialize();
		var paths = Object.append({'theme':MUI.options.path.themes + MUI.options.theme + '/'}, MUI.options.path);
		return MUI.replaceFields(files, paths);
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
		var id = this.getID(el);
		el = $(id);
		if (el && el.retrieve('instance')) return el.retrieve('instance');
		return this.instances[id];
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
		Object.each(this.instances, func);
		return this;
	},

	addPluginGroup: function(group, name){
		MUI.options.pluginGroups[name] = group;
		MUI.options.path[name] = group.path;
	},

	loadPluginGroups:function(onload){
		var js = [];
		Object.each(MUI.options.pluginGroups, function(group, name){
			if (MUI.files['{' + name + '}mui-' + name + '.js'] != 'loaded'){
				MUI[name] = [];
				Object.append(js, ['{' + name + '}mui-' + name + '.js']);
			}
		});
		if (js.length > 0) new MUI.Require({'js':js, 'onload':onload });
		else return false;  // returns false to signal that everything is loaded
		return true;   // returns true to signal that it loading something
	},

	load:function(type, loadScriptHTML){
		MUI.create(type, null, loadScriptHTML, true);
	},

	create:function(type, options, fromHTML, loadOnly){
		if (!MUI.initialized) MUI.initialize();
		if (this.loadPluginGroups(function(){
			MUI.create(type, options, fromHTML, loadOnly);  // [i_a] make sure all args get through to the next invocation when the plugins are loaded!
		})) return;

		var name = type.replace(/(^MUI\.)/i, '');
		var cname = name.toLowerCase();

		// try and locate the requested item
		var config;
		var pgName;
		Object.each(MUI.options.pluginGroups, function(group, name){
			if (MUI[name][cname] != null){
				pgName = name;
				config = MUI[name][cname];
			}
		});
		if (config == null) return;

		var path = {};
		var sname = MUI.options.pluginGroups[pgName].singularName;
		if (!config.location) config.location = cname;
		path[sname] = '{' + pgName + '}' + config.location + '/';

		if (config.paths) Object.each(config.paths, function(tpath, name){
			MUI.options.path[name] = MUI.replaceFields(tpath, path);
		});

		var js;
		if (!config.js) js = [path[sname] + cname + '.js'];
		else js = config.js;

		js = MUI.replaceFields(js, path);

		if (js.length > 0 && MUI.files[js[0]] == 'loaded' && !fromHTML){
			if (config.loadOnly || loadOnly) return null;
			var klass = MUI[name];
			return new klass(options);
		}

		if (fromHTML) js.push(path[sname] + cname + '_html.js');

		var css = [];
		if (config.css) css = config.css;
		css = MUI.replaceFields(css, path);

		new MUI.Require({
			'js':js,
			'css':css,
			'onload':function(){
				if (config.loadOnly || loadOnly) return;
				var klass = MUI[name];
				new klass(options);
				if (fromHTML) ret.fromHTML();
			}
		});
		return null;
	},

	reloadIframe: function(iframe){
		var src = $(iframe).src;
		Browser.firefox ? $(iframe).src = src : top.frames[iframe].location.reload(true);
	},

	notification: function(message){
		MUI.create('MUI.Window',{
			loadMethod: 'html',
			closeAfter: 1500,
			type: 'notification',
			cssClass: 'notification',
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
	},

	getData: function(item, property){
		if (!item || !property) return '';
		if (item[property] == null) return '';
		return item[property];
	},

	hideSpinner: function(instance){
		if (instance == null) instance = MUI.get(this.id);
		var spinner = $$('.spinner');
		if (instance && instance.el && instance.el.spinner) spinner = instance.el.spinner;
		if ((instance == null || (instance && instance.showSpinner == null)) && spinner){
			var t = (typeof spinner);
			if (t == 'array' || t == 'object') spinner = spinner[0];
			if (spinner) MUI.each(function(instance){
				if (instance.isTypeOf && instance.isTypeOf('MUI.Spinner')) spinner = instance.el.spinner;
			});
			if (!spinner) return;
			(function(){
				var count = this.retrieve("count");
				this.store("count", count ? count - 1 : 0);
				if (count <= 1) this.setStyle('display', 'none');
			}).delay(500, spinner);
			return;
		}
		if (instance && instance.hideSpinner) instance.hideSpinner();
	},

	showSpinner: function(instance){
		if (instance == null) instance = MUI.get(this.id);
		var spinner = $$('.spinner');
		if (instance && instance.el && instance.el.spinner) spinner = instance.el.spinner;
		if ((instance == null || (instance && instance.showSpinner == null)) && spinner){
			var t = (typeof spinner);
			if (t == 'array' || t == 'object') spinner = spinner[0];
			if (spinner) MUI.each(function(instance){
				if (instance.isTypeOf && instance.isTypeOf('MUI.Spinner')) spinner = instance.el.spinner;
			});
			if (!spinner) return;
			var count = spinner.retrieve("count");
			spinner.store("count", count ? count + 1 : 1).show();
			return;
		}
		if (instance && instance.showSpinner) instance.showSpinner();
	}

});

var NamedClass = function(name, members){
	members.className = name;
	members.isTypeOf = function(cName){
		if (cName == this.className) return true;
		if (!this.constructor || !this.constructor.parent) return false;
		return this.isTypeOf.apply(this.constructor.parent.prototype, cName);
	};
	return new Class(members);
};

function fixPNG(myImage){
	if (Browser.ie6 && document.body.filters){
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
		return Function.attempt(function(){
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

			var sourcePath = MUI.replacePaths(source);
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
