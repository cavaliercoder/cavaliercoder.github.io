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

You're going to need the following prerequisites:

* Zabbix v2.2.0 or above (agent and sources)

* Go v1.5 or above

* This tute targets GCC/Linux but could be adapted for other OS's and build tools

It's also worthwhile to familiarize yourself with some background knowledge:

* Interfacing between C and Go with [cgo](https://golang.org/cmd/cgo/)

* Writing Zabbix [loadable modules](https://www.zabbix.com/documentation/2.2/manual/config/items/loadablemodules)

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
agent) using the `//export` (no spaces) directive.

To automate the build of your module, the following `Makefile` will save you some time:

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

We're also going to use some defined in the Zabbix sources in `include/module.h` from the Zabbix
sources. To call C code (in this case to import `module.h` and its prerequisites) we need to create
a cgo preamble which is simply C code encapsulated in Go comments (`/* */`), immediately preceeding
`import "C"`, with no additional whitespace or line breaks.

Use `zbx_module_init()` to execute actions when the Zabbix agent loads your module. Actions might
include starting a timer or tailing a log file.

Only one version of the module API is currently supported so `zbx_module_api_version()` should
always return `C.ZBX_MODULE_API_VERSION_ONE` from `module.h`.

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


## Complete example

{% highlight go %}
package main

/*

#include <stdlib.h>
#include <stdint.h>
#include <string.h>

// headers from Zabbix sources
#include "log.h"
#include "module.h"

// some symbols (within the Zabbix agent) won't resolve at link-time
// we can ignore these and resolve at runtime
#cgo LDFLAGS: -Wl,--unresolved-symbols=ignore-in-object-files -Wl,-allow-shlib-undefined

// ignore missing symbols if the module is not loaded via Zabbix (i.e. `go test`)
#pragma weak __zbx_zabbix_log

// go binding for a pointer to an agent item callback
typedef int (*agent_item_handler)(AGENT_REQUEST*, AGENT_RESULT*);

// non-variadic wrapper for C.zabbix_log
static void cgo_zabbix_log(int level, const char *format)
{
	void (*fptr)(int, const char*, ...);

	// check if zabbix_log() is resolvable
    if ((fptr = zabbix_log) != 0)
        (*fptr)(level, format);
}

// wrapper for get_rparam macro to ease the burden of indexing a **char in go
static char *cgo_get_rparam(AGENT_REQUEST *request, int i) {
	return get_rparam(request, i);
}

int zbx_module_dummy_ping(AGENT_REQUEST *request, AGENT_RESULT *result);
int zbx_module_dummy_echo(AGENT_REQUEST *request, AGENT_RESULT *result);
int zbx_module_dummy_random(AGENT_REQUEST *request, AGENT_RESULT *result);

*/
import "C"

import (
	"fmt"
	"math/rand"
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

	// initialization for dummy.random
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
		function:   C.agent_item_handler(unsafe.Pointer(C.zbx_module_dummy_ping)),
		test_param: nil,
	}

	metrics[1] = C.ZBX_METRIC{
		key:        C.CString("go.echo"),
		flags:      C.CF_HAVEPARAMS,
		function:   C.agent_item_handler(unsafe.Pointer(C.zbx_module_dummy_echo)),
		test_param: C.CString("a message"),
	}

	metrics[2] = C.ZBX_METRIC{
		key:        C.CString("go.random"),
		flags:      C.CF_HAVEPARAMS,
		function:   C.agent_item_handler(unsafe.Pointer(C.zbx_module_dummy_random)),
		test_param: C.CString("1,1000"),
	}

	return &metrics[0]
}

//export zbx_module_dummy_ping
func zbx_module_dummy_ping(request *C.AGENT_REQUEST, result *C.AGENT_RESULT) C.int {
	result._type |= C.AR_UINT64
	result.ui64 = 1

	return C.SYSINFO_RET_OK
}

//export zbx_module_dummy_echo
func zbx_module_dummy_echo(request *C.AGENT_REQUEST, result *C.AGENT_RESULT) C.int {
	if request.nparam != 1 {
		// set optional error message
		result._type = C.AR_MESSAGE
		result.msg = C.CString("Invalid number of parameters") // zabbix will free this later

		return C.SYSINFO_RET_FAIL
	}

	param := C.cgo_get_rparam(request, 0)

	result._type = C.AR_STRING
	result.str = C.strdup(param) // zabbix will free this later

	return C.SYSINFO_RET_OK
}

//export zbx_module_dummy_random
func zbx_module_dummy_random(request *C.AGENT_REQUEST, result *C.AGENT_RESULT) C.int {
	if request.nparam != 2 {
		// set optional error message
		result._type = C.AR_MESSAGE
		result.msg = C.CString("Invalid number of parameters.")

		return C.SYSINFO_RET_FAIL
	}

	/* there is no strict validation of parameters for simplicity sake */
	from := uint64(C.atoi(C.cgo_get_rparam(request, 0)))
	to := uint64(C.atoi(C.cgo_get_rparam(request, 1)))

	if from > to {
		result._type = C.AR_MESSAGE
		result.msg = C.CString("Invalid range specified.")

		return C.SYSINFO_RET_FAIL
	}

	r := from + uint64(float64(to-from)*random.Float64())

	result._type = C.AR_UINT64
	result.ui64 = C.zbx_uint64_t(r)

	return C.SYSINFO_RET_OK
}
{% endhighlight %}