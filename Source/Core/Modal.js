/*
---

name: Modal

script: Modal.js

description: Create modal dialog windows.

copyright: (c) 2007-2009 Greg Houston, <http://greghoustondesign.com/>.	

license: MIT-style license.	

See Also: <Window>

requires:
  - MochaUI/MUI
  - MochaUI/MUI.Windows

provides: [MUI.Modal]

...
*/

MUI.files[MUI.path.source + 'Modal.js'] = 'loaded';

MUI.Modal = new Class({

	Extends: MUI.Window,
	
	options: {
		type: 'modal'
	},	
	
	initialize: function(options){
		
		if (!$('modalOverlay')){
			this.modalInitialize();
		
			window.addEvent('resize', function(){
				this.setModalSize();
			}.bind(this));
		}		
		this.parent(options);

	},
	modalInitialize: function(){
		var modalOverlay = new Element('div', {
			'id': 'modalOverlay',
			'styles': {
				'height': document.getCoordinates().height,				
				'opacity': .6
			}
		}).inject(document.body);
		
		modalOverlay.setStyles({
				'position': Browser.ie4 ? 'absolute' : 'fixed'
		});
		
		modalOverlay.addEvent('click', function(){
			var instance = MUI.Windows.instances[MUI.currentModal.id];
			if (instance.options.modalOverlayClose) {
				MUI.closeWindow(MUI.currentModal);
			}
		});
		
		if (Browser.ie4){
			var modalFix = new Element('iframe', {
				'id': 'modalFix',
				'scrolling': 'no',
				'marginWidth': 0,
				'marginHeight': 0,
				'src': '',
				'styles': {
					'height': document.getCoordinates().height
				}
			}).inject(document.body);
		}

		MUI.Modal.modalOverlayOpenMorph = new Fx.Morph($('modalOverlay'), {
			'duration': 150
		});
		MUI.Modal.modalOverlayCloseMorph = new Fx.Morph($('modalOverlay'), {
			'duration': 150,
			onComplete: function(){
				$('modalOverlay').hide();
				if (Browser.ie4){
					$('modalFix').hide();
				}
			}.bind(this)
		});
	},
	setModalSize: function(){
		$('modalOverlay').setStyle('height', document.getCoordinates().height);
		if (Browser.ie4){
			$('modalFix').setStyle('height', document.getCoordinates().height);
		}
	}

});
