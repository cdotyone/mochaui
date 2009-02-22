/*

Script: Themes.js
	Allows for switching themes dynamically.

Copyright:
	Copyright (c) 2007-2009 Greg Houston, <http://greghoustondesign.com/>.	

License:
	MIT-style license.

Requires:
	Core.js
	
Notes:
	Themes are new and experimental.	
	
Syntax:
	(start code)
	new MochaUI.Themes.themeInit(newTheme);
	(end)
	
Example:
	(start code)
	new MochaUI.Themes.themeInit('charcoal');
	(end)		

Arguments:
	newTheme - (string) The theme name	

*/
	
MochaUI.Themes = {
	options: {
		themesDir:      'themes',    // Path to themes directory
		theme:          'default'
	
		// stylesheets:    []	
		// currentStylesheets: [],
		// stylesheetCount:    0,
	},
	themableWindowOptions: ['headerStartColor','headerStopColor','bodyBgColor','minimizeBgColor','minimizeColor','maximizeBgColor',
		'maximizeColor','closeBgColor','closeColor','resizableColor'],	
	/*
	
	Function: themeInit
		Initialize a theme. This is experimental and not fully implemented yet.
		
	*/	
	init: function(newTheme){
		this.newTheme = newTheme.toLowerCase();
		if (!this.newTheme || this.newTheme == null) return;
		
		if ($('spinner')) $('spinner').show();		
		
		// Store the current options so we can compare them to currently open windows.
		// Windows with different options than these will keep their settings since the defaults were overridden
		// when these windows were created.
		MochaUI.Windows.windowOptionsPrevious = new Hash($merge(MochaUI.Windows.windowOptions));
		
		// Run theme init file		
		new Asset.javascript(this.options.themesDir + '/' + this.newTheme + '/theme-init.js');	
						
	},
	changeTheme: function(){

		if (this.newTheme == this.options.theme.toLowerCase()) {
			this.updateThemeSettings();			
			return;
		}

		/* Add old style sheets to an array */
		this.oldSheets = [];
		$$('link').each( function(link){
			var href = this.options.themesDir + '/' + this.newTheme + '/css/' + link.id.substring(3) +'.css';			
			if (link.href.contains(href)) return;
			
			if (link.id.substring(0,3) == 'css') {
				this.oldSheets.push(link);				
			}
		}.bind(this));
	
		this.sheetsToLoad = this.oldSheets.length;
		this.sheetsLoaded = 0;
		
		/* Download new stylesheets and add them to an array */
		this.newSheets = [];
		this.oldSheets.each( function(link){
			var href = this.options.themesDir + '/' + this.newTheme + '/css/' + link.id.substring(3) +'.css';
								
				var id = link.id;
				
				var cssRequest = new Request({
					method: 'get',
					url: href,
					onComplete: function(response) { 
						var newSheet = new Element('link', {
							'id': id,
							'rel': 'stylesheet',
							'media': 'screen',
							'type': 'text/css',
							'href': href
						});
						this.newSheets.push(newSheet);											
					}.bind(this),
					onFailure: function(response){
						this.themeLoadSuccess = false;
						if ($('spinner')) $('spinner').hide();						
						MochaUI.notification('Stylesheets did not load.');						
					},					
					onSuccess: function(){						
						this.sheetsLoaded++;
						if (this.sheetsLoaded == this.sheetsToLoad) {
							this.updateThemeStylesheets();
							this.themeLoadSuccess = true;
						}  
					}.bind(this)
				});
				cssRequest.send();				

		}.bind(this));
								
	},
	updateThemeStylesheets: function(){

		this.oldSheets.each( function(sheet){
			sheet.destroy();
		});

		this.newSheets.each( function(sheet){
			sheet.inject(document.head);
		});

		this.updateThemeSettings();
	
	},
	updateThemeSettings: function(){

		// Reset original options
		$extend(MochaUI.Windows.windowOptions, $merge(MochaUI.Windows.windowOptionsOriginal));

		// Set new options defined in the theme init file
		MochaUI.newWindowOptions.each( function(value, key){							
			if (this.themableWindowOptions.contains(key)) {
				eval('MochaUI.Windows.windowOptions.' + key + ' = value');
			}
		}.bind(this));
		
		this.redraw.delay(200, this); // Delay gives the stylesheets time to take effect.		

	},	
	redraw: function(){

		// Redraw open windows		
		$$('.mocha').each( function(element){			
			var currentInstance = MochaUI.Windows.instances.get(element.id);		
						
			new Hash(currentInstance.options).each( function(value, key){							
				if (this.themableWindowOptions.contains(key)){					

					/*
					if (eval('MochaUI.Windows.windowOptions.' + key + ' == null') && eval('MochaUI.Windows.windowOptionsOriginal.' + key + ' == null')){
						eval('currentInstance.options.' + key + ' = null');
						return;	
					}
					*/					

					if ($type(value) == 'array'){						
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
							
			currentInstance.drawWindow();			
			
		}.bind(this));

		// Reformat layout
		if (MochaUI.Desktop.desktop){
			var checker = (function(){
				// Make sure the style sheets are really ready.				
				if (MochaUI.Desktop.desktop.getStyle('overflow') != 'hidden'){					
					return;
				}
				$clear(checker);								
				MochaUI.Desktop.setDesktopSize();				
			}).periodical(50);
		}
		
		if ($('spinner')) $('spinner').hide();		
		this.options.theme = this.newTheme;
						
	}
};
