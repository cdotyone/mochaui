/*
 ---

 script: Dock.js

 description: Implements the dock/taskbar. Enables window minimize.

 copyright: (c) 2010 Contributors in (/AUTHORS.txt).

 license: MIT-style license in (/MIT-LICENSE.txt).

 requires:
 - MochaUI/MUI
 - MochaUI/MUI.Desktop

 provides: [MUI.Dock]

 ...
 */

MUI.files['{source}Core/Dock.js'] = 'loaded';

MUI.Dock = (MUI.Dock || new NamedClass('MUI.Dock',{})).implement({

	Implements: [Events, Options],

	options: {
		id:				'dock',
		container:		null,
		drawOnInit:		true,

		useControls:	true,			// Toggles autohide and dock placement controls.
		position:		'bottom',		// Position the dock starts in, top or bottom.
		visible:		true,			// is the dock visible
		autoHide: 		false,			// True when dock autohide is set to on, false if set to off
		menuCheck:		'dockLinkCheck',// the name of the element in the menu that needs to be checked if dock is shown

		onDrawBegin:	$empty,
		onDrawEnd:		$empty,
		onMove:			$empty,
		onTabCreated:	$empty,
		onTabSet:		$empty,
		onHide:			$empty,
		onShow:			$empty
	},

	initialize: function(options){
		this.setOptions(options);

		if (MUI.dock != null) return false;  // only one dock allowed
		else MUI.set(this.options.id, this);
		MUI.dock = this;

		if (!this.options.container) this.options.container = 'desktop';
		this.container = $(this.options.container);

		this.el = {};
		this.el.dock = $(this.options.id);
		if (!this.el.dock && this.options.drawOnInit) this.draw();
		else if (this.el.dock){
			this.el.wrapper = $(this.options.id + 'Wrapper');

			if (!this.options.useControls){
				if ($(this.options.id + 'Placement')) $(this.options.id + 'Placement').setStyle('cursor', 'default');
				if ($(this.options.id + 'AutoHide')) $(this.options.id + 'AutoHide').setStyle('cursor', 'default');
			}

			this.el.wrapper.setStyles({
				'display':	'block',
				'position':	'absolute',
				'top':		null,
				'bottom':	MUI.Desktop.desktopFooter ? MUI.Desktop.desktopFooter.offsetHeight : 0,
				'left':		0
			});

			if (this.options.useControls) this._initializeDockControls();
		}
	},

	draw: function(){
		this.fireEvent('drawBegin', [this]);

		this.el.wrapper = new Element('div', {'id': this.options.id + 'Wrapper', styles: {
				'display':	'block',
				'position':	'absolute',
				'top':		null,
				'bottom':	MUI.Desktop.desktopFooter ? MUI.Desktop.desktopFooter.offsetHeight : 0,
				'left':		0
			}}).inject(this.container);
		this.el.dock = new Element('div', {'id': this.options.id}).inject(this.el.wrapper);

		if (this.options.useControls){
			this.el.dockPlacement = new Element('div', {'id': this.options.id + 'Placement'}).inject(this.el.dock).setStyle('cursor', 'default');
			this.el.dockAutoHide = new Element('div', {'id': this.options.id + 'AutoHide'}).inject(this.el.dock).setStyle('cursor', 'default');
		}

		this.el.dockSort = new Element('div', {'id': this.options.id + 'Sort'}).inject(this.el.dock);
		this.el.dockClear = new Element('div', {'id': this.options.id + 'Clear', 'class': 'clear'}).inject(this.el.dockSort);

		this._initializeDockControls();
		this.fireEvent('drawEnd', [this]);
	},

	setDockColors: function(){
		var dockButtonEnabled = Asset.getCSSRule('.dockButtonEnabled');
		if (dockButtonEnabled && dockButtonEnabled.style.backgroundColor)
			this.enabledButtonColor = new Color(dockButtonEnabled.style.backgroundColor);

		var dockButtonDisabled = Asset.getCSSRule('.dockButtonDisabled');
		if (dockButtonDisabled && dockButtonDisabled.style.backgroundColor)
			this.disabledButtonColor = new Color(dockButtonDisabled.style.backgroundColor);

		var trueButtonColor = Asset.getCSSRule('.dockButtonTrue');
		if (trueButtonColor && trueButtonColor.style.backgroundColor)
			this.trueButtonColor = new Color(trueButtonColor.style.backgroundColor);

		this._renderDockControls();
	},

	getHeight: function(){
		return this.el.wrapper.offsetHeight;
	},

	moveDock: function(position){
		var ctx = $(this.options.id+'Canvas').getContext('2d');
		// Move dock to top position
		if (position=='top' || this.el.wrapper.getStyle('position') != 'relative'){
			if (position=='top') return;

			this.el.wrapper.setStyles({
				'position':	'relative',
				'bottom':	null
			}).addClass('top');
			MUI.Desktop.setDesktopSize();
			this.el.wrapper.setProperty('position', 'top');
			ctx.clearRect(0, 0, 100, 100);
			MUI.Canvas.circle(ctx, 5, 4, 3, this.enabledButtonColor, 1.0);
			MUI.Canvas.circle(ctx, 5, 14, 3, this.disabledButtonColor, 1.0);
			$(this.options.id + 'Placement').setProperty('title', 'Position Dock Bottom');
			$(this.options.id + 'AutoHide').setProperty('title', 'Auto Hide Disabled in Top Dock Position');
			this.options.autoHide = false;
			this.options.position = 'top';
		} else {
			if (position=='bottom') return;

			// Move dock to bottom position
			this.el.wrapper.setStyles({
				'position':	'absolute',
				'bottom':	MUI.Desktop.desktopFooter ? MUI.Desktop.desktopFooter.offsetHeight : 0
			}).removeClass('top');
			MUI.Desktop.setDesktopSize();
			this.el.wrapper.setProperty('position', 'bottom');
			ctx.clearRect(0, 0, 100, 100);
			MUI.Canvas.circle(ctx, 5, 4, 3, this.enabledButtonColor, 1.0);
			MUI.Canvas.circle(ctx, 5, 14, 3, this.enabledButtonColor, 1.0);
			$(this.options.id + 'Placement').setProperty('title', 'Position Dock Top');
			$(this.options.id + 'AutoHide').setProperty('title', 'Turn Auto Hide On');
			this.options.position = 'bottom';
		}

		this.fireEvent('move', [this, this.options.position]);
	},

	createDockTab: function(instance){
		var dockTab = new Element('div', {
			'id': instance.options.id + '_dockTab',
			'class': 'dockTab',
			'title': titleText
		}).inject($(this.options.id + 'Clear'), 'before');

		dockTab.addEvent('mousedown', function(e){
			new Event(e).stop();
			this.timeDown = $time();
		}.bind(instance));

		dockTab.addEvent('mouseup', function(){
			this.timeUp = $time();
			if ((this.timeUp - this.timeDown) < 275){
				// If the visibility of the windows on the page are toggled off, toggle visibility on.
				if (!MUI.Windows.windowsVisible){
					MUI.Windows.toggleAll();
					if (this.isMinimized) this._restoreMinimized.delay(25, this);
					else this.focus();
					return;
				}
				// If window is minimized, restore window.
				if (this.isMinimized) this._restoreMinimized.delay(25, this);
				else {
					var windowEl = this.el.windowEl;
					if (windowEl.hasClass('isFocused') && this.options.minimizable) this.minimize.delay(25, this);
					else this.focus();

					// if the window is not minimized and is outside the viewport, center it in the viewport.
					var coordinates = document.getCoordinates();
					if (windowEl.getStyle('left').toInt() > coordinates.width || windowEl.getStyle('top').toInt() > coordinates.height)
						this.center();
				}
			}
		}.bind(instance));

		this.dockSortables.addItems(dockTab);

		var titleText = instance.el.title.innerHTML;

		new Element('div', {
			'id': instance.options.id + '_dockTabText',
			'class': 'dockText'
		}).set('html', titleText.substring(0, 19) + (titleText.length > 19 ? '...' : '')).inject($(dockTab));

		// Need to resize everything in case the dock wraps when a new tab is added
		MUI.Desktop.setDesktopSize();
		this.fireEvent('tabCreated', [this, instance]);
	},

	makeActiveTab: function(instance){
		if (!instance){
			// getWindowWithHighestZindex is used in case the currently focused window is closed.
			var windowEl = MUI.Windows._getWithHighestZIndex();
			instance = windowEl.retrieve('instance');
		}

		$$('.dockTab').removeClass('activeDockTab');
		if (instance.isMinimized != true){
			instance.el.windowEl.addClass('isFocused');
			var currentButton = $(instance.options.id + '_dockTab');
			if (currentButton != null) currentButton.addClass('activeDockTab');
		} else instance.el.windowEl.removeClass('isFocused');
		this.fireEvent('tabSet',[this,instance]);
	},

	show: function(){
		this.el.wrapper.show();
		this.options.visible = true;
		MUI.Desktop.setDesktopSize();
		this.fireEvent('show',[this]);
	},

	hide: function(){
		this.el.wrapper.hide();
		this.options.visible = false;
		MUI.Desktop.setDesktopSize();
		this.fireEvent('hide',[this]);
	},

	toggle: function(){
		if (!this.options.visible) this.show();
		else this.hide();
	},

	_initializeDockControls: function(){
		if (this.options.useControls){
			// Insert canvas
			var canvas = new Element('canvas', {
				'id':	 this.options.id + 'Canvas',
				'width':  '15',
				'height': '18'
			}).inject(this.el.dock);

			// Dynamically initialize canvas using excanvas. This is only required by IE
			if (Browser.Engine.trident && MUI.ieSupport == 'excanvas'){
				G_vmlCanvasManager.initElement(canvas);
			}
		}

		var dockPlacement = $(this.options.id + 'Placement');
		var dockAutoHide = $(this.options.id + 'AutoHide');

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
			this._doAutoHide();
		}.bind(this));

		this.setDockColors();

		if (this.options.position == 'top') this.moveDock();

		// Add check mark to menu if link exists in menu
		if ($(this.options.menuCheck)) this.sidebarCheck = new Element('div', {
			'class': 'check',
			'id': this.options.id + '_check'
		}).inject($(this.options.menuCheck));

		this.dockSortables = new Sortables('#dockSort', {
			opacity: 1,
			constrain: true,
			clone: false,
			revert: false
		});

		if (this.options.autoHide) this._doAutoHide(true);
		MUI.Desktop.setDesktopSize();
	},

	_doAutoHide: function(notoggle){
		if (this.el.wrapper.getProperty('position') == 'top')
			return false;

		var ctx = $(this.options.id + 'Canvas').getContext('2d');
		if (!notoggle) this.options.autoHide = !this.options.autoHide;	// Toggle

		if (this.options.autoHide){
			$(this.options.id + 'AutoHide').setProperty('title', 'Turn Auto Hide Off');
			//ctx.clearRect(0, 11, 100, 100);
			MUI.Canvas.circle(ctx, 5, 14, 3, this.trueButtonColor, 1.0);
			// Add event
			document.addEvent('mousemove', this._autoHideEvent.bind(this));
		} else {
			$(this.options.id+'AutoHide').setProperty('title', 'Turn Auto Hide On');
			//ctx.clearRect(0, 11, 100, 100);
			MUI.Canvas.circle(ctx, 5, 14, 3, this.enabledButtonColor, 1.0);
			// Remove event
			document.removeEvent('mousemove', this._autoHideEvent.bind(this));
		}
	},

	_autoHideEvent: function(event){
		if (!this.options.autoHide) return;
		var dockHotspotHeight;
		if (!MUI.Desktop.desktopFooter){
			dockHotspotHeight = this.el.wrapper.offsetHeight;
			if (dockHotspotHeight < 25) dockHotspotHeight = 25;
		}
		else if (MUI.Desktop.desktopFooter){
			dockHotspotHeight = this.el.wrapper.offsetHeight + MUI.Desktop.desktopFooter.offsetHeight;
			if (dockHotspotHeight < 25) dockHotspotHeight = 25;
		}
		if (!MUI.Desktop.desktopFooter && event.client.y > (document.getCoordinates().height - dockHotspotHeight)){
			if (!this.options.visible) this.show();
		}
		else if (MUI.Desktop.desktopFooter && event.client.y > (document.getCoordinates().height - dockHotspotHeight)){
			if (!this.options.visible) this.show();
		}
		else if (this.options.visible) this.hide();
	},

	_renderDockControls: function(){
		// Draw dock controls
		var ctx = $(this.options.id + 'Canvas').getContext('2d');
		ctx.clearRect(0, 0, 100, 100);
		MUI.Canvas.circle(ctx, 5, 4, 3, this.enabledButtonColor, 1.0);

		if (this.el.wrapper.getProperty('position') == 'top') MUI.Canvas.circle(ctx, 5, 14, 3, this.disabledButtonColor, 1.0)
		else if (this.options.autoHide) MUI.Canvas.circle(ctx, 5, 14, 3, this.trueButtonColor, 1.0);
		else MUI.Canvas.circle(ctx, 5, 14, 3, this.enabledButtonColor, 1.0);
	}

});

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
		if (this.isMinimized) return this;
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

		if (MUI.Desktop) MUI.Desktop.setDesktopSize();

		// Have to use timeout because window gets focused when you click on the minimize button
		setTimeout(function(){
			//this.el.windowEl.setStyle('zIndex', 1);
			this.el.windowEl.removeClass('isFocused');
			MUI.dock.makeActiveTab();
		}.bind(this), 100);

		this.fireEvent('minimize', [this]);
		return this;
	},

	_restoreMinimized: function(){
		if (!this.isMinimized) return;

		if (!MUI.Windows.windowsVisible) MUI.Windows.toggleAll();
		this.show(); // show the window
		MUI.Desktop.setDesktopSize();
		if (this.options.scrollbars && !this.el.iframe) this.el.contentWrapper.setStyle('overflow', 'auto'); // Part of Mac FF2 scrollbar fix
		if (this.isCollapsed) this.collapseToggle();

		if (this.el.iframe){  // Show iframe
			if (!Browser.Engine.trident) this.el.iframe.setStyle('visibility', 'visible');
			else this.el.iframe.show();
		}

		this.isMinimized = false;
		this.focus();
		this.fireEvent('restore', [this]);
	}

});