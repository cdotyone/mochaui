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

MUI.files['{source}Core/Column.js'] = 'loaded';

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
		isCollapsed:	false,

		onDrawBegin:	$empty,
		onDrawEnd:		$empty,
		onResize:		$empty,
		onCollapse:		$empty,
		onExpand:		$empty
	},

	initialize: function(options){
		this.setOptions(options);

		$extend(this, {
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

		if ($type(options.container) == 'string') options.container = $(options.container);

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
				var sortables = new Sortables(this.el.column,{
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

				this._addResizeRight(this.el.column, options.resizeLimit[0], options.resizeLimit[1]);
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
				this._addResizeLeft(this.el.column, options.resizeLimit[0], options.resizeLimit[1]);
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
		this.el.handle.setStyle('cursor', Browser.Engine.webkit ? 'col-resize' : 'e-resize').addClass('attached');

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

		if (Browser.Engine.trident){
			self.el.column.dispose();
			if (self.el.handle != null) self.el.handle.dispose();
		} else {
			self.el.column.destroy();
			if (self.el.handle != null) self.el.handle.destroy();
		}

		if (MUI.Desktop) MUI.Desktop.resizePanels();

		var sortables = self.options.container.retrieve('sortables');
		if (sortables) sortables.removeLists(this.el.column);

		$each(this.el,function(el){el.destroy();});
		this.el = {};

		MUI.erase(self.options.id);
		return this;
	},

	_addResizeRight: function(element, min, max){
		var instance = this;
		if (!$(element)) return;
		element = $(element);

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

		this.resize = element.makeResizable({
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
				var partner = element.getNext('.column');
				var partnerInstance = MUI.get(partner);

				MUI.rWidth(element.getParent());
				element.getElements('iframe').setStyle('visibility', 'visible');
				partner.getElements('iframe').setStyle('visibility', 'visible');

				[].include(instance)
				  .combine(instance.getPanels())
				  .include(partnerInstance)
				  .combine(partnerInstance.getPanels())
				  .each(function(panel){
						panel.fireEvent('resize',[panel])
				  });

			}.bind(this)
		});
	},

	_addResizeLeft: function(element, min, max){
		var instance = this;
		if (!$(element)) return;
		element = $(element);

		var handle = element.getPrevious('.columnHandle');
		handle.setStyle('cursor', Browser.Engine.webkit ? 'col-resize' : 'e-resize');
		var partner = element.getPrevious('.column');
		var partnerInstance = MUI.get(partner);
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
		this.resize = element.makeResizable({
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

				[].include(partnerInstance)
				  .combine(partnerInstance.getPanels())
				  .include(instance)
				  .combine(instance.getPanels())
				  .each(function(panel){
						panel.fireEvent('resize',[panel])
				  });
			}.bind(this)
		});
	}

});
