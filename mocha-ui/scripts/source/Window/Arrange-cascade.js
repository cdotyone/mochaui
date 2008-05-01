/*

Script: Arrange-cascade.js
	Cascade windows.
	
Copyright:
	Copyright (c) 2007-2008 Greg Houston, <http://greghoustondesign.com/>.	

License:
	MIT-style license.	

Requires:
	Core.js, Window.js
	
Syntax:
	(start code)
	MochaUI.arrangeCascade();
	(end)

*/

MochaUI.options.extend({
	desktopTopOffset:  30,    // Use a negative number if neccessary to place first window where you want it
	desktopLeftOffset: 20,
	mochaTopOffset:    50,    // Initial vertical spacing of each window
	mochaLeftOffset:   40     // Initial horizontal spacing of each window	
});

MochaUI.extend({   
	arrangeCascade: function(){
		var x = this.options.desktopLeftOffset;
		var y = this.options.desktopTopOffset;
		$$('div.mocha').each(function(windowEl){
			var currentWindowClass = MochaUI.Windows.instances.get(windowEl.id);
			if (!currentWindowClass.isMinimized && !currentWindowClass.isMaximized){
				id = windowEl.id;
				MochaUI.focusWindow(windowEl);
				x += this.options.mochaLeftOffset;
				y += this.options.mochaTopOffset;

				if (MochaUI.options.useEffects == false){
					windowEl.setStyles({
						'top': y,
						'left': x
					});
				}
				else {
					var cascadeMorph = new Fx.Morph(windowEl, {
						'duration': 550
					});
					cascadeMorph.start({
						'top': y,
						'left': x
					});
				}
			}
		}.bind(this));
	}
});
