/*
 ---

 script: create.js

 description: core content control creation and plugin loading routines

 copyright: (c) 2010 Contributors in (/AUTHORS.txt).

 license: MIT-style license in (/MIT-LICENSE.txt).

 requires:
 - MochaUI/MUI

 provides: [MUI.create, MUI.load, MUI.addPluginGroup, MUI.loadPluginGroups]

 ...
 */

MUI.append({

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

	load:function(options){
		options.loadOnly = true;
		MUI.create(options);
	},

	create:function(options){
		if (typeOf(options) == 'string') options = {control:options};
		if (!MUI.initialized) MUI.initialize();
		if (this.loadPluginGroups(function(){
			MUI.create(options);
		})) return;

		var name = options.control.replace(/(^MUI\.)/i, '');
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

		if (js.length > 0 && MUI.files[js[0]] == 'loaded' && !options.fromHTML){
			if (config.loadOnly || options.loadOnly) return null;
			var klass = MUI[name];
			var obj = new klass(options);
			if (options.onNew) options.onNew(obj);
			return obj;
		}

		if (options.fromHTML) js.push(path[sname] + cname + '_html.js');

		var css = [];
		if (config.css) css = config.css;
		css.combine(MUI.options.css);
		css = MUI.replaceFields(css, path);

		new MUI.Require({
			'js':js,
			'css':css,
			'onload':function(){
				if (config.loadOnly || options.loadOnly) return;
				var klass = MUI[name];
				var obj = new klass(options);
				if (options.onNew) options.onNew(obj);
				if (options.fromHTML) ret.fromHTML();
			}
		});
		return null;
	}

});
