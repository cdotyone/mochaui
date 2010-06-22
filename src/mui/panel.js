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

MUI.files[MUI.path.source + 'panel.js'] = 'loaded';

/*

 Class: Panel
 Create a panel. Panels go one on top of another in columns. Create your columns first and then add your panels. Panels should be created from top to bottom, left to right.

 Syntax:
 (start code)
 MUI.Panel();
 (end)

 Arguments:
 options

 Options:
 id - The ID of the panel. This must be set when creating the panel.
 column - Where to inject the panel. This must be set when creating the panel.
 require - (object) assets additional css, images and js resource, provides onload callback
 loadMethod - ('html', 'xhr', or 'iframe') Defaults to 'html' if there is no contentURL. Defaults to 'xhr' if there is a contentURL. You only really need to set this if using the 'iframe' method. May create a 'panel' loadMethod in the future.
 contentURL - Used if loadMethod is set to 'xhr' or 'iframe'.
 method - ('get', or 'post') The method used to get the data. Defaults to 'get'.
 data - (hash) Data to send with the URL. Defaults to null.
 evalScripts - (boolean) An xhr loadMethod option. Defaults to true.
 evalResponse - (boolean) An xhr loadMethod option. Defaults to false.
 content - (string or element) An html loadMethod option.
 tabsURL - (url)
 tabsData - (hash) Data to send with the URL. Defaults to null.
 tabsOnload - (function)
 header - (boolean) Display the panel header or not
 title - (string)
 headerToolbox: (boolean)
 headerToolboxURL: (url)
 headerToolboxOnload: (function)
 footer - (boolean) Add a panel footer or not
 footerURL - (url)
 footerData - (hash) Data to send with the URL. Defaults to null.
 footerOnload - (function)
 height - (number) Height of content area.
 addClass - (string) Add a class to the panel.
 scrollbars - (boolean)
 padding - (object)
 collapsible - (boolean)
 onBeforeBuild - (function) Fired before the panel is created.
 onContentLoaded - (function) Fired after the panel's conten is loaded.
 onResize - (function) Fired when the panel is resized.
 onCollapse - (function) Fired when the panel is collapsed.
 onExpand - (function) Fired when the panel is expanded.

 */
MUI.Panel = new NamedClass('MUI.Panel', {

	Implements: [Events, Options],

	options: {
		id:						null,
		column:					null,
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
		content:				'Panel content',

		// Tabs
		tabsURL:				null,
		tabsData:				null,
		tabsOnload:				$empty,

		header:					true,
		title:					'New Panel',
		headerToolbox:			false,
		headerToolboxURL:		'pages/lipsum.html',
		headerToolboxOnload:	$empty,

		footer:					false,
		footerURL:				'pages/lipsum.html',
		footerData:				null,
		footerOnload:			$empty,

		// Style options:
		height:					125,
		addClass:				'',
		scrollbars:		 		true,
		padding:				{ top: 8, right: 8, bottom: 8, left: 8 },

		// Other:
		collapsible:			true,

		// Events
		onBeforeBuild:			$empty,
		onContentLoaded:		$empty,
		onResize:				$empty,
		onCollapse:				$empty,
		onExpand:				$empty

	},

	initialize: function(options){
		this.setOptions(options);

		$extend(this, {
			timestamp: $time(),
			isCollapsed: false, // This is probably redundant since we can check for the class
			oldHeight: 0,
			partner: null
		});

		// If panel has no ID, give it one.
		if (this.options.id == null){
			this.options.id = 'panel' + (++MUI.IDCount);
		}

		// Shorten object chain
		var instance = MUI.get(this.options.id);
		options = this.options;

		// Check if panel already exists
		if (this.panelEl){
			return;
		} else {
			MUI.set(this.options.id, this);
		}

		this.fireEvent('onBeforeBuild');

		if (options.loadMethod == 'iframe'){
			// Iframes have their own padding.
			options.padding = { top: 0, right: 0, bottom: 0, left: 0 };
		}

		this.showHandle = $(options.column).getChildren().length != 0;

		this.panelWrapperEl = new Element('div', {
			'id': this.options.id + '_wrapper',
			'class': 'panelWrapper expanded'
		}).inject($(options.column));

		this.panelEl = new Element('div', {
			'id': this.options.id,
			'class': 'panel expanded',
			'styles': {
				'height': options.height
			}
		}).inject(this.panelWrapperEl);

		this.panelEl.store('instance', this);

		this.panelEl.addClass(options.addClass);

		this.contentEl = new Element('div', {
			'id': options.id + '_pad',
			'class': 'pad'
		}).inject(this.panelEl);

		if (options.footer){
			this.footerWrapperEl = new Element('div', {
				'id': options.id + '_panelFooterWrapper',
				'class': 'panel-footerWrapper'
			}).inject(this.panelWrapperEl);

			this.footerEl = new Element('div', {
				'id': options.id + '_panelFooter',
				'class': 'panel-footer'
			}).inject(this.footerWrapperEl);
		}

		// This is in order to use the same variable as the windows do in updateContent.
		// May rethink this.
		this.contentWrapperEl = this.panelEl;

		this.contentEl.setStyles({
			'padding-top': options.padding.top,
			'padding-bottom': options.padding.bottom,
			'padding-left': options.padding.left,
			'padding-right': options.padding.right
		});

		this.panelHeaderEl = new Element('div', {
			'id': this.options.id + '_header',
			'class': 'panel-header',
			'styles': {
				'display': options.header ? 'block' : 'none'
			}
		}).inject(this.panelEl, 'before');

		var columnInstance = MUI.get(this.options.column);

		if (this.options.collapsible) this.collapseToggleInit();

		if (this.options.headerToolbox){
			this.panelHeaderToolboxEl = new Element('div', {
				'id': options.id + '_headerToolbox',
				'class': 'panel-header-toolbox'
			}).inject(this.panelHeaderEl);
		}

		this.panelHeaderContentEl = new Element('div', {
			'id': options.id + '_headerContent',
			'class': 'panel-headerContent'
		}).inject(this.panelHeaderEl);

		if (columnInstance.options.sortable){
			this.panelHeaderEl.setStyle('cursor', 'move');
			columnInstance.options.container.retrieve('sortables').addItems(this.panelWrapperEl);
			if (this.panelHeaderToolboxEl){
				this.panelHeaderToolboxEl.addEvent('mousedown', function(e){
					e = new Event(e).stop();
					e.target.focus();
				});
				this.panelHeaderToolboxEl.setStyle('cursor', 'default');
			}
		}

		this.titleEl = new Element('h2', {
			'id': options.id + '_title'
		}).inject(this.panelHeaderContentEl);

		this.handleEl = new Element('div', {
			'id': options.id + '_handle',
			'class': 'horizontalHandle',
			'styles': {
				'display': this.showHandle ? 'block' : 'none'
			}
		}).inject(this.panelWrapperEl);

		this.handleIconEl = new Element('div', {
			'id': options.id + '_handle_icon',
			'class': 'handleIcon'
		}).inject(this.handleEl);

		this.addResizeBottom(options.id);

		if (options.require.css.length || options.require.images.length){
			new MUI.Require({
				css: options.require.css,
				images: options.require.images,
				onload: function(){
					this.newPanel();
				}.bind(this)
			});
		} else {
			this.newPanel();
		}
	},

	newPanel: function(){

		var options = this.options;

		if (options.footer){
			MUI.updateContent({
				'element': this.panelEl,
				'childElement': this.footerEl,
				'loadMethod': 'xhr',
				'data': options.footerData,
				'url': options.footerURL,
				'onContentLoaded': options.footerOnload,
                'section':'footer'
			});
		}

		if (this.options.headerToolbox){
			MUI.updateContent({
				'element': this.panelEl,
				'childElement': this.panelHeaderToolboxEl,
				'loadMethod': 'xhr',
				'url': options.headerToolboxURL,
				'onContentLoaded': options.headerToolboxOnload,
                'section':'header'
			});
		}

		if (options.tabsURL == null){
			this.titleEl.set('html', options.title);
		} else {
			this.panelHeaderContentEl.addClass('tabs');
			MUI.updateContent({
				'element': this.panelEl,
				'childElement': this.panelHeaderContentEl,
				'loadMethod': 'xhr',
				'url': options.tabsURL,
				'data': options.tabsData,
				'onContentLoaded': options.tabsOnload,
                'section':'tabs'
			});
		}

		// Add content to panel.
		MUI.updateContent({
			'element': this.panelEl,
			'content': options.content,
			'method': options.method,
			'data': options.data,
			'url': options.contentURL,
			'onContentLoaded': null,
			'require': {
				js: options.require.js,
				onload: options.require.onload
			},
            section:'content'
		});

		// Do this when creating and removing panels
		$(options.column).getChildren('.panelWrapper').removeClass('bottomPanel').getLast().addClass('bottomPanel');

		MUI.panelHeight(options.column, this.panelEl, 'new');

	},

	collapseToggleInit: function(options){
		options = this.options;

		this.panelHeaderCollapseBoxEl = new Element('div', {
			'id': options.id + '_headerCollapseBox',
			'class': 'toolbox'
		}).inject(this.panelHeaderEl);

		if (options.headerToolbox){
			this.panelHeaderCollapseBoxEl.addClass('divider');
		}

		this.collapseToggleEl = new Element('div', {
			'id': options.id + '_collapseToggle',
			'class': 'panel-collapse icon16',
			'styles': {
				'width': 16,
				'height': 16
			},
			'title': 'Collapse Panel'
		}).inject(this.panelHeaderCollapseBoxEl);

		this.collapseToggleEl.addEvent('click', function(){
			var panel = this.panelEl;
			var panelWrapper = this.panelWrapperEl;

			// Get siblings and make sure they are not all collapsed.
			// If they are all collapsed and the current panel is collapsing
			// Then collapse the column.
			var expandedSiblings = [];

			panelWrapper.getAllPrevious('.panelWrapper').each(function(sibling){
				var instance = MUI.get(sibling.getElement('.panel').id);
				if (!instance.isCollapsed){
					expandedSiblings.push(sibling.getElement('.panel').id);
				}
			});

			panelWrapper.getAllNext('.panelWrapper').each(function(sibling){
				var instance = MUI.get(sibling.getElement('.panel').id);
				if (!instance.isCollapsed){
					expandedSiblings.push(sibling.getElement('.panel').id);
				}
			});

			// Collapse Panel
			if (!this.isCollapsed){
				var currentColumn = MUI.get($(options.column).id);

				if (expandedSiblings.length == 0 && currentColumn.options.placement != 'main'){
					currentColumn = MUI.get($(options.column).id);
					currentColumn.columnToggle();
					return;
				} else if (expandedSiblings.length == 0 && currentColumn.options.placement == 'main'){
					return;
				}
				this.oldHeight = panel.getStyle('height').toInt();
				if (this.oldHeight < 10) this.oldHeight = 20;
				this.contentEl.setStyle('position', 'absolute'); // This is so IE6 and IE7 will collapse the panel all the way
				panel.setStyle('height', 0);
				this.isCollapsed = true;
				panelWrapper.addClass('collapsed');
				panelWrapper.removeClass('expanded');
				MUI.panelHeight(options.column, panel, 'collapsing');
				MUI.panelHeight(); // Run this a second time for panels within panels
				this.collapseToggleEl.removeClass('panel-collapsed');
				this.collapseToggleEl.addClass('panel-expand');
				this.collapseToggleEl.setProperty('title', 'Expand Panel');
				this.fireEvent('onCollapse');
			}

			// Expand Panel
			else {
				this.contentEl.setStyle('position', null); // This is so IE6 and IE7 will collapse the panel all the way
				panel.setStyle('height', this.oldHeight);
				this.isCollapsed = false;
				panelWrapper.addClass('expanded');
				panelWrapper.removeClass('collapsed');
				MUI.panelHeight(this.options.column, panel, 'expanding');
				MUI.panelHeight(); // Run this a second time for panels within panels
				this.collapseToggleEl.removeClass('panel-expand');
				this.collapseToggleEl.addClass('panel-collapsed');
				this.collapseToggleEl.setProperty('title', 'Collapse Panel');
				this.fireEvent('onExpand');
			}
		}.bind(this));
	},

	addResizeBottom: function(element){
		if (!$(element)) return;
		element = $(element);

		var instance = MUI.get(element.id);
		var handle = instance.handleEl;
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
			limit: { y: [min, max] },
			invert: false,

			onBeforeStart: function(){
				partner = instance.partner;
				this.originalHeight = element.getStyle('height').toInt();
				this.partnerOriginalHeight = partner.getStyle('height').toInt();
			}.bind(this),

			onStart: function(){
				if (instance.iframeEl){
					if (!Browser.Engine.trident){
						instance.iframeEl.setStyle('visibility', 'hidden');
						partner.getElements('iframe').setStyle('visibility', 'hidden');
					} else {
						instance.iframeEl.hide();
						partner.getElements('iframe').hide();
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
					if (!Browser.Engine.trident){
						instance.iframeEl.setStyle('visibility', 'visible');
						partner.getElements('iframe').setStyle('visibility', 'visible');
					} else {
						instance.iframeEl.show();
						partner.getElements('iframe').show();
						// The following hack is to get IE8 Standards Mode to properly resize an iframe
						// when only the vertical dimension is changed.
						var width = instance.iframeEl.getStyle('width').toInt();
						instance.iframeEl.setStyle('width', width - 1);
						MUI.rWidth();
						instance.iframeEl.setStyle('width', width);
					}
				}

				instance.fireEvent('resize');
				MUI.get(partner).fireEvent('resize');
			}.bind(this)
		});
	},

	close: function(){
		var instance = this;
		var column = instance.options.column;
		instance.isClosing = true;

		var columnInstance = MUI.get(column);

		if (columnInstance.options.sortable)
			columnInstance.options.container.retrieve('sortables').removeItems(instance.panelWrapperEl);

		instance.panelWrapperEl.destroy();

		if (MUI.Desktop) MUI.Desktop.resizePanels();

		// Do this when creating and removing panels
		var panels = $(column).getElements('.panelWrapper');
		panels.removeClass('bottomPanel');
		if (panels.length > 0) panels.getLast().addClass('bottomPanel');

		MUI.erase(instance.options.id);
		return true;

	},

    /// intercepts workflow from updateContent
    /// sets title and scroll bars of this window
    updateStart:function(options) {
        if(options.section=='content') {
            // copy padding from main options if not passed in
            if(!options.padding && this.options.padding)
                options.padding = $extend(options,this.options.padding);

            // update padding if requested
            if(options.padding) {
                this.contentEl.setStyles({
                    'padding-top': options.padding.top,
                    'padding-bottom': options.padding.bottom,
                    'padding-left': options.padding.left,
                    'padding-right': options.padding.right
                });
            }

            // set title if given option to do so
            if (options.title) {
                this.options.title = options.title;
                this.titleEl.set('html', options.title);
            }

            // Set scrollbars if loading content in main content container.
            // Always use 'hidden' for iframe windows
            this.contentWrapperEl.setStyles({
                'overflow': this.options.scrollbars != false && options.loadMethod != 'iframe' ? 'auto' : 'hidden'
            });
        }
        return false;  // not used but expected
    },

    /// intercepts workflow from MUI.updateContent
    updateClear:function(options) {
        if(options.section=='content') {
            this.contentEl.show();
            var iframes=this.contentWrapperEl.getElements('.mochaIframe');
            if(iframes) iframes.destroy();
        }
        return true;
    },

    /// intercepts workflow from MUI.updateContent
    updateSetContent:function(options) {
        if(options.section=='content') {
            if(options.loadMethod=='html') this.contentEl.addClass('pad');
            if(options.loadMethod=='iframe') {
                this.contentEl.removeClass('pad');
                this.contentEl.setStyle('padding', '0px');
                this.contentEl.hide();
                options.contentContainer = this.contentWrapperEl;
            }
        }
        return true;	// tells MUI.updateContent to update the content
    }

});
