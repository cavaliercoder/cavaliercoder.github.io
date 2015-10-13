---
layout: post
title:  "Update /etc/hosts for docker-machine"
---

If you're running docker-machine or boot2docker on OS X, chances are you want
the Docker client environment variables set automatically when you log in to the
terminal. There's plenty of help [out
there](https://docs.docker.com/machine/reference/env/) to achieve this, but the
basic gist is to add the following to your `~/.profile`:

{% highlight bash %}
# for a docker-machine instance named 'default'
eval "$(docker-machine env default)"

# or for the deprecated boot2docker
eval "$(boot2docker shellinit)"
{% endhighlight %}

This will set the `DOCKER_HOST` environment variable which isn't actually much
use outside of the Docker client as it includes the `tcp://` prefix and port
suffix. If you want to access your Docker containers from a web browser or other
clients, it's more convenient to use a DNS name.

Once the above code is included in your `~/.profile` to set `DOCKER_HOST`, you
can add a few extra lines to update your `/etc/hosts` file automatically each
time you log in to the terminal.

The following example creates a DNS entry named `docker.local` which will
resolve to your docker-machine IP:

{% highlight bash %}
# clear existing docker.local entry from /etc/hosts
sudo sed -i '' '/[[:space:]]docker\.local$/d' /etc/hosts

# get ip of running machine
DOCKER_IP="$(echo ${DOCKER_HOST} | grep -oE '[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}')"

# update /etc/hosts with docker machine ip
[[ -n $DOCKER_IP ]] && sudo /bin/bash -c "echo \"${DOCKER_IP}	docker.local\" >> /etc/hosts"
{% endhighlight %}

Check it out! You can now ping the host using the DNS hostname:

{% highlight text %}
$ ping -c 3 docker
PING docker.local (192.168.99.100): 56 data bytes
64 bytes from 192.168.99.100: icmp_seq=0 ttl=64 time=0.436 ms
64 bytes from 192.168.99.100: icmp_seq=1 ttl=64 time=0.488 ms
64 bytes from 192.168.99.100: icmp_seq=2 ttl=64 time=0.459 ms

--- docker.local ping statistics ---
3 packets transmitted, 3 packets received, 0.0% packet loss
round-trip min/avg/max/stddev = 0.436/0.461/0.488/0.021 ms
{% endhighlight %}

If it hasn't worked, check docker-machine interactively to ensure the host is
running correctly:

	$ docker-machine env default

## Bonus credit

If you use more than one docker-machine, you might like to assign a DNS name for
each one. This example assigns a name for each machine in the `.docker.internal`
namespace (e.g. `default.docker.internal`).

Add the following to your `~/.profile`:

{% highlight bash %}
# clear existing *.docker.local entries from /etc/hosts
sudo sed -i '' '/\.docker\.local$/d' /etc/hosts

# iterate over each machine
docker-machine ls | tail -n +2 | awk '{print $1}' \
| while read -r MACHINE; do
	DOCKER_IP="$(docker-machine env ${MACHINE} | grep DOCKER_HOST | grep -oE '[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}')"
	[[ -n $DOCKER_IP ]] && sudo /bin/bash -c "echo \"${DOCKER_IP}	${MACHINE}.docker.local\" >> /etc/hosts"
done
{% endhighlight %}

__Note__ that this operation might take a little longer and impact your logon,
depending on how many machines you are running. If this is a concern, you could
encapsulate the code in a function, so you can call it on demand, rather than at
logon.

{% highlight bash %}
update-docker-hosts(){
	# insert code snippet from above
}
{% endhighlight %}

Call this function on demand with:

	$ update-docker-hosts
