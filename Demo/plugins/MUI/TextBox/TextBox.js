/*

Script: TextBox.js
	Creates a textbox control control

Copyright:
	Copyright (c) 2010 Chris Doty, <http://polaropposite.com/>.

License:
	MIT-style license.

*/

MUI.files[MUI.path.plugins + 'MUI/TextBox/TextBox.js'] = 'loaded';

MUI.TextBox = new Class({

Implements: [Events, Options],

options: {
     id:            ''              // id of the primary element, and id os control that is registered with mocha
    ,container:     null            // the parent control in the document to add the control to
    ,createOnInit:  true            // true to add textbox to container when control is initialized
    ,cssClass:      'form'          // the primary css tag
    ,type:          'text'          // this is a text field

    ,maskType:      'none'          // type of mask to apply  ['Fixed','Regexp','Reverse']
    ,maskOptions:   {}              // the field mask

    ,valueField:    false           // defaults to the id on this field
    ,formTitleField:false           // defaults to the id of this field
    ,formData:      false           // used in conjunction with the above Fields to get/set value in an object

    ,formTitle:     ''              // defaults to the id of this field
    ,value:         ''              // the currently textbox's value
},

initialize: function( options )
{
    var self=this;
    self.setOptions(options);
    var o=self.options;

    // make sure this controls has an ID
    var id=o.id;
    if(!id) { id='textbox' + (++MUI.IDCount); o.id=id; }

    // create sub items if available
    if(o.createOnInit && o.container!=null) this.toDOM();
    else {
        window.addEvent('domready', function() {
            var el=$(id);
            if(el!=null) {
                self.fromHTML();
                self.checkForMask();
            }
        });
    }

    MUI.set(id,this);
},

checkForMask: function() {
    var self=this;
    var o=self.options;

    if(o.maskType!='none' && (!MUI.Mask || !MUI.Mask[o.maskType]) && self.element ) {
        o.maskType=self.upperCamelize(o.maskType);

        new MUI.Require({
            js: ['Mask.js','Mask.'+o.maskType.split('.')[0]+'.js'],
            onload: function(){
                var options=$H({});
                options.extend(o.maskOptions);
                var klass=self.getMaskClassOptions(o.maskType);
                new klass(self.element,options);
            }
        });                                
    }
},

upperCamelize: function(str){
    return str.camelCase().capitalize();
},
	
getMaskClassOptions: function(maskType) {
    var classNames = [];
    if (maskType) classNames = maskType.split('.');
    return (classNames[1] ? MUI.Mask[this.upperCamelize(classNames[0])][this.upperCamelize(classNames[1])] : MUI.Mask[this.upperCamelize(classNames[0])]);
},

_getData: function(item,property){
    if(!item || !property) return '';
    if(item[property]==null) return '';
    return item[property];
},

getFieldTitle: function() {
    var self=this;
    var o=self.options;

    if(o.formTitleField) return self._getData(o.formData,o.formTitleField);
    if(o.formData) return self._getData(o.formData,o.id);
    return o.id;
},

fromHTML: function() {
    var self=this;
    var o=self.options;

    var inp=$(o.id);
    if(!inp) return self;
    self.element = inp;

    if(inp.get('type')) o.type=inp.get('type');
    o.value=inp.get('defaultValue');
    if(inp.get('class')) o.cssClass=inp.get('class');

    self.toDOM();
    return self;
},
    
toDOM: function(containerEl)
{
    var self=this;        
    var o=self.options;

    var isNew = false;
    var inp=$(o.id);
    if(!inp) {
        inp=new Element('input',{'id':o.id,'type':o.type});
        isNew=true;
    }
    if(o.cssClass) {
        inp.set('class',o.cssClass);
    }
    self.element = inp;

    var value=o.value;
    if(o.formTitleField) value=self._getData(o.formData,o.valueField);
    else if(o.formData) value=self._getData(o.formData,o.id);
    inp.set('value',value);

    if(!isNew) return inp;

    window.addEvent('domready', function() {
        var container=$(containerEl ? containerEl : o.container);
        inp.inject(container);
        self.checkForMask();
    });

    return inp;
}

});
