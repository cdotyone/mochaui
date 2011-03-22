/*
 ---

 name: Pager

 script: pager.js

 description: MUI.Pager - Creates a pager control that allows user to page through data.

 copyright: (c) 2011 Contributors in (/AUTHORS.txt).

 license: MIT-style license in (/MIT-LICENSE.txt).

 requires:
 - Core/Element
 - Core/Class
 - Core/Options
 - Core/Events
 - MUI

 provides: [MUI.Pager]
 ...
 */

MUI.Pager = new NamedClass('MUI.Pager', {

	Implements: [Events, Options],

	options: {
		//id:			'',				// id of the primary element, and id os control that is registered with mocha
		//container:	null,			// the parent control in the document to add the control to
		drawOnInit:		true,			// true to add tree to container when control is initialized

		cssClass:		'pager',		// primary css tag
		divider:		true,			// true if this toolbar has a divider

		showPageSize:	true,			// true to show pagesize drop down
		showFirst:		true,			// show first button
		showPrev:		true,			// show previous button
		showNext:		true,			// show next button
		showLast:		true,			// show last button
		showReload:		true,			// show reload button
		showStatus:		true,			// show status text

		first:			0,				// first record in page
		last:			0,				// last record in page
		total:			0,				// total records in recordset
		pageOptions:	null,			// the pageSizes available to user
		statusTemplate: "{first}..{last} / {total}", // the template to use for the status text
		statusNoRecords:"No Records"	// text template when total==0

		//,onDrawBegin:		null		// Control Event: drawing of control started
		//,onDrawEnd:		null		// Control Event: drawing of control finished, and it is attached to DOM
		//,onPagingOptions:	null		// Control Event: fired when the paging options are being set from another control
		//,onStatusChange:	null		// Control Event: fired when the status text has changed

		//,onPageSize:		null		// User Event: User changed the page size
		//,onFirst:			null		// User Event: User clicked first record button
		//,onPrev:			null		// User Event: User clicked previous record button
		//,onNext:			null		// User Event: User clicked next record button
		//,onLast:			null		// User Event: User clicked last record button
		//,onReload:		null		// User Event: User clicked reload records button 
	},

	initialize: function(options){
		this.setOptions(options);
		this.el = {};

		// If pager has no ID, give it one.
		this.id = this.options.id = this.options.id || 'pager' + (++MUI.idCount);
		MUI.set(this.id, this);

		if (this.options.drawOnInit) this.draw();
	},

	draw: function(container){
		var o = this.options;
		if (!container) container = o.container;

		this.fireEvent('drawBegin');

		// determine element for this control
		var isNew = false;
		var div = o.element ? o.element : $(o.id);
		if (!div){
			div = new Element('div', {'id': o.id});
			isNew = true;
		}
		this.el.element = div.store('instance', this).addClass(o.cssClass).empty();
		if (o.divider) div.addClass('divider');

		this.el.pageSizeGroup = new Element('div', {id:o.id + '_pageSizeGroup','class':'Group'}).inject(this.el.element);
		this.el.pageSize = new Element('select', {id:o.id + '_pageSize','class':'pageSize'}).inject(this.el.pageSizeGroup);

		var createGroup = function(name){
			return new Element('div', {id:name,'class':'Group'}).inject(
					new Element('div', {id:name + 'Sep','class':'Separator'}).inject(this.el.element));
		}.bind(this);

		this.el.prevGroup = createGroup(o.id + '_prevGroup');
		this.el.first = new Element('div', {id:o.id + '_first','class':'Button First'})
				.inject(this.el.prevGroup)
				.addEvent('click', function(){
			this.fireEvent('first')
		}.bind(this));
		this.el.prev = new Element('div', {id:o.id + '_prev','class':'Button Prev'})
				.inject(this.el.prevGroup)
				.addEvent('click', function(){
			this.fireEvent('prev')
		}.bind(this));

		this.el.nextGroup = createGroup(o.id + '_nextGroup');
		this.el.next = new Element('div', {id:o.id + '_next','class':'Button Next'})
				.inject(this.el.nextGroup)
				.addEvent('click', function(){
			this.fireEvent('next')
		}.bind(this));
		this.el.last = new Element('div', {id:o.id + '_last','class':'Button Last'})
				.inject(this.el.nextGroup)
				.addEvent('click', function(){
			this.fireEvent('last')
		}.bind(this));

		this.el.reloadGroup = createGroup(o.id + '_reloadGroup');
		this.el.reload = new Element('div', {id:o.id + '_reload','class':'Button Reload'})
				.inject(this.el.reloadGroup)
				.addEvent('click', this.startReload.bind(this));

		this.el.statusGroup = createGroup(o.id + '_statusGroup');
		this.el.status = new Element('span', {id:o.id + '_reload','class':'Status'}).inject(this.el.statusGroup);

		this.setPagingOptions();

		// add to container
		var addToContainer = function(){
			if (typeOf(container) == 'string') container = $(container);
			if (div.getParent() == null) div.inject(container, 'top');
			this.fireEvent('drawEnd');
		}.bind(this);
		if (!isNew || typeOf(container) == 'element') addToContainer();
		else window.addEvent('domready', addToContainer);

		return this;
	},

	setPagingOptions: function(options){
		if (options){
			var keys = ['showPageSize','showFirst','showPrev','showNext','showLast','showReload','showStatus','total','last','first','statusTemplate','statusNoRecords','pageOptions'];
			Object.each(options, function(val, key){
				if (keys.indexOf(key)) this.options[key] = val;
			}.bind(this));
		}

		this._setHideShowControls();
		this._buildPageSize();
		this.setStatusText();

		if (options) this.fireEvent('pagingOptions', [this])
	},

	setStatusText: function(text){
		if (!text) text = this.options.total > 0 ? this.options.statusTemplate : this.options.statusNoRecords;
		var current = this.el.status.get('html');
		var newText = MUI.replaceFields(text, this.options);
		this.el.status.set('html', newText);
		if (current != newText) this.fireEvent('statusChange', [this]);
	},

	startReload: function() {
		this.fireEvent('reload');
		this.el.reload.addClass('Loading');
	},

	stopReload: function() {
		this.el.reload.removeClass('Loading');
	},

	_buildPageSize:function(){
		var o = this.options;

		// remove events and reset pageSize options
		this.el.pageSize.removeEvents('change').length = 0;

		// add pageSize options
		var pageOptions = o.pageOptions ? o.pageOptions : MUI.Content.PagingOptions.pageOptions;
		for (var i = 0; i < pageOptions.length; i++){
			this.el.pageSize.options[i] = new Option(pageOptions[i], pageOptions[i], false, pageOptions[i] == o.pageSize);
		}

		// enable resize events
		this.el.pageSize.addEvent('change', function(){
			this.fireEvent('pageSize')
		}.bind(this));
	},

	_setHideShowControls: function(){
		var o = this.options;
		var b = 'block',n = 'none';

		this.el.pageSizeGroup.setStyle('display', o.showPageSize ? b : n);

		this.el.prevGroup.setStyle('display', (o.showFirst || o.showPrev) ? b : n);
		this.el.first.setStyle('display', o.showFirst ? b : n);
		this.el.prev.setStyle('display', o.showPrev ? b : n);

		this.el.nextGroup.setStyle('display', (o.showNext || o.showLast) ? b : n);
		this.el.next.setStyle('display', o.showNext ? b : n);
		this.el.last.setStyle('display', o.showLast ? b : n);

		this.el.reloadGroup.setStyle('display', o.showReload ? b : n);
		this.el.statusGroup.setStyle('display', o.showStatus ? b : n);
	}

});
