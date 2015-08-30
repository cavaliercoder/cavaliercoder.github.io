---
layout: post
title:  "Getting comfortable with Git"
date:   2011-08-07 12:00:00
---

I've recently switched from using Subversion to Git for source version control (predominantly on Mac
OS X and Windows) and I am so far pretty pleased with the results. There is plenty of documentation
around that is quite in depth and technical, but in this article I am hoping to give you a good
beginners overview and workflow as well as highlight some of the advantages of Git over other source
control options.

Let me say from the get-go that Git is not as 'user friendly' or GUI driven as other source control
solutions but if you can follow this tutorial once or twice you will quickly find your groove and
most likely never turn back.

In case you are wondering 'What is source version control?', it is basically a system whereby you
can safely maintain each version of your source code when working on a project and branch your code
into multiple directions (ideas, versions, platforms, etc) maybe even with multiple developers,
without compromising the integrity and stability of your well developed code. It also allows for
mobility and redundancy by replicating your code base across multiple sites.

A quick glossary of terms before we continue:

## Repository
This is where all of your code is stored. This includes every commit, tag, branch, etc. In the case
of Git, this is stored in the hidden '.git' folder of your project's root.

## Working Copy
This refers to the code that are currently working on. You 'Check Out' code from the repository into
your working copy where you then make changes. You may choose to check out the latest version of the
code, or inspect a previous version. You may switch between branches, which would change the
contents of your working copy.

## Commit
When you have made changes to your source code, you may choose to 'commit' the changes to your
repository, effectively taking a snapshot of every line of code at that point in time. This means
you can roll your project back to this state at any time. It also means your changes will be made
available to anyone else who works with your repository.

## Branch
Whenever you want to make changes to your project that introduce a risk to the stability of your
code (ie. a new feature, bug fix, platform port, etc) you can create a new 'branch' of your code
development that allows you make changes and commit them, without effecting your 'master' branch.
You can switch between branches at any time, developing unique changes in each without interfering
with each other. If you decide to keep the changes made in your branch (ie. incorporate them into a
release version) you simply merge your new branch back into the master branch.

## Tag
You may perform several commits per session/day when working from a repository. When releasing code
the public, it important to 'tag' the state of your code when it was released so you can see how it
looked, line for line, at it's time of release. For example, if you released version 1.1 of your
application at commit #365, you might tag that commit as 'Release v1.1 Stable'. So quick round up of
my favorite features in Git over SVN:

Server-less operation. All you need is the client (available for most platforms here). You can run a
server if you like, although for personal use it just uses the file system. If you would like to
collaborate with others or replicate your code, you can do so over HTTP or SSH. Best of all, this
means you can host your Git repositories on your web host if you have shell access and the Git
client!! No need for a costly 3rd party code host. Fast. Yep, Git is fast. I do a lot of work in
large PHP applications such as Joomla and SugarCRM. Most operations are instantaneous. Small. When
changes are committed to the repository, only the lines of code which change are stored instead of
the entire file. The repository is also compressed. Since it is compressing text snippets, the
compressions ratio is very high. Small footprint. Subversion drives me mad with an instance of a
'.svn' folder inside every single sub-folder of my projects. These are a real nuisance when
uploading via FTP, packaging, deploying or backing up a project. Git creates a single hidden '.git'
folder in the root of your project where all repository data is stored. So instead of having to do
an SVN 'export' to clean out your code base, you can simply delete the '.git' folder and your
project is no longer managed. Decentralized. All versions of all branches can be replicated to every
instance of your code base (repository). ie. In SVN you have a central repository which maintains
all versions and branches, but locally you only have a single working copy. In Git, all versions and
branches are maintained and synchronized directly in your local '.git' folder meaning you can switch
branches and inspect and modify older versions without contacting a remote server! This also means
you can create nasty, non-compliant branches for quick ideas without having them published to other
coders in your project. You can also zip up your '.git' folder to transport your entire repository
via USB drive or email for example. You may be concerned that the replication could get messy being
so decentralized but let me assure you that the built in replication is super smart and the
following workflow alleviates any such concerns. Easy file ignoring. Git allows you to ignore files
and directories using file name patterns. Simply add each pattern (eg. '*.tmp') to a '.gitignore'
file in your working tree and the changes are applied to the current folder and it's sub-folders
unless they have their own .gitignore files. This way you can exclude temporary, cache and log files
from your repository along with working files from Eclipse, Aptana (.settings/), OS X (.DS_Store),
Windows (Thumbs.db), etc.
