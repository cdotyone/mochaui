/*
 ---

 script: Dock.js

 description: Implements the dock/taskbar. Enables window minimize.

 copyright: (c) 2010 Contributors in (/AUTHORS.txt).

 license: MIT-style license in (/MIT-LICENSE.txt).

 todo:
 - Make it so the dock requires no initial html markup.

 requires:
 - MochaUI/MUI
 - MochaUI/MUI.Windows
 - MochaUI/MUI.Column
 - MochaUI/MUI.Panel

 provides: [MUI.Dock]

 ...
 */

MUI.files['source|Dock.js'] = 'loaded';

MUI.options.extend({
	// Naming options:
	// If you change the IDs of the Mocha Desktop containers in your HTML, you need to change them here as well.
	dockWrapper: 'dockWrapper',
	dockVisible: 'true',
	dock:		'dock'
});

MUI.Dock = {

	options: {
		useControls:		  true,	  // Toggles autohide and dock placement controls.
		dockPosition:		 'bottom',  // Position the dock starts in, top or bottom.
		dockVisible:		  true,	  // is the dock visible
		// Style options
		trueButtonColor:	  [70, 245, 70],	 // Color for autohide on
		enabledButtonColor:   [115, 153, 191],
		disabledButtonColor:  [170, 170, 170]
	},

	initialize: function(){
		// Stops if MUI.Desktop is not implemented
		if (!MUI.Desktop) return;

		MUI.dockVisible = this.options.dockVisible;
		this.dockWrapper = $(MUI.options.dockWrapper);
		this.dock = $(MUI.options.dock);
		this.autoHideEvent = null;
		this.dockAutoHide = false;  // True when dock autohide is set to on, false if set to off

		if (!this.dockWrapper) return;

		if (!this.options.useControls){
			if ($('dockPlacement')){
				$('dockPlacement').setStyle('cursor', 'default');
			}
			if ($('dockAutoHide')){
				$('dockAutoHide').setStyle('cursor', 'default');
			}
		}

		this.dockWrapper.setStyles({
			'display':  'block',
			'position': 'absolute',
			'top':	  null,
			'bottom':   MUI.Desktop.desktopFooter ? MUI.Desktop.desktopFooter.offsetHeight : 0,
			'left':	 0
		});

		if (this.options.useControls){
			this.initializeDockControls();
		}

		// Add check mark to menu if link exists in menu
		if ($('dockLinkCheck')){
			this.sidebarCheck = new Element('div', {
				'class': 'check',
				'id': 'dock_check'
			}).inject($('dockLinkCheck'));
		}

		this.dockSortables = new Sortables('#dockSort', {
			opacity: 1,
			constrain: true,
			clone: false,
			revert: false
		});

		if (!(MUI.dockVisible)){
			this.dockWrapper.hide();
		}
		MUI.Desktop.setDesktopSize();

		if (MUI.myChain){
			MUI.myChain.callChain();
		}

	},

	initializeDockControls: function(){

		// Convert CSS colors to Canvas colors.
		this.setDockColors();

		if (this.options.useControls){
			// Insert canvas
			var canvas = new Element('canvas', {
				'id':	 'dockCanvas',
				'width':  '15',
				'height': '18'
			}).inject(this.dock);

			// Dynamically initialize canvas using excanvas. This is only required by IE
			if (Browser.Engine.trident && MUI.ieSupport == 'excanvas'){
				G_vmlCanvasManager.initElement(canvas);
			}
		}

		var dockPlacement = $('dockPlacement');
		var dockAutoHide = $('dockAutoHide');

		// Position top or bottom selector
		dockPlacement.setProperty('title', 'Position Dock Top');

		// Attach event
		dockPlacement.addEvent('click', function(){
			this.moveDock();
		}.bind(this));

		// Auto Hide toggle switch
		dockAutoHide.setProperty('title', 'Turn Auto Hide On');

		// Attach event Auto Hide
		dockAutoHide.addEvent('click', function(){
			if (this.dockWrapper.getProperty('dockPosition') == 'top')
				return false;

			var ctx = $('dockCanvas').getContext('2d');
			this.dockAutoHide = !this.dockAutoHide;	// Toggle
			if (this.dockAutoHide){
				$('dockAutoHide').setProperty('title', 'Turn Auto Hide Off');
				//ctx.clearRect(0, 11, 100, 100);
				MUI.Canvas.circle(ctx, 5, 14, 3, this.options.trueButtonColor, 1.0);

				// Define event
				this.autoHideEvent = function(event){
					if (!this.dockAutoHide)
						return;
					var dockHotspotHeight;
					if (!MUI.Desktop.desktopFooter){
						dockHotspotHeight = this.dockWrapper.offsetHeight;
						if (dockHotspotHeight < 25) dockHotspotHeight = 25;
					}
					else if (MUI.Desktop.desktopFooter){
						dockHotspotHeight = this.dockWrapper.offsetHeight + MUI.Desktop.desktopFooter.offsetHeight;
						if (dockHotspotHeight < 25) dockHotspotHeight = 25;
					}
					if (!MUI.Desktop.desktopFooter && event.client.y > (document.getCoordinates().height - dockHotspotHeight)){
						if (!MUI.dockVisible){
							this.dockWrapper.show();
							MUI.dockVisible = true;
							MUI.Desktop.setDesktopSize();
						}
					}
					else if (MUI.Desktop.desktopFooter && event.client.y > (document.getCoordinates().height - dockHotspotHeight)){
						if (!MUI.dockVisible){
							this.dockWrapper.show();
							MUI.dockVisible = true;
							MUI.Desktop.setDesktopSize();
						}
					}
					else if (MUI.dockVisible){
						this.dockWrapper.hide();
						MUI.dockVisible = false;
						MUI.Desktop.setDesktopSize();

					}
				}.bind(this);

				// Add event
				document.addEvent('mousemove', this.autoHideEvent);

			} else {
				$('dockAutoHide').setProperty('title', 'Turn Auto Hide On');
				//ctx.clearRect(0, 11, 100, 100);
				MUI.Canvas.circle(ctx, 5, 14, 3, this.options.enabledButtonColor, 1.0);
				// Remove event
				document.removeEvent('mousemove', this.autoHideEvent);
			}

		}.bind(this));

		this.renderDockControls();

		if (this.options.dockPosition == 'top'){
			this.moveDock();
		}

	},

	setDockColors: function(){
		var dockButtonEnabled = Asset.getCSSRule('.dockButtonEnabled');
		if (dockButtonEnabled && dockButtonEnabled.style.backgroundColor){
			this.options.enabledButtonColor = new Color(dockButtonEnabled.style.backgroundColor);
		}

		var dockButtonDisabled = Asset.getCSSRule('.dockButtonDisabled');
		if (dockButtonDisabled && dockButtonDisabled.style.backgroundColor){
			this.options.disabledButtonColor = new Color(dockButtonDisabled.style.backgroundColor);
		}

		var trueButtonColor = Asset.getCSSRule('.dockButtonTrue');
		if (trueButtonColor && trueButtonColor.style.backgroundColor){
			this.options.trueButtonColor = new Color(trueButtonColor.style.backgroundColor);
		}
	},

	renderDockControls: function(){
		// Draw dock controls
		var ctx = $('dockCanvas').getContext('2d');
		ctx.clearRect(0, 0, 100, 100);
		MUI.Canvas.circle(ctx, 5, 4, 3, this.options.enabledButtonColor, 1.0);

		if (this.dockWrapper.getProperty('dockPosition') == 'top'){
			MUI.Canvas.circle(ctx, 5, 14, 3, this.options.disabledButtonColor, 1.0)
		}
		else if (this.dockAutoHide){
			MUI.Canvas.circle(ctx, 5, 14, 3, this.options.trueButtonColor, 1.0);
		}
		else {
			MUI.Canvas.circle(ctx, 5, 14, 3, this.options.enabledButtonColor, 1.0);
		}
	},

	moveDock: function(){
		var ctx = $('dockCanvas').getContext('2d');
		// Move dock to top position
		if (this.dockWrapper.getStyle('position') != 'relative'){
			this.dockWrapper.setStyles({
				'position': 'relative',
				'bottom':   null
			});
			this.dockWrapper.addClass('top');
			MUI.Desktop.setDesktopSize();
			this.dockWrapper.setProperty('dockPosition', 'top');
			ctx.clearRect(0, 0, 100, 100);
			MUI.Canvas.circle(ctx, 5, 4, 3, this.options.enabledButtonColor, 1.0);
			MUI.Canvas.circle(ctx, 5, 14, 3, this.options.disabledButtonColor, 1.0);
			$('dockPlacement').setProperty('title', 'Position Dock Bottom');
			$('dockAutoHide').setProperty('title', 'Auto Hide Disabled in Top Dock Position');
			this.dockAutoHide = false;
		}
		// Move dock to bottom position
		else {
			this.dockWrapper.setStyles({
				'position':	  'absolute',
				'bottom':		MUI.Desktop.desktopFooter ? MUI.Desktop.desktopFooter.offsetHeight : 0
			});
			this.dockWrapper.removeClass('top');
			MUI.Desktop.setDesktopSize();
			this.dockWrapper.setProperty('dockPosition', 'bottom');
			ctx.clearRect(0, 0, 100, 100);
			MUI.Canvas.circle(ctx, 5, 4, 3, this.options.enabledButtonColor, 1.0);
			MUI.Canvas.circle(ctx, 5, 14, 3, this.options.enabledButtonColor, 1.0);
			$('dockPlacement').setProperty('title', 'Position Dock Top');
			$('dockAutoHide').setProperty('title', 'Turn Auto Hide On');
		}
	},

	createDockTab: function(windowEl){

		var instance = windowEl.retrieve('instance');

		var dockTab = new Element('div', {
			'id': instance.options.id + '_dockTab',
			'class': 'dockTab',
			'title': titleText
		}).inject($('dockClear'), 'before');

		dockTab.addEvent('mousedown', function(e){
			new Event(e).stop();
			this.timeDown = $time();
		});

		dockTab.addEvent('mouseup', function(){
			this.timeUp = $time();
			if ((this.timeUp - this.timeDown) < 275){
				// If the visibility of the windows on the page are toggled off, toggle visibility on.
				if (!MUI.Windows.windowsVisible){
					MUI.Windows.toggleAll();
					if (instance.isMinimized) instance._restoreMinimized.delay(25,instance);
					else instance.focus();
					return;
				}
				// If window is minimized, restore window.
				if (instance.isMinimized) instance._restoreMinimized.delay(25,instance);
				else {
					if (instance.el.windowEl.hasClass('isFocused') && instance.options.minimizable) MUI.Windows.minimize(windowEl);
					else this.focus();

					// if the window is not minimized and is outside the viewport, center it in the viewport.
					var coordinates = document.getCoordinates();
					if (windowEl.getStyle('left').toInt() > coordinates.width || windowEl.getStyle('top').toInt() > coordinates.height){
						instance.center();
					}
				}
			}
		});

		this.dockSortables.addItems(dockTab);

		var titleText = instance.el.title.innerHTML;

		new Element('div', {
			'id': instance.options.id + '_dockTabText',
			'class': 'dockText'
		}).set('html', titleText.substring(0, 19) + (titleText.length > 19 ? '...' : '')).inject($(dockTab));

		// If I implement this again, will need to also adjust the titleText truncate and the tab's
		// left padding.
		if (instance.options.icon != false){
			// dockTabText.setStyle('background', 'url(' + instance.options.icon + ') 4px 4px no-repeat');
		}

		// Need to resize everything in case the dock wraps when a new tab is added
		MUI.Desktop.setDesktopSize();

	},

	makeActiveTab: function(){

		// getWindowWith HighestZindex is used in case the currently focused window
		// is closed.
		var windowEl = MUI.Windows._getWithHighestZIndex();
		var instance = windowEl.retrieve('instance');

		$$('.dockTab').removeClass('activeDockTab');
		if (instance.isMinimized != true){

			instance.el.windowEl.addClass('isFocused');

			var currentButton = $(instance.options.id + '_dockTab');
			if (currentButton != null){
				currentButton.addClass('activeDockTab');
			}
		}
		else {
			instance.el.windowEl.removeClass('isFocused');
		}
	},

	toggle: function(){
		if (!MochaUI.dockVisible){
			this.dockWrapper.show();
			MUI.dockVisible = true;
			MUI.Desktop.setDesktopSize();
		}
		else {
			this.dockWrapper.hide();
			MUI.dockVisible = false;
			MUI.Desktop.setDesktopSize();
		}
	}

};

MUI.Windows = (MUI.Windows || $H({})).extend({

	minimizeAll: function(){
		$$('.mocha').each(function(windowEl){
			var instance = windowEl.retrieve('instance');
			if (!instance.isMinimized && instance.options.minimizable){
				instance.minimize();
			}
		}.bind(this));
	}

});

MUI.Window = (MUI.Window || new NamedClass('MUI.Window',{})).implement({

	minimize: function(){
		if(this.isMinimized) return this;
		this.isMinimized = true;

		// Hide iframe
		// Iframe should be hidden when minimizing, maximizing, and moving for performance and Flash issues
		if (this.el.iframe){
			// Some elements are still visible in IE8 in the iframe when the iframe's visibility is set to hidden.
			if (!Browser.Engine.trident) this.el.iframe.setStyle('visibility', 'hidden');
			else this.el.iframe.hide();
		}

		this.hide(); // Hide window and add to dock

		// Fixes a scrollbar issue in Mac FF2
		if (Browser.Platform.mac && Browser.Engine.gecko){
			if (/Firefox[\/\s](\d+\.\d+)/.test(navigator.userAgent)){
				var ffversion = new Number(RegExp.$1);
				if (ffversion < 3){
					this.el.contentWrapper.setStyle('overflow', 'hidden');
				}
			}
		}

		if(MUI.Desktop) MUI.Desktop.setDesktopSize();

		// Have to use timeout because window gets focused when you click on the minimize button
		setTimeout(function(){
			this.el.windowEl.setStyle('zIndex', 1);
			this.el.windowEl.removeClass('isFocused');
			MUI.Dock.makeActiveTab();
		}.bind(this), 100);

		this.fireEvent('minimize', [this]);
		return this;
	},

	_restoreMinimized: function(){
		if (!this.isMinimized) return;

		if (!MUI.Windows.windowsVisible) MUI.Windows.toggleAll();
		MUI.Desktop.setDesktopSize();
		if (this.options.scrollbars && !this.el.iframe) this.el.contentWrapper.setStyle('overflow', 'auto'); // Part of Mac FF2 scrollbar fix
		if (this.isCollapsed) this.collapseToggle();
		this.show(); // show the window

		if (this.el.iframe){  // Show iframe
			if (!Browser.Engine.trident) this.el.iframe.setStyle('visibility', 'visible');
			else this.el.iframe.show();
		}

		this.isMinimized = false;
		this.focus();
		this.fireEvent('restore',[this]);
	}

});