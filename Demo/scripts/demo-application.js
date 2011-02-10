/* 

 In this file we setup our Windows, Columns and Panels,
 and then initialize MochaUI.

 At the bottom of Core.js you can see how to setup lazy loading for your
 own plugins.

 */

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
var Demo = (Demo || {});

Demo.initializeDesktop = function(){

	MUI.create({
		'control':'MUI.Desktop',
		'id':'desktop',
		'taskbar':true,
		'content':[
			{name:'header',url:'pages/titlebar.html'},
			{name:'nav',control:'MUI.Dock',cssClass:'desktopNav',docked:[
				{name: 'menu', position: 'header', control: 'MUI.Menu',
					items:[
						{text:'File',items:[
							{text:'Open',items:[]},
							{text:'Tests',items:[
								{text:'Window Events',id:'windoweventsLinkCheck', registered:'Demo.eventsWindow' },
								{text:'Iframe Tests',id:'iframetestsLinkCheck', registered:'Demo.iframeTestsWindow' },
								{text:'Form Tests',id:'formtestsLinkCheck', registered:'Demo.formTestsWindow' },
								{text:'No Canvas Body',id:'noCanvasLinkCheck', registered:'Demo.noCanvasWindow' },
								{text:'CSS3 Body',id:'CSS3LinkCheck', registered:'Demo.css3Window' },
								{text:'CSS3 Canvas Fallback',id:'CSS3fallbackLinkCheck', registered:'Demo.css3fallbackWindow' },
								{text:'Force Canvas',id:'forceCanvasLinkCheck', registered:'Demo.forceCanvasWindow' },
								{text:'Close Panel',id:'closePanelCheck',registered:'Demo.closePanelTest' },
								{text:'Close Column',id:'closeColumnCheck',registered:'Demo.closeColumnTest' }
							]},
							{text:'Starters',items:[
								{text:'Virtual Desktop',url:'{demo}demo-virtual-desktop.html'},
								{text:'Fixed Width',url:'{demo}demo-fixed-width.html'},
								{text:'Fixed Width 2',url:'{demo}demo-taskbar-only.html'},
								{text:'No Toolbars',url:'{demo}demo-no-toolbars.html'},
								{text:'No Desktop',url:'{demo}demo-no-desktop.html'},
								{text:'Modal Only',url:'{demo}demo-modal-only.html'}
							]}
						]},
						{text:'View',items:[
							{text:'Cascade Windows',id:'cascadeLink',registered:'MUI.Windows.arrangeCascade'},
							{text:'Tile Windows',id:'tileLink',registered:'MUI.Windows.arrangeTile'},
							{type:'divider'},
							{text:'Minimize All Windows',id:'minimizeLink',registered:'MUI.Windows.minimizeAll'},
							{text:'Close All Windows',id:'closeLink',registered:'MUI.Windows.closeAll'}
						]},
						{text:'Tools',items:[
							{text:'Window Builder',id:'builderLinkCheck',registered:'Demo.builderWindow'},
							{type:'divider'},
							{text:'Options',items:[
								{text:'Standard Effects',id:'minimizeLink',type:'radio',group:'effects',selected:true,registered:'Demo.toggleStandardEffects'},
								{text:'Advanced Effects',id:'closeLink',type:'radio',group:'effects',registered:'Demo.toggleAdvancedEffects'}
							]}
						]},
						{text:'Workspace',items:[
							{text:'Save Workspace',id:'saveWorkspaceLink',registered:'Demo.saveWorkspace'},
							{text:'Load Workspace',id:'loadWorkspaceLink',registered:'Demo.loadWorkspace'}
						]},
						{text:'Help',items:[
							{text:'Features',id:'featuresLinkCheck',url:'{demo}pages/features.html',registered:'Demo.featuresWindow'},
							{type:'divider'},
							{text:'Documentation',id:'loadWorkspaceLink',target:'_blank',url:'http://mochaui.org/doc/'},
							{type:'divider'},
							{text:'About',id:'aboutLink',url:'{demo}pages/about.html',registered:'Demo.aboutWindow'}
						]}
					]
				},
				{control:'MUI.Spinner',divider:false},
				{control:'MUI.ThemeChange',divider:false}
			]},
			{name:'taskbar'},
			{name:'content',columns:[
				{id: 'sideColumn1', placement: 'left', width: 205, resizeLimit: [100, 300],
					panels:[
						{
							id: 'files-panel',
							title: 'Examples',
							content: {
								padding: 8,
								control: 'MUI.Tree',
								container: 'files-panel',
								partner: 'mainPanel',
								content: {url: 'data/file-tree.json', recordsField: false},
								idField: 'value'
							}
						},
						{
							id: 'panel2',
							title: 'Ajax Form',
							height: 230,
							isCollapsed: true,
							content: {
								url: 'pages/ajax.form.html',
								onLoaded: function(){
									$('myForm').addEvent('submit', function(e){
										e.stop();

										MUI.showSpinner();
										if ($('postContent') && MUI.options.standardEffects){
											$('postContent').setStyle('opacity', 0);
										} else {
											$('mainPanel_pad').empty();
										}

										this.set('send', {
											onComplete: function(response){
												MUI.Content.update({
													element: 'mainPanel',
													content: response,
													title: 'Ajax Response',
													padding: {top: 8, right: 8, bottom: 8, left: 8}
												});
											},
											onSuccess: function(){
												if (MUI.options.standardEffects){
													$('postContent').setStyle('opacity', 0).get('morph').start({'opacity': 1});
												}
											}
										});
										this.send();
									});
								}
							}
						}
					]},
				{id: 'mainColumn',	placement: 'main', resizeLimit: [100, 300],
					panels:[
						{
							id: 'mainPanel',
							title: 'Lorem Ipsum',
							content: [
								{url: 'pages/lipsum.html'},
								{
									name: 'search',
									position: 'header',
									url: 'pages/toolbar-search.html',
									onLoaded: function(){
										if ($('demoSearch')){
											$('demoSearch').addEvent('submit', function(e){
												e.stop();
												MUI.showSpinner();
												if ($('postContent') && MUI.options.standardEffects) $('postContent').setStyle('opacity', 0);
												else $('mainPanel_pad').empty();

												var form = $('demoSearch');
												form.set('send', {
													onComplete: function(response){
														MUI.Content.update({
															'element': 'mainPanel',
															'content': response,
															'title': 'Ajax Response',
															'padding': {top: 8, right: 8, bottom: 8, left: 8}
														});
													},
													onSuccess: function(){
														if ($('postContent') && MUI.options.standardEffects)
															$('postContent').setStyle('opacity', 0).get('morph').start({'opacity': 1});
													}
												});
												form.send();
											});
										}
										Demo.addResizeElements.apply(MUI.get('mainPanel'));
									}
								}
							],
							onResize: Demo.updateResizeElements
						},
						{
							id: 'mochaConsole',
							cssClass: 'mochaConsole',
							title: 'Console',
							height: 200,
							content: [
								{url: 'pages/blank.html'},
								{name: 'buttons1', position: 'header', control: 'MUI.Toolbar', buttons: [
									{id: 'button1', type: 'image', text: 'Button 1', title: 'Click to do something 1', image: '{fff}accept.png'},
									{id: 'button2', type: 'image', text: 'Button 2', title: 'Click to do something 2'}
								],
									onClick: function(){
										MUI.notification('Do Something');
										return true;
									}
								},
								{name: 'buttons2', position: 'header', control: 'MUI.Toolbar', buttons: [
									{id: 'button3', type: 'html', text: 'Button 3', title: 'Click to do something 3'},
									{id: 'go', cssClass: 'icon_application_go', title: 'Go'},
									{id: 'get', cssClass: 'icon_application_get'},
									{id: 'home', cssClass: 'icon_application_home', onClick: function(){
										MUI.notification('Do Something Else');
									}
									}
								],
									onClick:function(){
										MUI.notification('Do Something');
										return true;
									}
								}
							]
						}
					]},
				{id: 'sideColumn2',	placement: 'right', width: 220, resizeLimit: [200, 300],
					panels:[
						{
							id: 'help-panel',
							content: [
								{
									position: 'header',
									loadMethod: 'json',
									control: 'MUI.Tabs',
									tabs: [
										{'text': 'Overview', 'url': 'pages/overview.html', 'title': 'Overview'},
										{'text': 'Download', 'url': 'pages/download.html', 'title': 'Download'}
									]
								}
							]
						},
						{
							id: 'panel3',
							title: 'Collapsed Panel',
							isCollapsed: true,
							content: {
								url: 'pages/lipsum.html',
								onLoaded: Demo.addResizeElements
							},
							height: 120,
							onResize: Demo.updateResizeElements,
							onCollapse: function(){
								MUI.Content.update({element: 'panel3', title: 'Collapsed Panel'});
							},
							onExpand: function(){
								MUI.Content.update({element: 'panel3', title: 'Expanded Panel'});
							}
						},
						{
							id: 'tips-panel',
							title: 'Tips',
							height: 140,
							footer:true,
							content: [
								{url: 'pages/tips.html'},
								{name: 'buttons', position: 'footer', control: 'MUI.Toolbar', buttons: [
									{id: 'page0', image:'images/icons/16x16/page_green.gif'},
									{id: 'page1', image:'images/icons/16x16/page_red.gif'},
									{id: 'page2', image:'images/icons/16x16/page.gif'}
								],
									onClick:function(){
										MUI.notification('Do Something');
										return true;
									}
								}
							]
						}
					]}
			]},
			{name:'footer',content:'<div class="copyright">&copy; 2010 <a target="_blank" href="scripts/AUTHORS.txt" id="authorsLink">Various Contributors</a> - <a target="_blank" href="license.html" id="licenseLink">MIT License</a><div>',cssClass:'desktopFooter'}
		],
		'onDrawEnd':function(){
			Parametrics.createwindow();
		}
	});
};

Demo.initialize = function(){

	new MUI.Require({js:['scripts/demo-shared.js'],
		'onload':function(){
			// Initialize MochaUI options
			MUI.initialize({path:{demo:''}});
			MUI.load(['Parametrics','famfamfam','CoolClock']);
			MUI.register('Demo', Demo);
			MUI.register('MUI.Windows', MUI.Windows);
			Demo.initializeDesktop();
		}
	});
};

// Initialize MochaUI when the DOM is ready
window.addEvent('load', Demo.initialize); //using load instead of domready for IE8
