all: build

build:
	jekyll build

clean:
	rm -rf _site/ .sass-cache/

run:
	jekyll serve \
		--config=_config.yml,_config_dev.yml \
		--baseurl="" \
		--drafts

get-deps:
	gem install jekyll bundler

s3-pull:
	mkdir ./s3/ || :
	aws s3 sync s3://s3.cavaliercoder.com/blog/ ./s3/

s3-push:
	aws s3 sync ./s3/ s3://s3.cavaliercoder.com/blog/

.PHONY: all build clean run
