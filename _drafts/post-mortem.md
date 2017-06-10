---
layout: post
title:  "A WebOps Post-mortem"
date:      2017-05-27 12:00:00
---

Early in the day, May 18, 2017, alerts started appearing from our Content
Distribution Network that a number of user requests were being served with
`504 Gateway Timeout` responses.

<img class="inline right" src="{{ "/2017-05-27-a-webops-post-mortem/shitting-pants.jpg" | prepend: site.cdnurl }}" alt="Negan: I hope you have your shitting pants on" />

I work with the Production Engineering team at Seven West Media in Western
Australia and the alerts indicated an issue with
[thewest.com.au](https://thewest.com.au). We initiated our Incident Response
process which borrows heavily from ITIL Incident Management and Google Site
Reliability Engineering.

The team started investigating, looking for fire to match the smoke. We explored
a few different avenues which included:

- a support call to our CDN provider to access some more detailed logging

- investigation of our monitoring tools for other alerts or anomylous trends -
  including AWS CloudWatch, Sumo Logic and Zabbix

- exploratory testing of the site to try and identify any impact

None of our investigations revealed impact or associated errors, so we became
skeptical of the alerts from our CDN. But then reports started rolling in from
colleages and customers that some images were intermittently failing to display
on the site.

## Observation A: Network I/O deviations
With all hands on deck, we discovered unusual network I/O on our Content API
servers.

The Content API is a Node.js/Express application fronted by a local instance of
nginx. It is responsible for serving article content, listings, curations, etc.
to both our internal web servers (for server-side rendering) and to our
client-side Javascript which uses the Single-Page Application model (see:
[Going Isomorphic with React](https://bensmithett.github.io/going-isomorphic-with-react/#/)).
It also serves static assets, such as pristine images, that it pipes directly
from AWS S3.

<img class="lightbox figure" src="{{ "/2017-05-27-a-webops-post-mortem/network-io.png" | prepend: site.cdnurl }}" alt="Network I/O on Content API instance" />

The above figure from Zabbix shows that network I/O became more _"ordered"_ on
one of the Content API instances around 7 AM. A [brief exploration of Complexity
Theory](https://oneworld-publications.com/simply-complexity.html) teaches us
that things go wrong when systems transition to exhibiting ordered behaviors.

We employed [Brendan Gregg's USE method](http://www.brendangregg.com/usemethod.html)
to build a clearer picture of network performance. We observed:

- throughput between each component was otherwise typical, with plenty of
  headroom

- no dropped packets, retransmits or other known TCP/IP issues that would
  indicate saturation or contention

- no error messages in any of the counters or logs we knew to check

- no network issues were being reported by AWS

There was one important metric that we neglected to check for saturation but
more on that later!

## Observation B: HTTP 499 errors

One fastidious engineer noticed something else amiss: a large number of
`499 Client Closed Request` responses being logged by nginx on the same Content
API servers.

<img class="lightbox figure" src="{{ "/2017-05-27-a-webops-post-mortem/499-graph.png" | prepend: site.cdnurl }}" alt="HTTP 409 status graph" />

The above screen grab from Sumo Logic of the same instance shows the uptick in
499 status messages at the same time that the network I/O anomaly appeared. The
uptick is obvious in this image, but it was visually masked on our dashboards
by the thousands of successful requests occuring at the same time.

Reviewing the nginx logs on each server revealed an interesting pattern that
helped us to understand the scope of the issue: all 499 responses were
constrained to static assets only. Requests for dynamic content were uneffected.

This finding was easy to confirm locally on any of the production servers. A
quick `$ curl -iv http://localhost/...` for any static asset would
hang until the client cancelled the request. The same `curl` request for any
other resource behaved as expected.

This test also validated that no error was logged via nginx or the Node.js
application. The application logs did show an incoming request but no outbound
response or error.

So here's what we knew:

<img class="lightbox figure" src="{{ "/2017-05-27-a-webops-post-mortem/what-we-know.png" | prepend: site.cdnurl }}" alt="Sequence diagram" />

- Either our CDN or Load Balancing layer was cancelling requests and returning
  status 504 as no timely response was received from upstream

- Nginx was logging a status 499 when the downstream components cancelled the
  request

- Requests to the Content API for static assets were falling into a black hole
  which meant that image content on the site was failing to transfer and display

At this point we decided we had sufficient information to experiment with a
plan for service restoration.

## Stem the bleeding
Our incident response process emphasizes small, non-destructive changes over
wholesale repairs where possible. I annoyingly repeat the mantra to my team that
we must:

> Avoid corrective surgery - just stem the bleeding

Corrective surgery is best performed once the situation has stabilized, we have
better information and everyone is 300 - like the Romans. Cool, calm and
collected.

<img class="inline" src="{{ "/2017-05-27-a-webops-post-mortem/kanye-not-impressed.jpg" | prepend: site.cdnurl }}" alt="Kanye West is not impressed" title="Cool, calm and collected" />

We formed a hypothesis that freshly launched instances of the Content API might
behave correctly and we proceeded to test this. Fortunately, we were right!
The unhealthy hosts were manually marked out of the load balancers and services
were fully restored - at least for the immediate future.

We did have the option to instead simply restart the unhealthy instances, but
our process also encourages the preservation of evidence. Restarting the
instances would have reset their state - and as we learned later - would have
reset the key metric we neglected to observe. We would not have found the root
cause until the issue resurfaced and again impacted production.

## Root cause analysis

With clearer heads and happy customers, we had the opportunity to take a
detailed look at the unhealthy servers and compare them to healthy servers.

A call to `$ netstat -t4` shows all TCPv4 sockets on a Linux system. The
following figure shows the results of this call on both an unhealthy (left) and
healthy (right) Content API instance.

<img class="osx-window lightbox" src="{{ "/2017-05-27-a-webops-post-mortem/netstat-bad.png" | prepend: site.cdnurl }}" alt="netstat session" />

Notice that the unhealthy instance has a large number of sockets in a
`CLOSE_WAIT` state and also that most sockets have a large quantity of packets
in the Receive Queue (second column). All of these sockets list AWS S3 as the
foreign end point.

By comparison the healthy server has only one `CLOSE_WAIT` socket and the
Receive Queues are mostly empty, except for the lonely `CLOSE_WAIT` socket.
Could this be the beginning of a very slow connection leak?

According to [Gordon McKinney's TCP/IP State Transition Diagram](http://www.cs.northwestern.edu/~agupta/cs340/project2/TCPIP_State_Transition_Diagram.pdf),
`CLOSE_WAIT` indicates that the socket is:

> ... waiting for a connection termination request from the local user

In our case the _"local user"_ is the Node.js application.

__TODO:__ Why did the leak break services?

Remember that key metric that we neglected to observe during our network
performance observations? We needed to measure the **number of `CLOSE_WAIT`
sockets on a server**. Queue length and the other sockets states might also have
been useful under different circumstances.

__TODO:__ Detail AWS SDK bug

## Measurements
It was important that we started measuring these socket metrics before
implementing a fix. Before-and-after measurments are critial to validate any
fix, and they make for great graphics in blog posts.

I wrote a Zabbix module and template named [zabbix-module-sockets](https://github.com/cavaliercoder/zabbix-module-sockets)
to capture the following metrics:

- the number of sockets in each state

- the sum of the receive queue of all sockets

- the sum of the send queue of all sockets

With simulated load via [spodermen](https://github.com/cavaliercoder/spodermen),
another project of mine (albiet a horrible, Frankenstein hack job) we were able
to replicate the connection leak in pre-production environments and measure the
results in Zabbix.

## The fix

With a solid hypothesis, measurements in place and way to validate our plan in
pre-production, we deployed the updated AWS SDK to our pre-production
environments.

The following figure from Zabbix shows the dramatic change in behavior around
June 2nd, when the fix was deployed to production.

<img class="lightbox" src="{{ "/2017-05-27-a-webops-post-mortem/recvq-fix.png" | prepend: site.cdnurl }}" alt="Socket Recv-Q graph" />

The gradual and orderly increase in the Receive Queue length stops at the time
of the deployment and continues forward at nominal levels. The earlier drops in
queue length you may observe are from service restarts and were ineffective to
stop the continued leak until the fix was deployed.

The following figure shows sockets states on the same server. You will notice
the thin, red slice of `CLOSE_WAIT` sockets discontinues around the time of the
fix deployment.

<img class="lightbox" src="{{ "/2017-05-27-a-webops-post-mortem/state-fix.png" | prepend: site.cdnurl }}" alt="Socket states graph" />


## Lesson learned

### Alert on 499 responses
A small number of `499 Client Closed Request` responses should be expected at
the edge, where clients do have the perogative to disconnect prematurely. But
in higher frequency, or at other points in your signal chain, these responses
might indicate that timeouts are incorrectly configured. So...

### Get your timeouts right
Each component should be configured with a timeout that is longer than all its
upstream dependencies. By example, if you have a 3 second timeout on database
queries, then the application server must not cancel requests any sooner than
this.

This is complicated by services that need multiple round-trips or have
asynchronous behaviors, but...

### Everything should be bounded
There is an expected operational behavior of every component in our system. Any
operation that completes too quickly or too slowly should create an error that
is meaningfully propagated, logged and alerted on.

In this case, our Content API servers should have been configured with a tightly
contrained timeout on all requests to S3. Error handlers in our code would then
have sent a meaningful 5xx error back downstream.

This principle should also apply to the incoming request. We should cancel any
requests that runs too long, *for any reason*. This has operational advantages,
but is also good security practice to prevent denial of service.

### Health checks must validate all dependencies
Each of our micro-services have a health check route that quickly validates each
of its known dependencies (e.g. it can connect to the database, write to a log
file, etc.). In this case we had neglected to include the dependency on S3 in
the checks. As a result, each service was advertising itself as healthy.

If we had included S3 in the health checks, the checks would have failed, these
instances would have been marked out of the load balancer, alerts would have
escalated and new healthy instances would have been rolled in automatically.

## Oustanding questions

* What was the upper limit of `CLOSE_WAIT` sockets that caused things to fail?
