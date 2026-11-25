# $CHEF Study

A personal language-study web app (English toward IELTS General Training, and Ukrainian from zero), with a kitchen theme. The interface is in Spanish.

- Plain HTML, CSS and JavaScript: no build step, no server code, no tracking.
- Progress is saved only on the device (`localStorage`, key `study-v1`). Voice recordings stay in memory and never leave the phone.
- All study content is original.
- Spaced repetition uses [ts-fsrs](https://github.com/open-spaced-repetition/ts-fsrs) 5.4.2 (MIT); its license is in `vendor/LICENSE-ts-fsrs.txt`.
- The Ukrainian audio in `audio/uk/` was generated with the open voice "tetiana" of [ukrainian-tts](https://github.com/robinhad/ukrainian-tts) (MIT). English uses the phone's own voice.

To install on an iPhone: open the site in Safari → Share → Add to Home Screen.
