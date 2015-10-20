---
layout: post
title:  "dmidecode for Apple OS X"
---

[Dmidecode](http://www.nongnu.org/dmidecode/) is a long standing, effective tool
for reading manufacturer info from the SMBIOS tables present on most modern x86
based systems. It's been available for many years on most Unix like operating
systems and has also been ported to
[Windows](http://gnuwin32.sourceforge.net/packages/dmidecode.htm). Until now, it
had never made the leap to OS X.

From the [dmidecode website](http://www.nongnu.org/dmidecode/):

> Dmidecode reports information about your system's hardware as described in
  your system BIOS according to the SMBIOS/DMI standard. This information
  typically includes system manufacturer, model name, serial number, BIOS
  version, asset tag as well as a lot of other details of varying level of
  interest and reliability depending on the manufacturer. This will often
  include usage status for the CPU sockets, expansion slots (e.g. AGP, PCI, ISA)
  and memory module slots, and the list of I/O ports (e.g. serial, parallel,
  USB).

## Portability

Dmidecode ports very nicely onto any Unix-like platform that exposes raw system
memory (specifically the range where SMBIOS lives) as a file handle (such as
`/dev/mem`). Unfortunately, a few years back, Apple disabled its memory file
handle by default. Now the only way to access SMBIOS memory directly (on an
out-of-box OS X machine) is to use Apple's proprietary IOService API.

This port of dmidecode aims to minimize deviation from the upstream codebase to
ensure that ongoing maintenance is as simple as possible. The challenge has
been achieving this without butching the code with a bunch of
`if apple... else...` blocks but cleanly navigating around code that assumes
SMBIOS data is accessible from a file path.

## Installation on OS X

* Clone the `dmidecode` sources with git:
  {% highlight bash %}
  $ git clone https://github.com/cavaliercoder/dmidecode-osx.git
  {% endhighlight %}

* Or, download the latest `dmidecode-osx` release tarball [from GitHub](
  https://github.com/cavaliercoder/dmidecode-osx/releases) and extract with:
  {% highlight bash %}
  $ tar -xzf dmidecode-osx-*.tar.gz
  {% endhighlight %}

* Build and install to `/usr/local` with:
  {% highlight bash %}
  $ make && make install
  {% endhighlight %}

## Sample output

Here's some sample `dmidecode` output from my MacBook Pro 2010 running OS X
10.9.5; modified for privacy and brevity:

{% highlight text %}
# dmidecode 3.0
Getting SMBIOS data from Apple SMBIOS service.
SMBIOS 2.4 present.
61 structures occupying 2888 bytes.

...

Handle 0x001C, DMI type 0, 24 bytes
BIOS Information
	Vendor: Apple Inc.
	Version:    MBP61.88Z.0057.B0F.1112091028
	Release Date: 12/09/11
	ROM Size: 4096 kB
	Characteristics:
		PCI is supported
		BIOS is upgradeable
		BIOS shadowing is allowed
		Boot from CD is supported
		Selectable boot is supported
		ACPI is supported
		IEEE 1394 boot is supported
		Smart battery is supported
		Function key-initiated network boot is supported
	BIOS Revision: 0.1

Handle 0x001D, DMI type 1, 27 bytes
System Information
	Manufacturer: Apple Inc.
	Product Name: MacBookPro6,2
	Version: 1.0
	Serial Number: W80223VBDAW
	UUID: 677C7349-0762-4254-A9A5-6646B1BD4083
	Wake-up Type: Power Switch
	SKU Number: System SKU#
	Family: MacBook Pro

Handle 0x001E, DMI type 2, 16 bytes
Base Board Information
	Manufacturer: Apple Inc.
	Product Name: Mac-F22586C8
	Version: MacBookPro6,2
	Serial Number: W8022732FVUPA
	Asset Tag: Base Board Asset Tag#
	Features:
		Board is a hosting board
		Board is replaceable
	Location In Chassis: Part Component
	Chassis Handle: 0x001F
	Type: Motherboard
	Contained Object Handles: 0

...

{% endhighlight %}