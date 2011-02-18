/*
 ---

 name: Taskbar

 script: Taskbar.js

 description: MUI.Taskbar - Implements the taskbar. Enables window minimize.

 copyright: (c) 2011 Contributors in (/AUTHORS.txt).

 license: MIT-style license in (/MIT-LICENSE.txt).

 requires:
 - MochaUI/MUI
 - MochaUI/MUI.Desktop

 provides: [MUI.Taskbar]

 ...
 */

MUI.Taskbar = (MUI.Taskbar || new NamedClass('MUI.Taskbar', {}));
MUI.Taskbar.implement({

	Implements: [Events, Options],

	options: {
		id:				'taskbar',
		container:		null,
		drawOnInit:		true,

		useControls:	true,			// Toggles autohide and taskbar placement controls.
		position:		'bottom',		// Position the taskbar starts in, top or bottom.
		visible:		true,			// is the taskbar visible
		autoHide:		 false,			// True when taskbar autohide is set to on, false if set to off
		menuCheck:		'taskbarCheck',	// the name of the element in the menu that needs to be checked if taskbar is shown
		cssClass:		'taskbar'

		//onDrawBegin:	null,
		//onDrawEnd:	null,
		//onMove:		null,
		//onTabCreated:	null,
		//onTabSet:		null,
		//onHide:		null,
		//onShow:		null
	},

	initialize: function(options){
		this.setOptions(options);
		this.el = {};
		this._tabs = [];

		// If taskbar has no ID, give it one.
		this.id = this.options.id = this.options.id || 'taskbar' + (++MUI.idCount);
		MUI.set(this.id, this);
		if (options.desktop) this.desktop = options.desktop;

		if (this.options.drawOnInit) this.draw();
	},

	draw: function(){
		var o = this.options;
		this.fireEvent('drawBegin', [this]);

		if (this.desktop) this.desktopFooter = this.desktop.el.footer;

		var isNew = false;
		var div = o.element ? o.element : $(o.id + 'Wrapper');
		if (!div){
			div = new Element('div', {'id': o.id + 'Wrapper'}).inject(o.container);
			isNew = true;
		}
		div.set('class', o.cssClass + 'Wrapper');
		div.empty();
		this.el.wrapper = this.el.element = div.store('instance', this);

		var defaultBottom = this.desktopFooter ? this.desktopFooter.offsetHeight : 0;
		this.el.wrapper.setStyles({
			'display':	'block',
			'position':	'absolute',
			'top':		null,
			'bottom':	defaultBottom,
			'left':		0,
			'class':	o.cssClass + 'Wrapper'
		});

		this.el.taskbar = new Element('div', {'id': this.options.id,'class':o.cssClass}).inject(this.el.wrapper);

		if (this.options.useControls){
			this.el.placement = new Element('div', {'id': this.options.id + 'Placement','class':o.cssClass + 'Placement'}).inject(this.el.taskbar).setStyle('cursor', 'default');
			this.el.autohide = new Element('div', {'id': this.options.id + 'AutoHide','class':o.cssClass + 'AutoHide'}).inject(this.el.taskbar).setStyle('cursor', 'default');
		}

		this.el.sort = new Element('div', {'id': this.options.id + 'Sort'}).inject(this.el.taskbar);
		this.el.clear = new Element('div', {'id': this.options.id + 'Clear', 'class': 'clear'}).inject(this.el.sort);

		this._initialize();
		this.fireEvent('drawEnd', [this]);
	},

	setTaskbarColors: function(){
		var enabled = Asset.getCSSRule('.taskbarButtonEnabled');
		if (enabled && enabled.style.backgroundColor)
			this.enabledButtonColor = new Color(enabled.style.backgroundColor);

		var disabled = Asset.getCSSRule('.taskbarButtonDisabled');
		if (disabled && disabled.style.backgroundColor)
			this.disabledButtonColor = new Color(disabled.style.backgroundColor);

		var color = Asset.getCSSRule('.taskbarButtonTrue');
		if (color && color.style.backgroundColor)
			this.trueButtonColor = new Color(color.style.backgroundColor);

		this._renderTaskControls();
	},

	getHeight: function(){
		return this.el.wrapper.offsetHeight;
	},

	move: function(position){
		var ctx = this.el.canvas.getContext('2d');
		// Move taskbar to top position
		if (position == 'top' || this.el.wrapper.getStyle('position') != 'relative'){
			if (position == 'top') return;

			this.el.wrapper.setStyles({
				'position':	'relative',
				'bottom':	null
			}).addClass('top');
			if (this.desktop) this.desktop.setDesktopSize();
			this.el.wrapper.setProperty('position', 'top');
			ctx.clearRect(0, 0, 100, 100);
			MUI.Canvas.circle(ctx, 5, 4, 3, this.enabledButtonColor, 1.0);
			MUI.Canvas.circle(ctx, 5, 14, 3, this.disabledButtonColor, 1.0);
			$(this.options.id + 'Placement').setProperty('title', 'Position Taskbar Bottom');
			$(this.options.id + 'AutoHide').setProperty('title', 'Auto Hide Disabled in Top Taskbar Position');
			this.options.autoHide = false;
			this.options.position = 'top';
		} else {
			if (position == 'bottom') return;

			// Move taskbar to bottom position
			this.el.wrapper.setStyles({
				'position':	'absolute',
				'bottom':	this.desktopFooter ? this.desktopFooter.offsetHeight : 0
			}).removeClass('top');
			if (this.desktop) this.desktop.setDesktopSize();
			this.el.wrapper.setProperty('position', 'bottom');
			ctx.clearRect(0, 0, 100, 100);
			MUI.Canvas.circle(ctx, 5, 4, 3, this.enabledButtonColor, 1.0);
			MUI.Canvas.circle(ctx, 5, 14, 3, this.enabledButtonColor, 1.0);
			$(this.options.id + 'Placement').setProperty('title', 'Position Taskbar Top');
			$(this.options.id + 'AutoHide').setProperty('title', 'Turn Auto Hide On');
			this.options.position = 'bottom';
		}

		this.fireEvent('move', [this, this.options.position]);
	},

	createTab: function(instance){
		this._tabs.push(instance);
		if (!this._intialized) return;

		var taskbarTab = new Element('div', {
			'id': instance.options.id + '_taskbarTab',
			'class': 'taskbarTab',
			'title': titleText
		}).inject($(this.options.id + 'Clear'), 'before');

		instance._taskBar = this; 
		taskbarTab.addEvent('mousedown', function(e){
			new Event(e).stop();
			this.timeDown = Date.now();
		}.bind(instance));

		taskbarTab.addEvent('mouseup', function(){
			this.timeUp = Date.now();
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

		this.sortables.addItems(taskbarTab);

		var titleText = instance.el.title.innerHTML;

		new Element('div', {
			'id': instance.options.id + '_taskbarTabText',
			'class': this.options.cssClass + 'Text'
		}).set('html', titleText.substring(0, 19) + (titleText.length > 19 ? '...' : '')).inject($(taskbarTab));

		// Need to resize everything in case the taskbar wraps when a new tab is added
		if (this.desktop) this.desktop.setDesktopSize();
		this.fireEvent('tabCreated', [this, instance]);
	},

	makeTabActive: function(instance){
		var css = this.options.cssClass;

		if (!instance){
			// getWindowWithHighestZindex is used in case the currently focused window is closed.
			var windowEl = MUI.Windows._getWithHighestZIndex();
			instance = windowEl.retrieve('instance');
		}

		$$('.' + css + 'Tab').removeClass('activeTab');
		if (instance.isMinimized != true){
			instance.el.windowEl.addClass('isFocused');
			var currentButton = $(instance.options.id + '_taskbarTab');
			if (currentButton != null) currentButton.addClass('activeTab');
		} else instance.el.windowEl.removeClass('isFocused');
		this.fireEvent('tabSet', [this,instance]);
	},

	removeTab: function(instance) {
		if (instance.options.type == 'window'){
			var currentButton = $(instance.options.id + '_taskbarTab');
			if (currentButton) this.sortables.removeItems(currentButton).destroy();
			this._tabs.erase(instance);

			// Need to resize everything in case the taskbar becomes smaller when a tab is removed
			MUI.desktop.setDesktopSize();
		}
	},

	show: function(){
		this.el.wrapper.setStyle('display', 'block');
		this.options.visible = true;
		if (this.desktop) this.desktop.setDesktopSize();
		this.fireEvent('show', [this]);
	},

	hide: function(){
		this.el.wrapper.setStyle('display', 'none');
		this.options.visible = false;
		if (this.desktop) this.desktop.setDesktopSize();
		this.fireEvent('hide', [this]);
	},

	toggle: function(){
		if (!this.options.visible) this.show();
		else this.hide();
	},

	_initialize: function(){
		var css = this.options.cssClass;

		if (this.options.useControls){
			// Insert canvas
			this.el.canvas = new Element('canvas', {
				'id':	 this.options.id + 'Canvas',
				'width':  '15',
				'height': '18',
				'class' : css + 'Canvas'
			}).inject(this.el.taskbar);

			// Dynamically initialize canvas using excanvas. This is only required by IE
			if (Browser.ie && MUI.ieSupport == 'excanvas'){
				G_vmlCanvasManager.initElement(this.el.canvas);
			}
		}

		// Position top or bottom selector
		this.el.placement.setProperty('title', 'Position Taskbar Top');

		// Attach event
		this.el.placement.addEvent('click', function(){
			this.move();
		}.bind(this));

		// Auto Hide toggle switch
		this.el.autohide.setProperty('title', 'Turn Auto Hide On');

		// Attach event Auto Hide
		this.el.autohide.addEvent('click', function(){
			this._doAutoHide();
		}.bind(this));

		this.setTaskbarColors.delay(100,this);

		if (this.options.position == 'top') this.move();

		// Add check mark to menu if link exists in menu
		if ($(this.options.menuCheck)) this.sidebarCheck = new Element('div', {
			'class': 'check',
			'id': this.options.id + '_check'
		}).inject($(this.options.menuCheck));

		this.sortables = new Sortables('.' + css + 'Sort', {
			opacity: 1,
			constrain: true,
			clone: false,
			revert: false
		});

		if (this.options.autoHide) this._doAutoHide(true);
		if (this.desktopFooter) this.desktop.setDesktopSize();
		this._intialized = true;

		var tabs=this._tabs;
		this._tabs=[];
		tabs.each(function(tab){
			this.createTab(tab);
		},this);
	},

	_doAutoHide: function(notoggle){
		if (this.el.wrapper.getProperty('position') == 'top')
			return false;

		var ctx = this.el.canvas.getContext('2d');
		if (!notoggle) this.options.autoHide = !this.options.autoHide;	// Toggle

		if (this.options.autoHide){
			$(this.options.id + 'AutoHide').setProperty('title', 'Turn Auto Hide Off');
			MUI.Canvas.circle(ctx, 5, 14, 3, this.trueButtonColor, 1.0);
			document.addEvent('mousemove', this._autoHideEvent.bind(this));
		} else {
			$(this.options.id + 'AutoHide').setProperty('title', 'Turn Auto Hide On');
			MUI.Canvas.circle(ctx, 5, 14, 3, this.enabledButtonColor, 1.0);
			document.removeEvent('mousemove', this._autoHideEvent.bind(this));
		}
	},

	_autoHideEvent: function(event){
		if (!this.options.autoHide) return;
		var hotspotHeight;
		if (!this.desktopFooter){
			hotspotHeight = this.el.wrapper.offsetHeight;
			if (hotspotHeight < 25) hotspotHeight = 25;
		}
		else if (this.desktopFooter){
			hotspotHeight = this.el.wrapper.offsetHeight + this.desktopFooter.offsetHeight;
			if (hotspotHeight < 25) hotspotHeight = 25;
		}
		if (!this.desktopFooter && event.client.y > (document.getCoordinates().height - hotspotHeight)){
			if (!this.options.visible) this.show();
		}
		else if (this.desktopFooter && event.client.y > (document.getCoordinates().height - hotspotHeight)){
			if (!this.options.visible) this.show();
		}
		else if (this.options.visible) this.hide();
	},

	_renderTaskControls: function(){
		// Draw taskbar controls
		var ctx = this.el.canvas.getContext('2d');
		ctx.clearRect(0, 0, 100, 100);
		MUI.Canvas.circle(ctx, 5, 4, 3, this.enabledButtonColor, 1.0);

		if (this.el.wrapper.getProperty('position') == 'top') MUI.Canvas.circle(ctx, 5, 14, 3, this.disabledButtonColor, 1.0);
		else if (this.options.autoHide) MUI.Canvas.circle(ctx, 5, 14, 3, this.trueButtonColor, 1.0);
		else MUI.Canvas.circle(ctx, 5, 14, 3, this.enabledButtonColor, 1.0);
	}

});

MUI.Windows = Object.append((MUI.Windows || {}), {

	minimizeAll: function(){
		$$('.mocha').each(function(windowEl){
			var instance = windowEl.retrieve('instance');
			if (!instance.isMinimized && instance.options.minimizable){
				instance.minimize();
			}
		}.bind(this));
	}

});

MUI.Window = (MUI.Window || new NamedClass('MUI.Window', {}));
MUI.Window.implement({

	minimize: function(){
		if (this.isMinimized) return this;
		this.isMinimized = true;

		// Hide iframe
		// Iframe should be hidden when minimizing, maximizing, and moving for performance and Flash issues
		if (this.el.iframe){
			// Some elements are still visible in IE8 in the iframe when the iframe's visibility is set to hidden.
			if (!Browser.ie) this.el.iframe.setStyle('visibility', 'hidden');
			else this.el.iframe.hide();
		}

		this.hide(); // Hide window and add to taskbar

		// Fixes a scrollbar issue in Mac FF2
		if (Browser.Platform.mac && Browser.firefox && Browser.version < 3){
			this.el.contentWrapper.setStyle('overflow', 'hidden');
		}

		if (this.desktop) this.desktop.setDesktopSize();

		// Have to use timeout because window gets focused when you click on the minimize button
		setTimeout(function(){
			//this.el.windowEl.setStyle('zIndex', 1);
			this.el.windowEl.removeClass('isFocused');
			MUI.desktop.taskbar.makeTabActive();
		}.bind(this), 100);

		this.fireEvent('minimize', [this]);
		return this;
	},

	_restoreMinimized: function(){
		if (!this.isMinimized) return;

		if (!MUI.Windows.windowsVisible) MUI.Windows.toggleAll();
		this.show(); // show the window
		MUI.desktop.setDesktopSize();
		if (this.options.scrollbars && !this.el.iframe) this.el.contentWrapper.setStyle('overflow', 'auto'); // Part of Mac FF2 scrollbar fix
		if (this.isCollapsed) this.collapseToggle();

		if (this.el.iframe){  // Show iframe
			if (!Browser.ie) this.el.iframe.setStyle('visibility', 'visible');
			else this.el.iframe.show();
		}

		this.isMinimized = false;
		this.focus();
		this.fireEvent('restore', [this]);
	}

});