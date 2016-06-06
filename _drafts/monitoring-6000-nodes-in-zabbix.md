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

This lead to
 * duplication of effort
 * lack of correlation
 * inconsistent practice on alerting, etc.
 * difficulty in SLA reporting

<img
	src="{{ "/assets/2016-05-16-monitoring-6000-hosts-in-zabbix/stats.png" | prepend: site.baseurl }}"
	alt="Status of Zabbix">

What we needed:

* Single pane of glass
* Extensibility and an API
* Scalability
* Ease of administration

## Department topology and stats

## Why Zabbix

* collection, alerting, visualization, RBAC, all in one
* great API
* small footprint and scalable architecture
* configuration UI
* open source opportunities

## How Zabbix works
* passive checks
* active checks
* templates
* hosts
* low-level discovery

## Deployment
* Monolith vs proxies
* PostgreSQL Partitions
* Templates and classes

<img
	class="osx-window lightbox"
	src="{{ "/assets/2016-05-16-monitoring-6000-hosts-in-zabbix/performance.png" | prepend: site.baseurl }}"
	alt="Zabbix Performance">

## Integrations

* CI Manager
* Active Directory
* Service management
* White box monitoring (BSM)

## Collaborating as a team

* Jira + Scrum
* Discrete environments in Vagrant
* Discrete feature branches using nvie git workflow
* System integration tests in Bamboo

<img
	class="osx-window"
	src="{{ "/assets/2016-05-16-monitoring-6000-hosts-in-zabbix/vagrant.png" | prepend: site.baseurl }}"
	alt="Zabbix Vagrant box">

## Windows monitoring

* Customisations
  - Performance counter discovery
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

## Agent benchmark
* Find issues before production

## SNMP monitoring
* mib2zabbix

## Templates and classes
* Classes (roles)
* Macros for triggers and configuration
* Sender and batch data
* Disabled items

## Hostgroups

* Permissions
* Drill down on host and data

## Trigger Dependencies
* SQL Import from CMDB
* Central, ISP, Router, switch, Virtual Host
* Central infrastructure


## Open source
* actioned issues
* code contributions
* community

## Infrastructure as code
* Environment sync 

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
* Event aggregation
* Data aggregation for capacity rollups

## Open source projects

* libzbxpgsql
* zabbix_agent_bench
* zabbix-msi
* g2z
