/*
 ---

 name: Persist

 script: Persist.js

 description: MUI - Provides the ability to cache data in the browser

 copyright: (c) 2010 Contributors in (/AUTHORS.txt).

 license: MIT-style license in (/MIT-LICENSE.txt).

 authors:
 oroginal - Paul Duncan (paul@pablotron.org) <http://github.com/jeremydurham/persist-js>
 mootools adaptation - Chris Doty

 note:
 This documentation is taken directly from the javascript source files. It is built using Natural Docs.

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

MUI.files['source|Core/Persist.js'] = 'loaded';

MUI.Persist = (MUI.Persist || $H({})).extend({

	options: {
		name: 'MUI',
		about: 'Persistent storage for MochaUI',
		provider: 'auto',

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
			version: '1',					// db schema version
			// XXX: the "IF NOT EXISTS" is a sqlite-ism; fortunately all the
			// known DB implementations (safari and gears) use sqlite
			create:   "CREATE TABLE IF NOT EXISTS persist_data (k TEXT UNIQUE NOT NULL PRIMARY KEY, v TEXT NOT NULL)",
			get:	  "SELECT v FROM persist_data WHERE k = ?",
			set:	  "INSERT INTO persist_data(k, v) VALUES (?, ?)",
			remove:   "DELETE FROM persist_data WHERE k = ?"
		},

		flash: {											// default flash configuration
			div_id:		'_persist_flash_wrap',	// ID of wrapper element
			id:			'_persist_flash',				// id of flash object/embed
			path:		'persist.swf',					// default path to flash object
			height:	1,
			width:		1,
			params:	{									// arguments passed to flash object
				autostart: true
			}
		},

		onGet: $empty,
		onSet: $empty,
		onRemove: $empty
	},

	Providers: {},

	ProviderTests: {
		'Gears': function(){
			return (window.google && window.google.gears) ? true : false;
		},

		'WhatWG': function(){
			if (!window.openDatabase) return false;
			return window.openDatabase('PersistJS Test', MUI.Cache.options.sql.version, 'Persistent database test.', this.size);
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

		if (options) $extend(MUI.Persist.options, options);
		options = MUI.Persist.options;

		if (options.provider == 'auto') options.provider = false;
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
		if (options.provider){
			this._providerClass = 'MUI.Persist.Providers.' + options.provider;
			var klass = MUI['Persist']['Providers'][options.provider];
			this.currentProvider = new klass();
			this.size = this.currentProvider.options.size;
		}
	},

	get: function(key){
		if (!this.currentProvider) this.initialize();
		return this.currentProvider.get(key);
	},

	set: function(key, val){
		if (!this.currentProvider) this.initialize();
		return this.currentProvider.set(key, val);
	},

	remove: function(key){
		if (!this.currentProvider) this.initialize();
		return this.currentProvider.remove(key, val);
	}

});

MUI.Persist.Providers.Gears = new Class({

	Implements: [Events,Options],

	options: {
		size:	-1
	},

	initialize: function(options){
		this.options = $extend(this.options, MUI.Persist.options);
		this.setOptions(options);
		var db;
		db = this.db = google.gears.factory.create('beta.database');
		db.open(this.safeKey(this.options.name));
		db.execute(this.options.sql.create).close();
	},

	get: function(key){
		var getSql = this.options.sql.get;
		if (this.options.onGet == $empty || this.options.onGet == null) return null;
		var val;
		this._transaction(function (t){
			var row = t.execute(getSql, [key]);
			var valid = row.isValidRow();
			val = valid ? row.field(0) : null;
			row.close();
			this.fireEvent('get', [this,val,key]);
		});
		return val;
	},

	set: function(key, val){
		var removeSql = this.options.sql.remove;
		var setSql = this.options.sql.set;
		var old_val = this.get(key);
		this._transaction(function(t){
			t.execute(removeSql, [key]).close();
			t.execute(setSql, [key, val]).close();
			this.fireEvent('set', [this,val,key,old_val]);
		});
	},

	remove: function(key){
		var getSql = this.options.sql.get;
		var removeSql = this.options.sql.remove;
		var val = null, valid = false;

		this._transaction(function(t){
			if (this.options.onGet != $empty && this.options.onGet != null){
				var row = t.execute(getSql, [key]);
				valid = row.isValidRow();
				val = valid ? row.field(0) : null;
				row.close();
			}
			if (valid) t.execute(removeSql, [key]).close();
			this.fireEvent('remove', [this,val,key]);
		});
		return val;
	},

	_transaction: function(fn){
		var db = this.db;
		db.execute('BEGIN').close();
		fn.call(this, db);
		db.execute('COMMIT').close();
	},

	safeKey: function(str){
		return str.replace(/_/g, '__').replace(/ /g, '_s');
	}

});

MUI.Persist.Providers.WhatWG = new Class({

	Implements: [Events,Options],

	options: {
		size:	200 * 1024		// size based on DatabaseExample from above (should I increase this?)
	},

	initialize: function(options){
		this.options = $extend(this.options, MUI.Persist.options);
		this.setOptions(options);
		this.db = openDatabase(this.options.name, this.options.sql.version, this.options.about, this.options.size);
	},

	get: function(key){
		var getSQL = this.options.sql.get;
		var val;
		this._transaction(function (t){
			t.executeSql(getSQL, [key], function(t, r){
				val = r.rows.length > 0 ? r.rows.item(0).v : null;
				this.fireEvent('get', [this,val,key]);
			});
		});
		return val;
	},

	set: function(key, val){
		var removeSql = this.options.sql.remove;
		var setSql = this.options.sql.set;
		var old_val = this.get(key);
		this._transaction(function(t){
			t.executeSql(removeSql, [key], function(){
				t.executeSql(setSql, [key, val], function(){
					this.fireEvent('set', [this,val,key,old_val]);
				});
			});
		});
		return val;
	},

	remove: function(key){
		var getSql = this.options.sql.get;
		var removeSql = this.options.sql.remove;
		this._transaction(function(t){
			t.executeSql(getSql, [key], function(t, r){
				if (r.rows.length > 0){
					var val = r.rows.item(0).v;
					t.executeSql(removeSql, [key]);
					this.fireEvent('set', [this,val,key]);
				}
			});
		});
	},

	_transaction: function(fn){
		if (!this.db_created){
			this.db._transaction(function(t){
				t.executeSql(this.options.sql.create, [], function(){
					this.db_created = true;
				});
			}, $empty);
		}
		this.db._transaction(fn);
	},

	safeKey: function(str){
		return str.replace(/_/g, '__').replace(/ /g, '_s');
	}

});

MUI.Persist.Providers.GlobalStorage = new Class({

	Implements: [Events,Options],

	options: {
		size:	5 * 1024 * 1024		// (5 meg limit, src: http://ejohn.org/blog/dom-storage-answers/)
	},

	initialize: function(options){
		this.options = $extend(this.options, MUI.Persist.options);
		this.setOptions(options);
		this.store = globalStorage[this.o.domain];
	},

	_key: function(key){
		return this.safeKey(this.options.name) + this.safeKey(key);
	},

	get: function(key){
		key = this._key(key);
		var val = this.store.getItem(key);
		this.fireEvent('get', [this,val,key]);
		return val;
	},

	set: function(key, val){
		key = this._key(key);
		var old_val = this.store.getItem(key);
		this.store.setItem(key, val);
		this.fireEvent('set', [this,val,key,old_val]);
	},

	remove: function(key){
		key = this._key(key);
		var val = this.store[key];
		this.store.removeItem(key);
		this.fireEvent('remove', [this,val,key]);
	},

	safeKey: function(str){
		return str.replace(/_/g, '__').replace(/ /g, '_s');
	}

});

MUI.Persist.Providers.LocalStorage = new Class({

	Implements: [Events,Options],

	options: {
		prefix:	'_persist_data-'
	},

	initialize: function(options){
		this.options = $extend(this.options, MUI.Persist.options);
		this.setOptions(options);
		this.id = this.options.prefix + this.safeKey(this.options.name);
		this.el = new Element('div', {'id':this.id,styles:{'display':'none'}}).inject(document.body);
		if (this.options.defer) this._load();
	},

	get: function(key){
		key = this.safeKey(key);
		var val = this.el.retrieve(key);
		this.fireEvent('get', [this,val,key]);
		return val;
	},

	set: function(key, val){
		key = this.safeKey(key);
		var old_val = this.el.retrieve(key);
		this.el.store(key, val);
		this.fireEvent('set', [this,val,key,old_val]);
	},

	remove: function(key){
		key = this.safeKey(key);
		if (!this.options.defer) this._load();
		var val = this.el.retrieve(key);
		this.el.eliminate(key);
		this.fireEvent('remove', [this,val,key]);
	},

	safeKey: function(str){
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
		this.options = $extend(this.options, MUI.Persist.options);
		this.setOptions(options);
		this.id = this.options.prefix + this.safeKey(this.options.name);
		this.el = new Element('div', {'id':this.id,styles:{'display':'none'}}).inject(document.body);
		if (this.options.defer) this._load();
	},

	get: function(key){
		key = this.safeKey(key);
		var val = this.el.retrieve(key);
		this.fireEvent('get', [this,val,key]);
		return val;
	},

	set: function(key, val){
		key = this.safeKey(key);
		var old_val = this.el.retrieve(key);
		this.el.store(key, val);
		this.fireEvent('set', [this,val,key,old_val]);
	},

	remove: function(key){
		key = this.safeKey(key);
		if (!this.options.defer) this._load();
		var val = this.el.retrieve(key);
		this.el.eliminate(key);
		this.fireEvent('remove', [this,val,key]);
	},

	safeKey: function(str){
		return str.replace(/_/g, '__').replace(/ /g, '_s');
	}

});

MUI.Persist.Providers.Cookie = new Class({

	Implements: [Events,Options],

	options: {
		size:	4000,			// 4k limit (low-ball this limit to handle browser weirdness, and so we don't hose session cookies)
		delim: ':',
		domain: false,
		path: false,
		duration: 365,
		secure: false
	},

	initialize: function(options){
		this.options = $extend(this.options, MUI.Persist.options);
		this.setOptions(options);

		var o = this.options;
		o.domain = o.domain || location.host || 'localhost';
		o.domain = o.domain.replace(/:\d+$/, '');
		o.domain = (o.domain == 'localhost') ? '' : o.domain;
	},

	key: function(key){
		return this.options.name + this.options.delim + key;
	},

	get: function(key){
		var val;
		key = this.key(key);
		val = Cookie.read(key);
		this.fireEvent('get', [this,val,key]);
	},

	set: function(key, val){
		key = this.key(key);
		var old_val = Cookie.read(key);
		Cookie.write(key, val, this.options);
		this.fireEvent('set', [this,val,key,old_val]);
	},

	remove: function(key){
		key = this.key(key);
		var val = Cookie.read(key);
		Cookie.dispose(key, this.options);
		this.fireEvent('remove', [this,val,key]);
	},

	safeKey: function(str){
		return str.replace(/_/g, '__').replace(/ /g, '_s');
	}

});

MUI.Persist.Providers.Flash = new Class({

	Implements: [Events,Options],

	options: {
		size:	-1
	},

	initialize: function(options){
		this.options = $extend(this.options, MUI.Persist.options);
		this.setOptions(options);
		if (!MUI.Persist.options.flash.el){
			var cfg = this.options.flash;
			cfg.container = new Element('div', {'id':this.options.flash.div_id}).inject(document.body);
			MUI.Persist.options.flash.el = new Swiff(cfg.path, cfg);
		}
		this.el = MUI.Persist.options.flash.el;
	},

	get: function(key){
		key = this.safeKey(key);
		var val = this.el.get(this.options.name, key);
		this.fireEvent('get', [this,val,key]);
		return val;
	},

	set: function(key, val){
		key = this.safeKey(key);
		var old_val = this.el.set(this.options.name, key, val);
		this.fireEvent('set', [this,val,key,old_val]);
		return old_val;
	},

	remove: function(key){
		key = this.safeKey(key);
		var val = this.el.remove(this.options.name, key);
		this.fireEvent('remove', [this,val,key]);
	},

	safeKey: function(str){
		return str.replace(/_/g, '__').replace(/ /g, '_s');
	}

});
