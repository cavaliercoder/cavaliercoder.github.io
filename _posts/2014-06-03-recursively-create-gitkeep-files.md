---
layout:    post
title:     "Recursively create .gitkeep files"
date:      2014-06-03 12:00:00
disqus_id: "780 http://www.cavaliercoder.com/?p=780"
---

Want to create `.gitkeep` files in all empty folders in your source code project?

Well now you can! This little bash snippet does the trick for me when executed from the root of your git initialized project:

	find . -type d -empty -not -path "./.git/*" -exec touch {}/.gitkeep \;
	
Git tracks files, and not directories. This means any empty directories in your source project which are required for your software to run will be omitted whenever the source code is cloned via Git. To resolve this issue, Git users typically create a hidden `.gitkeep` file and commit it to source control for all each directory.

This is typically required for log file or plugin folders which may be populated during code execution.

The above bash command will create a `.gitkeep` file in all empty subdirectories (excluding the `.git/` repository database).