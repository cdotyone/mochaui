/*
 ---

 name: Update

 script: update.js

 description: core content update routines

 copyright: (c) 2010 Contributors in (/AUTHORS.txt).

 license: MIT-style license in (/MIT-LICENSE.txt).

 requires:
 - MochaUI/MUI

 provides: [MUI.updateContent]

 ...
 */

MUI.files[MUI.path.source + 'update.js'] = 'loaded';

/*

updateContent allows controls, windows, and panels to intercept the standard update process.
By adding the following functions to the classes that define them, they can be intercepted.

In each case the expected return result is a boolean value.  A return result True tells
updateContent to perform the standard functionality that it would normally.  A value of
False tells updateContent that the standard functionality can be bypassed.

Each of the functions will be passed the options hash for the initial call to updateContent.

instance.updateStart - this is called when updateContent first starts, it is designed to allow the
	instance the ability to set things like titles and scrollbars.  The return result is ignored
	at this point.

instance.updateClear - this is called when updateContent needs to clear the contents of
	the childElement.  The return result true/false will determine if the childElement is
	cleared by updateContent.

instance.updateContent - this is called after a response has been received and the content of the
	childElement needs to be updated.  The return result true/false will determine if the
	childElement is updated by updateContent.

instance.updateEnd - this is called after the childElement has been updated and the control,
	window, or panel needs to be informed that the update was successful.  The return result
	true/false will determine if control, window, or panel will be informed of the update.

*/

MUI.extend({

	Content:{Providers:{}},

	/*

	 Function: updateContent
	 Replace the content of a window or panel.

	 Arguments:
	 updateOptions - (object)

	 updateOptions:
	 element - The parent window or panel.
	 childElement - The child element of the window or panel receiving the content.
	 method - ('get', or 'post') The way data is transmitted.
	 data - (hash) Data to be transmitted
	 content - (string or element) An html loadMethod option.
	 loadMethod - ('html', 'xhr', or 'iframe')
	 url - Used if loadMethod is set to 'xhr' or 'iframe'.
	 onContentLoaded - (function)

	 */
	updateContent: function(options){

		options = $extend({
			element:		null,
			childElement:	null,
			method:			null,
			data:			null,
			content:		null,
			loadMethod:		null,
			url:			null,
			require:		{},
			onContentLoaded:$empty
		}, options);

		options.require = $extend({
			css: [], images: [], js: [], onload: null
		}, options.require);

		if (!options.element) return;
		var element = options.element;

		if (MUI.get(element).isTypeOf('MUI.Window')){
			options.recipient = 'window';
		}
		else {
			options.recipient = 'panel';
		}

		var instance = element.retrieve('instance');

		var contentEl = instance.contentEl;
		options.contentContainer = options.childElement != null ? options.childElement : instance.contentEl;

		if (!options.loadMethod){
			if (!instance.options.loadMethod){
				if (!options.url){
					options.loadMethod = 'html';
				}
				else {
					options.loadMethod = 'xhr';
				}
			}
			else {
				options.loadMethod = instance.options.loadMethod;
			}
		}

		// -- argument preprocessing override --
		// allow controls to process any custom arguments, titles, scrollbars, etc..
		if(instance!=null && instance.updateStart!=null) instance.updateStart(options);

		// -- content removal --
		// allow controls option to clear their own content
		var removeContent = (options.contentContainer == contentEl);
		if(instance!=null && instance.updateClear!=null) removeContent = instance.updateClear(options);

		// Remove old content.
		if (removeContent){
			contentEl.empty().show();
			// Panels are not loaded into the padding div, so we remove them separately.
			contentEl.getAllNext('.column').destroy();
			contentEl.getAllNext('.columnHandle').destroy();
		}

		// prepare function to fire onContentLoaded event
		options.fireContentLoaded = function(instance,options){
			var fireEvent = true;
			if(instance!=null && instance.updateEnd!=null) fireEvent=instance.updateEnd(options);
			if(fireEvent) {
				if (options.require.js.length || typeof options.require.onload == 'function'){
					new MUI.Require({
						js: options.require.js,
						onload: function(){
							if (Browser.Engine.presto){
								options.require.onload.delay(100);
							}
							else {
								options.require.onload();
							}
							(options.onContentLoaded && options.onContentLoaded != $empty) ? options.onContentLoaded() : instance.fireEvent('contentLoaded', element);
						}.bind(this)
					});
				}
				else {
					(options.onContentLoaded && options.onContentLoaded != $empty) ? options.onContentLoaded() : instance.fireEvent('contentLoaded', element);
				}
			}
		};

		// now perform requests
		if (options.require.css.length || options.require.images.length){
			new MUI.Require({
				css: options.require.css,
				images: options.require.images,
				onload: function(){
					MUI.Content.Providers[options.loadMethod](instance, options);
				}.bind(this)
			});
		} else {
			MUI.Content.Providers[options.loadMethod](instance, options);
		}
	}
			
});

MUI.Content.Providers.xhr = function(instance, options){
	var contentEl = instance.contentEl;
	var contentContainer = options.contentContainer;
	var fireContentLoaded = options.fireContentLoaded;
	new Request.HTML({
		url: options.url,
		update: contentContainer,
		method: options.method != null ? options.method : 'get',
		data: options.data != null ? new Hash(options.data).toQueryString() : '',
		evalScripts: instance.options.evalScripts,
		evalResponse: instance.options.evalResponse,
		onRequest: function(){
			if (options.recipient == 'window' && contentContainer == contentEl){
				instance.showSpinner();
			}
			else if (options.recipient == 'panel' && contentContainer == contentEl && $('spinner')){
				$('spinner').show();
			}
		}.bind(this),
		onFailure: function(response){
			if (contentContainer == contentEl){
				var getTitle = new RegExp('<title>[\n\r\s]*(.*)[\n\r\s]*</title>', 'gmi');
				var error = getTitle.exec(response.responseText);
				if (!error) error = 'Unknown';
				contentContainer.set('html', '<h3>Error: ' + error[1] + '</h3>');
				if (options.recipient == 'window'){
					instance.hideSpinner();
				}
				else if (options.recipient == 'panel' && $('spinner')){
					$('spinner').hide();
				}
			}
		}.bind(this),
		onSuccess: function(){
			contentEl.addClass('pad');
			if (contentContainer == contentEl){
				if (options.recipient == 'window') instance.hideSpinner();
				else if (options.recipient == 'panel' && $('spinner')) $('spinner').hide();
			}
			Browser.Engine.trident4 ? fireContentLoaded.delay(50,this,[instance,options]) : fireContentLoaded(instance,options);
		}.bind(this),
		onComplete: function(){
		}.bind(this)
	}).send();
};

MUI.Content.Providers.json = function(instance, options){
	var contentEl = instance.contentEl;
	var contentContainer = options.contentContainer;

	new Request({
		url: options.url,
		update: contentContainer,
		method: options.method != null ? options.method : 'get',
		data: options.data != null ? new Hash(options.data).toQueryString() : '',
		evalScripts: false,
		evalResponse: false,
		headers: {'Content-Type':'application/json'},
		onRequest: function(){
			if (options.recipient == 'window' && contentContainer == contentEl){
				instance.showSpinner();
			}
			else if (options.recipient == 'panel' && contentContainer == contentEl && $('spinner')){
				$('spinner').show();
			}
		}.bind(this),
		onFailure: function(){
			if (contentContainer == contentEl){
				contentContainer.set('html', '<p><strong>Error Loading XMLHttpRequest</strong></p>');
				if (options.recipient == 'window'){
					instance.hideSpinner();
				}
				else if (options.recipient == 'panel' && $('spinner')){
					$('spinner').hide();
				}
			}
		}.bind(this),
		onException: function(){
		}.bind(this),
		onSuccess: function(json){
			if (contentContainer == contentEl){
				if (contentContainer == contentEl){
					if (options.recipient == 'window') instance.hideSpinner();
					else if (options.recipient == 'panel' && $('spinner')) $('spinner').hide();
				}
				json = JSON.decode(json);
				// calls onLoaded event instead of onContentLoaded
				// onLoaded - event should call updateContent again with loadMethod='html'
				instance.fireEvent('loaded', $A([options.element, json, instance, options]));
			}
		}.bind(this),
		onComplete: function(){
		}.bind(this)
	}).get();
};

MUI.Content.Providers.iframe = function(instance, options){
	var contentEl = instance.contentEl;
	var contentContainer = options.contentContainer;
	var contentWrapperEl = instance.contentWrapperEl;
	var fireContentLoaded = options.fireContentLoaded;
	if (instance.options.contentURL == '' || contentContainer != contentEl){
		return;
	}
	contentEl.removeClass('pad');
	contentEl.setStyle('padding', '0px');
	instance.iframeEl = new Element('iframe', {
		'id': instance.options.id + '_iframe',
		'name': instance.options.id + '_iframe',
		'class': 'mochaIframe',
		'src': options.url,
		'marginwidth': 0,
		'marginheight': 0,
		'frameBorder': 0,
		'scrolling': 'auto',
		'styles': {
			'height': contentWrapperEl.offsetHeight - contentWrapperEl.getStyle('border-top').toInt() - contentWrapperEl.getStyle('border-bottom').toInt(),
			'width': instance.panelEl ? contentWrapperEl.offsetWidth - contentWrapperEl.getStyle('border-left').toInt() - contentWrapperEl.getStyle('border-right').toInt() : '100%'
		}
	}).injectInside(contentEl);

	// Add onload event to iframe so we can hide the spinner and run fireContentLoaded()
	instance.iframeEl.addEvent('load', function(){
		if (options.recipient == 'window') instance.hideSpinner();
		else if (options.recipient == 'panel' && contentContainer == contentEl && $('spinner')) $('spinner').hide();
		Browser.Engine.trident4 ? fireContentLoaded.delay(50,this,[instance,options]) : fireContentLoaded(instance,options);
	}.bind(this));
	if (options.recipient == 'window') instance.showSpinner();
	else if (options.recipient == 'panel' && contentContainer == contentEl && $('spinner')) $('spinner').show();
};

MUI.Content.Providers.html = function(instance, options){
	var contentEl = instance.contentEl;
	var contentContainer = options.contentContainer;
	var fireContentLoaded = options.fireContentLoaded;
	var elementTypes = new Array('element', 'textnode', 'whitespace', 'collection');

	var updateContent = true;
	if(instance!=null && instance.updateContent!=null) updateContent=instance.updateContent(options);

	if(updateContent) {
		if (elementTypes.contains($type(options.content))){
			options.content.inject(contentContainer);
		} else {
			contentContainer.set('html', options.content);
		}
	}

	if (contentContainer == contentEl){
		if (options.recipient == 'window') instance.hideSpinner();
		else if (options.recipient == 'panel' && $('spinner')) $('spinner').hide();
	}
	Browser.Engine.trident4 ? fireContentLoaded.delay(50,this,[instance,options]) : fireContentLoaded(instance,options);
};
