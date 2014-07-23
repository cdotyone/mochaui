/*
 Creating Demo namespace, this is not required.
 Doing this to keep demo stuff separated.
 */

var Demo = (Demo || {});

// Examples
Object.append(Demo, {

	devNotesPanel: function(){
		MUI.Content.update({
			element: 'mainPanel',
			title: 'Development Notes',
			clear:true,
			url:'{demo}pages/notes.html'
		});
	},

	xhrPanel: function(){
		MUI.Content.update({
			element: 'mainPanel',
			title: 'Lorem Ipsum',
			clear:true,
			url:'{demo}pages/lipsum.html'
		});
	},

	ajaxpageWindow: function(e, node){
		MUI.create({
			control:'MUI.Window',
			id: 'ajaxpage',
			title:node.text,
			content: {url:'{demo}pages/lipsum.html'},
			width: 340,
			height: 150
		});
	},

	jsonWindows: function(){
		new Request.JSON({
			url: 'data/json-windows-data.json',
			onComplete: function(properties){
				MUI.Windows.newFromJSON(properties.windows);
			}
		}).send();
	},

	youtubePanel: function(){
		if ($('mainPanel')){

			MUI.Content.update({
				element: 'mainPanel',
				title: 'Youtube in Iframe',
				clear:true,
				url: '{demo}pages/youtube5.html',
				loadMethod:'iframe'
			});
		}
	},


	youtubeWindow: function(){
		MUI.create({
			control:'MUI.Window',
			id: 'youtubeWindow',
			title: 'YouTube in Iframe',
			width: 500,
			height: 375,
			resizeLimit: {'x': [330, 2500], 'y': [250, 2000]},
			headerHeight:50,
			padding: {top:0, bottom: 0, left: 0, right: 0},
			content: [
				{url:'{demo}pages/youtube.html', loadMethod:'iframe'},
				{
					id:'youtubeTabs',
					control: 'MUI.Tabs',
					position: 'header',
					loadMethod: 'json',
					value:'Zero7',
					container:'youtubeWindow',
					partner:'youtubeWindow',
					tabs: [
						{'text': 'RAC/Tourist', 'value':'Zero7', 'url': '{demo}pages/youtube.html', 'loadMethod': 'iframe', 'title': 'Zero 7', 'class': 'first'},
						{'text': 'Madeon/The City', 'value': 'FleetFoxes','url': '{demo}pages/youtube2.html', 'loadMethod': 'iframe', 'title': 'Fleet Foxes'},
						{'text': 'Boards of Canada', 'value': 'BoardsofCanada','url': '{demo}pages/youtube3.html', 'loadMethod': 'iframe', 'title': 'Boards of Canada'},
						{'text': 'Zero 7/Crosses', 'value': 'Zero7Crosses','url': '{demo}pages/youtube4.html', 'loadMethod': 'iframe', 'title': 'Zero7', 'class': 'last'}
					],
					onDrawEnd: function(){
						this.el.element.setStyle('clear', 'left');

					}
				}

			]
		});
	},

	writeConsole: function(message){
		var d = new Date().format('%H:%M:%S: ');
		new Element('div', {text: d + message}).inject('mochaConsole', 'top');
	},

	getDemoContainer: function(node, hideScrolls, canResize, width, height){
		var isWindow = node.value.substr(0, 1) == 'w';
		if (!width) width = 340;
		if (!height) height = 200;
        
		if (isWindow){
			var win = MUI.create({
				control:'MUI.Window',
				id: node.value + 'Window',
				content: 'loading...',
				title: node.text + ' in Window',
				width: width,
				height: height,
				scrollbars: !hideScrolls,
				resizable: canResize,
				maximizable: false
			});
            
			return win.el.content;
		} 

		MUI.Content.update({
			element: 'mainPanel',
			title: node.text,
			clear:true,
			content:' '
		});

		return MUI.get('mainPanel').el.content;
	},

	listBuilder: function(e, node){
		var container = Demo.getDemoContainer(node);

		MUI.create({
			control: 'MUI.List',
			id: node.value + 'list1',
			container: container,
			clearContainer: true,
			content: {url: 'data/person.json', paging: {size: 10, totalCount: 200, recordsField: false}},
			columns: [
				{text: 'First Name', name: 'FirstName', 'value': 'ID'},
				{text: 'Last Name', name: 'LastName'}
			],
			commands: [
				{'text': 'Ok', 'name': 'Ok', 'image': '{theme}images/accept.png'},
				{'text': 'Delete', 'name': 'Delete', 'image': '{theme}images/cancel.png'}
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

	checkBoxGrid: function(e, node){
		var container = Demo.getDemoContainer(node);

		MUI.create({
			control: 'MUI.CheckBoxGrid',
			id: node.value + 'cbg1',
			container: container,
			clearContainer: true,
			content: {url: 'data/person.json', paging: {size: 10, totalCount:200, recordsField: false}},
			width: 300,
			height: 200,
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
			id: node.value + 'cbg2',
			container: container,
			clearContainer: false,
			content: {url: '{demo}data/person.json', paging: {size: 10, totalCount: 200, recordsField: false}},
			width: 300,
			height: 200,
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

	gridBuilder: function(e, node){
		var container = Demo.getDemoContainer(node, false, true, 507, 320);

		var gridButtonClick = function(button){
			alert(button);
		};

		var accordionFunction = function(obj){
			obj.parent.set('html', '<div style="padding:5px"> Row ' + obj.row + '<br/><br/>Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. </div>');
		};

		MUI.create({
			control: 'MUI.Grid',
			'id': node.value + 'Grid',
			container: container,
			columns: [
				{
					header: "Name",
					name: '{firstName} {lastName}',
					dataType:'string'
				},
				{
					header: "Address",
					name: 'address',
					dataType:'string'
				},
				{
					header: "City",
					name: 'city',
					dataType:'string'
				},
				{
					header: "State",
					name: 'state',
					dataType:'string'
				},
				{
					header: "Zip",
					name: 'zip',
					dataType:'string'
				}
			],
			buttons : [
				{name: 'Add', cssClass: 'add', 'click': gridButtonClick},
				{name: 'Delete', cssClass: 'delete', 'click': gridButtonClick},
				{separator: true},
				{name: 'Duplicate', cssClass: 'duplicate', 'click': gridButtonClick}
			],
			accordion:true,
			accordionRenderer:accordionFunction,
			autoSectionToggle:false,

			content:{
				url:"http://www.mui-windowui.org/person/list?page={page}&max={pageSize}&order={dir}&sort={sort}",
				persist:true,
				loadMethod: 'jsonp',
				paging: {
					pageSize:10,
					page:1
				}
			},

			showHeader: true,
			sortHeader: true,
			alternateRows: true,
			resizeColumns: true,
			multipleSelection:true
		});
	},

	selectListBuilder: function(e, node){
		var container = Demo.getDemoContainer(node);

		MUI.create({
			control: 'MUI.SelectList',
			id: node.value + 'sl1',
			container: container,
			clearContainer: true,
			content: {url: '{demo}data/employees.json', paging: {size: 10, totalCount: 200, recordsField: false}},
			width: 250,
			height: 100,
			textField: 'name',
			valueField: 'ID',
			canSelect: true,
			formTitle: 'Select List Control:',
			onItemSelected: function(item, selected, self){
				Demo.writeConsole(self.options.id + ' received onItemSelected command on item \'' + item.name + '\', selected=' + selected)
			}
		});
	},

	imageButtonBuilder: function(e, node){
		var container = Demo.getDemoContainer(node);
		$(container).empty();
		MUI.create({
			control: 'MUI.ImageButton',
			text: 'Accept',
			title: 'Accept Order',
			image: '{theme}images/accept.png',
			id: node.value + 'btnAccept',
			container: container,
			onClick: function(self){
				Demo.writeConsole(self.options.id + ' clicked');
			}
		});
		MUI.create({
			control: 'MUI.ImageButton',
			text: 'Cancel',
			title: 'Cancel Order',
			image: '{theme}images/cancel.png',
			id: node.value + 'btnCancel',
			container: container,
			onClick: function(self){
				Demo.writeConsole(self.options.id + ' clicked');
			}
		});
	},

	textAreaBuilder: function(e, node){
		var container = Demo.getDemoContainer(node);
		$(container).empty();
		MUI.create({control: 'MUI.TextArea', container: container, rows: 5, id:node.value + 'textarea1'});
		MUI.create({control: 'MUI.TextArea', container: container, id: node.value + 'textarea2', hasDynamicSize: true});
	},

	stepperBuilder: function(e, node){
		var container = Demo.getDemoContainer(node);
		$(container).empty();

		MUI.create({
			control: 'MUI.Stepper',
			container: container,
			formTitle: 'numeric',
			id:node.value + 'stepper1',
			onValidationFailed:function(){
				alert('Ooops! Please input intergers only!');
			}
		});

		MUI.create({
			control: 'MUI.Stepper',
			container: container,
			iterator: 'alpha',
			formTitle: 'alpha',
			id:node.value + 'stepper2',
			onValidationFailed:function(){
				alert('Ooops! Please input letters only!');
			}
		});

		MUI.create({
			control: 'MUI.Stepper',
			container: container,
			iterator: 'hex',
			formTitle: 'hex',
			id:node.value + 'stepper3'
		});

		MUI.create({
			control: 'MUI.Stepper',
			container: container,
			iterator: 'time',
			formTitle: 'time 24HR',
			id:node.value + 'stepper4',
			use24:true
		});

		MUI.create({
			control: 'MUI.Stepper',
			container: container,
			iterator: 'time',
			formTitle: 'time',
			minValue:'6:00AM',
			maxValue:'6:00PM',
			id:node.value + 'stepper5'
		});

		MUI.create({
			control: 'MUI.Stepper',
			container: container,
			iterator: 'list',
			formTitle: 'list - days',
			data:['Sun','Mon','Tues','Wed','Thur','Fri','Sat'],
			id:node.value + 'stepper6'
		});

		MUI.create({
			control: 'MUI.Stepper',
			container: container,
			iterator: 'list',
			formTitle: 'list - month',
			width:70,
			data:['January','February','March','April','May','June','July','August','September','October','November','December'],
			id:node.value + 'stepper7'
		});

	},

	textBoxBuilder: function(e, node){
		var container = Demo.getDemoContainer(node);
		$(container).empty();

		var ftypes = ['fixed.phone', 'fixed.phone-us', 'fixed.cpf', 'fixed.cnpj', 'fixed.date', 'fixed.date-us', 'fixed.cep', 'fixed.time', 'fixed.cc'];
		Object.append(ftypes, ['reverse.integer', 'reverse.decimal', 'reverse.decimal-us', 'reverse.reais', 'reverse.dollar', 'regexp.ip', 'regexp.email', 'password']);

		var mtype,div;
		ftypes.each(function(t){
			var s = t.split('.');
			var ttype = s[0].capitalize();
			if (mtype != ttype){
				mtype = ttype;
				div = new Element('div', {'text': ttype, 'id': node.value + ttype}).inject(container);
			}
			if (s.length < 2) s[1] = ttype;
			MUI.create({control: 'MUI.TextBox', container: div, id: node.value + t, formTitle: s[1].capitalize(), maskType: t, autoTab: true});
		});
	},

	treeBuilder: function(e, node){
		var container = Demo.getDemoContainer(node);
		MUI.create({
			control: 'MUI.Tree',
			container: container,
			id: node.value + 'tree1',
			content: {url: '{demo}data/tree-testdata.json'},
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

	calendarBuilder: function(e, node){
		var container = Demo.getDemoContainer(node);
		$(container).empty();

		MUI.Content.update({
			element: container,
			url: '{controls}calendar/demo.html',
			title: 'Calendar Component',
			padding: {top: 8, right: 8, bottom: 8, left: 8},
			onLoaded:function(){
				MUI.create({control: 'MUI.Calendar', id: 'date1', format: 'm/d/Y', direction: 1, tweak: {x: 6, y: 0}});
			}
		});
	},

	splitWindow: function(){

		MUI.create({
			control:'MUI.Window',
			id: 'splitWindow',
			title: 'Split Window',
			width: 600,
			height: 350,
			cssClass:'splitWindowContent',
			resizeLimit: {'x': [450, 2500], 'y': [300, 2000]},
			padding:0,
			content: [
				{
					loadMethod:'control',
					controls:[
						{
							control:'MUI.Column',
							container: 'splitWindow_content',
							id: 'splitWindow_sideColumn',
							placement: 'left',
							width: 170,
							resizeLimit: [100, 300],
							cssClass:'splitWindowColumn',
							panels:[
								{
									header: false,
									id: 'splitWindow_sidePanel_1',
									cssClass: 'mui-panelAlt',
									content: {url: '{demo}pages/lipsum.html'},
									container: 'splitWindow_sideColumn'
								}
							]
						},
						{
							control:'MUI.Column',
							container: 'splitWindow_content',
							id: 'splitWindow_mainColumn',
							placement: 'main',
							resizeLimit: [100, 300],
							cssClass:'splitWindowColumn',
							panels:[
								{
									header: false,
									id: 'splitWindow_mainPanel_1',
									content: {url: '{demo}license.html'},
									container: 'splitWindow_mainColumn',
									panelBackground: '#fff'
								}
							]
						}
					]
				}
			]
		});
	},

	// Examples > Tests
	serverResponseWindow: function(response){
		MUI.create({
			control:'MUI.Window',
			id: 'serverResponse',
			content: response,
			width: 350,
			height: 350
		});
	},

	eventsWindow: function(){
		MUI.create({
			control:'MUI.Window',
			id: 'windowevents',
			title: 'Window Events',
			content: {url: '{demo}pages/events.html'},
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

	iframeTestsWindow: function(){
		MUI.create({
			control:'MUI.Window',
			id: 'iframetests',
			title: 'Iframe Tests',
			content: {
				url: '{demo}pages/iframetests.html',
				loadMethod: 'iframe'
			}
		});

	},

	formTestsWindow: function(){
		MUI.create({
			control:'MUI.Window',
			id: 'formtests',
			title: 'Form Tests',
			content: {url: '{demo}pages/formtests.html'},
			onLoaded: function(){
				document.testForm.focusTest.focus();
			}

		});
	},

	accordionBuilder: function(e, node){
		var container = Demo.getDemoContainer(node, true);

		MUI.create({
			control: 'MUI.Accordion',
			container: container,
			id: 'accordionMainPanel1',
			value: 'panel2',
			content: {url: '{demo}data/accordion-demo.json', loadMethod: 'json'}
		});
	},

	noCanvasWindow: function(){
		MUI.create({
			control:'MUI.Window',
			id: 'nocanvas',
			title: 'No Canvas',
			content: {url: '{demo}pages/lipsum.html'},
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

		MUI.create({
			control:'MUI.Window',
			id: 'css3',
			title: 'CSS3',
			content: {url: '{demo}pages/lipsum.html'},
			cssClass: 'no-canvas',
			width: 305,
			height: 175,
			resizable: true,
			useCanvas: false,
			useCSS3: true
		});
	},

	css3fallbackWindow: function(){
		MUI.create({
			control:'MUI.Window',
			id: 'css3fallback',
			title: 'CSS3 with Fallback to Canvas',
			content: {url: '{demo}pages/lipsum.html'},
			width: 305,
			height: 175,
			resizable: true,
			useCanvas: true,
			useCSS3: true
		});
	},

	modalCount: 0,
	createModal:function(){
		Demo.modalCount++;
		var content = 'Your modal window content';
		if (Demo.modalCount < 3) content += '<br/><br/><a id="createModal' + Demo.modalCount + '">Create Another Modal</a>';
		MUI.create({
			control:'MUI.Modal',
			id: 'modalDemo' + Demo.modalCount,
			title: 'A Modal Window ' + Demo.modalCount,
			content: content,
			width: 400,
			height: 250,
			x:70 + (Demo.modalCount * 30),
			y:70 + (Demo.modalCount * 30),
			onClose:function(){
				Demo.modalCount--;
			},
			onLoaded:function(){
				if ($('createModal' + Demo.modalCount)) $('createModal' + Demo.modalCount).addEvent('click', function(e){
					e.stop();
					Demo.createModal();
				});
			}
		});
	},

	forceCanvasWindow: function(){
		MUI.create({
			control:'MUI.Window',
			id: 'forceCanvas',
			title: 'Force Canvas',
			content: {url: '{demo}pages/lipsum.html'},
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
		MUI.create({
			control:'MUI.Window',
			id: 'builder',
			title: 'Window Builder',
			icon: 'images/icons/16x16/page.gif',
			content: {
				url: '{plugins}windowform/demo.html',
				require: {
					js: ['{plugins}windowform/windowform.js'],
					css: ['{plugins}windowform/style.css'],
					onload: function(){
						$('newWindowSubmit').addEvent('click', function(e){
							e.stop();
							new MUI.WindowForm();
						});

						$('iframeLoadMethod').addEvent('click', function(e){
							if ($('newWindowContentURL').get('value') === "http://www.google.com/"){
								$('newWindowWidth').set('value', 845);
								$('newWindowHeight').set('value', 400);
							}
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

	featuresWindow: function(){
		MUI.create({
			control:'MUI.Window',
			id: 'featuresWindow',
			title: 'Features',
			width: 355,
			height: 320,
			resizeLimit: {'x': [275, 2500], 'y': [125, 2000]},
			scrollbars:false,
			resizable:false,
			headerHeight:50,
			content: [
				{url: '{demo}pages/features-layout.html', loadMethod: 'iframe'},
				{
					id:'featureTabs',
					control: 'MUI.Tabs',
					position: 'header',
					loadMethod: 'json',
					container:'featuresWindow',
					partner:'featuresWindow',
					value:'Layout',
					tabs: [
						{'text': 'Layout', 'value': 'Layout', 'url': '{demo}pages/features-layout.html', 'loadMethod': 'iframe', 'title': 'Features - Layout', 'class': 'first'},
						{'text': 'Windows', 'value': 'Windows', 'url': '{demo}pages/features-windows.html', 'loadMethod': 'iframe', 'title': 'Features - Windows'},
						{'text': 'General', 'value': 'General', 'url': '{demo}pages/features-general.html', 'loadMethod': 'iframe', 'title': 'Features - General', 'class': 'last'}
					],
					onDrawEnd: function(){
						this.el.element.setStyle('clear', 'left');
					}
				}
			]

		});
	},

	aboutWindow: function(){
		MUI.create({
			control:'MUI.Modal',
			id: 'about',
			title: 'MUI',
			content: {url: '{demo}pages/about.html'},
			type: 'modal2',
			width: 350,
			height: 195,
			padding: {top: 43, right: 12, bottom: 10, left: 12},
			scrollbars: false,
			onLoaded: function(){
				$('authorsAboutLink').addEvent('click', function(e){
					e.stop();
					Demo.authorsWindow();
				});
			}
		});

	},

	// Misc
	authorsWindow: function(){

		MUI.create({
			control:'MUI.Modal',
			id: 'authorsWindow',
			title: 'AUTHORS.txt',
			content: {url: '{demo}scripts/AUTHORS.txt'},
			width: 400,
			height: 250,
			scrollbars: true,
			type: 'modal2'
		});
	},

	licenseWindow: function(){

		MUI.create({
			control:'MUI.Modal',
			id: 'License',
			title: 'MIT-LICENSE.txt',
			content: {url: '{demo}scripts/MIT-LICENSE.txt'},
			width: 580,
			height: 350,
			scrollbars: true,
			type: 'modal2'
		});
	},

	splitPanelPanel: function(){
		if ($('mainPanel')){

			MUI.Content.update({
				element: 'mainPanel',
				title: 'Split Panel',
				clear:true,
				loadMethod:'control',
				controls:[
					{
						control:'MUI.Column',
						container: 'mainPanel',
						id: 'splitPanel_sideColumn',
						placement: 'left',
						width: 200,
						resizeLimit: [100, 300],
						panels:[
							{
								control:'MUI.Panel',
								header: false,
								id: 'splitPanel_sidePanel_1',
								cssClass: 'mui-panelAlt',
								content: {url: '{demo}pages/lipsum.html'},
								container: 'splitPanel_sideColumn'
							}
						]
					},
					{
						control:'MUI.Column',
						container: 'mainPanel',
						id: 'splitPanel_mainColumn',
						placement: 'main',
						resizeLimit: [100, 300],
						width:null,
						panels:[
							{
								control:'MUI.Panel',
								id: 'splitPanel_mainPanel_1',
								container: 'splitPanel_mainColumn',
								cssClass: 'mui-panelAlt',
								header: false,
								content: {
									url: '{demo}license.html',
									onLoaded: function(){
										$('splitPanel_mainColumn').setStyle('width', 'inherit');
									}
								}

							}
						]

					}
				]
			});
		}
	},

	countResizeEvents: {				// used to for counting resize events for panels
		mainPanel: 0,
		panel3:0
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
