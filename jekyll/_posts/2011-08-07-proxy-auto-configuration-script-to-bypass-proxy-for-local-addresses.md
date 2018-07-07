---
layout: post
title:  "Proxy Auto-Configuration Script to Bypass Proxy for Local Addresses"
date:   2011-08-07 12:00:00
disqus_id: "479 "
---

Most organizations will want to bypass their proxy server for local web servers (intranet, CMS,
helpdesk, etc). You can manually add each new server to your exception list in your logon script or
group policies or simply use this PAC script to determine if a server is local and bypass it
automatically!

You can use built in commands such as isInNet() which use potentially slow DNS lookups, but this
method uses Regex queries instead.

{% highlight javascript %}
/*
 *  Web Proxy Auto-Discovery Protocol Script
 *  Written by Ryan Armstrong
 *  http://www.cavaliercoder.com
 */
function FindProxyForURL(url, host)
{
    // Proxy server in format "PROXY [proxy server]:[proxy port]"
    var proxy = "PROXY proxy.mydomain.local:8080";
     
    // Proxy Exceptions:
    var exceptions = new Array(
     
        // Non-domain hostnames (eg. intranet, helpdesk, timesheets, etc)
        /^[a-zA-Z0-9-]+$/,
         
        // Local domain hosts (eg. fileserver.mydomain.local)
        /\.mydomain\.local$/,
         
        // Local IP Addresses (ie. 192.168.0.1 - 192.168.255.254)
        /^192\.168\.\d+\.\d+$/,
         
        // Local IP Addresses (ie. 172.16.0.1 - 172.32.255.254)
        /^172\.(1[6-9])|(2[0-9])|(3[0-2])\.\d+\.\d+$/,
         
        // Local IP Addresses (ie. 10.0.0.1 - 10.255.255.254)
        /^10\.\d+\.\d+\.\d+$/,
         
        // A domain and all of its subdomains:
        /microsoft\.com$/,
         
        // A domain and NONE of its subdomains:
        /^news\.google\.com$/
    );
     
    for (i = 0; i < exceptions.length; i++) // Iterate through each exception
    {
        if (exceptions[i].test(host)) // Test regex query against hostname
        {
            return "DIRECT"; // Bypass the proxy
        }
    }
     
    return proxy; // Connect via proxy
}

{% endhighlight %}

With each URL request, a client's browser will execute the FindProxyForURL() function and pass it
the URL string and domain host name for the request. The function needs to return a string telling
the browser to connect directly, via SOCKS or via a Proxy.

Be sure to update the exception and proxy address appropriate to your needs.

The script can be found and configured automatically by most browsers if it is made available via
HTTP and advertised via DHCP or DNS. Firefox and Chrome (to my knowledge) don't support the DHCP
method, but most browsers support DNS.

To have your script found via DNS is must be made available at
`http://wpad.mydomain.local/wpad.dat` where `mydomain.local`, need I say it, is your local domain.
To do this, I saved the script as 'wpad.dat' in the root directory of my intranet server and
created a DNS CNAME record (alias) pointing to that server named `wpad`. You must also set the MIME
type of the file to `application/x-ns-proxy-autoconfig` or the file won't download (at least from
IIS in my case). See Configure MIME Type (IIS 6.0) on Technet.

If you do also want to advertise the script via DHCP (it can't hurt), simply add Option 252 to your
scope options containing the URL of your script. According to this article, IE6 may require the URL
to be NUL terminated.

Here's another handy tip: if you want to test the functionality of the script, you can use the
following PHP script (if PHP is configured on your web server) to immediately test the result of
any specified host name. Save the following script as `index.php` in the same folder as your proxy
script and browse to `http://wpad.mydomain.local`.

{% highlight html %}
<html>
    <head>
        <script language="javascript">
<?php require_once('wpad.dat'); ?>
 
function testHost(host)
{
    document.getElementById('result').innerHTML = FindProxyForURL('', host);
}
        </script>
    </head>
    <body>
        <h1>Proxy Config</h1>
        <p>Enter the desired hostname to discover which proxy will be used.</p>
        <input type="text" onKeyUp="testHost(this.value)" size=30/>
        <span id="result" />
    </body>
</html>

{% endhighlight %}

Further Reading:

* Wiki page with an overview: http://en.wikipedia.org/wiki/Web_Proxy_Autodiscovery_Protocol

* Microsoft examples for IE: http://technet.microsoft.com/en-us/library/dd361950.aspx

* IE Proxy Result Caching: http://support.microsoft.com/kb/271361

* Publishing via Apache: http://homepage.ntlworld.com/jonathan.deboynepollard/FGA/web-browser-auto-proxy-configuration.html

* Best Practices: http://www.websense.com/content/support/library/web/v76/pac_file_best_practices/PAC_best_pract.aspx
