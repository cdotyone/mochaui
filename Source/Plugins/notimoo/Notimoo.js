/*
---
script: notimoo-1.2.css
description: Notification system using Mootools (1.2+)
license: MIT-style
authors:
 - PaquitoSoft
requires:
core:1.2: [Element.Style, Element.Event, Element.Dimension, Fx.Tween, Fx.Morph, Array]
provides: [Notimoo]
version: 1.2
...

Script: Notimoo.js
	Notimoo - Notification system using Mootools (1.2)

License:
	MIT-style license.
	Copyright (c) 2009 PaquitoSoft

	Permission is hereby granted, free of charge, to any
	person obtaining a copy of this software and associated
	documentation files (the "Software"), to deal in the
	Software without restriction, including without limitation
	the rights to use, copy, modify, merge, publish,
	distribute, sublicense, and/or sell copies of the
	Software, and to permit persons to whom the Software is
	furnished to do so, subject to the following conditions:
	
	The above copyright notice and this permission notice
	shall be included in all copies or substantial portions of
	the Software.
	
	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY
	KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE
	WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR
	PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS
	OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR
	OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
	OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
	SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

Author:
	PaquitoSoft (http://paquitosoft.com/).

Code & Documentation:
	PaquitoSoft blog (http://paquitosoft.com/?page_id=53)

Inspiration:
    - Growl by Growl team (http://growl.info/)
	- Window.Growl by Daniel Mota (http://icebeat.bitacoras.com/mootools/growl/)

*/

var Notimoo = new Class({

    /**
     *  Notification elements list.
     */
    elements: [],

    /**
     *  Needed Mootools functionality
     */
    Implements: [Options, Events],

    /**
     *  Used to properly work with the scroll relocation transition
     */
    scrollTimeOut: null,

    /**
     *  Options to configure the notification manager.
     *  @param String parent -> parent element where notifications are to be inserted (defaults to 'body' tag)
     *  @param Number height -> height of the notification DOM element (in pixels -defaults to 50-)
     *  @param Number width -> width of the notification DOM element (in pixels -defaults to 300-)
     *  @param Number visibleTime -> time the notification is displayed (in miliseconds -defaults to 5000-)
     *  @param String locationVType -> whether you want the notifications to be shown on the top or the bottom of the parent element (defaults to 'top')
     *  @param String locationHType -> whether you want the notification to be shown at the left or right of the parent element (defaults to 'right')
     *  @param Number locationVBase -> vertical base position for the notifications (in pixels -defaults to 10-)
     *  @param Number locationHBase -> horizontal base position for the notifications (in pixels -defaults to 10-)
     *  @param Number notificationsMargin -> margin between notifications (in pixels -defaults to 5-)
     *  @param Number opacityTransitionTime -> duration for notification opacity transition (in miliseconds -defaults to 750-)
     *  @param Number closeRelocationTransitionTime -> duration for notification relocation transition when one of them is close (in miliseconds -defaults to 750-)
     *  @param Number scrollRelocationTransitionTime -> duration for notification relocation transition when parent scroll is moved (in miliseconds -defaults to 250-)
     *	@param Number notificationOpacity -> opacity used when the notification is displayed (defaults to 0.95)
     *  @param Function onShow -> callback to be executed when the notification is displayed. The notification element is passed as a parameter.
     *  @param Function onClose -> callback to be executed when the notification id closed. The notification element is passed as a parameter.
     */
    options: {
        parent: '', // This value needs to be set into the initializer
        height: 50,
        width: 300,
        visibleTime: 5000, // notifications are visible for 5 seconds by default
        locationVType: 'top',
        locationHType: 'right',
        locationVBase: 10,
        locationHBase: 10,
        notificationsMargin: 5,
        opacityTransitionTime : 750,
        closeRelocationTransitionTime: 750,
        scrollRelocationTransitionTime: 500,
        notificationOpacity : 0.95 /*,
        onShow: $empty,
        onClose: $empty */
    },

    /**
     *  Initilize instance.
     *  @param Hash options -> (see code above)
     */
    initialize: function(options) {
        this.options.parent = $(document.body);
        if (options) {
            if (options.parent) options.parent = $(options.parent);
            this.setOptions(options);
        }

        var manager = this;

        // Track scroll in parent element
        this.options.parent.addEvent('scroll', function() {
            $clear(this.scrollTimeOut);
            this.scrollTimeOut = (function() { manager._relocateActiveNotifications(manager.TYPE_RELOCATE_SCROLL) }).delay(200);
        }, this);
               
        window.addEvent('scroll', function() {
            $clear(manager.scrollTimeOut);
            manager.scrollTimeOut = (function() { manager._relocateActiveNotifications(manager.TYPE_RELOCATE_SCROLL) }).delay(200);
        });

        // Insert default element into array
        this.elements.push(
            this.createNotificationElement(this.options)
        );

    },

    /**
     *  Creates and initializes an element to show the notification
     */
    createNotificationElement: function() {
        var el = new Element('div', {
                'class': 'notimoo'
            });
        el.setStyle(this.options.locationVType, this.options.locationVBase);
        el.setStyle(this.options.locationHType, this.options.locationHBase);
        el.adopt(new Element('span', { 'class': 'title' }));
        el.adopt(new Element('div', { 'class': 'message' }));
        el.setStyle('width', this.options.width);
        el.setStyle('height', this.options.height);

        // Element default tween instance is used to handle opacity
        el.store('working', false);
        el.set('tween', {
            link: 'chain',
            duration: this.options.opacityTransitionTime
        });
        el.set('opacity', 0);

        // This tween instance is used to move the notification when another one is closed
        var fx1 = new Fx.Tween(el, {
            property: this.options.locationVType,
            link: 'chain',
            duration: this.options.closeRelocationTransitionTime
        });
        el.store('baseTween', fx1);

        // This tween instance is used to move the notification when scroll is moved
        var fx2 = new Fx.Tween(el, {
            property: this.options.locationVType,
            link: 'chain',
            duration: this.options.scrollRelocationTransitionTime
        });
        el.store('scrollTween', fx2);

        // Close the notification when the user click inside
        el.addEvent('click', function(event) {
            event.stop();
            this.close(el);
        }.bind(this));

        return el;
    },

    /**
     *  Function to actually show a notification.
     *  @param String title (required) -> Title for the notification
     *  @param String message (required) -> Message for the notification
     *  @param booleam sticky (optional) -> Whether the notification won't be removed until user interaction (defaults to false)
     *  @param int visibleTime (optional) -> Time for the notification to be displayed (in milliseconds). If this isn't provided, the global one will be used.
     *  @param int width (optional) -> Width fot the notification (in pixels). If this isn't provided, the global one will be used.
     *	@param String customClass (optional) -> Custom class you want to apply to this notification. (It can be a list of classes separated by a blank space)
     */
    show: function(options) {        
        
        var manager = this;
        
        // Get the base for the notification
        var nextBase = this._applyScrollPosition(this.options.locationVBase);        
        var el = this.elements.filter(function(el) {
            var w = el.retrieve('working');
            if (w) {        
                nextBase = el.getStyle(this.options.locationVType).toInt() + el.getSize().y + this.options.notificationsMargin;
            }
            return !w;
        }, this).getLast();

       // Create element if there is no available one
       if (!el) {
         el = this.createNotificationElement();
         this.elements.push(el);
       } 

       // Set base and 'working' flag
       el.setStyle(this.options.locationVType, nextBase);
       el.store('working', true);

       // Check if a custom width has been provided
       if (options.width) el.setStyle('width', options.width);
       
       // Set notification content
       // Since title is optional and we're reusing notifications, we need to check 
       el.getElement('span.title').set('html', (options.title) ? options.title : '');
       el.getElement('div.message').set('html', options.message);

	   // Add custom classes
	   if (options.customClass) el.addClass(options.customClass);

       // Once the notification is populated, we check to see if there is any link inside so we can
       // configure it in order not to close the notification when it's clicked
       el.getElements('a').addEvent('click', function(event) {           
            event.stopPropagation();
        });

       // Insert the element into the DOM
       this.options.parent.adopt(el);

       // This must be done after the element is inserted into DOM. Previously (on Lost!) the element does not have coordinates (obviously)
       this._checkSize(el);

       // Show the element with a lot of style
       el.get('tween').start('opacity', this.options.notificationOpacity).chain(function() {
              	
       	// Set close notification with options visibleTime delay
       	if ((options.sticky) ? !options.sticky : true) {
           (function() { manager.close(el); } ).delay((options.visibleTime) ? options.visibleTime : manager.options.visibleTime, manager);
       	}
       	
       	// Fire callback
       	manager.fireEvent('show', el);
       	
       });
              
    },

    /**
     * Function to close the notification.
     * It also deals with moving other still visible notifications.
     * @param Element element -> element to be removed
     */
    close: function(element) {
        
        // Hide and reset notification. Destroy it when it's not the last one.
        var manager = this;
        var nots = manager.elements;
        element.get('tween').start('opacity', 0).chain(function() {             
            if (nots.length > 1) {
                nots.elements = nots.erase(element);
                element.destroy();
            }
            manager._resetNotificationElement(element);

            // If there are more notifications on screen, move them!
            manager._relocateActiveNotifications(manager.TYPE_RELOCATE_CLOSE);

            manager.fireEvent('close', element);

        });
        
    },

    /**
     *  Function to relocate active notifications when needed
     *  (notification closed or scroll moved).
     *  @param int sourceEvent -> the event that cause the movement (see events at the bottom)
     *                      1.- notification closed
     *                      2.- scroll moved
     */
    _relocateActiveNotifications: function(sourceEvent) {
        
        var base = this._applyScrollPosition(this.options.locationVBase);
        for (var index = 0; index < this.elements.length; index++) {
            var el = this.elements[index];
            if (el.retrieve('working')) {
                if (this.TYPE_RELOCATE_CLOSE == sourceEvent) {
                    el.retrieve('baseTween').start(base);
                } else {
                    el.retrieve('scrollTween').start(base);
                }
                base += el.getSize().y + this.options.notificationsMargin;
            }
        }
    },

    /**
     *  Function to check if the size of the notification element has space enough
     *  to show the message.
     *  In case it hasn't, the element is resized.
     */
    _checkSize: function(element) {
      var notificationElHeight = element.getStyle('height').toInt();
      var titleHeight = element.getElement('span.title').getSize().y;
      var messageHeight = element.getElement('div.message').getSize().y;      
      if (messageHeight > (notificationElHeight - titleHeight)) {
          element.setStyle('height', notificationElHeight + (messageHeight - (notificationElHeight - titleHeight)));
      }
    },

    /**
     * Function used to reset the attributes of a used element to the original state.
     * It only resets the attributes that could be changed before.
     */
    _resetNotificationElement: function(element) {
        element.store('working', false);
        element.setStyle(this.options.locationVType, this.options.locationVBase);
        element.setStyle('height', this.options.height);
        element.setStyle('width', this.options.width);
    },

    /**
     * Helper function to apply scroll location to element base.
     */
    _applyScrollPosition: function(base) {
        if (this.options.locationVType == 'top') {
            base +=this.options.parent.getScroll().y;
        } else {
            base -=this.options.parent.getScroll().y;
        }
        return base;
    },

    /*
    * Constants for transitions
    */
    TYPE_RELOCATE_CLOSE: 1,
    TYPE_RELOCATE_SCROLL: 2

});