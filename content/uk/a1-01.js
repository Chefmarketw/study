/* Unidad uk-a1-01 «Абе́тка» (el alfabeto) — lección 1 (muestra). Contenido original.
   Pendiente de revisión de una hablante nativa (needsNativeCheck). Acento: U+0301 en toda palabra de más de una sílaba. */
window.STUDY.units['uk-a1-01'] = {
  id: 'uk-a1-01',
  title: 'Абе́тка',
  titleEs: 'El alfabeto',
  needsNativeCheck: true,
  goals: [
    'Reconocer y leer las primeras 11 letras del alfabeto ucraniano.',
    'No confundir las «falsas amigas»: Н suena n, Р suena r, В suena v y С suena s.',
    'Entender y responder un saludo muy corto.'
  ],
  lessons: [{
    id: 'uk-a1-01-l1',
    title: 'Пе́рші лі́тери',
    activities: [
      { id: 'uk-a1-01-l1-a01', type: 'pretest', strand: 'language', minutes: 1,
        items: [
          { id: 'uk-a1-01-l1-a01-1', word: 'торт', image: '🎂',
            options: ['torta', 'pan', 'sopa', 'queso'], answer: 'torta' },
          { id: 'uk-a1-01-l1-a01-2', word: 'ка́ва', image: '☕',
            options: ['café', 'agua', 'leche', 'té'], answer: 'café' },
          { id: 'uk-a1-01-l1-a01-3', word: 'сік', image: '🧃',
            options: ['jugo', 'sal', 'arroz', 'vino'], answer: 'jugo' }
        ] },

      { id: 'uk-a1-01-l1-a02', type: 'letters', strand: 'language', minutes: 6,
        letters: [
          { id: 'uk-a1-01-l1-a02-l01', letter: 'А', soundEs: '«a», como en «casa»', word: 'ка́ва', wordEs: 'café', image: '☕' },
          { id: 'uk-a1-01-l1-a02-l02', letter: 'К', soundEs: '«k», como en «casa»', word: 'кіт', wordEs: 'gato', image: '🐈' },
          { id: 'uk-a1-01-l1-a02-l03', letter: 'М', soundEs: '«m», como en «mamá»', word: 'ма́ма', wordEs: 'mamá', image: '👩' },
          { id: 'uk-a1-01-l1-a02-l04', letter: 'О', soundEs: '«o», como en «oso»; siempre suena o, aunque no lleve el acento', word: 'о́ко', wordEs: 'ojo', image: '👁️' },
          { id: 'uk-a1-01-l1-a02-l05', letter: 'Т', soundEs: '«t», como en «taza»', word: 'торт', wordEs: 'torta', image: '🎂' },
          { id: 'uk-a1-01-l1-a02-l06', letter: 'Е', soundEs: '«e», como en «mesa»', word: 'метро́', wordEs: 'metro', image: '🚇' },
          { id: 'uk-a1-01-l1-a02-l07', letter: 'І', soundEs: '«i», como en «isla»', word: 'сік', wordEs: 'jugo', image: '🧃' },
          { id: 'uk-a1-01-l1-a02-l08', letter: 'Н', soundEs: '«n», como en «nada»', word: 'ні', wordEs: 'no', image: '🙅',
            keyword: 'Parece una H, pero es N: «ні» es «no».' },
          { id: 'uk-a1-01-l1-a02-l09', letter: 'Р', soundEs: '«r», como en «pero»', word: 'рот', wordEs: 'boca', image: '👄',
            keyword: 'Parece una P, pero es R: «рот» (rot) es «boca».' },
          { id: 'uk-a1-01-l1-a02-l10', letter: 'С', soundEs: '«s», como en «sal»', word: 'сова́', wordEs: 'búho', image: '🦉',
            keyword: 'Parece una C, pero siempre suena S: «сова́» (sová) es «búho».' },
          { id: 'uk-a1-01-l1-a02-l11', letter: 'В', soundEs: '«v», como la v del inglés «very»', word: 'вікно́', wordEs: 'ventana', image: '🪟',
            keyword: 'Parece una B, pero es V: «вікно́» (viknó) es «ventana».' }
        ],
        quiz: [
          { id: 'uk-a1-01-l1-a02-1', prompt: '¿Cómo suena la letra Н?', options: ['n', 'h', 'j', 'm'], answer: 'n',
            why: 'Н parece la H latina, pero suena «n», como en «ні» (no).' },
          { id: 'uk-a1-01-l1-a02-2', prompt: '¿Cómo suena la letra Р?', options: ['r', 'p', 'b', 'd'], answer: 'r',
            why: 'Р parece la P latina, pero suena «r», como en «рот» (boca).' },
          { id: 'uk-a1-01-l1-a02-3', prompt: '¿Cómo suena la letra В?', options: ['v', 'b', 'u', 'f'], answer: 'v',
            why: 'В parece la B latina, pero suena «v», como en «вікно́» (ventana).' },
          { id: 'uk-a1-01-l1-a02-4', prompt: '¿Cómo suena la letra С?', options: ['s', 'k', 'ch', 'p'], answer: 's',
            why: 'С parece la C latina, pero siempre suena «s», como en «сова́» (búho).' },
          { id: 'uk-a1-01-l1-a02-5', prompt: '¿Cómo suena la letra І?', options: ['i', 'l', 'y', 'e'], answer: 'i',
            why: 'І suena «i», como en «сік» (jugo).' }
        ] },

      { id: 'uk-a1-01-l1-a03', type: 'listen', strand: 'input', minutes: 3,
        lines: [
          { voice: 'uk-UA', text: 'Приві́т! Як спра́ви?', es: '¡Hola! ¿Cómo estás?' },
          { voice: 'uk-UA', text: 'Приві́т! До́бре, дя́кую. А в тебе́?', es: '¡Hola! Bien, gracias. ¿Y tú?' },
          { voice: 'uk-UA', text: 'Теж до́бре. Хо́чеш ка́ви?', es: 'También bien. ¿Quieres café?' },
          { voice: 'uk-UA', text: 'Так, дя́кую!', es: '¡Sí, gracias!' }
        ],
        questions: [
          { id: 'uk-a1-01-l1-a03-1', q: '¿Cómo está la segunda persona?',
            options: ['Bien', 'Mal', 'Cansada', 'Con hambre'], answer: 'Bien',
            why: 'Dice «До́бре, дя́кую»: «Bien, gracias».' },
          { id: 'uk-a1-01-l1-a03-2', q: '¿Qué ofrece la primera persona al final?',
            options: ['Café', 'Té', 'Jugo', 'Torta'], answer: 'Café',
            why: '«Хо́чеш ка́ви?» es «¿Quieres café?»; «ка́ви» es una forma de «ка́ва», café.' }
        ] },

      { id: 'uk-a1-01-l1-a04', type: 'choice', strand: 'language', minutes: 4,
        items: [
          { id: 'uk-a1-01-l1-a04-1', prompt: '¿Cómo se lee «ні»?', options: ['ni', 'hi', 'ji', 'nu'], answer: 'ni',
            why: 'Н suena «n» e І suena «i»: «ni». Significa «no».' },
          { id: 'uk-a1-01-l1-a04-2', prompt: '¿Cómo se lee «рот»?', options: ['rot', 'pot', 'pom', 'rok'], answer: 'rot',
            why: 'Р suena «r», О suena «o» y Т suena «t»: «rot». Significa «boca».' },
          { id: 'uk-a1-01-l1-a04-3', prompt: '¿Cómo se lee «сік»?', options: ['sik', 'nik', 'kis', 'sok'], answer: 'sik',
            why: 'С suena «s», І suena «i» y К suena «k»: «sik». Significa «jugo».' },
          { id: 'uk-a1-01-l1-a04-4', prompt: '¿Cómo se lee «вікно́»?', options: ['viknó', 'bikno', 'víkno', 'vinko'], answer: 'viknó',
            why: 'В suena «v»; el acento (´) está en la О final: «viknó». Significa «ventana».' },
          { id: 'uk-a1-01-l1-a04-5', prompt: '¿Cómo se lee «метро́»?', options: ['metró', 'métro', 'mepto', 'netro'], answer: 'metró',
            why: 'Р suena «r» (no «p») y el acento va en la О: «metró».' },
          { id: 'uk-a1-01-l1-a04-6', prompt: '¿Qué letra suena «s»?', options: ['С', 'Н', 'Р', 'В'], answer: 'С',
            why: 'С parece una C, pero siempre suena «s».' },
          { id: 'uk-a1-01-l1-a04-7', prompt: '¿Qué letra suena «v»?', options: ['В', 'Р', 'Н', 'К'], answer: 'В',
            why: 'В parece una B, pero suena «v».' },
          { id: 'uk-a1-01-l1-a04-8', prompt: '¿Qué palabra significa «ojo»?', options: ['о́ко', 'ма́ма', 'рот', 'ні'], answer: 'о́ко',
            why: '«о́ко» (óko) es «ojo»; «рот» es «boca».' }
        ] },

      { id: 'uk-a1-01-l1-a05', type: 'speak', strand: 'output', minutes: 3,
        prompt: 'Responde en voz alta a este saludo: di hola, cómo estás y tu nombre.\nПриві́т! Як спра́ви? Як тебе́ зва́ти?\n(¡Hola! ¿Cómo estás? ¿Cómo te llamas?)\nAyuda: Приві́т! До́бре, дя́кую. Мене́ зва́ти … (¡Hola! Bien, gracias. Me llamo …)',
        prepSeconds: 0, speakSeconds: 60 },

      { id: 'uk-a1-01-l1-a06', type: 'fluency', strand: 'fluency', minutes: 3, mode: 'reread',
        text: 'А К М О Т Е І Н Р С В' }
    ]
  }]
};
