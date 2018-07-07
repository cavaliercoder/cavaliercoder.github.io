---
layout: post
title:  "Terminal Color in OSX"
date:   2011-06-04 12:00:00
---

Have you ever wanted to add some color to the text in your OSX terminal? Colored text makes output
so much easier to read, it leaves me surprised that Apple have not implemented it themselves.

<a class="lightbox" href="{{ "/assets/2011-06-04-terminal-color-in-osx/osx-color.png" }}">
	<img class="osx-window" src="{{ "/assets/2011-06-04-terminal-color-in-osx/osx-color.png" | prepend: site.baseurl }}" alt="screenshot">
</a>

Adding color requires editing the PS1 environment variable in BASH. BASH is the command interpreter
used by OSX Terminal, and PS1 is the variable that represents the command prompt displayed to the
user.

Lets do it:

Open up a Terminal window `Applications -> Utilities -> Terminal`
type `cd ~` and press enter to enter your home directory (Should be there already anyway).
Start your favourite text editor and create a file named `.profile`. I like Vim.

	vim .profile

Enter the following:

	PS1="\[\033[01;32m\]\u@\h\[\033[01;34m\] \w \$\[\033[00m\]"
	alias ls="ls -G"
	export GREP_OPTIONS="--color"

The article Color Bash Prompt explains this funky funky syntax more in depth.

Save the file. From Vim press Esc -> `:` -> `wq` -> Enter/Return

Now close your Terminal windows with Cmd+W and open a new one with Cmd+N. You should now have a
visually pleasing, colorful Terminal

Here are some tips for other common terminal apps:

Git:

	git config --global color.branch auto
	git config --global color.status auto
	git config --global color.ui auto
	git config --global color.diff auto

ViM:

Edit or create the file `~/.vimrc` and add the following:

	syntax on
	colorscheme default

You may of course substitute default with your desired color scheme name.
