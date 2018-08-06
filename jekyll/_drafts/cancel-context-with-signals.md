---
layout: post
title:  "Context cancelation using signals"
---

Recent version of Go provide the [context](https://golang.org/pkg/context/)
package which, among many great features, allows you to propagate request
cancelation though your program in a consistent, concurrency-safe manner.

An example of "request cancelation" would be stopping all running http.Handler
goroutines, currently servicing web requests, as quickly as possible when your
program wants to terminate.

Traditionally, you might use a global `var stopping = false` flag or similar
somewhere, and check that flag via atomic access, before any long running code
executes.

One problem with this approach is that foreign APIs (e.g. your database driver)
won't respect this flag. If you've just executed a long running query, you must
wait for it to return before you can cancel the request.

Go's context package provides a standard way to signal cancelation, by closing
the `Context.Done` channel of a `Context` obect. This object can be passed to
any foreign API that supports it and allow cancelations to propagate much
faster and more reliably.

If you have written highly concurrent code, context is a superior method for
propagating cancelation. But often the need to cancel is triggered by way of
a signal from the operation system, like `SIGTERM`, instructing your program to
exit.

Traditional signal handler functions might atomically toggle the `stopping`
flag, hoping that any running code will check it before continuing too far. In
our case, we want to take advantage of the clean and reliable cancelation that
`Context` offers us, but trigger it with a process signal.

