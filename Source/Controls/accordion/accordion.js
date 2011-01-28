/*
 ---

 name: Accordion

 script: accordion.js

 description: MUI - Creates a generic accordion control.

 copyright: (c) 2010 Contributors in (/AUTHORS.txt).

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

MUI.files['{controls}accordion/accordion.js'] = 'loaded';

MUI.Accordion = new NamedClass('MUI.Accordian', {

	Implements: [Events, Options],

	options: {
		id:					'',			// id of the primary element, and id os control that is registered with mocha
		container:			null,		// the parent control in the document to add the control to
		clearContainer:		true,		// should the control clear its parent container before it appends itself
		drawOnInit:			true,		// true to add accordion to container when control is initialized
		cssClass:			'accordion',// the primary css tag

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

		// If accordion has no ID, give it one.
		this.id = this.options.id = this.options.id || 'accordion' + (++MUI.idCount);
		MUI.set(this.id, this);

		// create sub items if available
		if (this.options.drawOnInit && this.options.panels.length > 0) self.draw();
		else if (self.fromHTML){
			window.addEvent('domready', function(){
				var el = $(id);
				if (el != null) self.fromHTML();
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
		this._panelsElement = new Element('div', {'class':'panels'}).inject(div);

		// if no tab selected, then select first tab for them
		if (o.panels.length > 0 && (o.value == null || o.value == '')) o.value = MUI.getData(o.panels[0], o.valueField);

		// build all panels
		this._togglers = [];
		this._panels = [];
		o.panels.each(function(panel){
			this._buildPanel(panel, this._panelsElement);
		});
		if (this._panels.length > 1){
			this._togglers[0].addClass('first');
			this._togglers[this._panels.length - 1].addClass('last');
		}

		// add to container
		var addToContainer = function(){
			if (typeOf(container) == 'string') container = $(container);
			if (div.getParent() == null) div.inject(container);

			this._accordion = new Fx.Accordion(this._togglers, this._panels, {
				'height':o.heightFx
				,'width':o.widthFx
				,'opacity':o.opacity
				,'fixedHeight':o.height
				,'fixedWidth':o.width
				,'alwaysHide':o.alwaysHide
				,'initialDisplayFx':o.initialDisplayFx
				,onActive: function(toggler){
					toggler.addClass('open');
				},
				onBackground: function(toggler){
					toggler.removeClass('open');
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
					if (instance.dynamicResize) instance.dynamicResize(); // once more for good measure
				}
			});
		}.bind(this);
		if (!isNew || typeOf(container) == 'element') addToContainer();
		else window.addEvent('domready', addToContainer);

		return this;
	},

	_buildPanel: function(panel, div){
		var self = this;
		var o = self.options;

		var value = MUI.getData(panel, o.valueField);
		if (!value) value = 'apanel' + (++MUI.idCount);
		var text = MUI.getData(panel, o.textField);
		var title = MUI.getData(panel, o.titleField);
		var html = MUI.getData(panel, o.contentField);

		panel._togglerEl = new Element('h3', {'id':value,'class':'toggler','text':text,'title':title}).inject(div);
		panel._element = new Element('div', {'id':value + '_panel','class':'element'}).inject(div);
		panel._contentEl = new Element('div', {'class':'content'}).inject(panel._element);

		if (o.insertTitle){
			new Element('h3', {'html':title}).inject(panel._contentEl);
			new Element('div', {'html':html}).inject(panel._contentEl);
		} else panel._contentEl.set('html', html);

		self._togglers.push(panel._togglerEl);
		self._panels.push(panel._element);
	}

});
