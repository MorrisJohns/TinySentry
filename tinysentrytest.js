

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
		TinySentry.onerrorRegister();
		errorFunction = function() {
			yyyyyyy;
		};
		go();
	}

	function logSomethingClick() {	
		TinySentry.log('Log something', 'logSomethingClick', null, {level: 'warning'});
	}

	function tryCatch2Click() {	
		function aFunction() {
			xxxxxx;
		};
		errorFunction = aFunction;
		var message = document.getElementById('message').value;
		try {
			go();
		} catch (e) {
			TinySentry.log('Another try catch', 'ownmessageClick', {eventType: event && event.type}, {ex: e});
		}
	}

	function ownmessageClick() {	
		var message = document.getElementById('message').value;
		TinySentry.log(message, 'ownmessageClick', {eventType: event && event.type});
	}

	var errorFunction;

	var evalTest = eval('functionInEval = function(){myTest1()}').bind({});

	window.TinySentryTest = {
		tryCatchClick: tryCatchClick,
		tryCatch2Click: tryCatch2Click,
		onerrorClick: onerrorClick,
		logSomethingClick: logSomethingClick,
		ownmessageClick: ownmessageClick
	};

})();
