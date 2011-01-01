/*
 ---

 script: desktop.js

 description: Create web application layouts. Enables window maximize.

 todo:
 - Make it so the taskbar requires no initial html markup.

 copyright: (c) 2010 Contributors in (/AUTHORS.txt).

 license: MIT-style license in (/MIT-LICENSE.txt).

 requires:
 - MochaUI/MUI
 - MUI.Column
 - MUI.Panel

 provides: [MUI.Desktop]

 ...
 */

MUI.files['{source}Core/desktop.js'] = 'loaded';

MUI.Desktop = {

	options: {
		// Naming options:
		// If you change the IDs of the MochaUI Desktop containers in your HTML, you need to change them here as well.
		desktop:			'desktop',
		desktopHeader:		'desktopHeader',
		desktopFooter:		'desktopFooter',
		desktopNavBar:		'desktopNavbar',
		pageWrapper:		'pageWrapper',
		page:				'page',
		desktopFooterWrapper:'desktopFooterWrapper',

		createTaskbar:			true,
		taskbarOptions:		{}
	},

	initialize: function(options){
		if (options) Object.append(MUI.Desktop.options, options);

		if (MUI.desktop) return;	// only one desktop allowed
		MUI.desktop = this;

		this.desktop = $(this.options.desktop);
		this.desktopHeader = $(this.options.desktopHeader);
		this.desktopNavBar = $(this.options.desktopNavBar);
		this.pageWrapper = $(this.options.pageWrapper);
		this.page = $(this.options.page);
		this.desktopFooter = $(this.options.desktopFooter);

		if (!this.options.taskbarOptions.container) this.options.taskbarOptions.container = this.desktop;
		if (this.options.createTaskbar) this.taskbar = new MUI.Taskbar(this.options.taskbarOptions);
		if (!this.taskbar) this.setDesktopSize();  // This is run on taskbar initialize so no need to do it twice.
		this._menuInitialize();

		// Resize desktop, page wrapper, modal overlay, and maximized windows when browser window is resized
		window.addEvent('resize', function(){
			this._onBrowserResize();
		}.bind(this));

	},

	setDesktopSize: function(){
		var windowDimensions = window.getCoordinates();

		// Setting the desktop height may only be needed by IE7
		if (this.desktop) this.desktop.setStyle('height', windowDimensions.height);

		// Set pageWrapper height so the taskbar doesn't cover the pageWrapper scrollbars.
		if (this.pageWrapper){
			var taskbarOffset = this.taskbar ? this.taskbar.getHeight() : 0;
			var pageWrapperHeight = windowDimensions.height;
			pageWrapperHeight -= this.pageWrapper.getStyle('border-top').toInt();
			pageWrapperHeight -= this.pageWrapper.getStyle('border-bottom').toInt();
			if (this.desktopHeader) pageWrapperHeight -= this.desktopHeader.offsetHeight;
			if (this.desktopFooter) pageWrapperHeight -= this.desktopFooter.offsetHeight;
			pageWrapperHeight -= taskbarOffset;
			if (pageWrapperHeight < 0) pageWrapperHeight = 0;
			this.pageWrapper.setStyle('height', pageWrapperHeight);
		}

		///*		if (MUI.Columns.instances.getKeys().length > 0){ // Conditional is a fix for a bug in IE6 in the no toolbars demo.
		MUI.Desktop.resizePanels();
		//}*/
	},

	resizePanels: function(){
		MUI.panelHeight(null, null, 'all');
		MUI.rWidth();
	},

	saveWorkspace: function(){
		this.cookie = new Hash.Cookie('mochaUIworkspaceCookie', {duration: 3600});
		this.cookie.empty();

		MUI.each(function(instance){
			if (instance.className != 'MUI.Window') return;
			instance._saveValues();
			this.cookie.set(instance.options.id, {
				'id': instance.options.id,
				'top': instance.options.y,
				'left': instance.options.x,
				'width': instance.el.contentWrapper.getStyle('width').toInt(),
				'height': instance.el.contentWrapper.getStyle('height').toInt()
			});
		}.bind(this));
		this.cookie.save();

		new MUI.Window({
			loadMethod: 'html',
			type: 'notification',
			addClass: 'notification',
			content: 'Workspace saved.',
			closeAfter: '1400',
			width: 200,
			height: 40,
			y: 53,
			padding: {top: 10, right: 12, bottom: 10, left: 12},
			shadowBlur: 5
		});
	},

	loadingCallChain: function(){
		if ($$('.mocha').length == 0 && this.myChain){
			this.myChain.callChain();
		}
	},

	loadWorkspace: function(){
		var cookie = new Hash.Cookie('mochaUIworkspaceCookie', {duration: 3600});
		var workspaceWindows = cookie.load();

		if (!cookie.getKeys().length){
			new MUI.Window({
				loadMethod: 'html',
				type: 'notification',
				addClass: 'notification',
				content: 'You have no saved workspace.',
				closeAfter: '1400',
				width: 220,
				height: 40,
				y: 25,
				padding: {top: 10, right: 12, bottom: 10, left: 12},
				shadowBlur: 5
			});
			return;
		}

		var doLoadWorkspace = (function(workspaceWindows){
			workspaceWindows.each(function(workspaceWindow){
				windowFunction = MUI[workspaceWindow.id + 'Window'];
				if (windowFunction) windowFunction();
				// currently disabled positioning of windows, that would need to be passed to the MUI.Window call
				/*if (windowFunction){
				 windowFunction({
				 width: workspaceWindow.width,
				 height: workspaceWindow.height
				 });
				 var windowEl = $(workspaceWindow.id);
				 windowEl.setStyles({
				 'top': workspaceWindow.top,
				 'left': workspaceWindow.left
				 });
				 var instance = windowEl.retrieve('instance');
				 instance.el.contentWrapper.setStyles({
				 'width': workspaceWindow.width,
				 'height': workspaceWindow.height
				 });
				 instance.redraw();
				 }*/
			}.bind(this));
			this.loadingWorkspace = false;
		}).bind(this);

		if ($$('.mocha').length != 0){
			this.loadingWorkspace = true;
			this.myChain = new Chain();
			this.myChain.chain(
					function(){
						$$('.mocha').each(function(el){
							el.close();
						});
						this.myChain.callChain();
					}.bind(this),
					doLoadWorkspace
					);
			this.myChain.callChain();
		} else doLoadWorkspace(workspaceWindows);
	},

	_menuInitialize: function(){
		// Fix for dropdown menus in IE6
		if (Browser.ie6 && this.desktopNavBar){
			this.desktopNavBar.getElements('li').each(function(element){
				element.addEvent('mouseenter', function(){
					this.addClass('ieHover');
				});
				element.addEvent('mouseleave', function(){
					this.removeClass('ieHover');
				});
			});
		}
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
	}

};

MUI.Windows = Object.append((MUI.Windows || {}), {

	arrangeCascade: function(){

		var viewportTopOffset = 30;    // Use a negative number if neccessary to place first window where you want it
		var viewportLeftOffset = 20;
		var windowTopOffset = 50;    // Initial vertical spacing of each window
		var windowLeftOffset = 40;

		// See how much space we have to work with
		var coordinates = document.getCoordinates();

		var openWindows = 0;
		MUI.each(function(instance){
			if (instance.className != 'MUI.Window') return;
			if (!instance.isMinimized && instance.options.draggable) openWindows ++;
		});

		var topOffset = ((windowTopOffset * (openWindows + 1)) >= (coordinates.height - viewportTopOffset)) ?
				(coordinates.height - viewportTopOffset) / (openWindows + 1) : windowTopOffset;
		var leftOffset = ((windowLeftOffset * (openWindows + 1)) >= (coordinates.width - viewportLeftOffset - 20)) ?
				(coordinates.width - viewportLeftOffset - 20) / (openWindows + 1) : windowLeftOffset;

		var x = viewportLeftOffset;
		var y = viewportTopOffset;
		$$('.mocha').each(function(windowEl){
			var instance = windowEl.retrieve('instance');
			if (!instance.isMinimized && !instance.isMaximized && instance.options.draggable){
				instance.focus();
				x += leftOffset;
				y += topOffset;

				if (!MUI.options.advancedEffects){
					windowEl.setStyles({
						'top': y,
						'left': x
					});
				} else {
					var cascadeMorph = new Fx.Morph(windowEl, {
						'duration': 550
					});
					cascadeMorph.start({
						'top': y,
						'left': x
					});
				}
			}
		}.bind(this));
	},

	arrangeTile: function(){

		var viewportTopOffset = 30;    // Use a negative number if neccessary to place first window where you want it
		var viewportLeftOffset = 20;

		var x = 10;
		var y = 80;

		var windowsNum = 0;

		MUI.each(function(instance){
			if (instance.className != 'MUI.Window') return;
			if (!instance.isMinimized && !instance.isMaximized){
				windowsNum++;
			}
		});

		var cols = 3;
		var rows = Math.ceil(windowsNum / cols);

		var coordinates = document.getCoordinates();

		var col_width = ((coordinates.width - viewportLeftOffset) / cols);
		var col_height = ((coordinates.height - viewportTopOffset) / rows);

		var row = 0;
		var col = 0;

		MUI.each(function(instance){
			if (instance.className != 'MUI.Window') return;
			if (!instance.isMinimized && !instance.isMaximized && instance.options.draggable){

				var left = (x + (col * col_width));
				var top = (y + (row * col_height));

				instance.redraw();
				instance.focus();

				if (MUI.options.advancedEffects){
					var tileMorph = new Fx.Morph(instance.el.windowEl, {
						'duration': 550
					});
					tileMorph.start({
						'top': top,
						'left': left
					});
				} else {
					instance.el.windowEl.setStyles({
						'top': top,
						'left': left
					});
				}

				if (++col === cols){
					row++;
					col = 0;
				}
			}
		}.bind(this));
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
