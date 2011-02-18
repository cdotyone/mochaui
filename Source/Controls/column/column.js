/*
 ---

 name: Column

 script: column.js

 description: MUI.Column - Column control for horizontal layouts.

 copyright: (c) 2011 Contributors in (/AUTHORS.txt).

 license: MIT-style license in (/MIT-LICENSE.txt).

 requires:
 - MochaUI/MUI
 - MUI.Desktop
 - MUI.Panel

 provides: [MUI.Column]

 ...
 */

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

		panels:			[]

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
		this.id = this.options.id = this.options.id || 'column' + (++MUI.idCount);
		MUI.set(this.id, this);

		if (this.options.drawOnInit) this.draw();
	},

	draw: function(){
		var options = this.options;

		this.fireEvent('drawBegin', [this]);

		if (options.container == null) options.container = MUI.desktop.el.content;
		else $(options.container).setStyle('overflow', 'hidden');
		if (typeOf(options.container) == 'string') options.container = $(options.container);

		// Check if column already exists
		if (this.el.column) return this;
		else MUI.set(options.id, this);

		var parentInstance = MUI.get(options.container);
		if(parentInstance && (parentInstance.isTypeOf('MUI.Panel') || parentInstance.isTypeOf('MUI.Window'))) {
			// If loading columns into a panel, hide the regular content container.
			if (parentInstance.el.element.getElement('.pad') != null) parentInstance.el.element.getElement('.pad').hide();

			// If loading columns into a window, hide the regular content container.
			if (parentInstance.el.element.getElement('.mochaContent') != null)  parentInstance.el.element.getElement('.mochaContent').hide();
		}

		// make or use existing element
		if (options.element) this.el.column = options.element;
		else if ($(options.id)) this.el.column = $(options.id);
		else this.el.column = new Element('div', {'id': options.id}).inject($(options.container));
		this.el.element = this.el.column;

		// parent container's height
		var parent = this.el.column.getParent();
		var columnHeight = parent.getStyle('height').toInt();

		// format column element correctly
		this.el.column.addClass('column expanded')
				.setStyle('width', options.placement == 'main' ? null : options.width)
				.store('instance', this)
				.setStyle('height', columnHeight);

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

		if (options.panels){
			for(var i=0;i<options.panels.length;i++) {
				var panel=options.panels[i];

				if (!panel.id) panel.id = options.id + 'Panel' + i;
				panel.container = this.el.column;
				panel.column = options.id;
				panel.element = new Element('div', {'id':panel.id+'_wrapper'}).inject(this.el.column);
				panel.control = 'MUI.Panel';
				MUI.create(panel);
			}
		}

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

		if (MUI.desktop) MUI.desktop.resizePanels();

		var sortables = self.options.container.retrieve('sortables');
		if (sortables) sortables.removeLists(this.el.column);

		Array.each(this.el, function(el){
			el.destroy();
		});
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

MUI.append({

	// Panel Height
	panelHeight: function(column, changing, action){
		if (column != null){
			MUI.panelHeight2($(column), changing, action);
		} else {
			$$('.column').each(function(column){
				MUI.panelHeight2(column);
			}.bind(this));
		}
	},

	panelHeight2: function(column, changing, action){
		var parent = column.getParent();
		var columnHeight = parent.getStyle('height').toInt();
		if (Browser.ie6 && parent == MUI.Desktop.pageWrapper){
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
			var instance = MUI.get(panel.id);
			if (panel.getParent().hasClass('expanded') && panel.getParent().getNext('.expanded')){
				instance.partner = panel.getParent().getNext('.expanded').getElement('.panel');
				instance.resize.attach();
				instance.el.handle.setStyles({
					'display': 'block',
					'cursor': Browser.webkit ? 'row-resize' : 'n-resize'
				}).removeClass('detached');
			} else {
				if(instance.resize) instance.resize.detach();
				instance.el.handle.setStyles({
					'display': 'none',
					'cursor': null
				}).addClass('detached');
			}
			if (panel.getParent().getNext('.panelWrapper') == null){
				instance.el.handle.hide();
			}
		}.bind(this));

		// Add panels to panelsToResize
		// Get the total height of all the resizable panels
		// Get the total height of all the column's children
		column.getChildren().each(function(panelWrapper){

			panelWrapper.getChildren().each(function(el){

				if (el.hasClass('panel')){
					var instance = MUI.get(el.id);

					// Are any next siblings Expanded?
					anyNextSiblingsExpanded = function(el){
						var test;
						el.getParent().getAllNext('.panelWrapper').each(function(sibling){
							var siblingInstance = MUI.get(sibling.getElement('.panel').id);
							if (!siblingInstance.isCollapsed){
								test = true;
							}
						}.bind(this));
						return test;
					}.bind(this);

					// If a next sibling is expanding, are any of the nexts siblings of the expanding sibling Expanded?
					var anyExpandingNextSiblingsExpanded = function(){
						var test;
						changing.getParent().getAllNext('.panelWrapper').each(function(sibling){
							var siblingInstance = MUI.get(sibling.getElement('.panel').id);
							if (!siblingInstance.isCollapsed){
								test = true;
							}
						}.bind(this));
						return test;
					}.bind(this);

					// Is the panel that is collapsing, expanding, or new located after this panel?
					var anyNextContainsChanging = function(el){
						var allNext = [];
						el.getParent().getAllNext('.panelWrapper').each(function(panelWrapper){
							allNext.push(panelWrapper.getElement('.panel'));
						}.bind(this));
						return allNext.contains(changing);
					}.bind(this);

					var nextExpandedChanging = function(el){
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
				} else {
					this.height += el.offsetHeight.toInt();
				}
			}.bind(this));

			panelsToResize.each(function(panel){
				var MUIPanel = MUI.get(panel.id);
				if (action != 'new') MUIPanel.fireEvent('resize', [MUIPanel]);
			});

		}.bind(this));

		// Get the remaining height
		var remainingHeight = column.offsetHeight.toInt() - this.height;

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

		remainingHeight = column.offsetHeight.toInt() - this.height;

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
			if (Browser.ie6 && parent == MUI.Desktop.pageWrapper){
				handleHeight -= 1;
			}
			handle.setStyle('height', handleHeight);
		});

		panelsExpanded.each(function(panel){
			MUI.resizeChildren(panel);
		}.bind(this));

	},

	resizeChildren: function(panel){ // May rename this resizeIframeEl()
		var instance = MUI.get(panel.id);
		var contentWrapper = instance.el.contentWrapper;

		if (instance.el.iframe){
			if (!Browser.ie){
				instance.el.iframe.setStyles({
					'height': contentWrapper.getStyle('height'),
					'width': contentWrapper.offsetWidth - contentWrapper.getStyle('border-left').toInt() - contentWrapper.getStyle('border-right').toInt()
				});
			} else {
				// The following hack is to get IE8 RC1 IE8 Standards Mode to properly resize an iframe
				// when only the vertical dimension is changed.
				instance.el.iframe.setStyles({
					'height': contentWrapper.getStyle('height'),
					'width': contentWrapper.offsetWidth - contentWrapper.getStyle('border-left').toInt() - contentWrapper.getStyle('border-right').toInt() - 1
				});
				instance.el.iframe.setStyles({
					'width': contentWrapper.offsetWidth - contentWrapper.getStyle('border-left').toInt() - contentWrapper.getStyle('border-right').toInt()
				});
			}
		}

	},

	rWidth: function(container){ // Remaining Width
		if (container == null) container = MUI.Desktop.desktop;
		if (container == null) return;
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

			// fire all panel resize events and the column resize event
			var instance = MUI.get(column.id);
			[instance].combine(instance.getPanels()).each(function(panel){
				panel.fireEvent('resize', [panel]);
			}, this);

			column.getElements('.panel').each(function(panel){
				panel.setStyle('width', newWidth - panel.getStyle('border-left').toInt() - panel.getStyle('border-right').toInt());
				MUI.resizeChildren(panel);
			}.bind(this));

		});
	}

});