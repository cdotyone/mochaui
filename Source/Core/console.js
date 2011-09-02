/*
 ---

 script: console.js

 description: core console/debug output functions

 copyright: MochaUI (c) 2011 Contributors in (/AUTHORS.txt), Nathan Cook

 license: MIT-style license in (/MIT-LICENSE.txt).

 requires:
 - MochaUI/MUI
 - Core/Array
 - Core/Element
 - Core/Browser

 provides: [MUI.console]

 Global parameters in MUI:
 	MUI.options.consoleOutput - Global parameter for console/debug output. defaults to false
 	MUI.options.consoleTarget - Global parameter for the target of console/debug output. defaults to null (window.console).

 ...
 */

 MUI.console = Object.append(MUI.console || {});
 
 /*
 	Options and methods used internally 	
 */
 Object.append(MUI.console, {
 		
 		resetOutputTarget:false,
		lastOutputTarget:null,
		
		resetConsoleGlobal:false,
		lastConsoleGlobal:null,				

 		bound: null,

 		buffer: [],
 		processBuffer: true,
 		processBufferDelay: 100,

 		_processOutputBuffer: function(){
 		 	
 		 	if(MUI.console.buffer.length === 0) return;

 			MUI.console._checkBuffer();
 			
			Array.each(MUI.console.buffer, function(item){
				if(MUI.console.processBuffer)
				{
					if(item.ready)
					{
						MUI.console._outputToTarget(item);
					}
				}
			});

			var remaining = Array.filter(MUI.console.buffer, function(item){
				return item.processed === false;
			});

			MUI.console.buffer.empty();

			if(remaining.length > 0)
			{
				Array.each(remaining, function(item){
					MUI.console.buffer.push(item);				
				});
			}
 		},
 		
 		_checkBuffer: function()
 		{
 			var targetType = ''; 			
 		
 			Array.each(MUI.console.buffer, function(item){
 				targetType = item.type;
 				
 				if((targetType === 'string' || targetType === 'element') && (!item.ready || !$(item.target))){
 						
 					if($(item.target)){ 
	 					item.ready = true;	 				
		 			}

		 			if(targetType === 'string' && MUI.instances && MUI.instances[item.target] && MUI.instances[item.target].el)
			 		{		 		
						if(MUI.instances[item.target].el.content){
							item.target = MUI.instances[item.target].el.content;

						}else if(MUI.instances[item.target].el.element){
							item.target = MUI.instances[item.target].el.element;

						}else if(MUI.instances[item.target].el.contentWrapper){
							item.target = MUI.instances[item.target].el.contentWrapper;
						}

						item.ready = true;
					}				
		 		}
 			}); 			
 		},
 		 		 		
 		_outputToTarget: function(outputParameters){ 			

 			switch (outputParameters.type)
 			{
				case 'string': case 'element':			
					
				    new Element('div', 
				    {
				    	text: outputParameters.content.messageText,
				    	class: outputParameters.content.messageType
				    
				    }).inject($(outputParameters.target), 'top');				    
				  	
				break;
				case 'function':				

					outputBufferItem.target({
 						id:outputParameters.id, 				
 						type: outputParameters.type,
 						content: outputParameters.content
 					});
				
				break;
				default:

					window.console[outputParameters.content.messageType].apply(window.console, outputParameters.content.messageText); 	
			}

			outputParameters.processed = true;

			if(outputParameters.resetTarget !== false)
			{
				/*This is a lame way of handling situations where a function logging target 
				  is taking a too long to finish whatever it's doing with the output, like if
				  the function is sending the console output to the server with a request.
				  If I ever start to do logging like that I'll see about making this more robust.				  			 
				*/
				if(outputParameters.type === 'function')
				{					
					outputParameters.processed = false;
					
					(function(){
						MUI.options.consoleTarget = this.resetTarget;
						MUI.console.resetOutputTarget = false;
						MUI.console.lastOutputTarget = null;				
						outputParameters.processed = true;												
					}).delay(1500, outputParameters);						
					
				}else
				{
					MUI.options.consoleTarget = outputParameters.resetTarget;
					MUI.console.resetOutputTarget = false;
					MUI.console.lastOutputTarget = null;
				}
								
			}else if(outputParameters.resetTarget === false && MUI.console.resetOutputTarget)
			{
				MUI.options.consoleTarget = MUI.console.lastOutputTarget;
				MUI.console.resetOutputTarget = false;
				MUI.console.lastOutputTarget = null;
			}

			if(MUI.console.resetConsoleGlobal)
			{
				MUI.options.consoleOutput = MUI.console.lastConsoleGlobal;
				MUI.console.resetConsoleGlobal = false;
				MUI.console.lastConsoleGlobal = null;
			}
			
 		},
 			
			
		_getOutputParams: function(consoleMessage, messageType)
		{	
			
			var doConsoleOutput = false;

			/*
			The next three boolean variables (hasConsoleParam, hasIdentifier, isBoundMocha)
			are used to allow control of console output on a per control, per instance basis.

			What values they take depends on the scope of the function - whether it is bound to a
			specific control instance object or not, whether that instance object has a 'consoleOutput' option
			or not, etc.			
			*/
			
			//if hasConsoleParam = true,
			//the _getOutputParams function is bound to an object, like a control instance object,
			//and the object has a class option named 'consoleOutput' that is not equal to null

			if(this.options && this.options.consoleOutput !== null){
				var hasConsoleParam = true;
			}
			
			
			
			//if hasIdentifier = true,
			//function is bound to an object, 
			//and the object has a value defined for 'id'
			var hasIdentifier = true;			
			if(typeof this._outputToTarget !== 'undefined'){ 
				hasIdentifier = false;
			}else {
				hasIdentifier = !!(Object.keys(MUI.instances).contains(this.options.id) === true); 
			}
			
			//if isBoundMocha = true,
			//function is bound to an object, 
			//and the object is a MochaUI NamedClass			
			var isBoundMocha = !!(typeof this.options !== 'undefined' && typeof(this.options.control) === 'string'); 	
			
			var consoleParamType = typeOf(MUI.options.consoleOutput);			
			
			if(hasConsoleParam)
			{
				doConsoleOutput = this.options.consoleOutput;
				
			}else
			{
				if(consoleParamType === 'boolean')
				{
					doConsoleOutput = MUI.options.consoleOutput;	
					
				}else if(consoleParamType === 'array')
				{
					if(isBoundMocha)
					{
						doConsoleOutput = Array.from(MUI.options.consoleOutput).contains(this.options.control);
					}

					if(!doConsoleOutput)
					{
						if(hasIdentifier)
						{
							doConsoleOutput = Array.from(MUI.options.consoleOutput).contains(MUI.getID(this));	
						}
					}
												
					if(!hasIdentifier && !isBoundMocha)
					{		
						if(Array.from(MUI.options.consoleOutput).contains("all"))
						{
							doConsoleOutput = true;
														
						}else
						{							
							Array.each(MUI.options.consoleOutput, function(debugParam){							
								 
								Array.each(consoleMessage, function(cMessage){
									
									if(typeOf(cMessage) === 'string')
									{
										var tMessage = cMessage.toLowerCase();
										if(tMessage.contains(this)) doConsoleOutput = true;
									}
									
								}.bind(debugParam.toLowerCase()));
								
							});
						}						
					}
										
				}else
				{
					if(typeof(window.console) == 'object' && typeof(window.console.log) != "undefined")
					{
						console.log("The global debug parameter can only be a boolean or an array value");
					}else
					{
						alert("The global debug parameter can only be a boolean or array value");							
					}

					return;					
				}
								
			}
			
			
			if(doConsoleOutput)
			{


				var outputTarget = MUI.options.consoleTarget;				
				var outputTargetType = typeOf(outputTarget);	
				
				if(consoleMessage.length === 1 && typeOf(consoleMessage[0]) === 'string') consoleMessage = consoleMessage[0];

				if(outputTargetType !== 'null' && outputTargetType !== 'function' && outputTargetType !== 'string' && outputTargetType !== 'element')
				{
					outputTargetType = null;
					outputTarget = null;
				}

				messageType = (messageType || "log");

				var outputParameters = {
					id: String.uniqueID(),
					ready: true,
					processed:false,
					target: outputTarget,
					resetTarget: false,				
					type: outputTargetType,
					content: {
						date: new Date().format('%H:%M:%S'),
						browser: {
								name: Browser.name,
								version: Browser.version
						},
						messageText: consoleMessage,
						messageType: messageType
					}					
				};

				if(MUI.console.resetTarget){
					
					outputParameters.resetTarget = MUI.console.lastOutputTarget;					
				}
				
				switch (outputTargetType)
				{
					case 'string': case 'element':										

					outputParameters.content.messageText = '['+messageType+'] '+ new Date().format('%H:%M:%S: ') + outputParameters.content.messageText;

					if(!$(outputTarget) && (MUI.instances && !MUI.instances[outputTarget])){
												
						outputParameters.ready = false;
						outputParameters.unreadyReason = "Output Target is set to a DOM element or a MUI instance that does not exist";						
					
					}

						if(MUI.instances && MUI.instances[outputTarget] && MUI.instances[outputTarget].el)
						{
							if(MUI.instances[outputTarget].el)
							{
								if(MUI.instances[outputTarget].el.content){
									outputTarget = MUI.instances[outputTarget].el.content;

								}else if(MUI.instances[outputTarget].el.element){
									outputTarget = MUI.instances[outputTarget].el.element;

								}else if(MUI.instances[outputTarget].el.contentWrapper){
									outputTarget = MUI.instances[outputTarget].el.contentWrapper;
								}
							}

							outputParameters.target = outputTarget;							
						}

					break;
					case 'function':
												
						outputParameters.content.messageText = consoleMessage;						

						if(MUI.console[outputTarget])
						{
							outputParameters.target = MUI.console[outputTarget];

						}else if(MUI.registered[outputTarget])
						{
							outputParameters.target = MUI.registered[outputTarget];

						}else if(window[outputTarget])
						{
							outputParameters.target = window[outputTarget];

						}else
						{
							outputParameters.ready = false;
							outputParameters.unreadyReason = "Output Target is set to a function that does not exist";							
						}
										 	
					break;				 	
					default:					
						
						outputParameters.content.messageText = Array.from(consoleMessage);

						var consoleType = typeof(window.console);

						if(consoleType !== 'object') 
						{
							item.ready = false;
							item.unreadyReason = "Output Target is set to the browser console, but the console is not currently available";

						}else if(window.console[outputParameters.content.messageType] === "undefined")
						{
							if(window.console.log !== 'undefined')
							{
								outputParameters.content.messageType = 'log';

							}else
							{
								outputParameters.ready = false;
								outputParameters.unreadyReason = "Output Target is set to browser console, but console does not allow the smessage type specified"
							}
						}					
				}
			
				//If the recently prepared console output item is ready to go, and the buffer is relatively small, go ahead and write 
				//the console output the its target. Otherwise, add the output object to the buffer
				if((outputParameters.ready && MUI.console.processBuffer && MUI.console.buffer.length <= 5) || MUI.console.resetGlobalParam)
				{
					MUI.console._outputToTarget(outputParameters);

				}else
				{
					MUI.console.buffer.push(outputParameters);
				}					
				
			}								
							
		}
 }); 

Object.append(MUI.console, {
		
		log: function()
		{	
			if(MUI.console.bound !== null)
			{
				 MUI.console._getOutputParams.apply(MUI.console.bound, [arguments, "log"]);
				 MUI.console.bound = null;
				 
			}else
			{ 
				MUI.console._getOutputParams(arguments, "log");
			}			
		},		
				
		debug: function()
		{
			if(MUI.console.bound !== null)
			{
				 MUI.console._getOutputParams.apply(MUI.console.bound, [arguments, "debug"]);
				 MUI.console.bound = null;
				 
			}else
			{ 
				MUI.console._getOutputParams(arguments, "debug");
			}
		},
		
		info: function()
		{
			if(MUI.console.bound !== null)
			{
				 MUI.console._getOutputParams.apply(MUI.console.bound, [arguments, "info"]);
				 MUI.console.bound = null;
				 
			}else
			{ 
				MUI.console._getOutputParams(arguments, "info");
			}
		},						

		error: function()
		{
			if(MUI.console.bound !== null)
			{
				 MUI.console._getOutputParams.apply(MUI.console.bound, [arguments, "error"]);
				 MUI.console.bound = null;
				 
			}else
			{ 
				MUI.console._getOutputParams(arguments, "error");
			}		
		},
		
		warn: function()
		{
			if(MUI.console.bound !== null)
			{
				 MUI.console._getOutputParams.apply(MUI.console.bound, [arguments, "warn"]);
				 MUI.console.bound = null;
				 
			}else
			{ 
				MUI.console._getOutputParams(arguments, "warn");
			}
		},		
			
		bind: function(obj)
		{			
			MUI.console.bound = obj;
			return MUI.console;
		},		
	 
		/* 
		 * Sets the output target of the next debug message, after which the debug target is returned to its original value
		 * 
		 * Usage Example:
		 * 		MUI.console.setNextTarget('mochaConsole').log('MUI.demo::onDrawEnd: Parametrics is undefined (not loaded yet!)');
		 */
		setNextTarget: function(target)
		{
			MUI.console.lastOutputTarget = MUI.options.consoleTarget;
			MUI.options.consoleTarget = target;
			MUI.console.resetOutputTarget = true;			
			return MUI.console;
		},
		
		/*
		 *	Utility function - outputs to console regardless of value set for MUI.options.consoleOutput.
		 *  Useful when troubleshooting changes and you'd like to output something to the console, 
		 *  but don't want to turn on debug output for the rest of the application. 	 
		 */
		
		sLog: function()
		{
			MUI.console.resetConsoleGlobal = true;
			MUI.console.lastConsoleGlobal = MUI.options.consoleOutput;
			MUI.options.consoleOutput = true;
					
			MUI.console._getOutputParams(arguments, "log");
		},
		
		clear: function(){
			if(MUI.console.outputTarget === null){ 
			
				console.clear(); 
			
			}else if(typeOf(MUI.console.outputTarget) === 'string')
			{
				MUI.get(MUI.console.outputTarget).el.content.empty();
			}

			if(MUI.console.resetOutputTarget)
			{
				MUI.options.consoleTarget = MUI.console.lastOutputTarget;
				MUI.console.resetOutputTarget = false;
				MUI.console.lastOutputTarget = null;
			}

			if(MUI.console.resetConsoleGlobal)
			{
				MUI.options.consoleOutput = MUI.console.lastConsoleGlobal;
				MUI.console.resetConsoleGlobal = false;
				MUI.console.lastConsoleGlobal = null;
			}			
		}	
});

window.addEvent("load", function(){

	MUI.console.processBufferTimer = MUI.console._processOutputBuffer.periodical(MUI.console.processBufferDelay);
});

window.addEvent("unload", function(){

	clearInterval(MUI.console.processBufferTimer);

});