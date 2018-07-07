---
layout: post
title:  "Testing Zabbix actions"
---

When developing custom alert scripts or even just meaningful notifications in
Zabbix, it's important to test your changes frequently. This can be difficult
given that Zabbix does not currently offer any means to immediately fire a test
notification.

The purpose of this article is to describe how to configure Zabbix in 5 to 10
minutes so that you can toggle a trigger on demand from the command line, which
will in turn create an event, call an action and then most importantly, send an
alert (A.K.A notification or message) to enable testing with faster feedback.

To achieve this, the following steps detail how to create a dummy text item and
a trigger which will fire every time the value of the dummy items changes.
Instruction is also provided for creating the required media types and actions,
and finally, triggering a notification on demand using `zabbix_sender`.

## Create an item

First create a dummy item. Navigate to the desired host or template (a
pre-canned template is included [below](#template)) and select _Items_ > _Create
Item_.

The _Zabbix trapper_ item type enables an agent (or in our case `zabbix_sender`)
to submit an item value to the Zabbix server at any time; without waiting for
polling intervals or active check batch sends. We'll use a simple Text value
type for storing an arbitrary timestamp as follows:

* _Name_: Test timestamp
* _Type_: Zabbix trapper
* _Key_: test.timestamp
* _Type of information_: Text
* _Enabled_: checked
* Click _Add_ to save

<a class="lightbox" href="{{ "/assets/2015-10-06-testing-zabbix-actions/add-item.png" | prepend: site.baseurl }}">
    <img class="osx-window" src="{{ "/assets/2015-10-06-testing-zabbix-actions/add-item.png" | prepend: site.baseurl }}" alt="Add an item">
</a>

## Create a trigger

Next create a trigger which will fire each time the value of the timestamp item
changes. On your host or template, navigate to _Triggers_ > _Create trigger_.

Use the `diff()` trigger function to identify a change in value. Also, ensure
_Multiple PROBLEM events generation_ is checked to ensure an event (and
subsequent notification) is created every time the item value changes; not just
the first time.

* _Name_: Timestamp changed
* _Expression_: `{[host/template]:test.timestamp.diff()}>0` (replace
  host/template)
* _Multiple PROBLEM events generation_: checked
* _Severity_: Any (except _Not classified_)
* Click _Add_ to save

<a class="lightbox" href="{{ "/assets/2015-10-06-testing-zabbix-actions/add-trigger.png" | prepend: site.baseurl }}">
    <img class="osx-window" src="{{ "/assets/2015-10-06-testing-zabbix-actions/add-trigger.png" | prepend: site.baseurl }}" alt="Add an item">
</a>

## Create a media type

If you intend to call a custom alert script when your trigger changes state,
first define a new media type (under _Administration_ > _Media types_ > _Create
media type_) with the name of your script as follows:

* _Type_: Script
* _Script name_: [Filename of your script]
* _Enabled_: checked
* Click _Add_ to save

<a class="lightbox" href="{{ "/assets/2015-10-06-testing-zabbix-actions/add-media-type.png" | prepend: site.baseurl }}">
    <img class="osx-window" src="{{ "/assets/2015-10-06-testing-zabbix-actions/add-media-type.png" | prepend: site.baseurl }}" alt="Add an item">
</a>

Zabbix also requires at least one user to "send" to using your new media type so
define contact media as follows (from _Administration_ > _Users_ > [User] >
_Media_ > _Add_):

* _Type_: [Media type defined above]
* _Send to_: [Recipient passed to script]
* Click _Add_ to save the media
* Click _Update_ to save the user

<a class="lightbox" href="{{ "/assets/2015-10-06-testing-zabbix-actions/add-media.png" | prepend: site.baseurl }}">
    <img class="osx-window" src="{{ "/assets/2015-10-06-testing-zabbix-actions/add-media.png" | prepend: site.baseurl }}" alt="Add an item">
</a>

## Create an action

Navigate to _Configuration_ > _Actions_ > _Create action_ and enter a desirable
name, default subject and message for your action. Select the _Conditions_ tab
and add a new condition with:

* _New condition_: `Trigger = [dummy trigger]`
* Click _Add_ to save the condition

<a class="lightbox" href="{{ "/assets/2015-10-06-testing-zabbix-actions/add-action-conditions.png" | prepend: site.baseurl }}">
    <img class="osx-window" src="{{ "/assets/2015-10-06-testing-zabbix-actions/add-action-conditions.png" | prepend: site.baseurl }}" alt="Add an item">
</a>

Select the _Operations_ tab and add a new operation as follows:

* _Send to Users_: [user with custom media type]
* _Send only to_: [custom media type]
* Click _Add_ to save to the operation

<a class="lightbox" href="{{ "/assets/2015-10-06-testing-zabbix-actions/add-action-operation.png" | prepend: site.baseurl }}">
    <img class="osx-window" src="{{ "/assets/2015-10-06-testing-zabbix-actions/add-action-operation.png" | prepend: site.baseurl }}" alt="Add an item">
</a>

Finally, click _Add_ to save the action.

## Toggle the trigger

To put the trigger into a `PROBLEM` state, simply submit a value for your test
item using `zabbix_sender` that is different to the previous value. The simplest
way to generate a new value on each command line call is to embed a timestamp
using `$(date --rfc-3339=ns)`. Send a new value to the Zabbix server with the
following (taking care to replace all argument values with the correct values
for your environment):

	$ VALUE="$(date --rfc-3339=ns)"; zabbix_sender \
	  	--zabbix-server=127.0.0.1 \
	  	--host="Zabbix server" \
	  	--key="test.timestamp" \
	  	--value="${VALUE}"

To put the trigger back into an `OK` state (and cause a 'Recovery message' to be
sent), simply resubmit the same item value by running the `zabbix_sender`
command again without making a change to the `VALUE` environment variable:

	$ zabbix_sender \
	  	--zabbix-server=127.0.0.1 \
	  	--host="Zabbix server" \
	  	--key="test.timestamp" \
	  	--value="${VALUE}"

## Template

The following XML document is a Zabbix v2.2+ template which contains the Items
and Triggers described in this article.

For more information concerning Zabbix configuration import and export see the
[Zabbix documentation](https://www.zabbix.com/documentation/2.2/manual/xml_export_import).


{% highlight xml %}
<?xml version="1.0" encoding="UTF-8"?>
<zabbix_export>
    <version>2.0</version>
    <date>2015-10-01T06:36:53Z</date>
    <groups>
        <group>
            <name>Templates</name>
        </group>
    </groups>
    <templates>
        <template>
            <template>Dummy triggers</template>
            <name>Dummy triggers</name>
            <description/>
            <groups>
                <group>
                    <name>Templates</name>
                </group>
            </groups>
            <applications>
                <application>
                    <name>Testing</name>
                </application>
            </applications>
            <items>
                <item>
                    <name>Test timestamp</name>
                    <type>2</type>
                    <snmp_community/>
                    <multiplier>0</multiplier>
                    <snmp_oid/>
                    <key>test.timestamp</key>
                    <delay>0</delay>
                    <history>90</history>
                    <trends>365</trends>
                    <status>0</status>
                    <value_type>4</value_type>
                    <allowed_hosts/>
                    <units/>
                    <delta>0</delta>
                    <snmpv3_contextname/>
                    <snmpv3_securityname/>
                    <snmpv3_securitylevel>0</snmpv3_securitylevel>
                    <snmpv3_authprotocol>0</snmpv3_authprotocol>
                    <snmpv3_authpassphrase/>
                    <snmpv3_privprotocol>0</snmpv3_privprotocol>
                    <snmpv3_privpassphrase/>
                    <formula>1</formula>
                    <delay_flex/>
                    <params/>
                    <ipmi_sensor/>
                    <data_type>0</data_type>
                    <authtype>0</authtype>
                    <username/>
                    <password/>
                    <publickey/>
                    <privatekey/>
                    <port/>
                    <description/>
                    <inventory_link>0</inventory_link>
                    <applications>
                        <application>
                            <name>Testing</name>
                        </application>
                    </applications>
                    <valuemap/>
                    <logtimefmt/>
                </item>
            </items>
            <discovery_rules/>
            <macros/>
            <templates/>
            <screens/>
        </template>
    </templates>
    <triggers>
        <trigger>
            <expression>{Dummy triggers:test.timestamp.diff()}&gt;0</expression>
            <name>Timestamp changed</name>
            <url/>
            <status>0</status>
            <priority>5</priority>
            <description/>
            <type>1</type>
            <dependencies/>
        </trigger>
    </triggers>
</zabbix_export>
{% endhighlight %}
