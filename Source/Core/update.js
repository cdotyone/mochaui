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

MUI.files['source|Update.js'] = 'loaded';

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

instance.updateSetContent - this is called after a response has been received and the content of the
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
     section - used to name the section being update, such as 'content,'toolbar','header','footer'
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
            section:        null,
			require:		{},
			onContentLoaded:$empty
		}, options);

		options.require = $extend({
			css: [], images: [], js: [], onload: null
		}, options.require);

		if (!options.element) return;
		var element = $(options.element);
		var instance = element.retrieve('instance');

		if (options.url) options.url = MUI.replacePaths(options.url);

		var contentEl = instance == null ? element : instance.el.content;
		options.contentContainer = options.childElement != null ? options.childElement : contentEl;

		if (!options.loadMethod){
			if (instance==null || instance.options == null || !instance.options.loadMethod){
				if (!options.url) options.loadMethod = 'html';
				else options.loadMethod = 'xhr';
			} else {
				options.loadMethod = instance.options.loadMethod;
			}
		}

		if (!options.section) options.section = 'content';

		// -- argument pre-processing override --
		// allow controls to process any custom arguments, titles, scrollbars, etc..
		if (instance && instance.updateStart) instance.updateStart(options);

		// -- content removal --
		// allow controls option to clear their own content
		var removeContent = (options.contentContainer == contentEl);
		if (instance && instance.updateClear) removeContent = instance.updateClear(options);

		// Remove old content.
		if (removeContent){
			contentEl.empty().show();
			// Panels are not loaded into the padding div, so we remove them separately.
			contentEl.getAllNext('.column').destroy();
			contentEl.getAllNext('.columnHandle').destroy();
		}

		// prepare function to fire onContentLoaded event
		options.fireContentLoaded = function(event, instance, options, json){
			var fireEvent = true;
			if (instance && instance.updateEnd) fireEvent = instance.updateEnd(options);
			if (fireEvent){
				if (options.require.js.length || typeof options.require.onload == 'function'){
					new MUI.Require({
						js: options.require.js,
						onload: function(){
							if (Browser.Engine.presto) options.require.onload.delay(100);
							else options.require.onload();
							if (options.onContentLoaded && options.onContentLoaded != $empty){
								options.onContentLoaded(element,options,json)
							} else {
								if (instance) instance.fireEvent(event, [element,options,json]);
							}
						}.bind(this)
					});
				} else {
					if (options.onContentLoaded && options.onContentLoaded != $empty){
						options.onContentLoaded(element,options,json)
					} else {
						if (instance) instance.fireEvent(event, [element,options,json]);
					}
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
	var contentContainer = options.contentContainer;
	var fireContentLoaded = options.fireContentLoaded;
	new Request({
		url: options.url,
		method: options.method ? options.method : 'get',
		data: options.data ? new Hash(options.data).toQueryString() : '',
		evalScripts: false,
		evalResponse: false,
		onRequest: function(){
			contentContainer.showSpinner(instance);
		},
		onFailure: function(response){
			var getTitle = new RegExp('<title>[\n\r\s]*(.*)[\n\r\s]*</title>', 'gmi');
			var error = getTitle.exec(response.responseText);
			if (!error) error = [500, 'Unknown'];

			var updateSetContent = true;
			options.error = error;
			options.errorMessage = '<h3>Error: ' + error[1] + '</h3>';
			if (instance && instance.updateSetContent) updateSetContent=instance.updateSetContent(options);
			if (updateSetContent) contentContainer.set('html', options.errorMessage);

			contentContainer.hideSpinner(instance);
		},
		onSuccess: function(text){
			contentContainer.hideSpinner(instance);

			var js;
			var html = text.stripScripts(function(script){ js = script; });

			// convert text files to html
			if (this.getHeader('Content-Type') == 'text/plain') html=html.replace(/\n/g,'<br>');  

			var updateSetContent = true;
			options.content = html;
			if (instance && instance.updateSetContent) updateSetContent=instance.updateSetContent(options);
			if (updateSetContent){
				contentContainer.set('html', options.content);
				var evalJS = true;
				if (instance && instance.options && instance.options.evalScripts) evalJS = instance.options.evalScripts;
				if (evalJS && js) Browser.exec(js);
			}
			
			Browser.Engine.trident4 ? fireContentLoaded.delay(50, this, ['contentLoaded', instance,options]) : fireContentLoaded('contentLoaded', instance,options);
		},
		onComplete: function(){
		}
	}).send();
};

MUI.Content.Providers.json = function(instance, options){
	var fireContentLoaded = options.fireContentLoaded;
	var contentContainer = options.contentContainer;

	if(options.content) {
		Browser.Engine.trident4 ? fireContentLoaded.delay(50, this, ['loaded', instance, options, options.content]) : fireContentLoaded('loaded', instance, options, options.content);
		return;
	}

	new Request({
		url: options.url,
		update: contentContainer,
		method: options.method ? options.method : 'get',
		data: options.data ? new Hash(options.data).toQueryString() : '',
		evalScripts: false,
		evalResponse: false,
		headers: {'Content-Type':'application/json'},
		onRequest: function(){
			contentContainer.showSpinner(instance);
		}.bind(this),
		onFailure: function(){
			var updateSetContent = true;
			options.error=[500, 'Error Loading XMLHttpRequest'];
			options.errorMessage = '<p><strong>Error Loading XMLHttpRequest</strong></p>';
			if (instance && instance.updateSetContent) updateSetContent = instance.updateSetContent(options);
			if (updateSetContent) contentContainer.set('html', options.errorMessage);

			contentContainer.hideSpinner(instance);
		}.bind(this),
		onException: function(){
		}.bind(this),
		onSuccess: function(json){
			json = JSON.decode(json);
			// calls onLoaded event instead of onContentLoaded
			// onLoaded - event should call updateContent again with loadMethod='html'

			contentContainer.hideSpinner(instance);
			Browser.Engine.trident4 ? fireContentLoaded.delay(50, this, ['loaded', instance, options, json]) : fireContentLoaded('loaded', instance, options, json);
		}.bind(this),
		onComplete: function(){
		}.bind(this)
	}).get();
};

MUI.Content.Providers.iframe = function(instance, options){
	var fireContentLoaded = options.fireContentLoaded;

	var updateSetContent = true;
	if (instance && instance.updateSetContent) updateSetContent = instance.updateSetContent(options);
	var contentContainer = options.contentContainer;
	
	if (updateSetContent){
		var iframeEl = new Element('iframe', {
			'id': options.element.id + '_iframe',
			'name': options.element.id + '_iframe',
			'class': 'mochaIframe',
			'src': options.url,
			'marginwidth': 0,
			'marginheight': 0,
			'frameBorder': 0,
			'scrolling': 'auto',
			'styles': {
				'height': contentContainer.offsetHeight - contentContainer.getStyle('border-top').toInt() - contentContainer.getStyle('border-bottom').toInt(),
				'width': instance && instance.el.panel ? contentContainer.offsetWidth - contentContainer.getStyle('border-left').toInt() - contentContainer.getStyle('border-right').toInt() : '100%'
			}
		}).inject(contentContainer);
		if (instance) instance.iframeEl = iframeEl;

		// Add onload event to iframe so we can hide the spinner and run fireContentLoaded()
		iframeEl.addEvent('load', function(){
			contentContainer.hideSpinner(instance);
			Browser.Engine.trident4 ? fireContentLoaded.delay(50, this, ['contentLoaded', instance, options]) : fireContentLoaded('contentLoaded', instance, options);
		}.bind(this));
	}

	contentContainer.showSpinner(instance);
};

MUI.Content.Providers.html = function(instance, options){
	var fireContentLoaded = options.fireContentLoaded;
	var elementTypes = new Array('element', 'textnode', 'whitespace', 'collection');

	var updateSetContent = true;
	if (instance && instance.updateSetContent) updateSetContent = instance.updateSetContent(options);
	var contentContainer = options.contentContainer;
	if (updateSetContent){
		if (elementTypes.contains($type(options.content))) options.content.inject(contentContainer);
		else contentContainer.set('html', options.content);
	}

	contentContainer.hideSpinner(instance);
	Browser.Engine.trident4 ? fireContentLoaded.delay(50, this, ['contentLoaded', instance, options]) : fireContentLoaded('contentLoaded', instance, options);
};

MUI.extend({

	WindowPanelShared: {

		/// intercepts workflow from updateContent
		/// sets title and scroll bars of this window
		updateStart: function(options){
			if (options.section == 'content'){
				// copy padding from main options if not passed in
				if (!options.padding && this.options.padding && $type(this.options.padding)!='number')
					options.padding = $extend(options, this.options.padding);
				if (!options.padding && this.options.padding && $type(this.options.padding)=='number')
					options.padding = {top:this.options.padding,left:this.options.padding,right:this.options.padding,bottom:this.options.padding};

				// update padding if requested
				if (options.padding) this.el.content.setStyles({
					'padding-top': options.padding.top,
					'padding-bottom': options.padding.bottom,
					'padding-left': options.padding.left,
					'padding-right': options.padding.right
				});

				// set title if given option to do so
				if (options.title && this.el && this.el.title){
					this.options.title = options.title;
					this.el.title.set('html', options.title);
				}

				// Set scrollbars if loading content in main content container.
				// Always use 'hidden' for iframe windows
				this.el.contentWrapper.setStyles({
					'overflow': this.options.scrollbars && options.loadMethod != 'iframe' ? 'auto' : 'hidden'
				});
			}
			return false;  // not used but expected
		},

		/// intercepts workflow from MUI.updateContent
		updateClear: function(options){
			if (options.section == 'content'){
				this.el.content.show();
				var iframes = this.el.contentWrapper.getElements('.mochaIframe');
				if (iframes) iframes.destroy();
			}
			return true;
		},

		/// intercepts workflow from MUI.updateContent
		updateSetContent: function(options){
			if (options.section == 'content'){
				if (options.loadMethod == 'html') this.el.content.addClass('pad');
				if (options.loadMethod == 'iframe'){
					this.el.content.removeClass('pad');
					this.el.content.setStyle('padding', '0px');
					this.el.content.hide();
					options.contentContainer = this.el.contentWrapper;
				}
			}
			return true;	// tells MUI.updateContent to update the content
		}

	}

});
