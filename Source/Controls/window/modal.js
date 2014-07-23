/*
 ---

 script: Modal.js

 description: MUI.Modal - Create modal dialog windows.

 copyright: (c) 2014 Contributors in (/AUTHORS.txt).

 license: MIT-style license in (/MIT-LICENSE.txt).

 See Also: <Window>

 requires:
 - MochaUI/MUI
 - MochaUI/MUI.Window

 provides: [MUI.Modal]

 ...
 */

MUI.Modal = new NamedClass('MUI.Modal', {

	Extends: MUI.Window,

	options: {
		type: 'modal'
	},

	initialize: function(options){
		if (!options.type) options.type = 'modal';

		if (!$('mui-modalOverlay')){
			this._modalInitialize();
			window.addEvent('resize', function(){
				this._setModalSize();
			}.bind(this));
		}
		this.parent(options);
	},

	_modalInitialize: function(){
		var modalOverlay = new Element('div', {
			'id': 'mui-modalOverlay',
			'styles': {
				'height': document.getCoordinates().height,
				'opacity': .6
			}
		}).inject(document.body);

		modalOverlay.setStyles({
			'position': 'fixed'
		});

		modalOverlay.addEvent('click', function(){
			var instance = MUI.get(MUI.currentModal.id);
			if (instance && instance.options.modalOverlayClose){

				MUI.currentModal.close();

				(function(){
					var highest_win = MUI.Windows._getWithHighestZIndex();
					if (highest_win && highest_win.hasClass('mui-modal')){
						MUI.currentModal = highest_win;
					}
				}).delay(200);
			}
		});
	
		MUI.Modal.modalOverlayOpenMorph = new Fx.Morph($('mui-modalOverlay'), {
			'duration': 150
		});
		MUI.Modal.modalOverlayCloseMorph = new Fx.Morph($('mui-modalOverlay'), {
			'duration': 150,
			onComplete: function(){
				$('mui-modalOverlay').hide();				
			}.bind(this)
		});
	},

	_setModalSize: function(){
		$('mui-modalOverlay').setStyle('height', document.getCoordinates().height);	
	}

});
