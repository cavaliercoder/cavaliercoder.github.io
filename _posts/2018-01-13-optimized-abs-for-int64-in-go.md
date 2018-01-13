---
layout: post
title:  "Optimized abs() for int64 in Go"
---

The Go programming language has no built in `abs` function for computing the
[absolute value of an integer](https://en.wikipedia.org/wiki/Absolute_value).
That is, the non-negative representation of a negative or positive number.

I recently needed an implementation of the `abs` function to solve the
[Day 20](http://adventofcode.com/2017/day/20) challenge in
[Advent of Code 2017](http://adventofcode.com/2017/about). If you want to learn
something new and get a kick out of testing yourself, I strongly recommend you
check it out!

Go does include an `abs` function in the `math` package:
[math.Abs](https://golang.org/pkg/math/#Abs). Unfortunately, this doesn't fit my
use case, as it only accepts `float64` as input and output. I need `int64`. It
is possible to use `math.Abs` via type conversion, but this introduces some
overhead for the conversion to `float64` and back to `int64`, as well as
introducing truncation for larger numbers.

There is a [great discussion](
https://groups.google.com/forum/#!topic/golang-dev/nP5mWvwAXZo) on optimizing
`math.Abs` for floating point integers, but unfortunately these optimizations
don't directly apply to integers, due to their underlying encoding.

There must be other options. So begins my adventure into optimizing a simple
function in Go!

## Type conversion vs. branching

The most obvious solution to me for this problem was a very basic function which
returns `n` if `n` is zero or greater, and returns `-n` if `n` is less than
zero. The double negative is, of course, always positive.

Since it relies on a branching control structure to calculate an absolute value,
let's call this function `abs.WithBranch`.

```go
package abs

func WithBranch(n int64) int64 {
	if n < 0 {
		return -n
	}
	return n
}
```

It works! Curiously, this is currently (Go v1.9.x) how `math.Abs` is
[implemented](https://github.com/golang/go/blob/release-branch.go1.9/src/math/abs.go)
for `float64` numbers.

Great! Branching works. But, does it improve on a call to `math.Abs` using type
conversions? Let's implement that too.

```go
package abs

func WithStdLib(n int64) int64 {
	return int64(math.Abs(float64(n)))
}
```

Here we are converting `n` to a `float64`, passing it to `math.Abs` and then
converting the result from `float64` to `int64`. Surely, this must introduce
some performance overhead?

A couple of simple [benchmark tests](
https://dave.cheney.net/2013/06/30/how-to-write-benchmarks-in-go) yield clear
results:

```plain
$ go test -bench=.
goos: darwin
goarch: amd64
pkg: github.com/cavaliercoder/abs
BenchmarkWithBranch-8           2000000000               0.30 ns/op
BenchmarkWithStdLib-8           2000000000               0.79 ns/op
PASS
ok      github.com/cavaliercoder/abs    2.320s
```

At 0.30 ns/op (nanoseconds per operation), `WithBranch` is more than twice as
fast! It also has the advantage that it won't truncate any large numbers when
converting from a signed `int64` to an IEEE-754 `float64`, which loses bits to
represent the decimal point.

By example, `abs.WithBranch(-9223372036854775807)` correctly returns
`9223372036854775807`, while `abs.WithStdLib(-9223372036854775807)` experiences
an overflow during the type conversion and incorrectly returns
`-9223372036854775808`. It even returns the same incorrect, negative result for
a high positive input, `abs.WithStdLib(9223372036854775807)`.

The branching approach is clearly faster and more correct for signed integers,
but can we do better?

We know that branching code breaks the sequential flow of a
program, meaning that [pipelining processors cannot predict what will happen
next](http://euler.mat.uson.mx/~havillam/ca/CS323/0708.cs-323007.html). Sounds
important?

## A non-branching solution

[Chapter 2 of Hacker's Delight by Henry S. Warren](
https://books.google.com.au/books?id=VicPJYM0I5QC&lpg=PA18&ots=2o-SROAuXq&dq=hackers%20delight%20absolute&pg=PA18#v=onepage&q=hackers%20delight%20absolute&f=false)
introduces us to a branch-free way of computing the absolute value of a signed
integer using a little [Two's Complement](
https://www.cs.cornell.edu/~tomf/notes/cps104/twoscomp.html) arithmetic.

To compute the absolute value of `x`, first, we compute the value `y` which is
equal to `x ⟫ 63`. That is, `x` right shifted by 63 bits on a 64 bit
architecture. If you're familiar with signed integers, you'll note the value of
`y` will now be `1` if `x` is negative, otherwise `0`.

Finally, compute `(x ⨁ y) - y`. That is, `x` exclusive-or `y`, take `y`. This
yields the absolute value of `x`.

Because we live hardcore, let's implement this in assembly!

```go
// abs.go
package abs

func WithASM(n int64) int64
```

```asm
// abs_amd64.s
TEXT ·WithASM(SB),$0
  MOVQ    n+0(FP), AX     // copy input to AX
  MOVQ    AX, CX          // y ← x
  SARQ    $63, CX         // y ← y ⟫ 63
  XORQ    CX, AX          // x ← x ⨁ y
  SUBQ    CX, AX          // x ← x - y
  MOVQ    AX, ret+8(FP)   // copy result to return value
  RET
```

We start above with a Go function declaration for `WithASM` that has no
immediate implementation. In a separate ASM code file, we declare the body in
[Go's Assembler](https://golang.org/doc/asm) language. Note that this
implementation is only valid on `amd64` architecture systems, so we advise the
compiler by giving the file name the `_amd64.s` suffix.

And the benchmarks results:

```plain
$ go test -bench=.
goos: darwin
goarch: amd64
pkg: github.com/cavaliercoder/abs
BenchmarkWithBranch-8           2000000000               0.29 ns/op
BenchmarkWithStdLib-8           2000000000               0.78 ns/op
BenchmarkWithASM-8              2000000000               1.78 ns/op
PASS
ok      github.com/cavaliercoder/abs    6.059s
```

Well, that's embarrassing!!! WTF?

It turn's out, in my naive benchmarks, that the non-branching, highly succinct
assembler code runs significantly slower at 1.78 ns/op. How can this be?

## Compiler optimizations

We need visibility of the optimizations the compiler is applying to the Go
functions. The compiler accepts the `-m` flag to "print optimization decisions".
This can also be enabled in `go build` or `go test` with the `-gcflags=-m`
argument.

Here's what we see:

```plain
$ go tool compile -m abs.go
# github.com/cavaliercoder/abs
./abs.go:11:6: can inline WithBranch
./abs.go:21:6: can inline WithStdLib
./abs.go:22:23: inlining call to math.Abs
```

For simple functions like ours, the Go compiler supports [function inlining](
https://github.com/golang/go/wiki/CompilerOptimizations#function-inlining).
Function inlining means that calls to our function are replaced inline with the
actual body of our function.

By example,

```go
package main

import (
  "fmt"
  "github.com/cavaliercoder/abs"
)

func main() {
  n := abs.WithBranch(-1)
  fmt.Println(n)
}
```

... might actually be compiled more similar to:

```go
package main

import "fmt"

func main() {
  n := -1
  if n < 0 {
    n = -n
  }
  fmt.Println(n)
}
```

According to the compiler output above, `WithBranch` and `WithStdLib` are able
to be inlined, but `WithASM` is not. Even the underlying call to `math.Abs` is
inlined into `WithStdLib`.

Since our `WithASM` function cannot be inlined, each caller incurs the overhead
of a function call. This means allocating a stack, copying in arguments,
branching the program pointer, etc.

What if we even the playing field and disable inlining on our other Go
functions? We can do this with a simple pragma comment before the function
declaration: `//go:noinline`.

For example:

```go
package abs

//go:noinline
func WithBranch(n int64) int64 {
	if n < 0 {
		return -n
	}
	return n
}
```

Running the compiler again, we see many fewer optimizations:

```plain
$ go tool compile -m abs.go
abs.go:22:23: inlining call to math.Abs
```

And here are the benchmark results:

```
$ go test -bench=.
goos: darwin
goarch: amd64
pkg: github.com/cavaliercoder/abs
BenchmarkWithBranch-8           1000000000               1.87 ns/op
BenchmarkWithStdLib-8           1000000000               1.94 ns/op
BenchmarkWithASM-8              2000000000               1.84 ns/op
PASS
ok      github.com/cavaliercoder/abs    8.122s
```

Each function now performs at around ~1.9ns/op.

You might infer the overhead of a function call to be around ~1.5ns for each
solution. The overhead appears to negate any minor speed advantage in the
body of our functions.

The lesson learned for me here, is that the performance gained by implementing
ASM by hand needs to outweigh the benefits of compiler type safety, garbage
collection and function inlining. In most cases, this won't be the true, though
there are exceptions, like taking advantage of [SIMD](
https://goroutines.com/asm) instructions for cryptography or media encoding.

Running the benchmarks a few times it becomes clear that there are no
significant performance gains to be had. We need function inlining.

## One inline function, please

The Go compiler cannot inline functions that are implemented in assembler, but
implementing our Two's Complement arithmetic in Go is easy:

```go
package abs

func WithTwosComplement(n int64) int64 {
	y := n >> 63          // y ← x ⟫ 63
	return (n ^ y) - y    // (x ⨁ y) - y
}
```

The compiler says our new function can be inlined:

```plain
$ go tool compile -m abs.go
...
abs.go:26:6: can inline WithTwosComplement
```

How does it perform? It turns out, when we re-enable inlining, it performs very
similar to `WithBranch`:

```plain
$ go test -bench=.
goos: darwin
goarch: amd64
pkg: github.com/cavaliercoder/abs
BenchmarkWithBranch-8                   2000000000               0.29 ns/op
BenchmarkWithStdLib-8                   2000000000               0.79 ns/op
BenchmarkWithTwosComplement-8           2000000000               0.29 ns/op
BenchmarkWithASM-8                      2000000000               1.83 ns/op
PASS
ok      github.com/cavaliercoder/abs    6.777s
```

Now that the overhead of a function call is gone, the Two's Complement
implementation in Go out performs the ASM implementation. Curiosity might lead
us next to wonder how similar the compiler's output is to our hand-crafted ASM?

There's an app for that.

Passing `-S` to the Go compiler causes it to "print assembly listing".

```plain
$ go tool compile -S abs.go
...
"".WithTwosComplement STEXT nosplit size=24 args=0x10 locals=0x0
        0x0000 00000 (abs.go:26)        TEXT    "".WithTwosComplement(SB), NOSPLIT, $0-16
        0x0000 00000 (abs.go:26)        FUNCDATA        $0, gclocals·f207267fbf96a0178e8758c6e3e0ce28(SB)
        0x0000 00000 (abs.go:26)        FUNCDATA        $1, gclocals·33cdeccccebe80329f1fdbee7f5874cb(SB)
        0x0000 00000 (abs.go:26)        MOVQ    "".n+8(SP), AX
        0x0005 00005 (abs.go:26)        MOVQ    AX, CX
        0x0008 00008 (abs.go:27)        SARQ    $63, AX
        0x000c 00012 (abs.go:28)        XORQ    AX, CX
        0x000f 00015 (abs.go:28)        SUBQ    AX, CX
        0x0012 00018 (abs.go:28)        MOVQ    CX, "".~r1+16(SP)
        0x0017 00023 (abs.go:28)        RET
...
```

The compiler's implementation is exactly the god-damned same. Only this time, it
has the advantage of being correctly configured and being cross-platform
portable! Running the compiler again with `GOARCH=386` produces a more
complicated program that handles the 64-bit arithmetic on 32-bit machines.

I need to be more trusting and slightly less hardcore.

One last note about memory allocations; all of our implementations exhibit the
same ideal behavior. When I run `go test -bench=. -benchmem`, I observe that
each of the functions result in zero allocation operations and zero bytes
allocated within the function body.

## Conclusion

The Two's Complement implementation in Go offers portability, function inlining,
non-branching code, zero allocations and no integer truncation due to type
conversions. The benchmarks never showed any significant speed advantage over
the branching approach, but this approach was selected anyway as, _in theory_,
non-branching code should perform better in more diverse scenarios.

The end result:

```go
func abs(n int64) int64 {
	y := n >> 63
	return (n ^ y) - y
}
```
