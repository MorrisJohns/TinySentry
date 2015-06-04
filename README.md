# TinySentry

This pushes exception or logging info into GetSentry.com from the browser.

Similar to the combination of https://github.com/getsentry/raven-js with https://github.com/csnover/TraceKit, but shorter code and hopefully a little more readable.

Please don't report bugs, features, or ask me anything. This is a simplification of other code, provided only because it might be useful to others.

*Bug* GetSentry is consolidating/aggregating errors when it shouldn't be - not sure why - but the problem makes this code fairly useless.

To use, you will need to change the sentry_project and sentry_key. Go to Settings | Client Keys in getsentry.com dashboard and get the project and key from out of the client key e.g. `https://ab1234ab1234ab1234ab1234ab1234:0987654321cdef0987654321cdef@app.getsentry.com/99999` where the number at the end is the sentry_project and the uid at the start is the sentry_key.

Ground up rewrite (instead of raven.js) because:
 - I found raven.js hard to use
 - raven.js plus tracekit.js is 16000 bytes, versus tinysentry.js is 3000 bytes (approx compressed but not gzipped byte counts).
 - raven.js/tracekit.js loses stack information because they drop stack frames if they can't parse them (eval, internal functions, anonymous functions etc).

Take extra care if editing this code because if this code has exceptions, you won't know about it!

Fiddler will prevent logging for some browsers. e.g. Firefox won't allow https interception, so nothing gets logged if Fiddler running.

You can capture onerror by calling TinySentry.onerrorRegister(). Exceptions caught this way are logged as level:'info' because it is presumed that you use try/catch around your JavaScript entry points, in which case most errors caught by onerror are in third party code that you can't care about or fix.

Stack frames are supported by modern browsers (IE10+, most FF, Android AOSP, Chrome, iOS8+). Older browsers won't get the stack.

If you are self hosting GetSentry code, the maybe look at https://github.com/Banno/getsentry-javascript-lite
