---
layout: post
title:  "VBScript for Nested Group Memberships"
date:   2012-06-18 12:00:00
---

Often VBScripts will be required to determine if a given user (or object) is a member of a given AD / LDAP group. For example this is useful for determining which network drives a user should mount during logon, based on their group memberships. A common issue with most script samples is that they will not account for nested group memberships.

As an example, you may have an AD group named ‘Res-Share-Public’ which is designated to grant access to your public share. The group may only contain other groups, such as departments or business groups which in turn contain the end users.

The following VBScript function will return true when testing a grandchild user account against the grandparent group, ‘Res-Share-Public':

{% highlight vb.net %}
Function IsMember(strUserDN, strGroupDN)
    Set objGroup = GetObject(strGroupDN)
    For Each objMember in objGroup.Members
        If (LCase(objMember.Class) = "group") Then
            If (IsMember(strUserDN, objMember.AdsPath)) Then
                IsMember = True
                Exit Function
            End If
        Else
            If (objMember.distinguishedName = strUserDN) Then
                IsMember = true
                Exit Function
            End If
        End If
    Next
    Set objGroup = Nothing
    IsMember = False
End Function
{% endhighlight %}

The strUserDN and strGroupDN parameters must be the full Distinguished Name of the objects prefixed with “LDAP://” (ie. ADS Path format) to work correctly.

The function will return true if the User is a direct or nested child (grandchild, great-grandchild, etc) of the specified Group.

This sample is free for you to use with attribution greatly appreciated. As always, your feedback is welcomed.
