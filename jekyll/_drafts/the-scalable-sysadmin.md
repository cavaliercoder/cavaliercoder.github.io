---
layout: post
title:  "The Scalable SysAdmin"
---

How scalable are you as a SysAdmin/IT Pro? If your business started dumping
hundreds or even thousands of new services (composed of applications, servers,
databases, etc.) solely on you (and/or your team's) shoulders, how well would
adapt to these new conditions? What would be your theoretical limit? What is
your _service density_?

Measuring the value of a person, team or business is complicated, but in IT
departments, value is often measured as a function of FTEs (Full-Time Employees)
per service (or service catalog item, server instance, etc.).

The intention of this post is to encourage you to scale up your _service
density_, and therefore _value_, with a new __way of thinking__. 

So why should you care about your scalability?

## Grow or die!

The guys who built houses with hammer and nail and didn't scale up to match the
guys with power tools and machinery are no longer building houses.

There's a few factors to consider:

* If a business does not grow it dies. Without growth, it can't promote staff,
  it can't overcome inflation, can't respond to change, etc. For a business to
  grow in today's landscape of tough competition, tight margins and fluctuating
  demand, it needs increased value from its staff (i.e. better service density
  per FTE).

* Your customers want continually improving value for money. This means lower
  cost but higher quality services. Demand for applications and services is also
  accelerating.

* The competition are accelerating value-for-money by transitioning services
  from novelty, to stability, to commodity and finally to utility. Services that
  were well established commodities required bespoke deployment and costly management. Now
  the competition are offering the same services in a pay-as-you-go, opt-in/opt-
  out, low-barrier-to-entry, one-click, low cost utility.

* Invention takes on unpredictable forms. Some might have once argued that _the
  telephone will never succeed because people only want to talk face-to-face_.
  You could never have anticipated the invention of fax machines, home alarm systems
  or the Internet. I've heard the argument _the cloud won't succeed because
  people want to host their own servers_. Could you have anticipated
  Platform-As-A-Service offerings? Object storage? Elastic scalability?
  [Pay-per-function-call](http://highscalability.com/blog/2015/12/7/the-
  serverless-start-up-down-with-servers.html) applications? Who knows what will
  come next?

IT operations *is* change. That's your whole job. If you can't scale up to
deliver consistently increasing value, they'll find someone who will.

<img src="{{ "/assets/2015-12-17-the-scalable-sysadmin/this-is-fine-meme-500x272c.jpg" | prepend: site.baseurl }}" alt="This is fine.">


## Limiting factors

There are plenty of challenges to increasing your service density. These might
include interruptions and outages, slow processes and hand-offs, repetitive
tasks, availability of information, training, etc. These challenges will change
shape and form over time, so let's not bother trying to solve these here.

Let's attack the three factors, or arguably, the laws of physics, that will
always act against you. These are _capacity_, _diversity_ and _entropy_.

### Capacity

No matter what you do, you will never work 25 hours in a day. You will never be
in two places at the same time. You will never survive without toilet breaks.
There are fixed limits to your capacity and vertical scalability.

So how can you better leverage the time you _do_ have to scale up? Consider:

* reduce the time it takes to complete your tasks
* increase the number of tasks you can complete in parallel
* improve the quality of your work to reduce re-work
* improve the order in which you execute tasks
* eliminate unnecessary tasks

Melissa likes to write books. Traditionally she starts at page 1, and works her
way through with a pen on paper, to the final page. She then has to spell check,
refactor some paragraphs, fix plot holes; each with a new, time consuming pass
of pen on paper. Melissa hates computers and thinks that to capture the feel, it
has to be a tactile experience. Once upon a time, this was what every author
did.

Eventually she invests some energy in learning new ideas and technology. She now
plans the plot out in advance. She now writes faster by dictating to a
speech-to-text program which gets the spelling correct on the first pass. Once
in a word processor, refactoring is simply copy and paste; not a new pass. She
uses search-and-replace to remove words she overused.

Writing is faster (fit more in a day), she can multi-task (get dressed for work
while writing), the quality is higher (less rework) and the need to spell check
or manually search for content is eliminated.

What ideas or technology can you leverage to increase your capacity to design
solutions, deploy applications, QA configuration changes, resolve incidents,
write documentation, etc.?


### Diversity

No matter what you do, you can never reduce the diversity of customer needs to a
single use case. They will always require discrete, unique solutions to numerous
business needs. Worse still, these requirements will change over time.

The answer here, is too become adaptable to change and as technology agnostic as
possible. Tools, practices and solution designs which enable this will share
common attributes:

* they offer a common workflow to manage discrete platforms (OS, device type,
  code language, etc.)
* they can be easily tweaked and reused to overcome new challenges faster
* they are easily extended upon and simple to integrate with other systems
* they are portable and travel with you - they work on your laptop when you're
  offline and in large scale live production deployments

### Entropy

No matter what you do, everything you build will erode over time. Your systems
will always trend towards greater complexity and your mitigations will always
trend towards lesser efficacy. Configuration will drift, processes will
fluctuate, documentation will deprecate.


## How to think

Attack the three limiting factors. When you consider different ideas, practices,
tool sets, learning opportunities, skill sets, focuses, tech stacks, etc. Ask
yourself three things:

* Will this increase or decrease my __capacity__?

* Will this improve or hinder my adaptability to __diversity__ and change?

* Will this impede or accelerate __entropy__ in myself and my services?


## TODO:
* Deliver above the line (expense)
* We will always need "Click-next" juniors
* click next batch automation

You then need to exercise caution in balancing the three and prioritizing
opportunities for improvement.
