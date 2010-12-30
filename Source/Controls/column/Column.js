/*
 ---

 script: Column.js

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

MUI.files['{controls}column/column.js'] = 'loaded';

MUI.Column = new NamedClass('MUI.Column', {

	Implements: [Events, Options],

	options: {
		id:				null,
		container:		null,
		drawOnInit:		true,

		placement:		null,
		width:			null,
		resizeLimit:	[],
		sortable:		true,
		isCollapsed:	false

		//onDrawBegin:	null,
		//onDrawEnd:	null,
		//onResize:		null,
		//onCollapse:	null,
		//onExpand:		null
	},

	initialize: function(options){
		this.setOptions(options);

		Object.append(this, {
			isCollapsed: false,
			oldWidth: 0,
			el: {}
		});

		// If column has no ID, give it one.
		if (this.options.id == null) this.options.id = 'column' + (++MUI.IDCount);
		this.id = this.options.id;

		if (this.options.drawOnInit) this.draw();
	},

	draw: function(){
		var options = this.options;
		this.fireEvent('drawBegin', [this]);

		if (options.container == null) options.container = MUI.Desktop.pageWrapper;
		else $(options.container).setStyle('overflow', 'hidden');

		if (typeOf(options.container) == 'string') options.container = $(options.container);

		// Check if column already exists
		if (this.el.column) return this;
		else MUI.set(options.id, this);

		// If loading columns into a panel, hide the regular content container.
		if ($(options.container).getElement('.pad') != null) $(options.container).getElement('.pad').hide();

		// If loading columns into a window, hide the regular content container.
		if ($(options.container).getElement('.mochaContent') != null)  $(options.container).getElement('.mochaContent').hide();

		this.el.column = new Element('div', {
			'id': options.id,
			'class': 'column expanded',
			'styles': {
				'width': options.placement == 'main' ? null : options.width
			}
		}).inject($(options.container));

		this.el.column.store('instance', this);

		var parent = this.el.column.getParent();
		var columnHeight = parent.getStyle('height').toInt();
		this.el.column.setStyle('height', columnHeight);

		if (options.sortable){
			if (!options.container.retrieve('sortables')){
				var sortables = new Sortables(this.el.column, {
					opacity: 0.2,
					handle: '.panel-header',
					constrain: false,
					clone: true,
					revert: { duration: 500, transition: 'quad:in'},
					onStart: function(element, clone){
						var pos = element.getPosition(document.body);
						clone.inject(document.body).setStyles({
							'z-index': 1999,
							'opacity': 0.65,
							'margin-left': pos.x,
							'margin-top': pos.y - clone.getStyle('top').toInt()
						});
					},
					onSort: function(){
						$$('.column').each(function(column){
							column.getChildren('.panelWrapper').removeClass('bottomPanel');
							if (column.getChildren('.panelWrapper').getLast()){
								column.getChildren('.panelWrapper').getLast().addClass('bottomPanel');
							}
							column.getChildren('.panelWrapper').each(function(panelWrapper){
								var panel = panelWrapper.getElement('.panel');
								var column = panelWrapper.getParent().id;
								var instance = MUI.get(panel.id);
								if (instance){
									instance.options.column = column;
									var nextPanel = panel.getParent().getNext('.expanded');
									if (nextPanel){
										nextPanel = nextPanel.getElement('.panel');
									}
									instance.partner = nextPanel;
								}
							});
							MUI.panelHeight();
						}.bind(this));
					}.bind(this)
				});
				options.container.store('sortables', sortables);
			} else {
				options.container.retrieve('sortables').addLists(this.el.column);
			}
		}

		if (options.placement == 'main') this.el.column.addClass('rWidth');

		switch (options.placement){
			case 'left':
				this.el.handle = new Element('div', {
					'id': options.id + '_handle',
					'class': 'columnHandle'
				}).inject(this.el.column, 'after');

				this.el.handleIcon = new Element('div', {
					'id': options.id + '_handle_icon',
					'class': 'handleIcon'
				}).inject(this.el.handle);

				this._addResize(this.el.column, options.resizeLimit[0], options.resizeLimit[1], 'right');
				break;
			case 'right':
				this.el.handle = new Element('div', {
					'id': options.id + '_handle',
					'class': 'columnHandle'
				}).inject(this.el.column, 'before');

				this.el.handleIcon = new Element('div', {
					'id': options.id + '_handle_icon',
					'class': 'handleIcon'
				}).inject(this.el.handle);
				this._addResize(this.el.column, options.resizeLimit[0], options.resizeLimit[1], 'left');
				break;
		}

		if (options.isCollapsed && this.options.placement != 'main') this.toggle();

		if (this.el.handle != null){
			this.el.handle.addEvent('dblclick', function(){
				this.toggle();
			}.bind(this));
		}

		MUI.rWidth();
		this.fireEvent('drawEnd', [this]);
		return this;
	},

	getPanels: function(){
		var panels = [];
		$(this.el.column).getElements('.panel').each(function(panelEl){
			var panel = MUI.get(panelEl.id);
			if (panel) panels.push(panel);
		});
		return panels;
	},

	collapse: function(){
		var column = this.el.column;

		this.oldWidth = column.getStyle('width').toInt();

		this.resize.detach();
		this.el.handle.removeEvents('dblclick');
		this.el.handle.addEvent('click', function(){
			this.expand();
		}.bind(this));
		this.el.handle.setStyle('cursor', 'pointer').addClass('detached');

		column.setStyle('width', 0);
		this.isCollapsed = true;
		column.addClass('collapsed');
		column.removeClass('expanded');
		MUI.rWidth();
		this.fireEvent('collapse', [this]);

		return this;
	},

	expand : function(){
		var column = this.el.column;

		column.setStyle('width', this.oldWidth);
		this.isCollapsed = false;
		column.addClass('expanded');
		column.removeClass('collapsed');

		this.el.handle.removeEvents('click');
		this.el.handle.addEvent('dblclick', function(){
			this.collapse();
		}.bind(this));
		this.resize.attach();
		this.el.handle.setStyle('cursor', Browser.webkit ? 'col-resize' : 'e-resize').addClass('attached');

		MUI.rWidth();
		this.fireEvent('expand', [this]);

		return this;
	},

	toggle: function(){
		if (!this.isCollapsed) this.collapse();
		else this.expand();
		return this;
	},

	close: function(){
		var self = this;
		self.isClosing = true;

		// Destroy all the panels in the column.
		var panels = self.getPanels();
		panels.each(function(panel){
			panel.close();
		}.bind(this));

		if (Browser.ie){
			self.el.column.dispose();
			if (self.el.handle != null) self.el.handle.dispose();
		} else {
			self.el.column.destroy();
			if (self.el.handle != null) self.el.handle.destroy();
		}

		if (MUI.Desktop) MUI.Desktop.resizePanels();

		var sortables = self.options.container.retrieve('sortables');
		if (sortables) sortables.removeLists(this.el.column);

		Array.each(this.el, function(el){el.destroy();});
		this.el = {};

		MUI.erase(self.options.id);
		return this;
	},
	
	_addResize: function(element, min, max, where){
		var instance = this;
		if (!$(element)) return;
		element = $(element);

		var handle = (where == 'left') ? element.getPrevious('.columnHandle') : element.getNext('.columnHandle');
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

		this.resize = element.makeResizable({
			handle: handle,
			modifiers: {
				x: 'width',
				y: false
			},
			invert: (where == 'left'),
			limit: {
				x: [min, max]
			},
			onStart: function(){
				element.getElements('iframe').setStyle('visibility', 'hidden');
				if (where == 'left'){
					element.getPrevious('.column').getElements('iframe').setStyle('visibility', 'hidden');
				} else {
					element.getNext('.column').getElements('iframe').setStyle('visibility', 'hidden');
				}
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
				if (Browser.ie6){
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
				var partner = (where == 'left') ? element.getPrevious('.column') : element.getNext('.column'),
						partnerInstance = MUI.get(partner);


				MUI.rWidth(element.getParent());
				element.getElements('iframe').setStyle('visibility', 'visible');
				partner.getElements('iframe').setStyle('visibility', 'visible');

				[instance].combine(instance.getPanels())
						.include(partnerInstance)
						.combine(partnerInstance.getPanels())
						.each(function(panel){
					if (panel.el.panel && panel.el.panel.getElement('.mochaIframe') != null) MUI.resizeChildren(panel.el.panel);
					panel.fireEvent('resize', [panel]);
				});

			}.bind(this)
		});
	}

});
