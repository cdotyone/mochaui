/*

Script: Accordian.js
	Creates a generic accordian control

Copyright:
	Copyright (c) 2010 Chris Doty, <http://polaropposite.com/>.

License:
	MIT-style license.

*/

MUI.files[MUI.path.plugins + 'MUI/Accordion/Accordion.js'] = 'loaded';

MUI.Accordion = new Class({

Implements: [Events, Options],

options: {
     id:                ''              // id of the primary element, and id os control that is registered with mocha
    ,container:         null            // the parent control in the document to add the control to
    ,createOnInit:      true            // true to add accordian to container when control is initialized
    ,cssClass:          'accordian'     // the primary css tag

    ,panels:            $A([])           // the list of accordian panels

    ,textField:         'text'          // the name of the field that has the panels toggler text
    ,valueField:        'value'         // the name of the field that has the panels toggler values
    ,titleField:        'title'         // the name of the field that has the panels tip text
    ,contentField:      'html'          // the field that contains the name of the field that has the content for the panel

    ,value:             ''              // the currently selected panel's value
    ,selectedPanel:     null            // the currently selected panel
    ,height:            false           // If set, displayed elements will have a fixed height equal to the specified value.
    ,width:             false           // If set, displayed elements will have a fixed width equal to the specified value.

    ,heightFx:          true            // If set to true, a height transition effect will take place when switching between displayed elements.
    ,widthFx:           false           // If set to true, it will add a width transition to the accordion when switching between displayed elements. Warning: CSS mastery is required to make this work!
    ,opacity:           false           // If set to true, an opacity transition effect will take place when switching between displayed elements.
    ,alwaysHide:        false           // If set to true, it will be possible to close all displayable elements. Otherwise, one will remain open at all time.
    ,initialDisplayFx:  true            // If set to false, the initial item displayed will not display with an effect but will just be shown immediately.
        
    ,onPanelSelected:   $empty          // event: when a panel is opened
},

initialize: function( options )
{
    var self=this;
    self.setOptions(options);
    var o=self.options;

    // make sure this controls has an ID
    var id=o.id;
    if(!id) { id='accordian' + (++MUI.IDCount); o.id=id; }

    // create sub items if available
    if(o.createOnInit && o.panels.length>0) self.toDOM();
    else {
        window.addEvent('domready', function() {
            var el=$(id);
            if(el!=null) self.fromHTML();
        });
    }

    MUI.set(id,self);    
},

_getData: function(item,property){
    if(!item || !property) return '';
    if(item[property]==null) return '';
    return item[property];
},

fromHTML: function(el)
{
    var self=this;
    var o=self.options;
    if(!el) el = $(o.id);
    else el=$(el);
    if(!el) return;

    o.cssClass = el.get('class');

    var panels=$A([]);
    var togglerEls=el.getElements('h3.toggler');
    var panelEls=el.getElements('div.element');

    for(var i=0;i<togglerEls.length;i++) {
        var togglerEl=togglerEls[i];
        if(i>=panelEls.length) break;

        var toggler={};

        var value=togglerEl.get('id');
        var text=togglerEl.get('text');
        if(!value) value=text;
        if(togglerEl.hasClass('open')) o.value=value;

        var title=togglerEl.get('title');
        if(title) toggler[o.titleField]=title;

        toggler[o.valueField] = value;
        toggler[o.textField] = text;
        toggler[o.contentField] = panelEls[i].get('html');
        panels.push(toggler);
    }
    
    o.panels = panels;
    self.toDOM();
},

toDOM: function(containerEl)
{
    var self=this;
    var o=self.options;

    var isNew = false;

    // build primary wrapper div
    var div=$(o.id);
    var ul;
    if(!div) {
        div=new Element('div',{'id':o.id});
        isNew=true;
    } else div.empty();
    if(o.cssClass) div.set('class',o.cssClass);
    self.element = div;

    // create main panel container
    self._panelsElement=new Element('div',{'class':'panels'}).inject(div);

    // if no tab selected, then select first tab for them
    if(o.panels.length>0 && (o.value==null || o.value=='')) o.value=self._getData(o.panels[0],o.valueField);

    // build all tabs
    self._togglers = [];
    self._panels = [];
    $A(o.panels).each(function(panel) { self.buildPanel(panel,self._panelsElement); } );
    if(self._panels.length>1) {
        self._togglers[0].addClass('first');
        self._togglers[self._panels.length-1].addClass('last');
    }


    var attachToDOM = function() {
        if(isNew) {
            var container=$(containerEl ? containerEl : o.container);
            container.appendChild(div);
        }
        
        self._accordian=new Fx.Accordion(self._togglers,self._panels,
            {
             'height':o.heightFx
            ,'width':o.widthFx
            ,'opacity':o.opacity
            ,'fixedHeight':o.height
            ,'fixedWidth':o.width
            ,'alwaysHide':o.alwaysHide
            ,'initialDisplayFx':o.initialDisplayFx
            ,onActive: function(toggler){
                toggler.addClass('open');
            }
            ,onBackground: function(toggler){
                toggler.removeClass('open');
            }
        });
    };

    if(!isNew) {
        attachToDOM();
        return this;
    }
    
    window.addEvent('domready',attachToDOM);

    return div;
},

buildPanel: function(panel,div) {
    var self = this;
    var o=self.options;

    var value=self._getData(panel,o.valueField);
    if(!value) value='apanel' + (++MUI.IDCount);
    var text=self._getData(panel,o.textField);
    var title=self._getData(panel,o.titleField);
    var html=self._getData(panel,o.contentField);

    panel._togglerEl = new Element('h3',{'id':value,'class':'toggler','text':text,'title':title}).inject(div);
    panel._element = new Element('div',{'id':value+'_panel','class':'element'}).inject(div);
    panel._contentEl = new Element('div',{'class':'content','html':html}).inject(panel._element);

    self._togglers.push(panel._togglerEl);
    self._panels.push(panel._element);
}

});
