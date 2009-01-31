// Initialize MochaUI when the DOM is ready
window.addEvent('load', function(){ //using load instead of domready for IE8
	MochaUI.Desktop = new MochaUI.Desktop();

	/* Create Columns
	 
	If you are not using panels then these columns are not required.
	If you do use panels, the main column is required. The side columns are optional.
	Create your columns from left to right. Then create your panels from top to bottom,
	left to right. New Panels are inserted at the bottom of their column.

	*/	 
	new MochaUI.Column({
		id: 'sideColumn1',
		placement: 'left',
		width: 190,
		resizeLimit: [100, 220]
	});

	new MochaUI.Column({
		id: 'mainColumn',
		placement: 'main',	
		width: null,
		resizeLimit: [100, 300]
	});

	// Add panels to first side column
	new MochaUI.Panel({
		id: 'files-panel',
		title: 'File View',
		loadMethod: 'xhr',
		contentURL: 'pages/file-view.html',
		column: 'sideColumn1',
		onContentLoaded: function(){
			if ( !MochaUI.treeScript == true ){
				new Request({
					url: 'plugins/tree/scripts/tree.js',
					method: 'get',
					onSuccess: function() {
						buildTree('tree1');
						MochaUI.treeScript = true;
					}.bind(this)
				}).send();
			}
		},
		header: false
	});

	// Add panels to main column	
	new MochaUI.Panel({
		id: 'mainPanel',
		title: 'Zero7 - Crosses',
		loadMethod: 'iframe',
		contentURL: 'pages/youtube4.html',
		column: 'mainColumn',
		panelBackground: '#fff',
		padding: { top: 0, right: 0, bottom: 0, left: 0 },
		collapsible: false,
		header: false	
	});
	
	MochaUI.Desktop.desktop.setStyles({
		'background': '#fff',
		'visibility': 'visible'
	});
	
	// Deactivate menu header links
	$$('a.returnFalse').each(function(el){
		el.addEvent('click', function(e){
			new Event(e).stop();
		});
	});	

});

// This runs when a person leaves your page.
window.addEvent('unload', function(){
	if (MochaUI && Browser.Engine.trident != true) {
		MochaUI.garbageCleanUp();
	}	
});