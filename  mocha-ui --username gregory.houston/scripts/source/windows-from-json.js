/*

Script: Windows-from-json.js
	Create one or more windows from JSON data. You can define all the same properties as you can for new Mocha.Window(). Undefined properties are set to their defaults.

License:
	MIT-style license.	

Syntax: MochaUI.newWindowsFromJSON(properties);

Example:
	
	var url = 'data/json-windows-data.js';
	var request = new Json.Remote(url, {
		onComplete: function(properties) {
			MochaUI.newWindowsFromJSON(properties.windows);
		}
	}).send();

*/

MochaUI.extend({	
	newWindowsFromJSON: function(properties){
		properties.each(function(properties) {
				new MochaUI.Window(properties);
		}.bind(this));
	}
});
