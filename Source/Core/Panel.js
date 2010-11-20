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
		title:					'New Panel',	// the title inserted into the panel's header

		// Style options:
		height:					125,			// the desired height of the panel
		addClass:				'',				// css class to add to the main panel div
		scrollbars:				true,			// true to allow scrollbars to be shown
		padding:				8,				// default padding for the panel

		// Other:
		collapsible:			true			// can the panel be collapsed

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
			isCollapsed: false, // This is probably redundant since we can check for the class
			oldHeight: 0,
			partner: null,
			el: {}
		});

		// If panel has no ID, give it one.
		if (this.options.id == null) this.options.id = 'panel' + (++MUI.IDCount);
		this.id = this.options.id;

		if (this.options.drawOnInit) this.draw();
	},

	draw: function(){
		var options = this.options;

		// Check if panel already exists
		if (this.el.panel) return this;
		else MUI.set(this.options.id, this);

		this.fireEvent('drawBegin', [this]);

		this.showHandle = $(options.column).getChildren().length != 0;

		this.el.panelWrapper = new Element('div', {
			'id': this.options.id + '_wrapper',
			'class': 'panelWrapper expanded'
		}).inject($(options.column));

		this.el.panel = new Element('div', {
			'id': this.options.id,
			'class': 'panel',
			'styles': {
				'height': options.height
			}
		}).inject(this.el.panelWrapper);

		this.el.panel.store('instance', this);

		this.el.panel.addClass(options.addClass);

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

		// determine of this panel has a footer
		this.hasFooter = false;
		this.hasHeaderTool = false;
		this.sections.each(function(section){
			if (section.position == 'footer') this.hasFooter = true;
			if (section.position == 'headertool') this.hasHeaderTool = true;
		}, this);

		if (this.hasFooter){
			this.el.footerWrapper = new Element('div', {
				'id': options.id + '_panelFooterWrapper',
				'class': 'panel-footerWrapper'
			}).inject(this.el.panelWrapper);

			this.el.footer = new Element('div', {
				'id': options.id + '_panelFooter',
				'class': 'panel-footer'
			}).inject(this.el.footerWrapper);
		}

		// This is in order to use the same variable as the windows do in MUI.Content.update.
		// May rethink this.
		this.el.contentWrapper = this.el.panel;

		this.el.panelHeader = new Element('div', {
			'id': this.options.id + '_header',
			'class': 'panel-header',
			'styles': {
				'display': options.header ? 'block' : 'none'
			}
		}).inject(this.el.panel, 'before');

		var columnInstance = MUI.get(this.options.column);

		if (this.options.collapsible) this._collapseToggleInit();

		if (this.hasHeaderTool){
			this.el.panelHeaderToolbox = new Element('div', {
				'id': options.id + '_headerToolbox',
				'class': 'panel-header-toolbox'
			}).inject(this.el.panelHeader);
		}

		this.el.panelHeaderContent = new Element('div', {
			'id': options.id + '_headerContent',
			'class': 'panel-headerContent'
		}).inject(this.el.panelHeader);

		if (columnInstance.options.sortable){
			this.el.panelHeader.setStyle('cursor', 'move');
			columnInstance.options.container.retrieve('sortables').addItems(this.el.panelWrapper);
			if (this.el.panelHeaderToolbox){
				this.el.panelHeaderToolbox.addEvent('mousedown', function(e){
					e = e.stop();
					e.target.focus();
				});
				this.el.panelHeaderToolbox.setStyle('cursor', 'default');
			}
		}

		this.el.title = new Element('h2', {
			'id': options.id + '_title',
			'html': options.title
		}).inject(this.el.panelHeaderContent);

		this.el.handle = new Element('div', {
			'id': options.id + '_handle',
			'class': 'horizontalHandle',
			'styles': {
				'display': this.showHandle ? 'block' : 'none'
			}
		}).inject(this.el.panelWrapper);

		this.el.handleIcon = new Element('div', {
			'id': options.id + '_handle_icon',
			'class': 'handleIcon'
		}).inject(this.el.handle);

		this._addResizeBottom();

		var snum = 0;
		this.sections.each(function(section, idx){
			var intoEl = this.el.panel;

			snum++;
			var id = options.id + '_' + (section.section || 'section' + snum);

			section = Object.append({
				'element': this.el.panel,
				'wrap': false,
				'position': 'content',
				'empty': false,
				'addClass': false,
				'height': false,
				'id': id,
				'css': '',
				'loadMethod': 'xhr',
				'method': 'get'
			}, section);

			var wrap = section.wrap;
			var empty = section.empty;
			var where = section.position == 'bottom' ? 'after' : 'before';

			switch (section.position){
				case 'header':
					intoEl = this.el.panelHeaderContent;
					if (!this.options.header) return;
					break;
				case 'headertool':
					intoEl = this.el.panelHeaderToolbox;
					if (section.css == '') section.css = 'toolbox';
					if (!this.options.header) return;
					break;
				case 'footer':
					intoEl = this.el.footer; break;
					break;
				case 'content':
					if (section.loadMethod == 'iframe') section.padding = 0;  // Iframes have their own padding.
					section.element = this.el.content;
					this.sections[idx] = section;
					return;
			}

			if (wrap){
				section.wrapperEl = new Element('div', {
					'id': section.id + '_wrapper',
					'class': section.css + 'Wrapper'
				}).inject(intoEl, where);

				if (section.height) section.wrapperEl.setStyle('height', section.height);

				if (section.position == 'bottom') section.wrapperEl.addClass('bottom');
				intoEl = section.wrapperEl;
			}

			if (empty) intoEl.empty();
			section.element = new Element('div', {
				'id': section.id,
				'class': section.css
			}).inject(intoEl);
			if (section.height || typeOf(section.height) == 'number') section.element.setStyle('height', section.height);

			if (section.addClass) intoEl.addClass(section.addClass);

			section.wrapperEl = intoEl;
			if (section.wrap && section.position == 'bottom') section.element.addClass('bottom');

			this.sections[idx] = section;
		}, this);

		this._loadContent();

		Object.each(this.el, (function(ele){
			ele.store('instance', this);
		}).bind(this));

		this.fireEvent('drawEnd', [this]);
		return this;
	},

	close: function(){
		var column = this.options.column;
		this.isClosing = true;

		var columnInstance = MUI.get(column);

		if (columnInstance.options.sortable)
			columnInstance.options.container.retrieve('sortables').removeItems(this.el.panelWrapper);

		this.el.panelWrapper.destroy();

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
		var panelWrapper = this.el.panelWrapper;
		var panel = this.el.panel;
		var options = this.options;

		// Get siblings and make sure they are not all collapsed.
		// If they are all collapsed and the current panel is collapsing
		// Then collapse the column.
		var expandedSiblings = [];

		panelWrapper.getAllPrevious('.panelWrapper').each(function(sibling){
			var panel = sibling.getElement('.panel');
			if (!panel) return;
			var instance = MUI.get(panel.id);
			if (!instance.isCollapsed) expandedSiblings.push(panel.id);
		});

		panelWrapper.getAllNext('.panelWrapper').each(function(sibling){
			var instance = MUI.get(sibling.getElement('.panel').id);
			if (!instance.isCollapsed)
				expandedSiblings.push(sibling.getElement('.panel').id);
		});

		// Collapse Panel
		var currentColumn = MUI.get($(options.column).id);

		if (expandedSiblings.length == 0 && currentColumn.options.placement != 'main'){
			currentColumn = MUI.get($(options.column).id);
			currentColumn.toggle();
			return;
		} else if (expandedSiblings.length == 0 && currentColumn.options.placement == 'main'){
			return;
		}
		this.oldHeight = panel.getStyle('height').toInt();
		if (this.oldHeight < 10) this.oldHeight = 20;
		this.el.content.setStyle('position', 'absolute'); // This is so IE6 and IE7 will collapse the panel all the way
		panel.setStyle('height', 0);
		this.isCollapsed = true;
		panelWrapper.addClass('collapsed');
		panelWrapper.removeClass('expanded');
		MUI.panelHeight(options.column, panel, 'collapsing');
		MUI.panelHeight(); // Run this a second time for panels within panels
		this.el.collapseToggle.removeClass('panel-collapsed');
		this.el.collapseToggle.addClass('panel-expand');
		this.el.collapseToggle.setProperty('title', 'Expand Panel');
		this.fireEvent('collapse', [this]);

		return this;
	},

	expand: function(){

		// Expand Panel
		this.el.content.setStyle('position', null); // This is so IE6 and IE7 will collapse the panel all the way
		this.el.panel.setStyle('height', this.oldHeight);
		this.isCollapsed = false;
		this.el.panelWrapper.addClass('expanded');
		this.el.panelWrapper.removeClass('collapsed');
		MUI.panelHeight(this.options.column, this.el.panel, 'expanding');
		MUI.panelHeight(); // Run this a second time for panels within panels
		this.el.collapseToggle.removeClass('panel-expand');
		this.el.collapseToggle.addClass('panel-collapsed');
		this.el.collapseToggle.setProperty('title', 'Collapse Panel');
		this.fireEvent('expand', [this]);

		return this;
	},

	toggle: function(){
		if (this.isCollapsed) this.expand();
		else this.collapse();
		return this;
	},

	_loadContent: function(){
		var options = this.options;

		// load/build all of the additional  content sections
		this.sections.each(function(section){
			if (!options.header && (section.position == 'header' || section.position == 'headertool')) return;
			if (section.onLoaded) section.onLoaded = section.onLoaded.bind(this);
			section.instance = this;
			MUI.Content.update(section);
		}, this);

		// Do this when creating and removing panels
		$(options.column).getChildren('.panelWrapper').removeClass('bottomPanel').getLast().addClass('bottomPanel');

		MUI.panelHeight(options.column, this.el.panel, 'new');
	},

	_collapseToggleInit: function(options){
		options = this.options;

		this.el.panelHeaderCollapseBox = new Element('div', {
			'id': options.id + '_headerCollapseBox',
			'class': 'toolbox'
		}).inject(this.el.panelHeader);

		if (this.hasHeaderTool) this.el.panelHeaderCollapseBox.addClass('divider');

		this.el.collapseToggle = new Element('div', {
			'id': options.id + '_collapseToggle',
			'class': 'panel-collapse icon16',
			'styles': {
				'width': 16,
				'height': 16
			},
			'title': 'Collapse Panel'
		}).inject(this.el.panelHeaderCollapseBox);

		this.el.collapseToggle.addEvent('click', function(){
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
