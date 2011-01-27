/* 

 In this file we setup our Windows, Columns and Panels,
 and then initialize MochaUI.

 At the bottom of Core.js you can see how to setup lazy loading for your
 own plugins.

 */

/*
 Creating Demo namespace, this is not required.
 Doing this to keep demo stuff separated.
 */
var Demo = (Demo || {});

// Examples
Object.append(Demo, {

	htmlWindow: function(){
		new MUI.Window({
			id: 'htmlpage',
			content: 'Hello World',
			width: 340,
			height: 150
		});
	},

	ajaxpageWindow: function(){
		new MUI.Window({
			id: 'ajaxpage',
			content: {url: 'pages/lipsum.html'},
			width: 340,
			height: 150
		});
	},

	jsonWindows: function(){
		new Request.JSON({
			url: 'data/json-windows-data.js',
			onComplete: function(properties){
				MUI.Windows.newFromJSON(properties.windows);
			}
		}).send();
	},

	youtubeWindow: function(){
		new MUI.Window({
			id: 'youtube',
			title: 'YouTube in Iframe',
			width: 340,
			height: 280,
			resizeLimit: {'x': [330, 2500], 'y': [250, 2000]},
			content: [
				{
					url: 'pages/youtube.html',
					loadMethod: 'iframe'
				},
				{
					position: 'top',
					loadMethod: 'json',
					id: 'youtube_toolbar',
					css: 'mochaToolbar',
					content: [
						{'text': 'Zero 7', 'url': 'pages/youtube.html', 'loadMethod': 'iframe', 'title': 'Zero 7', 'class': 'first'},
						{'text': 'Fleet Foxes', 'url': 'pages/youtube2.html', 'loadMethod': 'iframe', 'title': 'Fleet Foxes'},
						{'text': 'Boards of Canada', 'url': 'pages/youtube3.html', 'loadMethod': 'iframe', 'title': 'Boards of Canada', 'class': 'last'}
					],
					onLoaded: function(element, content){
						MUI.create({
							control: 'MUI.Tabs',
							id: 'youtube_toolbar',
							container: 'youtube',
							position: 'top',
							tabs: content.content,
							partner: 'youtube'
						});
					}
				}
			]
		});
	},

	clockWindow: function(){
		new MUI.Window({
			id: 'clock',
			title: 'Canvas Clock',
			cssClass: 'transparent',
			content: {
				url: '{plugins}coolclock/demo.html',
				require: {
					js: ['{plugins}coolclock/scripts/coolclock.js'],
					onload: function(){
						if (CoolClock) new CoolClock();
					}
				}},
			shape: 'gauge',
			headerHeight: 30,
			width: 160,
			height: 160,
			x: 570,
			y: 140,
			padding: 0
		});
	},

	writeConsole: function(message){
		var d = new Date().format('%H:%M:%S: ');
		new Element('div', {text: d + message}).inject('mochaConsole', 'top');
	},

	listBuilder: function(container){
		MUI.create({
			control: 'MUI.List',
			id: container + 'list1',
			container: container,
			clearContainer: true,
			content: {url: 'data/person.json', paging: {size: 10, totalCount: 200, recordsField: false}},
			columns: [
				{text: 'First Name', name: 'FirstName', 'value': 'ID'},
				{text: 'Last Name', name: 'LastName'}
			],
			commands: [
				{'text': 'Ok', 'name': 'Ok', 'image': '{theme}images/accept.png'},
				{'text': 'Cancel', 'name': 'Cancel', 'image': '{theme}images/cancel.png'}
			],
			onItemCommand: function(item, self, cmd){
				Demo.writeConsole(self.options.id + ' received ' + cmd.name + ' command on item ' + item.value)
			},
			onItemChecked: function(item, self){
				Demo.writeConsole(self.options.id + ' received onItemChecked command on item ' + item.value)
			},
			onItemSelected: function(item, self){
				Demo.writeConsole(self.options.id + ' received onItemSelected command on item ' + item.value)
			}
		});
	},

	checkBoxGrid: function(container){
		MUI.create({
			control: 'MUI.CheckBoxGrid',
			id: container + 'cbg1',
			container: container,
			clearContainer: true,
			content: {url: 'data/person.json', paging: {size: 10, totalCount:200, recordsField: false}},
			width: 260,
			height: 100,
			textField: 'FirstName',
			valueField: 'ID',
			value: '1,3,4',
			onItemClick: function(checked, inp, self){
				Demo.writeConsole(self.options.id + ' received onItemClick command on item ' + inp.value);
			},
			onValueChanged: function(value, self){
				Demo.writeConsole(self.options.id + ' received onValueChanged command, value = ' + self.options.value);
			}
		});
		MUI.create({
			control: 'MUI.CheckBoxGrid',
			id: container + 'cbg2',
			container: container,
			clearContainer: false,
			content: {url: 'data/person.json', paging: {size: 10, totalCount: 200, recordsField: false}},
			width: 260,
			height: 100,
			textField: 'FirstName',
			valueField: 'ID',
			value: '1',
			type: 'radio',
			onItemClick: function(checked, inp, self){
				Demo.writeConsole(self.options.id + ' received onItemClick command on item ' + inp.value);
			},
			onValueChanged: function(value, self){
				Demo.writeConsole(self.options.id + ' received onValueChanged command, value = ' + self.options.value);
			}
		});
	},

	selectListBuilder: function(container){
		MUI.create({
			control: 'MUI.SelectList',
			id: container + 'sl1',
			container: container,
			clearContainer: true,
			content: {url: 'data/employees.json', paging: {size: 10, totalCount: 200, recordsField: false}},
			width: 250,
			height: 100,
			textField: 'name',
			valueField: 'ID',
			canSelect: true,
			onItemSelected: function(item, selected, self){
				Demo.writeConsole(self.options.id + ' received onItemSelected command on item \'' + item.name + '\', selected=' + selected)
			}
		});
	},

	imageButtonBuilder: function(container){
		MUI.get(container).el.content.empty();
		if ($('mainPanel_search_buttonHolder')) $('mainPanel_search_buttonHolder').empty();
		MUI.create({
			control: 'MUI.ImageButton',
			cssClass: 'imgButton',
			text: 'Accept',
			title: 'Accept Order',
			image: '{theme}images/accept.png',
			id: container + 'btnAccept',
			container: container,
			onClick: function(self){
				Demo.writeConsole(self.options.id + ' clicked');
			}
		});
		MUI.create({
			control: 'MUI.ImageButton',
			cssClass: 'imgButton',
			text: 'Cancel',
			title: 'Cancel Order',
			image: '{theme}images/cancel.png',
			id: container + 'btnCancel',
			container: container,
			onClick: function(self){
				Demo.writeConsole(self.options.id + ' clicked');
			}
		});
	},

	textAreaBuilder: function(container){
		MUI.get(container).el.content.empty();
		MUI.create({control: 'MUI.TextArea', container: container, rows: 5, id:container + 'textarea1'});
		MUI.create({control: 'MUI.TextArea', container: container, id: container + 'textarea2', hasDynamicSize: true});
	},

	textBoxBuilder: function(container){
		var content = MUI.get(container).el.content;
		content.empty();

		var ftypes = ['fixed.phone', 'fixed.phone-us', 'fixed.cpf', 'fixed.cnpj', 'fixed.date', 'fixed.date-us', 'fixed.cep', 'fixed.time', 'fixed.cc'];
		Object.append(ftypes, ['reverse.integer', 'reverse.decimal', 'reverse.decimal-us', 'reverse.reais', 'reverse.dollar', 'regexp.ip', 'regexp.email', 'password']);

		var mtype;
		ftypes.each(function(t){
			var s = t.split('.');
			var ttype = s[0].capitalize();
			if (mtype != ttype){
				mtype = ttype;
				window.addEvent('domready', function(){
					new Element('div', {'text': ttype, 'id': container + ttype}).inject(content);
				});
			}
			if (s.length < 2) s[1] = ttype;
			MUI.create({control: 'MUI.TextBox', container: container + ttype, id: container + t, formTitle: s[1].capitalize(), maskType: t, autoTab: true});
		});
	},

	treeBuilder: function(container){
		MUI.create({
			control: 'MUI.Tree',
			container: container,
			id: container + 'tree1',
			content: {url: 'data/tree-testdata.json'},
			onNodeExpanded: function(node, isExpanded, self){
				Demo.writeConsole(self.options.id + ' receieved onNodeExpanded command on node ' + node.value + ', isExpanded=' + isExpanded)
			},
			onNodeChecked: function(node, checked, self){
				Demo.writeConsole(self.options.id + ' receieved onNodeChecked command on node ' + node.value + ', checked=' + checked);
			},
			onNodeSelected: function(node, self){
				Demo.writeConsole(self.options.id + ' receieved onNodeSelected command on node ' + node.value)
			}
		});
	},

	parametricsWindow: function(){
		new MUI.Window({
			id: 'parametrics',
			title: 'Window Parametrics',
			content: {
				url: '{plugins}parametrics/demo.html',
				require: {
					js: ['{plugins}parametrics/parametrics.js'] //,
					// onload: function(){} // either use onload here or Window/onLoaded further down
				}
			},
			width: 305,
			height: 210,
			x: 570,
			y: 160,
			padding: {top: 12, right: 12, bottom: 10, left: 12},
			resizable: false,
			minimizable: true,
			maximizable: false,
			onDragStart: function(instance){
				if (!Browser.ie) instance.el.windowEl.setStyle('opacity', 0.5);
				// VML doesn't render opacity nicely on the shadow
			},
			onDragComplete: function(instance){
				if (!Browser.ie) instance.el.windowEl.setStyle('opacity', 1);
			},
			onLoaded: function(){
				if (MUI.addRadiusSlider) MUI.addRadiusSlider();
				if (MUI.addShadowSlider) MUI.addShadowSlider();
				if (MUI.addOffsetXSlider) MUI.addOffsetXSlider();
				if (MUI.addOffsetYSlider) MUI.addOffsetYSlider();
			}
		});
	},

	splitWindow: function(){
		new MUI.Window({
			id: 'splitWindow',
			title: 'Split Window',
			width: 600,
			height: 350,
			resizeLimit: {'x': [450, 2500], 'y': [300, 2000]},
			scrollbars: false, // Could make this automatic if a 'panel' method were created
			content: '',
			onLoaded: function(){

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
					content: {url: 'license.html'},
					column: 'splitWindow_mainColumn',
					panelBackground: '#fff'
				});

				new MUI.Panel({
					header: false,
					id: 'splitWindow_panel2',
					cssClass: 'panelAlt',
					content: {url: 'pages/lipsum.html'},
					column: 'splitWindow_sideColumn'
				});

			}
		});
	},

	fxmorpherWindow: function(){
		new MUI.Window({
			id: 'fxmorpherExample',
			title: 'Path Animation Example',
			content: {
				url: '{plugins}Fx.Morpher/demo.html',
				require: {
					js: ['{plugins}Fx.Morpher/scripts/cbox.js', '{plugins}Fx.Morpher/scripts/demo.js'],
					onload: function(){
						createCanvas();
						myAnim.delay(250);
					}
				}
			},
			width: 330,
			height: 330,
			padding: {top: 0, right: 0, bottom: 0, left: 0},
			scrollbars: false,
			resizable: false
		});
	},

	// Examples > Tests
	serverResponseWindow: function(response){
		new MUI.Window({
			id: 'serverResponse',
			content: response,
			width: 350,
			height: 350
		});
	},

	eventsWindow: function(){
		new MUI.Window({
			id: 'windowevents',
			title: 'Window Events',
			content: {url: 'pages/events.html'},
			width: 340,
			height: 255,
			onLoaded: function(){
				Demo.writeConsole('Window content was loaded.');
			},
			onCloseComplete: function(){
				Demo.writeConsole('The window is closed.');
			},
			onMinimize: function(){
				Demo.writeConsole('Window was minimized.');
			},
			onMaximize: function(){
				Demo.writeConsole('Window was maximized.');
			},
			onRestore: function(){
				Demo.writeConsole('Window was restored.');
			},
			onResize: function(){
				Demo.writeConsole('Window was resized.');
			},
			onFocus: function(){
				Demo.writeConsole('Window was focused.');
			},
			onBlur: function(){
				Demo.writeConsole('Window lost focus.');
			},
			onDragStart: function(){
				Demo.writeConsole('Window is being dragged.');
			},
			onDragComplete: function(){
				Demo.writeConsole('Window drag complete.');
			}
		});
	},

	containerTestWindow: function(){
		new MUI.Window({
			id: 'containertest',
			title: 'Container Test',
			content: {url: 'pages/lipsum.html'},
			container: 'desktopContent',
			width: 340,
			height: 150,
			x: 100,
			y: 100
		});
	},

	iframeTestsWindow: function(){
		new MUI.Window({
			id: 'iframetests',
			title: 'Iframe Tests',
			content: {
				url: 'pages/iframetests.html',
				loadMethod: 'iframe'
			}
		});
	},

	formTestsWindow: function(){
		new MUI.Window({
			id: 'formtests',
			title: 'Form Tests',
			content: {url: 'pages/formtests.html'},
			onLoaded: function(){
				document.testForm.focusTest.focus();
			}
		});
	},

	accordionTestWindow: function(){
		var id = 'accordiontest';
		new MUI.Window({
			id: id,
			title: 'Accordion',
			content: {url: 'data/accordion-demo.json', loadMethod: 'json'},
			width: 300,
			height: 200,
			scrollbars: false,
			resizable: false,
			maximizable: false,
			onLoaded: function(el, content){
				MUI.create({
					control: 'MUI.Accordion',
					container: id,
					idField: 'value',
					panels: content.content
				});
			}
		});
	},

	noCanvasWindow: function(){
		new MUI.Window({
			id: 'nocanvas',
			title: 'No Canvas',
			content: {url: 'pages/lipsum.html'},
			cssClass: 'no-canvas',
			width: 305,
			height: 175,
			shadowBlur: 0,
			resizeLimit: {'x': [275, 2500], 'y': [125, 2000]},
			useCanvas: false,
			useCSS3: false
		});
	},

	css3Window: function(){
		new MUI.Window({
			id: 'css3',
			title: 'CSS3',
			content: {url: 'pages/lipsum.html'},
			cssClass: 'no-canvas',
			width: 305,
			height: 175,
			resizable: true,
			useCanvas: false,
			useCSS3: true
		});
	},

	css3fallbackWindow: function(){
		new MUI.Window({
			id: 'css3fallback',
			title: 'CSS3 with Fallback to Canvas',
			content: {url: 'pages/lipsum.html'},
			width: 305,
			height: 175,
			resizable: true,
			useCanvas: true,
			useCSS3: true
		});
	},

	modalCount: 0,
	createModal:  function(){
		MUI.modalCount++;
		var content = 'Your modal window content';
		if (MUI.modalCount < 3) content += '<br/><br/><a id="createModal' + MUI.modalCount + '">Create Another Modal</a>';
		new MUI.Modal({
			id: 'modalDemo' + MUI.modalCount,
			title: 'A Modal Window ' + MUI.modalCount,
			content: content,
			width: 400,
			height: 250,
			x:70 + (MUI.modalCount * 30),
			y:70 + (MUI.modalCount * 30),
			onClose:function(){
				MUI.modalCount--;
			},
			onLoaded:function(){
				if ($('createModal' + MUI.modalCount)) $('createModal' + MUI.modalCount).addEvent('click', function(e){
					e.stop();
					Demo.createModal();
				});
			}
		});
	},

	forceCanvasWindow: function(){
		new MUI.Window({
			id: 'forceCanvas',
			title: 'Force Canvas',
			content: {url: 'pages/lipsum.html'},
			width: 305,
			height: 175,
			resizable: true,
			useCanvas: true,
			useCSS3: false
		});
	},

	closePanelTest: function(){
		// add ability to test column and panel closing
		var stop = false;
		MUI.each(function(instance){
			if (!stop && instance.className == 'MUI.Panel'){
				instance.close();
				stop = true;
			}
		});
	},

	closeColumnTest: function(){
		var stop = false;
		MUI.each(function(instance){
			if (!stop && instance.className == 'MUI.Column'){
				instance.close();
				stop = true;
			}
		});
	},

	// Tools
	builderWindow: function(){
		new MUI.Window({
			id: 'builder',
			title: 'Window Builder',
			icon: 'images/icons/16x16/page.gif',
			content: {
				url: '{plugins}windowform/',
				require: {
					js: ['{plugins}windowform/scripts/window-from-form.js'],
					onload: function(){
						$('newWindowSubmit').addEvent('click', function(e){
							e.stop();
							new MUI.WindowForm();
						});
					}
				}
			},
			width: 375,
			height: 420,
			maximizable: false,
			resizable: false,
			scrollbars: false
		});
	},

	// Effects
	toggleStandardEffects: function(check){
		MUI.toggleStandardEffects(check);
	},

	toggleAdvancedEffects: function(check){
		MUI.toggleAdvancedEffects(check);
	},

	// Workspaces
	saveWorkspace: function(){
		MUI.desktop.saveWorkspace();
	},

	loadWorkspace: function(){
		MUI.desktop.loadWorkspace();
	},

	// Help
	featuresWindow: function(){
		new MUI.Window({
			id: 'features',
			title: 'Features',
			width: 275,
			height: 250,
			resizeLimit: {'x': [275, 2500], 'y': [125, 2000]},
			content: [
				{url: 'pages/features-layout.html'},
				{
					position: 'top',
					loadMethod: 'json',
					id: 'features_toolbar',
					css: 'mochaToolbar',
					content: [
						{'text': 'Layout', 'url': 'pages/features-layout.html', 'loadMethod': 'iframe', 'title': 'Features - Layout', 'class': 'first'},
						{'text': 'Windows', 'url': 'pages/features-windows.html', 'loadMethod': 'iframe', 'title': 'Features - Windows'},
						{'text': 'General', 'url': 'pages/features-general.html', 'loadMethod': 'iframe', 'title': 'Features - General', 'class': 'last'}
					],
					onLoaded: function(element, content){
						MUI.create({
							control: 'MUI.Tabs',
							id: 'features_toolbar',
							container: 'features',
							position: 'top',
							tabs: content.content,
							partner: 'features'
						});
					}
				}
			]
		});
	},

	aboutWindow: function(){
		new MUI.Modal({
			id: 'about',
			title: 'MUI',
			content: {url: 'pages/about.html'},
			type: 'modal2',
			width: 350,
			height: 195,
			padding: {top: 43, right: 12, bottom: 10, left: 12},
			scrollbars: false
		});
	},

	// Misc
	authorsWindow: function(){
		new MUI.Modal({
			id: 'authorsWindow',
			title: 'AUTHORS.txt',
			content: {url: 'scripts/AUTHORS.txt'},
			width: 400,
			height: 250,
			scrollbars: true
		});
	},

	licenseWindow: function(){
		new MUI.Modal({
			id: 'License',
			title: 'MIT-LICENSE.txt',
			content: {url: 'scripts/MIT-LICENSE.txt'},
			width: 580,
			height: 350,
			scrollbars: true
		});
	},

	splitPanelPanel: function(){
		if ($('mainPanel')){
			MUI.Content.update({ element: 'mainPanel', title: 'Split Panel', content:'' });
			
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
				content: {url: 'license.html'},
				container: 'mainColumn2'
			});

			new MUI.Panel({
				header: false,
				id: 'splitPanel_sidePanel',
				cssClass: 'panelAlt',
				content: {url: 'pages/lipsum.html'},
				container: 'sideColumn3'
			});
		}
	},

	countResizeEvents: {				// used to for counting resize events for panels
		mainPanel: 0,
		panel3: 0
	},

	addResizeElements: function(){		// add resize events to panels
		var panel = this.el.contentWrapper;
		var pad = panel.getElement('.pad');
		var resize = pad.getElement('.resizeInfo');
		if (!resize) resize = new Element('div', {'class':'resizeInfo'}).inject(pad);
		resize.empty();
		resize.appendText('Width: ');
		this.displayWidthEl = new Element('span', {
			'text': panel.getStyle('width')
		}).inject(resize);
		resize.appendText(' Height: ');
		this.displayHeightEl = new Element('span', {
			'text': panel.getStyle('height')
		}).inject(resize);
		resize.appendText(' Resize Events fired: ');
		this.countEvents = new Element('span', {
			'text': Demo.countResizeEvents[this.id]
		}).inject(resize);
	},

	updateResizeElements: function(){	// update the resize counts for panels
		Demo.countResizeEvents[this.id]++;
		if (this.countEvents) this.countEvents.set('text', Demo.countResizeEvents[this.id]);
		var newSize = this.el.contentWrapper.getStyles(['width', 'height']);
		if (this.displayWidthEl) this.displayWidthEl.set('text', newSize['width']);
		if (this.displayHeightEl) this.displayHeightEl.set('text', newSize['height']);
	}
});

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
Demo.initializeDesktop = function(){

	// change default setting - keep window within inside the main area.
	MUI.Windows.options.container = 'desktopContent';

	new MUI.Desktop({
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
								{text:'Container Test',id:'containertestLinkCheck', registered:'Demo.containerTestWindow' },
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
							{text:'Cascade Windows',id:'cascadeLink',register:'MUI.Windows.arrangeCascade'},
							{text:'Tile Windows',id:'tileLink',register:'MUI.Windows.arrangeTile'},
							{type:'divider'},
							{text:'Minimize All Windows',id:'minimizeLink',register:'MUI.Windows.minimizeAll'},
							{text:'Close All Windows',id:'closeLink',register:'MUI.Windows.closeAll'}
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
				}
			]},
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
								idField: 'value',
								onLoaded: function(){
									return;
									var mainPanel = $('mainPanel');
									if ($('plistLink')){
										$('plistLink').addEvent('click', function(e){
											e.stop();
											Demo.listBuilder('mainPanel');
										});
									}
									if ($('wlistLink')){
										$('wlistLink').addEvent('click', function(e){
											e.stop();
											new MUI.Window({
												id: 'basicListWindow',
												content: 'loading...',
												title: 'Basic List in Window',
												width: 340,
												height: 150
											});
											Demo.listBuilder('basicListWindow');
										});
									}
									if ($('pcbgLink')){
										$('pcbgLink').addEvent('click', function(e){
											e.stop();
											Demo.checkBoxGrid('mainPanel');
										});
									}
									if ($('wcbgLink')){
										$('wcbgLink').addEvent('click', function(e){
											e.stop();
											new MUI.Window({
												id: 'cbgWindow',
												content: 'loading...',
												title: 'Check Box Grid in Window',
												width: 340,
												height: 150
											});
											Demo.checkBoxGrid('cbgWindow');
										});
									}
									if ($('pslLink')){
										$('pslLink').addEvent('click', function(e){
											e.stop();
											Demo.selectListBuilder('mainPanel');
										});
									}
									if ($('wslLink')){
										$('wslLink').addEvent('click', function(e){
											e.stop();
											new MUI.Window({
												id: 'slWindow',
												content: 'loading...',
												title: 'Select List in Window',
												width: 340,
												height: 150
											});
											Demo.selectListBuilder('slWindow');
										});
									}
									if ($('pibLink')){
										$('pibLink').addEvent('click', function(e){
											e.stop();
											Demo.imageButtonBuilder('mainPanel');
										});
									}
									if ($('wibLink')){
										$('wibLink').addEvent('click', function(e){
											e.stop();
											new MUI.Window({
												id: 'wiWindow',
												content: 'loading...',
												title: 'Image Button in Window',
												width: 340,
												height: 150
											});
											Demo.imageButtonBuilder('wiWindow');
										});
									}

									if ($('ptaLink')){
										$('ptaLink').addEvent('click', function(e){
											e.stop();
											Demo.textAreaBuilder('mainPanel');
										});
									}
									if ($('wtaLink')){
										$('wtaLink').addEvent('click', function(e){
											e.stop();
											new MUI.Window({
												id: 'taWindow',
												content: 'loading...',
												title: 'TextArea in Window',
												width: 340,
												height: 150
											});
											Demo.textAreaBuilder('taWindow');
										});
									}

									if ($('ptbLink')){
										$('ptbLink').addEvent('click', function(e){
											e.stop();
											Demo.textBoxBuilder('mainPanel');
										});
									}
									if ($('wtbLink')){
										$('wtbLink').addEvent('click', function(e){
											e.stop();
											new MUI.Window({
												id: 'tbWindow',
												content: 'loading...',
												title: 'TextBox in Window',
												width: 340,
												height: 150
											});
											Demo.textBoxBuilder('tbWindow');
										});
									}

									if ($('ptreeLink')){
										$('ptreeLink').addEvent('click', function(e){
											e.stop();
											Demo.treeBuilder('mainPanel');
										});
									}
									if ($('wtreeLink')){
										$('wtreeLink').addEvent('click', function(e){
											e.stop();
											new MUI.Window({
												id: 'wtreeLinkWindow',
												content: 'loading...',
												title: 'Tree in Window',
												width: 340,
												height: 150
											});
											Demo.treeBuilder('wtreeLinkWindow');
										});
									}

									$('splitWindowLink').addEvent('click', function(){
										Demo.splitWindow();
									});
									$('ajaxpageLink').addEvent('click', function(){
										Demo.ajaxpageWindow();
									});
									$('jsonLink').addEvent('click', function(){
										Demo.jsonWindows();
									});
									$('youtubeLink').addEvent('click', function(){
										Demo.youtubeWindow();
									});
									$('clockLink').addEvent('click', function(){
										Demo.clockWindow();
									});
									$('parametricsLink').addEvent('click', function(){
										Demo.parametricsWindow();
									});
									$('pcalendarLink').addEvent('click', function(){
										MUI.Content.update({
											element: mainPanel,
											url: '{controls}calendar/demo.html',
											title: 'Calendar Component',
											padding: {top: 8, right: 8, bottom: 8, left: 8},
											onLoaded:function(){
												MUI.create({control: 'MUI.Calendar', id: 'date1', format: 'd/m/Y', direction: 1, tweak: {x: 6, y: 0}});
											}
										});
									});
									$('wcalendarLink').addEvent('click', function(){
										new MUI.Window({
											id: 'cslWindow',
											content: 'Loading...',
											title: 'Calendar in Window',
											width: 340,
											height: 150,
											onLoaded:function(){
												MUI.create({control: 'MUI.Calendar', id: 'wcalendarLink1', container: 'cslWindow', format: 'd/m/Y', direction: 1, tweak: {x: 6, y: 0}});
											}
										});
									});
									$('fxmorpherLink').addEvent('click', function(){
										MUI.Content.update({
											element: mainPanel,
											url: '{plugins}Fx.Morpher/',
											title: 'Fx.Morpher Path Animation',
											padding: {top: 8, right: 8, bottom: 8, left: 8}
										});
										Demo.fxmorpherWindow();
									});

									$('paccordiontestLink').addEvent('click', function(e){
										e.stop();
										MUI.create({
											control: 'MUI.Accordion',
											container: mainPanel,
											id: 'accordionMainPanel1',
											panels: [
												{text: 'Lorem Ipsum', value: 'panel0', 'html': '<h3>Lorem Ipsum Dolor Sit Amet</h3><p>Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Aenean consequat dignissim pede. Aliquam erat volutpat. In ac nulla. Phasellus sapien.</p>'},
												{text: 'Dolor Sit', 'html': '<h3>Lorem Ipsum Dolor Sit Amet</h3><p>Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Aenean consequat dignissim pede. Aliquam erat volutpat. In ac nulla. Phasellus sapien.</p>'},
												{text: 'Amet', 'html': '<h3>Lorem Ipsum Dolor Sit Amet</h3><p>Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Aenean consequat dignissim pede. Aliquam erat volutpat. In ac nulla. Phasellus sapien.</p>'}
											]
										});
									});

									$('waccordiontestLink').addEvent('click', function(e){
										e.stop();
										Demo.accordionTestWindow();
									});

									$('modalLink').addEvent('click', function(e){
										e.stop();
										Demo.createModal();
									});
								}
							}
						},
						{
							id: 'panel2',
							title: 'Ajax Form',
							height: 230,
							content: {
								url: 'pages/ajax.form.html',
								onLoaded: function(){
									return;
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
		]
	});
};

Demo.initialize = function(){
	// Initialize MochaUI options
	MUI.initialize({path:{demo:''}});
	MUI.register('Demo', Demo);
	MUI.register('MUI.Windows', MUI.Windows);
	MUI.create('famfamfam');
	Demo.initializeDesktop();
	//Demo.parametricsWindow();
};

// Initialize MochaUI when the DOM is ready
window.addEvent('load', Demo.initialize); //using load instead of domready for IE8
