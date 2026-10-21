export interface ReplyOutput {
  tone: string;
  contextAnalysis: string;
  replies: string[];
  engine?: 'gemini-ai' | 'contextual-nlp';
}

interface EmotionPattern {
  name: string;
  keywords: RegExp;
  contextReading: (subject: string, raw: string) => string;
  replies: Record<string, (subject: string, raw: string, isShort: boolean) => string[]>;
}

function cleanInput(text: string): string {
  return text.trim().replace(/^["']|["']$/g, '');
}

function extractKeySubject(text: string): string {
  const lower = text.toLowerCase();
  
  if (lower.includes('anxious') || lower.includes('anxiety') || lower.includes('panic')) return 'anxiety';
  if (lower.includes('stress') || lower.includes('stressed') || lower.includes('overwhelm')) return 'stress';
  if (lower.includes('job') || lower.includes('interview') || lower.includes('offer')) return 'the job';
  if (lower.includes('exam') || lower.includes('test') || lower.includes('grade')) return 'the exam';
  if (lower.includes('work') || lower.includes('boss') || lower.includes('meeting') || lower.includes('presentation')) return 'work';
  if (lower.includes('tired') || lower.includes('exhausted') || lower.includes('sleep') || lower.includes('burnout')) return 'exhaustion';
  if (lower.includes('miss you') || lower.includes('miss u')) return 'missing them';
  if (lower.includes('dinner') || lower.includes('lunch') || lower.includes('coffee') || lower.includes('drinks') || lower.includes('food')) return 'plans';
  if (lower.includes('ghost') || lower.includes('left on read') || lower.includes('ignored')) return 'being left on read';
  if (lower.includes('date') || lower.includes('crush') || lower.includes('cute')) return 'the date';
  if (lower.includes('sad') || lower.includes('crying') || lower.includes('depressed') || lower.includes('down')) return 'feeling down';
  if (lower.includes('happy') || lower.includes('passed') || lower.includes('promoted') || lower.includes('won')) return 'good news';

  // Fallback: extract prominent noun/word
  const words = lower.replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(w => 
    !['hey', 'hi', 'hello', 'i', 'im', 'i\'m', 'my', 'the', 'is', 'a', 'an', 'and', 'to', 'for', 'of', 'in', 'it', 'so', 'just', 'that', 'this'].includes(w)
  );
  return words[0] || 'what you mentioned';
}

const PATTERNS: EmotionPattern[] = [
  // 1. Anxiety / Stress / Overwhelm
  {
    name: 'anxiety',
    keywords: /\b(anxious|anxiety|panic|panicking|stressed|stress|overwhelmed|freaking out|spiraling|nervous)\b/i,
    contextReading: (subject) => `They are overwhelmed and reaching out for reassurance, grounding, or a steady presence.`,
    replies: {
      comfort: (subject, raw, isShort) => isShort ? [
        "breathe with me",
        "here for you",
        "take your time",
        "it's okay",
        "one breath"
      ] : [
        "anxiety has a way of making everything feel louder than it is — you don't have to fix it all right now",
        "hey, it's okay. want to talk about what's bringing it on?",
        "that sounds really heavy right now. take a slow breath, no pressure to explain anything",
        "i hear you. step away from whatever you're doing for five minutes if you can",
        "you don't have to carry the whole day at once, just get through this hour"
      ],
      corporate: (subject, raw, isShort) => isShort ? [
        "prioritize resting first",
        "take your time",
        "health comes first",
        "happy to pause",
        "rescheduling is fine"
      ] : [
        "i'm sorry you're feeling this way. hope things settle down shortly",
        "that sounds stressful — please take the time you need to reset",
        "anxiety is usually a sign of too many competing priorities. let's see what can be pushed or delegated",
        "understood. don't hesitate to take a moment for yourself before tackling anything else",
        "take care of yourself first, we can easily adjust timelines once things settle"
      ],
      casual: (subject, raw, isShort) => isShort ? [
        "hate that feeling",
        "deep breath first",
        "drink some water",
        "turn off notifications",
        "call me whenever"
      ] : [
        "hate that feeling so much. anything specific going on or just general brain chaos?",
        "ugh that sucks. want to vent about it or would a distraction help more?",
        "take a second and drink some water. i'm around if you need to brain dump",
        "deep breath. what's the main thing stressing you out right now?",
        "felt. step away from your screen for a bit if you can"
      ],
      funny: (subject, raw, isShort) => isShort ? [
        "brain needs reboot",
        "wifi restart logic",
        "irrational fear club",
        "zero chill brain",
        "turn it off"
      ] : [
        "have you tried turning your brain off and back on again? usually works for my wifi",
        "my nervous system sends its regards. what's the irrational fear on today's agenda?",
        "anxiety really wakes up and chooses violence for no reason at all",
        "tell your brain we already reviewed the script and everything is going to be fine",
        "cool cool cool, so which imaginary scenario are we overanalyzing today?"
      ],
      witty: (subject, raw, isShort) => isShort ? [
        "4k brain noise",
        "unpaid brain labor",
        "interest on worry",
        "imaginary deadlines",
        "conspiracy theories"
      ] : [
        "anxiety is just conspiracy theories your own brain invents about your life",
        "the good news is your brain cares. the bad news is it cares with zero chill",
        "borrowing trouble from tomorrow never lowered today's interest rate",
        "your anxiety is playing in 4k while reality is barely in 720p",
        "statistically, 90% of the things you're worried about won't happen and the rest won't matter"
      ],
      flirty: (subject, raw, isShort) => isShort ? [
        "wish i was there",
        "let me distract you",
        "thinking of you",
        "come breathe here",
        "you're safe here"
      ] : [
        "sorry you're feeling that way... wish i was there to distract you properly",
        "take a deep breath. if it helps, you're doing great, even if your brain says otherwise",
        "hate seeing you stressed. what can i do to put a smile on your face?",
        "close your eyes for two minutes and think about me instead. guaranteed mood boost",
        "you shouldn't have to deal with anxiety alone. let me keep you company"
      ],
      rizz: (subject, raw, isShort) => isShort ? [
        "i got you",
        "breathe, we good",
        "talk to me",
        "drop shoulders, exhale",
        "you're untouchable"
      ] : [
        "drop your shoulders, exhale. i got you",
        "tell me what's on your mind. i'm listening",
        "you handle everything else effortlessly, don't let this get the best of you",
        "take a breath. you're way too good to be stressing over this",
        "whatever it is, we'll sort it out. talk to me"
      ],
      roast: (subject, raw, isShort) => isShort ? [
        "overthinking isn't cardio",
        "drink water already",
        "inventing fake problems",
        "screen time check",
        "go sleep"
      ] : [
        "your brain is running a full simulation of worst-case scenarios that will never happen",
        "congratulations, you've successfully invented 47 problems that don't exist yet",
        "you're stressing over things you can't control while completely ignoring your sleep schedule",
        "maybe if you put your phone down and drank water your heart rate wouldn't be 140",
        "overthinking isn't cardio, you can log off now"
      ],
      friendly: (subject, raw, isShort) => isShort ? [
        "thinking of you",
        "take your time",
        "sending warm hugs",
        "here for you",
        "you've got this"
      ] : [
        "i'm so sorry you're dealing with that right now. please be gentle with yourself today",
        "just wanted to remind you that whatever you're feeling is valid and temporary",
        "take things one minute at a time today — sending you the warmest energy",
        "if you need someone to listen or talk about anything else to distract you, i'm right here",
        "you've navigated stressful days before, and you'll get through this one too"
      ],
    }
  },

  // 2. Sadness / Grief / Hurting
  {
    name: 'sadness',
    keywords: /\b(sad|crying|depressed|heartbroken|hurt|hurts|grief|grieving|down|lonely|empty|miserable)\b/i,
    contextReading: (subject) => `They are hurting and need genuine empathy without being dismissed or rushed.`,
    replies: {
      comfort: (subject, raw, isShort) => isShort ? [
        "it's okay to cry",
        "not going anywhere",
        "here with you",
        "let it out",
        "holding space"
      ] : [
        "that sounds genuinely heartbreaking and you don't have to put on a brave face right now",
        "whatever you're feeling right now makes complete sense. i'm not going anywhere",
        "you don't have to carry this alone. take all the time you need to just feel it",
        "i'm so sorry. wish i could give you a hug right now",
        "be gentle with yourself today. you've been carrying a lot"
      ],
      corporate: (subject, raw, isShort) => isShort ? [
        "take all the time",
        "sending condolences",
        "no rush on anything",
        "we can pause",
        "family and health first"
      ] : [
        "i was really sorry to hear this. please take all the time and space you need",
        "please don't worry about work or updates right now. taking care of yourself is the priority",
        "sending my warmest thoughts during what must be a very tough moment",
        "we can easily handle things here while you take the time you need",
        "deeply sorry for what you're dealing with. reach out if there's any way we can take things off your plate"
      ],
      casual: (subject, raw, isShort) => isShort ? [
        "hate seeing you down",
        "coming over whenever",
        "here for you",
        "order food tonight",
        "no words needed"
      ] : [
        "man, i'm really sorry. that just completely sucks",
        "do you want me to come over or would you rather have space right now?",
        "no need to reply to this, just wanted you to know i'm thinking about you",
        "hate that you have to go through this. i'm here for whatever you need",
        "take it easy today, put on something comforting and don't push yourself"
      ],
      funny: (subject, raw, isShort) => isShort ? [
        "sending emergency memes",
        "ice cream protocol",
        "world owes you",
        "unacceptable behavior",
        "rage room time"
      ] : [
        "alright, who do we need to fight? i'll bring the pitchforks",
        "initiating emergency comfort protocol: bad reality tv and unmeasured amounts of carbs",
        "today was cancelled by executive order, you're officially excused from participating",
        "i am sending aggressive emotional support your way right now",
        "the universe has 24 hours to apologize for doing you like this"
      ],
      witty: (subject, raw, isShort) => isShort ? [
        "plot armor active",
        "character development arc",
        "heavy chapter",
        "temporary low",
        "rebuilding mode"
      ] : [
        "this is definitely the rough middle chapter of the movie where everything tests the protagonist",
        "pain is real, but so is your track record of surviving bad days",
        "the world is undeniably unfair sometimes, but it didn't count on your resilience",
        "allow yourself to be sad today so you don't have to carry it tomorrow",
        "some days are just endurance tests with zero redeemable qualities"
      ],
      flirty: (subject, raw, isShort) => isShort ? [
        "wish i was cuddling",
        "let me hold you",
        "sending warm hugs",
        "here for you always",
        "you deserve softness"
      ] : [
        "wish i was there to wrap my arms around you and make everything go away for a bit",
        "hate seeing someone as sweet as you hurting. let me bring you food later",
        "you deserve only gentle things right now. let me know if you want company",
        "i'm wrapping you up in the biggest mental hug right now",
        "whenever you're ready to smile again, i'll be waiting right here"
      ],
      rizz: (subject, raw, isShort) => isShort ? [
        "i'm on my way",
        "you're safe here",
        "i got you always",
        "lean on me",
        "stay close"
      ] : [
        "hey, look at me. you're going to get through this, and i'm right beside you",
        "you don't have to be strong right now. lean on me",
        "give me a call whenever you want. even if we just stay on the line in silence",
        "i hate seeing you hurt. whatever you need, you have it",
        "you're not doing this alone. not on my watch"
      ],
      roast: (subject, raw, isShort) => isShort ? [
        "no more sad playlist",
        "hydrate your tears",
        "get out of bed",
        "villain origin story",
        "nap it off"
      ] : [
        "stop listening to sad songs in the dark, you're literally romanticizing your own depression",
        "hydrate. you just cried half your body weight in tears",
        "okay you're allowed to mope for today, but tomorrow we're back in the arena",
        "if this is your villain origin story, at least make the costume good",
        "get off tiktok, eat something with actual protein, and take a shower"
      ],
      friendly: (subject, raw, isShort) => isShort ? [
        "sending huge love",
        "thinking of you",
        "always here",
        "warmest hugs",
        "take gentle care"
      ] : [
        "sending you so much warmth and love today. please take the gentlest care of yourself",
        "i'm keeping you in my thoughts today — remember how much you are cared for",
        "there's no right way to feel, so just take each hour as it comes",
        "reach out anytime, day or night. i'll always pick up",
        "giving you all the space you need, but always in your corner"
      ],
    }
  },

  // 3. Exhaustion / Burnout / Tired
  {
    name: 'tired',
    keywords: /\b(tired|exhausted|drained|dead|burned out|burnout|no energy|can't keep my eyes open|sleepy)\b/i,
    contextReading: (subject) => `They are physically or mentally depleted and looking for permission to unplug.`,
    replies: {
      comfort: (subject, raw, isShort) => isShort ? [
        "go to sleep",
        "rest now",
        "unplug completely",
        "no guilt sleeping",
        "bedtime"
      ] : [
        "put everything away and just sleep. nothing on your to-do list is more important than your rest",
        "you've been running on empty for too long. give yourself permission to just check out for tonight",
        "crawl into bed and don't set an alarm if you don't have to. you earned this rest",
        "don't reply to anyone else tonight, just rest",
        "sleep well, we can pick up everything tomorrow with a fresh head"
      ],
      corporate: (subject, raw, isShort) => isShort ? [
        "log off early",
        "rest up",
        "catch up tomorrow",
        "shut it down",
        "unplug for today"
      ] : [
        "understood. please log off early and get some proper rest tonight",
        "burnout helps no one — let's pause our discussions here and pick up tomorrow",
        "make sure you take time to completely disconnect this evening",
        "prioritize recharging tonight; the deliverables can wait until tomorrow morning",
        "thanks for flagging. please get some rest and we'll touch base once you're recharged"
      ],
      casual: (subject, raw, isShort) => isShort ? [
        "go pass out",
        "sleep time fr",
        "log off bro",
        "night night",
        "don't stay up"
      ] : [
        "go pass out, you sound completely fried",
        "close your eyes right now. whatever it is can literally wait till tomorrow",
        "turn on do not disturb and sleep for 10 hours straight",
        "bed is calling your name. stop scrolling and go to sleep",
        "go recharge, talk to you tomorrow when your brain is actually working"
      ],
      funny: (subject, raw, isShort) => isShort ? [
        "battery at 1%",
        "operating on fumes",
        "hibernation season",
        "system shutdown",
        "drop like stone"
      ] : [
        "you are currently running on 1% battery and pure audacity. go plug in",
        "if you don't go to sleep right now your pillow is filing for neglect",
        "your brain has left the chat. please shut down the machine before smoke comes out",
        "congratulations, you have unlocked level 10 zombie mode",
        "sleep before your body initiates an emergency forced restart"
      ],
      witty: (subject, raw, isShort) => isShort ? [
        "law of diminishing returns",
        "diminishing brainpower",
        "biological mandate",
        "shutdown mandatory",
        "reboot necessary"
      ] : [
        "operating past exhaustion isn't dedication, it's just producing typos at high speed",
        "sleep is the only interest-free loan your body gives you. time to collect",
        "your productivity curve has officially inverted. go to bed",
        "rest isn't a reward for work completed, it's the prerequisite",
        "nothing productive has ever happened after hour 14 of exhaustion"
      ],
      flirty: (subject, raw, isShort) => isShort ? [
        "tuck you in?",
        "dream of me",
        "rest that pretty head",
        "sleep tight babe",
        "bedtime cuddle"
      ] : [
        "wish i was there to tuck you in and kiss your forehead goodnight",
        "go rest that pretty head of yours. you've worked too hard today",
        "get some good sleep, and make sure you save a dream for me tonight",
        "crawl into bed. i'll send you good morning texts so you wake up smiling",
        "go to sleep... but text me first thing when you open your eyes"
      ],
      rizz: (subject, raw, isShort) => isShort ? [
        "sleep now. orders.",
        "bedtime. go.",
        "rest up, champ",
        "turn phone over",
        "goodnight"
      ] : [
        "phone face down, lights out. get your rest",
        "you've done enough today. go sleep, i'll be here in the morning",
        "rest up. tomorrow needs your full energy",
        "go get some real sleep. you look way too good to be exhausted",
        "i'm letting you sleep now. talk in the morning"
      ],
      roast: (subject, raw, isShort) => isShort ? [
        "put phone down",
        "blue light addict",
        "stop the doomscroll",
        "eye bags visible",
        "sleep already"
      ] : [
        "you say you're exhausted yet here you are typing messages. go to sleep",
        "your eye bags have their own zip code at this point. close your eyes",
        "putting your phone on your nightstand won't kill you, i promise",
        "you've been complaining about being tired for six hours instead of sleeping",
        "shut your eyes and stop fighting the biological urge to rest"
      ],
      friendly: (subject, raw, isShort) => isShort ? [
        "sweet dreams",
        "rest well",
        "sleep tight",
        "recharge well",
        "goodnight!"
      ] : [
        "get the best sleep tonight! you truly worked hard and deserve the rest",
        "make yourself a warm tea and get cozy. have a wonderful night's sleep!",
        "wishing you the most peaceful, uninterrupted sleep tonight",
        "take care of yourself and rest up well. chat tomorrow!",
        "rest easy tonight — everything else can wait until morning"
      ],
    }
  },

  // 4. Celebration / Achievement / Good News
  {
    name: 'achievement',
    keywords: /\b(got the job|passed|promoted|won|offer|accepted|we did it|good news|celebrate|so happy|success)\b/i,
    contextReading: (subject) => `They achieved a milestone and want someone to genuinely match their excitement.`,
    replies: {
      casual: (subject, raw, isShort) => isShort ? [
        "let's goooo!",
        "huge win!",
        "so proud!",
        "drinks on you",
        "massive W"
      ] : [
        "yo let's go!! that is actually massive news!",
        "so happy for you, honestly nobody deserved this more",
        "huge W. drinks are definitely on you this weekend though",
        "knew you had this in the bag! how are we celebrating?",
        "omg yes!! tell me everything, how did it happen?"
      ],
      comfort: (subject, raw, isShort) => isShort ? [
        "so proud of you",
        "you earned this",
        "heart is full",
        "you did it",
        "so deserved"
      ] : [
        "i'm so incredibly proud of you. after everything you put in, you earned every bit of this",
        "seeing all your hard work pay off like this genuinely makes me so happy",
        "take a moment to just soak this in. you doubted yourself and you still pulled it off",
        "this is all you. remember this feeling next time things feel tough",
        "i'm smiling so big for you right now. congratulations"
      ],
      corporate: (subject, raw, isShort) => isShort ? [
        "congratulations!",
        "well deserved!",
        "exceptional work!",
        "thrilled for you!",
        "outstanding result"
      ] : [
        "congratulations! this is a tremendous achievement and very well deserved",
        "outstanding news. your dedication and track record made this an obvious outcome",
        "thrilled to hear this! looking forward to seeing the impact you make in this new chapter",
        "well-earned recognition for all the hard work you've put in. congratulations!",
        "fantastic milestone. take some time to celebrate this accomplishment"
      ],
      funny: (subject, raw, isShort) => isShort ? [
        "we are rich",
        "don't forget us",
        "VIP status now",
        "humble bragging",
        "drinks on you"
      ] : [
        "don't forget about me when you're famous and out of my tax bracket",
        "i knew you before you were successful, so my celebratory drinks are fully complimentary",
        "look at you out here acting like a competent, high-functioning member of society",
        "we're gonna need at least 3 business days to celebrate this properly",
        "is this where you act like you're surprised even though we all knew you'd crush it?"
      ],
      witty: (subject, raw, isShort) => isShort ? [
        "inevitable outcome",
        "zero competition",
        "clean execution",
        "meritocracy validated",
        "flawless victory"
      ] : [
        "talent meeting opportunity with zero room for debate. textbook execution",
        "the universe finally showed some administrative competence and gave credit where it's due",
        "hard to call it luck when the preparation was this obvious",
        "a rare victory for competence. you made it look easy",
        "it wasn't if, it was always just when. congratulations"
      ],
      flirty: (subject, raw, isShort) => isShort ? [
        "so attractive",
        "taking you out",
        "proud of you baby",
        "celebration dinner?",
        "my winner"
      ] : [
        "success looks outrageously good on you. how are we celebrating tonight?",
        "i am so proud of you... does the winner get a celebratory dinner on me?",
        "smart, hardworking, and now this? you're really trying to make me fall harder",
        "congratulations gorgeous! tell me what you want to do tonight to celebrate",
        "you won today, but having you around makes me feel like the real winner"
      ],
      rizz: (subject, raw, isShort) => isShort ? [
        "never doubted it",
        "that's what you do",
        "drinks tonight",
        "we celebrate now",
        "natural winner"
      ] : [
        "never doubted you for a second. you're built for this",
        "that's just what happens when you show up. dinner is on me tonight",
        "told you you'd get it. now let's celebrate properly",
        "big moves. i love seeing you win like this",
        "you make winning look effortless. proud of you"
      ],
      roast: (subject, raw, isShort) => isShort ? [
        "miracles happen",
        "who did you bribe",
        "impostor syndrome cured",
        "about time",
        "don't get cocky"
      ] : [
        "who did you bribe on the committee? fess up",
        "wow, so the bar was on the floor and you somehow cleared it! proud of you",
        "don't let this go to your head, your ego is already taking up the whole room",
        "finally, some proof that you actually do things instead of just talking about them",
        "congrats! does this mean you can finally pay back the $12 you owe me?"
      ],
      friendly: (subject, raw, isShort) => isShort ? [
        "huge congratulations!",
        "so happy for you!",
        "way to go!",
        "celebrate big!",
        "cheers to you!"
      ] : [
        "this is the best news i've heard all week! congratulations!",
        "nobody deserves this more than you do. celebrate big tonight!",
        "so thrilled for you! you put in the hours and it truly paid off",
        "sending the biggest virtual high-five! so happy for your success!",
        "what an incredible milestone! wishing you all the best in this next chapter!"
      ],
    }
  },

  // 5. Romance / Flirting / Crush
  {
    name: 'romance',
    keywords: /\b(miss you|miss u|thinking of you|thinking about you|date|cute|handsome|pretty|look good|kiss|love you|cutie|crush)\b/i,
    contextReading: (subject) => `They are showing romantic interest or vulnerability and testing the waters.`,
    replies: {
      flirty: (subject, raw, isShort) => isShort ? [
        "miss you more",
        "come see me",
        "thinking of you too",
        "be here instead",
        "smooth talker"
      ] : [
        "miss you more, but you could easily fix that by coming over",
        "you're really not making it easy for me to focus on anything else today",
        "thinking about you too... probably more than i should admit",
        "you always know exactly what to say to make me smile like an idiot",
        "if you miss me this much through text, in person is going to be dangerous"
      ],
      rizz: (subject, raw, isShort) => isShort ? [
        "say less, omw",
        "give me 20 mins",
        "you know where i am",
        "always on your mind",
        "handled"
      ] : [
        "give me 20 minutes, i'm on my way",
        "you're always thinking about me, but at least you're consistent",
        "tell me where you are, i'll come pick you up",
        "don't say you miss me unless you're ready to do something about it",
        "i was just about to text you the exact same thing"
      ],
      casual: (subject, raw, isShort) => isShort ? [
        "miss you too!",
        "we need to hang",
        "haha stop it",
        "free this week?",
        "let's catch up"
      ] : [
        "miss you too! we definitely need to hang out this week",
        "haha you're the best. what are you doing this weekend?",
        "aw that's sweet! let's grab dinner soon and catch up properly",
        "miss you too stranger, it's been way too long",
        "stop being cute and let me know when you're free"
      ],
      corporate: (subject, raw, isShort) => isShort ? [
        "appreciate the note",
        "likewise, take care",
        "always good hearing",
        "thank you kindly",
        "best regards"
      ] : [
        "thank you, always appreciate hearing from you! hope your week is going smoothly",
        "likewise! looking forward to catching up when our schedules align next",
        "very kind of you to reach out. hope all is well on your end",
        "much appreciated — hope you're having a productive and restful week",
        "thanks for the note! let's connect soon"
      ],
      comfort: (subject, raw, isShort) => isShort ? [
        "warmest hug",
        "thinking of you too",
        "always in my heart",
        "miss you lots",
        "sending love"
      ] : [
        "that really warmed my heart to read. miss you so much too",
        "you're always on my mind too. sending you the biggest hug across the distance",
        "just hearing from you made my whole day better. thank you for reaching out",
        "can't wait until we're in the same room again. take care of yourself",
        "you mean so much to me, never forget that"
      ],
      funny: (subject, raw, isShort) => isShort ? [
        "i miss me too",
        "flattery will work",
        "calm down fan",
        "get in line",
        "receipts saved"
      ] : [
        "i mean, can you blame you? i'm delightful",
        "flattery will get you everywhere with me, please continue",
        "calm down, my ego is already reaching critical mass today",
        "i miss me too when i'm not around. we have so much in common",
        "saving this message as proof that somebody actually likes me"
      ],
      witty: (subject, raw, isShort) => isShort ? [
        "flawless taste",
        "bold confession",
        "undeniable chemistry",
        "charming strategy",
        "high risk, high reward"
      ] : [
        "your taste is undeniably impeccable. i respect that in a person",
        "bold statement. are you prepared to back that up in person?",
        "distracting me in the middle of the day is a high-risk, high-reward move",
        "i appreciate a direct approach. it saves everybody so much calendar time",
        "the chemistry was getting too loud to ignore anyway"
      ],
      roast: (subject, raw, isShort) => isShort ? [
        "thirsty behavior",
        "who coached you",
        "smooth operator lol",
        "caught in 4k",
        "down bad"
      ] : [
        "you are down so bad it's actually fascinating to observe",
        "did you practice that line in the mirror or did it just slip out?",
        "relax, don't trip over yourself trying to be smooth",
        "i'd say play hard to get, but clearly that ship sailed months ago",
        "screenshotting this in case i ever need blackmail material"
      ],
      friendly: (subject, raw, isShort) => isShort ? [
        "aw thank you!",
        "miss you too!",
        "so sweet!",
        "let's hang soon!",
        "big hugs!"
      ] : [
        "aw, thank you so much! that made me smile. miss you too!",
        "you're always so sweet! we definitely need to get together soon",
        "sending you huge smiles right back! hope you're having an awesome day",
        "miss you too! let's plan something fun soon",
        "so lovely hearing from you today! hope you're doing great"
      ],
    }
  },

  // 6. Conflict / Annoyance / Frustration / "We need to talk"
  {
    name: 'conflict',
    keywords: /\b(we need to talk|why didn't you|why did you|annoyed|mad at me|angry|frustrated|upset with me|ignoring me|left me on read)\b/i,
    contextReading: (subject) => `Tension or unresolved conflict is present. Requires composure and direct de-escalation.`,
    replies: {
      corporate: (subject, raw, isShort) => isShort ? [
        "happy to clarify",
        "let's discuss live",
        "calling you shortly",
        "clarifying now",
        "available at 2"
      ] : [
        "i'm happy to talk this through directly. what time works best for a quick call?",
        "definitely want to make sure we're on the same page. let's connect today",
        "i hear your concern and want to address it properly. let's discuss this calmly",
        "thanks for bringing this up directly. i'm free to walk through this whenever you are",
        "let's schedule a few minutes to talk through the details so there's no miscommunication"
      ],
      comfort: (subject, raw, isShort) => isShort ? [
        "i'm here to listen",
        "let's talk gently",
        "sorry for any stress",
        "talk to me please",
        "hearing you out"
      ] : [
        "i hear you and i'm really sorry if i caused frustration. i want to listen to how you feel",
        "i'm not mad or pulling away at all. let's sit down and talk things through openly",
        "your feelings matter to me. tell me what's on your mind and i promise to listen",
        "i'm here and i want to make things right between us. let's talk whenever you're ready",
        "no defensiveness from me. let me know when you have time to chat"
      ],
      casual: (subject, raw, isShort) => isShort ? [
        "my bad entirely",
        "let's call now",
        "not ignoring you",
        "just got free",
        "can we talk?"
      ] : [
        "hey, definitely not mad or ignoring you, today just ran away from me. can i call you in 5?",
        "my bad for not answering sooner. what's going on?",
        "yeah let's definitely talk. give me a call whenever you're free",
        "sorry about that, didn't mean to make you feel that way. what's on your mind?",
        "let's just clear the air real quick so we're not overthinking it. calling you in a sec"
      ],
      funny: (subject, raw, isShort) => isShort ? [
        "incoming boss music",
        "why do i hear drums",
        "surrender terms ready",
        "taking cover now",
        "pleading the fifth"
      ] : [
        "why did that message just play dramatic orchestral music in my head?",
        "before you yell at me, please consider that i am simply a fragile creature",
        "i'd like to plead the fifth, but i also value our relationship so what did i do?",
        "uh oh, full sentence alert. who do i need to apologize to?",
        "i am mentally putting on a helmet right now. go ahead"
      ],
      witty: (subject, raw, isShort) => isShort ? [
        "directness appreciated",
        "facts before feelings",
        "clearing the static",
        "ready when you are",
        "no subtext needed"
      ] : [
        "clarity is always better than assumptions. let's hear what's on the table",
        "i appreciate direct communication over quiet resentment any day. let's talk",
        "let's separate the facts from the feelings and sort this out in five minutes",
        "no need for suspense — tell me what happened so we can resolve it",
        "open cards on the table is the only way this works. let's do it"
      ],
      flirty: (subject, raw, isShort) => isShort ? [
        "are you mad babe",
        "let me make it up",
        "promise i'm innocent",
        "punish me later",
        "call me cutie"
      ] : [
        "are you mad at me? because you're cute even when you're frustrated, but i'd rather fix it",
        "tell me what i did so i can properly apologize and make it up to you over dinner",
        "i promise you have my full attention now. what's bothering you?",
        "don't stay mad at me for too long, you know i can't handle it. let's talk",
        "let me call you right now so you can hear my voice and remember you like me"
      ],
      rizz: (subject, raw, isShort) => isShort ? [
        "calling you now",
        "pick up the phone",
        "we're good, trust",
        "let's settle this",
        "i'm on the phone"
      ] : [
        "calling you right now. pick up, let's talk like adults",
        "we don't do drama over text. i'm ringing you in two seconds",
        "whatever it is, we'll handle it. talk to me directly",
        "i'm not dodging you. let's get on the phone and straighten this out",
        "take a breath, we're good. let me call you"
      ],
      roast: (subject, raw, isShort) => isShort ? [
        "deep breaths dramatic",
        "main character moment",
        "drop the monologue",
        "not that serious",
        "text book drama"
      ] : [
        "the theatrical pause between your messages is Oscar-worthy, honestly",
        "are we having a conversation or did you just script a mini Netflix drama?",
        "you waited 4 hours to send that dramatic line, didn't you?",
        "take a breath, you're projecting a whole cinema onto a 2-word miscommunication",
        "relax, nobody is out to get you. spit it out so we can move on"
      ],
      friendly: (subject, raw, isShort) => isShort ? [
        "let's talk soon",
        "happy to chat",
        "all good here",
        "let's connect!",
        "calling in a bit"
      ] : [
        "so sorry for any confusion! i'd love to chat and make sure everything is cleared up",
        "definitely want to talk this through together. let me know when you're free!",
        "i appreciate you reaching out so we can stay on the same page. let's connect!",
        "no worries at all, let's chat in a bit and sort everything out warmly",
        "happy to talk whenever works for you today!"
      ],
    }
  },

  // 7. General Questions / Invitation / Plans
  {
    name: 'plans',
    keywords: /\b(free|weekend|hang out|dinner|coffee|lunch|drinks|tonight|tomorrow|plans|down for|up for)\b/i,
    contextReading: (subject) => `They are proposing plans or checking availability to spend time together.`,
    replies: {
      casual: (subject, raw, isShort) => isShort ? [
        "yeah i'm down",
        "what time?",
        "free after 6",
        "sounds good!",
        "count me in"
      ] : [
        "yeah i'm definitely down! what time were you thinking?",
        "sounds good to me, where are we going?",
        "free after 6 on friday, would that work for you?",
        "honestly perfect timing, i needed an excuse to get out of the house",
        "count me in! let me know the location"
      ],
      flirty: (subject, raw, isShort) => isShort ? [
        "only if you're there",
        "date night then",
        "clearing my schedule",
        "you're picking place",
        "can't say no to you"
      ] : [
        "i was hoping you'd ask. what time are you picking me up?",
        "for you? i'll clear my entire schedule",
        "are you asking me out on a date? because the answer is definitely yes",
        "i'm down, as long as you promise to be on your best behavior",
        "can't say no to you honestly. send me the details"
      ],
      rizz: (subject, raw, isShort) => isShort ? [
        "say less, 8pm",
        "i'll pick you up",
        "done, Friday 8",
        "leave it to me",
        "sounds like a plan"
      ] : [
        "8pm friday. i'll pick the spot, you just show up",
        "say less. i'll text you the address tomorrow",
        "already had you in mind for this weekend. let's do it",
        "i'm free after 7. i'll swing by and get you",
        "consider it locked in. see you then"
      ],
      funny: (subject, raw, isShort) => isShort ? [
        "will there be food",
        "social battery check",
        "depends on snacks",
        "forcing me outdoors",
        "i accept food bribes"
      ] : [
        "will there be food? my social attendance is 100% conditional on calories",
        "let me consult my calendar and by calendar i mean my desire to stay in sweatpants",
        "fine, but you're responsible for paying my social battery recharge fee afterwards",
        "drag me out of the house by force, it's the only way i'll survive adulthood",
        "i accept. don't make me regret wearing hard pants for this"
      ],
      witty: (subject, raw, isShort) => isShort ? [
        "proposal accepted",
        "schedule alignment",
        "high priority event",
        "approved request",
        "logistics pending"
      ] : [
        "rarely do social invitations offer this kind of return on investment. accepted",
        "i've reviewed the proposal and determined attendance is mandatory",
        "pencil me in, assuming zero cancellations due to unforeseen weather or inertia",
        "my schedule is remarkably flexible when the company is quality",
        "a compelling offer. send the coordinates and time"
      ],
      corporate: (subject, raw, isShort) => isShort ? [
        "available after 3",
        "calendar invite sent",
        "sounds great, confirmed",
        "works on my end",
        "let's lock in 4pm"
      ] : [
        "that timing works well on my end. looking forward to catching up",
        "free after 3pm that day. i'll send over a quick calendar invite to confirm",
        "sounds great! let me know if that location still works or if another spot is easier",
        "appreciate the invite! looking forward to discussing this in person",
        "confirmed on my calendar. see you then"
      ],
      comfort: (subject, raw, isShort) => isShort ? [
        "would love that",
        "can't wait to see you",
        "so nice of you",
        "warm company",
        "really looking forward"
      ] : [
        "i would genuinely love that. it's been a while and i miss your company",
        "that sounds so relaxing and just what i needed. thank you for asking",
        "can't wait to see you and catch up properly. let's find a cozy quiet spot",
        "that means a lot, i've really wanted to catch up with you",
        "count me in, let's keep it nice and low-key"
      ],
      roast: (subject, raw, isShort) => isShort ? [
        "you paying?",
        "who else is there",
        "are you desperate",
        "miracle you're out",
        "don't be late again"
      ] : [
        "are you paying or did you invite me just to witness you forget your wallet?",
        "look at you actually socializing, who hacked your account?",
        "fine, but if you show up 30 minutes late again i'm ordering the most expensive thing on the menu",
        "i'll come, but only if you promise not to talk about your crypto or gym routine",
        "so your first five choices were busy and now you're reaching out to me? classic"
      ],
      friendly: (subject, raw, isShort) => isShort ? [
        "count me in!",
        "sounds super fun!",
        "can't wait!",
        "yes absolutely!",
        "see you then!"
      ] : [
        "that sounds like so much fun! i would love to join!",
        "yes absolutely! let me know what time works best for everyone",
        "can't wait to see you! count me in for sure",
        "sounds awesome! really looking forward to it",
        "yay! let me know the details and i'll be there!"
      ],
    }
  }
];

// Fallback pattern when no specific keyword triggers
const DEFAULT_PATTERN: EmotionPattern = {
  name: 'general',
  keywords: /.*/,
  contextReading: (subject, raw) => `They shared an update or thought and are looking for an intuitive, human reaction that matches their energy.`,
  replies: {
    casual: (subject, raw, isShort) => isShort ? [
      "honestly fair",
      "yeah that tracks",
      "no way really?",
      "tell me more",
      "that makes sense"
    ] : [
      `yeah that's actually a really good point about ${subject}`,
      `honestly that makes complete sense, didn't think about it like that`,
      `that's pretty wild to be honest, what happened next?`,
      `i hear you on that. definitely tracks with how things usually go`,
      `honestly fair enough. how are you feeling about the whole thing?`
    ],
    friendly: (subject, raw, isShort) => isShort ? [
      "that's great!",
      "thanks for sharing!",
      "so interesting!",
      "love hearing this",
      "tell me more!"
    ] : [
      `thank you for sharing that with me! that really gives great perspective on ${subject}`,
      `that is so interesting to hear! how has the rest of it been going?`,
      `i really appreciate your perspective on this, always love hearing your thoughts!`,
      `that sounds like quite an experience! hope things keep moving in a positive direction`,
      `thanks for the update! really glad you told me about this`
    ],
    corporate: (subject, raw, isShort) => isShort ? [
      "noted, thanks",
      "aligned on this",
      "makes good sense",
      "helpful context",
      "let's proceed"
    ] : [
      `that provides helpful context regarding ${subject}. thank you for sharing`,
      `understood. that aligns with our current view, and we can proceed accordingly`,
      `appreciate you flagging this. let's ensure we stay coordinated on next steps`,
      `that makes practical sense. let's keep an eye on how this develops`,
      `helpful perspective. let's touch base once you have any further details`
    ],
    comfort: (subject, raw, isShort) => isShort ? [
      "i hear you",
      "makes total sense",
      "holding space",
      "valid point",
      "here with you"
    ] : [
      `what you're saying about ${subject} makes total sense, and your thoughts are completely valid`,
      `i really hear where you're coming from. it's not always easy to put into words`,
      `thank you for opening up about this. whatever you need right now, i'm right here`,
      `that's a lot to process. take your time and don't feel rushed to figure it out`,
      `i appreciate you trusting me with that. here whenever you want to talk more`
    ],
    funny: (subject, raw, isShort) => isShort ? [
      "plot twist truly",
      "unhinged energy",
      "not you doing that",
      "the audacity",
      "i'm logging off"
    ] : [
      `okay but why is ${subject} literally the most chaotic thing I've heard today?`,
      `not you dropping that like it's normal conversation, i need 5 to process`,
      `the audacity of the situation, honestly. couldn't make this up if we tried`,
      `i have so many questions and every single one starts with 'why'`,
      `truly unhinged behavior and honestly i kind of respect the commitment`
    ],
    witty: (subject, raw, isShort) => isShort ? [
      "sharp observation",
      "checks out logically",
      "subtle chaos",
      "classic development",
      "clean rationale"
    ] : [
      `that's either remarkably perceptive or brilliantly chaotic. maybe both`,
      `the logic holds up even if the universe refuses to cooperate with it`,
      `an astute observation regarding ${subject}. few people actually catch that nuance`,
      `hard to argue with that rationale. well observed`,
      `a masterclass in understatement. let's see how the second act plays out`
    ],
    flirty: (subject, raw, isShort) => isShort ? [
      "you're something else",
      "fascinating you",
      "got my attention",
      "tell me more cutie",
      "smile on my face"
    ] : [
      `you really have a way of saying things that keeps my full attention`,
      `hearing your take on ${subject} is honestly pretty attractive`,
      `you're something else, aren't you? keep talking, i'm listening`,
      `you always manage to surprise me. what else are you keeping to yourself?`,
      `i could listen to you talk about this all day honestly`
    ],
    rizz: (subject, raw, isShort) => isShort ? [
      "i see your vision",
      "you're built different",
      "smooth take",
      "always on point",
      "we're on same page"
    ] : [
      `i see the vision. you always know how to read the room`,
      `you're sharp. that's exactly why i like talking to you`,
      `already ahead of the game on ${subject}. respect`,
      `makes sense. you've got that instinct that's hard to teach`,
      `we're on the same wavelength. keep going`
    ],
    roast: (subject, raw, isShort) => isShort ? [
      "groundbreaking thought",
      "did you brainstorm?",
      "bold theory lol",
      "fascinating mind",
      "you really said that"
    ] : [
      `truly a philosophical breakthrough on ${subject}. Nobel prize is in the mail`,
      `did that take all three of your active brain cells to formulate?`,
      `bold theory, completely ungrounded in reality, but bold nonetheless`,
      `fascinating. and by fascinating i mean utterly ridiculous`,
      `i'd agree with you, but then we'd both be wrong`
    ]
  }
};

export function generateMoodReplies(
  rawInput: string,
  tone: string = 'casual',
  isShort: boolean = false
): ReplyOutput {
  const message = cleanInput(rawInput);
  const subject = extractKeySubject(message);
  
  // Find matching emotion pattern
  let matchedPattern = PATTERNS.find(p => p.keywords.test(message));
  if (!matchedPattern) {
    matchedPattern = DEFAULT_PATTERN;
  }

  const normalizedTone = tone.toLowerCase().trim();
  const toneRepliesFn = matchedPattern.replies[normalizedTone] || 
    matchedPattern.replies.casual || 
    DEFAULT_PATTERN.replies.casual;

  const replies = toneRepliesFn(subject, message, isShort);
  const contextAnalysis = matchedPattern.contextReading(subject, message);

  return {
    tone: normalizedTone,
    contextAnalysis,
    replies: replies.slice(0, 5),
    engine: 'contextual-nlp'
  };
}
