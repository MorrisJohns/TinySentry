# TinySentry

This pushes exception or logging info into GetSentry.com from the browser, like https://github.com/getsentry/raven-js but shorter code and hopefully a little more readable.

Please don't report bugs, features, or ask me anything. This is a simplification of other code, provided only because it might be useful to others.

*Bug* GetSentry is consolidating/aggregation errors when it shouldn't be - not sure why - but the problem makes this code fairly useless.

Ground up rewrite (instead of raven.js) because:
 - raven.js drops stack frames if it can't parse them
 - I found raven.js hard to use
 - raven.js is 8K4 versus tinysentry.js 2K6 (compressed but not gzipped byte counts).

Take extra care if editing this code because if this code has exceptions, you won't know about it.

Fiddler will prevent logging for some browsers. e.g. Firefox won't allow https interception, so nothing gets logged if Fiddler running.

You can capture onerror by calling TinySentry.onerrorRegister(). Exceptions caught this way are logged as level:'info' because it is presumed that you use try/catch around your JavaScript entry points, in which case most errors caught by onerror are in third party code that you can't care about or fix.

Stack frames are supported by modern browsers (IE10+, most FF, Android AOSP, Chrome, iOS8+). Older browsers won't get the stack.

If you are self hosting GetSentry code, the maybe look at https://github.com/Banno/getsentry-javascript-lite
