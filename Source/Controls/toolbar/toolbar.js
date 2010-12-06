/*
 ---

 name: Toolbar

 script: toolbar.js

 description: MUI - Creates a toolbar control.

 copyright: (c) 2010 Contributors in (/AUTHORS.txt).

 license: MIT-style license in (/MIT-LICENSE.txt).

 note:
 This documentation is taken directly from the JavaScript source files. It is built using Natural Docs.

 requires:
 - Core/Element
 - Core/Class
 - Core/Options
 - Core/Events
 - MUI
 - MUI.Core

 provides: [MUI.Tabs]
 ...
 */

MUI.files['{controls}toolbar/toolbar.js'] = 'loaded';

MUI.Toolbar = new Class({

	Implements: [Events, Options],

	options: {
		id:				'',				// id of the primary element, and id os control that is registered with mocha
		container:		null,			// the parent control in the document to add the control to
		drawOnInit:		true,			// true to add tree to container when control is initialized
		cssClass:		'toolbar',		// the primary css tag

		controls:		[]

		//onTabSelected:null			// event: when a node is checked
	},

	initialize: function(options){
		var self = this;
		self.setOptions(options);
		var o = self.options;

		// make sure this controls has an ID
		var id = o.id;
		if (!id){
			id = 'tabs' + (++MUI.IDCount);
			o.id = id;
		}

		// create sub items if available
		//if (o.drawOnInit && o.controls.length > 0) 
		this.draw();

		MUI.set(id, this);
	},

	draw: function(containerEl){
		var self = this;
		var o = self.options;

		var isNew = false;
		var div;
		var instance=MUI.get($(containerEl ? containerEl : o.container));

		if (instance && instance.isTypeOf('MUI.Panel')){
			instance.el.panelHeaderToolbox.addClass(o.cssClass);
			div = instance.el.panelHeaderToolbox.getElement('div').empty();
		} else if (instance && instance.isTypeOf('MUI.Window')){
			div = $(o.id);
			if (div == null) div = new Element('div', {'id': o.id, 'class': o.cssClass}).inject(instance.el.contentWrapper, 'top');
			div.addClass(o.cssClass);
		} else {
			div = $(o.id);
			if (!div){
				div = new Element('div', {'id': o.id, 'class': o.cssClass});
				isNew = true;
			}
		}

		self.element = div;

		window.addEvent('domready', function(){
			var container = $(containerEl ? containerEl : o.container);
			container.appendChild(div);
			if (o.selectedTab) o.selectedTab._element.fireEvent('click');
		});

		return div;
	}
});

MUI.Toolbar.targets = [];