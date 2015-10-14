all: build

build:
	jekyll build

run:
	jekyll serve --baseurl="" --drafts

.PHONY: all build run
