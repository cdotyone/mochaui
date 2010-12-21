/*
 ---

 name: ToolbarDock

 script: toolbardock.js

 description: MUI - Creates a toolbar dock control.

 copyright: (c) 2010 Contributors in (/AUTHORS.txt).

 license: MIT-style license in (/MIT-LICENSE.txt).

 requires:
 - Core/Element
 - Core/Class
 - Core/Options
 - Core/Events
 - MUI
 - MUI.Core

 provides: [MUI.ToolbarDock]
 ...
 */

MUI.files['{controls}toolbar/toolbardock.js'] = 'loaded';

MUI.ToolbarDock = new Class({

	Implements: [Events, Options],

	options: {
		id:				'',				// id of the primary element, and id os control that is registered with mocha
		container:		null,			// the parent control in the document to add the control to
		drawOnInit:		true,			// true to add tree to container when control is initialized
		cssClass:		'toolbar',		// the primary css tag
		orientation:	'left',			// toolbars are listed from left to right or right to left

		docked:			[]				// items that are docked currently
	},
	
	initialize: function(options){
		var self = this;
		self.setOptions(options);
		var o = self.options;
		self.el={};

		// make sure this controls has an ID
		var id = o.id;
		if (!id){
			id = 'toolbarDock' + (++MUI.IDCount);
			o.id = id;
		}

		this.draw();

		MUI.set(id, this);
	},

	draw: function(containerEl){
		var self = this;
		var o = self.options;

		var isNew = false;
		var div;

		div = $(o.id);
		if (!div){
			div = new Element('div', {'id': o.id, 'class': o.cssClass});
			isNew = true;
		}

		self.el.element = div;
		div.store('instance',this);

		if(!isNew) return;
		if(o._container) o._container.appendChild(div);
		else window.addEvent('domready', function(){
			if(!o._container) o._container = $(containerEl ? containerEl : o.container);
			o._container.appendChild(div);
		});

		return div;
	}
});

