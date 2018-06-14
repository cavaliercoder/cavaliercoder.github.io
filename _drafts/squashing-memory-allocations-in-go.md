---
layout: post
title:  "Squashing memory allocations in Go"
---

This article aims to introduce the adventurous reader to some of the inner
workings of Go, where it allocates memory and how this impacts the performance
of your application.

If you're new to Go or programming in general, I hope this article will be
useful to you! I will of course have to overcome the
[Curse of Knowledge](https://en.wikipedia.org/wiki/Curse_of_knowledge), so
please let me know in the comments if anything is not explained sufficiently
and I'll do my best to fill you in.

By the end of this article, you should be able to:

- Understand the basics of how Go allocates memory
- Identify frequent memory allocations
- Measure their impact
- Understand a small number of potential optimizations
- Reason about trade-offs

## Memory allocation 101

If you understand how the stack, heap and garbage collector work, skip ahead to
the [next section](#some-perspective)

Every time you declare a variable using `:=` or `var` or call functions like
`make` or `append`, you're asking Go to store something in memory.

Memory needs to be reserved before it can be written to. We call this process
_memory allocation_, frequently observed in functions like `malloc`. On modern
systems, The Go runtime incurs a small (10s of nanoseconds) penalty for most
types of memory allocations. Depending on your program, these small latencies
might quickly compound into a performance bottleneck. Maybe. Read on.

### The stack

One way to avoid these allocations is to ensure your variables are allocated
in a region of memory called the _stack_. The stack is a pre-allocated data
structure where the execution order of function calls are stored (so the program
knows where to go back to when your function returns; like breadcrumbs). The
stack also includes a small amount of data, including some function parameters
and local variables. When your function returns, the stack _frame_ associated
with your function call, and all of its data, is dereferenced. Now it can be
overwritten by the next function that needs it.

Storing data on the stack is fast because chunks of memory are reserved in
advance so you are free to store values without allocating. Further to this, the
stack is also typically available in a cache closer to the CPU, because it is so
frequently used. Reads and writes to CPU caches are dramatically faster than
main memory.

So why not store everything in the stack?

Frequently, your data may be passed around between functions. Storing on the
stack is impossible in this case, because the stack data associated with each
function call is unusable once the function returns.

The stack is also limited in size, so larger chunks of data need to be stored
elsewhere.

Finally, some functions explicitly request memory to be allocated in the only
other place it can be, the home of our longer lived data: the _heap_.

### The heap

The heap is where all other data go to live. A heap _object_ is a variable, or
some referencable chunk of data that is stored and tracked in the heap. Heap
objects can be any size (within available memory limits) and are not cleaned up
when the function that created them exits.

Data in the heap is less likely to be found in a cache as close to the CPU as
the stack. Accessing data in the heap will often result in a read from main
memory.

### The garbage collector

Heap objects that are no longer used are eventually cleaned up by the _GC_ or
_Garbage Collector_. The GC is a background process that runs periodically to
clean up unused onjects in the heap. This means unused objects may continue to
consume memory in between GC runs. The GC also incurs a minor latency penalty
every time it runs.

## Some perspective

Whenever someone talks about the latency difference between the heap and stack,
or CPU caches and main memory, there's a possibility that they are
_prematurely optimizing_ or _over engineering_ needlessly. This stuff is
interesting and it's easy to get caught up in.

The key to a good optimization is understanding exactly where the bottlenecks in
your code are, what your options are to solve only those problems and what
trade-offs you are making by doing so.

By example, there is no point in sacrificing the readability of your code to
remove a heap allocation that only ever occurs once or twice.

I'll explain how to identify these bottlenecks (optimization opportunities), in
the following sections.

## Example code

Let's start with a code example that works nicely, but has a few inefficiencies.

__Note!__ None of these code examples should be used in production. In the
interest of brevity and reducing noise in the code, there are bugs; deliberate
and otherwise.

A complete example, with tests, benchmarks and documentation is available at
[github.com/cavaliercoder/memtest](https://github.com/cavaliercoder/memtest).

For our demonstration, we describe a `DecoderFunc`. Please be sure to read all
of the code and comments, as they tell the whole story.

```go
// DecoderFunc is any function that reads a string of space-separated integers
// and returns the ASCII character of each integer in a string.
//
// For example, "79 75" becomes "OK".
type DecoderFunc func(io.Reader) ([]byte, error)
```

We will write a number of `DecoderFuncs`; each subjectively improving on the
last.

The first example implementation works as described!

```go
// DecodeSimple is a naive DecoderFunc that takes a simple, but inefficient
// approach to decoding input.
//
// Input may be of any length, provided there is sufficient memory available to
// store multiple copies and the entire output.
func DecodeSimple(r io.Reader) ([]byte, error) {
	// read all input into a byte slice
	b, err := ioutil.ReadAll(r)
	if err != nil {
		return nil, err
	}

	// convert the bytes to a string
	s := string(b)

	// split the string into individual tokens
	tokens := strings.Split(s, " ")

	// convert each token to an integer
	output := make([]byte, 0)
	for _, token := range tokens {
		n, err := strconv.ParseUint(token, 10, 8)
		if err != nil {
			return nil, err
		}

		// store the integer as a byte in the output buffer
		output = append(output, byte(n))
	}
	return output, nil
}
```


Great! If we read the following string:

```plain
"76 111 114 101 109 32 105 112 115 117 109 32 100 111 108 111 114 32 115 105 116 32 97 109 101 116 44 32 99 111 110 115 101 99 116 101 116 117 114 32 97 100 105 112 105 115 99 105 110 103 32 101 108 105 116 46"
```

The output will be correct:

```plain
"Lorem ipsum dolor sit amet, consectetur adipiscing elit."
```

Head on over the full example on [Github](https://github.com/cavaliercoder/memtest/blob/master/decoder_test.go)
to see this in effect - including the code for the following benchmarks.

A simple benchmark processes this same input as fast as possible:

```plain
$ go test -bench=.
goos: darwin
goarch: amd64
pkg: github.com/cavaliercoder/memtest
BenchmarkDecodeSimple-8           500000              2040 ns/op
PASS
ok      github.com/cavaliercoder/memtest        1.064s
```

The `-bench=.` argument tells Go to run all available benchmarks.

We're interested to see that the average call to `DecodeSimple` took 2040
nanoseconds.


## Finding bottlenecks

We _should_ consider optimization from multiple angles. Another article might
describe how to measure time on the CPU, or latency in the goroutine scheduler,
or latency waiting on locks. In fact, there is a great article in the
[Go wiki](https://github.com/golang/go/wiki/Performance) which describes all of
this and more.

Let's zoom in on memory allocations, since we know that a reduction in heap
allocations should result in:

- less time spent allocating memory
- better utilization of CPU caches
- lower memory consumption in between GC runs
- less work for the GC and therefore lower latency on each GC run


We want to understand where and how often this code allocates heap objects, so
we can apply the right optimizations. Adding the `-benchmem` argument to our
benchmarks yeilds the following:

```plain
$ go test -bench=. -benchmem
goos: darwin
goarch: amd64
pkg: github.com/cavaliercoder/memtest
BenchmarkDecodeSimple-8           500000              2020 ns/op            3384 B/op          9 allocs/op
PASS
ok      github.com/cavaliercoder/memtest        1.803s
```

We see that there were, on average, 9 heap allocations for each call to
`DecodeSimple` (you may need to scroll right a little).

To see where these allocations are occuring, let's run the benchmarks again,
but this time, profiling every memory allocation and storing the results for
analysis in a file named `mem.prof`.

```plain
$ go test \
  -bench=. \
  -benchmem \
  -memprofile mem.prof \
  -memprofilerate 1
```

With our profile data handy, we can use the `pprof` tool to tell us which lines
of code are allocating most frequently:

```plain
$ go tool pprof \
  -top \
  -alloc_objects \
  -lines \
  decoder.test \
  mem.prof
File: decoder.test
Type: alloc_objects
Time: Jun 13, 2018 at 9:41pm (PDT)
Showing nodes accounting for 935912, 100% of 936106 total
Dropped 173 nodes (cum <= 4680)
      flat  flat%   sum%        cum   cum%
    385394 41.17% 41.17%     385394 41.17%  github.com/cavaliercoder/memtest.DecodeSimple /go/src/github.com/cavaliercoder/memtest/decoder.go:49
    220204 23.52% 64.69%     220204 23.52%  bytes.makeSlice /usr/local/Cellar/go/1.10/libexec/src/bytes/buffer.go:230
    110110 11.76% 76.46%     110110 11.76%  strings.genSplit /usr/local/Cellar/go/1.10/libexec/src/strings/strings.go:246
    110102 11.76% 88.22%     110102 11.76%  github.com/cavaliercoder/memtest.DecodeSimple /go/src/github.com/cavaliercoder/memtest/decoder.go:35
    110102 11.76%   100%     110102 11.76%  io/ioutil.readAll /usr/local/Cellar/go/1.10/libexec/src/io/ioutil/ioutil.go:19
         0     0%   100%     110102 11.76%  bytes.(*Buffer).Grow /usr/local/Cellar/go/1.10/libexec/src/bytes/buffer.go:163
         0     0%   100%     110102 11.76%  bytes.(*Buffer).ReadFrom /usr/local/Cellar/go/1.10/libexec/src/bytes/buffer.go:204
         0     0%   100%     220204 23.52%  bytes.(*Buffer).grow /usr/local/Cellar/go/1.10/libexec/src/bytes/buffer.go:144
         0     0%   100%     935899   100%  github.com/cavaliercoder/memtest.BenchmarkDecodeSimple /go/src/github.com/cavaliercoder/memtest/decoder_test.go:62
         0     0%   100%     330306 35.29%  github.com/cavaliercoder/memtest.DecodeSimple /go/src/github.com/cavaliercoder/memtest/decoder.go:29
         0     0%   100%     110102 11.76%  github.com/cavaliercoder/memtest.DecodeSimple /go/src/github.com/cavaliercoder/memtest/decoder.go:38
         0     0%   100%     935895   100%  github.com/cavaliercoder/memtest.benchmarkDecoderFunc /go/src/github.com/cavaliercoder/memtest/decoder_test.go:51
         0     0%   100%     330306 35.29%  io/ioutil.ReadAll /usr/local/Cellar/go/1.10/libexec/src/io/ioutil/ioutil.go:45
         0     0%   100%     110102 11.76%  io/ioutil.readAll /usr/local/Cellar/go/1.10/libexec/src/io/ioutil/ioutil.go:34
         0     0%   100%     110102 11.76%  io/ioutil.readAll /usr/local/Cellar/go/1.10/libexec/src/io/ioutil/ioutil.go:36
         0     0%   100%     110110 11.76%  strings.Split /usr/local/Cellar/go/1.10/libexec/src/strings/strings.go:298
         0     0%   100%     935889   100%  testing.(*B).launch /usr/local/Cellar/go/1.10/libexec/src/testing/benchmark.go:290
         0     0%   100%     935929   100%  testing.(*B).runN /usr/local/Cellar/go/1.10/libexec/src/testing/benchmark.go:141
```

Okay, this is a little hairy, but if we filter just for the lines in our codebase with `| grep decoder.go` we get:

```plain
    385394 41.17% 41.17%     385394 41.17%  github.com/cavaliercoder/memtest.DecodeSimple /go/src/github.com/cavaliercoder/memtest/decoder.go:49
    110102 11.76% 88.22%     110102 11.76%  github.com/cavaliercoder/memtest.DecodeSimple /go/src/github.com/cavaliercoder/memtest/decoder.go:35
         0     0%   100%     330306 35.29%  github.com/cavaliercoder/memtest.DecodeSimple /go/src/github.com/cavaliercoder/memtest/decoder.go:29
         0     0%   100%     110102 11.76%  github.com/cavaliercoder/memtest.DecodeSimple /go/src/github.com/cavaliercoder/memtest/decoder.go:38

```

These four lines of code are causing the highest number of heap allocations, and
they map to the following code:

- `b, err := ioutil.ReadAll(r)` - reading all input data
- `output = append(output, byte(n))` - writing output data
- `s := string(b)` - converting bytes to a string
- `tokens := strings.Split(s, " ")` - splitting the string into tokens

There are two problems to solve:

- input and output buffers require allocation
- working with strings requires allocations

Let's start by optimizing around the input and output buffer problem.

## Optimizations

### Optimization 1: Pre-allocating buffers

The following example is a new `DecoderFunc` that pre-allocates buffers for
input and output. These are allocated once, when the program starts and then
reused by each call to `DecodePrealloc`.

Please note the trade-offs concerning concurrency and input length...

```go
var (
	inputBuf  = make([]byte, 4096)
	outputBuf = make([]byte, 4096)
)

// DecodePrealloc is a DecoderFunc that makes use of pre-allocated buffers for
// input and output. This negates the expense of allocating these buffers on
// demand, but incurs the penalty that this function is no longer safe to use
// concurrently from multiple goroutines, as each concurrent call should corrupt
// the contents of the same buffers used by the other calls.
//
// It also requires that all input is shorter than the fixed length of the input
// buffer.
func DecodePrealloc(r io.Reader) ([]byte, error) {
	// read into static input buffer
	// nb: a single read is not guaranteed to consume all available input
	n, err := r.Read(inputBuf)
	if err != nil {
		return nil, err
	}

	s := string(inputBuf[:n])
	tokens := strings.Split(s, " ")
	for i := 0; i < len(tokens); i++ {
		n, err := strconv.ParseUint(tokens[i], 10, 8)
		if err != nil {
			return nil, err
		}
		outputBuf[i] = byte(n)
	}
	return outputBuf[:len(tokens)], nil
}
```

Running a benchmark for this `DecoderFunc` we see:

```plain
$ go test -bench=. -benchmem
goos: darwin
goarch: amd64
pkg: github.com/cavaliercoder/memtest
BenchmarkDecodeSimple-8          1000000              1979 ns/op            3384 B/op          9 allocs/op
BenchmarkDecodePrealloc-8        1000000              1270 ns/op            1104 B/op          2 allocs/op
PASS
ok      github.com/cavaliercoder/memtest        4.010s
```

Excellent! The new function is 35% faster at an average of 1270ns per operation
and only makes two memory allocations.

We assume the remaining allocations are related to working with strings, but
let's generate a profile to be sure.

```plain
$ go tool pprof -top -alloc_objects -lines decoder.test mem.prof | grep decoder.go
    710102 49.99%   100%     710102 49.99%  github.com/cavaliercoder/memtest.DecodePrealloc /go/src/github.com/cavaliercoder/memtest/decoder.go:75
         0     0%   100%     710102 49.99%  github.com/cavaliercoder/memtest.DecodePrealloc /go/src/github.com/cavaliercoder/memtest/decoder.go:76
```

As presumed, these lines map to our work with strings:

- `s := string(inputBuf[:n])` and
- `tokens := strings.Split(s, " ")`

### Optimization 2: Avoid string manipulation

In Go, stings are immutable. This means that under the hood, they can not be
modified, stuck together, split in half, converted to bytes, etc..

All of these operations result in the creation (and potential allocation) of a
new string!

Don't get me wrong: strings are perfectly safe to use. It's just that they need
be understood when memory allocation is a concerned.

The following `DecoderFunc` negates the need for strings by parsing the input
byte stream manually. I call it `DecodeNoAlloc` for a reason you will shortly
discover.

There is a visible trade-off here. This code is clearly more complicated,
potentially more bug prone and difficult to maintain.

```go
var (
	inputBuf  = make([]byte, 4096)
	outputBuf = make([]byte, 4096)
)

// DecodeNoAlloc is a more complex DecoderFunc that avoids all memory
// allocations by parsing the input as a byte stream - without converting to
// string.
func DecodeNoAlloc(r io.Reader) ([]byte, error) {
	// process each byte of input, tracking the current byte character c, and the
	// length of the output n.
	c, n := byte(0), 0
	for {
		// fill the input buffer
		nn, err := r.Read(inputBuf)

		// check for end of input
		if err == io.EOF {
			if c != 0 {
				// capture the last character
				outputBuf[n] = c
				n++
			}

			// truncate output buffer to the computed output length n and return
			return outputBuf[:n], nil
		}

		// check for read errors
		if err != nil {
			return nil, err
		}

		// process each byte in the input buffer
		for i := 0; i < nn; i++ {
			if inputBuf[i] == ' ' {
				outputBuf[n] = c
				c = 0
				n++

				// check we don't overflow the output buffer
				if n == len(outputBuf) {
					return outputBuf, errors.New("output buffer too small")
				}
			} else {
				// byte is an integer - increment current character
				c *= 10
				c += inputBuf[i] - '0'
			}
		}
	}
}
```

But, how does it perform?

```plain
$ go test -bench=. -benchmem
goos: darwin
goarch: amd64
pkg: github.com/cavaliercoder/memtest
BenchmarkDecodeSimple-8          1000000              2008 ns/op            3384 B/op          9 allocs/op
BenchmarkDecodePrealloc-8        1000000              1395 ns/op            1104 B/op          2 allocs/op
BenchmarkDecodeNoAlloc-8         5000000               296 ns/op               0 B/op          0 allocs/op
PASS
ok      github.com/cavaliercoder/memtest        7.016s
```

Would you look at that! An 85% performance increase over our first example at
296ns per operation. And a hard-to-beat __zero__ allocations per operation.

That's the difference between 1 million requests per second, and 5 million.
That means more predictable memory consumption and less time spent in GC.

Despite this, we still suffer the restrictions imposed by a fixed size input and
output buffer. This won't do for larger inputs.

## Trade-offs

### Trade-off 1: speed vs. large inputs

What if we allowed our selves a few memory allocations to enable inputs and
outputs of any size?

We can solve the problem of large inputs simply by reading the input one chunk
at a time. We read from the input until the input buffer is full and then parse
its contents. We no longer need the input data and can overwrite it with the
next chunk of input and continue parsing from the start of the buffer.

This is already demonstrated above in `DecodeNoAlloc`.

Output is more difficult... we can't afford to overwrite and reuse anything but
may need to continue appending data to the output, relative to a large input.

We could allocate some monstrous output buffer, but we really want to avoid
waste and allocate only as much memory as we need (or close to it).

Let's solve this with a dyamically allocated buffer. A buffer which extends on
demand with a small latency cost. Go provides an implementation of this idea
with its `bytes.Buffer` type.

```go
var (
	inputBuf         = make([]byte, 4096)
	dynamicOutputBuf = bytes.Buffer{}
)

// DecodeDynamic functions similarly to DecodeNoAlloc except that it allows
// for parsing arbitrarily long input - as long as there is sufficient memory
// available for the output.
//
// Input is read into a small, fixed size, pre-allocated buffer.
//
// Output is written to a dynamically allocated buffer which will grow as a
// function of the output length, at a rate of O(log n). That is, an
// insignificantly small number of allocations compared to the output length.
//
// The output buffer never shrinks, so subsequent calls will never incur a
// memory allocation if their input length is equal to or shorter than previous
// calls. This memory remains allocated and unusuable to the rest of the
// program.
//
// The dynamic buffer incurs a marginal computational performance penalty.
func DecodeDynamic(r io.Reader) ([]byte, error) {
	// reset dynamically allocated buffer
	// nb: this will not free previous allocations
	dynamicOutputBuf.Reset()

	var c byte
	for {
		// nb: tune I/O performance by adjusting the size of the static input buffer
		n, err := r.Read(inputBuf)
		if err == io.EOF {
			if c != 0 {
				// output buffer will expand as needed
				dynamicOutputBuf.WriteByte(c)
			}

			// return the bytes in the output buffer by reference (no copy)
			return dynamicOutputBuf.Bytes(), nil
		}
		if err != nil {
			return nil, err
		}
		for i := 0; i < n; i++ {
			if inputBuf[i] == ' ' {
				// output buffer will expand as needed
				dynamicOutputBuf.WriteByte(c)
				c = 0
			} else {
				c *= 10
				c += inputBuf[i] - '0'
			}
		}
	}
}
```

Looks good. Passes the tests. How does it perform?

```plain
$ go test -bench=. -benchmem
goos: darwin
goarch: amd64
pkg: github.com/cavaliercoder/memtest
BenchmarkDecodeSimple-8          1000000              2015 ns/op            3384 B/op          9 allocs/op
BenchmarkDecodePrealloc-8        1000000              1379 ns/op            1104 B/op          2 allocs/op
BenchmarkDecodeNoAlloc-8         5000000               276 ns/op               0 B/op          0 allocs/op
BenchmarkDecodeDynamic-8         5000000               312 ns/op               0 B/op          0 allocs/op
PASS
ok      github.com/cavaliercoder/memtest        7.018s
```

Damn... it's marginally slower (13%) than `DecodeNoAlloc`. But still
dramatically faster than previous implementations. It is also safer to user for
large inputs. Is this a worthy trade-off?

The performance decrease is likely caused by the additional logic (and therefore
CPU time) to manage the dynamic output buffer.

Counter to our expectations, the benchmarks still show zero memory allocations
for `DecodeDynamic`. There are two reasons for this:

- The benchmarks show an average per operation. Only the first operation will
  incur the allocation penalty. Averaged over millions of operations, it
  figuratively never happened. Be careful of averages!

- Depending on the size of the output, an allocation might never be required.
  Looking at the [source code](https://golang.org/src/bytes/buffer.go?s=556:643#L15)
  for `bytes.Buffer`, it appears that it always starts with a 64 byte buffer. If
  the output never exceeds 64 bytes (true for our tests), no allocation is ever
  needed.

### Trade-off 1: concurrency vs. global buffers

Using the global, pre-allocated buffers implemented above means that the
allocations required to create them only happen once, at program startup.

However, global buffers also mean that, to avoid corruption, only a single
`DecoderFunc` can read or write to the buffers at any time.

We could serialize access to these buffers by using a mutex or similar
concurrency primitive, such that only one `DecoderFunc` call can ever access the
buffers at a time, while other calls will queue for their turn. This approach
means that the `DecoderFuncs` could only perform as well as they would running
on a single processor. In many cases, this defeats the purpose.

Depending on your use case, a better approach might be to pre-allocate the
buffers for each concurrent goroutine. This means the cost of creating the
buffers is only incurred once for each goroutine. The cost of dynamic buffer
expansion still applies.

The following example is not a `DecoderFunc`, but instead is a function that
returns a `DecoderFunc`.

```go
// NewDecodeConcurrent returns a DecoderFunc that behaves similarly to
// DecodeDynamic, except that the returned function has it own local buffers
// that are reused in each subsequent call.
//
// For concurrency-safe decoding, call NewDecodeConcurrent in each spawned
// goroutine and call the returned DecoderFunc only within the goroutine that
// created it.
func NewDecodeConcurrent() DecoderFunc {
	// allocate new buffers for use only in this goroutine
	localInputBuf := make([]byte, 4096)
	localOutputBuf := bytes.Buffer{}

	// return a DecoderFunc that will use only these buffers
	return func(r io.Reader) ([]byte, error) {
		localOutputBuf.Reset()
		var c byte
		for {
			n, err := r.Read(localInputBuf)
			if err == io.EOF {
				if c != 0 {
					localOutputBuf.WriteByte(c)
				}
				return localOutputBuf.Bytes(), nil
			}
			if err != nil {
				return nil, err
			}
			for i := 0; i < n; i++ {
				if localInputBuf[i] == ' ' {
					localOutputBuf.WriteByte(c)
					c = 0
				} else {
					c *= 10
					c += localInputBuf[i] - '0'
				}
			}
		}
	}
}
```

The following example uses this safely from multiple goroutines:

```go
// create a WaitGroup so we can signal when each goroutine completes
wg := &sync.WaitGroup{}

// spawn lots of goroutines
for i := 0; i < 64; i++ {
  wg.Add(1)
  go func() {
    // create a concurrency-safe DecoderFunc
    // any other func will likely result in corruption
    f := NewDecodeConcurrent()

    // parse test input
    r := bytes.NewReader(testInput)
    b, err := f(r)
    if err != nil {
      log.Fatal(err)
    }

    // print output
    fmt.Printf("%s\n", b)

    // signal we are done
    wg.Done()
  }()
}

// wait for all goroutines to finish
wg.Wait()

// output:
// Lorem ipsum dolor sit amet, consectetur adipiscing elit.
// Lorem ipsum dolor sit amet, consectetur adipiscing elit.
// Lorem ipsum dolor sit amet, consectetur adipiscing elit.
// ...
```

And here are the benchmark results (this is a little trickier):

```plain
$ go test -bench=. -benchmem
goos: darwin
goarch: amd64
pkg: github.com/cavaliercoder/memtest
BenchmarkDecodeSimple-8          1000000              2108 ns/op            3384 B/op          9 allocs/op
BenchmarkDecodePrealloc-8        1000000              1252 ns/op            1104 B/op          2 allocs/op
BenchmarkDecodeNoAlloc-8         5000000               288 ns/op               0 B/op          0 allocs/op
BenchmarkDecodeDynamic-8         5000000               309 ns/op               0 B/op          0 allocs/op
BenchmarkDecodeConcurrent-8      3000000               553 ns/op               0 B/op          0 allocs/op
PASS
ok      github.com/cavaliercoder/memtest        9.255s
```

Allocations remain low and CPU time is only marginally worse than
`DecodeDynamic`. The increase in time is likely caused by the overhead of
sending and receiving data from each goroutine through channels and the load
imposed on the scheduler. More CPU cores and larger inputs would likely result
in a more substantial advantage here.

If concurrency is important to you, this seems like a reasonable trade-off.


## Summary

We managed to optimize away all memory allocations and dramatically improve
the latency of our `DecoderFuncs`. We made reasonable performance trade-offs
that enabled our code to be concurrency-safe and accept inputs of any length,
within available memory constraints. Not bad!

I hope you learned something useful! Here is some further reading to continue
building on your success.

- [Debugging performance issues in Go programs](https://github.com/golang/go/wiki/Performance)

- [Profiling Go Programs](https://blog.golang.org/profiling-go-programs)

- [Allocation efficiency in high-performance Go services](https://segment.com/blog/allocation-efficiency-in-high-performance-go-services/)

- [Optimising Go allocations using pprof](https://www.robustperception.io/optimising-go-allocations-using-pprof/)
