---
layout: post
title:  "Dynamic stats in Go's expvar"
---

Go's expvar package enables a standardized way to publish runtime statistics
for your application. Out of the box, by importing `expvar`, you will have a
HTTP handler registered at "/debug/vars" that will print a whole mess of GC,
memory and commandline stats as a JSON document.

Expvar includes many primitives for safely setting or incrementing various
static metric types. This works great under normal circumstances, but there are
occasions when you might need to dynamically compute the desired metric value on
demand.

A key example is "uptime". How long has my service been up? Using the
traditional static approach, you would need to update this value periodically
(wasteful) and you risk retrieving an outdated value on request.

The following code is the simplest way to export an "uptime" variable that is
computed on demand, using `expvar.Func` and a closure function.

```go
import (
	"expvar"
	"net/http"
	"time"
)

func init() {
	start := time.Now()
	expvar.Publish("uptime", expvar.Func(func() interface{} {
		return time.Since(start).Seconds()
	}))
}

func main() {
	http.ListenAndServe(":8080", http.DefaultServeMux)
}
```

If you had more complex needs - say, additional fields to consider - you could
instead implement the `expvar.Var` interface

```go
import (
	"expvar"
	"net/http"
	"strconv"
	"time"
)

type uptimeVar struct {
	start time.Time
	// other important fields...
}

func (v *uptimeVar) String() string {
	// other things to compute...
	d := time.Since(v.start)
	return strconv.FormatFloat(d, 'g', -1, 64)
}

func init() {
	v := &uptimeVar{
		start: time.Now()
	}
	expvar.Publish("uptime", v)
}

func main() {
	http.ListenAndServe(":8080", http.DefaultServeMux)
}
```

A possible tradeoff in using dynamic metrics is that you risk introducing
latency to your monitoring tools or health checks if your dynamic metrics are
too compute-heavy or if they depend on I/O.
