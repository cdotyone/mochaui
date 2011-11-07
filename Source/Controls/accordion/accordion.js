/*
 ---

 name: Accordion

 script: accordion.js

 description: MUI.Accordion - Creates a generic accordion control.

 copyright: (c) 2011 Contributors in (/AUTHORS.txt).

 license: MIT-style license in (/MIT-LICENSE.txt).

 note:
 This documentation is taken directly from the javascript source files. It is built using Natural Docs.

 requires:
 - Core/Element
 - Core/Class
 - Core/Options
 - Core/Events
 - MUI
 - MUI.Core

 provides: [MUI.Accordion]

 ...
 */

MUI.Accordion = new NamedClass('MUI.Accordian', {

	Implements: [Events, Options],

	options: {
		id:					'',			// id of the primary element, and id os control that is registered with mocha
		container:			null,		// the parent control in the document to add the control to
		clearContainer:		true,		// should the control clear its parent container before it appends itself
		drawOnInit:			true,		// true to add accordion to container when control is initialized
		cssClass:			'mui-accordion',// the primary css tag

		panels:				[],			// the list of accordion panels

		textField:			'text',		// the name of the field that has the panels toggler text
		valueField:			'value',	// the name of the field that has the panels toggler values
		titleField:			'title',	// the name of the field that has the panels tip text
		contentField:		'html',		// the field that contains the name of the field that has the content for the panel

		value:				'',			// the currently selected panel's value
		selectedPanel:		null,		// the currently selected panel
		height:				false,		// If set, displayed elements will have a fixed height equal to the specified value.
		width:				false,		// If set, displayed elements will have a fixed width equal to the specified value.
		insertTitle:		true,		// If set, the title will be inserted into the panel html

		heightFx:			true,		// If set to true, a height transition effect will take place when switching between displayed e7lements.
		widthFx:			false,		// If set to true, it will add a width transition to the accordion when switching between displayed elements. Warning: CSS mastery is required to make this work!
		opacity:			false,		// If set to true, an opacity transition effect will take place when switching between displayed elements.
		alwaysHide:			false,		// If set to true, it will be possible to close all displayable elements. Otherwise, one will remain open at all time.
		initialDisplayFx:	true		// If set to false, the initial item displayed will not display with an effect but will just be shown immediately.

		//onPanelSelected:    null        // event: when a panel is opened
	},

	initialize: function(options){
		this.setOptions(options);
		this.el = {};

		// If accordion has no ID, give it one.
		this.id = this.options.id = this.options.id || 'accordion' + (++MUI.idCount);
		MUI.set(this.id, this);

		if (options.content){
			options.content.loadMethod = MUI.getDefaultJsonProvider(options.content.loadMethod);
			options.content.onLoaded = (function(element, options){
				this.options.panels = MUI.Content.getRecords(options);
				this.draw();
			}).bind(this);
			MUI.Content.update(options.content);
			return;
		}

		// create sub items if available
		if (this.options.drawOnInit && this.options.panels.length > 0) self.draw();
		else if (self.fromHTML){
			window.addEvent('domready', function(){
				var el = $(id);
				if (el != null) self.fromHTML(self.content);
			});
		}
	},

	draw: function(container){
		var o = this.options;
		if (!container) container = o.container;

		// determine element for this control
		var isNew = false;
		var div = o.element ? o.element : $(o.id);
		if (!div){
			div = new Element('div', {'id': o.id});
			isNew = true;
		}
		if (o.cssClass) div.set('class', o.cssClass);

		this.el.element = div.store('instance', this);		// assign instance to element

		// create main panel container
		this._panelsElement = new Element('div', {'class':'mui-panels'}).inject(div);

		// if no tab selected, then select first tab for them
		if (o.panels.length > 0 && (o.value == null || o.value == '')) o.value = MUI.getData(o.panels[0], o.valueField);

		// build all panels
		this._togglers = [];
		this._panels = [];
		for (var i = 0; i < o.panels.length; i++){
			this._buildPanel(o.panels[i], this._panelsElement, i);
		}
		if (this._panels.length > 1){
			this._togglers[0].addClass('first');
			this._togglers[this._panels.length - 1].addClass('last');
		}

		// add to container
		var addToContainer = function(){
			if (typeOf(container) == 'string') container = $(container);
			if (o.clearContainer) container.empty();
			if (!container) container = div.getParent();
			if (div.getParent() == null) div.inject(container);

			container.setStyle('overflow', 'hidden');
			container.setStyle('padding', 0);
			var parentHeight = this._getParentHeight(container);

			var instance = MUI.get(o.container);
			if (instance != null) instance.addEvent('resize', this._onParentResize.bind(this));

			this._accordion = new Fx.Accordion(this._togglers, this._panels, {
				'height':o.heightFx
				,'width':o.widthFx
				,'display':this._index
				,'opacity':o.opacity
				,'fixedHeight':o._height
				,'fixedWidth':o.width
				,'alwaysHide':o.alwaysHide
				,'initialDisplayFx':o.initialDisplayFx
				,onActive: (function(toggler, element){
					this.options.value = toggler.get('id');
					this._index = parseInt(toggler.get('index'));
					this._getParentHeight(container); // forces recalc of _height
					element.fullHeight = this.options._height;
					toggler.addClass('open');
					element.setStyle('overflow', 'auto');
				}).bind(this),
				onBackground: function(toggler, element){
					toggler.removeClass('open');
					element.setStyle('overflow', 'hidden');
				},
				onStart: function(){
					var instance = MUI.get(o.container);
					this.accordionResize = function(){
						if (instance && instance.dynamicResize) instance.dynamicResize(); // once more for good measure
					};
					this.accordionTimer = this.accordionResize.periodical(10);
				},
				onComplete: function(){
					var instance = MUI.get(o.container);
					this.accordionTimer = clearInterval(this.accordionTimer);
					if (instance && instance.dynamicResize) instance.dynamicResize(); // once more for good measure
				}
			});
		}.bind(this);
		if (!isNew || typeOf(container) == 'element') addToContainer();
		else window.addEvent('domready', addToContainer);

		return this;
	},

	_onParentResize:function(){
		var o = this.options;
		var div = o.element ? o.element : $(o.id);
		if (!div) return;
		var h = this._getParentHeight(div.getParent());
		this._panelsElement.setStyle('height', h + 'px');
		this._accordion.previous = -1;
		this._accordion.display(this._index);
	},

	_getParentHeight: function(e){
		var o = this.options;
		var h = this._getElementHeight(e);
		if (e.hasClass('pad')) h = this._getElementHeight(e.getParent());

		if (!o.height){
			o._height = h;
			this._togglers.each(function(toggler){
				o._height -= toggler.getSize().y
			});
		} else o._height = o.height;
		this._panelsElement.setStyle('height', h + 'px');

		return h;
	},

	_getElementHeight:function(e){
		var h = e.getSize().y;
		h -= parseInt(e.getStyle('border-bottom-width'));
		h -= parseInt(e.getStyle('border-top-width'));
		h -= parseInt(e.getStyle('padding-bottom'));
		h -= parseInt(e.getStyle('padding-top'));
		return h;
	},

	_buildPanel: function(panel, div, idx){
		var self = this;
		var o = self.options;

		var value = MUI.getData(panel, o.valueField);
		if (!value) value = 'apanel' + (++MUI.idCount);
		var text = MUI.getData(panel, o.textField);
		var title = MUI.getData(panel, o.titleField);
		var html = MUI.getData(panel, o.contentField);

		if (o.value == value || (!o.value && idx == 0)) this._index = idx;

		panel._togglerEl = new Element('h3', {'id':value,'class':'toggler','text':text,'title':title, 'index':idx}).inject(div);
		panel._element = new Element('div', {'id':value + '_panel','class':'element', 'index':idx}).inject(div);
		panel._contentEl = new Element('div', {'class':'content'}).inject(panel._element);

		if (o.insertTitle){
			new Element('h3', {'html':title}).inject(panel._contentEl);
			new Element('div', {'html':html}).inject(panel._contentEl);
		} else panel._contentEl.set('html', html);

		self._togglers.push(panel._togglerEl);
		self._panels.push(panel._element);
	},

	fromHTML: function(el){
		var self = this;
		var o = self.options;
		if (!el) el = $(o.id);
		else el = $(el);
		if (!el) return;

		o.cssClass = el.get('class');

		var panels = [];
		var togglerEls = el.getElements('h3.toggler');
		var panelEls = el.getElements('div.element');

		for (var i = 0; i < togglerEls.length; i++){
			var togglerEl = togglerEls[i];
			if (i >= panelEls.length) break;

			var toggler = {};

			var value = togglerEl.get('id');
			var text = togglerEl.get('text');
			if (!value) value = text;
			if (togglerEl.hasClass('open')) o.value = value;

			var title = togglerEl.get('title');
			if (title) toggler[o.titleField] = title;

			toggler[o.valueField] = value;
			toggler[o.textField] = text;
			toggler[o.contentField] = panelEls[i].get('html');
			panels.push(toggler);
		}

		o.panels = panels;
		self.draw();
	}

});
