/*

Script: Dock.js
	Allows for switching themes dynamically.

Copyright:
	Copyright (c) 2007-2009 Greg Houston, <http://greghoustondesign.com/>.	

License:
	MIT-style license.

Requires:
	Core.js

*/

MochaUI.options.extend({
		themesDir:      'themes',    // Path to themes directory - Experimental
		theme:          'default'    // Experimental
		// stylesheets:    []	
});

MochaUI.Windows.themable = ['headerStartColor','headerStopColor','bodyBgColor','minimizeBgColor','minimizeColor','maximizeBgColor',
							'maximizeColor','closeBgColor','closeColor','resizableColor'];
MochaUI.extend({
	// currentStylesheets: [],
	// stylesheetCount:    0,
	/*
	
	Function: themeInit
		Initialize a theme. This is experimental and not fully implemented yet.
		
	*/	
	themeInit: function(newTheme){
		if (newTheme != null && newTheme != this.options.theme){
			this.options.theme = newTheme;
		}
		
		// Store the current options so we can compare them to currently open windows.
		// Windows with different options than these will keep their settings since the defaults were overridden
		// when these windows were created.
		MochaUI.Windows.windowOptionsPrevious = new Hash($merge(MochaUI.Windows.windowOptions));
		
		// Run theme init file		
		new Asset.javascript(this.options.themesDir + '/' + this.options.theme + '/theme-init.js', {id: 'themeInitFile'});		
						
	},
	themeChange: function(){

		// Reset original options
		$extend(MochaUI.Windows.windowOptions, $merge(MochaUI.Windows.windowOptionsOriginal));

		// Set new options defined in the theme init file
		// Undefined options that are null in the original need to be set to null!!!!
		MochaUI.newWindowOptions.each( function(value, key){							
			if (MochaUI.Windows.themable.contains(key)) {
				eval('MochaUI.Windows.windowOptions.' + key + ' = value');
			}
		});
		
		// Get all header stylesheets whose title starts with 'css' and redirect them to the proper theme folder.
		$$('link').each( function(link){
			var href = this.options.themesDir + '/' + this.options.theme + '/css/' + link.id.substring(3) +'.css';			
			if (link.href.contains(href)) return;
			if (link.id.substring(0,3) == 'css') {
				link.href = href;				
			}
		}.bind(this));
		
		// There is a bug in IE that if you dynamically upload more than one style sheet at a time
		// you will get a '1 item remaining' message that stays in the status bar indefinitely, and the page will
		// not re-render until you click on it. The following hack fixes this issue.
		if (Browser.Engine.trident) {
			new Asset.javascript('blank.js');
		}
		
		// Redraw open windows
		
		$$('.mocha').each( function(element){			
			var currentInstance = MochaUI.Windows.instances.get(element.id);		
						
			new Hash(currentInstance.options).each( function(value, key){							
				if (this.Windows.themable.contains(key)) {					

					/*
					if (eval('MochaUI.Windows.windowOptions.' + key + ' == null') && eval('MochaUI.Windows.windowOptionsOriginal.' + key + ' == null')){
						eval('currentInstance.options.' + key + ' = null');
						return;	
					}
					*/					

					if ($type(value) == 'array') {						
						// If it is an rgb color
						if (MochaUI.Windows.windowOptionsPrevious.get(key).rgbToHex() == null) return;
						if (MochaUI.Windows.windowOptionsPrevious.get(key).rgbToHex().substring(1) != value.rgbToHex().substring(1)) 
							return;
						eval('currentInstance.options.' + key + ' = MochaUI.Windows.windowOptions.' + key);
					}
					
					/*
					else if ($type(value) == 'string'){
						// If it is a hex color
						if (MochaUI.Windows.windowOptionsPrevious.get(key).substring(1) != value.substring(1)) 
							return;							
						eval('currentInstance.options.' + key + ' = MochaUI.Windows.windowOptions.' + key);											
					}
					*/					
				}								
			}.bind(this));
						
			currentInstance.drawWindow(currentInstance.windowEl);
		}.bind(this));	
						
	}
});
