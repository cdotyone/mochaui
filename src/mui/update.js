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

MUI.extend({

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
	 title - (string) Change this if you want to change the title of the window or panel.
	 content - (string or element) An html loadMethod option.
	 loadMethod - ('html', 'xhr', or 'iframe')
	 url - Used if loadMethod is set to 'xhr' or 'iframe'.
	 scrollbars - (boolean)
	 onContentLoaded - (function)

	 */
	updateContent: function(options){

		options = $extend({
			element:		null,
			childElement:	null,
			method:			null,
			data:			null,
			title:			null,
			content:		null,
			loadMethod:		null,
			url:			null,
			scrollbars:	 	null,
			padding:		null,
			require:		{},
			onContentLoaded:$empty
		}, options);

		options.require = $extend({
			css: [], images: [], js: [], onload: null
		}, options.require);

		var args = {};

		if (!options.element) return;
		var element = options.element;

		if (MUI.get(element).isTypeOf('MUI.Window')){
			args.recipient = 'window';
		}
		else {
			args.recipient = 'panel';
		}

		var instance = element.retrieve('instance');
		if (options.title) instance.titleEl.set('html', options.title);

		var contentEl = instance.contentEl;
		args.contentContainer = options.childElement != null ? options.childElement : instance.contentEl;
		var contentWrapperEl = instance.contentWrapperEl;

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

		// Set scrollbars if loading content in main content container.
		// Always use 'hidden' for iframe windows
		var scrollbars = options.scrollbars || instance.options.scrollbars;
		if (args.contentContainer == instance.contentEl){
			contentWrapperEl.setStyles({
				'overflow': scrollbars != false && options.loadMethod != 'iframe' ? 'auto' : 'hidden'
			});
		}

		// Remove old content.
		if (args.contentContainer == contentEl){
			contentEl.empty().show();
			// Panels are not loaded into the padding div, so we remove them separately.
			contentEl.getAllNext('.column').destroy();
			contentEl.getAllNext('.columnHandle').destroy();
		}

		args.onContentLoaded = function(){

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

		};

		if (options.require.css.length || options.require.images.length){
			new MUI.Require({
				css: options.require.css,
				images: options.require.images,
				onload: function(){
					this.loadSelect(instance, options, args);
				}.bind(this)
			});
		}
		else {
			this.loadSelect(instance, options, args);
		}
	},

	loadSelect: function(instance, options, args){

		// Load new content.
		switch (options.loadMethod){
			case 'xhr':
				this.updateContentXHR(instance, options, args);
				break;
			case 'iframe':
				this.updateContentIframe(instance, options, args);
				break;
			case 'json':
				this.updateContentJSON(instance, options, args);
				break;
			case 'html':
			default:
				this.updateContentHTML(instance, options, args);
				break;
		}

	},

	updateContentJSON: function(instance, options, args){
		var contentEl = instance.contentEl;
		var contentContainer = args.contentContainer;

		new Request({
			url: options.url,
			update: contentContainer,
			method: options.method != null ? options.method : 'get',
			data: options.data != null ? new Hash(options.data).toQueryString() : '',
			evalScripts: false,
			evalResponse: false,
			headers: {'Content-Type':'application/json'},
			onRequest: function(){
				if (args.recipient == 'window' && contentContainer == contentEl){
					instance.showSpinner();
				}
				else if (args.recipient == 'panel' && contentContainer == contentEl && $('spinner')){
					$('spinner').show();
				}
			}.bind(this),
			onFailure: function(){
				if (contentContainer == contentEl){
					contentContainer.set('html', '<p><strong>Error Loading XMLHttpRequest</strong></p>');
					if (args.recipient == 'window'){
						instance.hideSpinner();
					}
					else if (args.recipient == 'panel' && $('spinner')){
						$('spinner').hide();
					}
				}
			}.bind(this),
			onException: function(){
			}.bind(this),
			onSuccess: function(json){
				if (contentContainer == contentEl){
					if (contentContainer == contentEl){
						if (args.recipient == 'window') instance.hideSpinner();
						else if (args.recipient == 'panel' && $('spinner')) $('spinner').hide();
					}
					json = JSON.decode(json);
					// calls onLoaded event instead of onContentLoaded
					// onLoaded - event should call updateContent again with loadMethod='html'
					instance.fireEvent('loaded', $A([options.element, json, instance]));
				}
			}.bind(this),
			onComplete: function(){
			}.bind(this)
		}).get();
	},

	updateContentXHR: function(instance, options, args){
		var contentEl = instance.contentEl;
		var contentContainer = args.contentContainer;
		var onContentLoaded = args.onContentLoaded;
		new Request.HTML({
			url: options.url,
			update: contentContainer,
			method: options.method != null ? options.method : 'get',
			data: options.data != null ? new Hash(options.data).toQueryString() : '',
			evalScripts: instance.options.evalScripts,
			evalResponse: instance.options.evalResponse,
			onRequest: function(){
				if (args.recipient == 'window' && contentContainer == contentEl){
					instance.showSpinner();
				}
				else if (args.recipient == 'panel' && contentContainer == contentEl && $('spinner')){
					$('spinner').show();
				}
			}.bind(this),
			onFailure: function(response){
				if (contentContainer == contentEl){
					var getTitle = new RegExp('<title>[\n\r\s]*(.*)[\n\r\s]*</title>', 'gmi');
					var error = getTitle.exec(response.responseText);
					if (!error) error = 'Unknown';
					contentContainer.set('html', '<h3>Error: ' + error[1] + '</h3>');
					if (args.recipient == 'window'){
						instance.hideSpinner();
					}
					else if (args.recipient == 'panel' && $('spinner')){
						$('spinner').hide();
					}
				}
			}.bind(this),
			onSuccess: function(){
				contentEl.addClass('pad');
				if (contentContainer == contentEl){
					if (args.recipient == 'window') instance.hideSpinner();
					else if (args.recipient == 'panel' && $('spinner')) $('spinner').hide();
				}
				Browser.Engine.trident4 ? onContentLoaded.delay(750) : onContentLoaded();
			}.bind(this),
			onComplete: function(){
			}.bind(this)
		}).send();
	},

	updateContentIframe: function(instance, options, args){
		var contentEl = instance.contentEl;
		var contentContainer = args.contentContainer;
		var contentWrapperEl = instance.contentWrapperEl;
		var onContentLoaded = args.onContentLoaded;
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

		// Add onload event to iframe so we can hide the spinner and run onContentLoaded()
		instance.iframeEl.addEvent('load', function(){
			if (args.recipient == 'window') instance.hideSpinner();
			else if (args.recipient == 'panel' && contentContainer == contentEl && $('spinner')) $('spinner').hide();
			Browser.Engine.trident4 ? onContentLoaded.delay(50) : onContentLoaded();
		}.bind(this));
		if (args.recipient == 'window') instance.showSpinner();
		else if (args.recipient == 'panel' && contentContainer == contentEl && $('spinner')) $('spinner').show();
	},

	updateContentHTML: function(instance, options, args){
		var contentEl = instance.contentEl;
		var contentContainer = args.contentContainer;
		var onContentLoaded = args.onContentLoaded;
		var elementTypes = new Array('element', 'textnode', 'whitespace', 'collection');

		contentEl.addClass('pad');
		if (elementTypes.contains($type(options.content))){
			options.content.inject(contentContainer);
		} else {
			contentContainer.set('html', options.content);
		}
		if (contentContainer == contentEl){
			if (args.recipient == 'window') instance.hideSpinner();
			else if (args.recipient == 'panel' && $('spinner')) $('spinner').hide();
		}
		Browser.Engine.trident4 ? onContentLoaded.delay(50) : onContentLoaded();
	}

});