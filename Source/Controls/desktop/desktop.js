/*
 ---

 name: Desktop

 script: desktop.js

 description: MUI - Creates main desktop control that loads rest of desktop.

 copyright: (c) 2010 Contributors in (/AUTHORS.txt).

 license: MIT-style license in (/MIT-LICENSE.txt).

 requires:
 - Core/Element
 - Core/Class
 - Core/Options
 - Core/Events
 - MUI
 - MUI.Core

 provides: [MUI.Dock]
 ...
 */

MUI.files['{controls}desktop/desktop.js'] = 'loaded';

MUI.Desktop = new NamedClass('MUI.Desktop', {

	Implements: [Events, Options],

	options: {
		id:				'',				// id of the primary element, and id os control that is registered with mocha
		container:		null,			// the parent control in the document to add the control to
		drawOnInit:		true,			// true to add tree to container when control is initialized
		cssClass:		'desktop',		// additional css tag
		orientation:	'left',			// toolbars are listed from left to right or right to left

		partner:		false,			// default partner panel to pass docked controls
		header:			true,			// has a header section
		taskbar:		true,			// has a taskbar section
		footer:			true,			// has a footer section

		content:		[]				// content that make up desktop, content positions can be 'header','page','footer'

		//onDrawBegin:	null,
		//onDrawEnd:	null,
		//onResize:		null,
	},

	initialize: function(options){
		this.setOptions(options);
		this.el = {};

		// If desktop has no ID, give it one.
		this.id = this.options.id = this.options.id || 'desktop' + (++MUI.idCount);
		MUI.set(this.id, this);

		if(this.options.drawOnInit) this.draw();
	},

	draw: function(container){
		this.fireEvent('drawBegin', [this]);
		var o = this.options;
		if (!container) container = o.container;

		// determine element for this control
		var isNew = false;
		var div = o.element ? o.element : $(o.id);
		if (!div){
			div = new Element('div', {'id': o.id});
			isNew = true;
		}
		this.el.element = div.empty().addClass(o.cssClass).store('instance', this);
		MUI.desktop = this;

		for (var idx = 0; idx < this.options.content.length; idx++){
			var section = this.options.content[idx];
			if (!section.name) section.name = 'section' + idx;
			if (!section.id) section.id = this.id + section.name.replace(/(\w)(\w*)/g, function (_, i, r){
				return i.toUpperCase() + (r != null ? r : "");
			});

			if (section.name == 'content'){
				// add content element
				this.el.content = new Element('div', {'id':o.id + 'Content','class':o.cssClass + 'Content'}).inject(this.el.element);

				// content section may have columns, process if it does
				if (section.columns){
					for (var i = 0; i < section.columns.length; i++){
						var column = section.columns[i];

						if (!column.id) column.id = o.id + 'Column' + i;
						column.container = this.el.content;
						column.element = new Element('div', {'id':column.id}).inject(this.el.content);
						column.control = 'MUI.Column';

						// last column we want it to call the this.setDesktopSize
						if (i + 1 == section.columns.length) column.onNew = this.setDesktopSize.bind(this);
						MUI.create(column);
					}
				}
			} else {
				// create section element
				var e = section.element = this.el[section.name] = new Element('div', {'id':section.id}).inject(this.el.element);
				if (section.cssClass) e.addClass(section.cssClass);

				// for controls they need to know the desktop element
				section.container = this.el.element;
				MUI.Content.update(section);
			}
		}

		// add to container
		var addToContainer = function(){
			if (typeOf(container) == 'string') container = $(container);
			if (div.getParent() == null) div.inject(container);

			this.setDesktopSize();					// resize the desktop
			window.addEvent('resize', function(){	// capture browser resize events
				this._onBrowserResize();
			}.bind(this));

			this.fireEvent('drawEnd', [this]);
		}.bind(this);
		if (!isNew || typeOf(container) == 'element') addToContainer();
		else window.addEvent('domready', addToContainer);

		return this;
	},

	setDesktopSize: function(){
		var dimensions = window.getCoordinates();

		// Setting the desktop height may only be needed by IE7
		if (this.el.element) this.el.element.setStyle('height', dimensions.height);

		// Set content height so the taskbar doesn't cover the content scrollbars.
		if (this.el.content){
			var height = dimensions.height;
			height -= this.el.content.getStyle('border-top').toInt();
			height -= this.el.content.getStyle('border-bottom').toInt();

			Object.each(this.el, function(val, key){
				if (['content', 'element'].indexOf(key) < 0){
					height -= val.offsetHeight;
					height += val.getStyle('padding-bottom').toInt();
					height += val.getStyle('padding-top').toInt();
				}
			});
			height -= this.el.taskbar ? this.el.taskbar.getHeight() : 0;
			if (height < 0) height = 0;
			this.el.content.setStyle('height', height);
		}

		this.resizePanels().fireEvent('resize', [this]);
		return this;
	},

	_onBrowserResize: function(){
		this.setDesktopSize();

		// Resize maximized windows to fit new browser window size
		setTimeout(function(){
			MUI.each(function(instance){
				var options = instance.options;
				if (instance.className != 'MUI.Window') return;
				if (instance.isMaximized){

					// Hide iframe while resize for better performance
					if (instance.el.iframe) instance.el.iframe.setStyle('visibility', 'hidden');

					var resizeDimensions;
					if (options.container) resizeDimensions = $(options.container).getCoordinates();
					else resizeDimensions = document.getCoordinates();
					var shadowBlur = options.shadowBlur;
					var shadowOffset = options.shadowOffset;
					var newHeight = resizeDimensions.height - options.headerHeight - options.footerHeight;
					newHeight -= instance.el.contentBorder.getStyle('border-top').toInt();
					newHeight -= instance.el.contentBorder.getStyle('border-bottom').toInt();
					newHeight -= instance._getAllSectionsHeight();

					instance.resize({
						width: resizeDimensions.width,
						height: newHeight,
						top: resizeDimensions.top + shadowOffset.y - shadowBlur,
						left: resizeDimensions.left + shadowOffset.x - shadowBlur
					});

					instance.redraw();
					if (instance.el.iframe){
						instance.el.iframe.setStyles({
							'height': instance.el.contentWrapper.getStyle('height')
						});
						instance.el.iframe.setStyle('visibility', 'visible');
					}
				}
			}.bind(this));
		}.bind(this), 100);
	},

	resizePanels: function(){
		MUI.panelHeight(null, null, 'all');
		MUI.rWidth(this.el.content);
		return this;
	}

});


MUI.Window = (MUI.Window || new NamedClass('MUI.Window', {}));
MUI.Window.implement({

	maximize: function(){
		if (this.isMinimized) this._restoreMinimized();

		var options = this.options;
		var windowDrag = this.windowDrag;
		var windowEl = this.el.windowEl;

		// If window no longer exists or is maximized, stop
		if (this.isMaximized) return this;
		if (this.isCollapsed) this.collapseToggle();
		this.isMaximized = true;

		// If window is restricted to a container, it should not be draggable when maximized.
		if (this.options.restrict){
			windowDrag.detach();
			if (options.resizable) this._detachResizable();
			this.el.titleBar.setStyle('cursor', 'default');
		}

		// If the window has a container that is not the desktop
		// temporarily move the window to the desktop while it is minimized.
		if (options.container != MUI.Desktop.desktop){
			MUI.Desktop.desktop.grab(windowEl);
			if (options.restrict) windowDrag.container = this.el.desktop;
		}

		// Save original position
		this.oldTop = windowEl.getStyle('top');
		this.oldLeft = windowEl.getStyle('left');

		// save original corner radius
		if (!options.radiusOnMaximize){
			this.oldRadius = options.cornerRadius;
			this.oldShadowBlur = options.shadowBlur;
			this.oldShadowOffset = options.shadowOffset;

			options.cornerRadius = 0;
			options.shadowBlur = 0;
			options.shadowOffset = {'x': 0, 'y': 0};
		}

		// Save original dimensions
		var contentWrapper = this.el.contentWrapper;
		contentWrapper.oldWidth = contentWrapper.getStyle('width');
		contentWrapper.oldHeight = contentWrapper.getStyle('height');

		// Hide iframe
		// Iframe should be hidden when minimizing, maximizing, and moving for performance and Flash issues
		if (this.el.iframe){
			if (!Browser.ie) this.el.iframe.setStyle('visibility', 'hidden');
			else this.el.iframe.hide();
		}

		var resizeDimensions;
		if (options.container) resizeDimensions = $(options.container).getCoordinates();
		else resizeDimensions = document.getCoordinates();
		var shadowBlur = options.shadowBlur;
		var shadowOffset = options.shadowOffset;
		var newHeight = resizeDimensions.height - options.headerHeight - options.footerHeight;
		newHeight -= this.el.contentBorder.getStyle('border-top').toInt();
		newHeight -= this.el.contentBorder.getStyle('border-bottom').toInt();
		newHeight -= this._getAllSectionsHeight();

		this.resize({
			width: resizeDimensions.width,
			height: newHeight,
			top: resizeDimensions.top + shadowOffset.y - shadowBlur,
			left: resizeDimensions.left + shadowOffset.x - shadowBlur
		});
		this.fireEvent('maximize', [this]);

		if (this.el.maximizeButton) this.el.maximizeButton.setProperty('title', 'Restore');
		this.focus();

		return this;
	},

	_restoreMaximized: function(){
		var options = this.options;

		// Window exists and is maximized ?
		if (!this.isMaximized) return this;

		this.isMaximized = false;

		if (!options.radiusOnMaximize){
			options.cornerRadius = this.oldRadius;
			options.shadowBlur = this.oldShadowBlur;
			options.shadowOffset = this.oldShadowOffset;
		}

		if (options.restrict){
			this.windowDrag.attach();
			if (options.resizable) this._reattachResizable();
			this.el.titleBar.setStyle('cursor', 'move');
		}

		// Hide iframe
		// Iframe should be hidden when minimizing, maximizing, and moving for performance and Flash issues
		if (this.el.iframe){
			if (!Browser.ie) this.el.iframe.setStyle('visibility', 'hidden');
			else this.el.iframe.hide();
		}

		var contentWrapper = this.el.contentWrapper;
		this.resize({
			width: contentWrapper.oldWidth,
			height: contentWrapper.oldHeight,
			top: this.oldTop,
			left: this.oldLeft
		});
		this.fireEvent('restore', [this]);

		if (this.el.maximizeButton) this.el.maximizeButton.setProperty('title', 'Maximize');
		return this;
	}

});

MUI.append({

	// Panel Height
	panelHeight: function(column, changing, action){
		if (column != null){
			MUI.panelHeight2($(column), changing, action);
		} else {
			$$('.column').each(function(column){
				MUI.panelHeight2(column, null, action);
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

		// makes sure at least one panel is expanded for the
		if (action == 'all' && panelsExpanded.length == 0 && panels.length > 0){
			MUI.get(panels[0]).expand();

			// if this is not the main column than we can collapse the column to get desired effect
			var columnInstance = MUI.get(column);
			if (columnInstance.options.position != 'main'){
				columnInstance.collapse();
			}
		}

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
				instance.resize.detach();
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
					var anyNextSiblingsExpanded = function(el){
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
			// The following hack is to get IE8 RC1 IE8 Standards Mode to properly resize an iframe
			// when only the vertical dimension is changed.
			if (!Browser.ie){
				instance.el.iframe.setStyles({
					'height': contentWrapper.getStyle('height'),
					'width': contentWrapper.offsetWidth - contentWrapper.getStyle('border-left').toInt() - contentWrapper.getStyle('border-right').toInt()
				});
			} else {
				instance.el.iframe.setStyles({
					'width': contentWrapper.offsetWidth - contentWrapper.getStyle('border-left').toInt() - contentWrapper.getStyle('border-right').toInt()
				});
			}
		}
	},

	rWidth: function(container){ // Remaining Width
		if (container == null){
			container = MUI.desktop.el.element;
		}
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
				MUI.resizeChildren(panel);
			}.bind(this));
		});
	}

});

