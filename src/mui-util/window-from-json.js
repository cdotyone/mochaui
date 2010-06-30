/*
 ---

 name: window-from-json

 script: window-from-json.js

 description: MUI - Create one or more windows from JSON data. You can define all the same properties as you can for new MUI.Window(). Undefined properties are set to their defaults.

 copyright: (c) 2010 Contributors in (/AUTHORS.txt).

 license: MIT-style license in (/MIT-LICENSE.txt).

 note:
 This documentation is taken directly from the javascript source files. It is built using Natural Docs.

 example:
 (start code)
 MUI.jsonWindows = function(){
	var url = 'data/json-windows-data.js';
 	var request = new Request.JSON({
		url: url,
		method: 'get',
		onComplete: function(properties) {
			MUI.newWindowsFromJSON(properties.windows);
 		}
	}).send();
 }
 (end)

 requires:
 - Core/Element
 - Core/Class
 - Core/Options
 - Core/Events
 - MUI
 - MUI.Core
 - MUI.Window

 provides: [newWindowsFromJSON]
 ...
 */

MUI.files['utils|window-from-json.js'] = 'loaded';

MUI.extend({

	newWindowsFromJSON: function(newWindows){

		newWindows.each(function(options){
			var temp = new Hash(options);

			temp.each(function(value, key){
				if ($type(value) != 'string') return;
				if (value.substring(0, 8) == 'function'){
					eval("options." + key + " = " + value);
				}
			});

			new MUI.Window(options);
		});

	}

});
