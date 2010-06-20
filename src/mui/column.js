/*
 ---

 name: Column

 script: column.js

 description: Column control for horizontal layouts.

 copyright: (c) 2010 Contributors in (/AUTHORS.txt).

 license: MIT-style license in (/MIT-LICENSE.txt).

 requires:
 - MochaUI/MUI
 - MUI.Desktop
 - MUI.Panel

 provides: [MUI.Column]

 ...
 */

MUI.files[MUI.path.source + 'column.js'] = 'loaded';

/*

 Class: Column
 Create a column. Columns should be created from left to right.

 Syntax:
 (start code)
 MUI.Column();
 (end)

 Arguments:
 options

 Options:
 id - The ID of the column. This must be set when creating the column.
 container - Defaults to MUI.Desktop.pageWrapper.
 placement - Can be 'right', 'main', or 'left'. There must be at least one column with the 'main' option.
 width - 'main' column is fluid and should not be given a width.
 resizeLimit - resizelimit of a 'right' or 'left' column.
 sortable - (boolean) Whether the panels can be reordered via drag and drop.
 isCollapsed - (boolean) Whether the column is collapsed
 onResize - (function) Fired when the column is resized.
 onCollapse - (function) Fired when the column is collapsed.
 onExpand - (function) Fired when the column is expanded.

 */
MUI.Column = new NamedClass('MUI.Column', {

	Implements: [Events, Options],

	options: {
		id:			null,
		container:	 null,
		placement:	 null,
		width:		 null,
		resizeLimit:   [],
		sortable:	  true,
		isCollapsed:   false,

		// Events
		onResize:	 $empty,
		onCollapse:   $empty,
		onExpand:	 $empty

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
			this.options.id = 'column' + (++MUI.IDCount);
		}

		// Shorten object chain
		options = this.options;

		if (options.container == null){
			options.container = MUI.Desktop.pageWrapper
		} else {
			$(options.container).setStyle('overflow', 'hidden');
		}

		if (typeof this.options.container == 'string'){
			this.options.container = $(this.options.container);
		}

		// Check if column already exists
		if (this.columnEl) return;
		else MUI.set(options.id, this);

		// If loading columns into a panel, hide the regular content container.
		if ($(options.container).getElement('.pad') != null){
			$(options.container).getElement('.pad').hide();
		}

		// If loading columns into a window, hide the regular content container.
		if ($(options.container).getElement('.mochaContent') != null){
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

		if (this.options.sortable){
			if (!this.options.container.retrieve('sortables')){
				var sortables = new Sortables(this.columnEl, {
					opacity: 1,
					handle: '.panel-header',
					constrain: false,
					revert: false,
					onSort: function(){
						$$('.column').each(function(column){
							column.getChildren('.panelWrapper').removeClass('bottomPanel');
							if (column.getChildren('.panelWrapper').getLast()){
								column.getChildren('.panelWrapper').getLast().addClass('bottomPanel');
							}
							column.getChildren('.panelWrapper').each(function(panelWrapper){
								var panel = panelWrapper.getElement('.panel');
								var column = panelWrapper.getParent().id;
								instance = MUI.get(panel.id);
								instance.options.column = column;
								if (instance){
									var nextpanel = panel.getParent().getNext('.expanded');
									if (nextpanel){
										nextpanel = nextpanel.getElement('.panel');
									}
									instance.partner = nextpanel;
								}
							});
							MUI.panelHeight();
						}.bind(this));
					}.bind(this)
				});
				this.options.container.store('sortables', sortables);
			} else {
				this.options.container.retrieve('sortables').addLists(this.columnEl);
			}
		}

		if (options.placement == 'main') this.columnEl.addClass('rWidth');

		switch (this.options.placement){
			case 'left':
				this.handleEl = new Element('div', {
					'id': this.options.id + '_handle',
					'class': 'columnHandle'
				}).inject(this.columnEl, 'after');

				this.handleIconEl = new Element('div', {
					'id': options.id + '_handle_icon',
					'class': 'handleIcon'
				}).inject(this.handleEl);

				this.addResizeRight(this.columnEl, options.resizeLimit[0], options.resizeLimit[1]);
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
				this.addResizeLeft(this.columnEl, options.resizeLimit[0], options.resizeLimit[1]);
				break;
		}

		if (this.options.isCollapsed && this.options.placement != 'main'){
			this.columnToggle();
		}

		if (this.handleEl != null){
			this.handleEl.addEvent('dblclick', function(){
				this.columnToggle();
			}.bind(this));
		}

		MUI.rWidth();

	},

	columnCollapse: function(){
		var column = this.columnEl;

		this.oldWidth = column.getStyle('width').toInt();

		this.resize.detach();
		this.handleEl.removeEvents('dblclick');
		this.handleEl.addEvent('click', function(){
			this.columnExpand();
		}.bind(this));
		this.handleEl.setStyle('cursor', 'pointer').addClass('detached');

		column.setStyle('width', 0);
		this.isCollapsed = true;
		column.addClass('collapsed');
		column.removeClass('expanded');
		MUI.rWidth();
		this.fireEvent('onCollapse');

		return true;
	},

	columnExpand : function(){
		var column = this.columnEl;

		column.setStyle('width', this.oldWidth);
		this.isCollapsed = false;
		column.addClass('expanded');
		column.removeClass('collapsed');

		this.handleEl.removeEvents('click');
		this.handleEl.addEvent('dblclick', function(){
			this.columnCollapse();
		}.bind(this));
		this.resize.attach();
		this.handleEl.setStyle('cursor', Browser.Engine.webkit ? 'col-resize' : 'e-resize').addClass('attached');

		MUI.rWidth();
		this.fireEvent('onExpand');

		return true;
	},

	columnToggle: function(){
		if (!this.isCollapsed) this.columnCollapse();
		else this.columnExpand();
	},

	addResizeRight: function(element, min, max){
		if (!$(element)) return;
		element = $(element);

		var instance = MUI.get(element.id);

		var handle = element.getNext('.columnHandle');
		handle.setStyle('cursor', Browser.Engine.webkit ? 'col-resize' : 'e-resize');
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
				if (Browser.Engine.gecko){
					$$('.panel').each(function(panel){
						if (panel.getElements('.mochaIframe').length == 0){
							panel.hide(); // Fix for a rendering bug in FF
						}
					});
				}
				MUI.rWidth(element.getParent());
				if (Browser.Engine.gecko){
					$$('.panel').show(); // Fix for a rendering bug in FF
				}
				if (Browser.Engine.trident4){
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
	},

	addResizeLeft: function(element, min, max){
		if (!$(element)) return;
		element = $(element);

		var instance = MUI.get(element.id);

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
	},

	close: function(){
		var self = this;
		self.isClosing = true;

		// Destroy all the panels in the column.
		var panels = $(self.columnEl).getElements('.panel');
		panels.each(function(panel){
			panel.close();
		}.bind(this));

		if (Browser.Engine.trident){
			self.columnEl.dispose();
			if (self.handleEl != null) self.handleEl.dispose();
		} else {
			self.columnEl.destroy();
			if (self.handleEl != null) self.handleEl.destroy();
		}

		if (MUI.Desktop) MUI.Desktop.resizePanels();

		var sortables = self.options.container.retrieve('sortables');
		if (sortables) sortables.removeLists(this.columnEl);

		MUI.erase(self.options.id);
		return true;
	}

});
