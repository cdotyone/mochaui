/* 

 In this file we setup our Windows, Columns and Panels,
 and then initialize MochaUI.

 At the bottom of Core.js you can see how to setup lazy loading for your
 own plugins.

 */

/*

 INITIALIZE WINDOWS

 1. Define windows

 var myWindow = function(){
 new MUI.Window({
 id: 'mywindow',
 title: 'My Window',
 content: {url: 'pages/lipsum.html'},
 width: 340,
 height: 150
 });
 }

 2. Build windows on onDomReady

 myWindow();

 3. Add link events to build future windows

 if ($('myWindowLink')){
 $('myWindowLink').addEvent('click', function(e){
 e.stop();
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
 it in the onLoaded function of the new window.

 -------------------------------------------------------------------- */

var initializeWindows = function(){

	// change default setting - keep window within inside the main area.
	MUI.Windows.options.container = 'pageWrapper';

	// Examples
	MUI.htmlWindow = function(){
		new MUI.Window({
			id: 'htmlpage',
			content: 'Hello World',
			width: 340,
			height: 150
		});
	};

	MUI.ajaxpageWindow = function(){
		new MUI.Window({
			id: 'ajaxpage',
			content: {url: 'pages/lipsum.html'},
			width: 340,
			height: 150
		});
	};
	if ($('ajaxpageLinkCheck')){
		$('ajaxpageLinkCheck').addEvent('click', function(e){
			e.stop();
			MUI.ajaxpageWindow();
		});
	}

	MUI.jsonWindows = function(){
		new Request.JSON({
			url: 'data/json-windows-data.js',
			onComplete: function(properties){
				MUI.Windows.newFromJSON(properties.windows);
			}
		}).send();
	};
	if ($('jsonLink')){
		$('jsonLink').addEvent('click', function(e){
			e.stop();
			MUI.jsonWindows();
		});
	}

	MUI.youtubeWindow = function(){
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
						MUI.create('MUI.Tabs', {
							'id': 'youtube_toolbar',
							'container': 'youtube',
							'position': 'top',
							'tabs': content.content,
							'partner': 'youtube'
						});
					}
				}
			]
		});
	};
	if ($('youtubeLinkCheck')){
		$('youtubeLinkCheck').addEvent('click', function(e){
			e.stop();
			MUI.youtubeWindow();
		});
	}

	MUI.clockWindow = function(){
		new MUI.Window({
			id: 'clock',
			title: 'Canvas Clock',
			addClass: 'transparent',
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
	};
	if ($('clockLinkCheck')){
		$('clockLinkCheck').addEvent('click', function(e){
			e.stop();
			MUI.clockWindow();
		});
	}

	MUI.writeConsole = function(message){
		var d = new Date().format('%H:%M:%S: ');
		new Element('div', {text: d + message}).inject('mochaConsole', 'top');
	};

	MUI.listBuilder = function(container){
		MUI.create('MUI.List', {
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
				MUI.writeConsole(self.options.id + ' received ' + cmd.name + ' command on item ' + item.value)
			},
			onItemChecked: function(item, self){
				MUI.writeConsole(self.options.id + ' received onItemChecked command on item ' + item.value)
			},
			onItemSelected: function(item, self){
				MUI.writeConsole(self.options.id + ' received onItemSelected command on item ' + item.value)
			}
		});
	};

	MUI.cbgBuilder = function(container){
		MUI.create('MUI.CheckBoxGrid', {
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
				MUI.writeConsole(self.options.id + ' received onItemClick command on item ' + inp.value);
			},
			onValueChanged: function(value, self){
				MUI.writeConsole(self.options.id + ' received onValueChanged command, value = ' + self.options.value);
			}
		});
		MUI.create('MUI.CheckBoxGrid', {
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
				MUI.writeConsole(self.options.id + ' received onItemClick command on item ' + inp.value);
			},
			onValueChanged: function(value, self){
				MUI.writeConsole(self.options.id + ' received onValueChanged command, value = ' + self.options.value);
			}
		});
	};

	MUI.slBuilder = function(container){
		MUI.create('MUI.SelectList', {
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
				MUI.writeConsole(self.options.id + ' received onItemSelected command on item \'' + item.name + '\', selected=' + selected)
			}
		});
	};

	MUI.ibBuilder = function(container){
		MUI.get(container).el.content.empty();
		if ($('mainPanel_search_buttonHolder')) $('mainPanel_search_buttonHolder').empty();
		MUI.create('MUI.ImageButton', {
			cssClass:	'imgButton',
			text:		'Accept',
			title:		'Accept Order',
			image:		'{theme}images/accept.png',
			id:			container + 'btnAccept',
			container:	container,
			section:	(container != 'mainPanel' ? 'footer' : 'search'),
			onClick:	function(self){
				MUI.writeConsole(self.options.id + ' clicked');
			}
		});
		MUI.create('MUI.ImageButton', {
			cssClass:	'imgButton',
			text:		'Cancel',
			title:		'Cancel Order',
			image:		'{theme}images/cancel.png',
			id:		container + 'btnCancel',
			container:	container,
			onClick:	function(self){
				MUI.writeConsole(self.options.id + ' clicked');
			}
		});
	};

	MUI.taBuilder = function(container){
		MUI.get(container).el.content.empty();
		MUI.create('MUI.TextArea', {container: container, rows: 5, id:container + 'textarea1'});
		MUI.create('MUI.TextArea', {container: container, id: container + 'textarea2', hasDynamicSize: true});
	};

	MUI.tbBuilder = function(container){
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
			MUI.create('MUI.TextBox', {container: container + ttype, id: container + t, formTitle: s[1].capitalize(), maskType: t, autoTab: true});
		});
	};

	MUI.treeBuilder = function(container){
		MUI.create('MUI.Tree', {
			container:container,
			id:container + 'tree1',
			content: {url: 'data/tree-testdata.json'},
			onNodeExpanded: function(node, isExpanded, self){
				MUI.writeConsole(self.options.id + ' receieved onNodeExpanded command on node ' + node.value + ', isExpanded=' + isExpanded)
			},
			onNodeChecked: function(node, checked, self){
				MUI.writeConsole(self.options.id + ' receieved onNodeChecked command on node ' + node.value + ', checked=' + checked);
			},
			onNodeSelected: function(node, self){
				MUI.writeConsole(self.options.id + ' receieved onNodeSelected command on node ' + node.value)
			}
		});
	};

	MUI.parametricsWindow = function(){
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
	};
	if ($('parametricsLinkCheck')){
		$('parametricsLinkCheck').addEvent('click', function(e){
			e.stop();
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
					addClass: 'panelAlt',
					content: {url: 'pages/lipsum.html'},
					column: 'splitWindow_sideColumn'
				});

			}
		});
	};
	if ($('splitWindowLinkCheck')){
		$('splitWindowLinkCheck').addEvent('click', function(e){
			e.stop();
			MUI.splitWindow();
		});
	}

	MUI.fxmorpherWindow = function(){
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
	};

	// Examples > Tests
	MUI.serverRepsonseWindow = function(response){
		new MUI.Window({
			id: 'serverResponse',
			content: response,
			width: 350,
			height: 350
		});
	};

	MUI.eventsWindow = function(){
		new MUI.Window({
			id: 'windowevents',
			title: 'Window Events',
			content: {url: 'pages/events.html'},
			width: 340,
			height: 255,
			onLoaded: function(){
				MUI.notification('Window content was loaded.');
			},
			onCloseComplete: function(){
				MUI.notification('The window is closed.');
			},
			onMinimize: function(){
				MUI.notification('Window was minimized.');
			},
			onMaximize: function(){
				MUI.notification('Window was maximized.');
			},
			onRestore: function(){
				MUI.notification('Window was restored.');
			},
			onResize: function(){
				MUI.notification('Window was resized.');
			},
			onFocus: function(){
				MUI.notification('Window was focused.');
			},
			onBlur: function(){
				MUI.notification('Window lost focus.');
			},
			onDragStart: function(){
				MUI.notification('Window is being dragged.');
			},
			onDragComplete: function(){
				MUI.notification('Window drag complete.');
			}
		});
	};
	if ($('windoweventsLinkCheck')){
		$('windoweventsLinkCheck').addEvent('click', function(e){
			e.stop();
			MUI.eventsWindow();
		});
	}

	MUI.containerTestWindow = function(){
		new MUI.Window({
			id: 'containertest',
			title: 'Container Test',
			content: {url: 'pages/lipsum.html'},
			container: 'pageWrapper',
			width: 340,
			height: 150,
			x: 100,
			y: 100
		});
	};
	if ($('containertestLinkCheck')){
		$('containertestLinkCheck').addEvent('click', function(e){
			e.stop();
			MUI.containerTestWindow();
		});
	}

	MUI.iframeTestsWindow = function(){
		new MUI.Window({
			id: 'iframetests',
			title: 'Iframe Tests',
			content: {
				url: 'pages/iframetests.html',
				loadMethod: 'iframe'
			}
		});
	};
	if ($('iframetestsLinkCheck')){
		$('iframetestsLinkCheck').addEvent('click', function(e){
			e.stop();
			MUI.iframeTestsWindow();
		});
	}

	MUI.formTestsWindow = function(){
		new MUI.Window({
			id: 'formtests',
			title: 'Form Tests',
			content: {url: 'pages/formtests.html'},
			onLoaded: function(){
				document.testForm.focusTest.focus();
			}
		});
	};
	if ($('formtestsLinkCheck')){
		$('formtestsLinkCheck').addEvent('click', function(e){
			e.stop();
			MUI.formTestsWindow();
		});
	}

	MUI.accordionTestWindow = function(){
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
				MUI.create('MUI.Accordion', {
					'container': id,
					'idField': 'value',
					'panels': content.content
				});
			}
		});
	};

	MUI.noCanvasWindow = function(){
		new MUI.Window({
			id: 'nocanvas',
			title: 'No Canvas',
			content: {url: 'pages/lipsum.html'},
			addClass: 'no-canvas',
			width: 305,
			height: 175,
			shadowBlur: 0,
			resizeLimit: {'x': [275, 2500], 'y': [125, 2000]},
			useCanvas: false,
			useCSS3: false
		});
	};
	if ($('noCanvasLinkCheck')){
		$('noCanvasLinkCheck').addEvent('click', function(e){
			e.stop();
			MUI.noCanvasWindow();
		});
	}

	MUI.css3Window = function(){
		new MUI.Window({
			id: 'css3',
			title: 'CSS3',
			content: {url: 'pages/lipsum.html'},
			addClass: 'no-canvas',
			width: 305,
			height: 175,
			resizable: true,
			useCanvas: false,
			useCSS3: true
		});
	};
	if ($('CSS3LinkCheck')){
		$('CSS3LinkCheck').addEvent('click', function(e){
			e.stop();
			MUI.css3Window();
		});
	}

	MUI.css3fallbackWindow = function(){
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
	};
	if ($('CSS3fallbackLinkCheck')){
		$('CSS3fallbackLinkCheck').addEvent('click', function(e){
			e.stop();
			MUI.css3fallbackWindow();
		});
	}

	MUI.modalCount = 0;
	MUI.CreateModal = function(){
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
					MUI.CreateModal();
				});
			}
		});
	};

	MUI.forceCanvasWindow = function(){
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
	};
	if ($('forceCanvasLinkCheck')){
		$('forceCanvasLinkCheck').addEvent('click', function(e){
			e.stop();
			MUI.forceCanvasWindow();
		});
	}

	// add ability to test column and panel closing
	if ($('closePanelCheck')){
		$('closePanelCheck').addEvent('click', function(e){
			e.stop();
			var stop = false;
			MUI.each(function(instance){
				if (!stop && instance.className == 'MUI.Panel'){
					instance.close();
					stop = true;
				}
			});
		});
	}
	if ($('closeColumnCheck')){
		$('closeColumnCheck').addEvent('click', function(e){
			e.stop();
			var stop = false;
			MUI.each(function(instance){
				if (!stop && instance.className == 'MUI.Column'){
					instance.close();
					stop = true;
				}
			});
		});
	}

	// View
	if ($('sidebarLinkCheck')){
		$('sidebarLinkCheck').addEvent('click', function(e){
			e.stop();
			MUI.Desktop.sidebarToggle();
		});
	}

	if ($('cascadeLink')){
		$('cascadeLink').addEvent('click', function(e){
			e.stop();
			MUI.Windows.arrangeCascade();
		});
	}

	if ($('tileLink')){
		$('tileLink').addEvent('click', function(e){
			e.stop();
			MUI.Windows.arrangeTile();
		});
	}

	if ($('closeLink')){
		$('closeLink').addEvent('click', function(e){
			e.stop();
			MUI.Windows.closeAll();
		});
	}

	if ($('minimizeLink')){
		$('minimizeLink').addEvent('click', function(e){
			e.stop();
			MUI.Windows.minimizeAll();
		});
	}

	// Tools
	MUI.builderWindow = function(){
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
	};
	if ($('builderLinkCheck')){
		$('builderLinkCheck').addEvent('click', function(e){
			e.stop();
			MUI.builderWindow();
		});
	}

	if ($('toggleStandardEffectsLinkCheck')){
		$('toggleStandardEffectsLinkCheck').addEvent('click', function(e){
			e.stop();
			MUI.toggleStandardEffects($('toggleStandardEffectsLinkCheck'));
		});
		if (MUI.options.standardEffects){
			MUI.toggleStandardEffectsLink = new Element('div', {
				'class': 'check',
				'id': 'toggleStandardEffects_check'
			}).inject($('toggleStandardEffectsLinkCheck'));
		}
	}

	if ($('toggleAdvancedEffectsLinkCheck')){
		$('toggleAdvancedEffectsLinkCheck').addEvent('click', function(e){
			e.stop();
			MUI.toggleAdvancedEffects($('toggleAdvancedEffectsLinkCheck'));
		});
		if (MUI.options.advancedEffects){
			MUI.toggleAdvancedEffectsLink = new Element('div', {
				'class': 'check',
				'id': 'toggleAdvancedEffects_check'
			}).inject($('toggleAdvancedEffectsLinkCheck'));
		}
	}

	// Workspaces
	if ($('saveWorkspaceLink')){
		$('saveWorkspaceLink').addEvent('click', function(e){
			e.stop();
			MUI.Desktop.saveWorkspace();
		});
	}

	if ($('loadWorkspaceLink')){
		$('loadWorkspaceLink').addEvent('click', function(e){
			e.stop();
			MUI.Desktop.loadWorkspace();
		});
	}

	// Help
	MUI.featuresWindow = function(){
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
						MUI.create('MUI.Tabs', {
							'id': 'features_toolbar',
							'container': 'features',
							'position': 'top',
							'tabs': content.content,
							'partner': 'features'
						});
					}
				}
			]
		});
	};
	if ($('featuresLinkCheck')){
		$('featuresLinkCheck').addEvent('click', function(e){
			e.stop();
			MUI.featuresWindow();
		});
	}

	MUI.aboutWindow = function(){
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
	};
	if ($('aboutLink')){
		$('aboutLink').addEvent('click', function(e){
			e.stop();
			MUI.aboutWindow();
		});
	}

	// Misc
	MUI.authorsWindow = function(){
		new MUI.Modal({
			id: 'authorsWindow',
			title: 'AUTHORS.txt',
			content: {url: 'scripts/AUTHORS.txt'},
			width: 400,
			height: 250,
			scrollbars: true
		});
	};
	if ($('authorsLink')){
		$('authorsLink').addEvent('click', function(e){
			e.stop();
			MUI.authorsWindow();
		});
	}

	MUI.licenseWindow = function(){
		new MUI.Modal({
			id: 'License',
			title: 'MIT-LICENSE.txt',
			content: {url: 'scripts/MIT-LICENSE.txt'},
			width: 580,
			height: 350,
			scrollbars: true
		});
	};
	if ($('licenseLink')){
		$('licenseLink').addEvent('click', function(e){
			e.stop();
			MUI.licenseWindow();
		});
	}

	// Deactivate menu header links
	$$('a.returnFalse').each(function(el){
		el.addEvent('click', function(e){
			e.stop();
		});
	});

	// Build windows onLoad
	MUI.parametricsWindow();
	MUI.myChain.callChain();
};

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


var initializeColumns = function(){

	new MUI.Column({
		id: 'sideColumn1',
		placement: 'left',
		width: 205,
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
		content: {
			url: 'data/file-tree.json',
			loadMethod: 'json',
			onLoaded: function(el, content){
				var mainPanel = $('mainPanel');
				MUI.create('MUI.Tree', {
					'container': 'files-panel',
					'idField': 'value',
					'nodes': content.content,
					'onLoaded': function(){
						$('notesLink').addEvent('click', function(){
							MUI.Content.update({
								element: mainPanel,
								url: 'pages/notes.html',
								title: 'Development Notes'
							});
						});
						if ($('plistLink')){
							$('plistLink').addEvent('click', function(e){
								e.stop();
								MUI.listBuilder('mainPanel');
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
								MUI.listBuilder('basicListWindow');
							});
						}
						if ($('pcbgLink')){
							$('pcbgLink').addEvent('click', function(e){
								e.stop();
								MUI.cbgBuilder('mainPanel');
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
								MUI.cbgBuilder('cbgWindow');
							});
						}
						if ($('pslLink')){
							$('pslLink').addEvent('click', function(e){
								e.stop();
								MUI.slBuilder('mainPanel');
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
								MUI.slBuilder('slWindow');
							});
						}
						if ($('pibLink')){
							$('pibLink').addEvent('click', function(e){
								e.stop();
								MUI.ibBuilder('mainPanel');
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
								MUI.ibBuilder('wiWindow');
							});
						}

						if ($('ptaLink')){
							$('ptaLink').addEvent('click', function(e){
								e.stop();
								MUI.taBuilder('mainPanel');
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
								MUI.taBuilder('taWindow');
							});
						}

						if ($('ptbLink')){
							$('ptbLink').addEvent('click', function(e){
								e.stop();
								MUI.tbBuilder('mainPanel');
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
								MUI.tbBuilder('tbWindow');
							});
						}

						if ($('ptreeLink')){
							$('ptreeLink').addEvent('click', function(e){
								e.stop();
								MUI.treeBuilder('mainPanel');
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
								MUI.treeBuilder('wtreeLinkWindow');
							});
						}

						$('xhrLink').addEvent('click', function(){
							MUI.Content.update({
								element: mainPanel,
								url: 'pages/lipsum.html',
								title: 'Lorem Ipsum'
							});
						});
						$('youtube4Link').addEvent('click', function(){
							MUI.Content.update({
								element: mainPanel,
								loadMethod: 'iframe',
								url: 'pages/youtube.html',
								title: 'Iframe: YouTube'
							});
						});
						$('splitPanelLink').addEvent('click', function(){
							MUI.Content.update({
								element: mainPanel,
								title: 'Split Panel'
							});
							MUI.splitPanelPanel(); // This is initialized in mocha-init.js just like the windows.
						});
						$('splitWindowLink').addEvent('click', function(){
							MUI.splitWindow();
						});
						$('ajaxpageLink').addEvent('click', function(){
							MUI.ajaxpageWindow();
						});
						$('jsonLink').addEvent('click', function(){
							MUI.jsonWindows();
						});
						$('youtubeLink').addEvent('click', function(){
							MUI.youtubeWindow();
						});
						$('clockLink').addEvent('click', function(){
							MUI.clockWindow();
						});
						$('parametricsLink').addEvent('click', function(){
							MUI.parametricsWindow();
						});
						$('pcalendarLink').addEvent('click', function(){
							MUI.Content.update({
								element: mainPanel,
								url: '{controls}calendar/demo.html',
								title: 'Calendar Component',
								padding: {top: 8, right: 8, bottom: 8, left: 8},
								onLoaded:function(){
									MUI.create('MUI.Calendar', {'id': 'date1', format: 'd/m/Y', direction: 1, tweak: {x: 6, y: 0}});
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
									MUI.create('MUI.Calendar', {'id': 'wcalendarLink1', 'container': 'cslWindow', format: 'd/m/Y', direction: 1, tweak: {x: 6, y: 0}});
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
							MUI.fxmorpherWindow();
						});

						$('paccordiontestLink').addEvent('click', function(e){
							e.stop();
							MUI.create('MUI.Accordion', {
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
							MUI.accordionTestWindow();
						});

						$('modalLink').addEvent('click', function(e){
							e.stop();
							MUI.CreateModal();
						});
					}
				});
			}
		},
		column: 'sideColumn1',
		padding: 8
	});

	new MUI.Panel({
		id: 'panel2',
		title: 'Ajax Form',
		content: {
			url: 'pages/ajax.form.html',
			onLoaded: function(){
				$('myForm').addEvent('submit', function(e){
					e.stop();

					$('spinner').show();
					if ($('postContent') && MUI.options.standardEffects){
						$('postContent').setStyle('opacity', 0);
					} else {
						$('mainPanel_pad').empty();
					}

					this.set('send', {
						onComplete: function(response){
							MUI.Content.update({
								'element': 'mainPanel',
								'content': response,
								'title': 'Ajax Response',
								'padding': {top: 8, right: 8, bottom: 8, left: 8}
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
		},
		column: 'sideColumn1',
		height: 230
	});

	// we want to all resize events also the ones that get fired before onLoaded/addResizeElements
	var countResizeEvents = {
		mainPanel: 0,
		panel3: 0
	};

	var addResizeElements = function(){
		var panel = this.el.contentWrapper;
		var pad = panel.getElement('.pad');
		pad.appendText('Width: ');
		this.displayWidthEl = new Element('span', {
			'text': panel.getStyle('width')
		}).inject(pad);
		pad.appendText(' Height: ');
		this.displayHeightEl = new Element('span', {
			'text': panel.getStyle('height')
		}).inject(pad);
		pad.appendText(' Resize Events fired: ');
		this.countEvents = new Element('span', {
			'text': countResizeEvents[this.id]
		}).inject(pad);
	};

	var updateResizeElements = function(){
		countResizeEvents[this.id]++;
		if (this.countEvents) this.countEvents.set('text', countResizeEvents[this.id]);
		var newSize = this.el.contentWrapper.getStyles(['width', 'height']);
		if (this.displayWidthEl) this.displayWidthEl.set('text', newSize['width']);
		if (this.displayHeightEl) this.displayHeightEl.set('text', newSize['height']);
	};

	// Add panels to main column
	new MUI.Panel({
		id: 'mainPanel',
		title: 'Lorem Ipsum',
		column: 'mainColumn',
		content: [
			{url: 'pages/lipsum.html'},
			{section: 'search', position: 'headertool', control: 'famfamfam'},
			{
				section: 'search',
				position: 'headertool',
				url: 'pages/toolbar-demo2.html',
				onLoaded: function(){
					if ($('demoSearch')){
						$('demoSearch').addEvent('submit', function(e){
							e.stop();
							$('spinner').setStyle('visibility', 'visible');
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
					addResizeElements.apply(MUI.get('mainPanel'));
				}
			}
		],
		onResize: updateResizeElements
	});

	new MUI.Panel({
		id: 'mochaConsole',
		addClass: 'mochaConsole',
		title: 'Console',
		column: 'mainColumn',
		height: 200,
		content: [
			{content: 'pages/blank.html'},
			{section: 'search', position: 'headertool', control: 'famfamfam'},
			{section: 'buttons1', position: 'headertool', element: 'mainPanel', control: 'MUI.Toolbar', buttons: [
				{id: 'button', type: 'image', text: 'Button 1', title: 'Click to do something 1', image: '{fff}accept.png'},
				{id: 'button', type: 'image', text: 'Button 2', title: 'Click to do something 2'}
			],
			onClick: function(){
					MUI.notification('Do Something');
					return true;
				}
			},
			{section: 'buttons2', position: 'headertool', element: 'mainPanel', control: 'MUI.Toolbar', buttons: [
				{id: 'button', type: 'html', text: 'Button 3', title: 'Click to do something 3'},
				{id: 'go', cssClass: 'icon_application_go', title: 'Go'},
				{id: 'get', cssClass: 'icon_application_get'},
				{id: 'home', cssClass: 'icon_application_home', onClick: function(){
						MUI.notification('Do Something Else');
					}
				}],
				onClick:function(){
					MUI.notification('Do Something');
					return true;
				}
			}
		]
	});

	// Add panels to second side column

	new MUI.Panel({
		id: 'help-panel',
		column: 'sideColumn2',
		content: [
			{
				position: 'header',
				empty: true,
				loadMethod: 'json',
				control: 'MUI.Tabs',
				options: {
					tabs: [
						{'text': 'Overview', 'url': 'pages/overview.html', 'title': 'Overview'},
						{'text': 'Download', 'url': 'pages/download.html', 'title': 'Download'}
					]
				}
			}
		]
	});

	var panel3 = new MUI.Panel({
		id: 'panel3',
		title: 'Collapsed Panel',
		isCollapsed: true,
		content: {
			url: 'pages/lipsum.html',
			onLoaded: addResizeElements
		},
		column: 'sideColumn2',
		height: 120,
		onResize: updateResizeElements,
		onCollapse: function(){
			MUI.Content.update({element: 'panel3', title: 'Collapsed Panel'});
		},
		onExpand: function(){
			MUI.Content.update({element: 'panel3', title: 'Expanded Panel'});
		}
	});

	new MUI.Panel({
		id: 'tips-panel',
		title: 'Tips',
		column: 'sideColumn2',
		height: 140,
		content: [
			{url: 'pages/tips.html'},
			{
				position: 'footer',
				url: 'pages/toolbar-demo.html',
				onLoaded: function(){
					this.el.footer.getElements('.demoAction').removeEvents().addEvent('click', function(){
						MUI.notification('Do Something');
					});
				}
			}
		]
	});

	MUI.splitPanelPanel = function(){
		if ($('mainPanel')){
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
				column: 'mainColumn2'
			});

			new MUI.Panel({
				header: false,
				id: 'splitPanel_sidePanel',
				addClass: 'panelAlt',
				content: {url: 'pages/lipsum.html'},
				column: 'sideColumn3'
			});
		}
	};

	MUI.myChain.callChain();
};

// Initialize MochaUI options
MUI.initialize();

// Initialize MochaUI when the DOM is ready
window.addEvent('load', function(){ //using load instead of domready for IE8
	MUI.myChain = new Chain();
	MUI.myChain.chain(
					 function(){
						 MUI.Desktop.initialize();
						 MUI.myChain.callChain();
					 },
					 function(){
						 initializeColumns();
					 },
					 function(){
						 initializeWindows();
					 }
			).callChain();
});
