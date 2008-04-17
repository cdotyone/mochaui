/*

Script: Window-from-form.js
	Create a window from a form.

License:
	MIT-style license.
	
Requires:
	Core.js, Window.js
	
See Also:
	<Window>	

*/

MochaUI.WindowForm = new Class({
	options: {
		id: null,
		title: 'New Window',
		loadMethod: 'html', // html, xhr, or iframe
		content: '', // used if loadMethod is set to 'html'
		contentURL: 'pages/lipsum.html', // used if loadMethod is set to 'xhr' or 'iframe'
		modal: false,
		width: 300,
		height: 125,
		scrollbars: true, // true sets the overflow to auto and false sets it to hidden
		x: null, // if x or y is null or modal is false the new window is centered in the browser window
		y: null
	},
	initialize: function(options){
		this.setOptions(options);
		this.options.id = 'win' + (++MochaUI.windowIDCount);
		this.options.title = $('newWindowHeaderTitle').value;
		if ($('htmlLoadMethod').checked){
			this.options.loadMethod = 'html';
		}
		if ($('xhrLoadMethod').checked){
			this.options.loadMethod = 'xhr';
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
		if ($('newWindowModal').checked) {
			this.options.modal = true;
		}
		this.options.width = $('newWindowWidth').value.toInt();
		this.options.height = $('newWindowHeight').value.toInt();	
		this.options.x = $('newWindowX').value.toInt();
		this.options.y = $('newWindowY').value.toInt();
		new MochaUI.Window(this.options);
	}
});
MochaUI.WindowForm.implement(new Options);
