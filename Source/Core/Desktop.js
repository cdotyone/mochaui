/*
 ---

 name: Desktop

 script: desktop.js

 description: Create web application layouts. Enables window maximize.

 copyright: (c) 2010 Contributors in (/AUTHORS.txt).

 license: MIT-style license in (/MIT-LICENSE.txt).

 requires:
 - MochaUI/MUI
 - MUI.Column
 - MUI.Panel

 provides: [MUI.Desktop]

 ...
 */

MUI.files['source|Desktop.js'] = 'loaded';

MUI.Desktop = {

	options: {
		// Naming options:
		// If you change the IDs of the MochaUI Desktop containers in your HTML, you need to change them here as well.
		desktop:			 'desktop',
		desktopHeader:	   'desktopHeader',
		desktopFooter:	   'desktopFooter',
		desktopNavBar:	   'desktopNavbar',
		pageWrapper:		 'pageWrapper',
		page:				'page',
		desktopFooterWrapper:'desktopFooterWrapper'
	},

	initialize: function(){

		this.desktop = $(this.options.desktop);
		this.desktopHeader = $(this.options.desktopHeader);
		this.desktopNavBar = $(this.options.desktopNavBar);
		this.pageWrapper = $(this.options.pageWrapper);
		this.page = $(this.options.page);
		this.desktopFooter = $(this.options.desktopFooter);

		if (this.desktop){
			$$('body').setStyles({
				overflow: 'hidden',
				height: '100%',
				margin: 0
			});
			$$('html').setStyles({
				overflow: 'hidden',
				height: '100%'
			});
		}

		// This is run on dock initialize so no need to do it twice.
		if (!MUI.Dock) this.setDesktopSize();
		this.menuInitialize();

		// Resize desktop, page wrapper, modal overlay, and maximized windows when browser window is resized
		window.addEvent('resize', function(){
			this.onBrowserResize();
		}.bind(this));

		if (MUI.myChain) MUI.myChain.callChain();

	},

	menuInitialize: function(){
		// Fix for dropdown menus in IE6
		if (Browser.Engine.trident4 && this.desktopNavBar){
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

	onBrowserResize: function(){
		this.setDesktopSize();
		// Resize maximized windows to fit new browser window size
		setTimeout(function(){
			MUI.each(function(instance){
				var options=instance.options;
				if (instance.className != 'MUI.Window') return;
				if (instance.isMaximized){

					// Hide iframe while resize for better performance
					if (instance.el.iframe) instance.el.iframe.setStyle('visibility', 'hidden');

					var resizeDimensions;
					if(options.maximizeTo) resizeDimensions=$(options.maximizeTo).getCoordinates();
					else resizeDimensions=document.getCoordinates();
					var shadowBlur = options.shadowBlur;
					var shadowOffset = options.shadowOffset;
					var newHeight = resizeDimensions.height - options.headerHeight - options.footerHeight;
					newHeight -= instance.el.contentBorder.getStyle('border-top').toInt();
					newHeight -= instance.el.contentBorder.getStyle('border-bottom').toInt();
					newHeight -= instance.getAllSectionsHeight();

					MUI.resizeWindow(instance.el.windowEl, {
						width: resizeDimensions.width,
						height: newHeight,
						top: resizeDimensions.top + shadowOffset.y - shadowBlur,
						left: resizeDimensions.left + shadowOffset.x - shadowBlur
					});

					instance.drawWindow();
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

	setDesktopSize: function(){
		var windowDimensions = window.getCoordinates();

		// var dock = $(MUI.options.dock);
		var dockWrapper = $(MUI.options.dockWrapper);

		// Setting the desktop height may only be needed by IE7
		if (this.desktop) this.desktop.setStyle('height', windowDimensions.height);

		// Set pageWrapper height so the dock doesn't cover the pageWrapper scrollbars.
		if (this.pageWrapper){
			var dockOffset = MUI.dockVisible ? dockWrapper.offsetHeight : 0;
			var pageWrapperHeight = windowDimensions.height;
			pageWrapperHeight -= this.pageWrapper.getStyle('border-top').toInt();
			pageWrapperHeight -= this.pageWrapper.getStyle('border-bottom').toInt();
			if (this.desktopHeader) pageWrapperHeight -= this.desktopHeader.offsetHeight;
			if (this.desktopFooter) pageWrapperHeight -= this.desktopFooter.offsetHeight;
			pageWrapperHeight -= dockOffset;

			if (pageWrapperHeight < 0) pageWrapperHeight = 0;

			this.pageWrapper.setStyle('height', pageWrapperHeight);
		}

		///*		if (MUI.Columns.instances.getKeys().length > 0){ // Conditional is a fix for a bug in IE6 in the no toolbars demo.
		MUI.Desktop.resizePanels();
		//}*/
	},

	resizePanels: function(){
		MUI.panelHeight();
		MUI.rWidth();
	},

	maximizeWindow: function(windowEl){
		var instance = MUI.get(windowEl);
		var options = instance.options;
		var windowDrag = instance.windowDrag;

		// If window no longer exists or is maximized, stop
		if (windowEl != $(windowEl) || instance.isMaximized) return;
		if (instance.isCollapsed) MUI.collapseToggle(windowEl);
		instance.isMaximized = true;

		// If window is restricted to a container, it should not be draggable when maximized.
		if (instance.options.restrict){
			windowDrag.detach();
			if (options.resizable) instance.detachResizable();
			instance.el.titleBar.setStyle('cursor', 'default');
		}

		// If the window has a container that is not the desktop
		// temporarily move the window to the desktop while it is minimized.
		if (options.container != this.desktop){
			this.desktop.grab(windowEl);
			if (this.options.restrict) windowDrag.container = this.desktop;
		}

		// Save original position
		instance.oldTop = windowEl.getStyle('top');
		instance.oldLeft = windowEl.getStyle('left');

		// save original corner radius
		if (!options.radiusOnMaximize){
			instance.oldRadius = instance.options.cornerRadius;
			instance.oldShadowBlur = instance.options.shadowBlur;
			instance.oldShadowOffset = instance.options.shadowOffset;

			instance.options.cornerRadius = 0;
			instance.options.shadowBlur = 0;
			instance.options.shadowOffset = {'x': 0, 'y': 0};
		}

		// Save original dimensions
		var contentWrapper = instance.el.contentWrapper;
		contentWrapper.oldWidth = contentWrapper.getStyle('width');
		contentWrapper.oldHeight = contentWrapper.getStyle('height');

		// Hide iframe
		// Iframe should be hidden when minimizing, maximizing, and moving for performance and Flash issues
		if (instance.el.iframe){
			if (!Browser.Engine.trident) instance.el.iframe.setStyle('visibility', 'hidden');
			else instance.el.iframe.hide();
		}

		var resizeDimensions;
		if (options.maximizeTo) resizeDimensions = $(options.maximizeTo).getCoordinates();
		else resizeDimensions = document.getCoordinates();
		var shadowBlur = options.shadowBlur;
		var shadowOffset = options.shadowOffset;
		var newHeight = resizeDimensions.height - options.headerHeight - options.footerHeight;
		newHeight -= instance.el.contentBorder.getStyle('border-top').toInt();
		newHeight -= instance.el.contentBorder.getStyle('border-bottom').toInt();
		newHeight -= instance.getAllSectionsHeight();

		MUI.resizeWindow(windowEl, {
			width: resizeDimensions.width,
			height: newHeight,
			top: resizeDimensions.top + shadowOffset.y - shadowBlur,
			left: resizeDimensions.left + shadowOffset.x - shadowBlur
		});
		instance.fireEvent('onMaximize', windowEl);

		if (instance.el.maximizeButton) instance.el.maximizeButton.setProperty('title', 'Restore');
		MUI.focusWindow(windowEl);
	},

	restoreWindow: function(windowEl){
		var instance = windowEl.retrieve('instance');
		var options = instance.options;

		// Window exists and is maximized ?
		if (windowEl != $(windowEl) || !instance.isMaximized) return;

		instance.isMaximized = false;

		if (!options.radiusOnMaximize){
			instance.options.cornerRadius = instance.oldRadius;
			instance.options.shadowBlur = instance.oldShadowBlur;
			instance.options.shadowOffset = instance.oldShadowOffset;
		}

		if (options.restrict){
			instance.windowDrag.attach();
			if (options.resizable) instance.reattachResizable();
			instance.el.titleBar.setStyle('cursor', 'move');
		}

		// Hide iframe
		// Iframe should be hidden when minimizing, maximizing, and moving for performance and Flash issues
		if (instance.el.iframe){
			if (!Browser.Engine.trident) instance.el.iframe.setStyle('visibility', 'hidden');
			else instance.el.iframe.hide();
		}

		var contentWrapper = instance.el.contentWrapper;
		MUI.resizeWindow(windowEl, {
			width: contentWrapper.oldWidth,
			height: contentWrapper.oldHeight,
			top: instance.oldTop,
			left: instance.oldLeft
		});
		instance.fireEvent('onRestore', windowEl);

		if (instance.el.maximizeButton) instance.el.maximizeButton.setProperty('title', 'Maximize');
	}
};

MUI.extend({

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
		if (Browser.Engine.trident4 && parent == MUI.Desktop.pageWrapper){
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
					'cursor': Browser.Engine.webkit ? 'row-resize' : 'n-resize'
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
				MUI.get(panel.id).fireEvent('resize');
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
			if (Browser.Engine.trident4 && parent == MUI.Desktop.pageWrapper){
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
		var instance = MUI.get(panel.id);
		var contentWrapper = instance.el.contentWrapper;

		if (instance.el.iframe){
			if (!Browser.Engine.trident){
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

	// Remaining Width
	rWidth: function(container){
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
			[].include(instance)
			  .combine(instance.getPanels())
			  .each(function(panel){
					panel.fireEvent('resize')
			  });

			column.getChildren('.panel').each(function(panel){
				panel.setStyle('width', newWidth - panel.getStyle('border-left').toInt() - panel.getStyle('border-right').toInt());
				MUI.resizeChildren(panel);
			}.bind(this));

		});
	}

});
