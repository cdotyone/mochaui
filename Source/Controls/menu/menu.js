/*
 ---

 name: Menu

 script: menu.js

 description: MUI - Creates a menu control.

 copyright: (c) 2011 Contributors in (/AUTHORS.txt).

 license: MIT-style license in (/MIT-LICENSE.txt).

 requires:
 - Core/Element
 - Core/Class
 - Core/Options
 - Core/Events
 - MUI
 - MUI.Core

 provides: [MUI.Menu]
 ...
 */

MUI.MenuController = new NamedClass('MUI.MenuController', {
    
    $active:		false,
    $visibles:	  [],
    $focused:	   [],
    $groupedItems:  {},
    
    menuIsActivated: function(){
        return this.$activated;
    },
    
    checkActivated: function(item){
		if(this.$focused.length === 1){
			this.$focused.pop().setActive(false);
			this.$activated = false;
		}
		else if(!item){
			this.hideVisibleMenus();
			while(this.$focused.length > 0)
	            this.$focused.pop().setActive(false);
			this.$activated = false;
		}
		else {
			item.setActive(true);
			this.$focused.push(item);
			this.$activated = true;
		}
    },
    
    onItemFocus: function(item){
		if(this.$activated){
			var focused = [];
	        while(this.$focused.length > 0){
	            var item2 = this.$focused.pop();
	            if(!item || item2.isParentOf(item))
	                focused.push(item2);
	            else
	                item2.setActive(false);
	        }
	        this.$focused = focused;
				
			item.setActive(true);
			this.$focused.push(item);
		}	
    },
    
    onItemBlur: function(item){
	
    },
    
    addVisibleMenu: function(menu){
        if(menu.isVisible())
            this.$visibles.push(menu);
        return this;
    },
    
    hideVisibleMenus: function(){
        while(this.$visibles.length > 0){
            this.$visibles.pop().hide();
        }
        return this;
    },
    
    hideVisibleMenusExceptParents: function(fromMenu){
        var visibles = [];
        while(this.$visibles.length > 0){
            var menu = this.$visibles.pop();
            if(!menu.isParentOf(fromMenu))
                menu.hide();
            else
                visibles.push(menu);
        }
        this.$visibles = visibles;
        return this;
    },
    
    hideVisibleMenusExceptThisAndParents: function(fromMenu){
        var visibles = [];
        while(this.$visibles.length > 0){
            var menu = this.$visibles.pop();
            if(!menu.isParentOf(fromMenu) && menu !== fromMenu)
                menu.hide();
            else
                visibles.push(menu);
        }
        this.$visibles = visibles;
        return this;
    },
    
    addItemToGroup: function(groupName, item){
		if(!this.$groupedItems.groupName)
			this.$groupedItems.groupName = [];
		this.$groupedItems.groupName.push(item);
    },
    
    removeItemFromGroup: function(groupName, item){
		if(!this.$groupedItems.groupName) return;
		var i = this.$groupedItems.indexOf(item);
		if(i > -1)
			delete this.$groupedItems[i];
    },
    
    getGroupedItems: function(groupName){
		if(!this.$groupedItems.groupName) return [];
		return this.$groupedItems.groupName;
    }
});

MUI.MenuItemContainer = new NamedClass('MUI.MenuItemContainer', {

    Implements: [Events, Options],
	
	options: {
		drawOnInit:  true,
		cssClass:    '',      // css tag to add to control
		container:   document.body
	},
	
	el:          {},
    $controller: null,
    $dottedId:   '',
	items:       [],
	$items:      [],
	$visible:    false,
	
	initialize: function(controller, items, parentDdottedId, options){
		this.setOptions(options);
        this.$controller = controller;
        this.$dottedId = (parentDdottedId || '') + String.uniqueID() + '.';
		
		this.items.combine(items);

		if (this.options.drawOnInit) this.draw();
	},
	
	draw: function(){
		this.fireEvent('drawBegin', [this]);
		var options = this.options;
		
		this.el.container = new Element('div', {
			'class': options.cssClass + ' mui-menu depth-' + this.getDepth()
		}).fade('hide').set('tween', { duration: 200 }).inject(options.container);
	    
		this.drawItems({
			cssClass: options.cssClass
		});
		
		this.attachEvents();
		
		this.fireEvent('drawEnd', [this]);
	},
	
	drawItems: function(options){
		this.items.each(function(item){
			var mItem = null;
			if(!!item.type){
				if(item.type == 'divider'){
					mItem = new MUI.MenuItemDivider(this.$controller, this, this.$dottedId, Object.merge(item, options));	
				}
				else if(item.type == 'radio'){
					mItem = new MUI.RadiogroupMenuItem(this.$controller, this, this.$dottedId, Object.merge(item, options));
				}
				else if(item.type == 'check'){
					mItem = new MUI.CheckboxMenuItem(this.$controller, this, this.$dottedId, Object.merge(item, options));
				}
				else if(item.type == 'image'){
					mItem = new MUI.ImageMenuItem(this.$controller, this, this.$dottedId, Object.merge(item, options));
				}
			}
			if(mItem === null){
				if(item.items && item.items.length > 0){
					mItem = new MUI.SubmenuMenuItem(this.$controller, this, this.$dottedId, Object.merge(item, options));
				}
				else {
					mItem = new MUI.MenuItem(this.$controller, this, this.$dottedId, Object.merge(item, options));
				}
			}
			if(mItem !== null && mItem.addEvents){
				mItem.addEvents({
					'click':    this.onItemClick.bind(this),
					'clicked':  this.onItemClicked.bind(this),
					'focus':    this.onItemFocus.bind(this),
					'focused':  this.onItemFocused.bind(this),
					'blur':     this.onItemBlur.bind(this),
					'blurred':  this.onItemBlurred.bind(this)
				});
	            
				this.$items.push(mItem);
			}
		}, this);
	},
    
    toElement: function(){
        return this.el.container;
    },
	
	attachEvents: function(){
		var self = this;
		document.body.addEvent('click', function(e){
			if(!self.el.container.contains(e.target))
				self.hide();
			self.$controller.checkActivated();
		});
	},
	
	toggle: function(coordinates){
		if(this.isVisible())
			return this.hide();
		return this.show(coordinates);
	},
	
	show: function(coordinates){
		this.fireEvent('beforeShow', [this]);
		
        this.$controller.hideVisibleMenusExceptParents(this);
		this.el.container.setPosition(coordinates).fade('show');
        this.$visible = true;
        this.$controller.addVisibleMenu(this);
		
		this.fireEvent('show', [this]);
		return this;
	},
	
	hide: function(){
		this.fireEvent('beforeHide', [this]);
		
		this.el.container.fade('hide');
        this.$visible = false;
		
		this.fireEvent('hide', [this]);
		return this;
	},
	
	isVisible: function(){
		return this.$visible;
	},
	
	getDottedId: function(){
		return this.$dottedId;
	},
    
    isParentOf: function(item){
        return item.getDottedId().contains(this.getDottedId());
    },
    
    getDepth: function(){
		var da = this.getDottedId().split('.');
		return (da.length + 1) / 2;
    },
	
	onItemClick: function(item, e){
		this.fireEvent('itemClick', [this, item, e]);
	},
	
	onItemClicked: function(item, e){
		this.fireEvent('itemClicked', [this, item, e]);
	},
	
	onItemFocus: function(item, e){
		this.fireEvent('itemFocus', [this, item, e]);
	},
	
	onItemFocused: function(item, e){
		this.fireEvent('itemFocused', [this, item, e]);
	},
	
	onItemBlur: function(item, e){
		this.fireEvent('itemBlur', [this, item, e]);
	},
	
	onItemBlurred: function(item, e){
		this.fireEvent('itemBlurred', [this, item, e]);
	}
	
});

MUI.Menu = new NamedClass('MUI.Menu', {
    
    Extends: MUI.MenuItemContainer,

	options: {
		id:               '',              // id of the primary element, and id os control that is registered with mocha
		container:        null,            // the parent control in the document to add the control to
		drawOnInit:       true,            // true to add tree to container when control is initialized
		partner:          false,           // default partner element to send content to
		partnerMethod:    'xhr',           // default loadMethod when sending content to partner

		content:          false,           // used to load content
		items:            {},              // menu items for the menu to draw

		cssClass:         'toolMenu',      // css tag to add to control
		divider:          true,            // true if this toolbar has a divider
		orientation:      'left'           // left or right side of dock.  default is left

		//onDrawBegin:null                 // event: called when menu is just starting to be drawn
		//onDrawEnd:null                   // event: called when menu is has just finished drawing
		//onItemDrawBegin:null             // event: called when menu item is just starting to be drawn
		//onItemDrawEnd:null               // event: called when menu item is has just finished drawing
		//onItemClicked:null               // event: when a menu item is clicked
		//onItemFocused:null               // event: when a menu gains focus
		//onItemBlurred:null               // event: when a menu losses focus
	},

	initialize: function(options){
		this.setOptions(options);
        this.$controller = new MUI.MenuController();

		// If menu has no ID, give it one.
		this.id = this.options.id = this.options.id || 'menu' + (++MUI.idCount);
		MUI.set(this.id, this);

		if (this.options.drawOnInit) this.draw();
	},

	draw: function(container){
		this.fireEvent('drawBegin', [this]);
		var o = this.options;
		container = container || o.container;

		// determine element for this control
		var isNew = false;
		var div = o.element ? o.element : $(o.id);
		if (!div){
			div = new Element('div', {'id': o.id});
			isNew = true;
		}
		div.empty();

		div.addClass('toolbar');
		div.addClass('depth-' + this.getDepth());
		if (o.cssClass) div.addClass(o.cssClass);
		if (o.divider) div.addClass('divider');
		if (o.orientation) div.addClass(o.orientation);

		this.el.container = div.store('instance', this);
		
		this.items = o.items;
		this.drawItems({
			cssClass: o.cssClass,
			subMenuAlign: { bottom: 3, left: 0 }
		});

		// add to container
		var addToContainer = function(){
			if (typeOf(container) == 'string') container = $(container);
			if (div.getParent() === null) div.inject(container);
			this.fireEvent('drawEnd', [this]);
		}.bind(this);
		if (!isNew || typeOf(container) == 'element') addToContainer();
		else window.addEvent('domready', addToContainer);

		return this;
	}
    
});


MUI.MenuItem = new NamedClass('MUI.MenuItem', {

	Implements: [Events, Options],
	
	options: {
		drawOnInit:    true,
		cssClass:      '',      // css tag to add to control
		items:         [],
		text:          '',
		id:            '',
		registered:    '',
		url:           '',
		target:        '_blank',
		type:          '',      // 'check', 'radio', 'image' or leave blnak for default
		partner:       '',
		partnerMethod: 'xhr'
	},
	
	el:          {},
    $dottedId:   '',
    $controller: null,
    $container:  null,
	
	initialize: function(controller, container, parentDdottedId, options){
		this.setOptions(options);
        this.$controller = controller;
        this.$container = container;
        this.$dottedId = (parentDdottedId || '') + String.uniqueID() + '.';
		
		this.el.container = container.toElement();
		
		if (this.options.drawOnInit) this.draw();
	},
	
	draw: function(){
		this.fireEvent('drawBegin', [this]);
		var options = this.options;
		
		this.el.item = new Element('div', {
			'class': options.cssClass + ' mui-menu-item depth-' + this.getDepth(),
			text: options.text
		}).inject(this.el.container);
		
		if(!!options.id)
			this.el.item.set('id', options.id);
		
		this.attachEvents();
		
		this.fireEvent('drawEnd', [this]);
	},
	
	getDottedId: function(){
		return this.$dottedId;
	},
    
    isParentOf: function(item){
        return item.getDottedId().contains(this.getDottedId());
    },
    
    getDepth: function(){
		var da = this.getDottedId().split('.');
		return da.length / 2;
    },
	
	attachEvents: function(){
		var self = this,
			options = this.options;
		this.el.item.addEvents({
			'click': function(e){
				self.fireEvent('click', [self, e]);
				if(!self.isLink()) e.stop();
				
				self.$controller.checkActivated(self);
				
				// determine partner settings
				var partner = options.partner,
					partnerMethod = options.partnerMethod,
					registered = options.registered,
					url = MUI.replacePaths(options.url),
					hide = false;
				if(!url || registered){
					url = '#';
					if(registered && registered !== ''){
						MUI.getRegistered(self, registered, [self.options])(e);
						hide = true;
					}
				}
				else if(partner){
					MUI.sendContentToPartner(self, url, partner, partnerMethod)(e);
					hide = true;
				}
				else {
					document.location.href = url;
				}
				
				if(hide)
					self.$controller.checkActivated();
                
				self.fireEvent('clicked', [self, e]);
			},
			'mouseenter': function(e){
				self.fireEvent('focus', [self, e]);
				
				self.$controller.onItemFocus(self);
                
				self.fireEvent('focused', [self, e]);
			},
			'mouseleave': function(e){
				self.fireEvent('blur', [self, e]);
				self.$controller.onItemBlur(self);
				self.fireEvent('blurred', [self, e]);
			}
		});
	},
	
	isLink: function(){
		return this.options.url !== '';
	},
	
	setActive: function(state){
		if(!!state)
			this.el.item.addClass('active');
		else
			this.el.item.removeClass('active');
	}
	
});

MUI.MenuItemDivider = new NamedClass('MUI.MenuItemDivider', {
	
	Extends: MUI.MenuItem,
	
	draw: function(){
		this.fireEvent('drawBegin', [this]);
		var options = this.options;
		
		this.el.item = new Element('div', {
			'class': options.cssClass + ' mui-menu-item-divider depth-' + this.getDepth()
		}).inject(this.el.container);
		
		if(!!options.id)
			this.el.item.set('id', options.id);
		
		this.fireEvent('drawEnd', [this]);
	}
});

MUI.SubmenuMenuItem = new NamedClass('MUI.SubmenuMenuItem', {
	
	Extends: MUI.MenuItem,
	
	initialize: function(controller, container, parentDdottedId, options){
		options = Object.merge({
			subMenuAlign: { top: -5, right: 0 }
		}, options);
		this.parent(controller, container, parentDdottedId, options);
	},
	
	$subMenu:    null,
	
	draw: function(){
		this.fireEvent('drawBegin', [this]);
		var options = this.options;
		
		this.el.item = new Element('div', {
			'class': options.cssClass + ' mui-menu-item depth-' + this.getDepth()
		}).inject(this.el.container);
		
		new Element('div', {
			'class': 'arrow-right',
			text: options.text
		}).inject(this.el.item);
		
		if(!!options.id)
			this.el.item.set('id', options.id);
		
		if(options.items.length > 0){
			this.el.item.addClass('more');
            
			this.$subMenu = new MUI.MenuItemContainer(this.$controller, options.items, this.$dottedId, {
				cssClass: options.cssClass
			});
			
			this.$subMenu.addEvents({
				'itemClick': function(item, e){
					this.fireEvent('click', [item, e]);
				},
				'itemClicked': function(item, e){
					this.fireEvent('clicked', [item, e]);
				},
				'itemFocus': function(item, e){
					this.fireEvent('focus', [item, e]);
				},
				'itemFocused': function(item, e){
					this.fireEvent('focused', [item, e]);
				},
				'itemBlur': function(item, e){
					this.fireEvent('blur', [item, e]);
				},
				'itemBlurred': function(item, e){
					this.fireEvent('blurred', [item, e]);
				}
			});
		}
		
		this.attachEvents();
		
		this.fireEvent('drawEnd', [this]);
	},
	
	attachEvents: function(){
		var self = this;
		this.el.item.addEvents({
			'click': function(e){
                if(this.hasClass('more')){
                    var coords = { x: 0, y: 0 },
						itemCoords = this.getCoordinates();
					
					Object.each(self.options.subMenuAlign, function(margin, align){
						switch(align){
							case 'top':
							case 'bottom':
								coords.y = itemCoords[align] + margin;
								break;
								
							case 'left':
							case 'right':
								coords.x = itemCoords[align] + margin;
								break;
						}
					});
					
					self.$subMenu.toggle(coords);
				}
			},
			'mouseenter': function(e){
                self.$controller.hideVisibleMenusExceptThisAndParents(self.$container);
                
				if(self.$controller.menuIsActivated() && this.hasClass('more')){
					var coords = { x: 0, y: 0 },
						itemCoords = this.getCoordinates();
					
					Object.each(self.options.subMenuAlign, function(margin, align){
						switch(align){
							case 'top':
							case 'bottom':
								coords.y = itemCoords[align] + margin;
								break;
								
							case 'left':
							case 'right':
								coords.x = itemCoords[align] + margin;
								break;
						}
					});
					
					self.$subMenu.show(coords);
				}
			}
		});
		
		this.parent();
	}
});

MUI.CheckboxMenuItem = new NamedClass('MUI.CheckboxMenuItem', {
	
	Extends: MUI.MenuItem,
	
	$selected: false,
	
	initialize: function(controller, container, parentDdottedId, options){
		options = Object.merge({
			selected: false
		}, options);
		this.parent(controller, container, parentDdottedId, options);
	},
	
	draw: function(){
		this.parent();
		
		new Element('span', {
			'class': 'checkicon'
		}).inject(this.el.item, 'top');
	
		this.el.item.addClass('checkbox');
		
		if(this.options.selected)
			this.setSelected(true);
	},
	
	attachEvents: function(){
		var self = this;
		this.el.item.addEvent('click', function(e){
			this.toggleClass('checkbox');
			self.fireEvent('changed', [self]);
		});
		this.parent();
	},
	
	isSelected: function(){
		return this.el.item.hasClass('selected');
	},
	
	setSelected: function(value){
		if(value === this.$selected) return;
		this.$selected = !!value;
		if(this.$selected)
			this.el.item.addClass('selected');
		else
			this.el.item.removeClass('selected');
		self.fireEvent('changed', [self]);
	}
});

MUI.RadiogroupMenuItem = new NamedClass('MUI.SelectboxMenuItem', {
	
	Extends: MUI.MenuItem,
	
	$selected: false,
	
	initialize: function(controller, container, parentDdottedId, options){
		options = Object.merge({
			selected: false,
			group:    ''            // name of the radiogroup this item belongs to
		}, options);
		this.parent(controller, container, parentDdottedId, options);
	},
	
	draw: function(){
		this.parent();
		
		new Element('span', {
			'class': 'radioicon'
		}).inject(this.el.item, 'top');
		
		this.el.item.addClass('radiogroup');
		
		if(this.options.selected)
			this.setSelected(true);
			
		this.$controller.addItemToGroup(this.options.group, this);
	},
	
	attachEvents: function(){
		var self = this;
		this.el.item.addEvent('click', function(e){
			var groupedItems = self.$controller.getGroupedItems(self.options.group);
			groupedItems.each(function(item){
				if(item !== self)
					item.setSelected(false);
			});
			self.setSelected(true);
		});
		this.parent();
	},
	
	isSelected: function(){
		return this.el.item.hasClass('selected');
	},
	
	setSelected: function(value){
		if(value === this.$selected) return;
		this.$selected = !!value;
		if(this.$selected)
			this.el.item.addClass('selected');
		else
			this.el.item.removeClass('selected');
		self.fireEvent('changed', [self]);
	}
});

/*
MUI.ImageMenuItem = new NamedClass('MUI.ImageMenuItem',  {
	
	Extends: MUI.MenuItem,

	draw: function(){
		this.parent();
		
		this.el.item.addClass('image');
	}
});
*/

