var initializeWindows = function(){

	// change default setting - keep window within inside the main area.
	MUI.Windows.options.container = 'pageWrapper';

	// Build windows onLoad
	MUI.myChain.callChain();
};

var testPeriodId;
var statusPeriodId;
var initializeColumns = function(){

	new MUI.Column({
		id: 'mainColumn',
		placement: 'main',
		resizeLimit: [100, 300]
	});

	new MUI.Column({
		id: 'sideColumn',
		placement: 'right',
		width: 320,
		resizeLimit: [200, 320]
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
					{'text':'Automatic','title':'Automatic Unit Tests'},
					{'text':'Interactive','title':'Interactive Unit Tests'}
				],
				onLoaded: function(element, uOptions, json){
					MUI.create({
						control: 'MUI.Tabs',
						container:'test-panel',
						position: 'header',
						tabs:json,
						partner:'test-panel',
						onTabSelected: function(tab, value){
							buildTestTree(value);
							if(!testPeriodId) testPeriodId = doAutomatedTests.periodical(1000);
						}
					})
				}
			}
		]
	});

	MUI.myChain.callChain();

	testPeriodId = doAutomatedTests.periodical(1000);
	statusPeriodId = doUpdateStatuses.periodical(1000);
};

var testList = null;
var loadingCount = 0;
var buildTestTree = function(testType){
	if (!testList){
		new Request({
			'url':'tests.json'
			,onSuccess:function(json){
				testList = JSON.decode(json);
				buildTestTree(testType);
			}
			,onComplete:function(){
				loadingCount--;
				$('test-panel').hideSpinner();
			}
			,onRequest:function(){
				loadingCount++;
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
					loadingCount--;
					$('test-panel').hideSpinner();
				},
				onRequest:function(){
					loadingCount++;
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
		MUI.create({
			control: 'MUI.Tree',
			id: 'testTree',
			container: 'test-panel',
			idField: 'title',
			textField: 'title',
			valueField: 'title',
			titleField: 'error',
			nodes: tests,
			onLoaded: function() {
				testTree=MUI.get('testTree');
			}
		});
	} else testTree.draw();
};

var logResult = function() {
	var msg;
	if(this.lastResult==-1) return;
	if(this.lastResult) msg=this.title+' - ok';
	else msg=this.title+' - failed';
	if(this.error) msg+=' - ' + this.error;
	new Element('div',{'text':msg,'class':(this.lastResult?'good':'failed')}).inject('testOutput_pad');
};

var doAutomatedTests = function(nodes,recurse) {
	if(loadingCount>0) return;
	if(nodes==null) {
		var testTree=MUI.get('testTree');
		if(!testTree) return;
		nodes=testTree.options.nodes;
	}
	if(!recurse) $('testOutput_pad').empty();
	nodes.each(function(test) {
		if(test.test) {
			test.logResult = logResult.bind(test);
			try {
				test.lastResult=test.test();
			} catch(e) {
				test.lastResult = false;
				test.error = e.message;
			}
			test.logResult();
		}
		if(test.nodes) doAutomatedTests(test.nodes,true);
	});

	clearTimeout(testPeriodId);
};

var doUpdateStatuses = function(nodes) {
	var testTree=MUI.get('testTree');
	if(!testTree) return;
	if(nodes==null) nodes=testTree.options.nodes;
	nodes.each(function(test) {
		if(test.lastResult==-1) return;
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
				MUI.Desktop.initialize({'createTaskbar':false});
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
				spin.inject($('test-panel_collapseBox'), 'top');
				$('test-panel_collapseToggle').setStyle('float', 'right');
			}
			).callChain();
});
