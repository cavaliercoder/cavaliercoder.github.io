---
layout: post
title:  "Finding the latest CentOS AMI"
image:  /2017-11-02-finding-the-latest-centos-ami/centos_fancy.png
---

Looking for the latest CentOS AMI image in your region? I'm frequently rewriting
the following code snippets, so thought I would capture them here for posterity.

Each snippet makes the following assumptions:

- You want an HVM, EBS backed, x86_64 image of the latest version of CentOS 7
- You have configured the desired region and credentials for the AWS SDK
- The Owner ID for the official CentOS organisation remains `679593333241`

### Bash / AWS CLI

```bash
aws ec2 describe-images \
  --owners 679593333241 \
  --filters \
      Name=name,Values='CentOS Linux 7 x86_64 HVM EBS*' \
      Name=architecture,Values=x86_64 \
      Name=root-device-type,Values=ebs \
  --query 'sort_by(Images, &Name)[-1].ImageId' \
  --output text
```

### Python / Boto3

```python
import json
import boto3

EC2 = boto3.client('ec2')
response = EC2.describe_images(
    Owners=['679593333241'], # CentOS
    Filters=[
      {'Name': 'name', 'Values': ['CentOS Linux 7 x86_64 HVM EBS *']},
      {'Name': 'architecture', 'Values': ['x86_64']},
      {'Name': 'root-device-type', 'Values': ['ebs']},
    ],
)

amis = sorted(response['Images'],
              key=lambda x: x['CreationDate'],
              reverse=True)
print amis[0]['ImageId']
```

### Terraform

```hcl
data "aws_ami" "centos" {
  owners      = ["679593333241"]
  most_recent = true

  filter {
    name   = "name"
    values = ["CentOS Linux 7 x86_64 HVM EBS *"]
  }

  filter {
    name   = "architecture"
    values = ["x86_64"]
  }

  filter {
    name   = "root-device-type"
    values = ["ebs"]
  }
}
```
