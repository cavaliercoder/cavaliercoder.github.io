---
layout: post
title:  "Zabbix Agent MSI Installer"
date:   2014-04-02 12:00:00
---

Recently I've been tasked with deploying the open source monitoring solution Zabbix to a 5000+
server network. One of the challenges has been packaging of both the Linux and Windows versions of
the agent.

Long story short, I solved the deployment problem by building a custom MSI package for x86 and x64
platforms using the WiX Toolset. The package includes our custom compiled Zabbix agent binaries,
custom scripts, configuration and environment variables and is deployed using a number of methods
including scripting, Group Policy and HP Client Automation.

I've taken some of the lessons learned to build a generic WiX project which you may utilize to build
your own MSIs and have published the source over on GitHub.

[Zabbix MSI Source on GitHub](https://github.com/cavaliercoder/zabbix-msi)

If you're keen to get started, get on over the Github and see the README for usage information. For
the how's and why's, read on!

## The Challenges

The Zabbix agent is actually incredibly impressive. Compared to the competition, it's extremely
light weight, fast and incredible flexible given how simple it is. One of the problems (as with a
lot of open-source, Linux based applications) is that while the agent natively supports Windows, the
deployment mechanisms are basically nonexistent. The Windows agent is published by Zabbix in a zip
file of precompiled binaries. In a small network, that's not such a big letdown but in my situation,
I had 5000+ nodes to deploy to, geographically spread over the state of Western Australia. I needed
a mechanism to deploy the agent and achieve the following:

* Support automated deployment (Group Policy, HP Client Automation, etc.)
* Consistent configuration of all agent installs
* Version control and upgradability
* Installation of agent files and custom scripts and configuration
* Installation and configuration of the Zabbix agent service/daemon
* Support multiple platforms (32 and 64 bit) natively
* Support various configurations (Windows 2000 - 2012, Domain Controllers, etc.)
* Set environment variables to support variable install paths

## The Options

After a little Googling, the obvious candidate was the MSI packages built by Michel Manceron at
http://www.suiviperf.com/zabbix/index.php.
