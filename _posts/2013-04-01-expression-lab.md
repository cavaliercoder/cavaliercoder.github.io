---
layout:    post
title:     "Expression Lab"
date:      2013-04-01 12:00:00
permalink: /expression-lab
---

Expression Lab is a lightweight Windows application based on the .Net Framework 4.0 that allows you
to test regular expression (.Net flavour) patterns with real time results displayed on your target
data.

* Download from [SourceForge](https://sourceforge.net/projects/expression-lab/files/latest/download)

* Clone from [GitHub](https://github.com/cavaliercoder/expression-lab)

Regular Expressions, or 'Regex/Regexp' are patterns used to match text data as desired. Expression
Lab allows you to enter your targeted data (Eg. a CSV or XML file, a product list or programming
code) and develop a search pattern to describe the subset of information you require with real time
results shown as colored highlights over your target data. Each match also details its index in the
collection of match results to help you find the same results in your .Net code.

For more information about Regex see the following links:

* Regular Expressions (MSDN) http://msdn.microsoft.com/en-au/library/az24scfc.aspx
* Regular Expressions on Wikipedia http://en.wikipedia.org/wiki/Regular_expression
* RegularExpressions.info http://www.regular-expressions.info/

## Screen Shots

ExpressionLab_S01

## Features

* Real-time results with lightning fast UI
* Highlight results by Match, by sub groups (parenthesized patterns) or custom groups.
* Full list view of all matches and groups with index numbers
* Flexible Regex options (Multiline, IgnoreCase, etc)
* Filter out the results to show only matched or unmatched data
* Pause and resume processing to facilitate changes with a large computational load
* Save your project for later reference
* Smart error handling to identify problems without stepping through your code

## Features in Development

* Color coding in the pattern editor
* Multiple patterns and input data per project
* Color schemes
* Release targetting .Net Framework 2.0