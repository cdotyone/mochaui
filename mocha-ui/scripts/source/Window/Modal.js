/*

Script: Modal.js
	Create modal dialog windows.
	
Copyright:
	Copyright (c) 2007-2008 Greg Houston, <http://greghoustondesign.com/>.	

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
			'id': 'modalOverlay',
			'styles': {
				'height': document.getCoordinates().height
			}
		});
		modalOverlay.inject(document.body);
		
		if (Browser.Engine.trident4){
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

		modalOverlay.setStyle('opacity', .4);
		this.modalOverlayOpenMorph = new Fx.Morph($('modalOverlay'), {
				'duration': 200
				});
		this.modalOverlayCloseMorph = new Fx.Morph($('modalOverlay'), {
			'duration': 200,
			onComplete: function(){
				$('modalOverlay').setStyle('display', 'none');
				if (Browser.Engine.trident4){
					$('modalFix').setStyle('display', 'none');
				}				
			}.bind(this)
		});
	},
	setModalSize: function(){
		$('modalOverlay').setStyle('height', document.getCoordinates().height);
		if (Browser.Engine.trident4){
			$('modalFix').setStyle('height', document.getCoordinates().height);			
		}
	}
});
MochaUI.Modal.implement(new Options, new Events);
