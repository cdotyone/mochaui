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
		cssClass:		false,			// additional css tag
		orientation:	'left',			// toolbars are listed from left to right or right to left

		partner:		false,			// default partner panel to pass docked controls
		header:			true,			// has a header section
		footer:			true,			// has a footer section

		sections:		[]				// sections that make up desktop, section names can be 'header','content','footer'
	},

	initialize: function(options)
	{
		var self = this;
		self.setOptions(options);
		var o = self.options;
		self.el = {};

		// make sure this controls has an ID
		var id = o.id;
		if (!id){
			id = 'desktop' + (++MUI.IDCount);
			o.id = id;
		}
		this.id = id;
		MUI.set(id, this);

		this.draw();
	},

	draw: function(containerEl)
	{
		var self = this;
		var o = self.options;

		var isNew = false;
		var div;

		div = $(o.id);
		if (!div){
			div = new Element('div', {'id': o.id});
			isNew = true;
		}
		div.addClass('desktop');
		div.empty();
		if (o.cssClass) div.addClass(o.cssClass);
		self.el.element = div.store('instance', this);

		if (o.header) this.el.header = new Element('div', {'id':o.id + 'Header','class':'desktopHeader'}).inject(this.el.element);
		this.el.page = new Element('div', {'id':o.id + 'Page','class':'desktopPage'}).inject(this.el.element);
		if (o.footer) this.el.footer = new Element('div', {'id':o.id + 'Footer','class':'desktopFooter'}).inject(this.el.element);

		if (!isNew || o._container){
			if (this.el.element.getParent() == null) this.el.element.inject(o._container);
			this.setDesktopSize();
		} else window.addEvent('domready', function()
		{
			if (!o._container) o._container = $(containerEl ? containerEl : o.container);
			if (!o._container) o._container = document.body;
			if (this.el.element.getParent() == null) this.el.element.inject(o._container);
			this.setDesktopSize();
		});

		return div;
	},

	_createSection:function(sectionName)
	{
		var lname = sectionName.toLowerCase();
		var dock = new MUI.Dock({'id':this.id + sectionName,container:this.el.element});
		this[lname] = dock;

		Object.each(this.options.sections, function(section, idx)
		{
			if (section.name == lname) return;
			if (!section.control) section.control = 'MUI.Dock';
			if (!section.id) section.id = this.id + 'Section' + idx;
			this.el[section.id] = new Element('div', {'id':section.id}).inject(this.el.element);
			section.container = dock.el.element;

			if (!section.partner) section.partner = this.options.partner;
			this.options.sections[idx] = section;
			var content = {};
			Object.each(section, function(val, key)
			{
				if (['loadmethod', 'method', 'url', 'content', 'onloaded'].indexOf(key) > -1)
					content[key] = val;
			});
			section.content = content;
			MUI.create(section.control, section);
		}, bind(this));
	},

	setDesktopSize: function(){
		var windowDimensions = window.getCoordinates();

		// Setting the desktop height may only be needed by IE7
		if (this.el.element) this.el.element.setStyle('height', windowDimensions.height);

		// Set pageWrapper height so the taskbar doesn't cover the pageWrapper scrollbars.
		if (this.el.page){
			var taskbarOffset = this.taskbar ? this.taskbar.getHeight() : 0;
			var pageWrapperHeight = windowDimensions.height;
			pageWrapperHeight -= this.el.page.getStyle('border-top').toInt();
			pageWrapperHeight -= this.el.page.getStyle('border-bottom').toInt();
			if (this.el.header) pageWrapperHeight -= this.el.header.offsetHeight;
			if (this.el.footer) pageWrapperHeight -= this.el.footer.offsetHeight;
			pageWrapperHeight -= taskbarOffset;
			if (pageWrapperHeight < 0) pageWrapperHeight = 0;
			this.el.page.setStyle('height', pageWrapperHeight);
		}

		this.resizePanels();
	},

	resizePanels: function(){
		MUI.panelHeight(null, null, 'all');
		MUI.rWidth(this.el.page);
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
		if (container == null){
			container = MUI.Desktop.desktop;
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
