/*
 ---

 name: Panel

 script: panel.js

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

MUI.files['source|Panel.js'] = 'loaded';

MUI.Panel = new NamedClass('MUI.Panel', {

	Implements: [Events, Options],

	options: {
		id:						null,
		column:					null,
		drawOnInit:				true,

		require:{
			css:				[],
			images:				[],
			js:					[],
			onload:				null
		},
		loadMethod:				null,
		contentURL:				null,

		// xhr options
		method:					'get',
		data:					null,
		evalScripts:			true,
		evalResponse:			false,

		// html options
		content:				false,

		// additional content sections
		sections:				false,

		// header
		header:					true,
		title:					'New Panel',

		// Style options:
		height:					125,
		addClass:				'',
		scrollbars:		 		true,
		padding:				8,

		// Other:
		collapsible:			true,

		// Events
		onDrawBegin:			$empty,
		onDrawEnd:				$empty,
		onContentLoaded:		$empty,
		onResize:				$empty,
		onCollapse:				$empty,
		onExpand:				$empty

	},

	initialize: function(options){
		this.setOptions(options);

		$extend(this, {
			isCollapsed: false, // This is probably redundant since we can check for the class
			oldHeight: 0,
			partner: null,
			el:{}
		});

		// If panel has no ID, give it one.
		if (this.options.id == null) this.options.id = 'panel' + (++MUI.IDCount);
		this.id = this.options.id;

		if (this.options.drawOnInit) this.draw();
	},

	draw: function() {
		var instance = this;
		var options = this.options;

		// Check if panel already exists
		if (instance.el.panel) return;
		else MUI.set(this.options.id, this);

		this.fireEvent('onDrawBegin');

		if (options.loadMethod == 'iframe') options.padding = 0;  // Iframes have their own padding.

		this.showHandle = $(options.column).getChildren().length != 0;

		this.el.panelWrapper = new Element('div', {
			'id': this.options.id + '_wrapper',
			'class': 'panelWrapper expanded'
		}).inject($(options.column));

		this.el.panel = new Element('div', {
			'id': this.options.id,
			'class': 'panel expanded',
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

		// determine of this panel has a footer
		this.hasFooter = false;
		this.hasHeaderTool = false;
		if (options.sections){
			options.sections.each(function(section){
				if (section.position == 'footer') instance.hasFooter = true;
				if (section.position == 'headertool') instance.hasHeaderTool = true;
			});
		}

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

		// This is in order to use the same variable as the windows do in updateContent.
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

		this._addResizeBottom(options.id);

		if (options.sections){
			var snum = 0;
			options.sections.each(function(section, idx){
				var intoEl = this.el.panel;

				snum++;
				var id = options.id + '_' + (section.section || 'section' + snum);

				section = $extend({
					'element': this.el.panel,
					'wrap': false,
					'position': 'header',
					'empty': false,
					'addClass': false,
					'height': false,
					'id': id,
					'css': '',
					'section': 'section' + snum,
					'loadMethod': 'xhr',
					'method': options.method
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
						if (!this.options.header) return;
						break;
					case 'footer':
						intoEl = this.el.footer; break;
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
				section.childElement = new Element('div', {
					'id': section.id,
					'class': section.css,
					'styles': {'height': section.height}
				}).inject(intoEl);

				if (section.addClass) intoEl.addClass(section.addClass);

				section.wrapperEl = intoEl;
				if (section.wrap && section.position == 'bottom') section.childElement.addClass('bottom');

				this.options.sections[idx] = section;
			},this);
		}

		if (options.require.css.length || options.require.images.length){
			new MUI.Require({
				css: options.require.css,
				images: options.require.images,
				onload: function(){
					this._loadContent();
				}.bind(this)
			});
		} else {
			this._loadContent();
		}
	},

	close: function(){
		var instance = this;
		var column = instance.options.column;
		instance.isClosing = true;

		var columnInstance = MUI.get(column);

		if (columnInstance.options.sortable)
			columnInstance.options.container.retrieve('sortables').removeItems(instance.el.panelWrapper);

		instance.el.panelWrapper.destroy();

		if (MUI.Desktop) MUI.Desktop.resizePanels();

		// Do this when creating and removing panels
		var panels = $(column).getElements('.panelWrapper');
		panels.removeClass('bottomPanel');
		if (panels.length > 0) panels.getLast().addClass('bottomPanel');

		MUI.erase(instance.options.id);
		return true;
	},

	_loadContent: function(){
		var options = this.options;

		// Add content to panel.
		MUI.updateContent({
			'element': this.el.panel,
			'content': options.content,
			'method': options.method,
			'data': options.data,
			'url': options.contentURL,
			'onContentLoaded': null,
			'require': {
				js: options.require.js,
				onload: options.require.onload
			},
	  		section: 'content'
		});

		// load/build all of the additional  content sections
		if (options.sections) options.sections.each(function(section){
			if (!options.header && (section.position == 'header' || section.position == 'headertool')) return;
			MUI.updateContent(section);
		});

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
			var panel = this.el.panel;
			var panelWrapper = this.el.panelWrapper;

			// Get siblings and make sure they are not all collapsed.
			// If they are all collapsed and the current panel is collapsing
			// Then collapse the column.
			var expandedSiblings = [];

			panelWrapper.getAllPrevious('.panelWrapper').each(function(sibling){
				var panel=sibling.getElement('.panel');
				if(!panel) return;
				var instance = MUI.get(panel.id);
				if (!instance.isCollapsed) expandedSiblings.push(panel.id);
			});

			panelWrapper.getAllNext('.panelWrapper').each(function(sibling){
				var instance = MUI.get(sibling.getElement('.panel').id);
				if (!instance.isCollapsed)
					expandedSiblings.push(sibling.getElement('.panel').id);
			});

			if (this.isCollapsed){
				// Expand Panel
				this.el.content.setStyle('position', null); // This is so IE6 and IE7 will collapse the panel all the way
				panel.setStyle('height', this.oldHeight);
				this.isCollapsed = false;
				panelWrapper.addClass('expanded');
				panelWrapper.removeClass('collapsed');
				MUI.panelHeight(this.options.column, panel, 'expanding');
				MUI.panelHeight(); // Run this a second time for panels within panels
				this.el.collapseToggle.removeClass('panel-expand');
				this.el.collapseToggle.addClass('panel-collapsed');
				this.el.collapseToggle.setProperty('title', 'Collapse Panel');
				this.fireEvent('onExpand');
			} else {
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
				this.fireEvent('onCollapse');
			}
		}.bind(this));
	},

	_addResizeBottom: function(element){
		if (!$(element)) return;
		element = $(element);

		var instance = MUI.get(element.id);
		var handle = instance.el.handle;
		handle.setStyle('cursor', Browser.Engine.webkit ? 'row-resize' : 'n-resize');
		var partner = instance.partner;
		var min = 0;
		var max = function(){
			return element.getStyle('height').toInt() + partner.getStyle('height').toInt();
		}.bind(this);

		if (Browser.Engine.trident){
			handle.addEvents({
				'mousedown': function(){
					handle.setCapture();
				},
				'mouseup': function(){
					handle.releaseCapture();
				}
			});
		}
		instance.resize = element.makeResizable({
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
				if (instance.iframeEl){
					if (Browser.Engine.trident){
						instance.iframeEl.hide();
						partner.getElements('iframe').hide();
					} else {
						instance.iframeEl.setStyle('visibility', 'hidden');
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
				if (instance.iframeEl){
					if (Browser.Engine.trident){
						instance.iframeEl.show();
						partner.getElements('iframe').show();
						// The following hack is to get IE8 Standards Mode to properly resize an iframe
						// when only the vertical dimension is changed.
						var width = instance.iframeEl.getStyle('width').toInt();
						instance.iframeEl.setStyle('width', width - 1);
						MUI.rWidth();
						instance.iframeEl.setStyle('width', width);
					} else {
						instance.iframeEl.setStyle('visibility', 'visible');
						partner.getElements('iframe').setStyle('visibility', 'visible');
					}
				}

				instance.fireEvent('resize');
				MUI.get(partner).fireEvent('resize');
			}.bind(this)
		});
	}

});

MUI.Panel.implement(MUI.WindowPanelShared);
