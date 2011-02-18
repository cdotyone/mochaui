/*
 ---

 name: MUI-Plugins

 script: mui-plugins.js

 description: Root MochaUI Plugins - Loads all MochaUI plugins.

 copyright: (c) 2011 Contributors in (/AUTHORS.txt).

 license: MIT-style license in (/MIT-LICENSE.txt).

 ...
 */

Object.append(MUI.plugins, {

	'coolclock':{'samples':['demo'],'description':'Cool Clock Plugin','js':['{plugin}coolclock.js','{plugin}moreskins.js','{plugin}muiclock.js'],'loadOnly':true},
	'famfamfam':{'samples':['index'],'description':'Fam Fam Fam Icon Set Plugin','css':['{plugin}style.css'],'js':[],paths:{'fff':'{plugin}icons/'},'loadOnly':true},
	'notimoo':{'samples':['demo'],'description':'Growl style notifications','css':['{plugin}notimoo.css']},
	'parametrics':{'samples':['demo'],'description':'Parametrics Dialog Plugin','loadOnly':true},
	'windowform':{'samples':['demo'],'description':'Window From Form Plugin','css':['{plugin}style.css']}

});
