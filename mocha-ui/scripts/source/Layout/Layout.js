/*

Script: Layout.js
	Create web application layouts. Enables window maximize.
	
Copyright:
	Copyright (c) 2007-2009 Greg Houston, <http://greghoustondesign.com/>.

License:
	MIT-style license.	

Requires:
	Core.js, Window.js
	
*/

MochaUI.extend({
	Columns: {
		instances: new Hash(),
		columnIDCount: 0 // Used for columns without an ID defined by the user
	},
	Panels: {
		instances: new Hash(),
		panelIDCount: 0 // Used for panels without an ID defined by the user
	}
});

MochaUI.Desktop = new Class({

	Extends: MochaUI.Window,

	Implements: [Events, Options],
	
	options: {
		// Naming options:
		// If you change the IDs of the Mocha Desktop containers in your HTML, you need to change them here as well.
		desktop:             'desktop',
		desktopHeader:       'desktopHeader',
		desktopFooter:       'desktopFooter',
		desktopNavBar:       'desktopNavbar',
		pageWrapper:         'pageWrapper',
		page:                'page',
		desktopFooter:       'desktopFooterWrapper'
	},	
	initialize: function(options){
		this.setOptions(options);
		this.desktop         = $(this.options.desktop);
		this.desktopHeader   = $(this.options.desktopHeader);
		this.desktopNavBar   = $(this.options.desktopNavBar);
		this.pageWrapper     = $(this.options.pageWrapper);
		this.page            = $(this.options.page);
		this.desktopFooter   = $(this.options.desktopFooter);
		
		if (this.desktop) {
			($$('body')).setStyles({
				overflow: 'hidden',
				height: '100%',
				margin: 0
			});
			($$('html')).setStyles({
				overflow: 'hidden',
				height: '100%'
			});			
		}		
	
		// This is run on dock initialize so no need to do it twice.
		if (!MochaUI.Dock){
			this.setDesktopSize();
		}
		this.menuInitialize();		

		// Resize desktop, page wrapper, modal overlay, and maximized windows when browser window is resized
		window.addEvent('resize', function(e){
			this.onBrowserResize();
		}.bind(this));
	},
	menuInitialize: function(){
		// Fix for dropdown menus in IE6
		if (Browser.Engine.trident4 && this.desktopNavBar){
			this.desktopNavBar.getElements('li').each(function(element) {
				element.addEvent('mouseenter', function(){
					this.addClass('ieHover');
				});
				element.addEvent('mouseleave', function(){
					this.removeClass('ieHover');
				});
			});
		};
	},
	onBrowserResize: function(){
		this.setDesktopSize();
		// Resize maximized windows to fit new browser window size
		setTimeout( function(){
			MochaUI.Windows.instances.each(function(instance){
				if (instance.isMaximized){

					// Hide iframe while resize for better performance
					if ( instance.iframeEl ){
						instance.iframeEl.setStyle('visibility', 'hidden');
					}

					var coordinates = document.getCoordinates();
					var borderHeight = instance.contentBorderEl.getStyle('border-top').toInt() + instance.contentBorderEl.getStyle('border-bottom').toInt();
					var toolbarHeight = instance.toolbarWrapperEl ? instance.toolbarWrapperEl.getStyle('height').toInt() + instance.toolbarWrapperEl.getStyle('border-top').toInt() : 0;
					instance.contentWrapperEl.setStyles({
						'height': coordinates.height - instance.options.headerHeight - instance.options.footerHeight - borderHeight - toolbarHeight,
						'width': coordinates.width
					});

					instance.drawWindow();
					if ( instance.iframeEl ){
						instance.iframeEl.setStyles({
							'height': instance.contentWrapperEl.getStyle('height')
						});
						instance.iframeEl.setStyle('visibility', 'visible');
					}

				}
			}.bind(this));
		}.bind(this), 100);
	},
	setDesktopSize: function(){
		var windowDimensions = window.getCoordinates();

		// var dock = $(MochaUI.options.dock);
		var dockWrapper = $(MochaUI.options.dockWrapper);
		
		// Setting the desktop height may only be needed by IE7
		if (this.desktop){
			this.desktop.setStyle('height', windowDimensions.height);
		}

		// Set pageWrapper height so the dock doesn't cover the pageWrapper scrollbars.
		if (this.pageWrapper) {
			var dockOffset = MochaUI.dockVisible ? dockWrapper.offsetHeight : 0;
			var pageWrapperHeight = windowDimensions.height;
			pageWrapperHeight -= this.pageWrapper.getStyle('border-top').toInt();
			pageWrapperHeight -= this.pageWrapper.getStyle('border-bottom').toInt();
			if (this.desktopHeader){ pageWrapperHeight -= this.desktopHeader.offsetHeight; }
			if (this.desktopFooter){ pageWrapperHeight -= this.desktopFooter.offsetHeight; }
			pageWrapperHeight -= dockOffset;

			if (pageWrapperHeight < 0){
				pageWrapperHeight = 0;
			}
			this.pageWrapper.setStyle('height', pageWrapperHeight);
		}

		if (MochaUI.Columns.instances.getKeys().length > 0){ // Conditional is a fix for a bug in IE6 in the no toolbars demo.
			MochaUI.Desktop.resizePanels();
		}		
	},
	resizePanels: function(){
		MochaUI.panelHeight();
		MochaUI.rWidth();	
	},	
	/*
	
	Function: maximizeWindow
		Maximize a window.
	
	Syntax:
		(start code)
		MochaUI.Desktop.maximizeWindow(windowEl);
		(end)	

	*/	
	maximizeWindow: function(windowEl){

		var instance = MochaUI.Windows.instances.get(windowEl.id);
		var options = instance.options;
		var windowDrag = instance.windowDrag;

		// If window no longer exists or is maximized, stop
		if (windowEl != $(windowEl) || instance.isMaximized ) return;
		
		if (instance.isCollapsed){
			MochaUI.collapseToggle(windowEl);	
		}

		instance.isMaximized = true;
		
		// If window is restricted to a container, it should not be draggable when maximized.
		if (instance.options.restrict){
			windowDrag.detach();
			if (options.resizable) {
				instance.detachResizable();
			}
			instance.titleBarEl.setStyle('cursor', 'default');
		}	

		// If the window has a container that is not the desktop
		// temporarily move the window to the desktop while it is minimized.
		if (options.container != this.desktop){
			this.desktop.grab(windowEl);
			if (this.options.restrict){
			windowDrag.container = this.desktop;
			}
		}		

		// Save original position
		instance.oldTop = windowEl.getStyle('top');
		instance.oldLeft = windowEl.getStyle('left');

		var contentWrapperEl = instance.contentWrapperEl;

		// Save original dimensions
		contentWrapperEl.oldWidth = contentWrapperEl.getStyle('width');
		contentWrapperEl.oldHeight = contentWrapperEl.getStyle('height');

		// Hide iframe
		// Iframe should be hidden when minimizing, maximizing, and moving for performance and Flash issues
		if ( instance.iframeEl ) {
			if (!Browser.Engine.trident) {
				instance.iframeEl.setStyle('visibility', 'hidden');
			}
			else {
				instance.iframeEl.hide();
			}
		}
		
		var windowDimensions = document.getCoordinates();
		var options = instance.options;
		var shadowBlur = options.shadowBlur;
		var shadowOffset = options.shadowOffset;
		var newHeight = windowDimensions.height - options.headerHeight - options.footerHeight;
		newHeight -= instance.contentBorderEl.getStyle('border-top').toInt();
		newHeight -= instance.contentBorderEl.getStyle('border-bottom').toInt();
		newHeight -= (instance.toolbarWrapperEl ? instance.toolbarWrapperEl.getStyle('height').toInt() + instance.toolbarWrapperEl.getStyle('border-top').toInt() : 0);
		
		MochaUI.resizeWindow(windowEl, {
			width: windowDimensions.width,
			height: newHeight,
			top: shadowOffset.y - shadowBlur,
			left: shadowOffset.x - shadowBlur
		});
		instance.fireEvent('onMaximize', windowEl);
		
		if (instance.maximizeButtonEl) {
			instance.maximizeButtonEl.setProperty('title', 'Restore');
		}
		MochaUI.focusWindow(windowEl);

	},
	/*

	Function: restoreWindow
		Restore a maximized window.

	Syntax:
		(start code)
		MochaUI.Desktop.restoreWindow(windowEl);
		(end)	

	*/	
	restoreWindow: function(windowEl){	
	
		var instance = windowEl.retrieve('instance');
		
		// Window exists and is maximized ?
		if (windowEl != $(windowEl) || !instance.isMaximized) return;
			
		var options = instance.options;
		instance.isMaximized = false;
		
		if (options.restrict){
			instance.windowDrag.attach();
			if (options.resizable){
				instance.reattachResizable();
			}			
			instance.titleBarEl.setStyle('cursor', 'move');
		}		
		
		// Hide iframe
		// Iframe should be hidden when minimizing, maximizing, and moving for performance and Flash issues
		if ( instance.iframeEl ) {
			if (!Browser.Engine.trident) {
				instance.iframeEl.setStyle('visibility', 'hidden');
			}
			else {
				instance.iframeEl.hide();
			}
		}
		
		var contentWrapperEl = instance.contentWrapperEl;	
		
		MochaUI.resizeWindow(windowEl,{
			width: contentWrapperEl.oldWidth,
			height: contentWrapperEl.oldHeight,
			top: instance.oldTop,
			left: instance.oldLeft
		});
		instance.fireEvent('onRestore', windowEl);
				
		if (instance.maximizeButtonEl){		
			instance.maximizeButtonEl.setProperty('title', 'Maximize');
		}
	}
});
MochaUI.Desktop.implement(new Options, new Events);

/*

Class: Column
	Create a column. Columns should be created from left to right.

Syntax:
(start code)
	MochaUI.Column();
(end)

Arguments:
	options

Options:
	id - The ID of the column. This must be set when creating the column.
	container - Defaults to MochaUI.Desktop.pageWrapper. 	
	placement - Can be 'right', 'main', or 'left'. There must be at least one column with the 'main' option.
	width - 'main' column is fluid and should not be given a width.
	resizeLimit - resizelimit of a 'right' or 'left' column.
	onResize - (function) Fired when the column is resized.
	onCollapse - (function) Fired when the column is collapsed.
	onExpand - (function) Fired when the column is expanded.
		
*/
MochaUI.Column = new Class({

	Extends: MochaUI.Desktop,

	Implements: [Events, Options],

	options: {
		id:            null,
		container:     null,
		placement:     null, 
		width:         null,
		resizeLimit:   [],

		// Events
		onResize:     $empty, 
		onCollapse:   $empty,
		onExpand:     $empty

	},
	initialize: function(options){
		this.setOptions(options);
		
		$extend(this, {
			timestamp: $time(),
			isCollapsed: false,
			oldWidth: 0
		});
		
		// If column has no ID, give it one.
		if (this.options.id == null){
			this.options.id = 'column' + (++MochaUI.Columns.columnIDCount);
		}		

		// Shorten object chain
		var options = this.options;
		var instances = MochaUI.Columns.instances;
		var instanceID = instances.get(options.id);

		if (options.container == null) {
			options.container = MochaUI.Desktop.pageWrapper
		}
		else {
			$(options.container).setStyle('overflow', 'hidden');
		}

		// Check to see if there is already a class instance for this Column
		if (instanceID){
			var instance = instanceID;
		}

		// Check if column already exists
		if ( this.columnEl ){
			return;
		}
		else {			
			instances.set(options.id, this);
		}		
		
		// If loading columns into a panel, hide the regular content container.
		if ($(options.container).getElement('.pad') != null) {
			$(options.container).getElement('.pad').hide();
		}
		
		// If loading columns into a window, hide the regular content container.
		if ($(options.container).getElement('.mochaContent') != null) {
			$(options.container).getElement('.mochaContent').hide();
		}
		
		this.columnEl = new Element('div', {
			'id': this.options.id,
			'class': 'column expanded',
			'styles': {
				'width': options.placement == 'main' ? null : options.width
			}
		}).inject($(options.container));
		
		this.columnEl.store('instance', this);
		
		var parent = this.columnEl.getParent();
		var columnHeight = parent.getStyle('height').toInt();
		this.columnEl.setStyle('height', columnHeight);
		
		if (options.placement == 'main'){
			this.columnEl.addClass('rWidth');
		}
		
		this.spacerEl = new Element('div', {
			'id': this.options.id + '_spacer',
			'class': 'horizontalHandle'
		}).inject(this.columnEl);

		switch (this.options.placement) {
			case 'left':
				this.handleEl = new Element('div', {
					'id': this.options.id + '_handle',
					'class': 'columnHandle'
				}).inject(this.columnEl, 'after');

				this.handleIconEl = new Element('div', {
					'id': options.id + '_handle_icon',
					'class': 'handleIcon'
				}).inject(this.handleEl);

				addResizeRight(this.columnEl, options.resizeLimit[0], options.resizeLimit[1]);
				break;
			case 'right':
				this.handleEl = new Element('div', {
					'id': this.options.id + '_handle',
					'class': 'columnHandle'
				}).inject(this.columnEl, 'before');

				this.handleIconEl = new Element('div', {
					'id': options.id + '_handle_icon',
					'class': 'handleIcon'
				}).inject(this.handleEl);
				addResizeLeft(this.columnEl, options.resizeLimit[0], options.resizeLimit[1]);
				break;
		}

		if (this.handleEl != null){
			this.handleEl.addEvent('dblclick', function(){
				this.columnToggle();
			}.bind(this));
		}

		MochaUI.rWidth();

	},
	columnToggle: function(){
		var column = this.columnEl;
		
		// Collapse
		if (this.isCollapsed == false){
			this.oldWidth = column.getStyle('width').toInt();

			this.resize.detach();
			this.handleEl.removeEvents('dblclick');
			this.handleEl.addEvent('click', function(){
				this.columnToggle();
			}.bind(this));
			this.handleEl.setStyle('cursor', 'pointer').addClass('detached');
			
			column.setStyle('width', 0);
			this.isCollapsed = true;
			column.addClass('collapsed');
			column.removeClass('expanded');
			MochaUI.rWidth();		
			this.fireEvent('onCollapse');
		}
		// Expand
		else {
			column.setStyle('width', this.oldWidth);
			this.isCollapsed = false;
			column.addClass('expanded');
			column.removeClass('collapsed');

			this.handleEl.removeEvents('click');
			this.handleEl.addEvent('dblclick', function(){
				this.columnToggle();
			}.bind(this));
			this.resize.attach();
			this.handleEl.setStyle('cursor', Browser.Engine.webkit ? 'col-resize' : 'e-resize').addClass('attached');

			MochaUI.rWidth();
			this.fireEvent('onExpand');
		}
	}
});
MochaUI.Column.implement(new Options, new Events);

/*

Class: Panel
	Create a panel. Panels go one on top of another in columns. Create your columns first and then add your panels. Panels should be created from top to bottom, left to right.

Syntax:
(start code)
	MochaUI.Panel();
(end)

Arguments:
	options

Options:
	id - The ID of the panel. This must be set when creating the panel.
	column - Where to inject the panel. This must be set when creating the panel.
	loadMethod - ('html', 'xhr', or 'iframe')
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
MochaUI.Panel = new Class({
							
	Extends: MochaUI.Desktop,
	
	Implements: [Events, Options],
	
	options: {
		id:                 null,
		title:              'New Panel',
		column:             null,
		loadMethod:         'html',
		contentURL:         'pages/lipsum.html',
	
		// xhr options
		method:             'get',
		data:               null,
		evalScripts:        true,
		evalResponse:       false,
	
		// html options
		content:            'Panel content',
		
		// Tabs
		tabsURL:            null,
		tabsData:           null,
		tabsOnload:         $empty,

		header:             true,		
		headerToolbox:      false,
		headerToolboxURL:   'pages/lipsum.html',
		headerToolboxOnload: $empty,		

		footer:             false,
		footerURL:          'pages/lipsum.html',
		footerData:         null,
		footerOnload:       $empty,
		
		// Style options:
		height:             125,
		addClass:           '',
		scrollbars:         true,
		padding:   		    { top: 8, right: 8, bottom: 8, left: 8 },
		
		// Other:
		collapsible:	    true,

		// Events
		onBeforeBuild:       $empty,
		onContentLoaded:     $empty,
		onResize:            $empty,
		onCollapse:          $empty,
		onExpand:            $empty

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
			this.options.id = 'panel' + (++MochaUI.Panels.panelIDCount);
		}

		// Shorten object chain
		var instances = MochaUI.Panels.instances;
		var instanceID = instances.get(this.options.id);
		var options = this.options;
	
		// Check to see if there is already a class instance for this panel
		if (instanceID){
			var instance = instanceID;
		}

		// Check if panel already exists
		if ( this.panelEl ){
			return;
		}
		else {			
			instances.set(this.options.id, this);
		}

		this.fireEvent('onBeforeBuild');		
		
		if (options.loadMethod == 'iframe') {
			// Iframes have their own padding.
			options.padding = { top: 0, right: 0, bottom: 0, left: 0 };
		}

		this.showHandle = true;
		if ($(options.column).getChildren().length == 0) {
			this.showHandle = false;
		}
		
		this.panelEl = new Element('div', {
			'id': this.options.id,
			'class': 'panel expanded',
			'styles': {
				'height': options.height
			}
		}).inject($(options.column));
		
		this.panelEl.store('instance', this);
		
		this.panelEl.addClass(options.addClass);
		
		this.contentEl = new Element('div', {
			'id': options.id + '_pad',
			'class': 'pad'
		}).inject(this.panelEl);
		
		if (options.footer) {
			this.footerWrapperEl = new Element('div', {
				'id': options.id + '_panelFooterWrapper',
				'class': 'panel-footerWrapper'
			}).inject(this.panelEl);
			
			this.footerEl = new Element('div', {
				'id': options.id + '_panelFooter',
				'class': 'panel-footer'
			}).inject(this.footerWrapperEl);
			
			MochaUI.updateContent({
				'element': this.panelEl,
				'childElement': this.footerEl,
				'loadMethod': 'xhr',
				'data': options.footerData,
				'url': options.footerURL,
				'onContentLoaded': options.footerOnload
			});
			
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
		
		if (this.options.collapsible) {
			this.collapseToggleInit();
		}
		
		if (this.options.headerToolbox) {
			this.panelHeaderToolboxEl = new Element('div', {
				'id': options.id + '_headerToolbox',
				'class': 'panel-header-toolbox'
			}).inject(this.panelHeaderEl);
			
			MochaUI.updateContent({
				'element': this.panelEl,
				'childElement': this.panelHeaderToolboxEl,
				'loadMethod': 'xhr',
				'url': options.headerToolboxURL,
				'onContentLoaded': options.headerToolboxOnload
			});
		}
		this.panelHeaderContentEl = new Element('div', {
			'id': options.id + '_headerContent',
			'class': 'panel-headerContent'
		}).inject(this.panelHeaderEl);
		
		this.titleEl = new Element('h2', {
			'id': options.id + '_title'
		}).inject(this.panelHeaderContentEl);
		
		if (options.tabsURL == null) {
			this.titleEl.set('html', options.title);
		} else {
			this.panelHeaderContentEl.addClass('tabs');
			MochaUI.updateContent({
				'element': this.panelEl,
				'childElement': this.panelHeaderContentEl,
				'loadMethod': 'xhr',
				'url': options.tabsURL,
				'data': options.tabsData,
				'onContentLoaded': options.tabsOnload
			});
		}

		this.handleEl = new Element('div', {
			'id': options.id + '_handle',
			'class': 'horizontalHandle',
			'styles': {
				'display': this.showHandle == true ? 'block' : 'none'
			}
		}).inject(this.panelEl, 'after');
		
		this.handleIconEl = new Element('div', {
			'id': options.id + '_handle_icon',
			'class': 'handleIcon'
		}).inject(this.handleEl);
		
		addResizeBottom(options.id);
		
		// Add content to panel.
		MochaUI.updateContent({
			'element': this.panelEl,
			'content': options.content,
			'method': options.method,
			'data': options.data,
			'url': options.contentURL,
			'onContentLoaded': null
		});
		
		// Do this when creating and removing panels
		$(options.column).getChildren('.panel').each( function(panel){
			panel.removeClass('bottomPanel');
		});
		$(options.column).getChildren('.panel').getLast().addClass('bottomPanel');
		
		MochaUI.panelHeight(options.column, this.panelEl, 'new');

	},
	collapseToggleInit: function(options){

		var options = this.options;

		this.panelHeaderCollapseBoxEl = new Element('div', {
			'id': options.id + '_headerCollapseBox',
			'class': 'toolbox'
		}).inject(this.panelHeaderEl);

		if (options.headerToolbox) {
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

		this.collapseToggleEl.addEvent('click', function(event){
			var panel = this.panelEl;
			
			// Get siblings and make sure they are not all collapsed.
			var instances = MochaUI.Panels.instances;
			var expandedSiblings = [];
			panel.getAllPrevious('.panel').each(function(sibling){
				var instance = instances.get(sibling.id);
				if (instance.isCollapsed == false){
					expandedSiblings.push(sibling);
				}
			});
			panel.getAllNext('.panel').each(function(sibling){
				var instance = instances.get(sibling.id);
				if (instance.isCollapsed == false){
					expandedSiblings.push(sibling);
				}
			});

			if (this.isCollapsed == false) {
				var currentColumn = MochaUI.Columns.instances.get($(options.column).id);

				if (expandedSiblings.length == 0 && currentColumn.options.placement != 'main'){
					var currentColumn = MochaUI.Columns.instances.get($(options.column).id);
					currentColumn.columnToggle();
					return;
				}
				else if (expandedSiblings.length == 0 && currentColumn.options.placement == 'main'){
					return;
				}
				this.oldHeight = panel.getStyle('height').toInt();
				if (this.oldHeight < 10) this.oldHeight = 20;
				this.contentEl.setStyle('position', 'absolute'); // This is so IE6 and IE7 will collapse the panel all the way		
				panel.setStyle('height', 0);								
				this.isCollapsed = true;
				panel.addClass('collapsed');				
				panel.removeClass('expanded');
				MochaUI.panelHeight(options.column, panel, 'collapsing');
				MochaUI.panelHeight(); // Run this a second time for panels within panels
				this.collapseToggleEl.removeClass('panel-collapsed');
				this.collapseToggleEl.addClass('panel-expand');
				this.collapseToggleEl.setProperty('title','Expand Panel');
				this.fireEvent('onCollapse');				
			}
			else {
				this.contentEl.setStyle('position', null); // This is so IE6 and IE7 will collapse the panel all the way				
				panel.setStyle('height', this.oldHeight);
				this.isCollapsed = false;
				panel.addClass('expanded');
				panel.removeClass('collapsed');				
				MochaUI.panelHeight(this.options.column, panel, 'expanding');
				MochaUI.panelHeight(); // Run this a second time for panels within panels
				this.collapseToggleEl.removeClass('panel-expand');
				this.collapseToggleEl.addClass('panel-collapsed');
				this.collapseToggleEl.setProperty('title','Collapse Panel');
				this.fireEvent('onExpand');
			}
		}.bind(this));	
	}	
});
MochaUI.Panel.implement(new Options, new Events);


MochaUI.extend({
	// Panel Height	
	panelHeight: function(column, changing, action){
		if (column != null) {
			MochaUI.panelHeight2($(column), changing, action);
		}
		else {
			$$('.column').each(function(column){
				MochaUI.panelHeight2(column);
			}.bind(this));
		}
	},
	/*

	actions can be new, collapsing or expanding.

	*/
	panelHeight2: function(column, changing, action){

		var instances = MochaUI.Panels.instances;
		
		var parent = column.getParent();
		var columnHeight = parent.getStyle('height').toInt();
		if (Browser.Engine.trident4 && parent == MochaUI.Desktop.pageWrapper) {
			columnHeight -= 1;
		}
		column.setStyle('height', columnHeight);
		
		var panels = column.getChildren('.panel'); // All the panels in the column.
		var panelsExpanded = column.getChildren('.expanded'); // All the expanded panels in the column.
		var panelsToResize = []; // All the panels in the column whose height will be effected.
		var tallestPanel; // The panel with the greatest height
		var tallestPanelHeight = 0;
		
		this.panelsHeight = 0; // Height of all the panels in the column	
		this.height = 0; // Height of all the elements in the column	
		// Set panel resize partners
		panels.each(function(panel){
			instance = instances.get(panel.id);
			if (panel.hasClass('expanded') && panel.getNext('.expanded')) {
				instance.partner = panel.getNext('.expanded');
				instance.resize.attach();
				instance.handleEl.setStyles({
					'display': 'block',
					'cursor': Browser.Engine.webkit ? 'row-resize' : 'n-resize'
				}).removeClass('detached');
			} else {
				instance.resize.detach();
				instance.handleEl.setStyle('cursor', null).addClass('detached');
			}
			if (panel.getNext('.panel') == null) {
				instance.handleEl.hide();
			}
		}.bind(this));
			
		// Get the total height of all the column's children
		column.getChildren().each(function(el){

		if (el.hasClass('panel')){
			var instance = instances.get(el.id);

			// Are any next siblings Expanded?
			areAnyNextSiblingsExpanded = function(el){
				var test;
					el.getAllNext('.panel').each(function(sibling){
						var siblingInstance = instances.get(sibling.id);
						if (siblingInstance.isCollapsed == false){
							test = true;
						}
					}.bind(this));
					return test;
				}.bind(this);

				// If a next sibling is expanding, are any of the nexts siblings of the expanding sibling Expanded?
				areAnyExpandingNextSiblingsExpanded = function(){
					var test;
					changing.getAllNext('.panel').each(function(sibling){
						var siblingInstance = instances.get(sibling.id);
						if (siblingInstance.isCollapsed == false){
							test = true;
						}
					}.bind(this));
					return test;
				}.bind(this);
					
				// Resize panels that are not collapsed or "new"
				if (action == 'new' ) {
					if (instance.isCollapsed != true && el != changing) {
						panelsToResize.push(el);
					}
					
					// Height of panels that can be resized
					if (instance.isCollapsed != true && el != changing) {
						this.panelsHeight += el.offsetHeight.toInt();
					}
				}
				// Resize panels that are not collapsed. If a panel is collapsing
				// resize any expanded panels below. If there are no expanded panels
				// below it, resize the expanded panels above it.
				else if (action == null || action == 'collapsing' ){
					if (instance.isCollapsed != true && (el.getAllNext('.panel').contains(changing) != true || areAnyNextSiblingsExpanded(el) != true)){
						panelsToResize.push(el);
					}
					
					// Height of panels that can be resized
					if (instance.isCollapsed != true && (el.getAllNext('.panel').contains(changing) != true || areAnyNextSiblingsExpanded(el) != true)){
						this.panelsHeight += el.offsetHeight.toInt();
					}
				}
				// Resize panels that are not collapsed and are not expanding.
				// Resize any expanded panels below the expanding panel. If there are no expanded panels
				// below it, resize the first expanded panel above it.
				else if (action == 'expanding'){
					   
					if (instance.isCollapsed != true && (el.getAllNext('.panel').contains(changing) != true || (areAnyExpandingNextSiblingsExpanded() != true && el.getNext('.expanded') == changing)) && el != changing){
						panelsToResize.push(el);
					}
					// Height of panels that can be resized
					if (instance.isCollapsed != true && (el.getAllNext('.panel').contains(changing) != true || (areAnyExpandingNextSiblingsExpanded() != true && el.getNext('.expanded') == changing)) && el != changing){
						this.panelsHeight += el.offsetHeight.toInt();
					}
				}

				if (el.style.height){
					this.height += el.getStyle('height').toInt();
				}
			}
			else {
				this.height += el.offsetHeight.toInt();
			}
		}.bind(this));

		// Get the remaining height
		var remainingHeight = column.offsetHeight.toInt() - this.height;
		
		this.height = 0;

		// Get height of all the column's children
		column.getChildren().each(function(el){
			this.height += el.offsetHeight.toInt();
		}.bind(this));
				
		var remainingHeight = column.offsetHeight.toInt() - this.height;

		panelsToResize.each(function(panel){
			var ratio = this.panelsHeight / panel.offsetHeight.toInt();
			var newPanelHeight = panel.getStyle('height').toInt() + (remainingHeight / ratio);
			if (newPanelHeight < 1){
				newPanelHeight = 0;
			}
			panel.setStyle('height', newPanelHeight);
		}.bind(this));	

		// Make sure the remaining height is 0. If not add/subtract the
		// remaining height to the tallest panel. This makes up for browser resizing,
		// off ratios, and users trying to give panels too much height.
			
		// Get height of all the column's children
		this.height = 0;
		column.getChildren().each(function(el){
			this.height += el.offsetHeight.toInt();
			if (el.hasClass('panel') && el.getStyle('height').toInt() > tallestPanelHeight){
				tallestPanel = el;
				tallestPanelHeight = el.getStyle('height').toInt();
			}
		}.bind(this));

		var remainingHeight = column.offsetHeight.toInt() - this.height;

		if ((remainingHeight > 0 || remainingHeight < 0) && tallestPanelHeight > 0){
			tallestPanel.setStyle('height', tallestPanel.getStyle('height').toInt() + remainingHeight );
			if (tallestPanel.getStyle('height') < 1){
				tallestPanel.setStyle('height', 0 );
			}
		}

		parent.getChildren('.columnHandle').each(function(handle){
			var parent = handle.getParent();
			if (parent.getStyle('height').toInt() < 1) return; // Keeps IE7 and 8 from throwing an error when collapsing a panel within a panel
			var handleHeight = parent.getStyle('height').toInt() - handle.getStyle('border-top').toInt() - handle.getStyle('border-bottom').toInt();
			if (Browser.Engine.trident4 && parent == MochaUI.Desktop.pageWrapper){
				handleHeight -= 1;
			}
			handle.setStyle('height', handleHeight);
		});
			
		panelsExpanded.each(function(panel){
			MochaUI.resizeChildren(panel);
		}.bind(this));			
			
	},
	// May rename this resizeIframeEl()
	resizeChildren: function(panel){
		var instances = MochaUI.Panels.instances;
		var instance = instances.get(panel.id);
		var contentWrapperEl = instance.contentWrapperEl;

		if (instance.iframeEl) {
			if (!Browser.Engine.trident) {
				instance.iframeEl.setStyles({
					'height': contentWrapperEl.getStyle('height'),
					'width': contentWrapperEl.offsetWidth - contentWrapperEl.getStyle('border-left').toInt() - contentWrapperEl.getStyle('border-right').toInt()
				});
			}
			else {
				// The following hack is to get IE8 RC1 IE8 Standards Mode to properly resize an iframe
				// when only the vertical dimension is changed.
				instance.iframeEl.setStyles({
					'height': contentWrapperEl.getStyle('height'),
					'width': contentWrapperEl.offsetWidth - contentWrapperEl.getStyle('border-left').toInt() - contentWrapperEl.getStyle('border-right').toInt() - 1
				});
				instance.iframeEl.setStyles({
					'width': contentWrapperEl.offsetWidth - contentWrapperEl.getStyle('border-left').toInt() - contentWrapperEl.getStyle('border-right').toInt()
				});			
			}			
		}				
		
	},
	// Remaining Width
	rWidth: function(container){
		if (container == null) {
			var container = MochaUI.Desktop.desktop;
		}
		container.getElements('.rWidth').each(function(column){
			var currentWidth = column.offsetWidth.toInt();
			currentWidth -= column.getStyle('border-left').toInt();
			currentWidth -= column.getStyle('border-right').toInt();
			
			var parent = column.getParent();
			this.width = 0;
			
			// Get the total width of all the parent element's children
			parent.getChildren().each(function(el){
				if (el.hasClass('mocha') != true) {
					this.width += el.offsetWidth.toInt();
				}
			}.bind(this));
			
			// Add the remaining width to the current element
			var remainingWidth = parent.offsetWidth.toInt() - this.width;
			var newWidth = currentWidth + remainingWidth;
			if (newWidth < 1) newWidth = 0;
			column.setStyle('width', newWidth);
			column.getChildren('.panel').each(function(panel){
				panel.setStyle('width', newWidth - panel.getStyle('border-left').toInt() - panel.getStyle('border-right').toInt());
				MochaUI.resizeChildren(panel);
			}.bind(this));
			
		});
	}

});

function addResizeRight(element, min, max){
	if (!$(element)) return;
	element = $(element);
	
	var instances = MochaUI.Columns.instances;
	var instance = instances.get(element.id);
	
	var handle = element.getNext('.columnHandle');
	handle.setStyle('cursor', Browser.Engine.webkit ? 'col-resize' : 'e-resize');
	if (!min) min = 50;
	if (!max) max = 250;
	if (Browser.Engine.trident) {
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
		modifiers: {
			x: 'width',
			y: false
		},
		limit: {
			x: [min, max]
		},
		onStart: function(){
			element.getElements('iframe').setStyle('visibility', 'hidden');
			element.getNext('.column').getElements('iframe').setStyle('visibility', 'hidden');
		}.bind(this),
		onDrag: function(){
			if (Browser.Engine.gecko) {
				$$('.panel').each(function(panel){
					if (panel.getElements('.mochaIframe').length == 0) {
						panel.hide(); // Fix for a rendering bug in FF
					}
				});
			}
			MochaUI.rWidth(element.getParent());
			if (Browser.Engine.gecko) {
				$$('.panel').show(); // Fix for a rendering bug in FF			
			}
			if (Browser.Engine.trident4) {
				element.getChildren().each(function(el){
					var width = $(element).getStyle('width').toInt();
					width -= el.getStyle('border-right').toInt();
					width -= el.getStyle('border-left').toInt();
					width -= el.getStyle('padding-right').toInt();
					width -= el.getStyle('padding-left').toInt();
					el.setStyle('width', width);
				}.bind(this));
			}
		}.bind(this),
		onComplete: function(){
			MochaUI.rWidth(element.getParent());
			element.getElements('iframe').setStyle('visibility', 'visible');
			element.getNext('.column').getElements('iframe').setStyle('visibility', 'visible');
			instance.fireEvent('onResize');
		}.bind(this)
	});
}

function addResizeLeft(element, min, max){
	if (!$(element)) return;
	element = $(element);

	var instances = MochaUI.Columns.instances;
	var instance = instances.get(element.id);

	var handle = element.getPrevious('.columnHandle');
	handle.setStyle('cursor', Browser.Engine.webkit ? 'col-resize' : 'e-resize');
	var partner = element.getPrevious('.column');
	if (!min) min = 50;
	if (!max) max = 250;
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
		modifiers: {x: 'width' , y: false},
		invert: true,
		limit: { x: [min, max] },
		onStart: function(){
			$(element).getElements('iframe').setStyle('visibility','hidden');
			partner.getElements('iframe').setStyle('visibility','hidden');
		}.bind(this),
		onDrag: function(){
			MochaUI.rWidth(element.getParent());
		}.bind(this),
		onComplete: function(){
			MochaUI.rWidth(element.getParent());
			$(element).getElements('iframe').setStyle('visibility','visible');
			partner.getElements('iframe').setStyle('visibility','visible');
			instance.fireEvent('onResize');			
		}.bind(this)
	});
}

function addResizeBottom(element){
	if (!$(element)) return;
	var element = $(element);
	
	var instances = MochaUI.Panels.instances;
	var instance = instances.get(element.id);
	var handle = instance.handleEl;
	handle.setStyle('cursor', Browser.Engine.webkit ? 'row-resize' : 'n-resize');
	partner = instance.partner;
	min = 0;
	max = function(){
		return element.getStyle('height').toInt() + partner.getStyle('height').toInt();
	}.bind(this);
	
	if (Browser.Engine.trident) {
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
			if (instance.iframeEl) {
				if (!Browser.Engine.trident) {
					instance.iframeEl.setStyle('visibility', 'hidden');
					partner.getElements('iframe').setStyle('visibility','hidden');
				}
				else {
					instance.iframeEl.hide();
					partner.getElements('iframe').hide();
				}
			}
			
		}.bind(this),
		onDrag: function(){
			partnerHeight = partnerOriginalHeight;
			partnerHeight += (this.originalHeight - element.getStyle('height').toInt());
			partner.setStyle('height', partnerHeight);
			MochaUI.resizeChildren(element, element.getStyle('height').toInt());
			MochaUI.resizeChildren(partner, partnerHeight);
			element.getChildren('.column').each( function(column){
				MochaUI.panelHeight(column);
			});
			partner.getChildren('.column').each( function(column){
				MochaUI.panelHeight(column);
			});						
		}.bind(this),
		onComplete: function(){
			partnerHeight = partnerOriginalHeight;
			partnerHeight += (this.originalHeight - element.getStyle('height').toInt());
			partner.setStyle('height', partnerHeight);
			MochaUI.resizeChildren(element, element.getStyle('height').toInt());
			MochaUI.resizeChildren(partner, partnerHeight);
			element.getChildren('.column').each( function(column){
				MochaUI.panelHeight(column);
			});
			partner.getChildren('.column').each( function(column){
				MochaUI.panelHeight(column);
			});			
			if (instance.iframeEl) {
				if (!Browser.Engine.trident) {
					instance.iframeEl.setStyle('visibility', 'visible');
					partner.getElements('iframe').setStyle('visibility','visible');
				}
				else {
					instance.iframeEl.show();
					partner.getElements('iframe').show();
					// The following hack is to get IE8 Standards Mode to properly resize an iframe
					// when only the vertical dimension is changed.
					var width = instance.iframeEl.getStyle('width').toInt();
					instance.iframeEl.setStyle('width', width - 1);
					MochaUI.rWidth();
					instance.iframeEl.setStyle('width', width);									
				}
			}		
			instance.fireEvent('onResize');
		}.bind(this)
	});
}

MochaUI.extend({
	/*

	Function: closeColumn
		Destroys/removes a column.

	Syntax:
	(start code)
		MochaUI.closeColumn();
	(end)

	Arguments: 
		columnEl - the ID of the column to be closed

	Returns:
		true - the column was closed
		false - the column was not closed

	*/	
	closeColumn: function(columnEl){
		var instances = MochaUI.Columns.instances;
		var instance = instances.get(columnEl.id);
		if (columnEl != $(columnEl) || instance.isClosing) return;
			
		instance.isClosing = true;
		
		// Destroy all the panels in the column.
		var panels = columnEl.getChildren('.panel');		
		panels.each(function(panel){
			MochaUI.closePanel($(panel.id));
		}.bind(this));				
		
		if (Browser.Engine.trident) {
			columnEl.dispose();
			if (instance.handleEl != null) {
				instance.handleEl.dispose();
			}			
		}
		else {
			columnEl.destroy();
			if (instance.handleEl != null) {
				instance.handleEl.destroy();
			}			
		}
		if (MochaUI.Desktop) {
			MochaUI.Desktop.resizePanels();
		}	
		instances.erase(instance.options.id);
		return true;		
	},
	/*

	Function: closePanel
		Destroys/removes a panel.

	Syntax:
	(start code)
		MochaUI.closePanel();
	(end)

	Arguments: 
		panelEl - the ID of the panel to be closed

	Returns:
		true - the panel was closed
		false - the panel was not closed

	*/	
	closePanel: function(panelEl){
		var instances = MochaUI.Panels.instances;
		var instance = instances.get(panelEl.id);
		if (panelEl != $(panelEl) || instance.isClosing) return;
		
		var column = instance.options.column;
		
		instance.isClosing = true;
		
		if (Browser.Engine.trident) {
			instance.panelHeaderEl.dispose();
			panelEl.dispose();
			if (instance.handleEl != null) {
				instance.handleEl.dispose();
			}
		}
		else {
			instance.panelHeaderEl.destroy();
			panelEl.destroy();
			if (instance.handleEl != null) {
				instance.handleEl.destroy();
			}
		}
		if (MochaUI.Desktop) {
			MochaUI.Desktop.resizePanels();
		}
		
		// Do this when creating and removing panels
		$(column).getChildren('.panel').each(function(panel){
			panel.removeClass('bottomPanel');
		});
		$(column).getChildren('.panel').getLast().addClass('bottomPanel');
		
		instances.erase(instance.options.id);
		return true;
		
	}
});
