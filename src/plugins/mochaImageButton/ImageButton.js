/*

Script: ImageButton.js
	Creates a button with an image on it

Copyright:
	Copyright (c) 2010 Chris Doty, <http://polaropposite.com/>.

License:
	MIT-style license.

*/

MUI.files[MUI.path.plugins + 'mochaImageButton/ImageButton.js'] = 'loaded';

MUI.ImageButton = new Class({
Implements: [Events, Options],
options: {
     CssClass:      'imgButton'
    ,Text:          null
    ,Title:         null
    ,ImageURL:      null
    ,Disabled:      false
    ,ID:            null
    ,PanelID:       null
    ,onClick:       $empty
},

initialize: function( options )
{
    this.setOptions(options);
//    PO.addControl(this);
},

// <span class="imgButton"><a class="imgButton"><span><img></span><span>Text</span></a></span>
toDOM: function() 
{
    var o=this;        
    var options=o.options;
                        
    var s1=o.DOM;
    if(s1==null) s1=new Element('span',{'class':options.CssClass,'id':options.ID});
    else s1.empty();
    
    if(options.Disabled) s1.setStyle('opacity','0.25');
    else s1.setStyle('opacity','1.0');
    
    var a=new Element('a',{'class':options.CssClass,'title':options.Title});
    s1.appendChild(a);
    
    s1.removeEvents('click');
    s1.addEvent('click',function() {o.fireEvent("onClick",o)});
    
    if(options.ImageURL) {
        var tle=options.Title;
        if(!tle) tle=options.Text; 
        var si=new Element('span');
        var im=new Element('img',{'src':options.ImageURL,'alt':tle});
        si.appendChild(im);
        a.appendChild(si);
    }    
    if(options.Text) { a.appendChild(new Element('span',{'text':options.Text,'class':'t'})); }
    
    o.DOM = s1;
    
    var panelID=o.options.PanelID;
    if(panelID) {
        var div = $(panelID + '_headerToolbox').getElement('#' + panelID + '_buttonHolder');
        if(div==null) {
            div = new Element('div', { 'id': panelID + '_buttonHolder', 'styles': { 'float': 'right'} });
            $(panelID + '_headerToolbox').appendChild(div);
        }  
        div.appendChild(s1);
    }
    
    return s1;
},

setDisabled: function(disabled) {
    this.options.Disabled=disabled;
    this.toDOM();
}
    
});
