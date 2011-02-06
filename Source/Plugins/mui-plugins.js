/*
 ---
 name: MUI-Plugins

 script: mui-plugins.js

 description: Root MochaUI Plugins - Loads all MochaUI plugins.

 copyright: (c) 2010 Contributors in (/AUTHORS.txt).

 license: MIT-style license in (/MIT-LICENSE.txt).

 ...
 */

Object.append(MUI.plugins, {

	'coolclock':{'samples':['demo'],'description':'Cool Clock Plugin','js':['{control}moreskins.js','{control}coolclock.js']},
	'famfamfam':{'samples':['index'],'description':'Fam Fam Fam Icon Set Plugin','css':['{plugin}style.css'],'js':[],'loadOnly':true,paths:{'fff':'{plugin}icons/'}},
	'fx.morpher':{'samples':['demo'],'data':['json'],'description':'Morph on Steroids Plugin','css':['{plugin}style.css']},
	'parametrics':{'samples':['demo'],'description':'Parametrics Dialog Plugin','loadOnly':true},
	'windowform':{'samples':['demo'],'description':'Window From Form Plugin','css':['{plugin}style.css']}

});

