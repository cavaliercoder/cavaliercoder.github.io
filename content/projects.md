---
title: "Projects"
url: "/projects/"
menus:
  main:
    name: Projects
    weight: 40
---

Maintained Go packages live in the
[cavaliergopher](https://github.com/cavaliergopher) organisation. Everything
else, including the archive, is on my personal account,
[cavaliercoder](https://github.com/cavaliercoder).

## Go

### [grab](https://github.com/cavaliergopher/grab)

A download manager package for Go. Monitors progress concurrently, resumes
interrupted transfers and validates downloads against checksums.

Used by [aptly](https://github.com/aptly-dev/aptly),
[VirusTotal's CLI](https://github.com/VirusTotal/vt-cli) and
[Rancher's elemental-cli](https://github.com/rancher/elemental-cli), among
roughly 475 public packages. I wrote about the design in
[Downloading large files in Go](/blog/downloading-large-files-in-go.html).

### [rpm](https://github.com/cavaliergopher/rpm)

A Go implementation of the RPM file format — read package metadata, signatures
and payloads without shelling out to `rpm`.

### [cpio](https://github.com/cavaliergopher/cpio)

CPIO readers and writers for Go, in the style of `archive/tar`.

### [xflags](https://github.com/cavaliergopher/xflags)

Expressive command line flags for Go, with subcommands and struct binding.

### [badio](https://github.com/cavaliergopher/badio)

Extensions to Go's `testing/iotest` package, for provoking I/O failures that are
otherwise hard to reproduce in tests.

## Systems and tools

### [y10k](https://github.com/cavaliercoder/y10k)

Declarative management of Yum package mirrors.

### [vpc-free](https://github.com/cavaliercoder/vpc-free)

Finds unallocated IP address blocks across AWS VPCs and subnets.

### [dmidecode-osx](https://github.com/cavaliercoder/dmidecode-osx)

A native port of `dmidecode` to macOS. See
[dmidecode for Apple OS X](/blog/dmidecode-for-apple-osx.html).

### [rpi_export](https://github.com/cavaliercoder/rpi_export)

A Prometheus exporter for Raspberry Pi hardware metrics.

## Emulation

### [go-m68k](https://github.com/cavaliercoder/go-m68k)

A Motorola 68000 emulator written in Go, and the CPU core behind an
[experimental Sega Genesis emulator](https://github.com/cavaliercoder/genesis).

## Monitoring

I maintained a number of Zabbix modules and tools over the years, including
`libzbxpgsql`, `g2z` and `mib2zabbix`. They're listed separately in
[Zabbix tools I've written](/blog/zabbix-tools.html).
