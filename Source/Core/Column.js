/*
 ---

 script: Column.js

 description: Column control for horizontal layouts.

 copyright: (c) 2010 Contributors in (/AUTHORS.txt).

 license: MIT-style license in (/MIT-LICENSE.txt).

 requires:
 - MochaUI/MUI
 - MUI.Desktop
 - MUI.Panel

 provides: [MUI.Column]

 ...
 */

MUI.files[MUI.path.source + 'Column.js'] = 'loaded';

/*

 Class: Column
 Create a column. Columns should be created from left to right.

 Syntax:
 (start code)
 MUI.Column();
 (end)

 Arguments:
 options

 Options:
 id - The ID of the column. This must be set when creating the column.
 container - Defaults to MUI.Desktop.pageWrapper.
 placement - Can be 'right', 'main', or 'left'. There must be at least one column with the 'main' option.
 width - 'main' column is fluid and should not be given a width.
 resizeLimit - resizelimit of a 'right' or 'left' column.
 sortable - (boolean) Whether the panels can be reordered via drag and drop.
 onResize - (function) Fired when the column is resized.
 onCollapse - (function) Fired when the column is collapsed.
 onExpand - (function) Fired when the column is expanded.

 */
MUI.Column = new Class({

	Implements: [Events, Options],

	options: {
		id:				null,
		container:		null,
		placement:		null,
		width:			null,
		resizeLimit:	[],
		sortable:		true,
		isCollapsed:	false

		// Events
		//onResize:		null,
		//onCollapse:	null,
		//onExpand:		null

	},

	initialize: function(options){
		this.setOptions(options);

		Object.append(this, {
			timestamp: Date.now(),
			isCollapsed: false,
			oldWidth: 0
		});

		// If column has no ID, give it one.
		if (this.options.id == null){
			this.options.id = 'column' + (++MUI.Columns.columnIDCount);
		}

		// Shorten object chain
		options = this.options;
		var instances = MUI.Columns.instances;

		if (options.container == null){
			options.container = MUI.Desktop.pageWrapper
		}
		else {
			$(options.container).setStyle('overflow', 'hidden');
		}

		if (typeof this.options.container == 'string'){
			this.options.container = $(this.options.container);
		}

		// Check if column already exists
		if (this.columnEl){
			return;
		}
		else {
			instances[options.id]=this;
		}

		// If loading columns into a panel, hide the regular content container.
		if ($(options.container).getElement('.pad') != null){
			$(options.container).getElement('.pad').hide();
		}

		// If loading columns into a window, hide the regular content container.
		if ($(options.container).getElement('.mochaContent') != null){
			$(options.container).getElement('.mochaContent').hide();
		}

		this.columnEl = new Element('div', {
			'id': this.options.id,
			'class': 'column expanded',
			'styles': {
				'width': options.placement == 'main' ? null : options.width
			}
		}).inject($(options.container));

		this.columnEl.store('instance', this);

		var parent = this.columnEl.getParent();
		var columnHeight = parent.getStyle('height').toInt();
		this.columnEl.setStyle('height', columnHeight);

		if (this.options.sortable){
			if (!this.options.container.retrieve('sortables')){
				var sortables = new Sortables(this.columnEl, {
					opacity: 1,
					handle: '.panel-header',
					constrain: false,
					revert: false,
					onSort: function(){
						$$('.column').each(function(column){
							column.getChildren('.panelWrapper').each(function(panelWrapper){
								panelWrapper.getElement('.panel').removeClass('bottomPanel');
							});
							if (column.getChildren('.panelWrapper').getLast()){
								column.getChildren('.panelWrapper').getLast().getElement('.panel').addClass('bottomPanel');
							}
							column.getChildren('.panelWrapper').each(function(panelWrapper){
								var panel = panelWrapper.getElement('.panel');
								var column = panelWrapper.getParent().id;
								instance = MUI.Panels.instances[panel.id];
								instance.options.column = column;
								if (instance){
									var nextpanel = panel.getParent().getNext('.expanded');
									if (nextpanel){
										nextpanel = nextpanel.getElement('.panel');
									}
									instance.partner = nextpanel;
								}
							});
							MUI.panelHeight();
						}.bind(this));
					}.bind(this)
				});
				this.options.container.store('sortables', sortables);
			}
			else {
				this.options.container.retrieve('sortables').addLists(this.columnEl);
			}
		}

		if (options.placement == 'main'){
			this.columnEl.addClass('rWidth');
		}

		switch (this.options.placement){
			case 'left':
				this.handleEl = new Element('div', {
					'id': this.options.id + '_handle',
					'class': 'columnHandle'
				}).inject(this.columnEl, 'after');

				this.handleIconEl = new Element('div', {
					'id': options.id + '_handle_icon',
					'class': 'handleIcon'
				}).inject(this.handleEl);

				addResizeRight(this.columnEl, options.resizeLimit[0], options.resizeLimit[1]);
				break;
			case 'right':
				this.handleEl = new Element('div', {
					'id': this.options.id + '_handle',
					'class': 'columnHandle'
				}).inject(this.columnEl, 'before');

				this.handleIconEl = new Element('div', {
					'id': options.id + '_handle_icon',
					'class': 'handleIcon'
				}).inject(this.handleEl);
				addResizeLeft(this.columnEl, options.resizeLimit[0], options.resizeLimit[1]);
				break;
		}

		if (this.options.isCollapsed && this.options.placement != 'main'){
			this.columnToggle();
		}

		if (this.handleEl != null){
			this.handleEl.addEvent('dblclick', function(){
				this.columnToggle();
			}.bind(this));
		}

		MUI.rWidth();

	},

	columnCollapse: function(){
		var column = this.columnEl;

		this.oldWidth = column.getStyle('width').toInt();

		this.resize.detach();
		this.handleEl.removeEvents('dblclick');
		this.handleEl.addEvent('click', function(){
			this.columnExpand();
		}.bind(this));
		this.handleEl.setStyle('cursor', 'pointer').addClass('detached');

		column.setStyle('width', 0);
		this.isCollapsed = true;
		column.addClass('collapsed');
		column.removeClass('expanded');
		MUI.rWidth();
		this.fireEvent('onCollapse');

		return true;
	},

	columnExpand : function(){
		var column = this.columnEl;

		column.setStyle('width', this.oldWidth);
		this.isCollapsed = false;
		column.addClass('expanded');
		column.removeClass('collapsed');

		this.handleEl.removeEvents('click');
		this.handleEl.addEvent('dblclick', function(){
			this.columnCollapse();
		}.bind(this));
		this.resize.attach();
		this.handleEl.setStyle('cursor', Browser.webkit ? 'col-resize' : 'e-resize').addClass('attached');

		MUI.rWidth();
		this.fireEvent('onExpand');

		return true;
	},

	columnToggle: function(){
		if (!this.isCollapsed) this.columnCollapse();
		else this.columnExpand();
	}
});

MUI.append({
	/*

	 Function: closeColumn
	 Destroys/removes a column.

	 Syntax:
	 (start code)
	 MUI.closeColumn();
	 (end)

	 Arguments:
	 columnEl - the ID of the column to be closed

	 Returns:
	 true - the column was closed
	 false - the column was not closed

	 */
	closeColumn: function(columnEl){
		columnEl = $(columnEl);
		if (columnEl == null) return;
		var instances = MUI.Columns.instances;
		var instance = instances[columnEl.id];
		if (instance == null || instance.isClosing) return;

		instance.isClosing = true;

		// Destroy all the panels in the column.
		var panels = $(columnEl).getElements('.panel');
		panels.each(function(panel){
			MUI.closePanel(panel.id);
		}.bind(this));

		if (Browser.ie){
			columnEl.dispose();
			if (instance.handleEl != null){
				instance.handleEl.dispose();
			}
		}
		else {
			columnEl.destroy();
			if (instance.handleEl != null){
				instance.handleEl.destroy();
			}
		}

		if (MUI.Desktop){
			MUI.Desktop.resizePanels();
		}

		var sortables = instance.options.container.retrieve('sortables');
		if (sortables) sortables.removeLists(columnEl);

		instances.erase(instance.options.id);
		return true;
	},
	/*

	 Function: closePanel
	 Destroys/removes a panel.

	 Syntax:
	 (start code)
	 MUI.closePanel();
	 (end)

	 Arguments:
	 panelEl - the ID of the panel to be closed

	 Returns:
	 true - the panel was closed
	 false - the panel was not closed

	 */
	closePanel: function(panelEl){
		panelEl = $(panelEl);
		if (panelEl == null) return;
		var instances = MUI.Panels.instances;
		var instance = instances[panelEl.id];
		if (panelEl != $(panelEl) || instance.isClosing) return;

		var column = instance.options.column;

		instance.isClosing = true;

		var columnInstances = MUI.Columns.instances;
		var columnInstance = columnInstances[column];

		if (columnInstance.options.sortable){
			columnInstance.options.container.retrieve('sortables').removeItems(instance.panelWrapperEl);
		}

		instance.panelWrapperEl.destroy();

		if (MUI.Desktop){
			MUI.Desktop.resizePanels();
		}

		// Do this when creating and removing panels
		var panels = $(column).getElements('.panelWrapper');
		panels.each(function(panelWrapper){
			panelWrapper.getElement('.panel').removeClass('bottomPanel');
		});
		if (panels.length > 0) panels.getLast().getElement('.panel').addClass('bottomPanel');

		instances.erase(instance.options.id);
		return true;

	}
});
