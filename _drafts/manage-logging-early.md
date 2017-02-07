---
layout: post
title:  "Managing logging early"
---

Each of our microservices wrote to './logfile.log'.

* packaging the app required logic to remove log files before packaging, and
  prevent overwrite of log files when deploying.

* chaning the pwd meant changing the location of the logs!

* each component had a different logging implementation which meant migrating
  to a new central log module implementation was difficult and time consuming

* writing var data to an app directory meant file permissions and SELinux
  contexts had to be compromised. An app should not have write access to itself.
  Logging should be in /var/log, especially to honor disk partitioning and
  log rotation scripts.

* code deployment broke, because deployment hooks were run from a cache
  directory where the hooks had no permission to write.
