---
layout: post
title:  "Inline vs. discrete rules for AWS Security Groups in Terraform"
image:  /2017-07-15-inline-vs-discrete-security-groups-in-terraform/terraform.png
---

There are two ways to configure AWS Security Groups in Terraform. You may define
rules *inline* with a `aws_security_group` resource or you may define additional
discrete `aws_security_group_rule` resources.

My first instinct was to define a "base" Security Group using inline rules and
then extend on it using external rules. Bad idea. More on that later.

For the two valid options though, there are important implications and I found
these were not clear at the time of writing (circa Terraform v0.9.11). After a
little research and experimentation I have a much clearer understanding and hope
to save you all the bother.

This article focuses on managing AWS Security Groups in Terraform but you will
find that all of the principals explored here apply equally to Network ACLs and
Route Tables - both of which allow inline or external rule management.

## Two approaches

Here's how an _inline_ Security Group definition looks:

```hcl
resource "aws_security_group" "allow_all" {
  name        = "allow_all"
  description = "Allow all inbound traffic"

  ingress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}
```

Above there are two rules, an `ingress` and `egress` rule defined inside or
_inline_ with the `aws_security_group` resource block.

Here's how the same idea can be expressed using external rules via the
`aws_security_group_rule` resource:

```hcl
resource "aws_security_group" "allow_all" {
  name        = "allow_all"
  description = "Allow all inbound traffic"
}

resource "aws_security_group_rule" "ingress" {
  type        = "ingress"
  from_port   = 0
  to_port     = 0
  protocol    = -1
  cidr_blocks = ["0.0.0.0/0"]

  security_group_id = "${aws_security_group.allow_all.id}"
}

resource "aws_security_group_rule" "egress" {
  type        = "egress"
  from_port   = 0
  to_port     = 0
  protocol    = -1
  cidr_blocks = ["0.0.0.0/0"]

  security_group_id = "${aws_security_group.allow_all.id}"
}
```

The Security Group and each of its rules are defined as discrete resources,
intimately linked together in loving union by the `security_group_id` attribute.

A reasonable person might posit that the outcome of both configurations would
be the same, but they are different in subtle ways - ways that might hurt a bit
if not clearly understood.

## Option 1: External rules

I had hoped that external rules would function similar to Puppet's `concat`
module - gathering partial resources defined anywhere in the graph and then
enforcing the sum state. The reality however, which does make sense, is that the
desired state is managed non-destructively.

You can test this, by manually adding a rule to the Security Group created by
the Terraform code above (the snippet with only external rules). If you run
`terraform apply`, it will ignore this manually created rule.

What this means, is that you can add and enforce rules on a Security Group that
was created elsewhere. Just be cautious of conflicts with existing rules,
precedence and collisions in your rule numbers.

### Pros

* Rules can be added non-destructively to unmanaged Security Groups. This might
  be useful for Security Groups associated with shared services, such as a
  Bastion host. Terraform configurations from all over the kingdom can create
  rules on a common Security Group to enable the access they require.

  Ideally, one would create and associate distinct, well-tagged Security Groups
  for each use-case but we are limited to only [five Security Groups per network
  interface](http://docs.aws.amazon.com/AmazonVPC/latest/UserGuide/VPC_Appendix_Limits.html#vpc-limits-security-groups).

* Security Groups can be "modularized" and extended upon. You might write a
  Terraform module that creates a Security Group with standardized naming,
  tagging, lifecycle and maybe even some base access rules. Additional rules
  could then be added to the Security Group returned by the module using
  `aws_security_group_rule` resources.

### Cons

* Security Group rules that are added by accident or by nefarious means will not
  be nuked by Terraform. It won't even report that they exist.

* Infrastructure code should succinctly describe and quasi-document your actual
  infrastructure. Defining rules for a single Security Group in disparate files
  in your code-base makes it difficult to see at a glance what the state of a
  Security group should be.

* It's difficult to know or manage for how externally created rules will
  effect the rules you are configuring in Terraform. This is particularly
  important for Network ACLs, where a rule defined elsewhere could have higher
  precedence than yours and might explicitly deny a port you intend to open.

## Option 2: Inline rules

When rules are defined inline, a Security Group is managed destructively. That
is, any rule not defined inline, including rules defined elsewhere in Terraform
and rules added manually or via other tools, will be unapologetically destroyed
whenever Terraform next runs.

### Pros

* Security Groups are for security. They need to be clear, understood and well
  configured. Using inline rules means your resource definition is complete,
  definitive and deterministically provisioned. You can have confidence that
  there are no rules being described elsewhere in the code-base or added outside
  of Terraform. If there are, they get destroyed.

### Cons

* There's no way to share code between inline-style Security Groups. This might
  mean lots of repetition  for Security Groups that are _mostly_ the same;
  having a common set of rules with minor exceptions between them. Make use of
  the five available Security Group slots per network interface to allow re-use
  of shared base Security Groups - though this is difficult if you're using
  least-privilege, point-to-point access rules.

* You can't use the `count` meta-parameter to described rules in a loop.

  It works with external rules:

  ```hcl
  variable "http_ports" {
    default = ["80", "443", "8080", "8443"]
  }

  resource "aws_security_group_rule" "ingress_http" {
    count = "${length(var.http_ports)}"

    type        = "ingress"
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    from_port   = "${element(var.http_ports, count.index)}"
    to_port     = "${element(var.http_ports, count.index)}"

    security_group_id = "${aws_security_group.allow_all.id}"
  }
  ```

  ... but not with inline rules:

  ```hcl
  variable "http_ports" {
    default = ["80", "443", "8080", "8443"]
  }

  resource "aws_security_group" "allow_all" {
    name        = "allow_all"
    description = "Allow all inbound traffic"

    ingress {
      count = "${length(var.http_ports)}"

      protocol    = "tcp"
      cidr_blocks = ["0.0.0.0/0"]
      from_port   = "${element(var.http_ports, count.index)}"
      to_port     = "${element(var.http_ports, count.index)}"
    }
  }

  # 1 error(s) occurred:
  #
  # * aws_security_group.allow_all: ingress.0: invalid or unknown key: count
  #
  ```

  You're going to need to code up an inline rule for each port.

## Why not both?

My naive first approach was to blend both approaches. I hoped to create a
configurable `aws_security_group` "module" that contained some mandatory rules,
like allowing ingress SSH, monitoring, etc. This module could then be extended
with additional rules using `aws_security_group_rules` resources. A kinda
pseudo-OOP-abstract-class approach.

Fortunately, the [Terraform documentation](https://www.terraform.io/docs/providers/aws/r/security_group.html)
contained a well-lit warning sign:

> At this time you cannot use a Security Group with in-line rules in conjunction
with any Security Group Rule resources. Doing so will cause a conflict of rule
settings and will overwrite rules.

What happens when you combine both methods? Here's a cool high-school science
lab experiment for you!

The following Terraform code defines both inline rules, and an external
`ingress_http` rule.

```hcl
resource "aws_security_group" "allow_all" {
  name        = "allow_all"
  description = "Allow all inbound traffic"

  ingress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_security_group_rule" "ingress_http" {
  type        = "ingress"
  from_port   = 80
  to_port     = 80
  protocol    = 6
  cidr_blocks = ["0.0.0.0/0"]

  security_group_id = "${aws_security_group.allow_all.id}"
}
```

### Instructions

1. Apply this code with `terraform apply` - it should create the `ingress_http`
   rule

2. Apply the same code again with `terraform apply` - it should remove the newly
   created `ingress_http` rule

3. Go to step 1

Terraform will create and then destroy the external rule on each alternating
invocation - like that scene with Dormammu in Marvel's Dr Strange.

Bug? No. It actually kinda makes sense. Jake Champlin from HashiCorp explains it
on a [related GitHub issue](https://github.com/hashicorp/terraform/issues/11011#issuecomment-283076580).

## Summary

I've come to prefer using inline rules where possible. It means our Security
Groups match the code and phantom 'allow all' rules can't be introduced that
would break our security model and the integrity of our tests.

It does mean we have to duplicate some rules in a few Security Groups, and keep
these definitions in sync, but I share the opinion that [a little copying is
better than a little dependency](https://www.youtube.com/watch?v=PAAkCSZUG1c&t=9m28s).

For more information about AWS Security Groups in Terraform, please see:

* [AWS: Security Groups for your VPC](http://docs.aws.amazon.com/AmazonVPC/latest/UserGuide/VPC_SecurityGroups.html)

* [Terraform: aws_security_group](https://www.terraform.io/docs/providers/aws/r/security_group.html)

* [Terraform: aws_security_group_rule](https://www.terraform.io/docs/providers/aws/r/security_group_rule.html)
