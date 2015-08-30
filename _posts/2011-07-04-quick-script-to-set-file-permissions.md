---
layout: post
title:  "Quick Script to Set File Permissions"
date:   2011-07-04 12:00:00
---

When configuring a web server for the first time, balancing file permissions between locally
created, FTP uploaded and PHP created files can be difficult until everything is configured
correctly. The following script can help correct any issues and reset all files to a standard.

{% highlight bash %}
#!/bin/bash
TARGET_PATH=/var/www
NEW_USER=www-data
NEW_GROUP=www-data
 
if [ -n "$1" ]
then
        TARGET_PATH=$1
fi
 
for i in $(find ${TARGET_PATH} -type d)
do
        chown ${NEW_USER}:${NEW_GROUP} $i
        chmod 750 $i
done
 
for i in $(find ${TARGET_PATH} -type f)
do
        chown ${NEW_USER}:${NEW_GROUP} $i
        chmod 640 $i
done

{% endhighlight %}

Be sure to change `TARGET_PATH`, `NEW_USER` and `GROUP_USER` to your appropriate settings.
`TARGET_PATH` can also be modified when calling the script by including the path required as the
first parameter (Eg. `./setperms.sh /var/www`).

The permissions set in the script (640) are as follows:

__Owner:__ Read & Write

__Group:__ Read Only

__Others:__ Denied

Owner and Group are also allowed to `Execute` (i.e. browse) directories (750).
