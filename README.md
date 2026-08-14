## cavaliercoder.github.io

You have found the sources for http://www.cavaliercoder.com (a.k.a http://cavaliercoder.github.io).

Made with the indelible [Hugo](https://gohugo.io/) static site generator.

Hugo's *extended* edition is required, for Sass support.

    make get-deps   # brew install hugo
    make run        # serve locally, including drafts
    make build      # render the site into ./public

Pushing to `master` builds and publishes the site via
[.github/workflows/hugo.yml](.github/workflows/hugo.yml).
