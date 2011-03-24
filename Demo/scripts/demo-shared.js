/*
 Creating Demo namespace, this is not required.
 Doing this to keep demo stuff separated.
 */

var Demo = (Demo || {});

// Examples
Object.append(Demo, {

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

	writeConsole: function(message){
		var d = new Date().format('%H:%M:%S: ');
		new Element('div', {text: d + message}).inject('mochaConsole', 'top');
	},

	getDemoContainer: function(node, hideScrolls, canResize, width, height){
		var isWindow = node.value.substr(0, 1) == 'w';
		if (!width) width = 340;
		if (!height) height = 200;

		if (isWindow){
			var win = new MUI.Window({
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
				{'text': 'Cancel', 'name': 'Cancel', 'image': '{theme}images/cancel.png'}
			],
			onItemCommand: function(item, self, cmd){
				Demo.writeConsole(self.options.id + ' received ' + cmd.name + ' command on item ' + item.value);
			},
			onItemChecked: function(item, self){
				Demo.writeConsole(self.options.id + ' received onItemChecked command on item ' + item.value);
			},
			onItemSelected: function(item, self){
				Demo.writeConsole(self.options.id + ' received onItemSelected command on item ' + item.value);
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
			id: node.value + 'cbg2',
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
				url:"http://www.mochaui.org/person/list?page={page}&max={pageSize}&order={dir}&sort={sort}",
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
			content: {url: 'data/employees.json', paging: {size: 10, totalCount: 200, recordsField: false}},
			width: 250,
			height: 100,
			textField: 'name',
			valueField: 'ID',
			canSelect: true,
			formTitle: 'Select List Control:',
			onItemSelected: function(item, selected, self){
				Demo.writeConsole(self.options.id + ' received onItemSelected command on item \'' + item.name + '\', selected=' + selected);
			}
		});
	},

	imageButtonBuilder: function(e, node){
		var container = Demo.getDemoContainer(node);
		$(container).empty();
		MUI.create({
			control: 'MUI.ImageButton',
			cssClass: 'imgButton',
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
			cssClass: 'imgButton',
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
			value: 0,
			id:node.value + 'stepper1',
			onValidationFailed:function(){
				alert('Ooops! Please input intergers only!');
			}
		});
		
		// first load the StepperIterator class
		new MUI.Require({js: ['{controls}stepper/stepper.iterator.js'],
			onload: function() {
				
				// second, create a custom iterator
				Demo.TimeIterator = new NamedClass('Demo.TimeIterator', {

					Extends: MUI.StepperIterator,

					set: function(value){
						var values = value.match(/^(\d{2}):(\d{2})$/);
						var minutes = values[1].toInt() * 60 + values[2].toInt();
						return this.parent((minutes / 15).toInt());
					},

					validate: function(value){
						if (typeOf(value) !== 'string')
							return false;
						return value.test(/^\d{2}:\d{2}$/);
					},

					current: function(){
						var minutes = this.parent() * 15;
						var h = (minutes / 60).toInt();
						var m = (minutes % 60).toInt();
						h = h < 10 ? '0' + h : h;
						m = m < 10 ? '0' + m : m;
						return h + ':' + m;
					},

					hasPrevious: function(){
						return this.index > 0;
					}
				});
				
				// finally, instantiate the (custom)stepper
				MUI.create({control: 'MUI.Stepper',
					container: container,
					id: node.value + 'stepper2',
					formTitle: 'Time',
					value: '00:00',
					
					iterator: new Demo.TimeIterator(),
					
					onValidationFailed:	function(){
						alert('Ooops! Please format your input like HH:MM !');
					}
				});
			}
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
			content: {url: 'data/tree-testdata.json'},
			onNodeExpanded: function(node, isExpanded, self){
				Demo.writeConsole(self.options.id + ' receieved onNodeExpanded command on node ' + node.value + ', isExpanded=' + isExpanded);
			},
			onNodeChecked: function(node, checked, self){
				Demo.writeConsole(self.options.id + ' receieved onNodeChecked command on node ' + node.value + ', checked=' + checked);
			},
			onNodeSelected: function(node, self){
				Demo.writeConsole(self.options.id + ' receieved onNodeSelected command on node ' + node.value);
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

	accordionBuilder: function(e, node){
		var container = Demo.getDemoContainer(node, true);

		MUI.create({
			control: 'MUI.Accordion',
			container: container,
			id: 'accordionMainPanel1',
			content: {url: 'data/accordion-demo.json', loadMethod: 'json'}
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
	createModal:function(){
		Demo.modalCount++;
		var content = 'Your modal window content';
		if (Demo.modalCount < 3) content += '<br/><br/><a id="createModal' + Demo.modalCount + '">Create Another Modal</a>';
		new MUI.Modal({
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
			MUI.Content.update({ element: 'mainPanel', title: 'Split Panel', clear:true });

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
		if (this.displayWidthEl) this.displayWidthEl.set('text', newSize.width);
		if (this.displayHeightEl) this.displayHeightEl.set('text', newSize.height);
	}
});
