## cavaliercoder.github.io

You have found the sources for https://cavaliercoder.com (a.k.a
https://cavaliercoder.github.io).

Made with the indelible [Hugo](https://gohugo.io/) static site generator.

Any Hugo build will do. The stylesheet is plain CSS — Pico ships compiled and
the overrides need no preprocessing — so the *extended* edition is not required,
though it does no harm and is what CI installs.

    make get-deps   # brew install hugo
    make run        # serve locally, including drafts
    make build      # render the site into ./public

Pushing to `master` builds and publishes the site via
[.github/workflows/hugo.yml](.github/workflows/hugo.yml).

Traffic is measured by Cloudflare Web Analytics. The beacon is emitted only by
production builds, so `make run` never reports; see
[layouts/_partials/analytics.html](layouts/_partials/analytics.html).
