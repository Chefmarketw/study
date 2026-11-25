/* Práctica gt-reading-s1-01: Reading General, Sección 1 (corta, sin banda). Contenido original. */
window.STUDY.ielts['gt-reading-s1-01'] = {
  id: 'gt-reading-s1-01',
  part: 'reading',
  kind: 'short',
  minutes: 15,
  title: 'Reading General · Sección 1 · The Copper Pot',
  passages: [
    { id: 'A', title: 'The Copper Pot: information for customers',
      text: 'Opening hours\n' +
            'Tuesday to Saturday: 12 noon to 10.30 pm (last orders at 9.45 pm)\n' +
            'Sunday: 12 noon to 4 pm (lunch only)\n' +
            'We are closed on Mondays, except on public holidays.\n\n' +
            'Booking a table\n' +
            'You can book a table online or by phone up to 30 days in advance. Tables for groups of eight or more must be booked by phone, and we ask for a deposit of £10 per person. The deposit is taken off your final bill. It is returned in full if you cancel at least 48 hours before your booking.\n\n' +
            'Allergies and special diets\n' +
            'Please tell your server about any allergies before you order. All our dishes are prepared in the same kitchen, so we cannot promise that any dish is completely free of nuts. Vegetarian dishes are marked (V) on the menu, and most of them can be made vegan on request.\n\n' +
            'Children\n' +
            'Children are welcome at all times. High chairs are available, but please mention that you need one when you book.\n\n' +
            'Parking\n' +
            'The restaurant does not have its own car park. Customers can park free of charge in the Market Street car park after 6 pm.' },
    { id: 'B', title: 'The Copper Pot: set lunch menu',
      text: 'Available Tuesday to Friday, 12 noon to 3 pm\n' +
            'Two courses £16.50 · Three courses £20\n\n' +
            'Starters\n' +
            '• Soup of the day, served with homemade bread (V)\n' +
            '• Grilled sardines with lemon and parsley\n' +
            '• Beetroot salad with goat\'s cheese and walnuts (V)\n\n' +
            'Main courses\n' +
            '• Roast chicken with garlic potatoes and green beans\n' +
            '• Fish of the day with rice and tomato sauce (please ask your server)\n' +
            '• Mushroom and spinach risotto (V)\n\n' +
            'Desserts\n' +
            '• Apple crumble with custard\n' +
            '• Chocolate mousse\n' +
            '• A selection of ice creams\n\n' +
            'Tea or filter coffee is included with the three-course menu. Other drinks are charged separately. A service charge of 10% is added to the bill for tables of six or more.' }
  ],
  questions: [
    // Preguntas 1–6: TRUE / FALSE / NOT GIVEN (texto A)
    { id: 'gt-reading-s1-01-1', passage: 'A', type: 'tfng', options: ['TRUE', 'FALSE', 'NOT GIVEN'],
      q: 'The restaurant is always closed on Mondays.', answer: 'FALSE',
      why: 'Dice «closed on Mondays, except on public holidays»: los lunes festivos abre. Por eso la palabra always de la frase la vuelve falsa.' },
    { id: 'gt-reading-s1-01-2', passage: 'A', type: 'tfng', options: ['TRUE', 'FALSE', 'NOT GIVEN'],
      q: 'Groups of eight or more people can book a table online.', answer: 'FALSE',
      why: '«Tables for groups of eight or more must be booked by phone»: esos grupos solo reservan por teléfono.' },
    { id: 'gt-reading-s1-01-3', passage: 'A', type: 'tfng', options: ['TRUE', 'FALSE', 'NOT GIVEN'],
      q: 'A group of ten that cancels its booking one week before will get its deposit back.', answer: 'TRUE',
      why: 'Un grupo de diez (ocho o más) paga depósito, y se devuelve completo si cancela «at least 48 hours before». Una semana es más de 48 horas.' },
    { id: 'gt-reading-s1-01-4', passage: 'A', type: 'tfng', options: ['TRUE', 'FALSE', 'NOT GIVEN'],
      q: 'Customers who need a high chair should say so when they book.', answer: 'TRUE',
      why: '«please mention that you need one when you book»: piden avisarlo al reservar.' },
    { id: 'gt-reading-s1-01-5', passage: 'A', type: 'tfng', options: ['TRUE', 'FALSE', 'NOT GIVEN'],
      q: 'The restaurant has a special menu for children.', answer: 'NOT GIVEN',
      why: 'El texto habla de niños y de sillas altas, pero no dice nada de un menú infantil. No se puede saber: NOT GIVEN.' },
    { id: 'gt-reading-s1-01-6', passage: 'A', type: 'tfng', options: ['TRUE', 'FALSE', 'NOT GIVEN'],
      q: 'The restaurant can promise that a dish contains no nuts.', answer: 'FALSE',
      why: '«we cannot promise that any dish is completely free of nuts»: el texto dice lo contrario.' },
    // Preguntas 7–10: completar (NO MORE THAN TWO WORDS AND/OR A NUMBER)
    { id: 'gt-reading-s1-01-7', passage: 'A', type: 'complete',
      q: 'On Sundays, the restaurant only serves ______.', answer: ['lunch'],
      why: '«Sunday: 12 noon to 4 pm (lunch only)».' },
    { id: 'gt-reading-s1-01-8', passage: 'A', type: 'complete',
      q: 'Customers can park for free in the Market Street car park after ______.',
      answer: ['6 pm', '6pm', '6 p.m.', '6', 'six', 'six pm', '18:00'],
      why: '«free of charge in the Market Street car park after 6 pm». «free of charge» = gratis.' },
    { id: 'gt-reading-s1-01-9', passage: 'B', type: 'complete',
      q: 'Tea or ______ is included with the three-course lunch menu.',
      answer: ['filter coffee', 'coffee'],
      why: '«Tea or filter coffee is included with the three-course menu». Con el de dos platos no se incluye.' },
    { id: 'gt-reading-s1-01-10', passage: 'B', type: 'complete',
      q: 'Tables of six or more people pay a service charge of ______.',
      answer: ['10%', '10 %', '10 percent', '10 per cent', 'ten percent', 'ten per cent'],
      why: '«A service charge of 10% is added to the bill for tables of six or more». service charge = cargo por servicio (propina incluida en la cuenta).' }
  ]
};
