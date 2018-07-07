---
layout:    post
title:     "Mac OSX Lion File Sharing Connection Failed"
date:      2011-07-24 12:00:00
disqus_id: "480 "
---

After upgrading to OS X Lion 10.7 on both my iMac and Mac Book Pro, I’m interrupted by an ambiguous
`Connection Failed` error every time I attempt to list AFP shares on one system from the other in
Finder. There are various hints around the web suggesting that this is a bug and that it can be
solved by creating another user account, repairing disk permissions or even just switching from AFP
to SMB (Windows sharing). Good news is, if your issue is identical to mine, the solution is much
simpler and less obtrusive.

In my case, I had the home folder for my user accounts shared on both Macs. Simply remove the home
folder file share and all is well. To do this, open the Apple menu, open
`System Preferences -> Sharing -> File Sharing` and then select your home folder (named after your
user account) and click the `–` button.

To gain access to the home folder from each Mac, simply click `Connect As` in Finder and enter the
appropriate credentials for the user who owns the home folder on the Mac you are connecting to. The
home folder (and hard disk root) is automatically available!

Although it is frustrating that this is not either reported to the end user as an issue or
automatically resolved, I’d suggest that the concept is more in line with security best practice
for network file sharing. Any files to be shared really should be in a public folder, not your
personal home folder (says me who had my home folder shared).

For what it’s worth, I’m enjoying the $30 upgrade. Full screen apps are nice (NI Traktor finally
works full screen when switching desktops), Airdrop is fool proof and the reverse scrolling is
actually oddly natural.
