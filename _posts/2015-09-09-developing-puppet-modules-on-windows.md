---
layout: post
title:  "Developing Puppet modules on Windows"
---

This little workflow will describe how to develop and test Puppet modules on a Windows server that
is managed by a Puppet Master without interfering with your Puppet Master, other developers or your
r10k/git pipeline. It is assumed you have Administrator access on the development server.

The problem: I use r10k to deploy Puppet modules from my local GitLab instance, GitHub and the
Puppet Forge onto the Puppet master. When writing modules for Windows with this configuration,
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

To get familiar with writing Puppet modules, take a read through their [Module
fundamentals](https://docs.puppetlabs.com/puppet/latest/reference/modules_fundamentals.html). Once
you're ready, open up a *Command Prompt with Puppet* window as Administrator and let's get started.

## Setup dependencies

There's a fair chance your Puppet code will rely on third party modules. For agents managed by a
Master, there won't be any modules installed as the agent looks to the Master for compiled catalogs,
built from modules installed on the Master.

Installing modules locally from the Puppet Forge is easy enough and won't interfere with your Master
or typical operation. Just run:

	> puppet module install <author>/<module>

If you're behind a corporate proxy, make sure you set `http_proxy_host` and `http_proxy_port` in
your `puppet.conf` file. If you're not sure where this is, run:

	> puppet config print config

*Note:* If you see the following SSL certificate error when attempting to install a module from the
Forge, you'll need to run Windows update or install the *GeoTrust Global CA* certificate (as per the
Puppet [troubleshooting docs](https://docs.puppetlabs.com/windows/troubleshooting.html#error-
messages)):

	Error: Could not connect via HTTPS to https://forge.puppetlabs.com
	  Unable to verify the SSL certificate
	    The certificate may not be signed by a valid CA
	    The CA bundle included with OpenSSL may not be valid or up to date

To install modules from locations other than the Forge, you can manually install them (or deploy via
r10k/git/etc.) into the `modulepath` location where Puppet looks for installed modules. To find your
configured path run:

	> puppet config print modulepath

This will typically return something like

	C:/ProgramData/PuppetLabs/puppet/etc/modules;C:/usr/share/puppet/modules

Go ahead and install all of the modules required by your custom module.


## Install your module

Any of the paths returned for `modulepath` (really your choice) is where we will deploy our Puppet
code. Navigate to your selected path and deploy your custom module or bootrap a new one with:

	> puppet module generate <module_name>

If you would prefer to store your module elsewhere, you can append a new path to the `modulepath`
directive of your `puppet.conf` file, or pass all desired module paths to the `--modulepath`
argument when calling `puppet apply` (described below).


## Edit remotely

You can now edit your module remotely from your workstation using Windows file shares. If your
selected `modulepath` is for example:

	C:/ProgramData/PuppetLabs/puppet/etc/modules

it will be accessible to administrators remotely as

	\\<host>\c$\ProgramData\PuppetLabs\puppet\etc\modules


## Test your code

If your new code interferes with configuration currently deployed from your Puppet Master, you may
wish to disable your Puppet agent on the development server to prevent it applying conflicting
changes while you are developing. Disable the Puppet agent with:

	> puppet agent --disable

Now you can execute your Puppet code on the development Windows server with:

	> puppet apply -e "include my::class::path"

If you want to preview changes without making any changes to the server, append the `--noop`
argument.

When you're ready to deploy your code to other servers, you may commit locally and push through your
typical deployment pipeline.

Once you've finished developing, make sure to reenable the agent with:

	> puppet agent --enable
