/* Unidad en-b1-01 «In the restaurant kitchen» — lección 1 (muestra). Contenido original. */
window.STUDY.units['en-b1-01'] = {
  id: 'en-b1-01',
  title: 'In the restaurant kitchen',
  titleEs: 'En la cocina del restaurante',
  goals: [
    'Hablar de tu rutina de trabajo y de lo que está pasando ahora en la cocina.',
    'Entender un texto corto y un diálogo sobre un día de trabajo en un restaurante.',
    'Usar expresiones comunes de una cocina profesional.',
    'Escribir una carta de queja sencilla (la tarea de la unidad).'
  ],
  task: { practice: 'gt-writing-t1-01' },
  cards: [
    { id: 'en-b1-01-c01', lang: 'en-GB', front: 'to prep the vegetables',
      back: 'preparar las verduras (pelar, picar, cortar) antes del servicio',
      example: 'Every morning I prep the vegetables before the lunch rush.' },
    { id: 'en-b1-01-c02', lang: 'en-GB', front: 'the lunch rush',
      back: 'la hora pico del almuerzo',
      example: 'The head chef checks our stations just before the lunch rush.' },
    { id: 'en-b1-01-c03', lang: 'en-GB', front: 'an order comes in',
      back: 'entra un pedido (una comanda)',
      example: 'When an order comes in, the head chef reads it out loud.' },
    { id: 'en-b1-01-c04', lang: 'en-GB', front: 'Behind you!',
      back: '¡Detrás de ti! (aviso para no chocar en la cocina)',
      example: 'Someone with a hot pan shouts "Behind you!" so nobody gets hurt.' },
    { id: 'en-b1-01-c05', lang: 'en-GB', front: 'to be in the weeds',
      back: 'estar desbordado de trabajo (en la cocina)',
      example: "It's only twelve thirty and we're already in the weeds." },
    { id: 'en-b1-01-c06', lang: 'en-GB', front: 'to keep an eye on (something)',
      back: 'vigilar algo, estar pendiente de algo',
      example: "I'm keeping an eye on six steaks." },
    { id: 'en-b1-01-c07', lang: 'en-GB', front: 'to run out of (something)',
      back: 'quedarse sin algo',
      example: "We're running out of lemons." },
    { id: 'en-b1-01-c08', lang: 'en-GB', front: 'to clean down (your station)',
      back: 'limpiar a fondo tu puesto al terminar el turno',
      example: 'At the end of the shift, we clean down our stations.' }
  ],
  lessons: [{
    id: 'en-b1-01-l1',
    title: 'A day on the grill',
    activities: [
      { id: 'en-b1-01-l1-a01', type: 'pretest', strand: 'language', minutes: 2,
        items: [
          { id: 'en-b1-01-l1-a01-1', word: 'chop', image: '🔪',
            options: ['picar', 'hervir', 'freír', 'servir'], answer: 'picar' },
          { id: 'en-b1-01-l1-a01-2', word: 'printer', image: '🖨️',
            options: ['impresora', 'nevera', 'horno', 'caja registradora'], answer: 'impresora' },
          { id: 'en-b1-01-l1-a01-3', word: 'steak', image: '🥩',
            options: ['filete de res', 'pescado', 'pollo asado', 'jamón'], answer: 'filete de res' }
        ] },

      { id: 'en-b1-01-l1-a02', type: 'read', strand: 'input', minutes: 6,
        title: 'A day on the grill',
        text: 'I work as a line cook in a busy restaurant in the city centre. Every morning I arrive at nine o\'clock and I start to prep the vegetables: I peel the potatoes, chop the onions and slice the peppers. The head chef usually checks our stations at half past eleven, just before the lunch rush begins.\n\n' +
              'Lunch is always fast. Orders come in one after another, and the printer never stops. When an order comes in, the head chef reads it out loud and we all answer "Yes, chef!" If someone walks behind you with a hot pan, they shout "Behind you!" so nobody gets hurt.\n\n' +
              'Today is different, though. Two of our cooks are on holiday, so I\'m working on the grill and the fryer at the same time. It\'s only twelve thirty and we\'re already in the weeds. I\'m keeping an eye on six steaks while a new waiter is asking me about a table that is still waiting for its fish. To make things worse, we\'re running out of lemons, and the delivery doesn\'t arrive until four.\n\n' +
              'Still, I love this job. The kitchen is loud and hot, but we always help each other. At the end of the shift, we clean down our stations, and the head chef usually makes a simple meal for everyone. Tonight she\'s cooking pasta. I\'m tired, but I\'m happy.',
        glossary: {
          busy: 'con mucho movimiento, lleno de trabajo',
          peel: 'pelar',
          chop: 'picar',
          slice: 'cortar en rodajas o tajadas',
          stations: 'puestos de trabajo en la cocina',
          rush: 'hora pico, mucho movimiento de golpe',
          printer: 'impresora (aquí, la de las comandas)',
          loud: 'fuerte (sonido); out loud: en voz alta',
          hurt: 'lastimado; get hurt: lastimarse',
          though: 'sin embargo (al final de la frase)',
          fryer: 'freidora',
          steaks: 'filetes de res',
          waiter: 'mesero',
          delivery: 'entrega del proveedor',
          still: 'aun así (al inicio); todavía (en medio de la frase)',
          shift: 'turno de trabajo'
        } },

      { id: 'en-b1-01-l1-a03', type: 'listen', strand: 'input', minutes: 4,
        lines: [
          { voice: 'en-GB', text: 'Morning! Have you finished the prep?' },
          { voice: 'en-US', text: 'Almost. I\'m chopping the last onions now. The potatoes are already in the fridge.' },
          { voice: 'en-GB', text: 'Good. We\'ve got forty people booked for lunch, so it\'s going to be busy.' },
          { voice: 'en-US', text: 'Forty? Then we need more lemons. We only have about ten left.' },
          { voice: 'en-GB', text: 'Right. I\'ll call the supplier. Can you keep an eye on the stock while I\'m on the phone?' },
          { voice: 'en-US', text: 'Sure. Oh, and the fryer is making a strange noise again.' },
          { voice: 'en-GB', text: 'Not again! Don\'t use it until the technician checks it. Cook the chips in the oven today.' },
          { voice: 'en-US', text: 'OK, chef. Oven chips it is.' },
          { voice: 'en-GB', text: 'And remember, we start service at twelve sharp.' },
          { voice: 'en-US', text: 'Yes, chef!' }
        ],
        questions: [
          { id: 'en-b1-01-l1-a03-1', q: 'What is the cook doing right now?',
            options: ['Chopping onions', 'Peeling potatoes', 'Calling the supplier', 'Cleaning the fryer'],
            answer: 'Chopping onions',
            why: 'Dice «I\'m chopping the last onions now». Las papas ya están en la nevera.' },
          { id: 'en-b1-01-l1-a03-2', q: 'How many people are booked for lunch?',
            options: ['Fourteen', 'Forty', 'Ten', 'Twelve'],
            answer: 'Forty',
            why: '«forty people booked for lunch». Ojo: «forty» lleva la fuerza al inicio (FOR-ty); «fourteen», al final (four-TEEN).' },
          { id: 'en-b1-01-l1-a03-3', q: 'Why is the head chef going to call the supplier?',
            options: ['They need more lemons', 'The fryer is broken', 'The potatoes are bad', 'A customer complained'],
            answer: 'They need more lemons',
            why: 'Solo quedan unos diez limones y hay cuarenta reservas. La freidora la revisa un técnico, no el proveedor.' },
          { id: 'en-b1-01-l1-a03-4', q: 'How will they cook the chips today?',
            options: ['In the oven', 'In the fryer', 'On the grill', 'They won\'t make chips'],
            answer: 'In the oven',
            why: '«Cook the chips in the oven today», porque la freidora hace un ruido raro. «Chips», en inglés británico, son papas fritas.' }
        ] },

      { id: 'en-b1-01-l1-a04', type: 'chunks', strand: 'language', minutes: 3,
        cards: ['en-b1-01-c01', 'en-b1-01-c02', 'en-b1-01-c03', 'en-b1-01-c04',
                'en-b1-01-c05', 'en-b1-01-c06', 'en-b1-01-c07', 'en-b1-01-c08'] },

      { id: 'en-b1-01-l1-a05', type: 'grammar', strand: 'language', minutes: 3,
        title: 'Presente simple y presente continuo',
        explanation: 'Presente simple (I work, she checks): rutinas, hábitos y cosas que casi siempre son así. Ayudan palabras como every day, usually, always y never. Con he, she e it se agrega -s.\n\n' +
                     'Presente continuo (I\'m working, we\'re running out): lo que pasa ahora o en estos días, o algo distinto de lo normal. Se forma con am, is o are + verbo con -ing. Ayudan palabras como now, today, at the moment y Look!\n\n' +
                     'Ojo: los verbos de estado (love, know, want, need, like) casi nunca van en continuo. Se dice «I love this job», no «I\'m loving this job».',
        examples: [
          'I usually work on the grill. (rutina)',
          'Today I\'m working on the grill and the fryer. (hoy es distinto)',
          'The head chef checks our stations every day. (he/she/it + -s)',
          'Look! The sauce is burning! (pasa ahora mismo)',
          'We need more lemons. (need es de estado: no va en continuo)'
        ] },

      // Ejercicios mezclados (fila 6 de tasks.md T015): 8 ítems en 4 actividades de un tipo cada una (3 min en total).
      { id: 'en-b1-01-l1-a06', type: 'choice', strand: 'language', minutes: 0.75,
        items: [
          { id: 'en-b1-01-l1-a06-1', prompt: 'Every morning I ___ the vegetables before service.',
            options: ['prep', 'am prepping', 'preps'], answer: 'prep',
            why: 'Es una rutina (every morning): presente simple. Con «I» no lleva -s.' },
          { id: 'en-b1-01-l1-a06-2', prompt: 'Look! The milk ___ over!',
            options: ['boils', 'is boiling', 'boil'], answer: 'is boiling',
            why: '«Look!» indica que está pasando ahora mismo: presente continuo (is + boiling).' }
        ] },
      { id: 'en-b1-01-l1-a07', type: 'gap', strand: 'language', minutes: 0.75,
        items: [
          { id: 'en-b1-01-l1-a07-1', prompt: 'We ___ (run) out of lemons right now.',
            answer: ['are running', '\'re running'],
            why: '«right now»: presente continuo. are + running (la n se dobla: run → running).' },
          { id: 'en-b1-01-l1-a07-2', prompt: 'The head chef usually ___ (check) our stations at half past eleven.',
            answer: ['checks'],
            why: '«usually» indica rutina: presente simple. Con he/she (the head chef) se agrega -s.' }
        ] },
      { id: 'en-b1-01-l1-a08', type: 'order', strand: 'language', minutes: 0.75,
        items: [
          { id: 'en-b1-01-l1-a08-1', prompt: 'Ordena la frase: «Hoy la chef está cocinando pasta».',
            answer: ['The', 'chef', 'is', 'cooking', 'pasta', 'today'],
            why: 'Sujeto + is + verbo con -ing + complemento. «today» suele ir al final.' },
          { id: 'en-b1-01-l1-a08-2', prompt: 'Ordena la frase: «Nunca usamos la freidora los lunes».',
            answer: ['We', 'never', 'use', 'the', 'fryer', 'on', 'Mondays'],
            why: 'Los adverbios de frecuencia (never, always, usually) van antes del verbo principal. Los días llevan «on».' }
        ] },
      { id: 'en-b1-01-l1-a09', type: 'translate', strand: 'language', minutes: 0.75,
        items: [
          { id: 'en-b1-01-l1-a09-1', prompt: 'Traduce: «Estoy vigilando los filetes».',
            answer: ['I am keeping an eye on the steaks', 'I\'m keeping an eye on the steaks',
                     'I am watching the steaks', 'I\'m watching the steaks'],
            why: 'Pasa ahora: presente continuo. «keep an eye on» = vigilar, estar pendiente de algo.' },
          { id: 'en-b1-01-l1-a09-2', prompt: 'Traduce: «Siempre limpiamos nuestros puestos al final del turno».',
            answer: [
                     'We always clean our stations at the end of the shift',
                     'We always clean our stations at the end of our shift',
                     'We always clean our workstations at the end of the shift',
                     'We always clean our workstations at the end of our shift',
                     'We always clean down our stations at the end of the shift',
                     'We always clean down our stations at the end of our shift',
                     'We always clean down our workstations at the end of the shift',
                     'We always clean down our workstations at the end of our shift',
                     'We always clean up our stations at the end of the shift',
                     'We always clean up our stations at the end of our shift',
                     'We always clean up our workstations at the end of the shift',
                     'We always clean up our workstations at the end of our shift',
                     'At the end of the shift we always clean our stations',
                     'At the end of our shift we always clean our stations',
                     'At the end of the shift we always clean our workstations',
                     'At the end of our shift we always clean our workstations',
                     'At the end of the shift we always clean down our stations',
                     'At the end of our shift we always clean down our stations',
                     'At the end of the shift we always clean down our workstations',
                     'At the end of our shift we always clean down our workstations',
                     'At the end of the shift we always clean up our stations',
                     'At the end of our shift we always clean up our stations',
                     'At the end of the shift we always clean up our workstations',
                     'At the end of our shift we always clean up our workstations'],
            why: 'Es una rutina (always): presente simple. «always» va antes del verbo. Puesto de trabajo en la cocina = station.' }
        ] },

      { id: 'en-b1-01-l1-a10', type: 'pairs', strand: 'language', minutes: 3,
        voices: ['en-GB', 'en-US'],
        pairs: [
          { id: 'en-b1-01-l1-a10-1', a: 'ship', b: 'sheep', answer: 'b',
            why: '«sheep» tiene una i larga y tensa (/iː/), como una «i» española alargada. «ship» es corta y relajada (/ɪ/), casi entre «i» y «e».' },
          { id: 'en-b1-01-l1-a10-2', a: 'full', b: 'fool', answer: 'a',
            why: '«full» tiene una u corta y relajada (/ʊ/). «fool» tiene una u larga, con los labios redondeados (/uː/).' },
          { id: 'en-b1-01-l1-a10-3', a: 'cut', b: 'cat', answer: 'a',
            why: '«cut» tiene una vocal corta parecida a una «a» cerrada (/ʌ/). «cat» abre más la boca, entre «a» y «e» (/æ/).' },
          { id: 'en-b1-01-l1-a10-4', a: 'bit', b: 'beat', answer: 'b',
            why: '«beat» tiene la i larga (/iː/). «bit» tiene la i corta y relajada (/ɪ/).' },
          { id: 'en-b1-01-l1-a10-5', a: 'pull', b: 'pool', answer: 'b',
            why: '«pool» tiene la u larga (/uː/). «pull» tiene la u corta (/ʊ/).' },
          { id: 'en-b1-01-l1-a10-6', a: 'hat', b: 'hut', answer: 'a',
            why: '«hat» abre la boca entre «a» y «e» (/æ/). «hut» es una «a» corta y cerrada (/ʌ/).' },
          { id: 'en-b1-01-l1-a10-7', a: 'sit', b: 'seat', answer: 'a',
            why: '«sit» (sentarse) tiene la i corta y relajada (/ɪ/). «seat» (asiento) tiene la i larga (/iː/).' },
          { id: 'en-b1-01-l1-a10-8', a: 'fit', b: 'feet', answer: 'b',
            why: '«feet» tiene la i larga (/iː/). «fit» tiene la i corta (/ɪ/).' }
        ] },

      { id: 'en-b1-01-l1-a11', type: 'write', strand: 'output', minutes: 3,
        prompt: 'Write a short paragraph (at least 60 words) about your daily routine at work or at home. Use the present simple for your habits and the present continuous for something that is different this week.',
        minWords: 60 },

      { id: 'en-b1-01-l1-a12', type: 'speak', strand: 'output', minutes: 4,
        prompt: 'Describe a meal you enjoyed cooking.\nYou should say:\n- what the meal was\n- who you cooked it for\n- how you prepared it\nand explain why you enjoyed cooking it.',
        prepSeconds: 60, speakSeconds: 120 },

      { id: 'en-b1-01-l1-a13', type: 'fluency', strand: 'fluency', minutes: 9, mode: '432',
        prompt: 'Describe your workday: what you usually do, and what is different this week. Tell the same story three times: in 4 minutes, then 3, then 2.' },

      { id: 'en-b1-01-l1-a14', type: 'shadow', strand: 'fluency', minutes: 2,
        lines: [
          { voice: 'en-GB', text: 'When an order comes in, the head chef reads it out loud.' },
          { voice: 'en-US', text: 'I\'m chopping the last onions now.' },
          { voice: 'en-GB', text: 'It\'s only twelve thirty and we\'re already in the weeds.' },
          { voice: 'en-US', text: 'At the end of the shift, we clean down our stations.' }
        ] }
    ]
  }]
};
