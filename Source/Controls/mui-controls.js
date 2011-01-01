/*
 ---
 name: MUI-Controls

 script: mui-controls.js

 description: Root MochaUI Controls - Loads all MochaUI controls.

 copyright: (c) 2010 Contributors in (/AUTHORS.txt).

 license: MIT-style license in (/MIT-LICENSE.txt).

 note:
 This documentation is taken directly from the javascript source files. It is built using Natural Docs.
 ...
 */

MUI.files['{controls}mui-controls.js'] = 'loaded';

Object.append(MUI.controls, {

	'accordion':{'samples':[,'demo','index'],data:['json','html'],'description':'Accordion','isFormControl':true,'css':['{theme}css/accordion.css']},
	'calendar':{'samples':['demo','index'],data:['json'],'description':'Calendar','isFormControl':true,'css':['{theme}css/calendar.css']},
	'checkboxgrid':{'samples':['demo','index'],data:['json'],'description':'Check Box Grid','isFormControl':true,'css':['{theme}css/checkboxgrid.css']},
	'column':{'samples':['demo'],data:['json'],'description':'Column','isFormControl':true,'css':['{theme}css/desktop.css']},
	'imagebutton':{'samples':['demo','index'],data:['json'],'description':'Image Button','isFormControl':true,'css':['{theme}css/imagebutton.css']},
	'list':{'samples':['demo','index'],data:['json'],'description':'Basic List','isFormControl':true,'css':['{theme}css/list.css']},
	'modal':{'samples':['demo'],data:['json'],'description':'Modal','isFormControl':true,'css':['{theme}css/desktop.css'],location:'window'},
	'grid':{'samples':['index'],data:['json'],'description':'Grid','isFtextbox.cssormControl':true,'css':['{theme}css/grid.css']},
	'panel':{'samples':['demo'],data:['json'],'description':'Panel','isFormControl':true,'css':['{theme}css/desktop.css']},
	'selectlist':{'samples':['demo','index'],data:['json','html'],'description':'Select List','isFormControl':true,'css':['{theme}css/selectlist.css']},
	'tabs':{'samples':['index'],data:['json','html'],'description':'Tabs','isFormControl':true,'css':['{theme}css/tab.css']},
	'taskbar':{'samples':['demo'],data:['json'],'description':'Taskbar','isFormControl':true,'css':['{theme}css/taskbar.css']},
	'textarea':{'samples':['index','demo'],data:['json','html'],'description':'Text Area','isFormControl':true,'css':['{theme}css/textbox.css']},
	'textbox':{'samples':['index','demo'],data:['json'],'description':'Text Box','isFormControl':true,'css':['{theme}css/textbox.css']},
	'tree':{'samples':['index','demo'],data:['json'],'description':'Tree','isFormControl':true,'css':['{theme}css/tree.css']},
	'toolbar':{'samples':['index'],data:['json'],'description':'Toolbar','isFormControl':true,'css':['{theme}css/toolbar.css']},
	'dock':{'samples':['index'],data:['json'],'description':'Toolbar Dock','isFormControl':false,'css':['{theme}css/toolbar.css']},
	'dockhtml':{'samples':['index'],data:['json'],'description':'Toolbar HTML Block','isFormControl':false,'css':['{theme}css/toolbar.css']},
	'menu':{'samples':['index'],data:['json'],'description':'Toolbar Menu','isFormControl':false,'css':['{theme}css/menu.css']},
	'spinner':{'samples':['index'],data:['json'],'description':'Toolbar Spinner','isFormControl':false,'css':['{theme}css/toolbar.css']},
	'themechange':{'samples':['index'],data:['json'],'description':'Toolbar Menu','isFormControl':false,'css':['{theme}css/toolbar.css'],'js':['{control}themechange.js','{source}Core/Themes.js']},
	'window':{'samples':['demo'],data:['json'],'description':'Modal','isFormControl':true,'css':['{theme}css/window.css']}

});

