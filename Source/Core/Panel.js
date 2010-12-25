/*
 ---

 script: Panel.js

 description: Panel is used to create a content area in a column

 copyright: (c) 2010 Contributors in (/AUTHORS.txt).

 license: MIT-style license in (/MIT-LICENSE.txt).

 requires:
 - MochaUI/MUI
 - MUI.Desktop
 - MUI.Column

 provides: [MUI.Panel]

 ...
 */

MUI.files['{source}Core/Panel.js'] = 'loaded';

MUI.Panel = new NamedClass('MUI.Panel', {

	Implements: [Events, Options],

	options: {
		id:						null,			// id of the main div tag for the panel
		column:					null,			// the name of the column to insert this panel into
		drawOnInit:				true,			// true to inject panel into DOM when panel is first created

		// content section update options
		content:				false,			// used to update the content section of the panel.
		// if it is a string it assumes that the content is html and it will be injected into the content div.
		// if it is an array then assume we need to update multiple sections of the panel
		// if it is not a string or array it assumes that is a hash and just the content section will have .

		// header
		header:					true,			// true to create a panel header when panel is created
		title:					false,			// the title inserted into the panel's header

		// footer
		footer:					false,			// true to create a panel footer when panel is created

		// Style options:
		height:					125,			// the desired height of the panel
		cssClass:				'',				// css class to add to the main panel div
		scrollbars:				true,			// true to allow scrollbars to be shown
		padding:				8,				// default padding for the panel

		// Other:
		collapsible:			true,			// can the panel be collapsed
		isCollapsed:			 false

		// Events
		//onLoaded:				null, // called every time content is loaded using MUI.Content
		//onDrawBegin:			null,
		//onDrawEnd:			null,
		//onResize:				null,
		//onCollapse:			null,
		//onExpand:				null
	},

	initialize: function(options){
		this.setOptions(options);

		Object.append(this, {
			oldHeight: 0,
			partner: null,
			el: {}
		});

		// If panel has no ID, give it one.
		if (this.options.id == null) this.options.id = 'panel' + (++MUI.IDCount);
		this.id = this.options.id;
		MUI.set(this.id, this);

		if (this.options.drawOnInit) this.draw();
	},

	draw: function(){
		var options = this.options;
		var columnInstance = MUI.get(options.column);

		// Check if panel already exists
		if (this.el.panel) return this;

		this.fireEvent('drawBegin', [this]);
		this.showHandle = $(options.column).getChildren().length != 0;

		this.el.element = new Element('div', {
			'id': options.id + '_wrapper',
			'class': 'panelWrapper expanded'
		}).inject($(options.column));

		this.el.panel = new Element('div', {
			'id': options.id,
			'class': 'panel',
			'styles': {
				'height': options.height
			}
		}).inject(this.el.element)
				.addClass(options.cssClass)
				.store('instance', this);

		this.el.content = new Element('div', {
			'id': options.id + '_pad',
			'class': 'pad'
		}).inject(this.el.panel);

		// make sure we have a content sections
		this.sections = [];

		switch (typeOf(options.content)){
			case 'string':
				// was passed html, so make sure it is added
				this.sections.push({
					loadMethod: 'html',
					content: options.content
				});
				break;
			case 'array':
				this.sections = options.content;
				break;
			default:
				this.sections.push(options.content);
		}

		// This is in order to use the same variable as the windows do in MUI.Content.update.
		// May rethink this.
		this.el.contentWrapper = this.el.panel;

		var headerItems = [];
		var footerItems = [];
		var snum = 0;
		this.sections.each(function(section, idx){
			if (!section.position || section.position == 'content'){
				if (section.loadMethod == 'iframe') section.padding = 0;  // Iframes have their own padding.
				section.element = this.el.content;
				this.sections[idx] = section;
				return;
			}
			var id = options.id + '_' + (section.name || 'section' + (snum++));
			if (!section.control) section.control = 'MUI.ToolbarHtml';
			if (!section.id) section.id = id;
			section.partner = this.id;
			this.sections[idx] = section;
			if (section.position == 'header') headerItems.unshift(section);
			if (section.position == 'footer') footerItems.unshift(section);
		}, this);

		if (options.header){
			this.el.header = new Element('div', {
				'id': options.id + '_header',
				'class': 'panel-header',
				'styles': { 'display': options.header ? 'block' : 'none' }
			}).inject(this.el.panel, 'before');

			if (options.collapsible){
				this._collapseToggleInit();
				headerItems.unshift({content:this.el.collapseToggle, divider:false});
			}

			if (options.title){
				this.el.title = new Element('h2', {
					'id': options.id + '_title',
					'html': options.title
				});
				headerItems.push({id:options.id + 'headerContent',content:this.el.title,orientation:'left', divider:false});
			}

			MUI.create('MUI.ToolbarDock', {
				container:this.el.panel,
				_container:this.el.panel.id,
				id:options.id + '_header',
				cssClass: 'panel-header',
				docked:headerItems
			});
		}

		if (options.footer){
			this.el.footer = new Element('div', {
				'id': options.id + '_footer',
				'class': 'panel-footer',
				'styles': { 'display': options.footer ? 'block' : 'none' }
			}).inject(this.el.panel,'after');

			MUI.create('MUI.ToolbarDock', {
				container:this.el.element,
				_container:this.el.element.id,
				id:options.id + '_footer',
				cssClass: 'panel-footer',
				docked:footerItems
			});
		}

		if (columnInstance && columnInstance.options.sortable){
			this.el.header.setStyle('cursor', 'move');
			columnInstance.options.container.retrieve('sortables').addItems(this.el.element);
			if (this.el.header){
				this.el.header.addEvent('mousedown', function(e){
					e = e.stop();
					e.target.focus();
				});
				this.el.header.setStyle('cursor', 'default');
			}
		}

		this.el.handle = new Element('div', {
			'id': options.id + '_handle',
			'class': 'horizontalHandle',
			'styles': {
				'display': this.showHandle ? 'block' : 'none'
			}
		}).inject(this.el.element);

		this.el.handleIcon = new Element('div', {
			'id': options.id + '_handle_icon',
			'class': 'handleIcon'
		}).inject(this.el.handle);

		this._addResizeBottom();

		// load/build all of the additional  content sections
		this.sections.each(function(section){
			if (section.position == 'header' || section.position == 'footer') return;
			if (section.onLoaded) section.onLoaded = section.onLoaded.bind(this);
			if (!section.instance) section.instance = this;
			MUI.Content.update(section);
		}, this);

		// Do this when creating and removing panels
		if (!options.column) return;
		$(options.column).getChildren('.panelWrapper').removeClass('bottomPanel').getLast().addClass('bottomPanel');
		MUI.panelHeight(options.column, this.el.panel, 'new');

		Object.each(this.el, (function(ele){
			if (ele != this.el.headerToolbox) ele.store('instance', this);
		}).bind(this));

		if (options.isCollapsed) this._collapse();
		this.fireEvent('drawEnd', [this]);
		return this;
	},

	close: function(){
		var column = this.options.column;
		this.isClosing = true;

		var columnInstance = MUI.get(column);
		if (columnInstance.options.sortable)
			columnInstance.options.container.retrieve('sortables').removeItems(this.el.element);

		this.el.element.destroy();

		if (MUI.Desktop) MUI.Desktop.resizePanels();

		// Do this when creating and removing panels
		var panels = $(column).getElements('.panelWrapper');
		panels.removeClass('bottomPanel');
		if (panels.length > 0) panels.getLast().addClass('bottomPanel');

		MUI.erase(this.options.id);
		this.fireEvent('close', [this]);
		return this;
	},

	collapse: function(){
		var panelWrapper = this.el.element;
		var options = this.options;

		// Get siblings and make sure they are not all collapsed.
		// If they are all collapsed and the current panel is collapsing
		// Then collapse the column.
		var expandedSiblings = [];

		panelWrapper.getAllPrevious('.panelWrapper').each(function(sibling){
			var panel = sibling.getElement('.panel');
			if (!panel) return;
			if (!MUI.get(panel.id).isCollapsed) expandedSiblings.push(panel.id);
		});

		panelWrapper.getAllNext('.panelWrapper').each(function(sibling){
			if (!MUI.get(sibling.getElement('.panel').id).isCollapsed)
				expandedSiblings.push(sibling.getElement('.panel').id);
		});

		var currentColumn = MUI.get($(options.column).id);
		if (expandedSiblings.length == 0 && currentColumn.options.placement != 'main'){
			currentColumn.toggle();
			return;
		} else if (expandedSiblings.length == 0 && currentColumn.options.placement == 'main'){
			return;
		}

		this._collapse(true);

		return this;
	},

	_collapse: function(fireevent){
		var panelWrapper = this.el.element;
		var options = this.options;

		// Collapse Panel
		var panel = this.el.panel;
		this.oldHeight = panel.getStyle('height').toInt();
		if (this.oldHeight < 10) this.oldHeight = 20;
		this.el.content.setStyle('position', 'absolute'); // This is so IE6 and IE7 will collapse the panel all the way
		panel.setStyle('height', 0);
		this.isCollapsed = true;
		panelWrapper.addClass('collapsed')
				.removeClass('expanded');
		MUI.panelHeight(options.column, panel, 'collapsing');
		MUI.panelHeight(); // Run this a second time for panels within panels
		this.el.collapseToggle.removeClass('panel-collapsed')
				.addClass('panel-expand')
				.setProperty('title', 'Expand Panel');
		if (fireevent) this.fireEvent('collapse', [this]);

		return this;
	},

	expand: function(){

		// Expand Panel
		this.el.content.setStyle('position', null); // This is so IE6 and IE7 will collapse the panel all the way
		this.el.panel.setStyle('height', this.oldHeight);
		this.isCollapsed = false;
		this.el.element.addClass('expanded')
				.removeClass('collapsed');
		MUI.panelHeight(this.options.column, this.el.panel, 'expanding');
		MUI.panelHeight(); // Run this a second time for panels within panels
		this.el.collapseToggle.removeClass('panel-expand')
				.addClass('panel-collapsed')
				.setProperty('title', 'Collapse Panel');
		this.fireEvent('expand', [this]);

		return this;
	},

	toggle: function(){
		if (this.isCollapsed) this.expand();
		else this.collapse();
		return this;
	},

	_collapseToggleInit: function(){
		this.el.collapseToggle = new Element('div', {
			'id': this.options.id + '_collapseToggle',
			'class': 'panel-collapse icon16',
			'styles': {
				'width': 16,
				'height': 16
			},
			'title': 'Collapse Panel'
		}).addEvent('click', function(){
			this.toggle();
		}.bind(this));
	},

	_addResizeBottom: function(){
		var instance = this;
		var element = this.el.panel;

		var handle = this.el.handle;
		handle.setStyle('cursor', Browser.webkit ? 'row-resize' : 'n-resize');
		var partner = this.partner;
		var min = 0;
		var max = function(){
			return element.getStyle('height').toInt() + partner.getStyle('height').toInt();
		}.bind(this);

		if (Browser.ie){
			handle.addEvents({
				'mousedown': function(){
					handle.setCapture();
				},
				'mouseup': function(){
					handle.releaseCapture();
				}
			});
		}
		this.resize = element.makeResizable({
			handle: handle,
			modifiers: {x: false, y: 'height'},
			limit: {y: [min, max]},
			invert: false,

			onBeforeStart: function(){
				partner = instance.partner;
				this.originalHeight = element.getStyle('height').toInt();
				this.partnerOriginalHeight = partner.getStyle('height').toInt();
			}.bind(this),

			onStart: function(){
				if (instance.el.iframe){
					if (Browser.ie){
						instance.el.iframe.hide();
						partner.getElements('iframe').hide();
					} else {
						instance.el.iframe.setStyle('visibility', 'hidden');
						partner.getElements('iframe').setStyle('visibility', 'hidden');
					}
				}
			}.bind(this),

			onDrag: function(){
				var partnerHeight = this.partnerOriginalHeight;
				partnerHeight += (this.originalHeight - element.getStyle('height').toInt());
				partner.setStyle('height', partnerHeight);
				MUI.resizeChildren(element, element.getStyle('height').toInt());
				MUI.resizeChildren(partner, partnerHeight);
				element.getChildren('.column').each(function(column){
					MUI.panelHeight(column);
				});
				partner.getChildren('.column').each(function(column){
					MUI.panelHeight(column);
				});
			}.bind(this),

			onComplete: function(){
				var partnerHeight = this.partnerOriginalHeight;
				partnerHeight += (this.originalHeight - element.getStyle('height').toInt());
				partner.setStyle('height', partnerHeight);
				MUI.resizeChildren(element, element.getStyle('height').toInt());
				MUI.resizeChildren(partner, partnerHeight);
				element.getChildren('.column').each(function(column){
					MUI.panelHeight(column);
				});
				partner.getChildren('.column').each(function(column){
					MUI.panelHeight(column);
				});
				if (instance.el.iframe){
					if (Browser.ie){
						instance.el.iframe.show();
						partner.getElements('iframe').show();
						// The following hack is to get IE8 Standards Mode to properly resize an iframe
						// when only the vertical dimension is changed.
						var width = instance.el.iframe.getStyle('width').toInt();
						instance.el.iframe.setStyle('width', width - 1);
						MUI.rWidth();
						instance.el.iframe.setStyle('width', width);
					} else {
						instance.el.iframe.setStyle('visibility', 'visible');
						partner.getElements('iframe').setStyle('visibility', 'visible');
					}
				}

				instance.fireEvent('resize', [this]);
				MUI.get(partner).fireEvent('resize', [this]);
			}.bind(this)
		});
	}

}).implement(MUI.WindowPanelShared);
