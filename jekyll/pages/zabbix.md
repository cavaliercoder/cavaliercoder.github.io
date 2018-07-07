---
layout: page
title:  "Kickass Zabbix Tools"
permalink: /blog/kickass-zabbix-tools.html
menu: Zabbix
---

I've had the pleasure of working with Zabbix for many years now, (since 2.0).
Over that time, I've built a few tools that have made life easier for myself,
the teams I've worked and the Zabbix community.

A couple of these tools are well known, like the popular libzbxpgsql, g2z or
mib2zabbix, but others are obscured in the depths of my GitHub repository
list.

I hope by listing these tools here, that they are of some use to you, and you
might even consider contributing more rad features to them.

## Monitoring

### [PostgreSQL Module](https://github.com/cavaliercoder/libzbxpgsql)

A native Zabbix module for high performance monitoring of PostgreSQL servers.

### [Systemd Module](https://github.com/cavaliercoder/zabbix-module-systemd)

A native Zabbix module to monitor systemd units via D-Bus.

### [Sockets Module](https://github.com/cavaliercoder/zabbix-module-sockets)

A native Zabbix module for monitoring Linux sockets - including TCP, TCP6, UDP,
UDP6 and UNIX.

## Configuration

### [Zabbops](https://github.com/cavaliercoder/zabbops)

A Python package for automating Zabbix configuration using Amazon Web Services
APIs and services.

### [PostgreSQL Partioning scripts](https://github.com/cavaliercoder/zabbix-pgsql-partitioning)

PostgreSQL scripts to create and manage partitions for massive Zabbix databases.

## Deployment

### [Docker-Zabbix](https://github.com/cavaliercoder/docker-zabbix)

Dockerfiles to build vanilla, all-in-one Zabbix containers of common versions.
Mostly useful for testing integrations with vanilla Zabbix instances.

### [Puppet-Zabbix](https://github.com/cavaliercoder/puppet-zabbix)

A Puppet module to install, configure and maintain Zabbix on RHEL derivative
operating systems.

### [Packer-Zabbix](https://github.com/cavaliercoder/packer-zabbix)

A Packer script to build a Vagrant box running Zabbix.

### [Zabbix MSI WiX template](https://github.com/cavaliercoder/zabbix-msi)

A WiX template to build a MSI package of the Zabbix agent and tools for
installation on Windows systems.

## Extending Zabbix

### [Go2Zabbix](https://github.com/cavaliercoder/g2z)

A Go-lang library for creating loadable Zabbix modules, written in Go.

### [Embedded Python Module](https://github.com/cavaliercoder/libzbxpython)

A native Zabbix module that embeds a Python interpreter into the agent, to allow
for high performance Python script execution. Also includes a Python library to
simplify the creation of embedded Zabbix modules.

## Testing

### [Zabbix Agent Bench](https://github.com/cavaliercoder/zabbix_agent_bench)

A simple binary for highly parallel stress testing of a Zabbix agent and its
loaded modules or User Parameters. Useful for highlighting issues in code or
for simple integration tests.

## Templating

### [Zabbix Template Convertor](https://github.com/cavaliercoder/zabbix-template-convertor)

A Python script to convert Zabbix templates between versions. For example, you
can convert a 3.2 template to be loadable in Zabbix 2.0.

### [MIB2Zabbix](https://github.com/cavaliercoder/mib2zabbix)

A Perl script to automatically generate Zabbix templates from SNMP MIB files.

### [PS-ZabbixTemplates](https://github.com/cavaliercoder/ZabbixTemplates)

A native PowerShell module with useful extensions to the Zabbix agent, and the
ability to automatically generate templates from Windows PDH Performance
Counters.
