#!/usr/bin/env python3
"""Generate seed_items_600.json with quality-checked English test items."""
import json, random
random.seed(42)

passages = [
    {"temp_id":"P01","title":"My Pet Cat","content":"I have a cat named Mimi. She is white and small. Mimi likes to sleep on my bed. Every morning, she wakes me up. She is hungry and wants food. I give her milk and fish. After eating, Mimi plays with a ball. She runs around the house. Sometimes she catches a mouse. At night, Mimi sits on my lap. I love my cat very much. She is my best friend.","text_type":"narrative","cefr_level":"A1","lexile_score":350,"ar_score":1.5},
    {"temp_id":"P02","title":"A Day at the Beach","content":"Last summer, my family went to the beach. We left early in the morning and drove for two hours. When we arrived, the sun was shining brightly. My brother and I ran to the water. The waves were big and fun. We played in the ocean for a long time. Mom made sandwiches for lunch. We ate them under a big umbrella. After lunch, Dad helped us build a sandcastle. It was very tall. In the afternoon, we collected seashells along the shore. I found a beautiful pink one. We went home tired but happy. It was a perfect day.","text_type":"narrative","cefr_level":"A2","lexile_score":550,"ar_score":2.5},
    {"temp_id":"P03","title":"How Plants Grow","content":"Plants need several things to grow. First, they need sunlight. The sun gives plants energy to make their food through a process called photosynthesis. Second, plants need water. Their roots absorb water from the soil. Third, plants need nutrients from the soil, such as nitrogen and phosphorus. Without these three things, plants cannot survive. A seed begins to grow when it gets enough water and warmth. First, a small root grows downward into the soil. Then, a tiny stem pushes upward toward the light. Leaves appear on the stem and begin to collect sunlight. Over time, the plant grows bigger and may produce flowers or fruit.","text_type":"expository","cefr_level":"A2","lexile_score":650,"ar_score":3.0},
    {"temp_id":"P04","title":"The Lost Puppy","content":"Emma was walking home from school when she heard a soft whimpering sound coming from behind a trash can. She looked carefully and found a small brown puppy. It was shivering and looked very hungry. Emma gently picked up the puppy and wrapped it in her jacket. She carried it home and showed it to her parents. Her mother gave the puppy some warm milk and leftover chicken. The puppy ate quickly and then fell asleep in Emma's arms. The next day, Emma put up posters around the neighborhood asking if anyone had lost a puppy. After three days, nobody had called. Emma's parents agreed to let her keep the puppy. She named him Lucky because she felt lucky to have found him.","text_type":"narrative","cefr_level":"B1","lexile_score":750,"ar_score":4.0},
    {"temp_id":"P05","title":"Recycling Matters","content":"Every year, millions of tons of waste end up in landfills around the world. Much of this waste could be recycled instead of thrown away. Recycling is the process of converting waste materials into new products. It reduces the need for raw materials, saves energy, and decreases pollution. Paper, glass, plastic, and metal are the most commonly recycled materials. For example, recycling one ton of paper saves approximately 17 trees, 7,000 gallons of water, and enough energy to power a home for six months. Despite these benefits, many people still do not recycle regularly. Some find it inconvenient, while others are unsure which items can be recycled. To address this problem, many cities have introduced single-stream recycling programs that allow residents to place all recyclable materials in one bin.","text_type":"expository","cefr_level":"B1","lexile_score":850,"ar_score":4.5},
    {"temp_id":"P06","title":"Space Exploration","content":"Since the launch of Sputnik in 1957, humanity has made remarkable progress in space exploration. The Apollo missions of the 1960s and 70s landed twelve astronauts on the Moon. The International Space Station, orbiting Earth since 1998, has hosted hundreds of astronauts from dozens of countries conducting scientific research in microgravity. More recently, private companies like SpaceX have revolutionized space travel by developing reusable rockets, significantly reducing launch costs. Mars has become the next frontier, with several nations planning manned missions within the coming decades. However, space exploration faces significant challenges including radiation exposure, the psychological effects of long-duration missions, and the enormous financial investment required. Despite these obstacles, the potential scientific discoveries and technological innovations make continued exploration worthwhile.","text_type":"expository","cefr_level":"B2","lexile_score":1000,"ar_score":6.0},
    {"temp_id":"P07","title":"Should Homework Be Abolished?","content":"The debate over homework has intensified in recent years, with educators, parents, and students holding strong opinions on both sides. Proponents argue that homework reinforces classroom learning, develops study habits, and teaches time management skills essential for academic success. Research by Cooper (2006) suggests that homework has a positive effect on achievement, particularly for older students. However, critics contend that excessive homework contributes to student stress, reduces family time, and may actually diminish enthusiasm for learning. A study published in the Journal of Educational Psychology found that students who spent more than two hours on homework per night experienced higher levels of anxiety and physical health problems. Furthermore, homework can exacerbate educational inequality, as students from disadvantaged backgrounds may lack the resources and quiet study environment available to their more privileged peers.","text_type":"argumentative","cefr_level":"B2","lexile_score":1050,"ar_score":6.5},
    {"temp_id":"P08","title":"Community Notice: Park Renovation","content":"NOTICE TO ALL RESIDENTS\n\nThe Riverside City Council is pleased to announce the renovation of Central Park, scheduled to begin on March 15 and expected to be completed by September 30.\n\nPlanned Improvements:\n- New children's playground with safety-certified equipment\n- Upgraded walking and cycling paths (2.5 km total)\n- Installation of energy-efficient LED lighting throughout the park\n- New picnic areas with barbecue facilities\n- Restored pond with improved drainage system\n\nDuring Construction:\n- The south entrance will remain open at all times\n- The north entrance will be closed March 15 - June 30\n- Temporary parking available at Elm Street lot\n\nBudget: $2.4 million (funded by municipal bonds)\n\nPublic Feedback: Attend the town hall meeting on March 1 at 7 PM, or submit comments online at www.riversidecity.gov/parkproject\n\nContact: Parks Department (555) 234-5678","text_type":"practical","cefr_level":"B1","lexile_score":800,"ar_score":4.0},
    {"temp_id":"P09","title":"The Digital Divide","content":"The term 'digital divide' refers to the gap between individuals who have access to modern information technology and those who do not. While internet penetration has increased dramatically worldwide, significant disparities persist. In developed nations, approximately 90% of households have internet access, compared to less than 20% in many developing countries. This divide has profound implications for education, economic opportunity, and social participation. During the COVID-19 pandemic, the digital divide became starkly apparent as schools shifted to remote learning. Students without reliable internet connections or appropriate devices were disproportionately affected, falling behind their connected peers. Bridging this divide requires coordinated efforts from governments, technology companies, and civil society organizations to invest in infrastructure, reduce costs, and improve digital literacy.","text_type":"expository","cefr_level":"B2","lexile_score":1050,"ar_score":6.5},
    {"temp_id":"P10","title":"Artificial Intelligence in Healthcare","content":"Artificial intelligence is transforming the healthcare industry in unprecedented ways. Machine learning algorithms can now analyze medical images with accuracy comparable to or exceeding that of experienced radiologists, enabling earlier detection of conditions such as cancer, diabetic retinopathy, and cardiovascular disease. Natural language processing systems are being deployed to extract meaningful information from clinical notes, accelerating research and improving patient care coordination. Predictive analytics models can identify patients at high risk of hospital readmission, allowing healthcare providers to intervene proactively. However, the integration of AI into healthcare raises important ethical considerations. Questions of algorithmic bias, data privacy, informed consent, and the appropriate role of human oversight remain subjects of vigorous debate. Ensuring that AI systems are transparent, equitable, and aligned with patient interests is essential for their responsible deployment in clinical settings.","text_type":"expository","cefr_level":"C1","lexile_score":1200,"ar_score":8.0},
    {"temp_id":"P11","title":"The Ethics of Genetic Engineering","content":"Advances in genetic engineering, particularly the CRISPR-Cas9 gene-editing technology, have opened remarkable possibilities while simultaneously raising profound ethical questions. On one hand, genetic engineering holds the promise of eliminating hereditary diseases, developing drought-resistant crops to address food insecurity, and creating novel therapeutic approaches for previously untreatable conditions. The successful treatment of sickle cell disease through gene therapy represents a landmark achievement that has given hope to millions of patients worldwide. On the other hand, the prospect of 'designer babies'—genetically modified to possess desired traits such as intelligence, appearance, or athletic ability—raises concerns about eugenics, social inequality, and the commodification of human life. The modification of germline cells, which pass genetic changes to future generations, is particularly controversial because the long-term consequences remain unknown. International regulatory frameworks have struggled to keep pace with the rapid technological advances, creating a patchwork of inconsistent policies across different jurisdictions.","text_type":"argumentative","cefr_level":"C1","lexile_score":1250,"ar_score":8.5},
    {"temp_id":"P12","title":"Job Application Letter","content":"Dear Hiring Manager,\n\nI am writing to express my interest in the Marketing Assistant position advertised on your company website. I recently graduated from State University with a Bachelor's degree in Business Administration, specializing in Marketing.\n\nDuring my studies, I completed a six-month internship at Digital Solutions Inc., where I assisted with social media campaigns, created content for the company blog, and analyzed customer engagement data. This experience taught me how to use marketing analytics tools effectively and work collaboratively in a fast-paced environment.\n\nI am particularly attracted to your company because of its innovative approach to sustainable marketing practices. I believe my academic background, practical experience, and enthusiasm for creative marketing strategies make me a strong candidate for this position.\n\nI have attached my resume for your review. I would welcome the opportunity to discuss how my skills and experience align with your team's needs.\n\nThank you for your consideration.\n\nSincerely,\nAlex Johnson","text_type":"practical","cefr_level":"B2","lexile_score":950,"ar_score":5.5},
]

# --- Grammar items by panel ---
grammar_items = {
    # Stage 1 Routing (spread difficulty -2.0 to 2.0)
    ("1","routing"): [
        ("She _____ a student.",{"A":"am","B":"is","C":"are","D":"be"},"B",["be-verb","present-simple"],-2.0,1.0),
        ("They _____ playing in the park.",{"A":"is","B":"am","C":"are","D":"was"},"C",["be-verb","present-continuous"],-1.8,1.1),
        ("I _____ breakfast every morning.",{"A":"have","B":"has","C":"having","D":"had"},"A",["verb-form","present-simple"],-1.5,1.2),
        ("He _____ to school by bus.",{"A":"go","B":"goes","C":"going","D":"gone"},"B",["subject-verb-agreement","present-simple"],-1.3,1.1),
        ("We _____ English on Mondays.",{"A":"study","B":"studies","C":"studying","D":"studied"},"A",["subject-verb-agreement","present-simple"],-1.0,1.2),
        ("My mother _____ delicious food.",{"A":"cook","B":"cooks","C":"cooking","D":"cooked"},"B",["subject-verb-agreement","present-simple"],-0.8,1.3),
        ("The children _____ in the garden yesterday.",{"A":"play","B":"plays","C":"played","D":"playing"},"C",["past-simple","regular-verb"],-0.5,1.2),
        ("She _____ her homework before dinner.",{"A":"finish","B":"finishes","C":"finished","D":"finishing"},"C",["past-simple","regular-verb"],-0.3,1.1),
        ("I have _____ this book twice.",{"A":"read","B":"reads","C":"reading","D":"readed"},"A",["present-perfect","irregular-verb"],0.0,1.3),
        ("If it rains, we _____ stay home.",{"A":"will","B":"would","C":"can","D":"shall"},"A",["conditional","first-conditional"],0.3,1.2),
        ("The letter _____ written by my father.",{"A":"is","B":"was","C":"were","D":"been"},"B",["passive-voice","past-simple"],0.5,1.4),
        ("She asked me where I _____.",{"A":"live","B":"lived","C":"living","D":"lives"},"B",["reported-speech","past-simple"],0.8,1.3),
        ("By next year, they _____ the project.",{"A":"complete","B":"completed","C":"will have completed","D":"completing"},"C",["future-perfect","tense"],1.0,1.5),
        ("The book, _____ was published in 2020, became a bestseller.",{"A":"that","B":"which","C":"who","D":"whom"},"B",["relative-clause","non-restrictive"],1.3,1.4),
        ("Had I known earlier, I _____ differently.",{"A":"would act","B":"would have acted","C":"will act","D":"acted"},"B",["conditional","third-conditional"],1.5,1.6),
        ("Not until the meeting ended _____ the truth.",{"A":"he realized","B":"did he realize","C":"he realizes","D":"does he realize"},"B",["inversion","negative-adverbial"],2.0,1.5),
        ("She _____ her keys somewhere in the office.",{"A":"lose","B":"loses","C":"lost","D":"losing"},"C",["past-simple","irregular-verb"],-0.6,1.2),
        ("There _____ many people at the concert.",{"A":"was","B":"were","C":"is","D":"has"},"B",["there-be","subject-verb-agreement"],-1.2,1.1),
        ("Tom is _____ than his brother.",{"A":"tall","B":"taller","C":"tallest","D":"more tall"},"B",["comparative","adjective"],-0.7,1.3),
        ("This is the _____ movie I have ever seen.",{"A":"good","B":"better","C":"best","D":"most good"},"C",["superlative","adjective"],-0.4,1.2),
        ("She _____ like chocolate ice cream.",{"A":"don't","B":"doesn't","C":"isn't","D":"hasn't"},"B",["negative","present-simple"],-1.4,1.1),
        ("_____ you ever been to Japan?",{"A":"Do","B":"Did","C":"Have","D":"Are"},"C",["present-perfect","question"],0.1,1.3),
        ("We should _____ more water every day.",{"A":"drink","B":"drinks","C":"drinking","D":"drank"},"A",["modal-verb","advice"],0.2,1.2),
        ("The students _____ working on their project right now.",{"A":"is","B":"are","C":"was","D":"were"},"B",["present-continuous","subject-verb-agreement"],-0.9,1.2),
        ("I wish I _____ fly like a bird.",{"A":"can","B":"could","C":"will","D":"would"},"B",["subjunctive","wish"],0.7,1.4),
        ("She told me that she _____ busy the next day.",{"A":"is","B":"was","C":"will be","D":"would be"},"D",["reported-speech","future-in-past"],1.2,1.5),
        ("Neither the teacher nor the students _____ aware of the change.",{"A":"was","B":"were","C":"is","D":"has been"},"B",["correlative-conjunction","agreement"],1.4,1.4),
        ("_____ having breakfast, she left for work.",{"A":"Before","B":"After","C":"While","D":"During"},"B",["participle-clause","time"],0.4,1.2),
        ("He ran fast _____ he could catch the bus.",{"A":"so that","B":"because","C":"although","D":"unless"},"A",["purpose-clause","conjunction"],0.6,1.3),
        ("The teacher made the students _____ the essay again.",{"A":"write","B":"to write","C":"writing","D":"wrote"},"A",["causative","bare-infinitive"],0.9,1.4),
    ],
    # Stage 2 Low (difficulty -2.5 to -0.5, CEFR A1-A2)
    ("2","low"): [
        ("The cat _____ on the sofa.",{"A":"sit","B":"sits","C":"sitting","D":"sat"},"B",["present-simple","subject-verb-agreement"],-2.2,1.0),
        ("I _____ not like spinach.",{"A":"do","B":"does","C":"am","D":"have"},"A",["negative","present-simple"],-2.0,1.1),
        ("_____ is your name?",{"A":"Who","B":"What","C":"Where","D":"When"},"B",["question-word","basic"],-2.3,0.9),
        ("She _____ a red dress today.",{"A":"wear","B":"wears","C":"is wearing","D":"worn"},"C",["present-continuous","action"],-1.8,1.2),
        ("We _____ to the zoo last Sunday.",{"A":"go","B":"goes","C":"went","D":"going"},"C",["past-simple","irregular-verb"],-1.5,1.1),
        ("There _____ a book on the table.",{"A":"is","B":"are","C":"am","D":"be"},"A",["there-be","singular"],-2.4,0.9),
        ("My father _____ a doctor.",{"A":"am","B":"is","C":"are","D":"be"},"B",["be-verb","present-simple"],-2.5,0.8),
        ("They _____ soccer after school.",{"A":"play","B":"plays","C":"playing","D":"played"},"A",["present-simple","plural-subject"],-1.9,1.0),
        ("I can _____ a bicycle.",{"A":"ride","B":"rides","C":"riding","D":"rode"},"A",["modal-verb","ability"],-1.7,1.1),
        ("She _____ her teeth every night.",{"A":"brush","B":"brushes","C":"brushing","D":"brushed"},"B",["present-simple","third-person"],-1.6,1.2),
        ("The dog is _____ in the yard.",{"A":"run","B":"runs","C":"running","D":"ran"},"C",["present-continuous","action"],-1.4,1.1),
        ("We _____ a great time at the party.",{"A":"have","B":"has","C":"had","D":"having"},"C",["past-simple","irregular-verb"],-1.0,1.2),
        ("He _____ his room every Saturday.",{"A":"clean","B":"cleans","C":"cleaning","D":"cleaned"},"B",["present-simple","routine"],-1.3,1.1),
        ("_____ you like pizza?",{"A":"Do","B":"Does","C":"Are","D":"Is"},"A",["question","present-simple"],-1.8,1.0),
        ("The birds _____ singing in the morning.",{"A":"is","B":"are","C":"was","D":"am"},"B",["present-continuous","plural"],-1.6,1.1),
        ("I _____ to music every evening.",{"A":"listen","B":"listens","C":"listening","D":"listened"},"A",["present-simple","first-person"],-1.9,1.0),
        ("She _____ a picture yesterday.",{"A":"draw","B":"draws","C":"drew","D":"drawing"},"C",["past-simple","irregular-verb"],-0.8,1.3),
        ("This apple is _____ than that one.",{"A":"big","B":"bigger","C":"biggest","D":"more big"},"B",["comparative","adjective"],-0.7,1.2),
        ("The movie was very _____.",{"A":"interest","B":"interested","C":"interesting","D":"interests"},"C",["adjective","participle"],-0.6,1.3),
        ("Look! It _____ raining outside.",{"A":"is","B":"are","C":"was","D":"were"},"A",["present-continuous","weather"],-1.2,1.1),
    ],
    # Stage 2 Medium (difficulty -0.5 to 1.0, CEFR B1-B2)
    ("2","medium"): [
        ("If I had more money, I _____ a new car.",{"A":"buy","B":"will buy","C":"would buy","D":"bought"},"C",["conditional","second-conditional"],0.0,1.3),
        ("She has been living here _____ 2015.",{"A":"for","B":"since","C":"from","D":"during"},"B",["present-perfect-continuous","preposition"],-0.3,1.2),
        ("The report must _____ by Friday.",{"A":"finish","B":"finished","C":"be finished","D":"finishing"},"C",["passive-voice","modal"],0.2,1.4),
        ("I wish I _____ more time to travel.",{"A":"have","B":"had","C":"has","D":"having"},"B",["subjunctive","wish"],-0.1,1.3),
        ("He suggested that we _____ early.",{"A":"leave","B":"left","C":"leaving","D":"leaves"},"A",["subjunctive","suggestion"],0.5,1.4),
        ("The house _____ they bought last year is beautiful.",{"A":"who","B":"which","C":"where","D":"when"},"B",["relative-clause","object"],0.1,1.2),
        ("By the time we arrived, the movie _____.",{"A":"started","B":"starts","C":"had started","D":"has started"},"C",["past-perfect","sequence"],0.3,1.5),
        ("She is used to _____ early in the morning.",{"A":"wake","B":"waking","C":"woke","D":"waken"},"B",["gerund","be-used-to"],0.4,1.3),
        ("_____ the heavy rain, the match continued.",{"A":"Although","B":"Because","C":"Despite","D":"However"},"C",["preposition","contrast"],0.0,1.3),
        ("He denied _____ the window.",{"A":"break","B":"breaking","C":"to break","D":"broke"},"B",["gerund","verb-pattern"],0.2,1.4),
        ("We have lived in this city _____ ten years.",{"A":"for","B":"since","C":"during","D":"while"},"A",["present-perfect","duration"],-0.4,1.2),
        ("You had better _____ a doctor about that cough.",{"A":"see","B":"seeing","C":"to see","D":"seen"},"A",["modal","advice"],0.1,1.3),
        ("Not only did she win the race, _____ she broke the record.",{"A":"and","B":"but","C":"so","D":"or"},"B",["correlative-conjunction","emphasis"],0.6,1.4),
        ("The children were excited about _____ to the amusement park.",{"A":"go","B":"going","C":"went","D":"gone"},"B",["gerund","preposition-complement"],0.0,1.2),
        ("I would rather _____ at home than go to the party.",{"A":"stay","B":"staying","C":"stayed","D":"to stay"},"A",["modal","preference"],0.3,1.3),
        ("The teacher asked us _____ our phones off.",{"A":"turn","B":"turning","C":"to turn","D":"turned"},"C",["infinitive","verb-pattern"],0.1,1.2),
        ("_____ I was young, I used to play in the fields.",{"A":"While","B":"When","C":"During","D":"As soon as"},"B",["time-clause","past-habit"],-0.2,1.2),
        ("She is looking forward to _____ you again.",{"A":"see","B":"seeing","C":"seen","D":"saw"},"B",["gerund","phrasal-verb"],0.2,1.3),
        ("The problem is too difficult for me _____.",{"A":"solve","B":"solving","C":"to solve","D":"solved"},"C",["infinitive","too-to"],0.4,1.3),
        ("He speaks English as _____ as his teacher.",{"A":"good","B":"well","C":"better","D":"best"},"B",["adverb","comparison"],0.5,1.4),
    ],
    # Stage 2 High (difficulty 1.0 to 3.0, CEFR C1-C2)
    ("2","high"): [
        ("Scarcely had he arrived _____ it started to rain.",{"A":"when","B":"than","C":"before","D":"after"},"A",["inversion","scarcely-when"],1.2,1.5),
        ("The proposal, controversial _____ it was, received unanimous support.",{"A":"as","B":"though","C":"while","D":"since"},"B",["concessive-clause","inversion"],1.5,1.6),
        ("It is imperative that he _____ on time.",{"A":"arrives","B":"arrive","C":"arrived","D":"arriving"},"B",["subjunctive","mandate"],1.3,1.5),
        ("Were it not for her help, I _____ have succeeded.",{"A":"wouldn't","B":"couldn't","C":"shouldn't","D":"won't"},"A",["conditional","inverted-third"],1.8,1.6),
        ("The extent _____ technology has changed our lives is remarkable.",{"A":"to that","B":"to which","C":"at which","D":"in that"},"B",["relative-clause","preposition"],1.0,1.4),
        ("No sooner had the concert begun _____ the power went out.",{"A":"when","B":"than","C":"before","D":"that"},"B",["inversion","no-sooner-than"],1.4,1.5),
        ("He spoke with such eloquence _____ everyone was moved.",{"A":"which","B":"what","C":"that","D":"as"},"C",["result-clause","such-that"],1.1,1.4),
        ("Little _____ he know what was about to happen.",{"A":"does","B":"did","C":"had","D":"was"},"B",["inversion","negative-adverb"],1.6,1.5),
        ("The project is expected _____ by the end of the quarter.",{"A":"to complete","B":"completing","C":"to be completed","D":"being completed"},"C",["passive-infinitive","expectation"],1.2,1.5),
        ("So absorbed was she in her work _____ she forgot to eat.",{"A":"which","B":"what","C":"that","D":"as"},"C",["inversion","so-adjective"],1.7,1.6),
        ("_____ his lack of experience, he handled the crisis well.",{"A":"Despite","B":"Although","C":"However","D":"Nevertheless"},"A",["concession","preposition"],1.0,1.4),
        ("The results, _____ somewhat surprising, were statistically significant.",{"A":"despite","B":"albeit","C":"although","D":"however"},"B",["concession","formal-connector"],1.9,1.5),
        ("She would sooner resign _____ compromise her principles.",{"A":"than","B":"that","C":"to","D":"as"},"A",["preference","sooner-than"],1.3,1.5),
        ("Under no circumstances _____ the confidential data be shared.",{"A":"should","B":"shall","C":"would","D":"could"},"A",["inversion","prohibition"],1.5,1.6),
        ("The theory _____ which this research is based has been widely criticized.",{"A":"on","B":"in","C":"to","D":"by"},"A",["relative-clause","stranded-preposition"],1.1,1.4),
        ("Rarely _____ such a talented musician performed at this venue.",{"A":"have","B":"has","C":"had","D":"is"},"B",["inversion","rarely"],1.6,1.5),
        ("It was not until midnight _____ the negotiations concluded.",{"A":"when","B":"that","C":"which","D":"where"},"B",["cleft-sentence","emphasis"],1.4,1.5),
        ("Much _____ I admire her dedication, I disagree with her approach.",{"A":"though","B":"as","C":"like","D":"so"},"B",["concession","much-as"],2.0,1.6),
        ("The committee recommended that the policy _____ immediately.",{"A":"implements","B":"implemented","C":"be implemented","D":"implementing"},"C",["subjunctive","passive"],1.7,1.6),
        ("_____ it not been for the timely intervention, the outcome would have been disastrous.",{"A":"Had","B":"Should","C":"Were","D":"Could"},"A",["conditional","inverted-third"],1.8,1.7),
    ],
    # Stage 3 Low (difficulty -2.5 to -0.5)
    ("3","low"): [
        ("She _____ her mother every weekend.",{"A":"visit","B":"visits","C":"visiting","D":"visited"},"B",["present-simple","third-person"],-2.0,1.1),
        ("We _____ not see the movie yesterday.",{"A":"do","B":"does","C":"did","D":"are"},"C",["past-simple","negative"],-1.8,1.0),
        ("The baby _____ right now.",{"A":"sleep","B":"sleeps","C":"sleeping","D":"is sleeping"},"D",["present-continuous","action"],-1.5,1.2),
        ("My sister _____ tennis well.",{"A":"play","B":"plays","C":"playing","D":"played"},"B",["present-simple","ability"],-1.7,1.1),
        ("He _____ a new bicycle for his birthday.",{"A":"get","B":"gets","C":"got","D":"getting"},"C",["past-simple","irregular-verb"],-1.3,1.2),
        ("_____ are two apples on the table.",{"A":"There","B":"These","C":"Those","D":"They"},"A",["there-be","existential"],-2.2,0.9),
        ("I _____ do my homework after dinner.",{"A":"usual","B":"usually","C":"use","D":"used"},"B",["adverb","frequency"],-1.6,1.1),
        ("The flowers are very _____.",{"A":"beauty","B":"beautiful","C":"beautifully","D":"beautify"},"B",["adjective","word-form"],-1.0,1.2),
        ("She _____ to the library every Wednesday.",{"A":"go","B":"goes","C":"going","D":"gone"},"B",["present-simple","routine"],-1.4,1.1),
        ("He can _____ three languages.",{"A":"speak","B":"speaks","C":"speaking","D":"spoke"},"A",["modal-verb","ability"],-1.2,1.2),
        ("The weather _____ very cold last winter.",{"A":"is","B":"was","C":"were","D":"are"},"B",["past-simple","be-verb"],-1.9,1.0),
        ("_____ do you go to school?",{"A":"What","B":"When","C":"How","D":"Who"},"C",["question-word","manner"],-1.1,1.1),
        ("My friends _____ coming to the party tonight.",{"A":"is","B":"am","C":"are","D":"was"},"C",["present-continuous","plural"],-1.5,1.1),
        ("I _____ a letter to my grandma last week.",{"A":"write","B":"writes","C":"wrote","D":"writing"},"C",["past-simple","irregular-verb"],-0.9,1.3),
        ("She is the _____ girl in the class.",{"A":"smart","B":"smarter","C":"smartest","D":"more smart"},"C",["superlative","adjective"],-0.7,1.2),
        ("They have _____ finished their lunch.",{"A":"yet","B":"already","C":"still","D":"never"},"B",["present-perfect","adverb"],-0.6,1.3),
        ("We need _____ buy some milk.",{"A":"for","B":"at","C":"to","D":"of"},"C",["infinitive","purpose"],-1.8,1.0),
        ("The cat is sleeping _____ the bed.",{"A":"in","B":"on","C":"at","D":"under"},"D",["preposition","location"],-2.1,1.0),
    ],
    # Stage 3 Medium (difficulty -0.5 to 1.0)
    ("3","medium"): [
        ("She _____ been waiting for an hour when the bus finally came.",{"A":"has","B":"had","C":"have","D":"was"},"B",["past-perfect-continuous","duration"],0.0,1.3),
        ("I _____ to Paris three times since 2010.",{"A":"go","B":"went","C":"have been","D":"had been"},"C",["present-perfect","experience"],-0.3,1.2),
        ("He apologized for _____ late to the meeting.",{"A":"be","B":"being","C":"been","D":"to be"},"B",["gerund","preposition-complement"],0.1,1.3),
        ("The shoes _____ I bought online were too small.",{"A":"who","B":"which","C":"where","D":"whose"},"B",["relative-clause","object"],-0.2,1.2),
        ("You should avoid _____ too much sugar.",{"A":"eat","B":"to eat","C":"eating","D":"eaten"},"C",["gerund","verb-pattern"],0.0,1.3),
        ("If she _____ studied harder, she would have passed.",{"A":"has","B":"had","C":"have","D":"would"},"B",["conditional","third-conditional"],0.5,1.4),
        ("The manager insisted _____ seeing the report immediately.",{"A":"at","B":"in","C":"on","D":"for"},"C",["phrasal-verb","preposition"],0.3,1.3),
        ("She speaks French _____ than her sister.",{"A":"more fluent","B":"more fluently","C":"most fluently","D":"fluenter"},"B",["comparative","adverb"],0.2,1.3),
        ("They haven't decided _____ to go on vacation.",{"A":"where","B":"what","C":"which","D":"how"},"A",["indirect-question","wh-word"],-0.1,1.2),
        ("He is known _____ his generosity.",{"A":"by","B":"with","C":"for","D":"to"},"C",["adjective-preposition","collocation"],0.1,1.3),
        ("By this time next year, I _____ graduated.",{"A":"will","B":"will have","C":"would","D":"have"},"B",["future-perfect","prediction"],0.4,1.4),
        ("_____ he was tired, he continued working.",{"A":"Because","B":"Although","C":"Unless","D":"If"},"B",["concession","conjunction"],0.0,1.2),
        ("She made her children _____ their vegetables.",{"A":"eat","B":"to eat","C":"eating","D":"ate"},"A",["causative","make"],0.3,1.3),
        ("The book is worth _____.",{"A":"read","B":"reading","C":"to read","D":"reads"},"B",["gerund","worth"],0.5,1.4),
        ("He acted as if nothing _____.",{"A":"happens","B":"happened","C":"had happened","D":"has happened"},"C",["subjunctive","as-if"],0.7,1.4),
        ("I'd rather you _____ smoke in here.",{"A":"don't","B":"didn't","C":"won't","D":"not"},"B",["subjunctive","rather"],0.6,1.4),
        ("The test was _____ difficult than I expected.",{"A":"much","B":"more","C":"most","D":"many"},"B",["comparative","adjective"],0.0,1.2),
        ("She needs to have her car _____.",{"A":"repair","B":"repaired","C":"repairing","D":"repairs"},"B",["causative","have-something-done"],0.8,1.4),
    ],
    # Stage 3 High (difficulty 1.0 to 3.0)
    ("3","high"): [
        ("Only after extensive deliberation _____ the committee reach a consensus.",{"A":"does","B":"did","C":"had","D":"was"},"B",["inversion","only-after"],1.5,1.6),
        ("The phenomenon, _____ perplexing to researchers, defied conventional explanation.",{"A":"however","B":"albeit","C":"despite being","D":"notwithstanding"},"B",["concession","formal"],1.8,1.5),
        ("So intricate were the negotiations _____ they lasted three months.",{"A":"which","B":"that","C":"as","D":"while"},"B",["inversion","so-adjective"],1.6,1.6),
        ("_____ for the intervention of the mediator, the dispute would have escalated.",{"A":"But","B":"Unless","C":"Without","D":"Apart"},"A",["conditional","but-for"],2.0,1.7),
        ("The evidence, compelling _____ it may seem, remains inconclusive.",{"A":"though","B":"as","C":"however","D":"despite"},"B",["concession","as-inversion"],2.2,1.6),
        ("It is high time the government _____ action on climate change.",{"A":"takes","B":"took","C":"take","D":"has taken"},"B",["subjunctive","high-time"],1.3,1.5),
        ("Never before _____ the company faced such a significant challenge.",{"A":"has","B":"had","C":"have","D":"did"},"B",["inversion","never-before"],1.4,1.5),
        ("The researcher's findings lend _____ to the hypothesis that early intervention is effective.",{"A":"credence","B":"evidence","C":"proof","D":"weight"},"A",["collocation","academic"],2.5,1.6),
        ("_____ the circumstances, we had no choice but to postpone the launch.",{"A":"Owing","B":"Given","C":"Regarding","D":"Concerning"},"B",["formal-preposition","context"],1.2,1.4),
        ("The correlation between the variables _____ to be statistically insignificant.",{"A":"proved","B":"proven","C":"proving","D":"proves"},"A",["verb-form","academic-register"],1.1,1.4),
        ("Were the proposal _____, it would fundamentally alter the regulatory landscape.",{"A":"to be adopted","B":"adopted","C":"adopting","D":"be adopted"},"A",["conditional","subjunctive-passive"],2.3,1.7),
        ("The findings are consistent with _____ of previous studies.",{"A":"that","B":"those","C":"these","D":"them"},"B",["pronoun","demonstrative-reference"],1.0,1.4),
        ("Such was the magnitude of the crisis _____ emergency measures were enacted immediately.",{"A":"which","B":"that","C":"as","D":"when"},"B",["inversion","such-was"],1.7,1.6),
        ("The regulation notwithstanding, several companies continued to _____ the standards.",{"A":"flout","B":"flaunt","C":"follow","D":"flog"},"A",["vocabulary-grammar","commonly-confused"],2.1,1.5),
        ("By no means _____ the results be interpreted as definitive.",{"A":"can","B":"should","C":"would","D":"might"},"B",["inversion","prohibition"],1.5,1.5),
        ("The minister, _____ had been expected, tendered her resignation.",{"A":"which","B":"as","C":"that","D":"what"},"B",["relative-clause","as-expected"],1.9,1.6),
        ("Not only _____ the proposal lack feasibility, it also ignored ethical considerations.",{"A":"does","B":"did","C":"had","D":"was"},"B",["inversion","not-only"],1.4,1.5),
        ("It remains to be seen _____ the policy will achieve its intended objectives.",{"A":"that","B":"whether","C":"if","D":"how"},"B",["noun-clause","formal"],1.3,1.5),
    ],
}

# --- Vocabulary items by panel ---
vocab_items = {
    ("1","routing"): [
        ("What does 'happy' mean?",{"A":"Feeling sad","B":"Feeling pleased","C":"Feeling angry","D":"Feeling tired"},"B",["definition","emotion","1k"],-2.0,1.0),
        ("Choose the word that means 'large'.",{"A":"Tiny","B":"Small","C":"Big","D":"Short"},"C",["synonym","size","1k"],-1.8,1.1),
        ("What is the opposite of 'hot'?",{"A":"Warm","B":"Cool","C":"Cold","D":"Mild"},"C",["antonym","temperature","1k"],-1.6,1.0),
        ("'Brave' means _____.",{"A":"afraid","B":"courageous","C":"careful","D":"careless"},"B",["definition","character","2k"],-1.0,1.2),
        ("A person who writes books is called a(n) _____.",{"A":"artist","B":"author","C":"actor","D":"architect"},"B",["definition","occupation","2k"],-0.8,1.2),
        ("The word 'ancient' means _____.",{"A":"modern","B":"recent","C":"very old","D":"brand new"},"C",["definition","time","3k"],-0.3,1.3),
        ("Choose the synonym of 'purchase'.",{"A":"sell","B":"buy","C":"rent","D":"borrow"},"B",["synonym","commerce","3k"],0.0,1.3),
        ("The word 'seldom' is closest in meaning to _____.",{"A":"always","B":"often","C":"rarely","D":"usually"},"C",["synonym","frequency","4k"],0.3,1.4),
        ("What does 'ambiguous' mean?",{"A":"Clear","B":"Uncertain","C":"Definite","D":"Simple"},"B",["definition","abstract","5k"],0.7,1.4),
        ("'Inevitable' means something that is _____.",{"A":"avoidable","B":"impossible","C":"certain to happen","D":"unlikely"},"C",["definition","abstract","5k"],0.5,1.3),
        ("Choose the word closest in meaning to 'benevolent'.",{"A":"Hostile","B":"Kind","C":"Strict","D":"Neutral"},"B",["synonym","character","6k"],1.0,1.5),
        ("'Pragmatic' means _____.",{"A":"idealistic","B":"theoretical","C":"practical","D":"emotional"},"C",["definition","approach","7k"],1.3,1.5),
        ("The word 'ubiquitous' means _____.",{"A":"rare","B":"unique","C":"everywhere","D":"hidden"},"C",["definition","frequency","8k"],1.5,1.5),
        ("Choose the synonym of 'scrutinize'.",{"A":"Ignore","B":"Glance","C":"Examine closely","D":"Summarize"},"C",["synonym","action","7k"],1.2,1.5),
        ("'Ephemeral' means _____.",{"A":"Permanent","B":"Lasting","C":"Short-lived","D":"Endless"},"C",["definition","duration","9k"],1.8,1.6),
        ("What does 'fast' mean in this sentence: 'She held fast to the rope'?",{"A":"quickly","B":"firmly","C":"loosely","D":"briefly"},"B",["polysemy","adverb","2k"],-0.5,1.3),
        ("A 'decade' refers to a period of _____.",{"A":"100 years","B":"50 years","C":"10 years","D":"5 years"},"C",["definition","time","3k"],-0.2,1.2),
        ("'Reluctant' means _____.",{"A":"eager","B":"willing","C":"unwilling","D":"excited"},"C",["definition","attitude","5k"],0.4,1.3),
        ("Choose the word that does NOT belong: apple, banana, carrot, grape.",{"A":"apple","B":"banana","C":"carrot","D":"grape"},"C",["categorization","food","1k"],-1.3,1.1),
        ("The word 'versatile' means _____.",{"A":"limited","B":"rigid","C":"adaptable","D":"fragile"},"C",["definition","quality","6k"],0.8,1.4),
        ("'Plethora' means _____.",{"A":"scarcity","B":"abundance","C":"balance","D":"absence"},"B",["definition","quantity","8k"],1.6,1.5),
        ("Choose the antonym of 'transparent'.",{"A":"Clear","B":"Obvious","C":"Opaque","D":"Visible"},"C",["antonym","quality","4k"],0.2,1.3),
        ("'Diminish' means to _____.",{"A":"increase","B":"maintain","C":"decrease","D":"stabilize"},"C",["definition","change","4k"],0.1,1.3),
        ("What does 'curious' mean?",{"A":"Bored","B":"Eager to know","C":"Afraid","D":"Lazy"},"B",["definition","attitude","2k"],-1.2,1.1),
        ("A 'peninsula' is _____.",{"A":"an island","B":"a mountain","C":"land surrounded by water on three sides","D":"a deep valley"},"C",["definition","geography","4k"],0.6,1.4),
        ("'Meticulous' means _____.",{"A":"careless","B":"average","C":"very careful and precise","D":"quick"},"C",["definition","quality","7k"],1.1,1.5),
        ("Choose the synonym of 'enhance'.",{"A":"reduce","B":"destroy","C":"improve","D":"maintain"},"C",["synonym","change","5k"],0.4,1.3),
        ("'Nostalgia' refers to _____.",{"A":"fear of the future","B":"a longing for the past","C":"excitement about change","D":"confusion about the present"},"B",["definition","emotion","6k"],0.9,1.4),
        ("The word 'obsolete' means _____.",{"A":"modern","B":"trendy","C":"no longer in use","D":"expensive"},"C",["definition","status","6k"],0.7,1.4),
        ("'Alleviate' means to _____.",{"A":"worsen","B":"cause","C":"relieve","D":"ignore"},"C",["definition","action","7k"],1.0,1.5),
    ],
    ("2","low"): [
        ("What does 'friend' mean?",{"A":"A person you dislike","B":"A person you know and like","C":"A stranger","D":"A teacher"},"B",["definition","social","1k"],-2.3,0.9),
        ("Choose the word that means 'small'.",{"A":"Huge","B":"Large","C":"Tiny","D":"Wide"},"C",["synonym","size","1k"],-2.1,1.0),
        ("What is the opposite of 'dark'?",{"A":"Heavy","B":"Light","C":"Deep","D":"Thick"},"B",["antonym","quality","1k"],-2.0,1.0),
        ("A 'dentist' is a person who _____.",{"A":"teaches children","B":"fixes cars","C":"takes care of teeth","D":"cooks food"},"C",["definition","occupation","2k"],-1.5,1.1),
        ("'Cloudy' means the sky has many _____.",{"A":"stars","B":"clouds","C":"birds","D":"planes"},"B",["definition","weather","1k"],-2.2,0.9),
        ("Choose the word that does NOT belong: red, blue, table, green.",{"A":"red","B":"blue","C":"table","D":"green"},"C",["categorization","odd-one-out","1k"],-1.8,1.0),
        ("What does 'beautiful' mean?",{"A":"Ugly","B":"Very pretty","C":"Very fast","D":"Very small"},"B",["definition","appearance","1k"],-2.0,1.0),
        ("A 'library' is a place where you _____.",{"A":"buy food","B":"borrow books","C":"watch movies","D":"play sports"},"B",["definition","place","2k"],-1.7,1.1),
        ("'Delicious' means _____.",{"A":"very bad tasting","B":"very good tasting","C":"very hot","D":"very cold"},"B",["definition","taste","2k"],-1.6,1.1),
        ("The opposite of 'cheap' is _____.",{"A":"free","B":"expensive","C":"small","D":"old"},"B",["antonym","cost","2k"],-1.3,1.2),
        ("'Careful' means _____.",{"A":"paying close attention","B":"being very fast","C":"being very loud","D":"feeling very hungry"},"A",["definition","behavior","2k"],-1.4,1.1),
        ("A 'vegetable' is a type of _____.",{"A":"animal","B":"drink","C":"plant food","D":"tool"},"C",["definition","food","1k"],-2.1,0.9),
        ("What does 'quiet' mean?",{"A":"Very loud","B":"Making little noise","C":"Very fast","D":"Very bright"},"B",["definition","sound","1k"],-2.0,1.0),
        ("Choose the synonym of 'begin'.",{"A":"End","B":"Stop","C":"Start","D":"Finish"},"C",["synonym","action","1k"],-1.9,1.0),
        ("An 'island' is _____.",{"A":"a big city","B":"land surrounded by water","C":"a tall mountain","D":"a wide river"},"B",["definition","geography","2k"],-1.2,1.2),
        ("'Brave' means not feeling _____.",{"A":"happy","B":"tired","C":"afraid","D":"hungry"},"C",["definition","emotion","2k"],-1.0,1.2),
        ("The word 'gentle' means _____.",{"A":"rough","B":"soft and kind","C":"fast","D":"heavy"},"B",["definition","manner","2k"],-0.8,1.2),
        ("Choose the antonym of 'open'.",{"A":"Wide","B":"Closed","C":"Big","D":"Full"},"B",["antonym","state","1k"],-2.0,1.0),
        ("A 'recipe' tells you how to _____.",{"A":"draw a picture","B":"cook food","C":"build a house","D":"fix a car"},"B",["definition","instruction","3k"],-0.7,1.3),
        ("'Enormous' means very _____.",{"A":"small","B":"thin","C":"large","D":"short"},"C",["definition","size","3k"],-0.5,1.2),
    ],
    ("2","medium"): [
        ("Choose the synonym of 'accomplish'.",{"A":"fail","B":"achieve","C":"attempt","D":"abandon"},"B",["synonym","action","4k"],0.0,1.3),
        ("'Fascinating' means _____.",{"A":"boring","B":"ordinary","C":"extremely interesting","D":"frightening"},"C",["definition","quality","4k"],-0.2,1.2),
        ("The word 'conflict' means _____.",{"A":"agreement","B":"peace","C":"a disagreement or fight","D":"cooperation"},"C",["definition","social","3k"],-0.4,1.2),
        ("'Magnificent' means _____.",{"A":"terrible","B":"ordinary","C":"very impressive","D":"very small"},"C",["definition","quality","5k"],0.2,1.3),
        ("Choose the antonym of 'generous'.",{"A":"Kind","B":"Selfish","C":"Wealthy","D":"Humble"},"B",["antonym","character","4k"],0.0,1.3),
        ("'Consequently' means _____.",{"A":"before that","B":"despite that","C":"as a result","D":"in addition"},"C",["definition","connector","5k"],0.3,1.4),
        ("An 'obstacle' is something that _____.",{"A":"helps you","B":"blocks your way","C":"guides you","D":"supports you"},"B",["definition","abstract","4k"],0.1,1.3),
        ("'Vast' means _____.",{"A":"narrow","B":"tiny","C":"extremely large","D":"deep"},"C",["synonym","size","4k"],-0.1,1.2),
        ("Choose the word closest to 'peculiar'.",{"A":"Normal","B":"Common","C":"Strange","D":"Beautiful"},"C",["synonym","quality","5k"],0.2,1.3),
        ("'Innovation' means _____.",{"A":"a new idea or method","B":"an old tradition","C":"a common practice","D":"a simple task"},"A",["definition","abstract","5k"],0.4,1.4),
        ("The word 'anticipate' means to _____.",{"A":"remember","B":"forget","C":"expect","D":"ignore"},"C",["definition","cognition","5k"],0.3,1.3),
        ("'Substantial' means _____.",{"A":"minor","B":"significant and large","C":"invisible","D":"temporary"},"B",["definition","quantity","5k"],0.5,1.4),
        ("Choose the synonym of 'demonstrate'.",{"A":"Hide","B":"Show","C":"Deny","D":"Forget"},"B",["synonym","action","4k"],0.0,1.3),
        ("'Optimistic' means _____.",{"A":"expecting bad outcomes","B":"not caring","C":"expecting good outcomes","D":"being confused"},"C",["definition","attitude","5k"],0.1,1.3),
        ("An 'epidemic' is _____.",{"A":"a type of medicine","B":"a widespread disease outbreak","C":"a medical tool","D":"a health benefit"},"B",["definition","health","5k"],0.4,1.4),
        ("'Compromise' means to _____.",{"A":"win completely","B":"give up entirely","C":"find a middle ground","D":"ignore the problem"},"C",["definition","social","4k"],0.2,1.3),
        ("The word 'diligent' means _____.",{"A":"lazy","B":"hardworking","C":"careless","D":"impatient"},"B",["definition","character","6k"],0.6,1.4),
        ("Choose the antonym of 'expand'.",{"A":"Grow","B":"Stretch","C":"Contract","D":"Develop"},"C",["antonym","change","4k"],0.1,1.3),
        ("'Vulnerable' means _____.",{"A":"strong","B":"protected","C":"easily harmed","D":"invisible"},"C",["definition","state","5k"],0.5,1.4),
        ("'Hypothesis' means _____.",{"A":"a proven fact","B":"an educated guess","C":"a final conclusion","D":"a complete answer"},"B",["definition","science","6k"],0.7,1.4),
    ],
    ("2","high"): [
        ("'Ambivalent' means _____.",{"A":"certain","B":"having mixed feelings","C":"enthusiastic","D":"indifferent"},"B",["definition","emotion","8k"],1.2,1.5),
        ("Choose the synonym of 'exacerbate'.",{"A":"Improve","B":"Worsen","C":"Maintain","D":"Explain"},"B",["synonym","change","8k"],1.5,1.5),
        ("'Paradigm' means _____.",{"A":"a small detail","B":"a model or pattern","C":"an error","D":"a contradiction"},"B",["definition","academic","9k"],1.8,1.6),
        ("The word 'surreptitious' means _____.",{"A":"open","B":"honest","C":"secret and stealthy","D":"loud"},"C",["definition","manner","9k"],2.0,1.6),
        ("'Mitigate' means to _____.",{"A":"intensify","B":"make less severe","C":"eliminate","D":"create"},"B",["definition","action","7k"],1.0,1.4),
        ("Choose the antonym of 'verbose'.",{"A":"Talkative","B":"Lengthy","C":"Concise","D":"Detailed"},"C",["antonym","communication","8k"],1.3,1.5),
        ("'Juxtapose' means to _____.",{"A":"separate widely","B":"place side by side for comparison","C":"combine into one","D":"remove entirely"},"B",["definition","academic","9k"],1.7,1.6),
        ("The word 'perfunctory' means _____.",{"A":"thorough","B":"careful","C":"done without care or interest","D":"passionate"},"C",["definition","manner","9k"],2.2,1.6),
        ("'Tenacious' means _____.",{"A":"weak","B":"giving up easily","C":"persistent and determined","D":"flexible"},"C",["definition","character","8k"],1.4,1.5),
        ("Choose the synonym of 'proliferate'.",{"A":"Decrease","B":"Spread rapidly","C":"Stabilize","D":"Disappear"},"B",["synonym","change","8k"],1.5,1.5),
        ("'Dichotomy' means _____.",{"A":"agreement","B":"a division into two contrasting parts","C":"a similarity","D":"a gradual change"},"B",["definition","abstract","9k"],1.9,1.6),
        ("The word 'capricious' means _____.",{"A":"steady","B":"predictable","C":"changeable and unpredictable","D":"careful"},"C",["definition","character","9k"],2.1,1.6),
        ("'Empirical' means based on _____.",{"A":"theory","B":"imagination","C":"observation and experiment","D":"tradition"},"C",["definition","academic","7k"],1.1,1.5),
        ("Choose the synonym of 'reticent'.",{"A":"Outgoing","B":"Reserved","C":"Aggressive","D":"Generous"},"B",["synonym","character","8k"],1.3,1.5),
        ("'Salient' means _____.",{"A":"hidden","B":"minor","C":"most noticeable or important","D":"average"},"C",["definition","quality","8k"],1.4,1.5),
        ("The word 'precipitate' (verb) means to _____.",{"A":"delay","B":"cause to happen suddenly","C":"prevent","D":"slow down"},"B",["definition","action","8k"],1.6,1.6),
        ("'Recalcitrant' means _____.",{"A":"cooperative","B":"obedient","C":"stubbornly resistant","D":"flexible"},"C",["definition","character","10k"],2.3,1.6),
        ("Choose the antonym of 'homogeneous'.",{"A":"Uniform","B":"Diverse","C":"Similar","D":"Consistent"},"B",["antonym","quality","7k"],1.2,1.5),
        ("'Predilection' means _____.",{"A":"dislike","B":"a preference or liking","C":"indifference","D":"hatred"},"B",["definition","attitude","10k"],2.0,1.6),
        ("The word 'conundrum' means _____.",{"A":"a simple answer","B":"a confusing problem","C":"a clear explanation","D":"an easy task"},"B",["definition","abstract","8k"],1.5,1.5),
    ],
    ("3","low"): [
        ("What does 'enjoy' mean?",{"A":"To dislike","B":"To get pleasure from","C":"To avoid","D":"To forget"},"B",["definition","emotion","1k"],-2.0,1.0),
        ("The opposite of 'rich' is _____.",{"A":"wealthy","B":"poor","C":"happy","D":"tall"},"B",["antonym","economic","1k"],-1.8,1.0),
        ("A 'bakery' is a place where you buy _____.",{"A":"clothes","B":"bread and cakes","C":"medicine","D":"books"},"B",["definition","place","2k"],-1.6,1.1),
        ("'Polite' means _____.",{"A":"rude","B":"having good manners","C":"very loud","D":"very fast"},"B",["definition","behavior","2k"],-1.4,1.1),
        ("Choose the synonym of 'scared'.",{"A":"Happy","B":"Brave","C":"Afraid","D":"Calm"},"C",["synonym","emotion","1k"],-1.9,1.0),
        ("What does 'temperature' mean?",{"A":"How heavy something is","B":"How hot or cold something is","C":"How long something is","D":"How fast something moves"},"B",["definition","measurement","3k"],-1.0,1.2),
        ("'Passenger' means a person who _____.",{"A":"drives a vehicle","B":"rides in a vehicle","C":"repairs a vehicle","D":"sells vehicles"},"B",["definition","transport","3k"],-0.8,1.2),
        ("Choose the antonym of 'empty'.",{"A":"Light","B":"Full","C":"Clean","D":"New"},"B",["antonym","state","1k"],-2.0,1.0),
        ("The word 'curious' means _____.",{"A":"bored","B":"eager to learn","C":"lazy","D":"afraid"},"B",["definition","attitude","2k"],-1.2,1.1),
        ("'Abroad' means _____.",{"A":"at home","B":"in a foreign country","C":"nearby","D":"indoors"},"B",["definition","location","3k"],-0.9,1.2),
        ("A 'calendar' shows _____.",{"A":"the weather","B":"dates and months","C":"a map","D":"phone numbers"},"B",["definition","object","2k"],-1.5,1.1),
        ("Choose the word that means 'to fix'.",{"A":"Break","B":"Destroy","C":"Repair","D":"Throw"},"C",["synonym","action","2k"],-1.3,1.1),
        ("'Ancient' means very _____.",{"A":"new","B":"large","C":"old","D":"fast"},"C",["definition","time","3k"],-0.7,1.2),
        ("The opposite of 'dangerous' is _____.",{"A":"Scary","B":"Safe","C":"Exciting","D":"Difficult"},"B",["antonym","safety","2k"],-1.1,1.2),
        ("'Celebrate' means to _____.",{"A":"be sad about something","B":"do something special for a happy event","C":"forget an event","D":"argue about something"},"B",["definition","action","3k"],-0.6,1.3),
        ("What does 'fragile' mean?",{"A":"Very strong","B":"Easily broken","C":"Very heavy","D":"Very large"},"B",["definition","quality","3k"],-0.5,1.2),
        ("A 'pedestrian' is a person who _____.",{"A":"drives a car","B":"walks on foot","C":"rides a bike","D":"flies a plane"},"B",["definition","transport","3k"],-0.7,1.2),
        ("'Generous' means _____.",{"A":"selfish","B":"mean","C":"willing to give","D":"shy"},"C",["definition","character","3k"],-0.8,1.2),
    ],
    ("3","medium"): [
        ("'Credible' means _____.",{"A":"unbelievable","B":"believable","C":"incredible","D":"visible"},"B",["definition","quality","5k"],0.2,1.3),
        ("Choose the synonym of 'abandon'.",{"A":"Keep","B":"Protect","C":"Desert","D":"Embrace"},"C",["synonym","action","4k"],0.0,1.3),
        ("'Legitimate' means _____.",{"A":"illegal","B":"lawful and reasonable","C":"suspicious","D":"unofficial"},"B",["definition","law","5k"],0.3,1.4),
        ("The word 'trivial' means _____.",{"A":"very important","B":"of little importance","C":"very interesting","D":"very expensive"},"B",["definition","quality","5k"],0.4,1.3),
        ("'Criteria' means _____.",{"A":"solutions","B":"problems","C":"standards for judging","D":"opinions"},"C",["definition","academic","5k"],0.5,1.4),
        ("Choose the antonym of 'artificial'.",{"A":"Fake","B":"Synthetic","C":"Natural","D":"Processed"},"C",["antonym","quality","4k"],0.1,1.3),
        ("'Elaborate' (adjective) means _____.",{"A":"simple","B":"detailed and complex","C":"basic","D":"plain"},"B",["definition","quality","5k"],0.3,1.3),
        ("The word 'predominant' means _____.",{"A":"minor","B":"most common or powerful","C":"rare","D":"equal"},"B",["definition","status","6k"],0.6,1.4),
        ("'Scrutinize' means to _____.",{"A":"glance quickly","B":"ignore completely","C":"examine very carefully","D":"describe briefly"},"C",["definition","action","7k"],0.8,1.4),
        ("Choose the synonym of 'fundamental'.",{"A":"Advanced","B":"Optional","C":"Basic","D":"Complex"},"C",["synonym","importance","5k"],0.2,1.3),
        ("'Unanimous' means _____.",{"A":"divided","B":"undecided","C":"in complete agreement","D":"partially agreeing"},"C",["definition","agreement","6k"],0.5,1.4),
        ("The word 'ambiguous' means _____.",{"A":"clear","B":"certain","C":"having more than one meaning","D":"straightforward"},"C",["definition","communication","6k"],0.7,1.4),
        ("'Phenomenon' means _____.",{"A":"an opinion","B":"a fact or event that can be observed","C":"a mistake","D":"a theory"},"B",["definition","science","5k"],0.4,1.3),
        ("Choose the antonym of 'temporary'.",{"A":"Brief","B":"Short","C":"Permanent","D":"Quick"},"C",["antonym","duration","4k"],0.1,1.3),
        ("'Contradict' means to _____.",{"A":"agree with","B":"say the opposite of","C":"support","D":"ignore"},"B",["definition","communication","5k"],0.3,1.3),
        ("The word 'profound' means _____.",{"A":"shallow","B":"very deep or significant","C":"ordinary","D":"brief"},"B",["definition","quality","6k"],0.6,1.4),
        ("'Derive' means to _____.",{"A":"destroy","B":"obtain from a source","C":"reject","D":"simplify"},"B",["definition","action","5k"],0.4,1.4),
        ("Choose the synonym of 'modify'.",{"A":"Keep","B":"Change","C":"Remove","D":"Create"},"B",["synonym","action","4k"],0.0,1.3),
    ],
    ("3","high"): [
        ("'Anachronism' means _____.",{"A":"a modern idea","B":"something belonging to a different time period","C":"a geographic error","D":"a mathematical formula"},"B",["definition","time","10k"],1.8,1.6),
        ("Choose the synonym of 'abrogate'.",{"A":"Establish","B":"Abolish","C":"Strengthen","D":"Modify"},"B",["synonym","law","10k"],2.2,1.6),
        ("'Magnanimous' means _____.",{"A":"petty","B":"generous in spirit","C":"powerful","D":"magnetic"},"B",["definition","character","9k"],1.5,1.5),
        ("The word 'equivocate' means to _____.",{"A":"speak clearly","B":"be deliberately vague","C":"agree completely","D":"disagree strongly"},"B",["definition","communication","9k"],2.0,1.6),
        ("'Antithesis' means _____.",{"A":"a summary","B":"a direct opposite","C":"a combination","D":"a comparison"},"B",["definition","rhetoric","8k"],1.3,1.5),
        ("Choose the antonym of 'tacit'.",{"A":"Silent","B":"Implied","C":"Explicit","D":"Subtle"},"C",["antonym","communication","8k"],1.4,1.5),
        ("'Ostensible' means _____.",{"A":"genuine","B":"appearing to be true but not necessarily so","C":"hidden","D":"confirmed"},"B",["definition","appearance","9k"],1.7,1.6),
        ("The word 'axiom' means _____.",{"A":"a debatable claim","B":"an unproven theory","C":"a self-evident truth","D":"a personal opinion"},"C",["definition","logic","9k"],1.9,1.6),
        ("'Pernicious' means _____.",{"A":"beneficial","B":"harmless","C":"causing great harm gradually","D":"obvious"},"C",["definition","quality","10k"],2.1,1.6),
        ("Choose the synonym of 'censure'.",{"A":"Praise","B":"Criticize severely","C":"Ignore","D":"Support"},"B",["synonym","action","8k"],1.5,1.5),
        ("'Hegemony' means _____.",{"A":"equality","B":"dominance by one group","C":"cooperation","D":"isolation"},"B",["definition","political","10k"],2.3,1.7),
        ("The word 'vicarious' means _____.",{"A":"direct","B":"experienced through another person","C":"personal","D":"unrelated"},"B",["definition","experience","8k"],1.4,1.5),
        ("'Sycophant' means _____.",{"A":"a leader","B":"a person who flatters to gain advantage","C":"an honest person","D":"a rebel"},"B",["definition","social","10k"],2.0,1.6),
        ("Choose the antonym of 'ameliorate'.",{"A":"Improve","B":"Worsen","C":"Maintain","D":"Transform"},"B",["antonym","change","9k"],1.6,1.5),
        ("'Obfuscate' means to _____.",{"A":"clarify","B":"make unclear or confusing","C":"simplify","D":"illuminate"},"B",["definition","communication","10k"],2.2,1.6),
        ("The word 'altruistic' means _____.",{"A":"selfish","B":"showing unselfish concern for others","C":"neutral","D":"ambitious"},"B",["definition","character","8k"],1.3,1.5),
        ("'Cogent' means _____.",{"A":"weak and unconvincing","B":"clear, logical, and convincing","C":"complicated","D":"emotional"},"B",["definition","argumentation","9k"],1.7,1.6),
        ("Choose the synonym of 'disparate'.",{"A":"Similar","B":"Related","C":"Fundamentally different","D":"Connected"},"C",["synonym","comparison","8k"],1.5,1.5),
    ],
}

# --- Reading items (linked to passages) ---
reading_items = {
    # Stage 2 Low reading items (A2 passages P01, P02, P03)
    ("2","low"): [
        ("P01","What does Mimi like to do?",{"A":"Play with dogs","B":"Sleep on the bed","C":"Eat pizza","D":"Watch TV"},"B",["main-idea","literal"],-2.0,1.0),
        ("P01","What does the writer give Mimi in the morning?",{"A":"Bread and water","B":"Milk and fish","C":"Rice and chicken","D":"Fruit and juice"},"B",["detail","literal"],-1.8,1.0),
        ("P01","What does Mimi do after eating?",{"A":"Goes outside","B":"Takes a bath","C":"Plays with a ball","D":"Goes to sleep"},"C",["detail","sequence"],-1.5,1.1),
        ("P02","How did the family get to the beach?",{"A":"By train","B":"By bus","C":"By car","D":"On foot"},"C",["detail","literal"],-1.6,1.1),
        ("P02","What did Mom make for lunch?",{"A":"Pizza","B":"Sandwiches","C":"Soup","D":"Hamburgers"},"B",["detail","literal"],-1.7,1.0),
        ("P02","What color was the special seashell?",{"A":"White","B":"Blue","C":"Pink","D":"Yellow"},"C",["detail","literal"],-1.4,1.1),
        ("P02","How did the family feel at the end of the day?",{"A":"Sad and angry","B":"Tired but happy","C":"Bored and cold","D":"Scared and wet"},"B",["inference","emotion"],-1.0,1.2),
        ("P03","What do plant roots absorb from the soil?",{"A":"Sunlight","B":"Air","C":"Water","D":"Seeds"},"C",["detail","literal"],-1.3,1.1),
        ("P03","What is the process by which plants make their food called?",{"A":"Respiration","B":"Germination","C":"Pollination","D":"Photosynthesis"},"D",["vocabulary","scientific-term"],-0.8,1.2),
        ("P03","What happens first when a seed begins to grow?",{"A":"Flowers appear","B":"Leaves collect sunlight","C":"A root grows downward","D":"The stem grows upward"},"C",["detail","sequence"],-0.9,1.2),
        ("P03","What is the main purpose of this passage?",{"A":"To tell a story about a garden","B":"To explain how plants grow","C":"To convince readers to plant trees","D":"To describe a science experiment"},"B",["main-idea","purpose"],-0.6,1.3),
        ("P03","Which of the following is NOT mentioned as something plants need?",{"A":"Sunlight","B":"Water","C":"Wind","D":"Nutrients"},"C",["detail","negative"],-0.7,1.2),
    ],
    # Stage 2 Medium reading items (B1 passages P04, P05, P08)
    ("2","medium"): [
        ("P04","Why did Emma pick up the puppy?",{"A":"She wanted a new pet","B":"It looked hungry and cold","C":"Her parents told her to","D":"She found it amusing"},"B",["inference","motivation"],-0.2,1.3),
        ("P04","What did Emma do the next day?",{"A":"Took the puppy to a vet","B":"Put up posters around the neighborhood","C":"Brought it to school","D":"Gave it to a friend"},"B",["detail","sequence"],0.0,1.2),
        ("P04","Why did Emma name the puppy 'Lucky'?",{"A":"It was a popular name","B":"She felt lucky to have found him","C":"Her friend suggested it","D":"The puppy was always happy"},"B",["inference","reasoning"],0.1,1.3),
        ("P04","What is the theme of this story?",{"A":"The importance of education","B":"Kindness and responsibility","C":"The danger of stray animals","D":"How to train a puppy"},"B",["theme","inference"],0.3,1.4),
        ("P05","According to the passage, what does recycling reduce?",{"A":"Employment","B":"Population","C":"The need for raw materials","D":"The cost of products"},"C",["detail","literal"],0.0,1.2),
        ("P05","How many trees can be saved by recycling one ton of paper?",{"A":"7","B":"10","C":"17","D":"70"},"C",["detail","specific-number"],0.1,1.2),
        ("P05","Why do some people not recycle?",{"A":"It is illegal","B":"They find it inconvenient","C":"It costs too much money","D":"There are no recycling centers"},"B",["detail","literal"],0.2,1.3),
        ("P05","What is the purpose of single-stream recycling programs?",{"A":"To reduce the cost of recycling","B":"To make recycling easier for residents","C":"To increase government revenue","D":"To create more jobs"},"B",["inference","purpose"],0.4,1.4),
        ("P08","When is the park renovation expected to be completed?",{"A":"March 15","B":"June 30","C":"September 30","D":"December 31"},"C",["detail","literal"],-0.1,1.2),
        ("P08","Which entrance will remain open during construction?",{"A":"North entrance","B":"South entrance","C":"East entrance","D":"West entrance"},"B",["detail","literal"],0.0,1.2),
        ("P08","What is the total budget for the renovation?",{"A":"$1.2 million","B":"$2.4 million","C":"$3.6 million","D":"$4.8 million"},"B",["detail","specific-number"],0.1,1.2),
        ("P08","How can residents provide feedback about the project?",{"A":"Only at the town hall meeting","B":"Only by phone","C":"At a meeting or online","D":"Only by email"},"C",["detail","multiple-sources"],0.2,1.3),
    ],
    # Stage 2 High reading items (B2 passages P06, P07, P12)
    ("2","high"): [
        ("P06","What made SpaceX significant in space exploration?",{"A":"Landing on Mars","B":"Building the ISS","C":"Developing reusable rockets","D":"Launching Sputnik"},"C",["detail","literal"],1.0,1.4),
        ("P06","Which challenge of space exploration is NOT mentioned?",{"A":"Radiation exposure","B":"Psychological effects","C":"Financial investment","D":"Lack of oxygen"},"D",["detail","negative"],1.2,1.5),
        ("P06","What is the author's overall attitude toward space exploration?",{"A":"Completely negative","B":"Cautiously optimistic","C":"Indifferent","D":"Extremely skeptical"},"B",["tone","inference"],1.5,1.5),
        ("P07","According to Cooper (2006), homework has a positive effect especially for _____.",{"A":"younger students","B":"older students","C":"all students equally","D":"students with support"},"B",["detail","research-finding"],1.1,1.4),
        ("P07","What health concern is associated with excessive homework?",{"A":"Poor eyesight","B":"Higher anxiety","C":"Lack of exercise","D":"Sleep disorders"},"B",["detail","literal"],1.0,1.4),
        ("P07","How does homework affect educational equality according to critics?",{"A":"It helps disadvantaged students catch up","B":"It makes all students equal","C":"It widens the gap between privileged and disadvantaged students","D":"It has no effect on equality"},"C",["inference","critical-analysis"],1.4,1.5),
        ("P07","The passage is best described as _____.",{"A":"strongly against homework","B":"strongly in favor of homework","C":"a balanced presentation of both sides","D":"a personal opinion essay"},"C",["structure","text-type"],1.3,1.5),
        ("P12","What position is the writer applying for?",{"A":"Marketing Manager","B":"Marketing Assistant","C":"Social Media Director","D":"Content Writer"},"B",["detail","literal"],1.0,1.4),
        ("P12","Where did the writer complete an internship?",{"A":"State University","B":"Digital Solutions Inc.","C":"A marketing agency","D":"The company being applied to"},"B",["detail","literal"],1.1,1.4),
        ("P12","What attracts the writer to the company?",{"A":"High salary","B":"Close location","C":"Innovative sustainable marketing practices","D":"Famous brand name"},"C",["detail","literal"],1.2,1.5),
    ],
    # Stage 3 Low reading items (A2 passages P01, P02)
    ("3","low"): [
        ("P01","What does Mimi catch sometimes?",{"A":"A bird","B":"A ball","C":"A mouse","D":"A fish"},"C",["detail","literal"],-1.5,1.1),
        ("P01","Where does Mimi sit at night?",{"A":"On the bed","B":"On the floor","C":"On the writer's lap","D":"On the sofa"},"C",["detail","literal"],-1.3,1.1),
        ("P01","What is the best title for this story?",{"A":"A Day at the Pet Store","B":"My Best Friend Mimi","C":"How to Feed a Cat","D":"Animals I Like"},"B",["main-idea","title"],-0.8,1.2),
        ("P02","What did Dad help the children build?",{"A":"A boat","B":"A tent","C":"A sandcastle","D":"A campfire"},"C",["detail","literal"],-1.6,1.1),
        ("P02","Where did they eat lunch?",{"A":"In the car","B":"At a restaurant","C":"Under an umbrella","D":"Near the water"},"C",["detail","literal"],-1.4,1.1),
        ("P02","When did this trip happen?",{"A":"Last winter","B":"Last spring","C":"Last summer","D":"Last fall"},"C",["detail","literal"],-1.7,1.0),
        ("P03","Which comes LAST in the growth of a plant?",{"A":"Root grows","B":"Leaves appear","C":"Stem pushes upward","D":"Seed gets water"},"B",["detail","sequence"],-0.7,1.2),
        ("P03","What THREE things do plants need to grow?",{"A":"Water, air, seeds","B":"Sunlight, water, nutrients","C":"Seeds, soil, shade","D":"Rain, wind, sunlight"},"B",["detail","main-idea"],-0.9,1.2),
    ],
    # Stage 3 Medium reading items (B1-B2 passages P05, P06, P09)
    ("3","medium"): [
        ("P05","The word 'disparities' in the passage is closest in meaning to _____.",{"A":"similarities","B":"differences","C":"advantages","D":"problems"},"B",["vocabulary-in-context","synonym"],0.3,1.3),
        ("P05","What can be inferred about single-stream recycling?",{"A":"It is more expensive","B":"It was introduced to simplify recycling","C":"It only works in large cities","D":"It reduces the quality of recycled materials"},"B",["inference","purpose"],0.5,1.4),
        ("P05","Which detail BEST supports the idea that recycling saves resources?",{"A":"Many people don't recycle","B":"Recycling one ton of paper saves 17 trees","C":"Cities have introduced new programs","D":"Millions of tons of waste end up in landfills"},"B",["evidence","supporting-detail"],0.6,1.4),
        ("P06","The phrase 'the next frontier' in reference to Mars means _____.",{"A":"the most dangerous place","B":"the next major goal to explore","C":"the closest planet","D":"the most expensive project"},"B",["vocabulary-in-context","figurative"],0.4,1.3),
        ("P09","What became apparent during the COVID-19 pandemic?",{"A":"The internet is reliable","B":"The digital divide significantly impacts education","C":"All students have equal access","D":"Remote learning is always better"},"B",["detail","main-impact"],0.3,1.3),
        ("P09","According to the passage, what percentage of households in developed nations have internet access?",{"A":"About 20%","B":"About 50%","C":"About 75%","D":"About 90%"},"D",["detail","statistic"],0.1,1.2),
        ("P09","What is needed to bridge the digital divide?",{"A":"Only government action","B":"Only technology companies","C":"Coordinated efforts from multiple groups","D":"Reducing internet usage"},"C",["detail","solution"],0.4,1.3),
        ("P09","The tone of this passage is best described as _____.",{"A":"humorous","B":"informative and concerned","C":"angry and accusatory","D":"optimistic and cheerful"},"B",["tone","inference"],0.5,1.4),
    ],
    # Stage 3 High reading items (C1 passages P10, P11)
    ("3","high"): [
        ("P10","According to the passage, AI can analyze medical images with accuracy _____.",{"A":"far below that of radiologists","B":"comparable to or exceeding that of radiologists","C":"only in experimental settings","D":"for a limited range of conditions"},"B",["detail","comparison"],1.2,1.5),
        ("P10","Which ethical concern about AI in healthcare is NOT mentioned?",{"A":"Algorithmic bias","B":"Data privacy","C":"Cost of implementation","D":"Informed consent"},"C",["detail","negative"],1.4,1.5),
        ("P10","The word 'vigorous' in 'vigorous debate' most nearly means _____.",{"A":"quiet","B":"intense","C":"brief","D":"one-sided"},"B",["vocabulary-in-context","synonym"],1.3,1.5),
        ("P10","What can be inferred about the author's view of AI in healthcare?",{"A":"It should be banned","B":"It is entirely beneficial","C":"It is promising but requires careful implementation","D":"It is too early to evaluate"},"C",["inference","author-perspective"],1.6,1.6),
        ("P11","What does CRISPR-Cas9 technology enable?",{"A":"Cloning organisms","B":"Gene editing","C":"Artificial intelligence","D":"Drug manufacturing"},"B",["detail","literal"],1.1,1.4),
        ("P11","Why is germline cell modification particularly controversial?",{"A":"It is very expensive","B":"It only works on animals","C":"The long-term consequences are unknown","D":"It has been proven dangerous"},"C",["detail","reasoning"],1.5,1.6),
        ("P11","The word 'patchwork' in reference to regulatory frameworks suggests _____.",{"A":"a well-organized system","B":"a consistent global approach","C":"an inconsistent collection of policies","D":"a temporary solution"},"C",["vocabulary-in-context","figurative"],1.7,1.6),
        ("P11","Which statement best summarizes the author's position?",{"A":"Genetic engineering should be banned","B":"The benefits clearly outweigh the risks","C":"Both the potential and the risks require serious consideration","D":"Regulatory frameworks are sufficient"},"C",["main-idea","summary"],1.8,1.6),
        ("P10","What role does NLP play in healthcare according to the passage?",{"A":"Diagnosing patients directly","B":"Extracting information from clinical notes","C":"Replacing doctors","D":"Managing hospital finances"},"B",["detail","specific-application"],1.3,1.5),
        ("P11","What example of successful gene therapy is mentioned?",{"A":"Cancer treatment","B":"Sickle cell disease treatment","C":"Diabetes cure","D":"Heart disease prevention"},"B",["detail","specific-example"],1.2,1.5),
    ],
}

def build_items():
    all_items = []
    idx = 0
    # Grammar items
    for (stage, panel), items in grammar_items.items():
        for stem, opts, ans, tags, diff, disc in items:
            idx += 1
            all_items.append({
                "stage": int(stage), "panel": panel, "form_id": 1,
                "domain": "grammar", "stem": stem, "options": opts,
                "correct_answer": ans,
                "skill_tag": tags,
                "difficulty": round(diff + random.uniform(-0.05, 0.05), 3),
                "discrimination": round(disc + random.uniform(-0.05, 0.05), 3),
                "guessing": 0.25, "status": "active"
            })
    # Vocabulary items
    for (stage, panel), items in vocab_items.items():
        for stem, opts, ans, tags, diff, disc in items:
            idx += 1
            all_items.append({
                "stage": int(stage), "panel": panel, "form_id": 1,
                "domain": "vocabulary", "stem": stem, "options": opts,
                "correct_answer": ans,
                "skill_tag": tags,
                "difficulty": round(diff + random.uniform(-0.05, 0.05), 3),
                "discrimination": round(disc + random.uniform(-0.05, 0.05), 3),
                "guessing": 0.25, "status": "active"
            })
    # Reading items
    for (stage, panel), items in reading_items.items():
        for passage_id, stem, opts, ans, tags, diff, disc in items:
            idx += 1
            all_items.append({
                "stage": int(stage), "panel": panel, "form_id": 1,
                "domain": "reading", "stem": stem, "options": opts,
                "correct_answer": ans,
                "skill_tag": tags,
                "passage_temp_id": passage_id,
                "difficulty": round(diff + random.uniform(-0.05, 0.05), 3),
                "discrimination": round(disc + random.uniform(-0.05, 0.05), 3),
                "guessing": 0.25, "status": "active"
            })
    return all_items

def main():
    items = build_items()
    # Convert passages to use temp_id format
    out_passages = []
    for p in passages:
        out_passages.append({
            "temp_id": p["temp_id"],
            "title": p["title"],
            "content": p["content"],
            "word_count": len(p["content"].split()),
            "lexile_score": p["lexile_score"],
            "ar_level": p["ar_score"],
            "genre": p["text_type"]
        })

    data = {"passages": out_passages, "items": items}

    # Stats
    from collections import Counter
    panel_counts = Counter()
    domain_counts = Counter()
    for item in items:
        key = f"stage{item['stage']}/{item['panel']}"
        panel_counts[key] += 1
        domain_counts[item['domain']] += 1

    print(f"Total items: {len(items)}")
    print(f"Total passages: {len(out_passages)}")
    print("\nBy panel:")
    for k in sorted(panel_counts.keys()):
        print(f"  {k}: {panel_counts[k]}")
    print(f"\nBy domain:")
    for k in sorted(domain_counts.keys()):
        print(f"  {k}: {domain_counts[k]}")

    outpath = __file__.replace("generate_seed.py", "seed_items_600.json")
    with open(outpath, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    print(f"\nWritten to {outpath}")

if __name__ == "__main__":
    main()
