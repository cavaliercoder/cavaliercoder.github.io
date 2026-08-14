all: build

build:
	hugo --minify

clean:
	rm -rf public/ resources/

run:
	hugo server --buildDrafts --disableFastRender

get-deps:
	brew install hugo

s3-pull:
	mkdir ./s3/ || :
	aws s3 sync s3://s3.cavaliercoder.com/blog/ ./s3/

s3-push:
	aws s3 sync ./s3/ s3://s3.cavaliercoder.com/blog/

.PHONY: all build clean run get-deps s3-pull s3-push
