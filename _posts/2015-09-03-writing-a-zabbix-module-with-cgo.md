---
layout: post
title:  "Writing a Zabbix module with cgo"
---

So first thing out of the way, if you want to write a Zabbix module the easy way with Go, I've done
all of the hard work for you and packaged it up as [g2z](https://github.com/cavaliercoder/g2z). G2z
lets you write a module in pure Go without having to touch a line of C code and with a fully
documented API. Nice!

If you prefer the road less traveled, this article will describe how to write a module using
[cgo](https://golang.org/cmd/cgo/). The result will be a shared C library (.so) written in Go which
extends Zabbix by exposing the required C functions. The complete example which re-implements the
dummy C module published by Zabbix is [attached below](#complete-example).

> Looking to write Zabbix modules in __Rust__? Check out
  [Marin Atanasov Nikolov's blog](https://dnaeon.github.io/extending-zabbix-with-rust/)

This article assumes you are competent with C, Go and familiar with writing Zabbix modules in C. My
intention is to save you the hassle of solving some of the problems I encountered trying to write a
module (and the g2z adapter) in Go.

Comments and questions are welcomed below!

## Table of contents

* [Prerequisites](#prerequisites)
* [Building a shared library](#building-a-shared-library)
* [Loading a Zabbix module](#loading-a-zabbix-module)
* [Mandatory module interface](#mandatory-module-interface)
* [Defining items](#defining-items)
* [Getting parameter values](#getting-parameter-values)
* [Returning a value](#returning-a-value)
* [Unsupported items](#unsupported-items)
* [Calling Zabbix functions](#calling-zabbix-functions)
* [Logging](#logging)
* [Complete example](#complete-example)

## Prerequisites

You're going to need the following prerequisites:

* Zabbix v2.2.0 or above (agent and sources)

* Go v1.5 or above

* GNU build tools

It's also worthwhile to familiarize yourself with some background concepts:

* Interfacing between C and Go with [cgo](https://golang.org/cmd/cgo/)

* Writing Zabbix [loadable modules](https://www.zabbix.com/documentation/2.2/manual/config/items/loadablemodules)
  in C

* Writing [Go shared libraries](https://github.com/jbuberel/buildmodeshared)

## Building a shared library

Go v1.5 and above has the capability to build shared libraries which can expose functions to C. To
successfully compile a shared library in Go:

* Define a mandatory `main.Main()` entry point

* Import cgo via `import "C"`

* build with the `-buildmode=c-shared` argument

{% highlight go %}
package main

import "C"

func main() {
	panic("THIS_SHOULD_NEVER_HAPPEN")
}

{% endhighlight %}

The `C` package (a.k.a `cgo`) exposes C APIs to Go and allows us to use functions and constants
defined in the Zabbix C header files. It also allows us to expose Go functions to C (i.e. the Zabbix
agent) using the `//export` directive (__note__ no spaces after `//`).

As a shortcut to build your module, the following `Makefile` will save you some time:

{% highlight makefile %}
PACKAGE = dummy

all: $(PACKAGE).so

$(PACKAGE).so: $(PACKAGE).go
	go build -x -buildmode=c-shared -o $(PACKAGE).so

{% endhighlight %}

Just call `make` from your project directory to compile the module.

## Loading a Zabbix module

You'll need to load your module into the Zabbix agent using the `LoadModulePath` and `LoadModule`
configuration directives. Please see the Zabbix documentation for further details.

Once loaded, there are three ways to test your custom item checks:

* Test an individual key with `zabbix_agentd -t <key>`

* Test all keys using their test parameters with `zabbix_agentd -p`

* Test an individual key against a daemonized agent with `zabbix_get -s <host> -k <key>`. Be
  sure to restart the agent to reload your module each time you recompile it before running tests.

## Mandatory module interface

Let's start by satisfying the minimum interace for Zabbix to be able to load the module. This means
implementing `zbx_module_api_version()` and `zbx_module_init()`. Note the `//export` directive
above each function to expose them to C. 

We're also going to use some constants defined in the Zabbix sources in `include/module.h`. To call
C code (in this case to import `module.h` and its prerequisites) we need to create a cgo preamble
which is simply C code encapsulated in Go comments (`/* */`), immediately preceeding `import "C"`,
with no additional whitespace or line breaks.

Use `zbx_module_init()` to execute actions when the Zabbix agent loads your module. Actions might
include starting a timer or tailing a log file.

Only one version of the module API is currently supported so `zbx_module_api_version()` should
always return `C.ZBX_MODULE_API_VERSION_ONE`.

Note below we've included `zbx_module_item_list()`. Despite what the Zabbix documentation says, the
agent won't load unless this function is also defined. We'll come back to implementing this function
correctly later.

{% highlight go %}
package main

/*
#include <stdint.h>

#include "module.h"
*/
import "C"

func main() {
	panic("THIS_SHOULD_NEVER_HAPPEN")
}

//export zbx_module_api_version
func zbx_module_api_version() C.int {
	return C.ZBX_MODULE_API_VERSION_ONE
}

//export zbx_module_init
func zbx_module_init() C.int {
	return C.ZBX_MODULE_OK
}

//export zbx_module_item_list
func zbx_module_item_list() *C.ZBX_METRIC {
	// create null-terminated array of C.ZBX_METRICS
	// length should be the number of metrics plus one
	metrics := make([]C.ZBX_METRIC, 4)

	return &metrics[0]
}

{% endhighlight %}

Compile your module with `make`. You can see the exported functions by running

	$ nm -gl <module>.so
	000000000005ef40 T zbx_module_api_version	/tmp/go-build120687282/_/usr/src/zbx/_obj/_cgo_export.c:9
	000000000005ef70 T zbx_module_init		/tmp/go-build120687282/_/usr/src/zbx/_obj/_cgo_export.c:21
	000000000005efa0 T zbx_module_item_list		/tmp/go-build120687282/_/usr/src/zbx/_obj/_cgo_export.c:33

Restart your Zabbix agent. You should see an entry in the agent log file similar to

	loaded modules: <module>.so

You may also optionally implement `zbx_module_uninit()` to execute actions when Zabbix unloads the
module and `zbx_module_item_timeout()` to retrieve the configured timeout to obey for all item
checks.

{% highlight go %}
//export zbx_module_uninit
func zbx_module_uninit() C.int {
	return C.ZBX_MODULE_OK
}

var Timeout int

//export zbx_module_item_timeout
func zbx_module_item_timeout(timeout C.int) {
	Timeout = int(timeout)
}

{% endhighlight %}

## Defining items

Each item in your module is defined in a `C.ZBX_METRIC` structure which includes an item 'key', test
parameters, configuration flags and a C function to call when the agent queries the item. All of
your items must be registered to the Zabbix agent when it calls the `zbx_module_item_list()`
function in your module. This function must return a `NULL` terminated array of metric structs.

To pass a pointer to your handler function to Zabbix, we need to tell Go how to cast it to C. Add
the following typedef in your C preample:

{% highlight c %}
typedef int (*agent_item_handler)(AGENT_REQUEST*, AGENT_RESULT*);

{% endhighlight %}

Each item you define must have a matching, exported function with the following Go signature:

{% highlight go %}
//export go_echo
func go_echo(request *C.AGENT_REQUEST, result *C.AGENT_RESULT) C.int {
	// do all the things
}

{% endhighlight %}

The C signature for the function must also be declared in the preamble as:

{% highlight c %}
int go_echo(AGENT_REQUEST *request, AGENT_RESULT *result);

{% endhighlight %}

Add each item to the array returned by `zbx_module_item_list()`. The `metrics` array length should
be the number of items exported, plus one (the `NULL` terminator).

{% highlight go %}
//export zbx_module_item_list
func zbx_module_item_list() *C.ZBX_METRIC {
	metrics := make([]C.ZBX_METRIC, 2)

	metrics[0] = C.ZBX_METRIC{
		key:        C.CString("go.echo"),
		flags:      C.CF_HAVEPARAMS,
		function:   C.agent_item_handler(unsafe.Pointer(C.go_echo)),
		test_param: C.CString("hello,world"),
	}

	return &metrics[0]
}

{% endhighlight %}

Use the exported name of your item callback function in the `function` field (notice we cast it
as the `agent_item_handler` typedef from earlier).

If your item accepts parameters, set `flags` to `C.CF_HAVEPARAMS`; otherwise `0`.

To pass test parameters to your item when `zabbix_agentd -p` is called, specify a comma separated
list of parameters in `test_param` or `nil`.

> You may observe that `C.CString` allocates memory on the heap which is not cleaned up. This
  function is only called once and the return value persists for the life of the agent PID so I don't
  consider this a problem. Please feel free to convince me otherwise.

Because Go slices include an additional header compared with C arrays, we return the address of the
first element in the slice, rather than the slice iteself.

## Getting parameter values

The macro `get_rparam` (defined in `module.h`) is used in Zabbix C code to retrieve a key parameter
from an agent request. While Go does support pre-compiler macros, the implementation for
`get_rparam` doesn't unpack in Go.

To solve this, we could implement `get_rparam` directly in Go but we could run into upgrade problems
if Zabbix ever change their implementation. It's also not very pleasant trying to index a `**char`
in Go.

Instead we'll just create a C wrapper function in the preamble.

{% highlight c %}
static char *cgo_get_rparam(AGENT_REQUEST *request, int i) {
	return get_rparam(request, i);
}

{% endhighlight %}

Now you can use the following to retrieve a zero-indexed request parameter in your item functions:

{% highlight go %}
param := C.cgo_get_rparam(request, 0)

{% endhighlight %}

To validate the number of parameters passed to an item, just compare `request.nparam`.

## Returning a value

When writing a module in C, you would use the `SET_*_RESULT()` function macros from `module.h` to
set the return value and type on the `AGENT_RESULT` struct. Once again, unfortunately, these macros
don't unpack into Go so we need to add some wrapper functions to the C preamble.

You only need to define wrapper functions for the return types you intend to use.

{% highlight c %}
static void cgo_set_ui64_result(AGENT_RESULT *result, zbx_uint64_t val)
{
	SET_UI64_RESULT(result, val);
}

static void cgo_set_dbl_result(AGENT_RESULT *result, double val)
{
	SET_DBL_RESULT(result, val);
}

static void cgo_set_str_result(AGENT_RESULT *result, char *val)
{
	SET_STR_RESULT(result, val);
}

static void cgo_set_test_result(AGENT_RESULT *result, char *val)
{
	SET_STR_RESULT(result, val);
}

static void cgo_set_log_result(AGENT_RESULT *result, zbx_log_t **val)
{
	SET_LOG_RESULT(result, val);
}

static void cgo_set_msg_result(AGENT_RESULT *result, char *val)
{
	SET_MSG_RESULT(result, val);
}

{% endhighlight %}

You can now set a return value on the result struct in your handler function like so:

{% highlight go %}
//export go_echo
func go_echo(request *C.AGENT_REQUEST, result *C.AGENT_RESULT) C.int {
	C.cgo_set_str_result(result, C.CString("Hello world")) // zabbix will free the C.CString
	return C.SYSINFO_RET_OK
}

{% endhighlight %}


## Unsupported items

If you need to raise an error in your handler functions (i.e. `ZBX_NOT_SUPPORTED`), simply return
`C.SYSINFO_RET_FAIL`. If you would like to also set an optional error message (which appears in the
Zabbix web console on the 'Not Supported' error icon), you can use the `SET_MSG_RESULT` macro
wrapper described above.

E.g.

{% highlight go %}
//export go_echo
func go_echo(request *C.AGENT_REQUEST, result *C.AGENT_RESULT) C.int {
	C.cgo_set_msg_result(result, C.CString("Something went wrong")) // zabbix will free the C.CString
	return C.SYSINFO_RET_FAIL
}

{% endhighlight %}

## Calling Zabbix functions

So far our module exposes a bunch of functions with bindings for C so the Zabbix agent can load and
call our Go code. While not essential, it can be useful to call C functions inside Zabbix from Go.
One example use case is to call `zabbix_log()` for writing messages to the Zabbix agent log file.

The primary complication in calling Zabbix functions is that during compilation or when executing
tests (via `go test`), the Zabbix function symbols cannot be resolved (because they are not in a
shared module and your module is not yet loaded in Zabbix).

For example, if you attempt to call `zabbix_log()` (which is a macro for `__zbx_zabbix_log()`), you
will see a compilation error similar to the following:

	/tmp/go-build376688079/_/usr/src/g2z/direct/_obj/dummy.cgo2.o: In function `cgo_zabbix_log':
	./dummy.go:43: undefined reference to `__zbx_zabbix_log'

To resolve this issue, we need to tell the linker to ignore missing symbols by including the
following in the C preamble:

{% highlight c %}
#cgo LDFLAGS: -Wl,--unresolved-symbols=ignore-in-object-files -Wl,-allow-shlib-undefined

{% endhighlight %}

> If you happen to be compiling on OS X, use the following LDFLAGS instead:
  `-flat_namespace -undefined suppress`

These flags tell the linker to allow unresolved symbols at compile time, assuming they will be
available at runtime. Unfortunately, this doesn't help us when running `go test` which will
load our module independently of Zabbix, meaning the symbols will also fail to resolve at runtime.

To resolve this, we need to do some runtime checks to see if the symbols can resolve (i.e. the
module was loaded by Zabbix) or to fail gracefully if they can not (loaded by `go test`/other).

Firstly, we need to tell the compiler to allow calls to the Zabbix symbols we wish to consume, even
if they are undefined with `#pragma weak`. We need to do this for each function and be sure to use
the actual function name, not the convenience macros (e.g. `__zbx_zabbix_log`, not `zabbix_log` as
per `log.h` from the Zabbix sources).

{% highlight c %}
#pragma weak    __zbx_zabbix_log

{% endhighlight %}

Next, we need to create a wrapper in the preamble that performs a runtime check to test a function
pointer and make sure it is non-zero. In this case, if the symbol does not resolve, our wrapper
function does nothing.

{% highlight c %}
static void cgo_zabbix_log(int level, const char *format)
{
	void (*fptr)(int, const char*, ...);

	// check if zabbix_log() is resolvable
	if ((fptr = zabbix_log) != 0)
		(*fptr)(level, format);
}

{% endhighlight %}

This function also performs another important function. `zabbix_log()` is a variadic function (i.e.
it accepts a variable number of parameters via `...`). Unfortunately cgo does not support calling
variadic C functions so all other variadic functions will also need to be wrapped with a
non-variadic C function in your preamble.

## Logging

Now that you can call the `zabbix_log` function inside Zabbix, you can create a convenience wrapper
in Go to allow for variadic formatting via `fmt.Sprintf()` and to handle freeing any allocated
CStrings.

{% highlight go %}
// zabbix_log formats according to a format specifier and writes to the Zabbix log file.
func zabbix_log(level int, format string, a ...interface{}) {
	cstr := C.CString(fmt.Sprintf(format, a...))
	C.cgo_zabbix_log(C.int(level), cstr)
	C.free(unsafe.Pointer(cstr))
}
{% endhighlight %}


## Complete example

{% highlight go %}
package main

/*
// some symbols (within the Zabbix agent) won't resolve at link-time
// we can ignore these and resolve at runtime
#cgo LDFLAGS: -Wl,--unresolved-symbols=ignore-in-object-files -Wl,-allow-shlib-undefined

// headers and prereqs from Zabbix sources
#include <stdlib.h>
#include <stdint.h>
#include <string.h>

#include "log.h"
#include "module.h"

// go binding for a pointer to an agent item callback
typedef int (*agent_item_handler)(AGENT_REQUEST*, AGENT_RESULT*);

// wrapper for get_rparam macro in module.h
static char *cgo_get_rparam(AGENT_REQUEST *request, int i) {
	return get_rparam(request, i);
}

// wrapper for SET_UI64_RESULT macro in module.h
static void cgo_set_ui64_result(AGENT_RESULT *result, zbx_uint64_t val)
{
	SET_UI64_RESULT(result, val);
}

// wrapper for SET_STR_RESULT macro in module.h
static void cgo_set_str_result(AGENT_RESULT *result, char *val)
{
	SET_STR_RESULT(result, val);
}

// wrapper for SET_MSG_RESULT macro in module.h
static void cgo_set_msg_result(AGENT_RESULT *result, char *val)
{
	SET_MSG_RESULT(result, val);
}

// non-variadic wrapper for zabbix_log in log.h
#pragma weak __zbx_zabbix_log
static void cgo_zabbix_log(int level, const char *format)
{
	void (*fptr)(int, const char*, ...);

	// check if zabbix_log() is resolvable
    if ((fptr = zabbix_log) != 0)
        (*fptr)(level, format);
}

// declare item functions
int go_ping(AGENT_REQUEST *request, AGENT_RESULT *result);
int go_echo(AGENT_REQUEST *request, AGENT_RESULT *result);
int go_random(AGENT_REQUEST *request, AGENT_RESULT *result);

*/
import "C"

import (
	"fmt"
	"math/rand"
	"strconv"
	"time"
	"unsafe"
)

var Timeout int

var random *rand.Rand

// main is a mandatory entry point, although it is never called.
func main() {
	panic("THIS_SHOULD_NEVER_HAPPEN")
}

// zabbix_log formats according to a format specifier and writes to the Zabbix log file.
func zabbix_log(level int, format string, a ...interface{}) {
	cstr := C.CString(fmt.Sprintf(format, a...))
	C.cgo_zabbix_log(C.int(level), cstr)
	C.free(unsafe.Pointer(cstr))
}

//export zbx_module_api_version
func zbx_module_api_version() C.int {
	return C.ZBX_MODULE_API_VERSION_ONE
}

//export zbx_module_init
func zbx_module_init() C.int {
	zabbix_log(C.LOG_LEVEL_INFORMATION, "Initializing Go module")

	// initialize random seed for go.random
	random = rand.New(rand.NewSource(time.Now().UnixNano()))

	return C.ZBX_MODULE_OK
}

//export zbx_module_uninit
func zbx_module_uninit() C.int {
	zabbix_log(C.LOG_LEVEL_INFORMATION, "Uninitializing Go module")
	return C.ZBX_MODULE_OK
}

//export zbx_module_item_timeout
func zbx_module_item_timeout(timeout C.int) {
	Timeout = int(timeout)
}

//export zbx_module_item_list
func zbx_module_item_list() *C.ZBX_METRIC {
	// create null-terminated array of C.ZBX_METRICS
	// length should be the number of metrics plus one
	metrics := make([]C.ZBX_METRIC, 4)

	metrics[0] = C.ZBX_METRIC{
		key:        C.CString("go.ping"),
		flags:      0,
		function:   C.agent_item_handler(unsafe.Pointer(C.go_ping)),
		test_param: nil,
	}

	metrics[1] = C.ZBX_METRIC{
		key:        C.CString("go.echo"),
		flags:      C.CF_HAVEPARAMS,
		function:   C.agent_item_handler(unsafe.Pointer(C.go_echo)),
		test_param: C.CString("a message"),
	}

	metrics[2] = C.ZBX_METRIC{
		key:        C.CString("go.random"),
		flags:      C.CF_HAVEPARAMS,
		function:   C.agent_item_handler(unsafe.Pointer(C.go_random)),
		test_param: C.CString("1,1000"),
	}

	return &metrics[0]
}

//export go_ping
func go_ping(request *C.AGENT_REQUEST, result *C.AGENT_RESULT) C.int {
	C.cgo_set_ui64_result(result, 1)

	return C.SYSINFO_RET_OK
}

//export go_echo
func go_echo(request *C.AGENT_REQUEST, result *C.AGENT_RESULT) C.int {
	// validate parameter count
	if request.nparam != 1 {
		// set optional error message
		C.cgo_set_msg_result(result, C.CString("Invalid number of parameters")) // zabbix will free the C.CString later
		return C.SYSINFO_RET_FAIL
	}

	// get message param
	param := C.cgo_get_rparam(request, 0)

	// set result
	C.cgo_set_str_result(result, C.strdup(param)) // zabbix will free the strdup result later

	return C.SYSINFO_RET_OK
}

//export go_random
func go_random(request *C.AGENT_REQUEST, result *C.AGENT_RESULT) C.int {
	// validate parameter count
	if request.nparam != 2 {
		// set optional error message
		C.cgo_set_msg_result(result, C.CString("Invalid number of parameters.")) // zabbix will free the C.CString later
		return C.SYSINFO_RET_FAIL
	}

	// parse from param[0]
	from, err := strconv.ParseUint(C.GoString(C.cgo_get_rparam(request, 0)), 10, 64)
	if err != nil {
		C.cgo_set_msg_result(result, C.CString(err.Error())) // zabbix will free the C.CString later
		return C.SYSINFO_RET_FAIL
	}

	// parse to param[1]
	to, err := strconv.ParseUint(C.GoString(C.cgo_get_rparam(request, 1)), 10, 64)
	if err != nil {
		C.cgo_set_msg_result(result, C.CString(err.Error())) // zabbix will free the C.CString later
		return C.SYSINFO_RET_FAIL
	}

	// validate random range
	if from > to {
		C.cgo_set_msg_result(result, C.CString("Invalid range specified.")) // zabbix will free the C.CString later
		return C.SYSINFO_RET_FAIL
	}

	// generate random unsigned integer in range
	r := from + uint64(float64(to-from)*random.Float64())
	C.cgo_set_ui64_result(result, C.zbx_uint64_t(r))

	return C.SYSINFO_RET_OK
}

{% endhighlight %}