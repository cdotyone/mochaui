/*
 ---

 name: Window-tile

 script: window-tile.js

 description: MUI - Tile windows.

 copyright: (c) 2010 Contributors in (/AUTHORS.txt).

 license: MIT-style license in (/MIT-LICENSE.txt).

 note:
 This documentation is taken directly from the javascript source files. It is built using Natural Docs.

 requires:
 - Core/Element
 - Core/Class
 - Core/Options
 - Core/Events
 - MUI
 - MUI.Core

 provides: [MUI.arrangeTile]
 ...
 */

MUI.files['utils|window-tile.js'] = 'loaded';

MUI.extend({

	arrangeTile: function(){

		var viewportTopOffset = 30;    // Use a negative number if neccessary to place first window where you want it
		var viewportLeftOffset = 20;

		var x = 10;
		var y = 80;

		var windowsNum = 0;

		MUI.each(function(instance){
			if (instance.className != 'MUI.Window') return;
			if (!instance.isMinimized && !instance.isMaximized){
				windowsNum++;
			}
		});

		var cols = 3;
		var rows = Math.ceil(windowsNum / cols);

		var coordinates = document.getCoordinates();

		var col_width = ((coordinates.width - viewportLeftOffset) / cols);
		var col_height = ((coordinates.height - viewportTopOffset) / rows);

		var row = 0;
		var col = 0;

		MUI.each(function(instance){
			if (instance.className != 'MUI.Window') return;
			if (!instance.isMinimized && !instance.isMaximized && instance.options.draggable){

				var left = (x + (col * col_width));
				var top = (y + (row * col_height));

				instance.drawWindow();

				MUI.focusWindow(instance.el.windowEl);

				if (MUI.options.advancedEffects == false){
					instance.el.windowEl.setStyles({
						'top': top,
						'left': left
					});
				}
				else {
					var tileMorph = new Fx.Morph(instance.el.windowEl, {
						'duration': 550
					});
					tileMorph.start({
						'top': top,
						'left': left
					});
				}

				if (++col === cols){
					row++;
					col = 0;
				}
			}
		}.bind(this));
	}
	
});
