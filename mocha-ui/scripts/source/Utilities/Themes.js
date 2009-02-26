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

	},

	/*
	
	Function: themeInit
		Initialize a theme. This is experimental and not fully implemented yet.
		
	*/	
	init: function(newTheme){
		this.newTheme = newTheme.toLowerCase();
		if (!this.newTheme || this.newTheme == null || this.newTheme == this.options.theme.toLowerCase()) return;
				
		if ($('spinner')) $('spinner').show();

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

		// Delay gives the stylesheets time to take effect. IE6 needs more delay.	
		if (Browser.Engine.trident){
			this.redraw.delay(1250, this);
		}
		else {
			this.redraw.delay(250, this);
		}	
	
	},	
	redraw: function(){

		$$('.replaced').removeClass('replaced');

		// Redraw open windows		
		$$('.mocha').each( function(element){			
			var currentInstance = MochaUI.Windows.instances.get(element.id);
			
			// Convert CSS colors to Canvas colors.
			currentInstance.setColors();							
			currentInstance.drawWindow();			
			
		});

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
