---
layout: post
title:  "Developing Puppet modules on Windows"
---

This little workflow will describe how to develop and test Puppet modules on a Windows server that
is managed by a Puppet Master without interfering with your Puppet Master, other developers or your
r10k/git pipeline.

The problem: I use r10k to deploy Puppet modules from my local GitLab instance, GitHub and the
Puppet Forge onto the Puppet master. When writing modules for Windows With this configuration,
there's a temptation to do one of two very bad practices:

1. Edit code directly on the Puppet Master where it will interfere with other developers, break
   other managed nodes when my code breaks and most importantly, my changes __will be overwritten__
   if r10k runs again.

   or

2. Commit and push every change I make to my central git repo and then deploy via r10k. Talk about
   slow and dirtying up the commit log... Also affects other devs and other nodes. Bad, bad, bad.

The solution in short, is to modify your Puppet code on the Windows box you are targeting and apply
changes dettached from the Master. When you are confident with your code, you might commit, push and
deploy to your development nodes. This is going to need a touch of setup, but don't be afraid; it's
easy peasy, squeeze the lemons.

Open up a *Command Prompt with Puppet* window as Administrator and let's get started.

# Setting up dependencies

First step is to figure out where the Puppet agent is looking to find installed modules. For agents
managed by a Master, this folder will typically not exist or will be empty as the agent looks to the
Master for compiled catalogs, rather than compiling a catalog itself from installed modules and
manifests.

	> puppet config print modulepath

This will typically return something like

	C:/ProgramData/PuppetLabs/puppet/etc/modules;C:/usr/share/puppet/modules

Either of these paths (really your choice) is where we will deploy our Puppet code and install
prerequisite modules. You may go ahead and create the directory or, use the Puppet agent to create
the default directory by actually installing a module from the Forge. Typically, you will need
`stdlib` so let's install it with:

	> puppet module install puppetlabs/stdlib

If you're behind a corporate proxy, make sure you set `http_proxy_host` and `http_proxy_port` in
your `puppet.conf` file. If you're not sure where this is, run:

	> puppet config print config

*Note:* If you see the following SSL certificate error, you'll need to run Windows update or install
the `GeoTrust Global CA` certificate (as per the Puppet
[troubleshooting docs](https://docs.puppetlabs.com/windows/troubleshooting.html#error-messages)):

	Error: Could not connect via HTTPS to https://forge.puppetlabs.com
	  Unable to verify the SSL certificate
	    The certificate may not be signed by a valid CA
	    The CA bundle included with OpenSSL may not be valid or up to date


