/*
 ---

 script: Content.js

 description: core content update routines

 copyright: (c) 2010 Contributors in (/AUTHORS.txt).

 license: MIT-style license in (/MIT-LICENSE.txt).

 requires:
 - MochaUI/MUI

 provides: [MUI.Content.update]

 ...
 */

MUI.files['{source}Core/Content.js'] = 'loaded';

MUI.Content = Object.append((MUI.Content || {}), {

	Providers: {},

	Filters: {},

	update: function(options){

		// set defaults for options
		options = Object.append({
			instance:		null,			// the instance of the control to be updated, this is normally used internally only
			element:		null,			// the element to inject into, or the instance name
			method:			null,			// the method to use to make request, 'POST' or 'GET'
			data:			null,			// the data payload to send to the url
			content:		null,			// used to feed content instead of requesting from a url endpoint
			loadMethod:		null,			// the provider that will be used to make the request
			url:			null,			// the url endpoint to make the request to
			prepUrl:		null,			// callback that is executed to prepare the url. syntax: prepUrl.run([url,values,instance],this) return url;
			require:		{},				// used to add additional css, images, or javascript
			paging:			{},				// used to specify paging parameters
			filters:		[],				// used to make post request processing/filtering of data, can be used to convert request to JSON
			persist:		false			// true if you want to persist the request, false if you do not.
			// if it is a string value the string will be used to persist the data instead of the request URL.
			// if it is an array, it will assume the array is an array of strings and each string represents a cache key that is also the name of a hash value that needs to cached individually.
			//onLoaded:		null			// fired when content is loaded
		}, options);

		// set defaults for require option
		options.require = Object.append({
			css: [],			// the style sheets to load before the request is made
			images: [],			// the images to preload before the request is made
			js: [],				// the JavaScript that is loaded and called after the request is made
			onload: function(){
			}// the event that is fired after all required files are loaded
		}, options.require);

		// set defaults for paging
		options.paging = Object.append({
			size:			0,			// if >0 then paging is turned on
			index:			0,			// the page index offset (index*size)+1 = first record, (index*size)+size = last record
			totalCount:		0,			// is set by return results, starts out as zero until filled in when data is received
			sort:			'',			// fields to search by, comma separated list of fields or array of strings.  Will be passed to server end-point.
			dir:			'asc',		// 'asc' ascending, 'desc' descending
			recordsField:	'records',	// 'element' in the json hash that contains the data
			lookAhead:		0,			// # of pages to request in the background and cache
			wrap:			false		// true if you want paging to wrap when user hits nextpage and they are at the last page, or from the first to the last page
		}, options.paging);

		// make sure loadMethod has a value
		if (!options.loadMethod){
			if (instance == null || instance.options == null || !instance.options.loadMethod){
				if (!options.url) options.loadMethod = 'html';
				else options.loadMethod = 'xhr';
			} else {
				options.loadMethod = instance.options.loadMethod;
			}
		}

		var element,instance = options.instance;
		if (options.element){
			element = $(options.element);
			if (!instance) instance = element.retrieve('instance');
		}

		// replace in path replacement fields,  and prepare the url
		if (options.url){
			// create standard field replacements from data, paging, and path hashes
			var values = Object.merge(options.data || {}, options.paging || {}, MUI.options.path || {});
			// call the prepUrl callback if it was defined
			if (options.prepUrl) options.url = options.prepUrl.apply(this, [options.url, values, instance]);
			options.url = MUI.replaceFields(options.url, values);
		}

		options.contentContainer = element;

		// -- argument pre-processing override --
		// allow controls to process any custom arguments, titles, scrollbars, etc..
		if (instance && instance.updateStart) instance.updateStart(options);

		// -- content removal --
		// allow controls option to clear their own content
		var removeContent = true;
		if (instance && instance.updateClear) removeContent = instance.updateClear(options);

		// Remove old content.
		if (removeContent && element) options.contentContainer.empty().show();

		// prepare function to persist the data
		if (options.persist && MUI.Content.Providers[options.loadMethod].canPersist){
			options.persistKey = options.url;
			// if given string to use as persist key then use it
			if (typeOf(options.persist) == 'string') options.persistKey = options.persist;
			if (typeOf(options.persist) == 'array') options.persistKey = options.persist;
			options.persist = true;
		} else options.persist = false;

		options.persistLoad = function(options){
			if (options.persist){
				if (typeOf(options.persistKey) == 'string'){
					// load the response
					var content = MUI.Persist.get(options.persistKey);
					if (content) return content;
				}
			}
			return options.content;
		};

		options.persistStore = function(options, response){
			if (!options.persist) return response;

			// store the response
			if (typeOf(options.persistKey) == 'string') MUI.Persist.set(options.persistKey, response);
			if (typeOf(options.persistKey) == 'array'){
				response = JSON.decode(response);
				options.persistKey.each(function(key){
					MUI.Persist.set(key, response[key]);
				});
				return null;
			}
			return response;
		};

		// prepare function to fire onLoaded event
		options.fireLoaded = function(instance, options, json){
			var fireEvent = true;
			if (instance && instance.updateEnd) fireEvent = instance.updateEnd(options);
			if (fireEvent){
				if (options.require.js.length){
					// process javascript dependencies
					new MUI.Require({
						js: options.require.js,
						onload: function(){
							if (Browser.opera) options.require.onload.delay(100);
							else options.require.onload();
							if (options.onLoaded && options.onLoaded != null){
								options.onLoaded(element, options, json);
							} else {
								if (instance) instance.fireEvent('loaded', [element, options, json]);
							}
						}.bind(this)
					});
				} else {
					if (options.onLoaded && options.onLoaded != null){
						// call onLoaded directly
						options.onLoaded(element, options, json);
					} else {
						// fire the event
						if (instance) instance.fireEvent('loaded', [element, options, json]);
					}
				}
			}
		};

		// now perform dependencies requests for images and style sheets
		if (options.require.css.length || options.require.images.length){
			new MUI.Require({
				css: options.require.css,
				images: options.require.images,
				onload: function(){
					MUI.Content.Providers[options.loadMethod].doRequest(instance, options);
				}.bind(this)
			});
		} else {
			MUI.Content.Providers[options.loadMethod].doRequest(instance, options);
		}

		return options;
	},

	processFilters: function(response, options){
		options.filters.each(function(filter){
			response = filter(response, options);
		});
		return response;
	},

	firstPage: function(options){
		if (!options.fireLoaded || !options.paging || options.paging.size <= 0 || options.paging.totalCount == 0) return options;
		options.paging.index = 0;
		MUI.Content.Providers[options.loadMethod].doRequest(instance, options);
	},

	prevPage: function(options){
		if (!options.fireLoaded || !options.paging || options.paging.size <= 0 || options.paging.totalCount == 0) return options;
		options.paging.index--;
		if (options.paging.index < 1 && options.paging.wrap) return this.lastPage(options);
		if (options.paging.index < 1) options.paging.index = 1;
		MUI.Content.Providers[options.loadMethod].doRequest(instance, options);
	},

	nextPage: function(options){
		if (!options.fireLoaded || !options.paging || options.paging.size <= 0 || options.paging.totalCount == 0) return options;
		options.paging.index++;
		var lastPage = Math.round(options.paging.totalCount / options.paging.size);
		if (options.paging.index > lastPage && options.paging.wrap) return this.firstPage();
		if (options.paging.index > lastPage) options.paging.index = lastPage;
		MUI.Content.Providers[options.loadMethod].doRequest(instance, options);
	},

	lastPage: function(options){
		if (!options.fireLoaded || !options.paging || options.paging.size <= 0 || options.paging.totalCount == 0) return options;
		options.paging.index = Math.round(options.paging.totalCount / options.paging.size);
		MUI.Content.Providers[options.loadMethod].doRequest(instance, options);
	},

	getRecords: function(options){
		var paging = options.paging;
		if (!options.fireLoaded || !paging || paging.size <= 0 || paging.totalCount == 0) return options.content;
		var records;
		if (!paging.recordsField) records = options.content;
		else records = options.content[paging.recordsField];

		var retval = [];
		for (var i = (paging.index * paging.size),t = 0; i < paging.size && i < records.length; i++,t++){
			retval[t] = records[i];
		}
		return retval;
	}

});

MUI.updateContent = MUI.Content.update;

MUI.Content.Filters.tree = function(response, options, node){
	var usePaging = node == null && options.paging && options.paging.size > 0 && options.paging.recordsField;
	var data = response, i;

	if (node == null) options = Object.append(options, {
		fieldParentID: 'parentID',
		fieldID: 'ID',
		fieldNodes: 'nodes',
		topID: '0'
	});

	if (usePaging) data = response[options.paging.recordsField];

	if (node == null){
		for (i = 0; i < data.length; i++){
			if (data[i][options.fieldID] == options.topID){
				node = data[i];
				break;
			}
		}
	}

	if (node != null){
		var id = node[options.fieldID];
		node[options.fieldNodes] = [];
		for (i = 0; i < data.length; i++){
			if (data[i][options.fieldParentID] == id && data[i][options.fieldID] != id){
				node[options.fieldNodes].push(data[i]);
				MUI.Content.Filters.tree(data, options, data[i]);
			}
		}
	}

	if (usePaging) response[options.paging.recordsField] = node;

	return node;
};

MUI.Content.Providers.xhr = {

	canPersist:		true,

	canPage:		false,

	doRequest: function(instance, options){
		var contentContainer = options.contentContainer;
		var fireLoaded = options.fireLoaded;

		// if js is required, but no url, fire loaded to proceed with js-only
		if (options.url == null && options.require.js && options.require.js.length != 0){
			Browser.ie6 ? fireLoaded.delay(50, this, [instance, options]) : fireLoaded(instance, options);
			return null;
		}

		// load persisted data if it exists
		var content = options.persistLoad(options);

		// process content passed to options.content or persisted data
		if (content){
			content = MUI.Content.processFilters(content, options);
			Browser.ie6 ? fireLoaded.delay(50, this, [instance, options, content]) : fireLoaded(instance, options, content);
			return;
		}

		new Request({
			url: options.url,
			method: options.method ? options.method : 'get',
			data: options.data ? new Hash(options.data).toQueryString() : '',
			evalScripts: function(script){options.javascript = script;},
			evalResponse: false,
			onRequest: function(){
				if (contentContainer) contentContainer.showSpinner(instance);
			},
			onFailure: function(response){
				var getTitle = new RegExp('<title>[\n\r\s]*(.*)[\n\r\s]*</title>', 'gmi');
				var error = getTitle.exec(response.responseText);
				if (!error) error = [500, 'Unknown'];

				var updateSetContent = true;
				options.error = error;
				options.errorMessage = '<h3>Error: ' + error[1] + '</h3>';
				if (instance && instance.updateSetContent) updateSetContent = instance.updateSetContent(options);
				if (contentContainer){
					if (updateSetContent) contentContainer.set('html', options.errorMessage);
					contentContainer.hideSpinner(instance);
				}
			},
			onSuccess: function(text){
				text = options.persistStore(options, text);
				text = MUI.Content.processFilters(text, options);
				if (contentContainer) contentContainer.hideSpinner(instance);

				var js = options.javascript, html = text;

				// convert text files to html
				if (this.getHeader('Content-Type') == 'text/plain') html = html.replace(/\n/g, '<br>');

				var updateSetContent = true;
				options.content = html;
				if (instance && instance.updateSetContent) updateSetContent = instance.updateSetContent(options);
				if (updateSetContent){
					if (contentContainer) contentContainer.set('html', options.content);
					var evalJS = true;
					if (instance && instance.options && instance.options.evalScripts) evalJS = instance.options.evalScripts;
					if (evalJS && js) Browser.exec(js);
				}

				Browser.ie6 ? fireLoaded.delay(50, this, [instance,options]) : fireLoaded(instance, options);
			},
			onComplete: function(){
			}
		}).send();

	}

};

MUI.Content.Providers.json = {

	canPersist:		true,

	canPage:		 true,

	doRequest: function(instance, options){
		var fireLoaded = options.fireLoaded;
		var contentContainer = options.contentContainer;

		// load persisted data if it exists
		var content = options.persistLoad(options);

		// process content passed to options.content or persisted data
		if (content){
			content = MUI.Content.processFilters(content, options);
			Browser.ie6 ? fireLoaded.delay(50, this, [instance, options, content]) : fireLoaded(instance, options, content);
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
				if (contentContainer) contentContainer.showSpinner(instance);
			}.bind(this),
			onFailure: function(){
				var updateSetContent = true;
				options.error = [500, 'Error Loading XMLHttpRequest'];
				options.errorMessage = '<p><strong>Error Loading XMLHttpRequest</strong></p>';
				if (instance && instance.updateSetContent) updateSetContent = instance.updateSetContent(options);

				if (contentContainer){
					if (updateSetContent) contentContainer.set('html', options.errorMessage);
					contentContainer.hideSpinner(instance);
				}
			}.bind(this),
			onException: function(){
			}.bind(this),
			onSuccess: function(json){
				json = options.persistStore(options, json);
				if (json != null){	// when multiple results are persisted, null is returned.  decoding takes place in persistStore instead, and filtering is not allowed
					json = JSON.decode(json);
					json = MUI.Content.processFilters(json, options);
				}
				options.content = json;

				if (contentContainer) contentContainer.hideSpinner(instance);
				Browser.ie6 ? fireLoaded.delay(50, this, [instance, options, json]) : fireLoaded(instance, options, json);
			}.bind(this),
			onComplete: function(){
			}.bind(this)
		}).send();
	}

};

MUI.Content.Providers.iframe = {

	canPersist:		false,

	canPage:		false,

	doRequest: function(instance, options){
		var fireLoaded = options.fireLoaded;

		var updateSetContent = true;
		if (instance && instance.updateSetContent) updateSetContent = instance.updateSetContent(options);
		var contentContainer = options.contentContainer;

		if (updateSetContent && contentContainer){
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
			if (instance) instance.el.iframe = iframeEl;

			// Add onload event to iframe so we can hide the spinner and run fireLoaded()
			iframeEl.addEvent('load', function(){
				contentContainer.hideSpinner(instance);
				Browser.ie6 ? fireLoaded.delay(50, this, [instance, options]) : fireLoaded(instance, options);
			}.bind(this));
		}
	}

};

MUI.Content.Providers.html = {

	canPersist:		false,

	canPage:		false,

	doRequest: function(instance, options){
		var fireLoaded = options.fireLoaded;
		var elementTypes = new Array('element', 'textnode', 'whitespace', 'collection');


		var updateSetContent = true;
		if (instance && instance.updateSetContent) updateSetContent = instance.updateSetContent(options);
		var contentContainer = options.contentContainer;
		if (updateSetContent && contentContainer){
			if (elementTypes.contains(typeOf(options.content))) options.content.inject(contentContainer);
			else contentContainer.set('html', options.content);
		}

		Browser.ie6 ? fireLoaded.delay(50, this, [instance, options]) : fireLoaded(instance, options);
	}

};

MUI.append({

	WindowPanelShared: {

		/// intercepts workflow from MUI.Content.update
		/// sets title and scroll bars of this window
		updateStart: function(options){
			if (!options.position) options.position = 'content';
			if (options.position == 'content'){
				options.contentContainer = this.el.content;
				this.addPadding(options);

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

		/// intercepts workflow from MUI.Content.update
		updateClear: function(options){
			if (options.position == 'content'){
				this.el.content.show();
				var iframes = this.el.contentWrapper.getElements('.mochaIframe');
				if (iframes) iframes.destroy();

				// Panels are not loaded into the padding div, so we remove them separately.
				this.el.content.getAllNext('.column').destroy();
				this.el.content.getAllNext('.columnHandle').destroy();
			}
			return true;
		},

		/// intercepts workflow from MUI.Content.update
		updateSetContent: function(options){
			if (options.position == 'content'){
				if (options.loadMethod == 'html') this.el.content.addClass('pad');
				if (options.loadMethod == 'iframe'){
					this.el.content.removeClass('pad');
					this.el.content.setStyle('padding', '0px');
					this.el.content.hide();
					options.contentContainer = this.el.contentWrapper;
				}
			}
			return true;	// tells MUI.Content.update to update the content
		},

		addPadding: function(options){
			if (!options) options = Object.clone(this.options);

			if (options.padding == null) options.padding = this.options.padding;
			if (options.padding || options.padding == 0){
				// copy padding from main options if not passed in
				if (typeOf(options.padding) != 'number')
					Object.append(options.padding, this.options.padding);
				if (typeOf(options.padding) == 'number')
					options.padding = {top: options.padding, left: options.padding, right: options.padding, bottom: options.padding};

				// update padding if requested
				this.el.content.setStyles({
					'padding-top': options.padding.top,
					'padding-bottom': options.padding.bottom,
					'padding-left': options.padding.left,
					'padding-right': options.padding.right
				});
			}
			return this;
		},

		removePadding: function(){
			this.el.content.setStyle('padding', 0);
			return this;
		},

		empty: function(){
			this.el.content.empty();
			return this;
		},

		getSection: function(section){
			var retval;
			this.sections.each(function(s){
				if (s.section == section) retval = s;
			});
			return retval;
		}
	}
});
