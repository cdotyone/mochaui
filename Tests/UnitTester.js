var initializeWindows = function(){

	// change default setting - keep window within inside the main area.
	MUI.Windows.options.container = 'pageWrapper';

	// Build windows onLoad
	MUI.myChain.callChain();
};

var initializeColumns = function(){

	new MUI.Column({
		id: 'mainColumn',
		placement: 'main',
		resizeLimit: [100, 300]
	});

	new MUI.Column({
		id: 'sideColumn',
		placement: 'right',
		width: 230,
		resizeLimit: [200, 300]
	});

	// Add panels to main column
	new MUI.Panel({
		id: 'mainPanel',
		title: '',
		contentURL: 'pages/blank.html',
		column: 'mainColumn'
	});

	new MUI.Panel({
		id: 'testOutput',
		contentURL: 'pages/blank.html',
		column: 'mainColumn',
		height: 200,
		title:'Test Output'
	});

	new MUI.Panel({
		id: 'test-panel',
		column: 'sideColumn',
		content: 'Loading...',
		loadMethod: 'html',
		sections: [
			{
				position: 'header',
				section: 'tabs',
				empty: true,
				loadMethod:'json',
				content: [
					{'text':'Automatic','url':'pages/overview.html','title':'Automatic Unit Tests'},
					{'text':'Interactive','url':'pages/download.html','title':'Interactive Unit Tests'}
				],
				onContentLoaded: function(element, uOptions, json){
					MUI.create('MUI.Tabs', {
						'container':'test-panel',
						'position': 'header',
						'tabs':json,
						'partner':'test-panel',
						onTabSelected: function(tab, value){
							buildTestTree(value);
						}
					})
				}
			}
		]
	});

	MUI.myChain.callChain();
};

var testList = null;
var statusPeriodId;
var buildTestTree = function(testType){
	if (!testList){
		new Request({
			'url':'tests.json'
			,onSuccess:function(json){
				testList = JSON.decode(json);
				buildTestTree(testType);
			}
			,onComplete:function(){
				$('test-panel').hideSpinner();
			}
			,onRequest:function(){
				$('test-panel').showSpinner();
			}
		}).get();
		return;
	}

	var tests = [];
	testList.each(function(testSource){
		if(!testSource.requested) {
			if(testSource.js!=null && !testSource.sourceLoaded) {
				new MUI.Require({
					'js':testSource.js,
					'onload':function() {
						testSource.sourceLoaded = true;
						buildTestTree(testType);
					}
				});
				return;
			}

			testSource.requested = true;
			new Request({
				'url':testSource.source
				,secure:false
				,onSuccess:function(json){
					testSource.tests = JSON.decode(json).tests;
					buildTestTree(testType);
				}
				,onFailure:function(){
					testSource.nodes = [];
				}
				,onComplete:function(){
					$('test-panel').hideSpinner();
				},
				onRequest:function(){
					$('test-panel').showSpinner();
				}
			}).get();
		} else testSource.added=false;
		if(testSource.tests!=null) {
			testSource.tests.each(function(test) {
				if((test.test!=null && (testType=='Automatic' || testType=='All')) || (test.test==null && (testType=='Interactive' || testType=='All'))) {
					if(!testSource.added) {
						testSource.added = true;
						tests.push(testSource);
						testSource.nodes=[];
					}
					test.image="loading";
					testSource.nodes.push(test);
				}
			});
		}
	});

	if(tests.length==0) return;
	var testTree=MUI.get('testTree');
	if(!testTree) {
		MUI.create('MUI.Tree', {
			'id':'testTree',
			'container':'test-panel',
			'idField':'title',
			'textField':'title',
			'valueField':'title',
			'titleField':'error',
			'nodes':tests,
			onContentLoaded: function() {
				testTree=MUI.get('testTree');
				if(testType=='Automatic' || testType=='All') doAutomatedTests(testTree.options.nodes);
				if(!statusPeriodId) statusPeriodId=doUpdateStatuses.periodical(1000,testTree,[testTree.options.nodes]);
			}
		});
	} else testTree.draw();
};

var doAutomatedTests = function(nodes) {
	nodes.each(function(test) {
		if(test.test) {
			try {
				test.lastResult=test.test();
				var msg=test.title+' - ok';
				if(test.error) msg+=' - ' + test.error;
				new Element('div',{'text':msg,'class':'good'}).inject('testOutput_pad');
			} catch(e) {
				test.lastResult = false;
				test.error = e.message;
				new Element('div',{'text':test.title+' - '+e.message,'class':'failed'}).inject('testOutput_pad');
			}
		}
		if(test.nodes) doAutomatedTests(test.nodes);
	});
};

var doUpdateStatuses = function(nodes) {
	var testTree=MUI.get('testTree');
	nodes.each(function(test) {
		if(test.lastResult!=null && test._span!=null) {
			test.image=test.lastResult ? 'good' : 'failed';
			testTree.nodeRefresh(test);
		}
		if(test.nodes) doUpdateStatuses(test.nodes);
	});
};

// Initialize MochaUI options
MUI.initialize();

// Initialize MochaUI when the DOM is ready
window.addEvent('load', function(){ //using load instead of domready for IE8
	MUI.myChain = new Chain();
	MUI.myChain.chain(
			function(){
				MUI.Desktop.initialize({'createDock':false});
			},
			function(){
				initializeColumns();
			},
			function(){
				initializeWindows();
			},
			function(){
				var spin = $('spinnerWrapper').dispose();
				spin.setStyles({'display':'block','float':'left'});
				spin.inject($('test-panel_headerCollapseBox'), 'top');
				$('test-panel_collapseToggle').setStyle('float', 'right');
			}
			).callChain();
});
