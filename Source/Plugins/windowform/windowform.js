/*
 ---

 name: WindowForm

 script: windowform.js

 description: Create a window from a form.

 copyright: (c) 2011 Contributors in (/AUTHORS.txt).

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

 provides: [MUI.WindowForm]

 ...
 */

MUI.WindowForm = new NamedClass('MUI.WindowForm', {

	Implements: [Events, Options],

	options: {
		id: null,
		title: 'New Window',
		loadMethod: 'html',
		content: '',
		contentURL: 'pages/lipsum.html',
		type: 'window',
		width: 300,
		height: 125,
		scrollbars: true,
		x: null,
		y: null
	},

	initialize: function(options){
		this.setOptions(options);
		this.options.id = 'win' + (++MUI.idCount);
		this.options.title = $('newWindowHeaderTitle').value;

		if ($('htmlLoadMethod').checked){
			this.options.loadMethod = 'html';
		}
		if ($('iframeLoadMethod').checked){
			this.options.loadMethod = 'iframe';
		}
		this.options.content = $('newWindowContent').value;

		// Remove eval(), javascript:, and script from User Provided Markup
		this.options.content = this.options.content.replace(/\<(.*)script(.*)\<\/(.*)script(.*)\>/g, "");
		this.options.content = this.options.content.replace(/[\"\'][\s]*javascript:(.*)[\"\']/g, "\"\"");
		this.options.content = this.options.content.replace(/eval\((.*)\)/g, "");

		if ($('newWindowContentURL').value){
			this.options.contentURL = $('newWindowContentURL').value;
		}

		if ($('newWindowModal').checked){
			this.options.type = 'modal';
		}

		this.options.width = $('newWindowWidth').value.toInt();
		this.options.height = $('newWindowHeight').value.toInt();
		this.options.x = $('newWindowX').value.toInt();
		this.options.y = $('newWindowY').value.toInt();
		new MUI.Window(this.options);
	}

});
