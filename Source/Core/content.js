/*
 ---

 script: content.js

 description: core content update routines

 copyright: (c) 2011 Contributors in (/AUTHORS.txt).

 license: MIT-style license in (/MIT-LICENSE.txt).

 requires:
 - MochaUI/MUI
 - Core/Request
 - More/Request.JSONP

 provides: [MUI.Content]

 ...
 */

MUI.Content = Object.append((MUI.Content || {}), {

	Providers: {},

	Filters: {},

	callBacks: {},

	update: function(content){

		// set defaults for options
		/*		content = Object.append({
		 instance:		null,			// the instance of the control to be updated, this is normally used internally only
		 element:		null,			// the element to inject into, or the instance name
		 method:		null,			// the method to use to make request, 'POST' or 'GET'
		 data:			null,			// the data payload to send to the url
		 content:		null,			// used to feed content instead of requesting from a url endpoint
		 clear:			false,			// setting to true forces current content to be cleared
		 loadMethod:	null,			// the provider that will be used to make the request
		 url:			null,			// the url endpoint to make the request to
		 prepUrl:		null,			// callback that is executed to prepare the url. syntax: prepUrl.run([url,values,instance],this) return url;
		 require:		{},				// used to add additional css, images, or javascript
		 paging:		{},				// used to specify paging parameters
		 filters:		[],				// used to make post request processing/filtering of data, can be used to convert request to JSON
		 persist:		false			// true if you want to persist the request, false if you do not.
		 // if it is a string value the string will be used to persist the data instead of the request URL.
		 // if it is an array, it will assume the array is an array of strings and each string represents a cache key that is also the name of a hash value that needs to cached individually.
		 //onLoaded:		null			// fired when content is loaded
		 }, content);*/

		// set defaults for require option
		content.require = Object.append({
			css: [],			// the style sheets to load before the request is made
			images: [],			// the images to preload before the request is made
			js: [],				// the JavaScript that is loaded and called after the request is made
			onload: function(){
			}// the event that is fired after all required files are loaded
		}, content.require);

		// set defaults for paging
		content.paging = Object.append(MUI.Content.PagingOptions, content.paging);

		// detect subcontrol content
		if (content.control){
			if (!content.options) content.options = {};
			if (content.url) content.options.url = content.url;
			if (content.loadMethod) content.options.loadMethod = content.loadMethod;
			content.loadMethod = 'control';
		}

		// make sure loadMethod has a value
		if (!content.loadMethod){
			if (instance == null || instance.options == null || !instance.options.loadMethod){
				if (!content.url) content.loadMethod = 'html';
				else content.loadMethod = 'xhr';
			} else {
				content.loadMethod = instance.options.loadMethod;
			}
		}

		var instance = content.instance;
		var element = content.element = $(content.element);
		if (!instance && element) instance = element.retrieve('instance');
		content.instance = instance;

		// -- argument pre-processing override --
		// allow controls to process any custom arguments, titles, scrollbars, etc..
		if (instance && instance.updateStart) instance.updateStart(content);

		// no content or url and not a subcontrol? nothing else to do beyond this point
		if (!content.url && !content.content && content.loadMethod != 'control'){
			if (content.clear){
				if (instance && instance.updateClear) removeContent = instance.updateClear(content);
				if (element) element.empty().show();
			}
			return content;
		}

		// replace in path replacement fields,  and prepare the url
		content.doPrepUrl = (function(prepUrl){
			return function(content){
				if (content.url){
					// create standard field replacements from data, paging, and path hashes
					var values = Object.merge(content.data || {}, content.paging || {}, MUI.options.path || {});
					// call the prepUrl callback if it was defined
					if (prepUrl) return prepUrl.apply(this, [content.url, values, instance]);
					return MUI.replaceFields(content.url, values);
				}
			};
		})(content.prepUrl);

		// -- content removal --
		// allow controls option to clear their own content
		var removeContent = content.clear;
		if (instance && instance.updateClear) removeContent = instance.updateClear(content);

		// Remove old content.
		if (removeContent && element) element.empty().show();

		// prepare function to persist the data
		if (content.persist && MUI.Content.Providers[content.loadMethod].canPersist){
			// if given string to use as persist key then use it
			if (typeOf(content.persist) == 'string') content.persistKey = content.persist;
			if (typeOf(content.persist) == 'array') content.persistKey = content.persist;
			content.persist = true;
		} else content.persist = false;

		content.persistLoad = function(){
			this.persistKey = this.doPrepUrl(this);
			if (this.persist){
				if (typeOf(this.persistKey) == 'string'){
					// load the response
					var content = MUI.Persist.get(this.persistKey, this.url);
					if (content) return content;
				}
			}
			return this.content;
		}.bind(content);

		content.persistStore = function(response){
			if (!this.persist) return response;

			// store the response
			if (typeOf(this.persistKey) == 'string') MUI.Persist.set(this.persistKey, response, this.url);
			if (typeOf(this.persistKey) == 'array'){
				response = JSON.decode(response);
				this.persistKey.each(function(key){
					MUI.Persist.set(key, response[key], this.url);
				}, this);
				return null;
			}
			return response;
		}.bind(content);

		// prepare function to fire onLoaded event
		content.fireLoaded = function(){
			var fireEvent = true;
			var instance = this.instance;
			if (instance && instance.updateEnd) fireEvent = instance.updateEnd(this);
			if (fireEvent){
				if (this.require.js.length){
					// process javascript dependencies
					new MUI.Require({
						js: this.require.js,
						onload: function(){
							if (Browser.opera) this.require.onload.delay(100);
							else this.require.onload();
							if (this.onLoaded && this.onLoaded != null){
								this.onLoaded(element, this);
							} else {
								if (instance) instance.fireEvent('loaded', [element, this]);
							}
						}.bind(this)
					});
				} else {
					if (this.onLoaded && this.onLoaded != null){
						// call onLoaded directly
						this.onLoaded(element, this);
					} else {
						// fire the event
						if (instance) instance.fireEvent('loaded', [element, this]);
					}
				}
			}
		}.bind(content);

		// now perform dependencies requests for images and style sheets
		if (content.require.css.length || content.require.images.length){
			new MUI.Require({
				css: content.require.css,
				images: content.require.images,
				onload: function(){
					MUI.Content.Providers[this.loadMethod].doRequest(this);
				}.bind(content)
			});
		} else {
			MUI.Content.Providers[content.loadMethod].doRequest(content);
		}

		return content;
	},

	processFilters: function(content){
		if (typeof content == 'string') return content;
		Object.each(content.filters, function(filter){
			content.content = filter(content.content, content);
		});
		return content.content;
	},

	canPage:function(content){
		return !(!content || !content.fireLoaded || !content.paging || content.paging.pageSize <= 0 || content.paging.total == 0);
	},

	firstPage: function(content){
		if (!MUI.Content.canPage(content)) return this;
		content.paging.page = 1;
		if (content.instance && content.instance.updateStart) content.instance.updateStart(content);
		MUI.Content.Providers[content.loadMethod].doRequest(content);
		return this;
	},

	prevPage: function(content){
		if (!MUI.Content.canPage(content)) return this;
		content.paging.page--;
		if (content.paging.page < 1 && content.paging.wrap) return this.lastPage(content);
		if (content.paging.page < 1) content.paging.page = 1;
		if (content.instance && content.instance.updateStart) content.instance.updateStart(content);
		MUI.Content.Providers[content.loadMethod].doRequest(content);
		return this;
	},

	nextPage: function(content){
		if (!MUI.Content.canPage(content)) return this;
		content.paging.page++;
		var lastPage = Math.round(content.paging.total / content.paging.pageSize);
		if (content.paging.page > lastPage && content.paging.wrap) return this.firstPage();
		if (content.paging.page > lastPage) content.paging.page = lastPage;
		if (content.instance && content.instance.updateStart) content.instance.updateStart(content);
		MUI.Content.Providers[content.loadMethod].doRequest(content);
		return this;
	},

	lastPage: function(content){
		if (!MUI.Content.canPage(content)) return this;
		content.paging.page = Math.round(content.paging.total / content.paging.pageSize);
		if (content.instance && content.instance.updateStart) content.instance.updateStart(content);
		MUI.Content.Providers[content.loadMethod].doRequest(content);
		return this;
	},

	gotoPage: function(content, page){
		if (!MUI.Content.canPage(content)) return this;
		if (!page) page = 1;
		page = parseInt('' + page);
		var lastPage = parseInt(content.paging.total / content.paging.pageSize);
		if (page > lastPage) page = lastPage;
		if (page < 1) page = 1;
		content.paging.page = page;
		if (content.instance && content.instance.updateStart) content.instance.updateStart(content);
		MUI.Content.Providers[content.loadMethod].doRequest(content);
		return this;
	},

	setPageSize: function(content, max){
		var paging = content.paging;
		if (!MUI.Content.canPage(content)) return this;
		max = parseInt('' + max);
		if (max <= 0) return this;
		paging.pageSize = max;
		paging.page = 1;
		paging.pageMax = parseInt(paging.total / paging.pageSize);
		if (content.instance && content.instance.updateStart) content.instance.updateStart(content);
		MUI.Content.Providers[content.loadMethod].doRequest(content);
		return this;
	},

	setRecords: function(content){
		if (!content.content) return null;
		var paging = content.paging;

		var records;
		if (!paging || !paging.recordsField || !content.content[paging.recordsField]) records = content.content;
		else records = content.content[paging.recordsField];

		['total','page','pageMax','pageSize','page','last','first'].each(function(options, name){
			options.paging[name] = MUI.getData(options.content, options.paging[name + 'Field'], 0);
		}.bind(this, content));
		delete content.content;

		if (!content.fireLoaded || !paging || paging.pageSize <= 0)
			return content.records = records;

		if (!content.records) content.records = records;
		else {
			for (var i = 0,t = ((paging.page - 1) * paging.pageSize); i < records.length; i++,t++){
				content.records[t] = records[i];
			}
		}
	},

	getRecords: function(content){
		var records = content.records;
		if (!records) return null;
		var paging = content.paging;

		if (!content.fireLoaded || !paging || paging.pageSize <= 0) return records;

		var retval = [];
		for (var i = ((paging.page - 1) * paging.pageSize),t = 0; t < paging.pageSize && i < records.length; i++,t++){
			retval[t] = records[i];
		}
		return retval;
	}

});

MUI.Content.Filters.tree = function(response, content, node){
	var usePaging = node == null && content.paging && content.paging.size > 0 && content.paging.recordsField;
	var data = response, i;

	if (node == null) content = Object.append(content, {
		fieldParentID: 'parentID',
		fieldID: 'ID',
		fieldNodes: 'nodes',
		topID: '0'
	});

	if (usePaging) data = response[content.paging.recordsField];

	if (node == null){
		for (i = 0; i < data.length; i++){
			if (data[i][content.fieldID] == content.topID){
				node = data[i];
				break;
			}
		}
	}

	if (node != null){
		var id = node[content.fieldID];
		node[content.fieldNodes] = [];
		for (i = 0; i < data.length; i++){
			if (data[i][content.fieldParentID] == id && data[i][content.fieldID] != id){
				node[content.fieldNodes].push(data[i]);
				MUI.Content.Filters.tree(data, content, data[i]);
			}
		}
	}

	if (usePaging) response[content.paging.recordsField] = node;

	return node;
};

MUI.Content.Providers.xhr = {

	canPersist:		true,

	canPage:		false,

	doRequest: function(content){
		// if js is required, but no url, fire loaded to proceed with js-only
		if (content.url == null && content.require.js && content.require.js.length != 0){
			Browser.ie6 ? content.fireLoaded.delay(50, content) : content.fireLoaded();
			return null;
		}

		// load persisted data if it exists
		content.content = content.persistLoad(content);

		// process content passed to options.content or persisted data
		if (content.content){
			content.content = MUI.Content.processFilters(content);
			Browser.ie6 ? content.fireLoaded.delay(50, content) : content.fireLoaded();
			return;
		}

		var request = new Request({
			url: content.persistKey,
			method: content.method ? content.method : 'get',
			data: content.data ? new Hash(content.data).toQueryString() : '',
			evalScripts: function(script){
				content.javascript = script;
			},
			evalResponse: false,
			onRequest: function(){
				MUI.showSpinner(this.instance);
			}.bind(content),
			onFailure: function(response){
				var content = this;
				var instance = this.instance;
				var getTitle = new RegExp('<title>[\n\r\\s]*(.*)[\n\r\\s]*</title>', 'gmi');
				var error = getTitle.exec(response.responseText);
				if (!error) error = [500, 'Unknown'];

				var updateSetContent = true;
				content.error = error;
				content.errorMessage = '<h3>Error: ' + error[1] + '</h3>';
				if (instance && instance.updateSetContent) updateSetContent = instance.updateSetContent(content);
				if (this.element){
					if (updateSetContent) this.element.set('html', content.errorMessage);
					MUI.hideSpinner(instance);
				}
			}.bind(content),
			onSuccess: function(text){
				content = this._content;
				var instance = content.instance;
				text = content.persistStore(text);
				text = MUI.Content.processFilters(text, content);
				MUI.hideSpinner(instance);

				var js = content.javascript, html = text;

				// convert text files to html
				if (this.getHeader('Content-Type') == 'text/plain') html = html.replace(/\n/g, '<br>');

				var updateSetContent = true;
				content.content = html;
				if (instance && instance.updateSetContent) updateSetContent = instance.updateSetContent(content);
				if (updateSetContent){
					if (content.element) content.element.set('html', content.content);
					var evalJS = true;
					if (instance && instance.options && instance.options.evalScripts) evalJS = instance.options.evalScripts;
					if (evalJS && js) Browser.exec(js);
				}

				Browser.ie6 ? content.fireLoaded.delay(50, content) : content.fireLoaded();
			},
			onComplete: function(){
			}
		});
		request._content = content;
		request.send();
	}
};

MUI.Content.Providers.json = {

	canPersist:		true,

	canPage:		 true,

	_checkRecords: function(content){  // check to see if records already downloaded and fir onLoaded if it does
		var paging = content.paging;
		if (content.records && paging.pageSize == 0){
			Browser.ie6 ? content.fireLoaded.delay(50, content) : content.fireLoaded();
			return true;	// return them all if they exists and paging is turned off
		}
		if (content.records && content.records.length && paging.pageSize > 0){	// if paging is on make sure we have that page
			var first = ((paging.page - 1) * paging.pageSize);
			var last = first + paging.pageSize - 1;
			var total = content.records.length;
			//if (!paging.pageMax) paging.pageMax = parseInt(paging.total / paging.pageSize);
			if (total > first && total > last){
				for (var i = first; i <= last; i++){
					if (!content.records[i]) return false;
				}
				// if in scope then fire loaded to make control know we have the records
				Browser.ie6 ? content.fireLoaded.delay(50, content) : content.fireLoaded();
				return true
			}
		}
		return false;
	},

	_onSuccess: function(json){
		this.persistStore(json);
		if (json != null){	// when multiple results are persisted, null is returned.  decoding takes place in persistStore instead, and filtering is not allowed
			if (typeof(json) == 'string') json = JSON.decode(json);
			this.content = json;
			MUI.Content.setRecords(this);
			json = MUI.Content.processFilters(this);
		}
		MUI.hideSpinner(this.instance);
		Browser.ie6 ? this.fireLoaded.delay(50, this) : this.fireLoaded();
	},

	doRequest: function(content){
		if (content.content && !content.url){
			Browser.ie6 ? content.fireLoaded.delay(50, this) : content.fireLoaded();
			return;
		}

		if (!this._checkRecords(content)){
			// load persisted data if it exists
			content.content = JSON.decode(content.persistLoad(content));
			MUI.Content.setRecords(content);												// see if any records are there
		} else content.persistKey = content.doPrepUrl(content);

		if (!this._checkRecords(content)){
			if (content.loadMethod == 'jsonp'){
				new Request.JSONP({
					url: content.persistKey,
					callbackKey: (content.callbackKey ? content.callbackKey : 'callback'),
					data: content.data ? new Hash(content.data).toQueryString() : '',
					onRequest: function(){
						MUI.showSpinner(this.instance);
					}.bind(content),
					onComplete: this._onSuccess.bind(content),
					onCancel: function(){
						MUI.hideSpinner(this.instance);
					}.bind(content)
				}).send();
			} else {
				// still not found so load
				new Request({
					url: content.persistKey,
					update: content.element,
					method: content.method ? content.method : 'get',
					data: content.data ? new Hash(content.data).toQueryString() : '',
					evalScripts: false,
					evalResponse: false,
					headers: {'Content-Type':'application/json'},
					onRequest: function(){
						MUI.showSpinner(this.instance);
					}.bind(content),
					onFailure: function(){
						var updateSetContent = true;
						this.error = [500, 'Error Loading XMLHttpRequest'];
						this.errorMessage = '<p><strong>Error Loading XMLHttpRequest</strong></p>';
						if (this.instance && this.instance.updateSetContent) updateSetContent = this.instance.updateSetContent(this);

						if (this.element){
							if (updateSetContent) this.element.set('html', this.errorMessage);
							this.element.hideSpinner(this.instance);
						}
					}.bind(content),
					onException: function(){}.bind(content),
					onSuccess: this._onSuccess.bind(content),
					onComplete: function(){}.bind(content)
				}).send();
			}
		}
	}
}
		;

MUI.Content.Providers.jsonp = MUI.Content.Providers.json;

MUI.Content.Providers.iframe = {

	canPersist:		false,

	canPage:		false,

	doRequest: function(content){
		var updateSetContent = true;
		var instance = content.instance;
		if (instance && instance.updateSetContent) updateSetContent = instance.updateSetContent(content);
		var element = content.element;

		if (updateSetContent && element){
			var iframeEl = new Element('iframe', {
				id: element.id + '_iframe',
				name: element.id + '_iframe',
				'class': 'mochaIframe',
				src: content.doPrepUrl(content),
				marginwidth: 0,
				marginheight: 0,
				frameBorder: 0,
				scrolling: 'auto',
				styles: {
					height: element.offsetHeight - element.getStyle('border-top').toInt() - element.getStyle('border-bottom').toInt(),
					width: instance && instance.el.panel ? element.offsetWidth - element.getStyle('border-left').toInt() - element.getStyle('border-right').toInt() : '100%'
				}
			}).inject(element);
			if (instance) instance.el.iframe = iframeEl;

			// Add onload event to iframe so we can hide the spinner and run fireLoaded()
			iframeEl.addEvent('load', function(){
				MUI.hideSpinner(instance);
				Browser.ie6 ? this.fireLoaded.delay(50, this) : this.fireLoaded();
			}.bind(content));
		}
	}

};

MUI.Content.Providers.html = {

	canPersist:		false,

	canPage:		false,

	doRequest: function(content){
		var elementTypes = new Array('element', 'textnode', 'whitespace', 'collection');

		var updateSetContent = true;
		if (content.instance && content.instance.updateSetContent) updateSetContent = content.instance.updateSetContent(content);
		if (updateSetContent && content.element){
			if (elementTypes.contains(typeOf(content.content))) content.content.inject(content.element);
			else content.element.set('html', content.content);
		}

		Browser.ie6 ? content.fireLoaded.delay(50, content) : content.fireLoaded();
	}

};

MUI.Content.Providers.control = {

	canPersist:		false,

	canPage:		false,

	doRequest: function(content){
		//var options2 = content.options;
		// remove unneeded items that cause recursion
		// delete content.options;
		delete content.instance;
		MUI.create(content);
	}

};

MUI.append({

	WindowPanelShared: {

		/// intercepts workflow from MUI.Content.update
		/// sets title and scroll bars of this window
		updateStart: function(options){
			if (!options.position) options.position = 'content';
			if (options.position == 'content'){
				options.element = this.el.content;
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
				this.el.content.show().empty();
				var iframes = this.el.contentWrapper.getElements('.mochaIframe');
				if (iframes) iframes.destroy();

				// Panels are not loaded into the padding div, so we remove them separately.
				this.el.contentWrapper.getElements('.column').destroy();
				this.el.contentWrapper.getElements('.columnHandle').destroy();

				if (this.el.content.getParent() == null) this.el.content.inject(this.el.element);

				return false;
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
					options.element = this.el.contentWrapper;
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
			MUI.erase(this.el.content.getChildren());
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
	},

	update: MUI.Content.update,

	getData: function(item, property, dfault){
		if (!dfault) dfault = '';
		if (!item || !property) return dfault;
		if (item[property] == null) return dfault;
		return item[property];
	}

});

MUI.Content.PagingOptions = {
	// main paging options
	pageSize:		0,			// if >0 then paging is turned on
	page:			0,			// the page index offset (index*size)+1 = first record, (index*size)+size = last record
	pageMax:		0,			// the last page in the that (largest value of index).

	// informational values, set by return results, if they are change after contents are returned, they can be used to change what the pager is displaying
	total:			0,			// starts out as zero until filled in when data is received
	first:			1,			// first record showing in current page
	last:			10,			// last record showing in current page

	// additional options
	sort:			'',			// fields to search by, comma separated list of fields or array of strings.  Will be passed to server end-point.
	dir:			'asc',		// 'asc' ascending, 'desc' descending
	recordsField:	'data',		// 'element' in the json hash that contains the data
	totalField:		'total',	// 'element' in the json hash that contains the total records in the overall set
	pageField:		'page',		// 'element' in the json hash that contains the maximum pages that can be selected
	pageMaxField:	'pageMax',	// 'element' in the json hash that contains the maximum pages that can be selected
	pageSizeField:	'pageSize',	// 'element' in the json hash that contains the size of the page
	firstField:		'first',	// 'element' in the json hash that contains the size of the page
	lastField:		'last',		// 'element' in the json hash that contains the maximum pages that can be selected
	lookAhead:		0,			// # of pages to request in the background and cache
	wrap:			false,		// true if you want paging to wrap when user hits next page and they are at the last page, or from the first to the last page

	pageOptions:	[10, 20, 50, 100, 200]	// per page options available to user
};
