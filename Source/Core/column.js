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

MUI.files['source|Column.js'] = 'loaded';


MUI.Column = new NamedClass('MUI.Column', {

	Implements: [Events, Options],

	options: {
		id:			null,
		container:	null,
		createOnInit: true,

		placement:	null,
		width:		null,
		resizeLimit:[],
		sortable:	true,
		isCollapsed:false,

		onResize:	$empty,
		onCollapse:	$empty,
		onExpand:	$empty
	},

	initialize: function(options){
		this.setOptions(options);

		$extend(this, {
			isCollapsed: false,
			oldWidth: 0
		});

		// If column has no ID, give it one.
		if (this.options.id == null){
			this.options.id = 'column' + (++MUI.IDCount);
		}

		if (this.options.createOnInit) this.draw();
	},

	draw: function() {
		var options = this.options;

		if (options.container == null) options.container = MUI.Desktop.pageWrapper;
		else $(options.container).setStyle('overflow', 'hidden');

		if ($type(options.container) == 'string') options.container = $(options.container);

		// Check if column already exists
		if (this.element) return;
		else MUI.set(options.id, this);

		// If loading columns into a panel, hide the regular content container.
		if ($(options.container).getElement('.pad') != null){
			$(options.container).getElement('.pad').hide();
		}

		// If loading columns into a window, hide the regular content container.
		if ($(options.container).getElement('.mochaContent') != null){
			$(options.container).getElement('.mochaContent').hide();
		}

		this.element = new Element('div', {
			'id': options.id,
			'class': 'column expanded',
			'styles': {
				'width': options.placement == 'main' ? null : options.width
			}
		}).inject($(options.container));

		this.element.store('instance', this);

		var parent = this.element.getParent();
		var columnHeight = parent.getStyle('height').toInt();
		this.element.setStyle('height', columnHeight);

		if (options.sortable){
			if (!options.container.retrieve('sortables')){
				var sortables = new Sortables(this.element, {
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
								instance.options.column = column;
								if (instance){
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
				options.container.retrieve('sortables').addLists(this.element);
			}
		}

		if (options.placement == 'main') this.element.addClass('rWidth');

		switch (options.placement){
			case 'left':
				this.handleEl = new Element('div', {
					'id': options.id + '_handle',
					'class': 'columnHandle'
				}).inject(this.element, 'after');

				this.handleIconEl = new Element('div', {
					'id': options.id + '_handle_icon',
					'class': 'handleIcon'
				}).inject(this.handleEl);

				this._addResizeRight(this.element, options.resizeLimit[0], options.resizeLimit[1]);
				break;
			case 'right':
				this.handleEl = new Element('div', {
					'id': options.id + '_handle',
					'class': 'columnHandle'
				}).inject(this.element, 'before');

				this.handleIconEl = new Element('div', {
					'id': options.id + '_handle_icon',
					'class': 'handleIcon'
				}).inject(this.handleEl);
				this._addResizeLeft(this.element, options.resizeLimit[0], options.resizeLimit[1]);
				break;
		}

		if (options.isCollapsed && this.options.placement != 'main') this.toggle();

		if (this.handleEl != null){
			this.handleEl.addEvent('dblclick', function(){
				this.toggle();
			}.bind(this));
		}

		MUI.rWidth();

	},

	getPanels: function(){
		var panels=[];
		$(this.element).getElements('.panel').each(function(panelEl) {
			var panel=MUI.get(panelEl.id);
			if(panel) panels.push(panel);
		});
		return panels;
	},

	collapse: function(){
		var column = this.element;

		this.oldWidth = column.getStyle('width').toInt();

		this.resize.detach();
		this.handleEl.removeEvents('dblclick');
		this.handleEl.addEvent('click', function(){
			this.expand();
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

	expand : function(){
		var column = this.element;

		column.setStyle('width', this.oldWidth);
		this.isCollapsed = false;
		column.addClass('expanded');
		column.removeClass('collapsed');

		this.handleEl.removeEvents('click');
		this.handleEl.addEvent('dblclick', function(){
			this.collapse();
		}.bind(this));
		this.resize.attach();
		this.handleEl.setStyle('cursor', Browser.Engine.webkit ? 'col-resize' : 'e-resize').addClass('attached');

		MUI.rWidth();
		this.fireEvent('onExpand');

		return true;
	},

	toggle: function(){
		if (!this.isCollapsed) this.collapse();
		else this.expand();
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
			self.element.dispose();
			if (self.handleEl != null) self.handleEl.dispose();
		} else {
			self.element.destroy();
			if (self.handleEl != null) self.handleEl.destroy();
		}

		if (MUI.Desktop) MUI.Desktop.resizePanels();

		var sortables = self.options.container.retrieve('sortables');
		if (sortables) sortables.removeLists(this.element);

		MUI.erase(self.options.id);
		return true;
	},

	_addResizeRight: function(element, min, max){
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
						panel.fireEvent('resize')
				  });

			}.bind(this)
		});
	},

	_addResizeLeft: function(element, min, max){
		if (!$(element)) return;
		element = $(element);

		var instance = MUI.get(element.id);

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

				[].include(partnerInstance)
				  .combine(partnerInstance.getPanels())
				  .include(instance)
				  .combine(instance.getPanels())
				  .each(function(panel){
						panel.fireEvent('resize')
				  });
			}.bind(this)
		});
	}

});
