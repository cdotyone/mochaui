/*

Script: Arrange-tile.js
	Cascade windows.

Authors:
	Harry Roberts and Greg Houston

License:
	MIT-style license.	

Requires:
	Core.js, Window.js

Syntax:
	(start code)
	MochaUI.arrangeTile();
	(end)

*/
 
MochaUI.extend({
	arrangeTile: function(){
		var x = 10;
		var y = 10;
	
		var instances =  MochaUI.Windows.instances;

		var windowsNum = 0;

		instances.each(function(instance){
			if (!instance.isMinimized && !instance.isMaximized){
				windowsNum++;
			}
		});

		var cols = 3;
		var rows = Math.ceil(windowsNum / cols);
		
		var coordinates = document.getCoordinates();
	
		var col_width = ((coordinates.width - this.options.viewportLeftOffset) / cols);
		var col_height = ((coordinates.height - this.options.viewportTopOffset) / rows);
		
		var row = 0;
		var col = 0;
		
		instances.each(function(instance){
			if (!instance.isMinimized && !instance.isMaximized){
				
				var content = instance.contentWrapperEl;
				var content_coords = content.getCoordinates();
				var window_coords = instance.windowEl.getCoordinates();
				
				// Calculate the amount of padding around the content window
				var padding_top = content_coords.top - window_coords.top;
				var padding_bottom = window_coords.height - content_coords.height - padding_top;
				var padding_left = content_coords.left - window_coords.left;
				var padding_right = window_coords.width - content_coords.width - padding_left;

				/*

				// This resizes the windows
				if (instance.options.shape != 'gauge' && instance.options.resizable == true){
					var width = (col_width - 3 - padding_left - padding_right);
					var height = (col_height - 3 - padding_top - padding_bottom);

					if (width > instance.options.resizeLimit.x[0] && width < instance.options.resizeLimit.x[1]){
						content.setStyle('width', width);
					}
					if (height > instance.options.resizeLimit.y[0] && height < instance.options.resizeLimit.y[1]){
						content.setStyle('height', height);
					}

				}*/

				var left = (x + (col * col_width));
				var top = (y + (row * col_height));

				instance.windowEl.setStyles({
					'left': left,
					'top': top
				});

				instance.drawWindow(instance.windowEl);

				MochaUI.focusWindow(instance.windowEl);

				if (++col === cols) {
					row++;
					col = 0;
				}
			}
		}.bind(this));
	}
});