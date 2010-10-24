/*
 ---

 script: Desktop.js

 description: Create web application layouts. Enables window maximize.

 todo:
 - Make it so the dock requires no initial html markup.

 copyright: (c) 2010 Contributors in (/AUTHORS.txt).

 license: MIT-style license in (/MIT-LICENSE.txt).

 requires:
 - MochaUI/MUI
 - MUI.Column
 - MUI.Panel

 provides: [MUI.Desktop]

 ...
 */

MUI.files[MUI.path.source + 'Desktop.js'] = 'loaded';

MUI.append({
	Columns: {
		instances: {},
		columnIDCount: 0 // Used for columns without an ID defined by the user
	},
	Panels: {
		instances: {},
		panelIDCount: 0 // Used for panels without an ID defined by the user
	}
});

MUI.Desktop = {

	options: {
		// Naming options:
		// If you change the IDs of the MochaUI Desktop containers in your HTML, you need to change them here as well.
		desktop:				'desktop',
		desktopHeader:			'desktopHeader',
		desktopFooter:			'desktopFooter',
		desktopNavBar:			'desktopNavbar',
		pageWrapper:			'pageWrapper',
		page:					'page',
		desktopFooterWrapper:	'desktopFooterWrapper'
	},
	initialize: function(){

		this.desktop = $(this.options.desktop);
		this.desktopHeader = $(this.options.desktopHeader);
		this.desktopNavBar = $(this.options.desktopNavBar);
		this.pageWrapper = $(this.options.pageWrapper);
		this.page = $(this.options.page);
		this.desktopFooter = $(this.options.desktopFooter);

		if (this.desktop){
			($$('body')).setStyles({
				overflow: 'hidden',
				height: '100%',
				margin: 0
			});
			($$('html')).setStyles({
				overflow: 'hidden',
				height: '100%'
			});
		}

		// This is run on dock initialize so no need to do it twice.
		if (!MUI.Dock){
			this.setDesktopSize();
		}
		this.menuInitialize();

		// Resize desktop, page wrapper, modal overlay, and maximized windows when browser window is resized
		window.addEvent('resize', function(){
			this.onBrowserResize();
		}.bind(this));

		if (MUI.myChain){
			MUI.myChain.callChain();
		}

	},
	menuInitialize: function(){
		// Fix for dropdown menus in IE6
		if (Browser.ie4 && this.desktopNavBar){
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
			Object.each(MUI.Windows.instances,function(instance){
				if (instance.isMaximized){

					// Hide iframe while resize for better performance
					if (instance.iframeEl){
						instance.iframeEl.setStyle('visibility', 'hidden');
					}

					var coordinates = document.getCoordinates();
					var borderHeight = instance.contentBorderEl.getStyle('border-top').toInt() + instance.contentBorderEl.getStyle('border-bottom').toInt();
					var toolbarHeight = instance.toolbarWrapperEl ? instance.toolbarWrapperEl.getStyle('height').toInt() + instance.toolbarWrapperEl.getStyle('border-top').toInt() : 0;
					instance.contentWrapperEl.setStyles({
						'height': coordinates.height - instance.options.headerHeight - instance.options.footerHeight - borderHeight - toolbarHeight,
						'width': coordinates.width
					});

					instance.drawWindow();
					if (instance.iframeEl){
						instance.iframeEl.setStyles({
							'height': instance.contentWrapperEl.getStyle('height')
						});
						instance.iframeEl.setStyle('visibility', 'visible');
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
		if (this.desktop){
			this.desktop.setStyle('height', windowDimensions.height);
		}

		// Set pageWrapper height so the dock doesn't cover the pageWrapper scrollbars.
		if (this.pageWrapper){
			var dockOffset = MUI.dockVisible ? dockWrapper.offsetHeight : 0;
			var pageWrapperHeight = windowDimensions.height;
			pageWrapperHeight -= this.pageWrapper.getStyle('border-top').toInt();
			pageWrapperHeight -= this.pageWrapper.getStyle('border-bottom').toInt();
			if (this.desktopHeader){
				pageWrapperHeight -= this.desktopHeader.offsetHeight;
			}
			if (this.desktopFooter){
				pageWrapperHeight -= this.desktopFooter.offsetHeight;
			}
			pageWrapperHeight -= dockOffset;

			if (pageWrapperHeight < 0){
				pageWrapperHeight = 0;
			}
			this.pageWrapper.setStyle('height', pageWrapperHeight);
		}

		if (MUI.Columns.instances.length > 0){ // Conditional is a fix for a bug in IE6 in the no toolbars demo.
			MUI.Desktop.resizePanels();
		}
	},
	resizePanels: function(){
		MUI.panelHeight();
		MUI.rWidth();
	},
	/*

	 Function: maximizeWindow
	 Maximize a window.

	 Syntax:
	 (start code)
	 MUI.Desktop.maximizeWindow(windowEl);
	 (end)

	 */
	maximizeWindow: function(windowEl){

		var instance = MUI.Windows.instances[windowEl.id];
		var options = instance.options;
		var windowDrag = instance.windowDrag;

		// If window no longer exists or is maximized, stop
		if (windowEl != $(windowEl) || instance.isMaximized) return;

		if (instance.isCollapsed){
			MUI.collapseToggle(windowEl);
		}

		instance.isMaximized = true;

		// If window is restricted to a container, it should not be draggable when maximized.
		if (instance.options.restrict){
			windowDrag.detach();
			if (options.resizable){
				instance.detachResizable();
			}
			instance.titleBarEl.setStyle('cursor', 'default');
		}

		// If the window has a container that is not the desktop
		// temporarily move the window to the desktop while it is minimized.
		if (options.container != this.desktop){
			this.desktop.grab(windowEl);
			if (this.options.restrict){
				windowDrag.container = this.desktop;
			}
		}

		// Save original position
		instance.oldTop = windowEl.getStyle('top');
		instance.oldLeft = windowEl.getStyle('left');

		var contentWrapperEl = instance.contentWrapperEl;

		// Save original dimensions
		contentWrapperEl.oldWidth = contentWrapperEl.getStyle('width');
		contentWrapperEl.oldHeight = contentWrapperEl.getStyle('height');

		// Hide iframe
		// Iframe should be hidden when minimizing, maximizing, and moving for performance and Flash issues
		if (instance.iframeEl){
			if (!Browser.ie){
				instance.iframeEl.setStyle('visibility', 'hidden');
			}
			else {
				instance.iframeEl.hide();
			}
		}

		var windowDimensions = document.getCoordinates();
		var shadowBlur = options.shadowBlur;
		var shadowOffset = options.shadowOffset;
		var newHeight = windowDimensions.height - options.headerHeight - options.footerHeight;
		newHeight -= instance.contentBorderEl.getStyle('border-top').toInt();
		newHeight -= instance.contentBorderEl.getStyle('border-bottom').toInt();
		newHeight -= (instance.toolbarWrapperEl ? instance.toolbarWrapperEl.getStyle('height').toInt() + instance.toolbarWrapperEl.getStyle('border-top').toInt() : 0);

		MUI.resizeWindow(windowEl, {
			width: windowDimensions.width,
			height: newHeight,
			top: shadowOffset.y - shadowBlur,
			left: shadowOffset.x - shadowBlur
		});
		instance.fireEvent('onMaximize', windowEl);

		if (instance.maximizeButtonEl){
			instance.maximizeButtonEl.setProperty('title', 'Restore');
		}
		MUI.focusWindow(windowEl);

	},
	/*

	 Function: restoreWindow
	 Restore a maximized window.

	 Syntax:
	 (start code)
	 MUI.Desktop.restoreWindow(windowEl);
	 (end)

	 */
	restoreWindow: function(windowEl){

		var instance = windowEl.retrieve('instance');

		// Window exists and is maximized ?
		if (windowEl != $(windowEl) || !instance.isMaximized) return;

		var options = instance.options;
		instance.isMaximized = false;

		if (options.restrict){
			instance.windowDrag.attach();
			if (options.resizable){
				instance.reattachResizable();
			}
			instance.titleBarEl.setStyle('cursor', 'move');
		}

		// Hide iframe
		// Iframe should be hidden when minimizing, maximizing, and moving for performance and Flash issues
		if (instance.iframeEl){
			if (!Browser.ie){
				instance.iframeEl.setStyle('visibility', 'hidden');
			}
			else {
				instance.iframeEl.hide();
			}
		}

		var contentWrapperEl = instance.contentWrapperEl;

		MUI.resizeWindow(windowEl, {
			width: contentWrapperEl.oldWidth,
			height: contentWrapperEl.oldHeight,
			top: instance.oldTop,
			left: instance.oldLeft
		});
		instance.fireEvent('onRestore', windowEl);

		if (instance.maximizeButtonEl){
			instance.maximizeButtonEl.setProperty('title', 'Maximize');
		}
	}
};

