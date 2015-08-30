---
layout:    post
title:     "Prevent CRL Check for PowerShell Remoting"
date:      2012-12-05 12:00:00
disqus_id: "722 http://www.cavaliercoder.com/?p=722"
---

So I ran into this spot of bother today trying to establish a remote session from one server to another server in PowerShell:

	[servername] Connecting to remote server failed with the following error message : The server certificate on the destination computer (servername:443) has the following errors:
	The SSL certificate could not be checked for revocation. The server used to check for revocation might be unreachable.
	For more information, see the about_Remote_Troubleshooting Help topic.
	+ CategoryInfo : OpenError: (System.Manageme….RemoteRunspace:RemoteRunspace) [], PSRemotingTransportException
	+ FullyQualifiedErrorId : PSSessionOpenFailed

I’m fairly certain its a firewall issue with the server unable to access the CA for verification, but in this case I don’t care; I just want to establish the session.

If you are experiencing the same issue, one solution is to create and pass a new PSSessionOption object that specifies that all certificate checks should be bypassed.

Here’s how:

{% highlight powershell %}
$sessionOption = New-PSSessionOption -SkipCACheck -SkipCNCheck -SkipRevocationCheck
$session = New-PSSession -ConnectionUri $yourUrl -Credential $credential -Authentication Basic -AllowRedirection -SessionOption $sessionOption
Import-PSSession $session
{% endhighlight %}

Hope it helps!
