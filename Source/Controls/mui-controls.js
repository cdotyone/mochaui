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

	'accordion':{'samples':[,'demo','index'],data:['json','html'],'description':'Accordion','isFormControl':true,'css':['{theme}css/Accordion.css']},
	'calendar':{'samples':['demo','index'],data:['json'],'description':'Calendar','isFormControl':true,'css':['{theme}css/Calendar.css']},
	'checkboxgrid':{'samples':['demo','index'],data:['json'],'description':'Check Box Grid','isFormControl':true,'css':['{theme}css/CheckBoxGrid.css']},
	'imagebutton':{'samples':['demo','index'],data:['json'],'description':'Image Button','isFormControl':true,'css':['{theme}css/ImageButton.css']},
	'list':{'samples':['demo','index'],data:['json'],'description':'Basic List','isFormControl':true,'css':['{theme}css/List.css']},
	'omnigrid':{'samples':['index'],data:['json'],'description':'OmniGrid','isFormControl':true,'css':['{theme}css/OmniGrid.css']},
	'selectlist':{'samples':['demo','index'],data:['json','html'],'description':'Select List','isFormControl':true,'css':['{theme}css/SelectList.css']},
	'tabs':{'samples':['index'],data:['json','html'],'description':'Tabs','isFormControl':true,'css':['{theme}css/Tabs.css']},
	'textarea':{'samples':['index','demo'],data:['json','html'],'description':'Text Area','isFormControl':true,'css':['{theme}css/TextBox.css']},
	'textbox':{'samples':['index','demo'],data:['json'],'description':'Text Box','isFormControl':true,'css':['{theme}css/TextBox.css']},
	'tree':{'samples':['index','demo'],data:['json'],'description':'Tree','isFormControl':true,'css':['{theme}css/Tree.css']}

});

