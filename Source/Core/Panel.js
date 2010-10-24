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

MUI.files[MUI.path.source + 'Panel.js'] = 'loaded';

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
 headerToolbox: (boolean)
 headerToolboxURL: (url)
 headerToolboxOnload: (function)
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
MUI.Panel = new Class({

	Implements: [Events, Options],

	options: {
		id:						null,
		title:					'New Panel',
		column:					null,
		require:				{
			css:			[],
			images:			[],
			js:				[],
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
		//tabsOnload:			null,

		header:					true,
		headerToolbox:			false,
		headerToolboxURL:		'pages/lipsum.html',
		//headerToolboxOnload:	null,

		// Style options:
		height:					125,
		addClass:				'',
		scrollbars:				true,
		padding:				{ top: 8, right: 8, bottom: 8, left: 8 },

		// Other:
		collapsible:			true

		// Events
		//onBeforeBuild:		null,
		//onContentLoaded:		null,
		//onResize:				null,
		//onCollapse:			null,
		//onExpand:				null

	},
	initialize: function(options){
		this.setOptions(options);

		Object.append(this, {
			timestamp: Date.now(),
			isCollapsed: false,	// This is probably redundant since we can check for the class
			oldHeight: 0,
			partner: null
		});

		// If panel has no ID, give it one.
		if (this.options.id == null){
			this.options.id = 'panel' + (++MUI.Panels.panelIDCount);
		}

		// Shorten object chain
		var instance;
		var instances = MUI.Panels.instances;
		var instanceID = instances[this.options.id];
		options = this.options;

		// Check to see if there is already a class instance for this panel
		if (instanceID){
			instance = instanceID;
		}

		// Check if panel already exists
		if (this.panelEl) return;
		else instances[this.options.id] = this;

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

		var columnInstances = MUI.Columns.instances;
		var columnInstance = columnInstances[this.options.column];

		if (this.options.collapsible){
			this.collapseToggleInit();
		}

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
				this.panelHeaderToolboxEl.setStyle("cursor", "default");
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
		}).inject(this.panelEl, 'after');

		this.handleIconEl = new Element('div', {
			'id': options.id + '_handle_icon',
			'class': 'handleIcon'
		}).inject(this.handleEl);

		addResizeBottom(options.id);

		if (options.require.css.length || options.require.images.length){
			new MUI.Require({
				css: options.require.css,
				images: options.require.images,
				onload: function(){
					this.newPanel();
				}.bind(this)
			});
		}
		else {
			this.newPanel();
		}
	},
	newPanel: function(){

		var options = this.options;

		if (this.options.headerToolbox){
			MUI.updateContent({
				'element': this.panelEl,
				'childElement': this.panelHeaderToolboxEl,
				'loadMethod': 'xhr',
				'url': options.headerToolboxURL,
				'onContentLoaded': options.headerToolboxOnload
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
				'onContentLoaded': options.tabsOnload
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
			}
		});

		// Do this when creating and removing panels
		$(options.column).getChildren('.panelWrapper').each(function(panelWrapper){
			panelWrapper.getElement('.panel').removeClass('bottomPanel');
		});
		$(options.column).getChildren('.panelWrapper').getLast().getElement('.panel').addClass('bottomPanel');

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
			var instances = MUI.Panels.instances;
			var expandedSiblings = [];

			panelWrapper.getAllPrevious('.panelWrapper').each(function(sibling){
				var instance = instances[sibling.getElement('.panel').id];
				if (!instance.isCollapsed){
					expandedSiblings.push(sibling.getElement('.panel').id);
				}
			});

			panelWrapper.getAllNext('.panelWrapper').each(function(sibling){
				var instance = instances[sibling.getElement('.panel').id];
				if (!instance.isCollapsed){
					expandedSiblings.push(sibling.getElement('.panel').id);
				}
			});

			// Collapse Panel
			if (!this.isCollapsed){
				var currentColumn = MUI.Columns.instances[$(options.column).id];

				if (expandedSiblings.length == 0 && currentColumn.options.placement != 'main'){
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
	}
});

/*
 arguments:
 column - The column to resize the panels in
 changing -  The panel that is collapsing, expanding, or new
 action - collapsing, expanding, or new

 */
MUI.append({
	// Panel Height
	panelHeight: function(column, changing, action){
		if (column != null){
			MUI.panelHeight2($(column), changing, action);
		}
		else {
			$$('.column').each(function(column){
				MUI.panelHeight2(column);
			}.bind(this));
		}
	},
	/*

	 actions can be new, collapsing or expanding.

	 */
	panelHeight2: function(column, changing, action){

		var instances = MUI.Panels.instances;

		var parent = column.getParent();
		var columnHeight = parent.getStyle('height').toInt();
		if (Browser.ie4 && parent == MUI.Desktop.pageWrapper){
			columnHeight -= 1;
		}
		column.setStyle('height', columnHeight);

		// Get column panels
		var panels = [];
		column.getChildren('.panelWrapper').each(function(panelWrapper){
			panels.push(panelWrapper.getElement('.panel'));
		}.bind(this));

		// Get expanded column panels
		var panelsExpanded = [];
		column.getChildren('.expanded').each(function(panelWrapper){
			panelsExpanded.push(panelWrapper.getElement('.panel'));
		}.bind(this));

		// All the panels in the column whose height will be effected.
		var panelsToResize = [];

		// The panel with the greatest height. Remainders will be added to this panel
		var tallestPanel;
		var tallestPanelHeight = 0;

		this.panelsTotalHeight = 0; // Height of all the panels in the column
		this.height = 0; // Height of all the elements in the column

		// Set panel resize partners
		panels.each(function(panel){
			var instance = instances[panel.id];
			if (panel.getParent().hasClass('expanded') && panel.getParent().getNext('.expanded')){
				instance.partner = panel.getParent().getNext('.expanded').getElement('.panel');
				instance.resize.attach();
				instance.handleEl.setStyles({
					'display': 'block',
					'cursor': Browser.webkit ? 'row-resize' : 'n-resize'
				}).removeClass('detached');
			} else {
				instance.resize.detach();
				instance.handleEl.setStyles({
					'display': 'none',
					'cursor': null
				}).addClass('detached');
			}
			if (panel.getParent().getNext('.panelWrapper') == null){
				instance.handleEl.hide();
			}
		}.bind(this));

		// Add panels to panelsToResize
		// Get the total height of all the resizable panels
		// Get the total height of all the column's children
		column.getChildren().each(function(panelWrapper){

			panelWrapper.getChildren().each(function(el){

				if (el.hasClass('panel')){
					var instance = instances[el.id];

					// Are any next siblings Expanded?
					anyNextSiblingsExpanded = function(el){
						var test;
						el.getParent().getAllNext('.panelWrapper').each(function(sibling){
							var siblingInstance = instances[sibling.getElement('.panel').id];
							if (!siblingInstance.isCollapsed){
								test = true;
							}
						}.bind(this));
						return test;
					}.bind(this);

					// If a next sibling is expanding, are any of the nexts siblings of the expanding sibling Expanded?
					anyExpandingNextSiblingsExpanded = function(){
						var test;
						changing.getParent().getAllNext('.panelWrapper').each(function(sibling){
							var siblingInstance = instances[sibling.getElement('.panel').id];
							if (!siblingInstance.isCollapsed){
								test = true;
							}
						}.bind(this));
						return test;
					}.bind(this);

					// Is the panel that is collapsing, expanding, or new located after this panel?
					anyNextContainsChanging = function(el){
						var allNext = [];
						el.getParent().getAllNext('.panelWrapper').each(function(panelWrapper){
							allNext.push(panelWrapper.getElement('.panel'));
						}.bind(this));
						return allNext.contains(changing);
					}.bind(this);

					nextExpandedChanging = function(el){
						var test;
						if (el.getParent().getNext('.expanded')){
							if (el.getParent().getNext('.expanded').getElement('.panel') == changing) test = true;
						}
						return test;
					};

					// NEW PANEL
					// Resize panels that are "new" or not collapsed
					if (action == 'new'){
						if (!instance.isCollapsed && el != changing){
							panelsToResize.push(el);
							this.panelsTotalHeight += el.offsetHeight.toInt();
						}
					}

					// COLLAPSING PANELS and CURRENTLY EXPANDED PANELS
					// Resize panels that are not collapsed.
					// If a panel is collapsing resize any expanded panels below.
					// If there are no expanded panels below it, resize the expanded panels above it.
					else if (action == null || action == 'collapsing'){
						if (!instance.isCollapsed && (!anyNextContainsChanging(el) || !anyNextSiblingsExpanded(el))){
							panelsToResize.push(el);
							this.panelsTotalHeight += el.offsetHeight.toInt();
						}
					}

					// EXPANDING PANEL
					// Resize panels that are not collapsed and are not expanding.
					// Resize any expanded panels below the expanding panel.
					// If there are no expanded panels below the expanding panel, resize the first expanded panel above it.
					else if (action == 'expanding' && !instance.isCollapsed && el != changing){
						if (!anyNextContainsChanging(el) || (!anyExpandingNextSiblingsExpanded(el) && nextExpandedChanging(el))){
							panelsToResize.push(el);
							this.panelsTotalHeight += el.offsetHeight.toInt();
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

		}.bind(this));

		// Get the remaining height
		remainingHeight = column.offsetHeight.toInt() - this.height;

		this.height = 0;

		// Get height of all the column's children
		column.getChildren().each(function(el){
			this.height += el.offsetHeight.toInt();
		}.bind(this));

		remainingHeight = column.offsetHeight.toInt() - this.height;

		panelsToResize.each(function(panel){
			var ratio = this.panelsTotalHeight / panel.offsetHeight.toInt();
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
		column.getChildren().each(function(panelWrapper){
			panelWrapper.getChildren().each(function(el){
				this.height += el.offsetHeight.toInt();
				if (el.hasClass('panel') && el.getStyle('height').toInt() > tallestPanelHeight){
					tallestPanel = el;
					tallestPanelHeight = el.getStyle('height').toInt();
				}
			}.bind(this));
		}.bind(this));

		var remainingHeight = column.offsetHeight.toInt() - this.height;

		if (remainingHeight != 0 && tallestPanelHeight > 0){
			tallestPanel.setStyle('height', tallestPanel.getStyle('height').toInt() + remainingHeight);
			if (tallestPanel.getStyle('height') < 1){
				tallestPanel.setStyle('height', 0);
			}
		}

		parent.getChildren('.columnHandle').each(function(handle){
			var parent = handle.getParent();
			if (parent.getStyle('height').toInt() < 1) return; // Keeps IE7 and 8 from throwing an error when collapsing a panel within a panel
			var handleHeight = parent.getStyle('height').toInt() - handle.getStyle('border-top').toInt() - handle.getStyle('border-bottom').toInt();
			if (Browser.ie4 && parent == MUI.Desktop.pageWrapper){
				handleHeight -= 1;
			}
			handle.setStyle('height', handleHeight);
		});

		panelsExpanded.each(function(panel){
			MUI.resizeChildren(panel);
		}.bind(this));

	},
	// May rename this resizeIframeEl()
	resizeChildren: function(panel){
		var instances = MUI.Panels.instances;
		var instance = instances[panel.id];
		var contentWrapperEl = instance.contentWrapperEl;

		if (instance.iframeEl){
			if (!Browser.ie){
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
		if (container == null) container = MUI.Desktop.desktop;
		container.getElements('.rWidth').each(function(column){
			var currentWidth = column.offsetWidth.toInt();
			currentWidth -= column.getStyle('border-left').toInt();
			currentWidth -= column.getStyle('border-right').toInt();

			var parent = column.getParent();
			this.width = 0;

			// Get the total width of all the parent element's children
			parent.getChildren().each(function(el){
				if (el.hasClass('mocha') != true){
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
				MUI.resizeChildren(panel);
			}.bind(this));

		});
	}

});

function addResizeRight(element, min, max){
	if (!$(element)) return;
	element = $(element);

	var instances = MUI.Columns.instances;
	var instance = instances[element.id];

	var handle = element.getNext('.columnHandle');
	handle.setStyle('cursor', Browser.webkit ? 'col-resize' : 'e-resize');
	if (!min) min = 50;
	if (!max) max = 250;
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
			if (Browser.firefox){
				$$('.panel').each(function(panel){
					if (panel.getElements('.mochaIframe').length == 0){
						panel.hide(); // Fix for a rendering bug in FF
					}
				});
			}
			MUI.rWidth(element.getParent());
			if (Browser.firefox){
				$$('.panel').show(); // Fix for a rendering bug in FF
			}
			if (Browser.ie4){
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
			MUI.rWidth(element.getParent());
			element.getElements('iframe').setStyle('visibility', 'visible');
			element.getNext('.column').getElements('iframe').setStyle('visibility', 'visible');
			instance.fireEvent('onResize');
		}.bind(this)
	});
}

function addResizeLeft(element, min, max){
	if (!$(element)) return;
	element = $(element);

	var instances = MUI.Columns.instances;
	var instance = instances[element.id];

	var handle = element.getPrevious('.columnHandle');
	handle.setStyle('cursor', Browser.webkit ? 'col-resize' : 'e-resize');
	var partner = element.getPrevious('.column');
	if (!min) min = 50;
	if (!max) max = 250;
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
	instance.resize = element.makeResizable({
		handle: handle,
		modifiers: {x: 'width' , y: false},
		invert: true,
		limit: { x: [min, max] },
		onStart: function(){
			$(element).getElements('iframe').setStyle('visibility', 'hidden');
			partner.getElements('iframe').setStyle('visibility', 'hidden');
		}.bind(this),
		onDrag: function(){
			MUI.rWidth(element.getParent());
		}.bind(this),
		onComplete: function(){
			MUI.rWidth(element.getParent());
			$(element).getElements('iframe').setStyle('visibility', 'visible');
			partner.getElements('iframe').setStyle('visibility', 'visible');
			instance.fireEvent('onResize');
		}.bind(this)
	});
}

function addResizeBottom(element){
	if (!$(element)) return;
	element = $(element);

	var instances = MUI.Panels.instances;
	var instance = instances[element.id];
	var handle = instance.handleEl;
	handle.setStyle('cursor', Browser.webkit ? 'row-resize' : 'n-resize');
	partner = instance.partner;
	min = 0;
	max = function(){
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
				if (!Browser.ie){
					instance.iframeEl.setStyle('visibility', 'hidden');
					partner.getElements('iframe').setStyle('visibility', 'hidden');
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
			partnerHeight = partnerOriginalHeight;
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
				if (!Browser.ie){
					instance.iframeEl.setStyle('visibility', 'visible');
					partner.getElements('iframe').setStyle('visibility', 'visible');
				}
				else {
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
			instance.fireEvent('onResize');
		}.bind(this)
	});
}