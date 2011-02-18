/*
 ---

 script: themes.js

 description: MUI - Allows for switching themes dynamically.

 copyright: (c) 2011 Contributors in (/AUTHORS.txt).

 license: MIT-style license in (/MIT-LICENSE.txt).

 note:
 This documentation is taken directly from the javascript source files. It is built using Natural Docs.

 syntax:
 (start code)
 new MUI.Themes.init(newTheme);
 (end)

 example:
 (start code)
 new MUI.Themes.init('charcoal');
 (end)

 arguments:
 newTheme - (string) The theme name

 requires:
 - Core/Element
 - Core/Class
 - Core/Options
 - Core/Events
 - MUI
 - MUI.Core

 provides: [MUI.Themes]
 ...
 */

MUI.Themes = {

	init: function(newTheme){
		this.newTheme = newTheme.toLowerCase();
		if (!this.newTheme || this.newTheme == null || this.newTheme == MUI.options.theme.toLowerCase()) return false;

		if ($('spinner')) $('spinner').show();

		this.oldURIs = [];
		this.oldSheets = [];
		var themesPath = MUI.replacePaths(MUI.options.path.themes);

		$$('link').each(function(link){
			var href = link.get('href');
			if (href.contains(themesPath + MUI.options.theme)){
				this.oldURIs.push(href);
				this.oldSheets.push(link);
			}
		}.bind(this));

		Object.each(MUI.files, function(value, key){
			if (key.contains(themesPath + MUI.options.theme)){
				this.oldURIs.push(key);
			}
		}.bind(this));

		this.newSheetURLs = this.oldURIs.map(function(item){
			return item.replace('/' + MUI.options.theme + '/', '/' + MUI.Themes.newTheme + '/');
		}.bind(this));

		this.sheetsToLoad = this.oldURIs.length;
		this.sheetsLoaded = 0;

		// Download new stylesheets and add them to an array
		this.newSheets = [];
		this.newSheetURLs.each(function(link){
			var href = link;
			var cssRequest = new Request({
				method: 'get',
				url: href,
				onComplete: function(){
					var newSheet = new Element('link', {
						'rel': 'stylesheet',
						'media': 'screen',
						'type': 'text/css',
						'href': href
					});
					this.newSheets.push(newSheet);
				}.bind(this),
				onFailure: function(){
					this.themeLoadSuccess = false;
					if ($('spinner')) $('spinner').hide();
					MUI.notification('Stylesheets did not load.');
				},
				onSuccess: function(){
					this.sheetsLoaded++;
					if (this.sheetsLoaded == this.sheetsToLoad){
						this.updateThemeStyleSheets();
						this.themeLoadSuccess = true;
					}
				}.bind(this)
			});
			cssRequest.send();

		}.bind(this));

		return true;
	},

	updateThemeStyleSheets: function(){

		this.oldSheets.each(function(sheet){
			sheet.destroy();
		});

		this.newSheets.each(function(sheet){
			MUI.files[sheet.get('href')] = 1;
			sheet.inject(document.head);
		});

		// Delay gives the stylesheets time to take effect. IE6 needs more delay.
		if (Browser.ie){
			this.redraw.delay(1250, this);
		} else {
			this.redraw.delay(250, this);
		}

	},

	redraw: function(){

		$$('.replaced').removeClass('replaced');

		// Redraw open windows
		$$('.mocha').each(function(element){
			var instance = element.retrieve('instance');

			// Convert CSS colors to Canvas colors.
			instance._setColors();
			instance.redraw();
		});

		if (MUI.taskbar) MUI.taskbar.setTaskbarColors();

		// Reformat layout
		if (MUI.Desktop && MUI.Desktop.desktop){
			var checker = (function(){
				// Make sure the style sheets are really ready.
				if (MUI.Desktop.desktop.getStyle('overflow') != 'hidden'){
					return;
				}
				clearInterval(checker);
				MUI.Desktop.setDesktopSize();
			}).periodical(50);
		}

		if ($('spinner')) $('spinner').hide();
		MUI.options.theme = this.newTheme;
	}
};