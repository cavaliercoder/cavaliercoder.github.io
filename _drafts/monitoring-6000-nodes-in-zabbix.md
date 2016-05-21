---
layout: post
title:  "Monitoring 6000+ hosts in Zabbix"
---

## Agenda



## The problem

* Multiple monitoring tools
	- HP OM
	- HP NNMi
	- 4x Cacti
	- Nagios
	- SolarWinds
	- Scripts and scheduled tasks

* Hope is not a strategy

<img
	src="{{ "/assets/2016-05-16-monitoring-6000-hosts-in-zabbix/stats.png" | prepend: site.baseurl }}"
	alt="Status of Zabbix">

What we needed:

* Single pane of glass
* Extensibility and an API
* Scalability
* Ease of administration

## Why Zabbix

* great API
* low footprint and scalable architecture
* 
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

* Jira + Scrum
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
* MSI package + scripts
* Perfcounter import
* Test script

### Windows disk and volume discovery

__The problem:__ 

 * Drive letters are nonpersistent for disks and volumes. This means metric
   collection is disjointed
 * Clustered disks are discovered on all cluster nodes while system disks appear
   and disappear on the cluster IP
 * Performance counters use a nonpersistent identifiers for all drives and
   volumes which are sensitive to reboots

__The solution:__

* MBR disks provides a pseudo-unique, persistent, 32 bit signature written in
  the master boot record
* GPT disks (required on EFI systems) include a GUID encoded in the disk header
* Both are available in the `DeviceIOControl` API
* Volumes include a persistent GUID which is exposed in the 
  `GetVolumeInformation` function
* translate disk identifiers to `PhysicalDisk` performance counter indexes (use
  i18n indexes for best compatibility)
* translare volume GUIDs to `LogicalDisk` performance counter drive letters


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
* SQL Import
* Central, ISP, Router, switch, Virtual Host

## Agent benchmark


## Open source
* actioned issues
* code contributions
* community

## Infrastructure as code
* Environment sync
* 

## Weeknesses

* Aggregations and rollups
* Graph visualisations
	- No annotations
	- No distribution
* Limited actions

## Lessons learned

* Use discrete package management
* Theory of contraints - change management slowdown - small releases is better
* Let go and let others
* Portability sucks....
* Mass updates slow
* Skilled required
* Building templates is boring but necessary


## Future plans

* Network devices
* More applications
* Log files
* Event 

## Open source projects

* libzbxpgsql
* zabbix_agent_bench
* zabbix-msi
* g2z
