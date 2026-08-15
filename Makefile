all: build

build:
	hugo --minify

clean:
	rm -rf public/ resources/

run: check-assets
	hugo server --buildDrafts --disableFastRender

# In development the cdn shortcode resolves to ./s3 rather than the live CDN,
# so an unpopulated mirror serves every post with broken images.
check-assets:
	@if [ -z "$$(find ./s3 -type f ! -name .gitkeep 2>/dev/null)" ]; then \
		echo "warning: ./s3 holds no assets - images will 404. Run 'make s3-pull' first."; \
	fi

get-deps:
	brew install hugo

s3-pull:
	mkdir ./s3/ || :
	aws s3 sync s3://s3.cavaliercoder.com/blog/ ./s3/

s3-push:
	aws s3 sync ./s3/ s3://s3.cavaliercoder.com/blog/

.PHONY: all build clean run check-assets get-deps s3-pull s3-push
