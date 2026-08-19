## cavaliercoder.github.io

You have found the sources for https://cavaliercoder.com (a.k.a
https://cavaliercoder.github.io).

Made with the indelible [Hugo](https://gohugo.io/) static site generator.

Any Hugo build will do. The stylesheet is plain CSS — Pico ships compiled and
the overrides need no preprocessing — so the *extended* edition is not required,
and CI installs the standard one. Extended does no harm locally, which is just
as well: it is what Homebrew gives you.

    make get-deps   # brew install hugo
    make run        # serve locally, including drafts
    make build      # render the site into ./public

Pushing to `master` builds and publishes the site via
[.github/workflows/hugo.yml](.github/workflows/hugo.yml).

Comments on posts are [GitHub Discussions](
https://github.com/cavaliercoder/cavaliercoder.github.io/discussions), rendered
by [giscus](https://giscus.app/). Threads are mapped to a post by its pathname
and kept in the *Announcements* category, so only a maintainer can open one by
hand. Two things must stay true on GitHub or posting silently fails: Discussions
enabled on the repository, and the giscus App installed on it. The four
identifiers in `hugo.toml` are public, not secrets; blanking any of them removes
the widget. Set `comments = false` in a post's front matter to omit it from that
post. See [layouts/_partials/comments.html](layouts/_partials/comments.html).

Traffic is measured by Cloudflare Web Analytics. The beacon is emitted only by
production builds, so `make run` never reports; see
[layouts/_partials/analytics.html](layouts/_partials/analytics.html).
