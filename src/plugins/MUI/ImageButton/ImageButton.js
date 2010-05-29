/*

Script: ImageButton.js
	Creates a button with an image on it

Copyright:
	Copyright (c) 2010 Chris Doty, <http://polaropposite.com/>.

License:
	MIT-style license.

*/

MUI.files[MUI.path.plugins + 'MUI/ImageButton/ImageButton.js'] = 'loaded';

MUI.ImageButton = new Class({

Implements: [Events, Options],

options: {
    id:            ''          // id of the primary element, and id os control that is registered with mocha
   ,container:     null        // the parent control in the document to add the control to
   ,createOnInit:  true        // true to add tree to container when control is initialized
   ,cssClass:      'imgButton' // the primary css tag

   ,text:          null        // the text displayed on the button
   ,title:         null        // tool top text
   ,imageURL:      null        // the url to the image that will be displayed
   ,isDisabled:    false       // is the button disabled

   ,onClick:       $empty      // event: called when button is clicked
},

initialize: function( options )
{
    this.setOptions(options);

    // make sure this controls has an ID
    var id=this.options.id;
    if(!id) { id='imageButton' + (++MUI.IDCount); this.options.id=id; }

    if(this.options.createOnInit) this.toDOM();
    
    MUI.set(id,this);
},

// <span class="imgButton"><a class="imgButton"><span><img></span><span>Text</span></a></span>
toDOM: function() 
{
    var self=this;        
    var o=self.options;

    var isNew=true;
    var s1=self.element;
    if(s1==null) s1=new Element('span',{'class':o.cssClass,'id':o.id});
    else { s1.empty(); isNew=false; }
    
    s1.setStyle('opacity',o.isDisabled ? '0.25' : '1.0');

    var a=new Element('a',{'class':o.cssClass,'title':o.title}).inject(s1);
    
    s1.removeEvents('click');
    s1.addEvent('click',function() {self.fireEvent("click",self)});
    
    if(o.imageURL) {
        var tle=o.title;
        if(!tle) tle=o.text;
        var si=new Element('span').inject(a);
        new Element('img',{'src':o.imageURL,'alt':tle}).inject(si);
    }    
    if(o.text) { a.appendChild(new Element('span',{'text':o.text,'class':'t'})); }
    
    self.element = s1;

    if(!isNew) return self;

    window.addEvent('domready', function() {
        var container=$(self.options.container);
        if(container!=null && container.options && container.options.id) {
            var muiControl = MUI.get(container.options.id);
            if(muiControl && muiControl.isTypeOf('MUI.Panel')) {
                var panelID=container.options.id;
                var div = $(panelID + '_headerToolbox').getElement('#' + panelID + '_buttonHolder');
                if(div==null) {
                    div = new Element('div', { 'id': panelID + '_buttonHolder', 'styles': { 'float': 'right'} });
                    $(panelID + '_headerToolbox').appendChild(div);
                }
                div.appendChild(s1);
                return self;
            }
        }

        if(container) container.appendChild(s1);
    });

    return self;
},

setDisabled: function(disabled) {
    this.options.isDisabled=disabled;
    this.toDOM();
    return disabled;
}
    
});
