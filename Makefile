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

.PHONY: all build clean run
