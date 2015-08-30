---
layout:    post
title:     "Application Pool not starting on Windows 7"
date:      2011-08-08 12:00:00
disqus_id: "483 "
---

I recently installed IIS7 on a Windows 7 workstation via batch file. The installation went off
without a hitch but I was getting no response from `http://localhost` and a quick inspection of the
IIS Manager snap-in showed that all my websites and application pools were stopped. I tried to
start the Default App Pool but this is what I got:

	Application pool cannot be started unless the Windows Process Activation Service (WAS) is running.

The Service snap-in showed that WAS was not running. When I tried to start it I got:

	Error 2: The system cannot find the file specified.

Thanks to Scott Hanselman’s efforts, I found the answer in his article 
[Fixed: “Windows Process Activation Service (WAS) is stopping because it encountered an error.”.](http://www.hanselman.com/blog/FixedWindowsProcessActivationServiceWASIsStoppingBecauseItEncounteredAnError.aspx)

All that was required was to create the folder `C:\inetpub\temp\apppools`. That’s it!

Once created, start the Windows Process Activation Service and World Wide Web publishing Service
and you should be away! Also, make sure they are set with Startup Type, Automatic