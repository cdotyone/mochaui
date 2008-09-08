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
	viewportTopOffset:  30,    // Use a negative number if neccessary to place first window where you want it
	viewportLeftOffset: 20,
	windowTopOffset:    50,    // Initial vertical spacing of each window
	windowLeftOffset:   40     // Initial horizontal spacing of each window	
});

MochaUI.extend({   
	arrangeCascade: function(){
		// See how much space we have to work with
		var coordinates = document.getCoordinates();
		
		var openWindows = 0;
		MochaUI.Windows.instances.each(function(instance){
			if (!instance.isMinimized) openWindows ++; 
		});
		
		if ((this.options.windowTopOffset * (openWindows + 1)) >= (coordinates.height - this.options.viewportTopOffset)) {
			var topOffset = (coordinates.height - this.options.viewportTopOffset) / (openWindows + 1);
		}
		else {
			var topOffset = this.options.windowTopOffset;
		}
		
		if ((this.options.windowLeftOffset * (openWindows + 1)) >= (coordinates.width - this.options.viewportLeftOffset - 20)) {
			var leftOffset = (coordinates.width - this.options.viewportLeftOffset - 20) / (openWindows + 1);
		}
		else {
			var leftOffset = this.options.windowLeftOffset;
		}

		var x = this.options.viewportLeftOffset;
		var y = this.options.viewportTopOffset;
		$$('div.mocha').each(function(windowEl){
			var currentWindowClass = MochaUI.Windows.instances.get(windowEl.id);
			if (!currentWindowClass.isMinimized && !currentWindowClass.isMaximized){
				id = windowEl.id;
				MochaUI.focusWindow(windowEl);
				x += leftOffset;
				y += topOffset;

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
