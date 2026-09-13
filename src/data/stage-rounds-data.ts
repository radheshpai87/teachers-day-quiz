export interface StageRule {
  text: string
  highlight?: string
}

export interface StageMcqQuestion {
  id: string
  number: number
  question: string
  options: { label: string; text: string }[]
  correctIndex: number
  explanation: string
  category: string
}

export interface StageMediaQuestion {
  id: string
  number: number
  title: string
  clue: string
  imageSrc?: string
  audioClueText?: string
  answer: string
  explanation: string
  category: string
}

export interface RapidFireQuestion {
  id: string
  number: number
  question: string
  answer: string
}

export interface ParticipantRapidSet {
  participantNumber: number
  title: string
  questions: RapidFireQuestion[]
}

export interface FastestFingerQuestion {
  id: string
  number: number
  question: string
  answer: string
  explanation: string
  category: string
}

export const STAGE_RULES = [
  { text: '6 participants compete individually.' },
  { text: 'The Stage Round consists of 4 rounds.' },
  { text: 'Round 1 — MCQ: Correct answer +5 points.' },
  { text: 'Round 2 — Audio & Image: Direct correct +10 | Direct wrong −5 | Passed correct +5 | Passed wrong 0.' },
  { text: 'Round 3 — Rapid Fire: 5 questions per participant, 15 seconds each, no options. Correct +10.' },
  { text: 'Round 4 — Fastest Fingers First: Correct +15 | Wrong after buzzing −5.' },
  { text: 'No external assistance or electronic devices are allowed.' },
  { text: 'The Quizmaster’s decision will be final.' },
  { text: 'A tie-breaker will be conducted in case of a tie.' },
]

export const ROUND_1_MCQ: StageMcqQuestion[] = [
  {
    id: 'r1-q1',
    number: 1,
    category: 'Aeronautical & Computing',
    question: 'The Apollo 11 Guidance Computer (AGC), which guided humanity to the Moon in 1969, operated with approximately how much RAM?',
    options: [
      { label: 'A', text: '4 Kilobytes (2,048 words)' },
      { label: 'B', text: '64 Kilobytes' },
      { label: 'C', text: '512 Kilobytes' },
      { label: 'D', text: '1 Megabyte' },
    ],
    correctIndex: 0,
    explanation: 'The AGC had approximately 2,048 words of RAM (approx. 4 KB) and 36,864 words of ROM (approx. 72 KB), developed using cutting-edge silicon integrated circuits.',
  },
  {
    id: 'r1-q2',
    number: 2,
    category: 'Civil & Structural Engineering',
    question: 'The Krishna Raja Sagara (KRS) Dam in Karnataka, engineered by Sir M. Visvesvaraya, used a patented innovative hydraulic mortar known as what?',
    options: [
      { label: 'A', text: 'Pozzolana Slag' },
      { label: 'B', text: 'Surki Mortar' },
      { label: 'C', text: 'Alite Cement' },
      { label: 'D', text: 'Geopolymer Paste' },
    ],
    correctIndex: 1,
    explanation: 'Surki mortar (a limestone and burnt brick powder blend) was formulated by Sir M. Visvesvaraya to construct the majestic Krishna Raja Sagara Dam across the Kaveri River.',
  },
  {
    id: 'r1-q3',
    number: 3,
    category: 'Electronics & Semiconductor',
    question: 'Gordon Moore formulated Moore’s Law in 1965, observing that the number of transistors on a microchip roughly doubles every how many years?',
    options: [
      { label: 'A', text: '6 Months' },
      { label: 'B', text: '2 Years' },
      { label: 'C', text: '5 Years' },
      { label: 'D', text: '10 Years' },
    ],
    correctIndex: 1,
    explanation: 'Moore’s Law states that the number of transistors on a microchip doubles approximately every 2 years, while the cost of computers is halved.',
  },
  {
    id: 'r1-q4',
    number: 4,
    category: 'Mechanical & Automotive',
    question: 'In 1959, Volvo engineer Nils Bohlin invented a life-saving vehicle safety device and left the patent open for all competitors to use freely. What was it?',
    options: [
      { label: 'A', text: 'Anti-lock Braking System (ABS)' },
      { label: 'B', text: 'Three-Point Seatbelt' },
      { label: 'C', text: 'Crumple Zone Chassis' },
      { label: 'D', text: 'Supplemental Airbag' },
    ],
    correctIndex: 1,
    explanation: 'Nils Bohlin developed the three-point seatbelt at Volvo in 1959. Volvo opened the patent royalty-free to all automakers, saving millions of lives globally.',
  },
  {
    id: 'r1-q5',
    number: 5,
    category: 'Computer Science & Networking',
    question: 'In 1989 at CERN, Tim Berners-Lee wrote the proposal for what information system that interconnected global hypertext documents over TCP/IP?',
    options: [
      { label: 'A', text: 'The World Wide Web' },
      { label: 'B', text: 'ARPANET' },
      { label: 'C', text: 'Usenet' },
      { label: 'D', text: 'File Transfer Protocol' },
    ],
    correctIndex: 0,
    explanation: 'Tim Berners-Lee authored "Information Management: A Proposal" at CERN in March 1989, inventing HTML, HTTP, and the World Wide Web.',
  },
  {
    id: 'r1-q6',
    number: 6,
    category: 'Space & Propulsion',
    question: 'Which cryogenic upper stage rocket engine, developed indigenously by ISRO, powers the LVM3 (GSLV Mk III) heavy-lift launcher for missions like Chandrayaan-3?',
    options: [
      { label: 'A', text: 'Vikas Engine' },
      { label: 'B', text: 'CE-20' },
      { label: 'C', text: 'Kestrel Engine' },
      { label: 'D', text: 'RD-180' },
    ],
    correctIndex: 1,
    explanation: 'The CE-20 is an indigenous Indian cryogenic rocket engine utilizing liquid oxygen (LOX) and liquid hydrogen (LH2) in a gas-generator cycle to power the C25 upper stage of LVM3.',
  },
]

export const ROUND_2_AUDIO_IMAGE: StageMediaQuestion[] = [
  {
    id: 'r2-q1',
    number: 1,
    title: 'Visual Clue: Megastructure & Dam Engineering',
    clue: 'Identify this iconic engineering marvel built across the Colorado River during the Great Depression, renowned for its revolutionary arch-gravity concrete structure.',
    answer: 'The Hoover Dam',
    explanation: 'Dedicated in 1935, Hoover Dam is a 221-meter concrete arch-gravity dam on the Arizona–Nevada border, generating over 4 billion kilowatt-hours of hydroelectric power annually.',
    category: 'Civil & Hydroelectric',
  },
  {
    id: 'r2-q2',
    number: 2,
    title: 'Audio / Sound Clue: Space Telemetry',
    clue: 'On October 4, 1957, radio amateurs and tracking stations across the globe recorded this famous repetitive radio "beep... beep... beep..." at 20.005 MHz. Which historic artificial satellite produced this signal?',
    audioClueText: '📻 Radio Frequency: 20.005 MHz Transmitter pulse sound: "Beep... Beep... Beep..."',
    answer: 'Sputnik 1 (USSR)',
    explanation: 'Sputnik 1 was the first artificial Earth satellite launched into an elliptical low Earth orbit by the Soviet Union on October 4, 1957, igniting the Space Age.',
    category: 'Space Exploration',
  },
  {
    id: 'r2-q3',
    number: 3,
    title: 'Visual Clue: Iconic Tech Blueprint',
    clue: 'Identify the pioneering computing pioneer and mathematician whose 1837 design of the steam-powered mechanical "Analytical Engine" introduced the concept of memory, ALU, and conditional branching.',
    answer: 'Charles Babbage',
    explanation: 'Charles Babbage designed the Analytical Engine, a mechanical general-purpose computer incorporating arithmetic logic, control flow via loops, and integrated memory.',
    category: 'History of Computing',
  },
  {
    id: 'r2-q4',
    number: 4,
    title: 'Audio / Signal Clue: Telegraphy & Coding',
    clue: 'In 1844, Samuel Morse transmitted the first electrical telegraph message over a 44-mile line between Washington D.C. and Baltimore. What was the legendary four-word phrase?',
    audioClueText: '⚡ Morse code pulse: •−− •••• •− − •••• •− − •••• •−−•−• −−− •••• •− − ••••',
    answer: '"What hath God wrought"',
    explanation: 'On May 24, 1844, Samuel F.B. Morse opened the telegraph line with the famous biblical quote "What hath God wrought", revolutionizing long-distance telecommunications.',
    category: 'Telecommunications',
  },
  {
    id: 'r2-q5',
    number: 5,
    title: 'Visual Clue: Robotic Space Mission',
    clue: 'Identify this NASA Martian rover that landed inside Jezero Crater in February 2021 carrying the Ingenuity helicopter and MOXIE oxygen generation experiment.',
    answer: 'Perseverance Rover (Percy)',
    explanation: 'NASA’s Perseverance rover landed in Jezero Crater on February 18, 2021, seeking signs of ancient microbial life and caching rock samples for future return.',
    category: 'Robotics & Planetary Exploration',
  },
  {
    id: 'r2-q6',
    number: 6,
    title: 'Audio / Acoustic Clue: Supersonic Flight',
    clue: 'On October 14, 1947, pilot Chuck Yeager flying the rocket-powered Bell X-1 generated an explosive sound heard on the ground known as what aerodynamic acoustic phenomenon?',
    audioClueText: '💥 Thunder-like explosive shockwave produced when an aircraft exceeds Mach 1.0 (Speed of Sound).',
    answer: 'Sonic Boom (Breaking the Sound Barrier)',
    explanation: 'A sonic boom is the sound associated with shock waves created whenever an object travels through the air faster than the speed of sound (Mach 1).',
    category: 'Aerodynamics',
  },
]

export const ROUND_3_RAPID_FIRE: ParticipantRapidSet[] = [
  {
    participantNumber: 1,
    title: 'Finalist 1 — Rapid Fire',
    questions: [
      { id: 'rf-p1-1', number: 1, question: 'What does CPU stand for in computer hardware?', answer: 'Central Processing Unit' },
      { id: 'rf-p1-2', number: 2, question: 'What unit measures electrical resistance?', answer: 'Ohm (Ω)' },
      { id: 'rf-p1-3', number: 3, question: 'Which chemical element has the symbol Fe?', answer: 'Iron' },
      { id: 'rf-p1-4', number: 4, question: 'What is the speed of light in a vacuum approximately (in km/s)?', answer: '300,000 km/s (299,792 km/s)' },
      { id: 'rf-p1-5', number: 5, question: 'Who is known as the inventor of the World Wide Web?', answer: 'Tim Berners-Lee' },
    ],
  },
  {
    participantNumber: 2,
    title: 'Finalist 2 — Rapid Fire',
    questions: [
      { id: 'rf-p2-1', number: 1, question: 'What does RAM stand for in computing?', answer: 'Random Access Memory' },
      { id: 'rf-p2-2', number: 2, question: 'What unit measures electric current?', answer: 'Ampere (Amp)' },
      { id: 'rf-p2-3', number: 3, question: 'Which gas is the most abundant in Earth’s atmosphere?', answer: 'Nitrogen (~78%)' },
      { id: 'rf-p2-4', number: 4, question: 'What is the binary representation of decimal number 5?', answer: '101' },
      { id: 'rf-p2-5', number: 5, question: 'What law states that Voltage = Current × Resistance?', answer: 'Ohm’s Law' },
    ],
  },
  {
    participantNumber: 3,
    title: 'Finalist 3 — Rapid Fire',
    questions: [
      { id: 'rf-p3-1', number: 1, question: 'What does HTTP stand for in networking?', answer: 'Hypertext Transfer Protocol' },
      { id: 'rf-p3-2', number: 2, question: 'What unit measures electrical capacitance?', answer: 'Farad (F)' },
      { id: 'rf-p3-3', number: 3, question: 'Which semiconductor material is most commonly used in computer chips?', answer: 'Silicon' },
      { id: 'rf-p3-4', number: 4, question: 'What is the escape velocity from Earth’s surface approximately (in km/s)?', answer: '11.2 km/s' },
      { id: 'rf-p3-5', number: 5, question: 'Who is considered the world’s first computer programmer?', answer: 'Ada Lovelace' },
    ],
  },
  {
    participantNumber: 4,
    title: 'Finalist 4 — Rapid Fire',
    questions: [
      { id: 'rf-p4-1', number: 1, question: 'What does GPU stand for in electronics?', answer: 'Graphics Processing Unit' },
      { id: 'rf-p4-2', number: 2, question: 'What unit measures frequency of alternating current?', answer: 'Hertz (Hz)' },
      { id: 'rf-p4-3', number: 3, question: 'What is the chemical formula for water?', answer: 'H2O' },
      { id: 'rf-p4-4', number: 4, question: 'Which programming language was created by Guido van Rossum?', answer: 'Python' },
      { id: 'rf-p4-5', number: 5, question: 'What is the SI unit of mechanical force?', answer: 'Newton (N)' },
    ],
  },
  {
    participantNumber: 5,
    title: 'Finalist 5 — Rapid Fire',
    questions: [
      { id: 'rf-p5-1', number: 1, question: 'What does SSD stand for in storage drives?', answer: 'Solid State Drive' },
      { id: 'rf-p5-2', number: 2, question: 'What unit measures magnetic flux density?', answer: 'Tesla (T)' },
      { id: 'rf-p5-3', number: 3, question: 'What is the hardest naturally occurring mineral on Mohs scale?', answer: 'Diamond' },
      { id: 'rf-p5-4', number: 4, question: 'What protocol translates domain names into IP addresses?', answer: 'DNS (Domain Name System)' },
      { id: 'rf-p5-5', number: 5, question: 'What is the value of gravitational acceleration g on Earth (m/s²)?', answer: '9.8 m/s² (or 9.81 m/s²)' },
    ],
  },
  {
    participantNumber: 6,
    title: 'Finalist 6 — Rapid Fire',
    questions: [
      { id: 'rf-p6-1', number: 1, question: 'What does USB stand for in computer hardware interfaces?', answer: 'Universal Serial Bus' },
      { id: 'rf-p6-2', number: 2, question: 'What unit measures electrical potential difference?', answer: 'Volt (V)' },
      { id: 'rf-p6-3', number: 3, question: 'What does LED stand for in optoelectronics?', answer: 'Light Emitting Diode' },
      { id: 'rf-p6-4', number: 4, question: 'What layer of the Earth’s atmosphere contains the ozone layer?', answer: 'Stratosphere' },
      { id: 'rf-p6-5', number: 5, question: 'In what year was Sir M. Visvesvaraya awarded the Bharat Ratna?', answer: '1955' },
    ],
  },
]

export const ROUND_4_FASTEST_FINGERS: FastestFingerQuestion[] = [
  {
    id: 'fff-1',
    number: 1,
    category: 'Civil & Architectural Engineering',
    question: 'Engineered by Gustave Eiffel for the 1889 Exposition Universelle in Paris, what is the lattice wrought-iron tower that stands 330 meters tall?',
    answer: 'The Eiffel Tower',
    explanation: 'Constructed between 1887 and 1889 as the centerpiece of the 1889 World’s Fair, it pioneered open-lattice wrought iron construction to withstand severe wind forces.',
  },
  {
    id: 'fff-2',
    number: 2,
    category: 'Computer Systems & OS',
    question: 'In 1991, Finnish computer science student Linus Torvalds published a free open-source monolithic kernel. What is it called?',
    answer: 'Linux (Linux Kernel)',
    explanation: 'Linus Torvalds announced the Linux kernel on August 25, 1991, stating "I\'m doing a (free) operating system (just a hobby, won\'t be big and professional like gnu)". Today it powers 90%+ of cloud servers and supercomputers.',
  },
  {
    id: 'fff-3',
    number: 3,
    category: 'Space Systems & Satellites',
    question: 'On April 19, 1975, India launched its first indigenous unmanned satellite, named after an ancient Indian astronomer and mathematician. What was it named?',
    answer: 'Aryabhata',
    explanation: 'Aryabhata was India’s first satellite, built by ISRO and launched by the Soviet Union using a Kosmos-3M launch vehicle from Kapustin Yar.',
  },
  {
    id: 'fff-4',
    number: 4,
    category: 'Aviation Engineering',
    question: 'On December 17, 1903, at Kitty Hawk, North Carolina, Orville and Wilbur Wright achieved humanity’s first controlled, sustained, powered heavier-than-air flight. What was their aircraft called?',
    answer: 'Wright Flyer (Flyer I)',
    explanation: 'The Wright Flyer achieved four sustained flights on December 17, 1903, with Orville completing the first 12-second, 120-foot flight.',
  },
  {
    id: 'fff-5',
    number: 5,
    category: 'Robotics & Artificial Intelligence',
    question: 'In 1997, which IBM supercomputer defeated reigning World Chess Champion Garry Kasparov in a six-game match, marking a milestone in artificial intelligence?',
    answer: 'Deep Blue',
    explanation: 'Deep Blue defeated Garry Kasparov 3½–2½ on May 11, 1997, capable of evaluating 200 million chess positions per second.',
  },
  {
    id: 'fff-6',
    number: 6,
    category: 'Materials & Nanotechnology',
    question: 'Consisting of a single two-dimensional honeycomb sheet of carbon atoms with extraordinary electrical conductivity and 200 times the tensile strength of steel, what is this material called?',
    answer: 'Graphene',
    explanation: 'Graphene was isolated in 2004 by Andre Geim and Konstantin Novoselov at the University of Manchester using adhesive scotch tape, earning them the 2010 Nobel Prize in Physics.',
  },
]

export const TIE_BREAKER_QUESTIONS: FastestFingerQuestion[] = [
  {
    id: 'tb-1',
    number: 1,
    category: 'Tie Breaker — Electrical Engineering',
    question: 'Who was the Serbian-American electrical engineer who patented the AC induction motor, polyphase power distribution, and the Tesla Coil?',
    answer: 'Nikola Tesla',
    explanation: 'Nikola Tesla pioneered alternating current (AC) electrical systems, polyphase generators, and high-frequency transformers.',
  },
  {
    id: 'tb-2',
    number: 2,
    category: 'Tie Breaker — Mechanical Engineering',
    question: 'What Scottish inventor dramatically improved the Newcomen atmospheric engine in 1776 by adding a separate condenser, catalyzing the Industrial Revolution?',
    answer: 'James Watt',
    explanation: 'James Watt developed the separate condenser in 1769–1776, reducing thermal waste and establishing the modern unit of electrical power (Watt).',
  },
]
