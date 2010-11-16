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

MUI.Accordion = new Class({

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
		var self = this;
		self.setOptions(options);
		var o = self.options;

		// make sure this controls has an ID
		var id = o.id;
		if (!id){
			id = 'accordion' + (++MUI.IDCount);
			o.id = id;
		}

		// create sub items if available
		if (o.drawOnInit && o.panels.length > 0) self.draw();
		else if (self.fromHTML){
			window.addEvent('domready', function(){
				var el = $(id);
				if (el != null) self.fromHTML();
			});
		}

		MUI.set(id, self);
	},

	_getData: function(item, property){
		if (!item || !property) return '';
		if (item[property] == null) return '';
		return item[property];
	},

	draw: function(containerEl){
		var self = this;
		var o = self.options;

		var isNew = false;

		// build primary wrapper div
		var div = $(o.id);
		if (!div){
			div = new Element('div', {'id':o.id});
			isNew = true;
		} else div.empty();
		if (o.cssClass) div.set('class', o.cssClass);
		self.element = div;

		// create main panel container
		self._panelsElement = new Element('div', {'class':'panels'}).inject(div);

		// if no tab selected, then select first tab for them
		if (o.panels.length > 0 && (o.value == null || o.value == '')) o.value = self._getData(o.panels[0], o.valueField);

		// build all panels
		self._togglers = [];
		self._panels = [];
		o.panels.each(function(panel){
			self._buildPanel(panel, self._panelsElement);
		});
		if (self._panels.length > 1){
			self._togglers[0].addClass('first');
			self._togglers[self._panels.length - 1].addClass('last');
		}


		var attachToDOM = function(){
			var instance;
			if (isNew){
				// determine parent container object
				if (!o._container && typeof(o.container) == 'object'){
					o._container = o.container;
					o.container = o.container.get('id');
				}
				if (!o._container && typeof(o.container) == 'string'){
					instance = MUI.get(o.container);
					if (instance && instance.el.content){
						instance.el.content.setStyle('padding', '0');
						o._container = instance.el.content;
					}
					if (!o._container) o._container = $(containerEl ? containerEl : o.container);
				}

				if (o._container){
					if (o.clearContainer) o._container.empty();
					o._container.appendChild(div);
				}
			}

			instance = MUI.get(o.container);
			self._accordion = new Fx.Accordion(self._togglers, self._panels, {
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
					self.accordionResize = function(){
						if(instance && instance.dynamicResize) instance.dynamicResize(); // once more for good measure
					};
					self.accordionTimer = self.accordionResize.periodical(10);
				},
				onComplete: function(){
					self.accordionTimer = clearInterval(self.accordionTimer);
					if(instance.dynamicResize) instance.dynamicResize(); // once more for good measure
				}
			});
		};

		if (!isNew){
			attachToDOM();
			return this;
		}

		window.addEvent('domready', attachToDOM);

		return div;
	},

	_buildPanel: function(panel, div){
		var self = this;
		var o = self.options;

		var value = self._getData(panel, o.valueField);
		if (!value) value = 'apanel' + (++MUI.IDCount);
		var text = self._getData(panel, o.textField);
		var title = self._getData(panel, o.titleField);
		var html = self._getData(panel, o.contentField);

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
