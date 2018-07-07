---
layout: post
title:  "Restart services in docker-compose"
---

The following shell function allows you to quickly restart one or more services
in a running `docker-compose` service composition.

```shell
# restart services in docker-compose
docker-compose-restart(){
	docker-compose stop $@
	docker-compose rm -f -v $@
	docker-compose create --force-recreate $@
	docker-compose start $@
}
```

Once loaded into your shell, you can call it with:

	$ docker-compose-restart [SERVICE...]


I often have this requirement when using `docker-compose` for development. If
a Docker image is updated, it's inconvenient to restart all of the containers
managed by compose.

This function will:

* stop the services
* remove the associated containers and any anonymous volumes attached to them
* recreate the containers from updated images
* start the services again

Any services not specified are left unchanged.

## Installation

1. Copy the function into your shell profile script (For BASH, this is
`~/.profile`).
2. Restart your shell by logging out and in again

## Example

The following `docker-compose.yml` file defines two services: `web` and `db`:

```yaml
---
version: '2'
services:
  web:
    image: nginx
    links:
    - mongo
  db:
    image: mongo

```

Suppose these services are running via `docker-compose up`, but you have made
changes to the `nginx` image which is used to run the `web` service. These
changes are not apparent in the running containers.

Restart the `web` service as follows for your changes to be available:

	$ docker-compose-restart web

