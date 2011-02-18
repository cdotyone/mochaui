/*
 ---

 name: TextArea - Load From HTML

 script: textarea_html.js

 description: MUI - Creates a textarea that can dynamically size itself control.

 copyright: (c) 2011 Contributors in (/AUTHORS.txt).

 license: MIT-style license in (/MIT-LICENSE.txt).

 authors:
 - Chris Doty (http://polaropposite.com/)
 - Amadeus Demarzi (http://enmassellc.com/)

 note:
 This documentation is taken directly from the javascript source files. It is built using Natural Docs.

 credits:
 All of the textarea scroll detection and sizing code came from DynamicTextArea by Amadeus Demarzi
 the code is marked as such as best as I could, and any copyrights to those sections of code belong
 to him.

 requires:
 - Core/Element
 - Core/Class
 - Core/Options
 - Core/Events
 - MUI
 - MUI.Core

 provides: [MUI.TextArea]
 ...
 */

MUI.TextArea.implement({

	fromHTML: function(){
		var self = this,o = this.options;

		var inp = $(o.id);
		if (!inp) return self;
		self.element = inp;

		if (inp.get('type')) o.type = inp.get('type');
		o.value = inp.get('defaultValue');
		if (inp.get('class')) o.cssClass = inp.get('class');

		self.draw();
		return self;
	}

});
