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
 sections - (array of hashes) - list of additional sections to insert content into
		[{
			position - identifies where to insert the content
						'header' - replaces title and toolbox in header bar, good for tabs - DEFAULT
						'title' - in the panel header bar to the left, with the title text
										can not be used if another section is using header
						'headertool' - in the panel header bar to the right
										can not be used if another section is using header
						'top' - below the panel header bar and above the content
						'bottom' - below the content, above the panel's footer
						'footer' - in the footer of the panel

			 wrap - used to wrap content div, good for things like tabs
			 empty - true to empty the section before inserted, defaults to false
					 ignored when position = 'top' or 'bottom'
			 height - the height of the content div being added
			 id - the name of the content div being added
			 css - root css name for content div being added

			 method - ('get', or 'post') The way data is transmitted. Defaults to get
			 data - (hash) Data to be transmitted
			 content - (string or element) An html loadMethod option.
			 loadMethod - ('html', 'xhr', or 'iframe') defaults to xhr
			 url - Used if loadMethod is set to 'xhr' or 'iframe'.
			 [section] - used to name the section being update, such as 'content,'toolbar','header','footer'
			 onContentLoaded - (function)
		}]
 header - (boolean) Display the panel header or not
 title - (string)
 height - (number) Height of content area.
 addClass - (string) Add a class to the panel.
 scrollbars - (boolean)
 padding - (object)
 collapsible - (boolean)
 onBeforeBuild - (function) Fired before the panel is created.
 onContentLoaded - (function) Fired after the panel's content is loaded.
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

		// additional content sections
		sections:				false,

		// header
		header:					true,
		title:					'New Panel',

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
		if (this.options.id == null) this.options.id = 'panel' + (++MUI.IDCount);

		// Shorten object chain
		var instance = MUI.get(this.options.id);
		options = this.options;

		// Check if panel already exists
		if (instance && instance.panelEl){
			return;
		} else {
			MUI.set(this.options.id, this);
			instance = this;
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

		// determine of this panel has a footer
		this.hasFooter = false;
		this.hasHeaderTool = false;
		if(options.sections) {
			options.sections.each(function(section) {
				if(section.position=='footer') instance.hasFooter=true;
				if(section.position=='headertool') instance.hasHeaderTool=true;
			});
		}

		if (this.hasFooter){
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

		this.panelHeaderEl = new Element('div', {
			'id': this.options.id + '_header',
			'class': 'panel-header',
			'styles': {
				'display': options.header ? 'block' : 'none'
			}
		}).inject(this.panelEl, 'before');

		var columnInstance = MUI.get(this.options.column);

		if (this.options.collapsible) this.collapseToggleInit();

		if (this.hasHeaderTool){
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
			'id': options.id + '_title',
			'html': options.title
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

		if (options.sections){
			var snum=0;
			options.sections.each(function(section,idx){
				var intoEl = instance.panelEl;

				snum++;
				var id=options.id + '_' + (section.section || 'section'+snum);

				section = $extend({
						'element':instance.panelEl,
						'wrap':false,
						'position':'header',
						'empty':true,
						'height':29,
						'id':id,
						'css':'mochaToolbar',
						'section':'section'+snum,
						'loadMethod': 'xhr',
						'method': options.method
					   },section);

				var wrap = section.wrap;
				var empty = section.empty;
				var where = section.position == 'bottom' ? 'after' : 'before';

				switch(section.position) {
					case 'header':
						intoEl= instance.panelHeaderContentEl;
						if(!instance.options.header) return;
						break;
					case 'headertool':
						intoEl= instance.panelHeaderToolboxEl;
						if(!instance.options.header) return;
						break;
					case 'footer':
						intoEl= instance.footerEl; break;
				}

				if(wrap){
					section.wrapperEl = new Element('div', {
						'id': section.id + '_wrapper',
						'class': section.css+'Wrapper',
						'styles': { 'height': section.height }
					}).inject(intoEl, where);

					if (section.position == 'bottom') section.wrapperEl.addClass('bottom');
					intoEl = section.wrapperEl;
				}

				if(empty) intoEl.empty();
				section.childElement = new Element('div', {
					'id': section.id,
					'class': section.css,
					'styles': { 'height': section.height }
				}).inject( intoEl );

				section.wrapperEl = intoEl;
				if(section.wrap && section.position == 'bottom') section.childElement.addClass('bottom');

				instance.options.sections[idx] = section;
			});
		}

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

		// load/build all of the additional  content sections
		if (options.sections) options.sections.each(function(section){
			if(!options.header && (section.position=='header' || section.position=='headertool')) return;
			MUI.updateContent(section);
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

		if (this.hasHeaderTool) this.panelHeaderCollapseBoxEl.addClass('divider');

		this.collapseToggleEl = new Element('div', {
			'id': options.id + '_collapseToggle',
			'class': 'panel-collapse icon16',
			'styles': {
				'width': 16,
				'height': 16
			},
			'title': 'Collapse Panel'
		}).inject(this.panelHeaderCollapseBoxEl);

		this.collapseToggleEl.addEvent('click', function() {
			var panel = this.panelEl;
			var panelWrapper = this.panelWrapperEl;

			// Get siblings and make sure they are not all collapsed.
			// If they are all collapsed and the current panel is collapsing
			// Then collapse the column.
			var expandedSiblings = [];

			panelWrapper.getAllPrevious('.panelWrapper').each(function(sibling) {
				var instance = MUI.get(sibling.getElement('.panel').id);
				if (!instance.isCollapsed)
					expandedSiblings.push(sibling.getElement('.panel').id);
			});

			panelWrapper.getAllNext('.panelWrapper').each(function(sibling) {
				var instance = MUI.get(sibling.getElement('.panel').id);
				if (!instance.isCollapsed)
					expandedSiblings.push(sibling.getElement('.panel').id);
			});

			if (this.isCollapsed) {
				// Expand Panel
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
			} else {
				// Collapse Panel
				var currentColumn = MUI.get($(options.column).id);

				if (expandedSiblings.length == 0 && currentColumn.options.placement != 'main') {
					currentColumn = MUI.get($(options.column).id);
					currentColumn.columnToggle();
					return;
				} else if (expandedSiblings.length == 0 && currentColumn.options.placement == 'main') {
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
				if (instance.iframeEl) {
					if (Browser.Engine.trident) {
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
				if (instance.iframeEl) {
					if (Browser.Engine.trident) {
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

	}

});

MUI.Panel.implement(MUI.WindowPanelShared);
