/*
 ---

 name: Persist

 script: persist.js

 description: MUI - Provides the ability to cache data in the browser

 copyright: (c) 2011 Contributors in (/AUTHORS.txt).

 license: MIT-style license in (/MIT-LICENSE.txt).

 authors:
 original - Paul Duncan (paul@pablotron.org) <http://github.com/jeremydurham/persist-js>
 mootools adaptation - Chris Doty

 requires:
 - Core/Element
 - Core/Class
 - Core/Options
 - Core/Events
 - MUI
 - MUI.Core
 - MUI.Require

 provides: [
 MUI.Persist,
 MUI.Persist.Providers.Gears,
 MUI.Persist.Providers.WhatWG,
 MUI.Persist.Providers.GlobalStorage,
 MUI.Persist.Providers.LocalStorage,
 MUI.Persist.Providers.IE,
 MUI.Persist.Providers.Cookie,
 MUI.Persist.Providers.Flash
 ]
 ...
 */

MUI.Persist = Object.append((MUI.Persist || {}), {
	options: {
		name: 'MUI',								// Name added to keys in some of the providers.
		provider: 'auto',							// The name of the provider to use, defaults to auto.

		searchOrder:[
			'LocalStorage',
			'GlobalStorage',
			'Gears',
			'WhatWG',
			'Cookie',
			'IE',
			'Flash'
		],

		sql: {								// sql for db providers (gears and db)
			create:   "CREATE TABLE IF NOT EXISTS persist_data (k TEXT UNIQUE NOT NULL PRIMARY KEY, v TEXT NOT NULL)",
			get:	  "SELECT v FROM persist_data WHERE k = ?",
			set:	  "INSERT INTO persist_data(k, v) VALUES (?, ?)",
			remove:   "DELETE FROM persist_data WHERE k = ?"
		},

		flash: {											// default flash configuration
			divID:		'_persist_flash_wrap',	// ID of wrapper element
			id:			'_persist_flash',				// id of flash object/embed
			path:		'persist.swf',					// default path to flash object
			height:		1,
			width:		1,
			params:	{									// arguments passed to flash object
				autostart: true
			}

		}

		//onGet:      null,
		//onSet:      null,
		//onRemove:   null
	},

	Providers: {},						// hash used to store the providers initialized below.

	ProviderTests: {					// hash of test functions used to test for the different providers
		'Gears': function(){
			return (window.google && window.google.gears) ? true : false;
		},

		'WhatWG': function(){
			if (!window.openDatabase) return false;
			return window.openDatabase('PersistJS Test', 1, 'Persistent database test.', this.size);
		},

		'GlobalStorage': function(){
			if (window.globalStorage){
				var domain = '127.0.0.1';
				if (this.o && this.o.domain) domain = this.o.domain;
				try{
					var dontcare = globalStorage[domain];
					return true;
				} catch(e){
					if (window.console && window.console.warn)
						console.warn("globalStorage exists, but couldn't use it because your browser is running on domain:", domain);
					return false;
				}
			} else {
				return false;
			}
		},

		'LocalStorage': function(){
			return (window.localStorage ? true : false);
		},

		'IE': function(){
			return window.ActiveXObject ? true : false;
		},

		'Cookie':function(){
			return P.Cookie.enabled ? true : false;
		},

		'Flash':function(){
			return Browser.Plugins.Flash.version >= 8;
		}
	},

	initialize: function(options){

		// set the options
		if (options) Object.append(MUI.Persist.options, options);
		options = MUI.Persist.options;

		// if provider is set to auto then set to false
		if (options.provider == 'auto') options.provider = false;

		// if no provider requested than
		if (!options.provider){
			// loop over all providers and test for each one
			var keys = options.searchOrder;
			for (var i = 0, len = keys.length; i < len; i++){
				var provider = this.ProviderTests[keys[i]];
				if (provider && provider()){
					options.provider = keys[i];
					break;
				}
			}
		}

		// if we have a provider than create and initialize it
		if (options.provider){
			this._providerClass = 'MUI.Persist.Providers.' + options.provider;
			var klass = MUI['Persist']['Providers'][options.provider];
			this.currentProvider = new klass();
			this.size = this.currentProvider.options.size;
		}
	},

	get: function(key, group){
		if(group && !MUI.Persist.hasGroupKey(group,key)) return null;
		// get a provider if needed and get the requested value
		if (!this.currentProvider) this.initialize();
		return this.currentProvider.get(key);
	},

	hasGroupKey: function(group,key) {
		var keys = MUI.Persist.getGroupKeys(group);
		if(!key && keys!=null) return true;
		if(keys && key) {
			for(var i=0;i<keys.length;i++) {
				if(keys[i]==key) return true;
			}
		}
		return false;
	},

	getGroupKeys: function(group) {
		var keys = MUI.Persist.get(group);
		if (keys) return keys = keys.split('|');
		return null;
	},

	addGroupKey: function(group,key) {
		var keys = MUI.Persist.getGroupKeys(group);
		if (keys) keys.push();
		else keys = [key];
		MUI.Persist.set(group, keys.join('|'));
	},

	set: function(key, val, group){
		if (group) MUI.Persist.addGroupKey(group,key);

		// get a provider if needed and set the requested value
		if (!this.currentProvider) this.initialize();
		return this.currentProvider.set(key, val);
	},

	remove: function(key){
		// get a provider if needed and remove the requested value
		if (!this.currentProvider) this.initialize();
		return this.currentProvider.remove(key);
	},

	clear: function(group){
		var keys = MUI.Persist.get(group);
		if (keys){
			keys = keys.split('|');
			keys.each(function(key){
				MUI.Persist.remove(key);
			});
		}
	}
});

MUI.Persist.Providers.Gears = new Class({

	Implements: [Events,Options],

	options: {
		size:	-1
	},

	initialize: function(options){
		// process options
		Object.append(this.options, MUI.Persist.options);
		this.setOptions(options);

		// create database and table
		var db;
		db = this.db = google.gears.factory.create('beta.database');
		db.open(this._safeKey(this.options.name));
		db.execute(this.options.sql.create).close();
	},

	get: function(key){
		// get the value from the table
		var val;
		this._transaction(function (t){

			var row = t.execute(this.options.sql.get, [key]);
			var valid = row.isValidRow();
			val = valid ? row.field(0) : null;
			row.close();

			this.fireEvent('get', [this,val,key]);
		});

		return val;
	},

	set: function(key, val){
		var old_val = this.get(key);	// get previous value

		this._transaction(function(t){
			t.execute(this.options.sql.remove, [key]).close();		// delete previous value
			t.execute(this.options.sql.set, [key, val]).close();	// set the value

			this.fireEvent('set', [this,val,key,old_val]);
		});

		return old_val;
	},

	remove: function(key){
		var old_val = this.get(key);	// get previous value

		this._transaction(function(t){
			// deletes value from the table
			t.execute(this.options.sql.remove, [key]).close();

			this.fireEvent('remove', [this,old_val,key]);
		});

		return old_val;
	},

	_transaction: function(fn){
		var db = this.db;
		db.execute('BEGIN').close();
		fn.call(this, db);
		db.execute('COMMIT').close();
	},

	_safeKey: function(str){
		return str.replace(/_/g, '__').replace(/ /g, '_s');
	}

});

MUI.Persist.Providers.WhatWG = new Class({

	Implements: [Events,Options],

	options: {
		size:	200 * 1024		// size based on DatabaseExample from above (should I increase this?)
	},

	initialize: function(options){
		// process options
		Object.append(this.options, MUI.Persist.options);
		this.setOptions(options);

		// create the database
		this.db = openDatabase(this.options.name, 1, 'Persistent storage for MochaUI', this.options.size);
	},

	get: function(key){
		var val;

		this._transaction(function (t){
			// get the value from the database
			t.executeSql(this.options.sql.get, [key], function(t, r){
				val = r.rows.length > 0 ? r.rows.item(0).v : null;
				this.fireEvent('get', [this,val,key]);
			}.bind(this));
		});

		return val;
	},

	set: function(key, val){
		var old_val = this.get(key); // get previous value 

		this._transaction(function(t){
			t.executeSql(this.options.sql.remove, [key], function(){
				t.executeSql(this.options.sql.set, [key, val], function(){
					this.fireEvent('set', [this,val,key,old_val]);
				}.bind(this));
			}.bind(this));
		});

		return old_val;
	},

	remove: function(key){
		var old_val;

		this._transaction(function(t){
			t.executeSql(this.options.sql.get, [key], function(t, r){
				if (r.rows.length > 0){
					old_val = r.rows.item(0).v;  // get previous value

					t.executeSql(this.options.sql.remove, [key]);  // remove the key
					this.fireEvent('set', [this,old_val,key]);
				}
			}.bind(this));
		});

		return old_val;
	},

	_transaction: function(fn){
		if (!this.db_created){
			this.db._transaction(function(t){
				t.executeSql(this.options.sql.create, [], function(){
					this.db_created = true;
				}.bind(this));
			}.bind(this), function(){
			});
		}
		this.db._transaction(fn.bind(this));
	},

	_safeKey: function(str){
		return str.replace(/_/g, '__').replace(/ /g, '_s');
	}

});

MUI.Persist.Providers.GlobalStorage = new Class({

	Implements: [Events,Options],

	options: {
		size:	5 * 1024 * 1024		// (5 meg limit, src: http://ejohn.org/blog/dom-storage-answers/)
	},

	initialize: function(options){
		// process options
		Object.append(this.options, MUI.Persist.options);
		this.setOptions(options);

		// cleanup domain option
		var o = this.options;
		o.domain = o.domain || location.host || 'localhost';
		o.domain = o.domain.replace(/:\d+$/, '');

		// create data store
		this.store = globalStorage[o.domain];
	},

	_key: function(key){
		return this._safeKey(this.options.name) + this._safeKey(key);
	},

	get: function(key){
		key = this._key(key);
		var val = this.store.getItem(key);  // get current value
		this.fireEvent('get', [this,val,key]);
		return val;
	},

	set: function(key, val){
		key = this._key(key);

		var old_val = this.store.getItem(key); // get previous value
		this.store.setItem(key, val); // store new value
		this.fireEvent('set', [this,val,key,old_val]);

		return old_val;
	},

	remove: function(key){
		key = this._key(key);

		var old_val = this.store.getItem(key); // get previous value
		this.store.removeItem(key); // remove the key
		this.fireEvent('remove', [this,old_val,key]);

		return old_val;
	},

	_safeKey: function(str){
		return str.replace(/_/g, '__').replace(/ /g, '_s');
	}

});

MUI.Persist.Providers.LocalStorage = new Class({

	Implements: [Events,Options],

	options: {
		prefix:	'_persist_data-'
	},

	initialize: function(options){
		// process options
		Object.append(this.options, MUI.Persist.options);
		this.setOptions(options);

		this.store = localStorage;
	},

	get: function(key){
		key = this._safeKey(key);

		var val = this.store.getItem(key);  // get current value
		this.fireEvent('get', [this,val,key]);

		return val;
	},

	set: function(key, val){
		key = this._safeKey(key);

		var old_val = this.store.getItem(key);  // get previous value
		this.store.setItem(key, val);  // store new value
		this.fireEvent('set', [this,val,key,old_val]);

		return old_val;
	},

	remove: function(key){
		key = this._safeKey(key);

		var old_val = this.store.getItem(key); // get previous value
		this.store.removeItem(key);	// remove the key
		this.fireEvent('remove', [this,old_val,key]);

		return old_val;
	},

	_safeKey: function(str){
		return str.replace(/_/g, '__').replace(/ /g, '_s');
	}

});

MUI.Persist.Providers.IE = new Class({

	Implements: [Events,Options],

	options: {
		prefix:	'_persist_data-',
		size: 64 * 1024				// 64k limit
	},

	initialize: function(options){
		// process options
		Object.append(this.options, MUI.Persist.options);
		this.setOptions(options);

		// create element to store keys in
		this.id = this.options.prefix + this._safeKey(this.options.name);
		this.el = new Element('div', {'id': this.id, styles: {'display': 'none'}}).inject(document.body);
	},

	get: function(key){
		key = this._safeKey(key);

		var val = this.el.retrieve(key); // get current value
		this.fireEvent('get', [this, val, key]);

		return val;
	},

	set: function(key, val){
		key = this._safeKey(key);

		var old_val = this.el.retrieve(key);  // get previous value
		this.el.store(key, val);  // store new value
		this.fireEvent('set', [this, val, key, old_val]);

		return old_val;
	},

	remove: function(key){
		key = this._safeKey(key);

		var old_val = this.el.retrieve(key);  // get previous value
		this.el.eliminate(key);  // remove key
		this.fireEvent('remove', [this, old_val, key]);

		return old_val;
	},

	_safeKey: function(str){
		return str.replace(/_/g, '__').replace(/ /g, '_s');
	}

});

MUI.Persist.Providers.Cookie = new Class({

	Implements: [Events, Options],

	options: {
		size:	4000,			// 4k limit (low-ball this limit to handle browser weirdness, and so we don't hose session cookies)
		delim: ':',
		domain: false,
		path: false,
		duration: 365,
		secure: false
	},

	initialize: function(options){
		// process options
		Object.append(this.options, MUI.Persist.options);
		this.setOptions(options);

		// cleanup domain option
		var o = this.options;
		o.domain = o.domain || location.host || 'localhost';
		o.domain = o.domain.replace(/:\d+$/, '');
		o.domain = (o.domain == 'localhost') ? '' : o.domain;
	},

	get: function(key){
		key = this._safeKey(key);

		var val = Cookie.read(key);  // get current value
		this.fireEvent('get', [this, val, key]);

		return val;
	},

	set: function(key, val){
		key = this._safeKey(key);

		var old_val = Cookie.read(key);  //get previous value
		Cookie.write(key, val, this.options);  // store new value
		this.fireEvent('set', [this, val, key, old_val]);

		return old_value;
	},

	remove: function(key){
		key = this._safeKey(key);

		var old_val = Cookie.read(key); // get old value
		Cookie.dispose(key, this.options); // remove key
		this.fireEvent('remove', [this, old_val, key]);

		return old_val;
	},

	_safeKey: function(key){
		return this.options.name + this.options.delim + key;
	}

});

MUI.Persist.Providers.Flash = new Class({

	Implements: [Events,Options],

	options: {
		size:	-1
	},

	initialize: function(options){
		Object.append(this.options, MUI.Persist.options);
		this.setOptions(options);
		if (!MUI.Persist.options.flash.el){
			var cfg = this.options.flash;
			cfg.container = new Element('div', {'id': this.options.flash.divID}).inject(document.body);
			MUI.Persist.options.flash.el = new Swiff(cfg.path, cfg);
		}
		this.el = MUI.Persist.options.flash.el;
	},

	get: function(key){
		key = this._safeKey(key);

		var val = this.el.get(this.options.name, key);  // get current value
		this.fireEvent('get', [this, val, key]);

		return val;
	},

	set: function(key, val){
		key = this._safeKey(key);

		var old_val = this.el.set(this.options.name, key, val);  // get previous value, set new value
		this.fireEvent('set', [this, val, key, old_val]);

		return old_val;
	},

	remove: function(key){
		key = this._safeKey(key);

		var old_val = this.el.remove(this.options.name, key);  // remove key, and return previous value
		this.fireEvent('remove', [this, val, key]);

		return old_val;
	},

	_safeKey: function(str){
		return str.replace(/_/g, '__').replace(/ /g, '_s');
	}

});


/*
 * The contents of gears_init.js; we need this because Chrome supports
 * Gears out of the box, but still requires this constructor.  Note that
 * if you include gears_init.js then this function does nothing.
 */
(function(){
	// We are already defined. Hooray!
	if (window.google && google.gears) return;

	// factory
	var F = null;

	// Firefox
	if (typeof GearsFactory != 'undefined'){
		F = new GearsFactory();
	} else {
		// IE
		try{
			F = new ActiveXObject('Gears.Factory');
			// privateSetGlobalObject is only required and supported on WinCE.
			if (F.getBuildInfo().indexOf('ie_mobile') != -1){
				F.privateSetGlobalObject(this);
			}
		} catch (e){
			// Safari
			if ((typeof navigator.mimeTypes != 'undefined') && navigator.mimeTypes["application/x-googlegears"]){
				F = new Element('object', {width:0,height:0,type:'pplication/x-googlegears',styles:{display:'name'}}).inject(document.documentElement);
			}
		}
	}

	// *Do not* define any objects if Gears is not installed. This mimics the
	// behavior of Gears defining the objects in the future.
	if (!F) return;

	// Now set up the objects, being careful not to overwrite anything.
	//
	// Note: In Internet Explorer for Windows Mobile, you can't add properties to
	// the window object. However, global objects are automatically added as
	// properties of the window object in all browsers.
	if (!window.google) google = {};
	if (!google.gears) google.gears = {factory: F};
})();
