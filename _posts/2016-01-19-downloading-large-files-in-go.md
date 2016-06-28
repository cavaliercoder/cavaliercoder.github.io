---
layout: post
title:  "Downloading large files in Go"
---

The `net/http` package bundled with Go provides a really solid HTTP
implementation which excels particularly as a base for HTTP based API clients
and servers.

If you're writing software which needs to download large files from the
Internet, such as ISO images or software packages, you may need to implement
some client side logic to overcome some more use-case specific challenges such
as:

* multiple concurrent downloads
* naming of downloaded files
* UI feedback with progress indicators
* clean cancellation of running downloads
* resuming of interrupted downloads
* validating downloaded files using checksums

This article will step you through using a Go package called
[grab](http://github.com/cavaliercoder/grab) which abstracts `net/http` to
provide these features. We'll build a simple 'wget'-like binary to make use of
all such awesomeness.

`grab` provides convenience methods `grab.Get()`, `grab.GetAsync()` and
`grab.GetBatch()` for simple operations. When you need more control over the
HTTP session, you can use a `grab.Client` and configure it to your needs.

Examples for these functions and using a custom client are included below.

To get started, install the `grab` package with:

	$ go get github.com/cavaliercoder/grab


## Download a file

The simplest way to download a file is using `grab.Get()`. It accepts two
parameters; a destination file path and the source URL. `grab.Get()` uses
`grab.DefaultClient` as a HTTP client which has default settings. It will follow
redirect responses from remote servers and use a corporate proxy if configured
on the host system. Essentially, `grab.Get()` is a wrapper for
`grab.DefaultClient.Do()`.

You may specify an existing or non-existing file path as the destination or you
may specify an existing directory.

If a directory is given as the destination, `grab` will determine the filename
using `Content-Disposition` headers if they are returned by the remote server or
extract a filename from the source URL. If either of these features fails, an
error is returned which can be identified using `grab.IsNoFilename()`.

If the destination filename exists, `grab` assumes it is a complete or partially
complete download and will resume downloading from the end of the file if
supported by the remote server. Otherwise the file will be overwritten.

`grab.Get()` and all other download functions return a `grab.Response` which
includes context about the downloaded file; including the path where the file
was saved.

`grab.Get()` is a blocking, synchronous operation, which means that the function
does not return a response until the download is complete or encounters an
error. This is not terribly useful for lengthy downloads so I'll solve this
problem a little further down.

First, the following example will create a simple binary which will download a
source file from a URL specified on the command line and save it to the current
working directory (`"."`).


{% highlight go %}
package main

import (
	"fmt"
	"github.com/cavaliercoder/grab"
	"os"
)

func main() {
	// get URL to download from command args
	if len(os.Args) < 2 {
		fmt.Fprintf(os.Stderr, "usage: %s url\n", os.Args[0])
		os.Exit(1)
	}

	url := os.Args[1]

	// download file
	fmt.Printf("Downloading %s...\n", url)
	resp, err := grab.Get(".", url)
	if err != nil {
		fmt.Fprintf(os.Stderr, "Error downloading %s: %v\n", url, err)
		os.Exit(1)
	}

	fmt.Printf("Successfully downloaded to %s\n", resp.Filename)
}

{% endhighlight %}

Build it with:

	$ go build -o grab-example

and run it with:

	$ ./grab-example http://some-url


## Add progress updates

The simple example above will download a file but it is not practical for
lengthy downloads which should provide some feedback to the user with the
progress of the download.

The following example uses `grab.GetAsync()` which immediately returns a channel
which will receive a `*grab.Response` and close as soon as the download has been
negotiated with the remote server, before the file transfer has started.

`grab.GetAsync()` is a wrapper for `grab.DefaultClient.DoAsync()`.

Once the response is received, it can be polled periodically to monitor the
progress of the file transfer until it is finished. This example simply prints a
progress update every 200ms. 

All of the `grab.Response` methods are thread-safe and atomic.

{% highlight go %}
package main

import (
	"fmt"
	"github.com/cavaliercoder/grab"
	"os"
	"time"
)

func main() {
	// get URL to download from command args
	if len(os.Args) < 2 {
		fmt.Fprintf(os.Stderr, "usage: %s url\n", os.Args[0])
		os.Exit(1)
	}

	url := os.Args[1]

	// start file download
	fmt.Printf("Downloading %s...\n", url)
	respch, err := grab.GetAsync(".", url)
	if err != nil {
		fmt.Fprintf(os.Stderr, "Error downloading %s: %v\n", url, err)
		os.Exit(1)
	}

	// block until HTTP/1.1 GET response is received
	fmt.Printf("Initializing download...\n")
	resp := <-respch

	// print progress until transfer is complete
	for !resp.IsComplete() {
		fmt.Printf("\033[1AProgress %d / %d bytes (%d%%)\033[K\n", resp.BytesTransferred(), resp.Size, int(100*resp.Progress()))
		time.Sleep(200 * time.Millisecond)
	}

	// clear progress line
	fmt.Printf("\033[1A\033[K")

	// check for errors
	if resp.Error != nil {
		fmt.Fprintf(os.Stderr, "Error downloading %s: %v\n", url, resp.Error)
		os.Exit(1)
	}

	fmt.Printf("Successfully downloaded to ./%s\n", resp.Filename)
}

{% endhighlight %}

## Batch downloads

The next example allows multiple URLs to be given on the command line and
downloaded simultaneously using `grab.GetBatch()` which is a wrapper for
`grab.DefaultClient.DoBatch()`.

Files will be transferred three at a time, as `3` is given for the worker count
parameter in the call to `grab.Getbatch()`. To download all files immediately
(one worker per request), simply give `0` as the worker count parameter. Each
download will be saved to the current working directory as `"."` is given as the
destination parameter.

With a batch operation we don't have immediate access to any `grab.Response`.
These will be sent via the channel returned by `grab.GetBatch()` each time a
worker starts a requested URL. We don't know when all of these responses will
arrive, but we want to monitor downloads which are already in process so we
create a `for` loop and `select` between two channels; one to receive responses
and the other (the ticker) to periodically print the status of the responses
which have already been received.

{% highlight go %}
package main

import (
	"fmt"
	"github.com/cavaliercoder/grab"
	"os"
	"time"
)

func main() {
	// get URL to download from command args
	if len(os.Args) < 2 {
		fmt.Fprintf(os.Stderr, "usage: %s url [url]...\n", os.Args[0])
		os.Exit(1)
	}

	urls := os.Args[1:]

	// start file downloads, 3 at a time
	fmt.Printf("Downloading %d files...\n", len(urls))
	respch, err := grab.GetBatch(3, ".", urls...)
	if err != nil {
		fmt.Fprintf(os.Stderr, "%v\n", err)
		os.Exit(1)
	}

	// start a ticker to update progress every 200ms
	t := time.NewTicker(200 * time.Millisecond)

	// monitor downloads
	completed := 0
	inProgress := 0
	responses := make([]*grab.Response, 0)
	for completed < len(urls) {
		select {
		case resp := <-respch:
			// a new response has been received and has started downloading
			// (nil is received once, when the channel is closed by grab)
			if resp != nil {
				responses = append(responses, resp)
			}

		case <-t.C:
			// clear lines
			if inProgress > 0 {
				fmt.Printf("\033[%dA\033[K", inProgress)
			}

			// update completed downloads
			for i, resp := range responses {
				if resp != nil && resp.IsComplete() {
					// print final result
					if resp.Error != nil {
						fmt.Fprintf(os.Stderr, "Error downloading %s: %v\n", resp.Request.URL(), resp.Error)
					} else {
						fmt.Printf("Finished %s %d / %d bytes (%d%%)\n", resp.Filename, resp.BytesTransferred(), resp.Size, int(100*resp.Progress()))
					}

					// mark completed
					responses[i] = nil
					completed++
				}
			}

			// update downloads in progress
			inProgress = 0
			for _, resp := range responses {
				if resp != nil {
					inProgress++
					fmt.Printf("Downloading %s %d / %d bytes (%d%%)\033[K\n", resp.Filename, resp.BytesTransferred(), resp.Size, int(100*resp.Progress()))
				}
			}
		}
	}

	t.Stop()

	fmt.Printf("%d files successfully downloaded.\n", len(urls))
}

{% endhighlight %}


## Customizing requests

None of the previous convenience methods offer any control over the HTTP request
or transport. Much like the `net/http` package, `grab` enable such controls as
well as additional features such as checksum validation via `grab.Client`,
`grab.Request` and `grab.Response`.

In the same way that the `grab.Get*()` methods work behind the scenes, using
a client requires that you define and configure a `grab.Client`, one or more
`grab.Requests` and pass them to one of the `grab.Client.Do*()` methods which
then return a `grab.Response` for each request.

Let's take a look at some of the configuration options available when creating
a download request in the following example:

{% highlight go %}
// create a download request
req, err := grab.NewRequest("http://some-url/my-file")
if err != nil {
	panic(err)
}

// set destination file path
req.Filename = "./my-file"

// set expected file size if known
req.Size = 1024

// set expected file checksum if known
b, _ := hex.DecodeString("b982505fc48ea2221d163730c1856770dc6579af9eb73c997541c4ac6ecf20a9")
req.SetChecksum("sha256", b)

// delete the downloaded file if it fails checksum validation
req.RemoveOnError = true

// request a notification when the download is completed (successfully or
// otherwise)
ch := make(chan *grab.Response)
req.NotifyOnClose = ch

{% endhighlight %}

You may also configure the HTTP request itself, including request headers,
cookies, authentication, etc. using the `http.Request` nested in the
`grab.Request.HTTPRequest` field, as demonstrated in the following code:

{% highlight go %}
// set custom HTTP method
req.HTTPRequest.Method = "POST"

// set request headers
req.HTTPRequest.Header.Set("X-SOME-HEADER", "Custom value")

// set a cookie
req.HTTPRequest.AddCookie(http.Cookie{})

// set basic HTTP authentication headers
req.HTTPRequest.SetBasicAuth("username", "password")

{% endhighlight %}

## Using a custom Client

`grab` provides a default client, `grab.DefaultClient` which is used by each of
the `grab.Get*()` methods. If you wish to customize HTTP transport rules such
as connection timeouts, proxy configuration, redirect policies, etc. you may
create a custom client with `grab.NewClient()`.

The following code includes examples of customizing a client:

{% highlight go %}
// create a custom client
client := grab.NewClient()

// set the user agent string for all HTTP requests
client.UserAgent = "MyApp"

// set a custom connection timeout
client.HTTPClient.Timeout = 3 * time.Second

// replace the HTTP client with one that bypasses any system proxy settings
client.HTTPClient = &http.Client{
	Transport: &http.Transport{
		Proxy: nil,
	},
}

{% endhighlight %}

Once you have configured a client and some requests, you pass the requests to
whichever of the `grab.Do*()` methods best match your use case. These methods
are synonymous with the `grab.Get*()` methods and behave as follows:

 * `grab.Client.Do()` - blocks and returns a response once the download is
   completed or an error occurs

 * `grab.Client.DoAsync()` - immediately returns a channel which will receive a
   single `*grab.Response` and close as soon as the download has been negotiated
   with the remote server; before the transfer has started

 * `grab.Client.DoBatch()` - accepts multiple requests and executes them
   simultaneously. It accepts a `workers` parameter which determines how many
   downloads will be in process at any given time, while the remaining requests
   are queued until a worker is available. It returns a channel which will
   receive a `grab.*Response` for each request and close once they are all
   sent. The responses are sent through the channel as soon as the download has
   been negotiated with the remote server; before the transfer has started

The following and final example uses a custom client to download a batch of
files with periodic progress updates:

{% highlight go %}
package main

import (
	"fmt"
	"github.com/cavaliercoder/grab"
	"os"
	"time"
)

func main() {
	// get URL to download from command args
	if len(os.Args) < 2 {
		fmt.Fprintf(os.Stderr, "usage: %s url [url]...\n", os.Args[0])
		os.Exit(1)
	}

	// create a custom client
	client := grab.NewClient()
	client.UserAgent = "Grab example"

	// create requests from command arguments
	reqs := make([]*grab.Request, 0)
	for _, url := range os.Args[1:] {
		req, err := grab.NewRequest(url)
		if err != nil {
			fmt.Fprintf(os.Stderr, "%v\n", err)
			os.Exit(1)
		}

		reqs = append(reqs, req)
	}

	// start file downloads, 3 at a time
	fmt.Printf("Downloading %d files...\n", len(reqs))
	respch := client.DoBatch(3, reqs...)

	// start a ticker to update progress every 200ms
	t := time.NewTicker(200 * time.Millisecond)

	// monitor downloads
	completed := 0
	inProgress := 0
	responses := make([]*grab.Response, 0)
	for completed < len(reqs) {
		select {
		case resp := <-respch:
			// a new response has been received and has started downloading
			// (nil is received once, when the channel is closed by grab)
			if resp != nil {
				responses = append(responses, resp)
			}

		case <-t.C:
			// clear lines
			if inProgress > 0 {
				fmt.Printf("\033[%dA\033[K", inProgress)
			}

			// update completed downloads
			for i, resp := range responses {
				if resp != nil && resp.IsComplete() {
					// print final result
					if resp.Error != nil {
						fmt.Fprintf(os.Stderr, "Error downloading %s: %v\n", resp.Request.URL(), resp.Error)
					} else {
						fmt.Printf("Finished %s %d / %d bytes (%d%%)\n", resp.Filename, resp.BytesTransferred(), resp.Size, int(100*resp.Progress()))
					}

					// mark completed
					responses[i] = nil
					completed++
				}
			}

			// update downloads in progress
			inProgress = 0
			for _, resp := range responses {
				if resp != nil {
					inProgress++
					fmt.Printf("Downloading %s %d / %d bytes (%d%%)\033[K\n", resp.Filename, resp.BytesTransferred(), resp.Size, int(100*resp.Progress()))
				}
			}
		}
	}

	t.Stop()

	fmt.Printf("%d files successfully downloaded.\n", len(reqs))
}

{% endhighlight %}
