---
layout: post
title:  "Quickly testing Zabbix actions"
---

When developing custom alert scripts or even just meaningful notifications in
Zabbix, it's important to test your changes frequently. This can be difficult
given that Zabbix does not currently offer any means to immediately fire a test
notification.

The purpose of this article is to describe how to quickly configure Zabbix so
that you can toggle a trigger on demand from the command line, which will in
turn create an event, call an action and most importantly, send an alert (A.K.A
notification or message).

## Create an item

* Name: _Test timestamp_

* Type: _Zabbix trapper_

* Key: _test.timestamp_

* Type of information: _Text_

* Enabled: checked


## Create a trigger

* Name: _Timestamp changed_

* Expression: `{Dummy triggers:test.timestamp.diff()}>0`

* Enable the _Multiple PROBLEM events generation_ checkbox

* Severity: _Disaster_


## Create a media type

## Create an action

## Toggle the trigger

To put the trigger into a `PROBLEM` state, simple submit a value for your test
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
