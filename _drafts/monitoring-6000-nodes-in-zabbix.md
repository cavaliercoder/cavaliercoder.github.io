---
layout: post
title:  "Monitoring 6000+ hosts in Zabbix"
---

## The problem


<img
	src="{{ "/assets/2016-05-16-monitoring-6000-hosts-in-zabbix/stats.png" | prepend: site.baseurl }}"
	alt="Status of Zabbix">

## Why Zabbix
* extensibility
* open source opportunities
* Scalability
* Configuration UI

## How Zabbix works
* agent items

## Deployment
* Monolith vs proxies
* PostgreSQL Partitions

<img
	class="osx-window lightbox"
	src="{{ "/assets/2016-05-16-monitoring-6000-hosts-in-zabbix/performance.png" | prepend: site.baseurl }}"
	alt="Zabbix Performance">

## Integrations

* CI Manager
* Active Directory
* Service management
* White box monitoring

## Collaborating as a team

* Discrete environments
* Discrete product branches
* System integration tests


<img
	class="osx-window"
	src="{{ "/assets/2016-05-16-monitoring-6000-hosts-in-zabbix/vagrant.png" | prepend: site.baseurl }}"
	alt="Zabbix Vagrant box">

## Windows monitoring

* Customisations
	- Windows disk and volume discovery
	- Service discovery
	- Hostname casings
	- 
* MSI package + scripts
* Perfcounter import
* Test script

## Linux monitoring
* Modules
* Test script

## SNMP monitoring
* mib2zabbix

## Templates and classes
* Macros
* Sender and batch data
* Disabled items

## Hostgroups

* Permissions
* Drill down on host and data

## Dependencies


## Agent benchmark


## Open source
* actioned issues
* code contributions
* community

## Infrastructure as code

## Weeknesses

* Aggregations and rollups
* Graph visualisations
	- No annotations
	- No distribution
* Limited actions

## Lessons learned

* Use discrete package management
* Theory of contraints - change management slowdown
* Let go and let others
* Portability sucks....
* Mass updates slow


## Future plans

* Network devices
* More applications
* Log files
* Event 
