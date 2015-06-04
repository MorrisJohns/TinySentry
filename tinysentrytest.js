
/*
<div>Refresh between clicking again because only first exception is logged.</div>

<button onclick=DebugSentryTest.logSomethingClick()>log something</button>
<br>

<button onclick=DebugSentryTest.tryCatchClick()>try catch</button>
<br>

<button onclick=DebugSentryTest.onerrorClick()>window.onerror</button>
<br>

<span>Message:</span>
<input id=message value="Test testtesttest">
<button onclick=DebugSentryTest.ownmessageClick()>own message</button>
<br>
*/

(function () {

	function myTest1() {
		errorFunction();
	}

	function anon() {
		return function(x) {x()};
	}

	function go() {
		anon()(evalTest);
	}

	function tryCatchClick() {
		errorFunction = function() {
			zzzzzzz;
		};
		try {
			go();
		} catch (e) {
			TinySentry.log(e, 'tryCatchClick', {eventType: event && event.type});
		}
	}

	function onerrorClick() {
		errorFunction = function() {
			yyyyyyy;
		};
		go();
	}

	function logSomethingClick() {	
		TinySentry.log('Log something', 'logSomethingClick', null, {level: 'warning'});
	}

	function ownmessageClick() {	
		TinySentry.onerrorRegister();
		errorFunction = function() {
			xxxxxx;
		};
		var message = document.getElementById('message').value;
		try {
			go();
		} catch (e) {
			TinySentry.log(message, 'ownmessageClick', {eventType: event && event.type}, {ex: e});
		}
	}

	var errorFunction;

	var evalTest = eval('functionInEval = function(){myTest1()}').bind({});

	window.TinySentryTest = {
		tryCatchClick: tryCatchClick,
		onerrorClick: onerrorClick,
		logSomethingClick: logSomethingClick,
		ownmessageClick: ownmessageClick
	};

})();
