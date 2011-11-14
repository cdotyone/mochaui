/*
 ---

 script: create.js

 description: core content control creation and plugin loading routines

 copyright: (c) 2011 Contributors in (/AUTHORS.txt).

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
				js = js.append(['{' + name + '}mui-' + name + '.js']);
			}
		});
		if (js.length > 0) new MUI.Require({'js':js, 'onload':onload });
		else return false;  // returns false to signal that everything is loaded
		return true;   // returns true to signal that it loading something
	},

	load:function(options){
		// convert none hash parameters to hash
		if (typeOf(options) == 'string') options = {control:options, loadOnly:true,onload:(arguments.length > 0) ? arguments[1] : null};
		if (typeOf(options) == 'array'){
			var controls = [];
			for (var j = 0; j < options.length; j++)
				controls.push({control:options[j]});
			options = {controls:controls, onload:(arguments.length > 1) ? arguments[1] : null, loadOnly:true};
		}
		if (typeOf(options) == 'object'){
			options.loadOnly = true;
		}
		MUI.create(options);
	},

	getControlAssets : function(control, js, css, traversed, name){
		if (typeOf(control) == 'string') control = {control:control};
		if (!traversed) traversed = [control.control];
		if (!name) name = control.control;
		name = name.replace(/(^MUI\.)/i, '');
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
		if (config == null) return {js:js,css:css,config:null};

		// see if we can gather all of the dependency controls
		var dependsOn = config.dependsOn ? config.dependsOn : [];	// add configured dependencies if they exist
		if (config.childNode && control[config.childNode]){			// add child controls of the control has a childnode configured
			var children = control[config.childNode];
			if (typeof(children) != 'array') children = [children];				// some controls allow child nodes to be an array or a single node
			Object.each(control[config.childNode], function(child){
				var controlname = (child.control ? child.control : config.childType);
				if (typeof(controlname) == 'string'){
					traversed.include(controlname);
					MUI.getControlAssets(child, js, css, traversed, controlname);
				}
			})
		}
		// gather dependencies if we have some
		if (dependsOn.length > 0){
			Object.each(dependsOn, function(controlname){
				if (traversed.indexOf(controlname) >= 0 || control.control == controlname) return;  // make sure we do get into a runaway recursion
				MUI.getControlAssets(controlname, js, css, traversed);
			})
		}

		var path = {};
		var sname = MUI.options.pluginGroups[pgName].singularName;
		if (!config.location) config.location = cname;
		path[sname] = '{' + pgName + '}' + config.location + '/';

		if (config.paths) Object.each(config.paths, function(tpath, name){
			MUI.options.path[name] = MUI.replaceFields(tpath, path);
		});

		if (!config.js) js.push(path[sname] + cname + '.js');
		else js.combine(config.js);
		js = MUI.replaceFields(js, path);

		if (config.css) css.combine(config.css);
		css.combine(MUI.options.css);
		css = MUI.replaceFields(css, path);

		return {js:js,css:css,config:config};
	},

	areLoaded: function(listToCheck){
		for (var i = 0; i < listToCheck.length; i++){
			if (MUI.files[listToCheck[i]] != 'loaded') return false;
		}
		return true;
	},

	create:function(options){
		// convert none hash parameters to hash
		if (typeOf(options) == 'string') options = {control:options,onload:(arguments.length > 1) ? arguments[1] : null};
		if (!MUI.initialized) MUI.initialize(); // initialize mocha if needed

		if (this.loadPluginGroups(function(){ // make sure all all plugin/control group configurations are loaded
			MUI.create(options);
		})) return;

		// convert array of plugin names to controls request
		var controls = options.controls;
		if (!controls) controls = [];
		if (typeOf(options) == 'array'){
			for (var j = 0; j < options.length; j++)
				controls.push(options[j]);
			options = {controls:controls,onload:options.onload};
		}

		if (controls.length == 0) controls = [options]; // make sure we have an array for list of controls to load

		// gather all of the assets for the requested controls/plugins
		var r = {js:[],css:[],traversed:(MUI.traversed ? MUI.traversed : [])};
		var config;
		for (var i = 0; i < controls.length; i++){
			if (!controls[i].control) return;
			if (controls[i].fromHTML && controls[i].drawOnInit === undefined) controls[i].drawOnInit = false;
			config = MUI.getControlAssets(controls[i], r.js, r.css, r.traversed).config;
		}

		// if only one control was requested and it is loaded then return it
		if (controls.length == 1 && r.js.length > 0 && this.areLoaded[r.js]){
			if ((config && config.loadOnly) || options.loadOnly){
				if (config.onload) config.onload(config);
				return null;
			}
			var name = controls[0].control.replace(/(^MUI\.)/i, '');
			var klass = MUI[name];
			var obj = new klass(options);
			if (options.onNew) options.onNew(obj);
			if (options.fromHTML && obj.fromHTML) obj.fromHTML(options.content);
			new MUI.Require(r);
			return obj;
		}

		// build a callback function for the assets requested
		r.onload = function(){
			MUI.traversed = (MUI.traversed ? MUI.traversed : []).combine(r.traversed);
			if (this.onload) this.onload(this);

			controls.each(function(control){
				if (control.loadOnly || this.loadOnly) return;
				if (control.onload) control.onload(control);
				var name = control.control.replace(/(^MUI\.)/i, '');
				var klass = MUI[name];
				var obj = new klass(control);
				if (control.onNew) control.onNew(obj);
				if (control.fromHTML && obj.fromHTML) obj.fromHTML(options.content);
			}.bind(this));

		}.bind(options);
		new MUI.Require(r);
	}

});
