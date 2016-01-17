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

* concurrent downloads
* naming of downloaded files
* UI feedback with progress indicators
* clean cancellation of running downloads
* resuming of interupted downloads
* validating downloaded files using checksums

This article will step you through using a Go package called
[grab](http://github.com/cavaliercoder/grab) which abstracts `net/http` to
provide some of these features. We'll build a simple 'curl' like binary to
download files with progress bars.

To get started, install the `grab` package with:

	$ go get github.com/cavaliercoder/grab


## Download a file

The simplest way to download a file is using `grab.Get()`. It accepts two
parameters; a destination file path and the source URL. `grab.Get()` uses
`grab.DefaultClient` as a HTTP client which has default settings which will
follow redirect responses from remote servers and use a corporate proxy if
configured. Essentially, `grab.Get()` is a wrapper for
`grab.DefaultClient.Do()`.

You may specify an existing or non-existing file path as the destination or you
may specify an existing directory.

If a directory is given as the destination, `grab` will determine the filename
using `Content-Disposition` headers returned from the remote server or extract a
filename from the source URL. If either of these features fails, an error is
returned which can be identified using `grab.IsNoFilename()`.

If the destination filename exists, `grab` assumes it is a complete or partially
complete download and will resume downloading from the end of the file if
supported by the remote server. Otherwise the file will be overwritten.

`grab.Get()` and all other download functions return a `grab.Response` which
includes context about the downloaded file; including the path where the file
was downloaded.

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

Once the response is received, it can be polled periodically to monitor the
progress of the file transfer until it is finished. This example simply prints a
progress update every 100ms. 

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
		time.Sleep(100 * time.Millisecond)
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

	// start file downloads
	fmt.Printf("Downloading %d files...\n", len(urls))
	respch, err := grab.GetBatch(len(urls), ".", urls...)
	if err != nil {
		fmt.Fprintf(os.Stderr, "%v\n", err)
		os.Exit(1)
	}

	// start a ticker to update progress
	t := time.NewTicker(500 * time.Millisecond)

	// start and monitor downloads
	complete := false
	responses := make([]*grab.Response, 0)
	for complete != true {
		select {
		case resp := <-respch:
			// a new response has been received (nil is received once when the
			// channel is closed by grab)
			if resp != nil {
				responses = append(responses, resp)
			}

		case <-t.C:
			// track completion of all downloads
			complete = len(responses) == len(urls)

			// update each download
			for i := 0; i < len(responses); i++ {
				resp := responses[i]

				complete = complete && resp.IsComplete()

				if resp.IsComplete() {
					if resp.Error != nil {
						fmt.Fprintf(os.Stderr, "Error downloading %s: %v\n", resp.Request.URL(), resp.Error)
					} else {
						fmt.Printf("Finished %s %d / %d bytes (%d%%)\n", resp.Filename, resp.BytesTransferred(), resp.Size, int(100*resp.Progress()))
					}
				} else {
					fmt.Printf("Downloading %s %d / %d bytes (%d%%)\n", resp.Filename, resp.BytesTransferred(), resp.Size, int(100*resp.Progress()))
				}
			}
		}
	}

	t.Stop()

	fmt.Printf("%d files successfully downloaded.\n", len(urls))
}

{% endhighlight %}

## Using a custom Client

* User agent string
* Redirects or proxy settings
