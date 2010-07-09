/*
 ---

 name: window-from-html

 script: window-from-html.js

 description: MUI - Create windows from html markup in page.

 copyright: (c) 2010 Contributors in (/AUTHORS.txt).

 license: MIT-style license in (/MIT-LICENSE.txt).

 note:
 This documentation is taken directly from the javascript source files. It is built using Natural Docs.

 example:
 HTML markup.
 (start code)
 <div class="mocha" id="mywindow" style="width:300px;height:255px;top:50px;left:350px">
 <h3 class="mochaTitle">My Window</h3>
 <p>My Window Content</p>
 </div>
 (end)

 requires:
 - Core/Element
 - Core/Class
 - Core/Options
 - Core/Events
 - MUI
 - MUI.Core
 - MUI.Window

 provides: [newWindowsFromHTML]
 ...
 */

MUI.files['utils|window-from-html.js'] = 'loaded';

MUI.extend({

	newWindowsFromHTML: function(){

		$$('.mocha').each(function(el){
			// Get the window title and destroy that element, so it does not end up in window content
			if (Browser.Engine.presto || Browser.Engine.trident5){
				el.hide(); // Required by Opera, and probably IE7
			}
			var title = el.getElement('h3.mochaTitle');

			if (Browser.Engine.presto) el.show();

			var elDimensions = el.getStyles('height', 'width');
			var properties = {
				id: el.getProperty('id'),
				height: elDimensions.height.toInt(),
				width: elDimensions.width.toInt(),
				x: el.getStyle('left').toInt(),
				y: el.getStyle('top').toInt()
			};

			// If there is a title element, set title and destroy the element so it does not end up in window content
			if (title){
				properties.title = title.innerHTML;
				title.destroy();
			}

			// Get content and destroy the element
			properties.content = el.innerHTML;
			el.destroy();

			// Create window
			new MUI.Window(properties, true);
		}.bind(this));
	}

});
