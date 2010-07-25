Class: MUI.Persist {#MUI-Persist}
=============================

Adds ability to cache data in the browser.

### Syntax:

	MUI.Persist.initialize(options);

### Properties:

* currentProvider - (*object*) - instance of the current provider
** syntax - MUI.Persist.currentProvider
* size - (*integer*) - largest size of a value that can be stored
** syntax - MUI.Persist.size

### Arguments:

options - (*object*) - Options listed below.

#### Options:

* name			- (*string*, defaults to 'MUI') - name added to keys in some of the providers.
* provider		- (*string*, defaults to 'auto') - set this to force the use of a provider.
* searchOrder	- (*array*, defaults to ['LocalStorage','GlobalStorage','Gears','WhatWG','Cookie','IE','Flash']) - providers search order - Note that the search order is significant; the providers are listed in order of capacity, and many browsers support multiple providers, so changing the search order could result in a browser choosing a less capable providers.
* sql			- (*hash*) - options used for db providers.
** create		- (*string*) - sql used to create the database table.
** get			- (*string*) - sql used to get a value from the table.
** set			- (*string*) - sql used to update the value of a key in the table.
** remove		- (*string*) - sql used to delete a value from the table.
* flash			- (*hash*) - options used for flash provider.
** id			- (*string*, defaults to '_persist_flash') - id of flash object/embed.
** divID		- (*string*, defaults to '_persist_flash_wrap') - ID of the wrapper element.
** path			- (*string*, defaults to 'persist.swf') - default path to flash object.
** height		- (*integer*, defaults to 1) - height of flash object, should remain default of 1
** width		- (*integer*, defaults to 1) - width of flash object, should remain default of 1
** params		- (*hash*) - arguments passed to flash object.
*** autostart	- (*boolean*, defaults to true) - should remain default of true

### Events:

* get			- (*function*) callback is executed when a value is retrieved.
* set			- (*function*) callback is executed when a value is stored.
* remove		- (*function*) callback is executed when a value is removed.

### Returns:

nothing

## Events

### get

* (*function*) callback is executed when a value is retrieved.

#### Signature:

		onGet( provider, value, key )

#### Arguments:

1. provider	- (*object*) the instance of provider that fired the event.
2. value	- (*string*) the value of that was retrieved.
3. key		- (*string*) the name of the value that was retrieved.

### set

* (*function*) callback is executed when a value is stored.

#### Signature:

		onSet( provider, value, key, previous )

#### Arguments:

1. provider	- (*object*) the instance of provider that fired the event.
2. value	- (*string*) the value of that was stored.
3. key		- (*string*) the name of the value that was stored.
4. previous - (*string*) the old value before the new value was stored.

### remove

* (*function*) callback is executed when a value is removed.

#### Signature:

		onSRemove( provider, value, key )

#### Arguments:

1. provider	- (*object*) the instance of provider that fired the event.
2. value	- (*string*) the old value before the new value was removed.
3. key		- (*string*) the name of the value that was removed.

