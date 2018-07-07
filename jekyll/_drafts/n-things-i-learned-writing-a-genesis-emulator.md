---
layout: page
title: N things I learned writing a Sega Genesis emulator in Go
---

Well then...

- Why emulators are so slow

  - Instruction count required for a single emulated instruction
  - Emulated registers live in RAM
  - Routing to opcode handlers and CPU cache complexity
  - Memory access mapping and layering
  - Switching and branching
  - Type conversions
  - Tracing overhead

- Why emulators are hard

  - Docs vs. reality
  - Games/apps using hardware hacks
  - APIs between components
  - syncronizing components
  - Interupts
  - Mapping to operating systems
  - Can't control registers in host machine
  - Reference/correctness testing
  - Operating system support

- Code generation vs. runtime branching
  - Compile time/binary size vs. performance

- [Statically Recompiling NES Games into Native Executables with LLVM and Go](http://andrewkelley.me/post/jamulator.html)