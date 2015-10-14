all: build

build:
	jekyll build

clean:
	rm -rf _site/ .sass-cache/

run:
	jekyll serve --baseurl="" --drafts

.PHONY: all build clean run
