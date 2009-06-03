/* 

	In this file we setup our Windows, Columns and Panels,
	and then inititialize MochaUI.
	
	At the bottom of Core.js you can setup lazy loading for your
	own plugins.

*/

/*
  
INITIALIZE WINDOWS

	1. Define windows
	
		var myWindow = function(){ 
			new MUI.Window({
				id: 'mywindow',
				title: 'My Window',
				contentURL: 'pages/lipsum.html',
				width: 340,
				height: 150
			});
		}

	2. Build windows on onDomReady
	
		myWindow();
	
	3. Add link events to build future windows
	
		if ($('myWindowLink')){
			$('myWindowLink').addEvent('click', function(e) {
				new Event(e).stop();
				jsonWindows();
			});
		}

		Note: If your link is in the top menu, it opens only a single window, and you would
		like a check mark next to it when it's window is open, format the link name as follows:

		window.id + LinkCheck, e.g., mywindowLinkCheck

		Otherwise it is suggested you just use mywindowLink

	Associated HTML for link event above:

		<a id="myWindowLink" href="pages/lipsum.html">My Window</a>	


	Notes:
		If you need to add link events to links within windows you are creating, do
		it in the onContentLoaded function of the new window. 
 
-------------------------------------------------------------------- */

initializeWindows = function(){

	// Examples
	
	MUI.htmlWindow = function(){
		new MUI.Window({
			id: 'htmlpage',
			content: 'Hello World',
			width: 340,
			height: 150
		});
	}	
	
	MUI.ajaxpageWindow = function(){
		new MUI.Window({
			id: 'ajaxpage',
			contentURL: 'pages/lipsum.html',
			width: 340,
			height: 150
		});
	}	
	if ($('ajaxpageLinkCheck')){ 
		$('ajaxpageLinkCheck').addEvent('click', function(e){
			new Event(e).stop();
			MUI.ajaxpageWindow();
		});
	}	
	
	MUI.jsonWindows = function(){
		var request = new Request.JSON({
			url: 'data/json-windows-data.js',
			onComplete: function(properties) {
				MUI.newWindowsFromJSON(properties.windows);
			}
		}).send();
	}	
	if ($('jsonLink')){
		$('jsonLink').addEvent('click', function(e) {
			new Event(e).stop();
			MUI.jsonWindows();
		});
	}

	MUI.youtubeWindow = function(){
		new MUI.Window({
			id: 'youtube',
			title: 'YouTube in Iframe',
			loadMethod: 'iframe',
			contentURL: 'pages/youtube.html',
			width: 340,
			height: 280,
			resizeLimit: {'x': [330, 2500], 'y': [250, 2000]},
			toolbar: true,
			toolbarURL: 'pages/youtube-tabs.html',
			toolbarOnload: function(){
				MUI.initializeTabs('youtubeTabs');	

				$('youtube1Link').addEvent('click', function(e){
					MUI.updateContent({
						'element':  $('youtube'),
						'url':      'pages/youtube.html'
					});
				});
	
				$('youtube2Link').addEvent('click', function(e){
					MUI.updateContent({
						'element':  $('youtube'),
						'url':      'pages/youtube2.html'
					});
				});
	
				$('youtube3Link').addEvent('click', function(e){
					MUI.updateContent({
						'element':  $('youtube'),	
						'url':      'pages/youtube3.html'
					});
				});	
			}
		});
	}
	if ($('youtubeLinkCheck')) {
		$('youtubeLinkCheck').addEvent('click', function(e){
		new Event(e).stop();
			MUI.youtubeWindow();
		});
	}
	
	MUI.clockWindow = function(){
		new MUI.Window({
			id: 'clock',
			title: 'Canvas Clock',
			addClass: 'transparent',
			contentURL: MUI.path.plugins + 'coolclock/index.html',
			shape: 'gauge',
			headerHeight: 30,
			width: 160,
			height: 160,
			x: 570,
			y: 140,
			padding: { top: 0, right: 0, bottom: 0, left: 0 },
			require: {			
				js: [MUI.path.plugins + 'coolclock/scripts/coolclock.js'],
				onload: function(){
					if (CoolClock) new CoolClock();
				}	
			}				
		});	
	}
	if ($('clockLinkCheck')){
		$('clockLinkCheck').addEvent('click', function(e){	
			new Event(e).stop();
			MUI.clockWindow();
		});
	}	
	
	MUI.parametricsWindow = function(){	
		new MUI.Window({
			id: 'parametrics',
			title: 'Window Parametrics',			
			contentURL: MUI.path.plugins + 'parametrics/index.html',
			width: 305,
			height: 110,
			x: 570,
			y: 160,
			padding: { top: 12, right: 12, bottom: 10, left: 12 },
			resizable: false,
			maximizable: false,
			require: {
				css: [MUI.path.plugins + 'parametrics/css/style.css'],
				js: [MUI.path.plugins + 'parametrics/scripts/parametrics.js'],
				onload: function(){	
					if (MUI.addRadiusSlider) MUI.addRadiusSlider();
					if (MUI.addShadowSlider) MUI.addShadowSlider();
				}		
			}				
		});
	}
	if ($('parametricsLinkCheck')){
		$('parametricsLinkCheck').addEvent('click', function(e){	
			new Event(e).stop();
			MUI.parametricsWindow();
		});
	}
	
	MUI.splitWindow = function(){
		new MUI.Window({
			id: 'splitWindow',
			title: 'Split Window',
			width: 600,
			height: 350,
			resizeLimit: {'x': [450, 2500], 'y': [300, 2000]},
			scrollbars: false, // Could make this automatic if a 'panel' method were created
			onContentLoaded: function(){	
		
				new MUI.Column({
					container: 'splitWindow_contentWrapper',
					id: 'splitWindow_sideColumn',
					placement: 'left',
					width: 170,
					resizeLimit: [100, 300]
				});
			
				new MUI.Column({
					container: 'splitWindow_contentWrapper',
					id: 'splitWindow_mainColumn',
					placement: 'main',
					width: null,
					resizeLimit: [100, 300]
				});
			
				new MUI.Panel({
					header: false,
					id: 'splitWindow_panel1',					
					contentURL: 'license.html',
					column: 'splitWindow_mainColumn',
					panelBackground: '#fff'
				});
			
				new MUI.Panel({
					header: false,
					id: 'splitWindow_panel2',
					addClass: 'panelAlt',					
					contentURL: 'pages/lipsum.html',
					column: 'splitWindow_sideColumn'					
				});

			}			
		});
	}
	if ($('splitWindowLinkCheck')) {
		$('splitWindowLinkCheck').addEvent('click', function(e){
		new Event(e).stop();
			MUI.splitWindow();
		});
	}
	
	MUI.fxmorpherWindow = function(){
		new MUI.Window({
			id: 'fxmorpherExample',
			title: 'Path Animation Example',			
			contentURL: MUI.path.plugins + 'Fx.Morpher/example.html',
			width: 330,
			height: 330,
			padding: { top: 0, right: 0, bottom: 0, left: 0 },
			scrollbars: false,
			resizable: false,
			require: {
				css: [MUI.path.plugins + 'Fx.Morpher/css/style.css'],
				js: [MUI.path.plugins + 'Fx.Morpher/scripts/cbox.js', MUI.path.plugins + 'Fx.Morpher/scripts/example.js'],
				onload: function(){
					createCanvas();
					myAnim.delay(250);					
				} 	
			}			
		});	
	}			

	// Examples > Tests
	
	MUI.serverRepsonseWindow = function(response){
		new MUI.Window({
			id: 'serverResponse',
			content: response,
			width: 350,
			height: 350
		});
	}		
	
	MUI.eventsWindow = function(){
		new MUI.Window({
			id: 'windowevents',
			title: 'Window Events',			
			contentURL: 'pages/events.html',
			width: 340,
			height: 250,			
			onContentLoaded: function(windowEl){
				MUI.notification('Window content was loaded.');
			},
			onCloseComplete: function(){
				MUI.notification('The window is closed.');
			},
			onMinimize: function(windowEl){
				MUI.notification('Window was minimized.');
			},
			onMaximize: function(windowEl){
				MUI.notification('Window was maximized.');
			},
			onRestore: function(windowEl){
				MUI.notification('Window was restored.');
			},
			onResize: function(windowEl){
				MUI.notification('Window was resized.');
			},
			onFocus: function(windowEl){
				MUI.notification('Window was focused.');
			},
			onBlur: function(windowEl){
				MUI.notification('Window lost focus.');
			}
		});
	}	
	if ($('windoweventsLinkCheck')){
		$('windoweventsLinkCheck').addEvent('click', function(e){
			new Event(e).stop();
			MUI.eventsWindow();
		});
	}
	
	MUI.containertestWindow = function(){ 
		new MUI.Window({
			id: 'containertest',
			title: 'Container Test',
			contentURL: 'pages/lipsum.html',
			container: 'pageWrapper',
			width: 340,
			height: 150,
			x: 100,
			y: 100
		});
	}
	if ($('containertestLinkCheck')) { 
		$('containertestLinkCheck').addEvent('click', function(e){
			new Event(e).stop();
			MUI.containertestWindow();
		});
	}
	
	MUI.iframetestsWindow = function() {
		new MUI.Window({
			id: 'iframetests',
			title: 'Iframe Tests',
			loadMethod: 'iframe',
			contentURL: 'pages/iframetests.html'
		});
	}
	if ($('iframetestsLinkCheck')) {
		$('iframetestsLinkCheck').addEvent('click', function(e){
		new Event(e).stop();
			MUI.iframetestsWindow();
		});
	}
	
	MUI.formtestsWindow = function() {
		new MUI.Window({
			id: 'formtests',
			title: 'Form Tests',			
			contentURL: 'pages/formtests.html',
			onContentLoaded: function(){
				document.testForm.focusTest.focus();
			}			
		});
	}
	if ($('formtestsLinkCheck')) {
		$('formtestsLinkCheck').addEvent('click', function(e){
		new Event(e).stop();
			MUI.formtestsWindow();
		});
	}	

	MUI.accordiantestWindow = function() {
		var id = 'accordiantest';
		new MUI.Window({
			id: id,
			title: 'Accordian',			
			contentURL: 'pages/accordian-demo.html',
			width: 300,
			height: 200,
			scrollbars: false,
			resizable: false,
			maximizable: false,				
			padding: { top: 0, right: 0, bottom: 0, left: 0 },
			require: {
				css: [MUI.path.plugins + 'accordian/css/style.css'],
				onload: function(){
					this.windowEl = $(id);				
					new Accordion('#' + id + ' h3.accordianToggler', "#" + id + ' div.accordianElement',{
						opacity: false,
						alwaysHide: true,
						onActive: function(toggler, element){
							toggler.addClass('open');
						},
						onBackground: function(toggler, element){
							toggler.removeClass('open');
						},							
						onStart: function(toggler, element){
							this.windowEl.accordianResize = function(){
								MUI.dynamicResize($(id));
							}
							this.windowEl.accordianTimer = this.windowEl.accordianResize.periodical(10);
						}.bind(this),
						onComplete: function(){
							this.windowEl.accordianTimer = $clear(this.windowEl.accordianTimer);
							MUI.dynamicResize($(id)) // once more for good measure
						}.bind(this)
					}, $(id));
				}	
			}					
		});
	}	
	if ($('accordiantestLinkCheck')) { 
		$('accordiantestLinkCheck').addEvent('click', function(e){	
			new Event(e).stop();
			MUI.accordiantestWindow();
		});
	}

	MUI.noCanvasWindow = function() {
		new MUI.Window({
			id: 'nocanvas',
			title: 'No Canvas',			
			contentURL: 'pages/lipsum.html',
			addClass: 'no-canvas',
			width: 305,
			height: 175,
			shadowBlur: 0,
			resizeLimit: {'x': [275, 2500], 'y': [125, 2000]},
			useCanvas: false
		});
	}
	if ($('noCanvasLinkCheck')) {
		$('noCanvasLinkCheck').addEvent('click', function(e){	
			new Event(e).stop();
			MUI.noCanvasWindow();
		});
	}	

	// View
	if ($('sidebarLinkCheck')) {
		$('sidebarLinkCheck').addEvent('click', function(e){
			new Event(e).stop();
			MUI.Desktop.sidebarToggle();
		});
	}

	if ($('cascadeLink')) {
		$('cascadeLink').addEvent('click', function(e){
			new Event(e).stop();
			MUI.arrangeCascade();
		});
	}

	if ($('tileLink')) {
		$('tileLink').addEvent('click', function(e){
			new Event(e).stop();
			MUI.arrangeTile();
		});
	}

	if ($('closeLink')) {
		$('closeLink').addEvent('click', function(e){
			new Event(e).stop();
			MUI.closeAll();
		});
	}

	if ($('minimizeLink')) {
		$('minimizeLink').addEvent('click', function(e){
			new Event(e).stop();
			MUI.minimizeAll();
		});
	}	

	// Tools
	MUI.builderWindow = function() {	
		new MUI.Window({
			id: 'builder',
			title: 'Window Builder',
			icon: 'images/icons/16x16/page.gif',			
			contentURL: MUI.path.plugins + 'windowform/',
			width: 375,
			height: 420,
			maximizable: false,
			resizable: false,
			scrollbars: false,
			require: {
				css: [MUI.path.plugins + 'windowform/css/style.css'],			
				js: [MUI.path.plugins + 'windowform/scripts/Window-from-form.js'],
				onload: function(){
					$('newWindowSubmit').addEvent('click', function(e){
						new Event(e).stop();
						new MUI.WindowForm();
					});
				}	
			}			
		});
	}
	if ($('builderLinkCheck')) {
		$('builderLinkCheck').addEvent('click', function(e) {
			new Event(e).stop();
			MUI.builderWindow();
		});
	}
	
	if ($('toggleStandardEffectsLinkCheck')) {
		$('toggleStandardEffectsLinkCheck').addEvent('click', function(e){
			new Event(e).stop();
			MUI.toggleStandardEffects($('toggleStandardEffectsLinkCheck'));			
		});
		if (MUI.options.standardEffects == true) {
			MUI.toggleStandardEffectsLink = new Element('div', {
				'class': 'check',
				'id': 'toggleStandardEffects_check'
			}).inject($('toggleStandardEffectsLinkCheck'));
		}
	}	
	
	if ($('toggleAdvancedEffectsLinkCheck')) {
		$('toggleAdvancedEffectsLinkCheck').addEvent('click', function(e){
			new Event(e).stop();
			MUI.toggleAdvancedEffects($('toggleAdvancedEffectsLinkCheck'));			
		});
		if (MUI.options.advancedEffects == true) {
			MUI.toggleAdvancedEffectsLink = new Element('div', {
				'class': 'check',
				'id': 'toggleAdvancedEffects_check'
			}).inject($('toggleAdvancedEffectsLinkCheck'));
		}
	}	
		
	// Workspaces
	
	if ($('saveWorkspaceLink')) {
		$('saveWorkspaceLink').addEvent('click', function(e) {
			new Event(e).stop();
			MUI.saveWorkspace();
		});
	}

	if ($('loadWorkspaceLink')) {
		$('loadWorkspaceLink').addEvent('click', function(e) {
			new Event(e).stop();
			MUI.loadWorkspace();
		});
	}
	
	// Help	
	MUI.featuresWindow = function() {
		new MUI.Window({
			id: 'features',
			title: 'Features',			
			contentURL: 'pages/features-layout.html',
			width: 275,
			height: 250,
			resizeLimit: {'x': [275, 2500], 'y': [125, 2000]},
			require: {
				css: [MUI.themePath() + 'css/Tabs.css']
			},			
			toolbar: true,
			toolbarURL: 'pages/features-tabs.html',
			toolbarOnload: function(){
				MUI.initializeTabs('featuresTabs');

				$('featuresLayoutLink').addEvent('click', function(e){
					MUI.updateContent({
						'element':  $('features'),
						'url':       'pages/features-layout.html'
					});
				});

				$('featuresWindowsLink').addEvent('click', function(e){
					MUI.updateContent({
						'element':  $('features'),
						'url':       'pages/features-windows.html'
					});
				});

				$('featuresGeneralLink').addEvent('click', function(e){
					MUI.updateContent({
						'element':  $('features'),
						'url':       'pages/features-general.html'
					});
				});
			}
		});
	}
	if ($('featuresLinkCheck')) {
		$('featuresLinkCheck').addEvent('click', function(e){
			new Event(e).stop();
			MUI.featuresWindow();
		});
	}

	MUI.aboutWindow = function() {
		new MUI.Modal({
			id: 'about',
			title: 'MUI',			
			contentURL: 'pages/about.html',
			type: 'modal2',
			width: 350,
			height: 195,
			padding: { top: 43, right: 12, bottom: 10, left: 12 },
			scrollbars: false
		});
	}
	if ($('aboutLink')) {
		$('aboutLink').addEvent('click', function(e){
			new Event(e).stop();
			MUI.aboutWindow();
		});
	}
	
	// Misc
	MUI.licenseWindow = function() {
		new MUI.Window({
			id: 'License',
			title: 'License',						
			contentURL: 'license.html',
			width: 375,
			height: 340
		});
	}	
	if ($('licenseLink')){ 
		$('licenseLink').addEvent('click', function(e) {
			new Event(e).stop();
			MUI.licenseWindow();
		});
	}	

	// Deactivate menu header links
	$$('a.returnFalse').each(function(el) {
		el.addEvent('click', function(e) {
			new Event(e).stop();
		});
	});
	
	// Build windows onLoad
	MUI.parametricsWindow();

	MUI.myChain.callChain();
	
}

/*
  
INITIALIZE COLUMNS AND PANELS  

	Creating a Column and Panel Layout:
	 
	 - If you are not using panels then these columns are not required.
	 - If you do use panels, the main column is required. The side columns are optional.
	 
	 Columns
	 - Create your columns from left to right.
	 - One column should not have it's width set. This column will have a fluid width.
	 
	 Panels
	 - After creating Columns, create your panels from top to bottom, left to right.
	 - One panel in each column should not have it's height set. This panel will have a fluid height.	 
	 - New Panels are inserted at the bottom of their column. 
 
-------------------------------------------------------------------- */


initializeColumns = function() {

	new MUI.Column({
		id: 'sideColumn1',
		placement: 'left',
		width: 200,
		resizeLimit: [100, 300]
	});
	
	new MUI.Column({
		id: 'mainColumn',
		placement: 'main',
		resizeLimit: [100, 300]
	});
	
	new MUI.Column({
		id: 'sideColumn2',
		placement: 'right',
		width: 220,
		resizeLimit: [200, 300]
	});
	
	// Add panels to first side column
	new MUI.Panel({
		id: 'files-panel',
		title: 'Examples',		
		contentURL: 'pages/file-view.html',
		column: 'sideColumn1',
		require: {
			css: [MUI.path.plugins + 'tree/css/style.css'],			
			js: [MUI.path.plugins + 'tree/scripts/tree.js'],
			onload: function(){
				if (buildTree) buildTree('tree1');
			}	
		},
		onContentLoaded: function(){		
			$('notesLink').addEvent('click', function(e){
				MUI.updateContent({
					element: $('mainPanel'),					
					url: 'pages/notes.html',
					title: 'Development Notes',
					padding: { top: 8, right: 8, bottom: 8, left: 8 }
				});
			});
			$('xhrLink').addEvent('click', function(e){
				MUI.updateContent({
					element: $('mainPanel'),
					url: 'pages/lipsum.html',
					title: 'Lorem Ipsum',
					padding: { top: 8, right: 8, bottom: 8, left: 8 }
				});
			});
			$('youtube4Link').addEvent('click', function(e){
				MUI.updateContent({
					element: $('mainPanel'),
					loadMethod: 'iframe',
					url: 'pages/youtube.html',
					title: 'Iframe: YouTube',
					padding: { top: 0, right: 0, bottom: 0, left: 0 }
				});
			});	
			$('splitPanelLink').addEvent('click', function(e){
				MUI.updateContent({
					element: $('mainPanel'),
					title: 'Split Panel',
					padding: { top: 0, right: 0, bottom: 0, left: 0 }
				});
				MUI.splitPanelPanel(); // This is initialized in mocha-init.js just like the windows.	
			});	
			$('splitWindowLink').addEvent('click', function(e){
				MUI.splitWindow();
			});		
			$('ajaxpageLink').addEvent('click', function(e){
				MUI.ajaxpageWindow();
			});	
			$('jsonLink').addEvent('click', function(e){
				MUI.jsonWindows();
			});	
			$('youtubeLink').addEvent('click', function(e){
				MUI.youtubeWindow();
			});	
			$('accordiantestLink').addEvent('click', function(e){
				MUI.accordiantestWindow();
			});	
			$('clockLink').addEvent('click', function(e){
				MUI.clockWindow();
			});
			$('parametricsLink').addEvent('click', function(e){
				MUI.parametricsWindow();
			});
			$('calendarLink').addEvent('click', function(e){
				MUI.updateContent({
					element: $('mainPanel'),
					url: MUI.path.plugins + 'calendar/example.html',
					title: 'Calendar Component',
					padding: { top: 8, right: 8, bottom: 8, left: 8 },
					require: {
						css: [MUI.path.plugins + 'calendar/css/calendar.css'],			
						js: [MUI.path.plugins + 'calendar/scripts/calendar.js'],
						onload: function(){
							myCal1 = new Calendar({ date1: 'd/m/Y' }, { direction: 1, tweak: { x: 6, y: 0 }});;
						}	
					}										
				});
			});			
			$('fxmorpherLink').addEvent('click', function(e){
				MUI.updateContent({
					element: $('mainPanel'),
					url: MUI.path.plugins + 'Fx.Morpher/',
					title: 'Fx.Morpher Path Animation',
					padding: { top: 8, right: 8, bottom: 8, left: 8 }
				});
				MUI.fxmorpherWindow();
			});			
		}
	});
	
	new MUI.Panel({
		id: 'panel2',
		title: 'Ajax Form',
		contentURL: 'pages/ajax.form.html',
		column: 'sideColumn1',
		height: 230,
		onContentLoaded: function(){
			$('myForm').addEvent('submit', function(e){
				e.stop();

				$('spinner').show();
				if ($('postContent') && MUI.options.standardEffects == true) {
					$('postContent').setStyle('opacity', 0);	
				}
				else {
					$('mainPanel_pad').empty();
				}
	
				this.set('send', {
					onComplete: function(response) { 
	 						MUI.updateContent({
							'element': $('mainPanel'),
							'content': response,
							'title': 'Ajax Response',
							'padding': { top: 8, right: 8, bottom: 8, left: 8 }
						});			
					},
					onSuccess: function(){
						if (MUI.options.standardEffects == true) {
							$('postContent').setStyle('opacity', 0).get('morph').start({'opacity': 1});
						}
					}
				});
				this.send();
			});		
		}
	});
	
	// Add panels to main column	
	new MUI.Panel({
		id: 'mainPanel',
		title: 'Lorem Ipsum',
		contentURL: 'pages/lipsum.html',
		column: 'mainColumn',
		headerToolbox: true,
		headerToolboxURL: 'pages/toolbox-demo2.html',
		headerToolboxOnload: function(){
			if ($('demoSearch')) {
				$('demoSearch').addEvent('submit', function(e){
					e.stop();
					$('spinner').setStyle('visibility', 'visible');
					if ($('postContent') && MUI.options.standardEffects == true) {
						$('postContent').setStyle('opacity', 0);
					}
					else {
						$('mainPanel_pad').empty();
					}
					this.set('send', {
						onComplete: function(response){
							MUI.updateContent({
								'element': $('mainPanel'),
								'content': response,
								'title': 'Ajax Response',
								'padding': {
									top: 8,
									right: 8,
									bottom: 8,
									left: 8
								}
							});
						},
						onSuccess: function(){
							if ($('postContent') && MUI.options.standardEffects == true) {								
								$('postContent').setStyle('opacity', 0).get('morph').start({'opacity': 1});
							}
						}
					});
					this.send();
				});
			}
		}		
	});
	
	new MUI.Panel({
		id: 'mochaConsole',
		addClass: 'mochaConsole',
		title: 'Console',
		contentURL: 'pages/lipsum.html',
		column: 'mainColumn',
		height: 200,	
		headerToolbox: true,
		headerToolboxURL: 'pages/console.toolbox.html',
		headerToolboxOnload: function(){
			$$('.demoAction').each(function(element){
				element.removeEvents();
				element.addEvent('click', function(e){
					MUI.notification('Do Something');
				});
			});
		}
	});
	
	// Add panels to second side column
	
	new MUI.Panel({
		id: 'help-panel',
		contentURL: 'pages/overview.html',
		column: 'sideColumn2',
		tabsURL: 'pages/panel-tabs.html',
		require: {
			css: [MUI.themePath() + 'css/Tabs.css']
		}		
	});

	new MUI.Panel({
		id: 'panel3',
		title: 'Panel',
		contentURL: 'pages/lipsum.html',
		column: 'sideColumn2',
		height: 120
	});	
	
	new MUI.Panel({
		id: 'tips-panel',
		title: 'Tips',
		contentURL: 'pages/tips.html',
		column: 'sideColumn2',
		height: 140,
		footer: true
	});
	
	MUI.splitPanelPanel = function() {
		if ($('mainPanel')) {			
			new MUI.Column({
				container: 'mainPanel',
				id: 'sideColumn3',
				placement: 'left',
				width: 200,
				resizeLimit: [100, 300]
			});
			
			new MUI.Column({
				container: 'mainPanel',
				id: 'mainColumn2',
				placement: 'main',
				width: null,
				resizeLimit: [100, 300]
			});
			
			new MUI.Panel({
				header: false,
				id: 'splitPanel_mainPanel',
				contentURL: 'license.html',
				column: 'mainColumn2'
			});
			
			new MUI.Panel({
				header: false,
				id: 'splitPanel_sidePanel',
				addClass: 'panelAlt',
				contentURL: 'pages/lipsum.html',
				column: 'sideColumn3'
			});
		}
	}
	
	MUI.myChain.callChain();
	
}

// Initialize MochaUI when the DOM is ready
window.addEvent('load', function(){ //using load instead of domready for IE8

	MUI.myChain = new Chain();
	MUI.myChain.chain(
		function(){MUI.Desktop.initialize();},
		function(){MUI.Dock.initialize();},
		function(){initializeColumns();},		
		function(){initializeWindows();}		
	).callChain();	

});
