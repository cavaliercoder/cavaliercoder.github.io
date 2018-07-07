---
layout: post
title:  "Interviewing at Facebook"
---

Similar: http://www.keypressure.com/blog/how-i-failed-a-google-sre-interview/

In March 2017 I had the privilege of interviewing for a Production Engineering
role, at Facebook's Headquarters in Menlo Park, CA. It was actually my second
attempt interviewing for the role, having tried exactly twelve months prior. In
total, I've completed two phone interviews and eleven on-site interviews.

Obviously, I won't be disclosing the questions that are asked, or any other
details that are not already publicly available. What I will share is what
preparations went well for me, what preparation was missing and some tips for
surviving a gruelling five rounds in the ring with some of the whole's best
engineers.

At times it might feel like I'm criticising the interview process or making
excuses for my own lack of success. Its important to remember however, that the
process _works_ for Facebook and that every one of their ~350 Production
Engineering staff were able to overcome it.

This article is really an open letter to myself. If I'm lucky enough to have a
third try, I'll be referring back to this article to help me prepare.


## The process

The interviews go like this... TODO

## Environmental variables

Before arriving on site for the first time, I imagined I would be interviewing
in a great big room with a floating whiteboard, lots of comfy, execute chairs,
beanbags, trendy murals on the wall and maybe a coffee machine and some muffins.

Instead, what I found in both rounds, was a small room with a single table and
two basic office chairs. No air conditioning or fans. The walls are barren and
garish and double as the whiteboard.

In short, the interview rooms suck! They're cramped, imposing, airless and you
might only step out of the room once for lunch, in a five hour window (see
[Move fast and break frequently](#move-fast-and-break-frequently)).

Before stepping into the room, one of my interviewers remarked that the room was
depleted of oxygen and proceeded to use the door as a pseudo-fan to try and
replace the air (so another tip: make sure your fresh-breath-game is on point).

## Time is not on your side

Time is your worst enemy during the interviews. I found most of the challenges
to be reasonably benign, except that by the time you have clarified the proposed
problem, had a think about your approach and started work, it's probably been 45
minutes and it's time for your next interview. In all eleven onsite interviews I
took, I never completed a problem, and that may have contributed to my lack of
offer.

My best advice here is:

- pay attention to the clock

- choose solutions that succinctly demonstrate your competence, rather than
  building elaborate panaceas

- let the interviewer know how you will approach the problem and what shortcuts
  you might take in the interest of time

## Move fast and break frequently

Each interviewer will ask you, at the beginning of their session, if you would
like to go to the bathroom or grab a coffee/snack/other. My advice? __Take the
break__, even you if don't think you need it.

I've never done this, but maybe ask the interviewer if you can walk and talk.
The extra air and blood circulation will surely help while you clarify the
problem and consider your approach.

The interviews blow by in what feels like an instant. You rarely feel you were
able to convey your solutions in full. While your mind is buzzing over the
details you had to skip or the potential mistakes you have made, the next
interviewer arrives at the door...

## Lightweight context switching

Most interviews will expose and exploit your weaknesses. In the very moment you
find yourself reeling and wondering why you ever bothered to show up, the next
interviewer arrives at the door and requires that you shake it off, centre
yourself and now focus on a completely new challenge on an unrelated topic.

I definitely found myself distracted at the beginning of each interview, with
the result of the previous. This served absolutely no purpose, except to shake
my confidence and distract my focus from the problem at hand.

The issue is compounded if you don't know what is happening for the day. On my
first round of interviews, my recruiter wrote the list of interviews up on the
whiteboard at the beginning of the day. This helped me switch between
interviews, as I knew roughly what to expect next. In the second round, things
were a little less organised (we even had a double-booked room) and I missed out
on the briefing. As a result, for the rest of the day, I had no idea what was
happening next. Even worse, after my fifth interview, when I thought I was done
for the day, a sixth interviewer appeared.

So make sure you ask your recruiter at the begining of the day for the order
of the interviews and scheduled lunch break.

Again, during your interviews, keep an eye on the clock so you know when things
are about to round up and you're going to have to switch.

If an interview doesn't go to plan, remember that you are your own worst critic,
and that the interviews are designed to explore your limits, not your comfort
zones.

## Latency over distance

There are plenty of foreigners on the PE team at Facebook; including many from
my homeland of Australia. They were able to overcome the challenges of
travelling internationally for the interviews, but it was not without its
challenges for me.

Both rounds of my interviews started around 10 AM PST and finished late
afternoon. This translates roughly to starting at 2AM and finishing around 8AM
in my native timezone, AWST. Add to this that I had recently disembarked from
a sleepless 25 hour journey from Western Australia to San Francisco.

The key here, is to plan ahead and manage the situation. Things that worked well
for me include:

- ask for an additional night before the interview, to adjust to the timezone
  and be prepared to pay for it yourself

- get lots of sleep and take natural supplements to help with getting to sleep
  and waking up again (50mg of Doxylamine Succinate and Berocca worked for me,
  but talk to your doctor)

- stay hydrated - no alcohol or salty foods - beware of airconditioning - 
  Hydralyte worked well for me

- make sure you have access to your money without rediculous overseas charges.
  I got around with a great credit card that offers no-charge overseas
  transactions

- get out of the hotel room and experience some air and the local culture


## Handling edge cases

After failing the SWE interview in my first attempt, I spent an entire year
bolstering my weaknesses; studying asymptotic analysis, practicing on
[hackerrank.com](https://www.hackerrank.com/) and implementing a boatload of
algorithms and data structures. I also committed myself to memorising the call
signatures of many functions related to manipulating strings, copying memory,
etc.

On the morning of the interview, I sat in the hotel room with pen and paper,
smashing through some challenges in [Cracking the Coding Interview](http://www.crackingthecodinginterview.com/)
in record time. I felt great about the SWE interview and eager to demonstrate
how much I had grown.

My confidence was quickly dashed when the SWE interviewer explained the
challenge, which I felt was best solved by simply opening, reading and seeking
through a text file.

Unfortunately, these were functions I had not committed to memorising and this
cost me a lot of time in the second interview. I did not complete
either of the challenges in the alotted time.

I also made the mistake of tackling the problem in a lower-level language, C. In
all of my practice work, C had proven to be the most elegant and expressive
language for me to solve problems like
[Dykstra's algorithm](https://en.wikipedia.org/wiki/Dijkstra%27s_algorithm),
[Kosaraju's algorithm](https://en.wikipedia.org/wiki/Kosaraju's_algorithm) or
implementing a [Heap](https://en.wikipedia.org/wiki/Heap_(data_structure)).

The downside of C though, is that for higher level problems, like maybe
splitting a text file by line, the work required is more verbose and quickly
blows out the time alotted for the interview.

Next time, I'll be practiced and prepared in both low-level and high-level
languages.


## Recommendations

- make sure you get a list of interviews at the beginning of the day

- take breaks whenever possible

- stay hydrated and mentally healthy

- keep your breath fresh

- keep an eye on the time

## Reading for Production Engineering

I attribute almost every success I had in the interview process to the following
excellent books:

- [Site Reliability Engineering](https://landing.google.com/sre/book.html)

- [Understanding the Linux Kernel](http://shop.oreilly.com/product/9780596005658.do)

- [Cracking the Coding Interview](http://www.crackingthecodinginterview.com/)

- [Introduction to Algorithms](https://mitpress.mit.edu/books/introduction-algorithms)

- [The Illustrated Network](http://www.wgoralski.com/the-illustrated-network.html)
