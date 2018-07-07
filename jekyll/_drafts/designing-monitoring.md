---
layout: post
title:  "We don't have time to monitor"
---

Seriously...?

This is a first principles issue. If you disgree, please consider that in my
experience, *everyone* who has argued to me that they don't need monitoring has
been embarrassed by a preventable major outage or the discovery that noone uses
their service because it sucks to use.

Look... I'll get annoyed if we spend too much time on this so let's quickly
touch on the vastly understated value of monitoring production systems before I
move on to some tips on designing kickass monitoring on a limited budget.

We live in a world where projects have been scoped without hours for early life
support, backup configuration, security assessment, disaster recovery,
documentation, dev/test landscapes, etc. My personal pain, is the lack of value
attributed to building robust monitoring.

Monitoring should not only be a key project deliverable, but adding value to a
monitoring system should be a huge chunk of the daily life of ITOps. Ask your
customer if they want evidence that their expensive new snowflake is working or
if they are happy that it works on your computer. To quote the Google SRE team,
"hope is not a strategy".

Here's why monitoring is important to *you*:

* unplanned outages make you look bad
* preempted outages make you look awesome
* reducing infrastructure costs for over-provisioned services makes you look
  awesome
* when someone else takes a look at your unmonitored systems and discovers the
  overheating and duct tape, you look bad
* understanding the metrics means you understand the service
* meeting SLAs means your can keep your job and your customers

There's more. I could write a book.

If you design, deploy and manage a service, how can you have any indication that
you actually do a decent job? If you're waiting for feedback from end users and
stakeholders, you're too late to repair any reputational damage. Also consider
that most end users won't offer you the courtesy of feedback at alll they just
stop using stuff and harbor ill thoughts towards you and your team.

You need quantifiable evidence that things are working and _when_ (not if) they
will likely break. 


When designing monitoring:

* Start with the constracted SLAs
* Next consider the user experience
* COnsider the components which composite towards the above
* Condider components which are useful in a debug situation.

For each component:
* Utilisation, saturation, error rate
* Throughput
* Exceptions and error conditions
* Predict outages and capacity constraints
