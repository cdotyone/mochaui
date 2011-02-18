/*
 ---

 script: core.js

 description: MUI - A Web Applications User Interface Framework.

 copyright: (c) 2010 Contributors in (/AUTHORS.txt).

 license: MIT-style license in (/MIT-LICENSE.txt).

 requires:
 - Core/Array
 - Core/Element
 - Core/Browser
 - Core/Request
 - Core/Request.HTML
 - More/Hash
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

		themes: ['Default','Charcoal'],

		css:	 ['{theme}css/core.css'],				// default list of css files to load, added to requirements of every control and plugin loaded

		defaultJsonProvider: 'json'						// the default json provider chosen for controls that require json and not loadMethod was selected

	}
});

MUI.append({
	version: '1.0.0',
	initialized: false,
	instances: new Hash(),
	registered: new Hash(),
	idCount: 0,
	ieSupport: 'excanvas',					// Makes it easier to switch between Excanvas and Moocanvas for testing
	path: MUI.options.path,					// depreciated, will be removed

	initialize: function(options){
		if (options){
			if (options.path) options.path = Object.append(MUI.options.path, options.path);
			if (options.css) options.css = Object.append(MUI.options.css, options.css);
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

				if (values[name] == null) return;
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

	files: new Hash({'{source}Core/core.js': 'loaded'}),

	getID: function(el){
		var type = typeOf(el);
		if (type == 'string') return el;
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
		var t=typeof(el);
		var instance;
		if(el.each) t='array';
		switch(t) {
			case 'array':
				el.each(function(el) {
					MUI.erase(el)
				});
				break;
			case 'element':
				el=$(el);
				if(el.getChildren) {
					if(!instance) instance=MUI.instances[MUI.getID(el)];
					MUI.instances.erase(MUI.getID(el));
					MUI.erase($(el).getChildren());
				}
				break;
			default:
				el=MUI.getID(el);
				instance = MUI.instances[el];
				MUI.instances.erase(el);
		}
		if(instance && instance.dispose) {
			instance.dispose();
			delete instance;
			return null;
		}
		return instance;
	},

	each: function(func){
		Object.each(this.instances, func);
		return this;
	},

	reloadIframe: function(iframe){
		var src = $(iframe).src;
		Browser.firefox ? $(iframe).src = src : top.frames[iframe].location.reload(true);
	},

	notification: function(message){
		MUI.create({
			control: 'MUI.Window',
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
	},

	register: function(namespace, funcs, depth){
		try{
			if (typeof(funcs) == 'function'){
				if (namespace) MUI.registered[namespace] = funcs;
				return;
			}
			if (depth == null) depth = 4;
			if (depth < 0) return;
			for (var name in funcs){
				if (name == '') continue;
				var func = funcs[name];
				if (typeOf(func) != 'function' || name.substr(0, 1) == '_') continue;
				if (typeOf(func) == 'object'){
					MUI.register(namespace + '.' + name, func, depth - 1);
					return;
				}
				MUI.registered[namespace + '.' + name] = func;
			}
		} catch(e){
		}
	},

	getRegistered: function(bind, name, args){
		return function(ev){
			MUI.registered[name].apply(bind, [ev].append(args));
		};
	},

	getWrappedEvent: function(bind, func, args){
		return function(ev){
			func.apply(bind, [ev].append(args));
		};
	},

	getPartnerLoader: function(bind, content){
		return function(ev){
			ev.stop();
			if ($(content.element)) MUI.Content.update(content);
		};
	},

	getDefaultJsonProvider: function(value) {
		if(value=='json' || value=='jsonp' ) return value;
		return MUI.options.defaultJsonProvider;
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
			return this;
		}

		this.setStyle('display', 'none');
		return this;
	},

	show: function(){
		var instance = MUI.get(this.id);
		if (instance != null && instance.show != null){
			instance.show();
			return this;
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
	},

	empty: function() {
		MUI.erase(this)
		Array.from(this.childNodes).each(Element.dispose);
		return this;
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
		return Function.attempt(function(){
			return new ActiveXObject('MSXML2.XMLHTTP');
		}, function(){
			return new XMLHttpRequest();
		});
	};

}
