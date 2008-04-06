/*

Script: Modal.js
	Create modal dialog windows.

License:
	MIT-style license.	

Requires:
	Core.js, Window.js
	
See Also:
	<Window>	
	
*/

MochaUI.Modal = new Class({
						  
	Extends: MochaUI.Window,
	
	Implements: [Events, Options],
	
	initialize: function(options){
		this.modalInitialize();
		this.installed = true;
		
		window.addEvent('resize', function(){
			this.setModalSize();
		}.bind(this));

	},
	modalInitialize: function(){
		var modalOverlay = new Element('div', {
			'id': 'mochaModalOverlay',
			'styles': {
				'height': document.getCoordinates().height
			}
		});
		modalOverlay.injectInside(MochaUI.Desktop.desktop ? MochaUI.Desktop.desktop : document.body);
		
		modalOverlay.setStyle('opacity', .4);
		this.modalOverlayOpenMorph = new Fx.Morph($('mochaModalOverlay'), {
				'duration': 200
				});
		this.modalOverlayCloseMorph = new Fx.Morph($('mochaModalOverlay'), {
			'duration': 200,
			onComplete: function(){
				$('mochaModalOverlay').setStyle('display', 'none');
			}.bind(this)
		});
	},
	setModalSize: function(){
		$('mochaModalOverlay').setStyle('height', document.getCoordinates().height);
	}
});
MochaUI.Modal.implement(new Options, new Events);
