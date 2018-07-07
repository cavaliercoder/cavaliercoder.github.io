---
layout: post
title:  "Zabbix custom discovery check template"
date:   2014-06-09 12:00:00
---

Here’s a bootstrap C function for Zabbix Discovery rules.

I’m often writing custom discovery (and standard check) functions for the Windows Zabbix agent
instead of using external script. It is faster and more efficient than calling external scripts but
also some challenges have been too difficult without native API access (e.g. finding the GUID of a
GPT disk).

With each new function I’ve been referencing old samples for the basic conventions of Zabbix item
function so I’ve taken the time to write a template and I hope it will be of benefit to you also.

If you’re creating a new C file for your function, make sure to include it in
`build/win32/project/Makefile_agent.inc` or the appropriate files.

{% highlight c %}

#include "common.h"
#include "sysinfo.h"
#include "log.h"
#include "zbxjson.h"
 
/*
 * Custom key custom.discovery
 *
 * Replace this section with the details of your custom item check.
 * 
 * Use this function as a template for custom item checks.
 * The `zbx_json_*` functions are only required for Discovery rules.
 *
 * Be sure to change all function name, parameter and output
 * field names as required.
 *
 * Your function name should be declared in `include/sysinfo.h` after line 201.
 *
 * Your item check key needs to be declared added to `parameters_specific[]` in
 * `src/libs/zbxsysinfo/win32.h` (for Windows) or equivelent.
 * 
 * Returns:
 * {
 *        "data":[
 *                {
 *                        "{#MACRO}":"Some value"]}]}
 */
int    CUSTOM_ITEM(AGENT_REQUEST *request, AGENT_RESULT *result)
{
    int        ret = SYSINFO_RET_FAIL;            // Request result code
    const char    *__function_name = "CUSTOM_ITEM";    // Function name for log file
    char    *param;                    // Request parameter
     
    struct    zbx_json j;                // JSON response for discovery rule
     
    zabbix_log(LOG_LEVEL_DEBUG, "In %s()", __function_name);
     
    /*
     * Parse agent request
     */
    // Validate parameter count
    if (2 != request->nparam)
    goto clean;
     
    // Get and validate first parameter
    param = get_rparam(request, 0);
    if(NULL == param || '\0' == *param)
    goto clean;
     
    // Create JSON array of discovered objects
    zbx_json_init(&j, ZBX_JSON_STAT_BUF_LEN);
    zbx_json_addarray(&j, ZBX_PROTO_TAG_DATA);
     
    /*
     * DO THINGS
     * Add JSON object and properties for each discovered asset
     */
    zbx_json_addobject(&j, NULL);
    zbx_json_addstring(&j, "{#MACRO}", "Some value", ZBX_JSON_TYPE_STRING);
    zbx_json_close(&j);
 
    // Finalize JSON response
    zbx_json_close(&j);
    SET_STR_RESULT(result, strdup(j.buffer));
    zbx_json_free(&j);
     
    // Success?
    ret = SYSINFO_RET_OK;
     
clean:
    /*
     * Free allocated memory and handles
     */
     
    zabbix_log(LOG_LEVEL_DEBUG, "End of %s()", __function_name);
    return ret;
}

{% endhighlight %}
