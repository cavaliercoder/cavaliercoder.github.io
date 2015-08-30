---
layout: post
title:  "Identifying Windows Disks, Partitions and Volumes"
---

A recent body of work revealed some frustrations in uniquely identifying and managing disks,
partitions and volumes on the Windows platform. My end goal was to discover physical disks and
logical volumes on a Windows server (2000+) and then monitoring those assets using Performance
Counters or WMI for IO, wait times, free space, etc.

Two performance counter categories are available to monitor these assets; PhysicalDisk and
LogicalDisk. Both counter sets use unique instance names to identify and monitor unique disks.
My initial solution to this endeavour was to enumerate all available instance names for the two
classes and subsequently watch the associated counters. The problem with this solution became
apparent when monitoring disks associated with a Windows Failover Cluster; the index numbers and
drive letters used in the counter instance names do not persist between failovers between nodes.
Essentially the index of a drive or volume may change over its lifetime as volumes are added,
removed, failed over, on reboot, etc.

In searching for an answer, my initial confusion was determining the difference between a disk,
partition and volume and also how to uniquely identify each asset, so here's a rundown on the
basics:


## Physical Disk

This entity refers to the lowest component presented to the OS. That is, a physical hard disk, RAID
array or LUN. It can be logically segmented into one or more partitions which in turn may
participate in one volume each.

A physical disk is often identified by an arbitrary and unique zero-based index. This index is
unique to the disk at runtime but does not persist for the lifetime of the disk. Other attributes
are available for identification such as model or serial number, but none of these attributes have
guaranteed uniqueness.

From Windows XP/2003 onwards, physical disks with a MBR have a unique (system wide) and persistent
"signature" written as a four byte word at offset 0x01B8 in the MBR. Disks with a GPT partition
table on EFI systems also include an unique GUID (who'd have thought!).

The signature or GUID is our best bet at some persistent identification and is retrievable by
sending the IOCTL_DISK_GET_DRIVE_LAYOUT_EX control code with DeviceIoControl in the Win32 API or
via WMI.

Physical disks are represented by the Win32_PhysicalDisk in WMI and can be returned for a given
volume with the IOCTL_VOLUME_GET_VOLUME_DISK_EXTENTS control code.


## Partition

A physical disk maybe be partitioned into smaller, logical storage segments called partitions. A
partition may be parented by only one physical disk and participate in one volume.

Each partition can be identified by the index of its parent disk drive and its zero-based index on
its parent (eg. the first partition is 0, second is 1, etc.).

MBR based partitions can only be identified by their zero-based index on their parent disk. GPT
partitions also contain a GUID. Both partition index and GUID of GPT partitions can be retrieved by
sending  the IOCTL_DISK_GET_PARTITION_INFO_EX control code with DeviceIoControl.

Partitions are represented in WMI by the Win32_DiskPartition class including associations to linked
physical disks and volumes. To get the partitions for a given disk in the Win32 API send the
IOCTL_DISK_GET_DRIVE_LAYOUT_EX control code with DeviceIoControl.


## Volume

Also known in Windows as a Logical Disk, a volume may consist of one of more partitions from
multiple disks and may be configured as a software RAID such as software RAID 5, JBOD, etc. A
volume also exists for media in removable devices (such as a CDROM drive), even when in an
unmounted/ejected state. Most enumeration happens on a volume level.

Volumes can be identified by a GUID, drive letter or DOS device path, each appearing in differing
formats and functions.

Volumes are represented in WMI by both the Win32_Volume and Win32_LogicalDisk classes with
differing features.


## How do we fix this?

My initial solution was to enumerate the available performance counter instances for PhysicalDisk
and LogicalDisk. The beauty of this is that no disk/volume enumeration or translation is required as
we are simply grabbing all available performance counter instances by name. The issue, as discussed,
is that the instances names use the disk and volume indices which change over their lifetime. This
means I have multiple monitoring graphs for the same disk (with different indices), all of which
have gaps starting where the index changed.

To successfully monitoring a disk, we must pass the Performance Monitor API (via pdhmon, WMI, .Net,
whatever...) the index of a disk AND the drive letter of the first volume on that disk that has a
drive letter if applicable. To monitor a logical disk, we must pass the drive letter or volume index
(as "HarddiskVolumeX") if no drive letter is assigned or the volume is mounted in a subfolder.

Now the challenge is ide