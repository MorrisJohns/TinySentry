/*! Tiny Sentry
 *  Copyright (c) 2015, Morris Johns, All rights reserved. License: https://github.com/MorrisJohns/TinySentry/blob/master/LICENSE
 */

// * Redistributions of source code must retain the above copyright notice, this
//   list of conditions and the following disclaimer.
// 
// * Redistributions in binary form must reproduce the above copyright notice,
//   this list of conditions and the following disclaimer in the documentation
//   and/or other materials provided with the distribution.
// 
// THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
// AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
// IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
// DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE
// FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
// DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
// SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
// CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
// OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
// OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.


// ABOUT Pushes exception or logging info into GetSentry.com from the browser. Tries to have readable code, while keeping the code length small.
// PLEASE don't report bugs, features, or ask me anything. This is a simplification of our production code, provided as parts may be useful.
// AGGRIVATION GetSentry is consolidating/aggregation errors when it shouldn't be - not sure why - makes this code not very useful.
// DOESNT depend on raven.js because (a) raven.js drops stack frames if it can't parse them, (b) I found raven.js hard to use, and (c) raven.js is 8K4 versus tinysentry.js 2K6 (compressed but not gzipped byte counts).
// EXTRA CAREFUL if making changes because if this code has exceptions, you won't know about it.
// FIDDLER will prevent logging for some browsers. e.g. Firefox won't allow https interception, so nothing gets logged if Fiddler running.
// ONERROR can capture exceptions by calling TinySentry.onerrorRegister(). Exceptions caught this way are logged as level:'info' because it is presumed that you use try/catch around your JavaScript entry points, in which case most errors caught by onerror are in third party code that you can't care about or fix.
// STACK FRAMES supported by modern browsers (IE10+, most FF, Android AOSP, Chrome, iOS8+).
// SELF HOSTED getsentry can use https://github.com/Banno/getsentry-javascript-lite

// To log exceptions:
// function someFunc(param1, param2) {
//    try {
//      your code
//    catch(e) {
//      TinySentry.log(e, 'someFunc', {param1: param1, param2: param2});
//	if (developer_on_desktop) throw e;
//    }
// }

// To log anything else example:
//      TinySentry.log('Some log text');
//      TinySentry.log('Other log text', 'someOtherFunc', {errorDetail: errorDetail, eventType: event && event.type}, {level: 'warning'});

window.TinySentry = {

	// !!!!!!!!!!!!!!!!!!!!!!!! PUT YOUR GETSENTRY.COM PROJECT NUMBER AND KEY HERE !!!!!!!!!!!!!!!!!!!!!!!!

	sentry_project: 99999,

	sentry_key: 'ab1234ab1234ab1234ab1234ab1234',	// From example: https://ab1234ab1234ab1234ab1234ab1234:0987654321cdef0987654321cdef@app.getsentry.com/99999

	logged: {},

	log: function(e, fnName, tags, logOpts) {
		try {		// comment out try/catch if debugging TinySentry
			if (!this.inEx && window.JSON) {		// Prevent accidental recursion. Requires JSON
				this.inEx = 1;
				logOpts = logOpts || {};
				var msg = '' + (logOpts.log || e.message || e);
				if (msg && !this.logged[msg]) {
					this.logged[msg] = 1;	// Don't log same message twice
					var exception = logOpts.ex || e;

					this.send(msg, tags || logOpts.tags, fnName, logOpts.level, (exception instanceof Error) ? exception : undefined, logOpts.earg);
				}
			}
		} catch(e1) {
			// console.log('TinySentry had an exception!! ' + e1);
		}
		this.inEx = undefined;
	},

	send: function(message, optTags, fnName, level, exception, onerrorArguments) {

		var tags = {
			fnname: fnName,
			string: message,	// Useful duplication so you can see if getsentry incorrectly consolidating multiple errors into a single error
			osplatform: navigator.platform
			// ADD context here (current view, server version, javascript version etc)
			// version: '1.2.3.4'
		};

		for (var tagKey in optTags) {
			tags[tagKey] = optTags[tagKey];
		}

		var data = {
			level: level,	// getsentry defaults to error if undefined
			message: message,
			platform: 'javascript',	// required
			tags: tags,
			http: {
				url: this.noHash(location.href),
				headers: {
					'User-Agent': navigator.userAgent
				}
			}
			// Optional GetSentry variables:
			//'sentry.interfaces.User': {
			//	id: theUserIdString
			//}
			// logger: 'javascript'
			// site: blah
			// project: blah
		};

		// data.extra = extra || {};
		// extra['session:duration'] = now() - startTime

		if (onerrorArguments || exception instanceof Error) {
			var frames = this.getStackFrames(exception) || (onerrorArguments && this.makeErrorFrame.apply(this, onerrorArguments));
			if (frames) {
				data.culprit = frames[0].filename || location.pathname || 'somewhere';
				var stackTrace = data['stacktrace'] = {
					frames: frames
				};
				var exceptionType = (exception && exception.name) || (onerrorArguments ? 'ONERR' : 'HUH');	// e.name not set for a string, or for window.onerror
				data['exception'] = {
					type: '' + exceptionType,
					value: (exception && exception.message) || message
				}
			} else if (exception) { // incase we couldn't parse stack
				tags.stack = (exception.stack && ('' + exception.stack).substr(0, 1000)) || 'missing';
			}
		}

		var sentryPath = 'https://app.getsentry.com' + '/api/' + this.sentry_project + '/store/';
		/*
		// Gives: X-Sentry-Error: Client/server version mismatch: Unsupported client
		// Presumably GetSentry doesn't allow POST from raven.js endpoint
		if (window.XMLHttpRequest && window.FormData) {
			var formData = new FormData();
			formData.append('sentry_version', 4);
			formData.append('sentry_client', 'raven-js/1.1.18');
			formData.append('sentry_key', this.sentry_key);
			formData.append('sentry_data', encodeURIComponent(JSON.stringify(data)));
			var xhr = new XMLHttpRequest;
			xhr.open('POST', sentryPath);
			xhr.send(formData);
		} else {	// Else use Image.src technique
		*/
		var sentryImageSrc = function() {
			return sentryPath +
				'?sentry_version=4' +
				'&sentry_client=raven-js/1.1.18' +
				'&sentry_key=' + this.sentry_key +
				'&sentry_data=' + encodeURIComponent(JSON.stringify(data));
		}.bind(this);
		if (stackTrace) {
			var fromFrame = 0;	// never remove frame 0
			var toFrame = frames.length - 1;
			while (sentryImageSrc().length > 4000 && fromFrame < toFrame) {	// Try to get size of url below 4k by removing frames
				fromFrame = Math.min(fromFrame+4, toFrame);
				var newFrames = frames.slice(fromFrame);	// frame 0 is outermost caller, last frame is deepest function in stack (hopefully where exception happened)
				newFrames.unshift({'function':'[snipped ' + (toFrame - fromFrame - 2) +']'});
				newFrames.unshift(frames[0]);		// keep top frame (entrypoint implies certain things). Particularly for Firefox
				stackTrace.frames = newFrames;
			}
		}
		(new Image).src = sentryImageSrc();
	},

	onerrorRegister: function() {
		if (!this.onerror) {
			window.onerror = this.onerror = function(message, url, lineno, colno, exception) {
				if (('' + message) == '[object Event]') {
					message = 'AOSP!CORS';
				}
				var e = exception;
				if (!e) {
					e = 'ONERROR ' + message + ' in ' + /^[^?#]+/.exec(url || location) + ' line ' + lineno + ' col ' + colno;
				}
				this.log(e, 'window.onerror', undefined, {ex: exception, earg: arguments, level: 'info'});
			}.bind(this);
		}
	},

	makeErrorFrame: function(message, url, lineno, colno, exception) {
		if (lineno >= 0) {
			return [{
				filename: this.shortUrl(url || location),
				'function': 'window_onerror',
				lineno: lineno,
				colno: colno
			}];
		}
	},

	getStackFrames: function(ex) {
		var frames = [];
		if (!ex || !ex.stack) {
			return;
		}
		var
			// For IE8 see: https://bugsnag.com/blog/js-stacktraces/#the-ugly   and    http://helephant.com/2007/05/12/diy-javascript-stack-trace/
			// For Chrome could use more complex API: https://code.google.com/p/v8/wiki/JavaScriptStackTraceApi
			chromeOrIe = /^\s*at ([^ (]+) [(]((?:file:|http:|https:)[^ )(]+):(\d+):(\d+)[)]$/,
			firefoxOrIos = /^\s*([^@]+)@((?:file:|http:|https:)[^ ]+):(\d+):(\d+)$/,
			lines = ex.stack.split('\n'),	// Note ex.stack is only last ten calls in Chrome and IE
			lineCount = lines.length;
		for (var i = 0; i < lineCount; i++) {
			var line = lines[i];
			if (line) {
				if (!i && ex.name && line.indexOf(ex.name) == 0) {		// Ignore first line in Chrome or IE
					continue;
				} else {
					var match = chromeOrIe.exec(line) || firefoxOrIos.exec(line);
					if (!match) {
						match = [0, '\xA1' + this.shortUrl(line) + '!', 'unk', -1, -1];	// Unknown format - put raw string into "function"
					}
					frames.unshift({
						filename: this.shortUrl(match[2]),	// Need to simplify some stuff or GetSentry won't consolidate errors
						'function': (match[1] || '').replace(/\.prototype|^window\.|^Object\.(window\.)?/g, ''),
						lineno: +match[3],
						colno: +match[4]
					});
				}
			}
		}
		if (frames.length) {
			return frames;	// [length-1] last element is frame where error occurred. [0] is JavaScript entry point on Firefox (e.g. onTimeout, onevent) or 10th frame back for IE/Chrome
		}
	},

	noHash: function(url) {	// Presume hash contains private information so remove it
		return '' + /^[^#]*/.exec(url);
	},

	shortUrl: function(url) {
		var origin = (/^\w+:\/\/[^\/]+/.exec(url)||0)[0];
		if (origin == (location.protocol + '//' + location.host)) {
			url = url.replace(origin, '');	// Also helps prevent running over 4k limit for encoded image url
		}
		return this.noHash(url) || 'who';
	}

}
