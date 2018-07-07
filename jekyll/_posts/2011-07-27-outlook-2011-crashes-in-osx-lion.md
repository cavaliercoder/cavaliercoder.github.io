---
layout:    post
title:     "Outlook 2011 Crashes in OS X Lion"
date:      2011-07-27 12:00:00
disqus_id: "481 "
---

Since installing OS X Lion on a MacBook Pro at work, I’ve had a problem starting Outlook 2011.
Outlook displays the splash screen for less than a second and then exits without a trace.

I did find the following error in the system logs by typing `tail /var/log/system.log` in a
Terminal window.

	com.apple.launchd.peruser.501[552] ([oxo-ox7a07a]).com.microsoft.Outlook[1448]) Exited with exit code: 255

I’m not sure what causes the problem but Microsoft did tell us to anticipate some issues with
Outlook 2011 on OS X Lion in this article here. Fortunately this issue is easy to fix and does not
seem to reoccur, but does require you to reconfigure your email accounts.

To fix the problem, you need to reset your Office Identities. There is no need to touch the plist
files or create new user accounts. Simply rename
`~/Documents/Microsoft User Data/Office 2011 Identities` to `Office 2011 Identities.backup`
(Press `Return` to rename once selected in Finder). Please note that tilde (`~`) is a shortcut to
your home folder in OS X and other *nix based operating systems.

Outlook should now open but will require you to recreate your mail accounts. I did so with an 
Exchange account so all mail items and contacts, etc were still available. I’m not sure if this
would be the case with POP3 / IMAP accounts but take heart because you have a backup of your old
Identities folder to pull files from! See the article Your Office Identity for more information on
the Identities folder.

Please let me know if this solution works for you.
