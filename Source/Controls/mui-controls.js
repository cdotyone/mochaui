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

$extend(MUI.classes, {

	'accordion':{'samples':['html','js'],'description':'Accordion','isFormControl':true,'css':['{controls}accordion/style.css']},
	'calender':{'samples':['html'],'description':'Calender','isFormControl':true},
	'checkboxgrid':{'samples':['js'],'description':'Check Box Grid','isFormControl':true},
	'imagebutton':{'samples':['js'],'description':'Image Button','isFormControl':true},
	'list':{'samples':['js'],'description':'List','isFormControl':true},
	'omnigrid':{'samples':['js'],'description':'OmniGrid','isFormControl':true},
	'selectlist':{'samples':['html','js'],'description':'Radio/Checbox List','isFormControl':true},
	'tabs':{'samples':['html','js'],'description':'Tabs','isFormControl':true,'css':['{theme}css/tabs.css']},
	'textarea':{'samples':['html','js'],'description':'Text Area','isFormControl':true},
	'textbox':{'samples':['js'],'description':'Text Box','isFormControl':true},
	'tree':{'samples':['js'],'description':'Tree','isFormControl':true,'css':['{controls}tree/style.css']},
	'coolclock':{'samples':['js'],'location':'plugins','description':'Clock'}

});

