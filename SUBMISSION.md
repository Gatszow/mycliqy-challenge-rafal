## Krok 3 - co zrobiłem i dlaczego

Zamiast pojedynczego gadżetu zrobiłem tryb triażu oparty o pewność AI. Najpierw sprawdziłem, jak takie panele HITL projektuje się w praktyce (Mavik Labs, Cobbai, StackAI) i wyszło dość jasno, że najważniejsza jest jedna rzecz: operator ma skupiać uwagę tam, gdzie model jest najmniej pewny (double-threshold). Więc confidence u mnie to nie jest tylko liczba obok draftu. Sortuje kolejkę (najpierw priorytet, potem najniższa pewność na górze) i dzieli karty na trzy pasma: poniżej 70% leci "wymaga uwagi", powyżej 90% "AI pewny".

Reszta to rzeczy pod tempo pracy operatora. Skróty klawiszowe (J/K do nawigacji, A/R/E na akcje, Ctrl+Enter zapis i Esc anuluj w edycji), żeby dało się przeklikać kolejkę bez sięgania po mysz. Toast "Cofnij", bo zatwierdzenie idzie prosto do klienta i trzeba móc się wycofać. Formularz, który na żywo woła /api/classify i wrzuca wynik do kolejki. No i pasek statystyk z overturn rate, czyli ile draftów operator musiał poprawić przed wysyłką - to akurat niezła miara tego, jak dobrze radzi sobie model.

## AI - jak używałem narzędzi

- Narzędzia: Claude Code (Opus). Po kolei: research, plan, implementacja, klikanie po UI w Playwright, poprawki.

- Prompt, który najlepiej zadziałał (wklejam dosłownie, pchnął mnie w research zamiast od razu w kod):

  "Hmmmm, no ogólnie co myślisz dałoby najciekawszy efekt? zrób research właściwy oraz przeanalizuj dokładnie potrzeby kryjące się za takim programem, to zrobimy to porządnie"

  Dzięki temu, zamiast wziąć pierwszą funkcję z brzegu z listy w README, najpierw przyjrzałem się produktowi MyCliqy i temu, czego operatorzy faktycznie potrzebują od takiej kolejki. Krok 3 wyszedł dopiero z tego.

- Gdzie AI się pomyliło i co poprawiałem ręcznie (dwa konkretne bugi, oba wyszły dopiero przy testach):

  1. Build padał. Klient new OpenAI({...}) siedział na poziomie modułu w route.ts, a Next przy next build odpala moduł podczas zbierania danych stron i leciał błąd "OPENAI_API_KEY is missing". Przeniosłem tworzenie klienta do środka handlera, po sprawdzeniu klucza. Wyszło na npm run build.

  2. Klawisz E wchodził do pola edycji. Po wejściu w edycję przez E w polu pojawiało się "ePrzepraszamy...". React montuje textarea z autoFocus jeszcze w trakcie keydown, więc kolejny input wpisywał tę literę. Dodałem e.preventDefault() na skrótach. To akurat zobaczyłem dopiero na screenshocie z Playwright, z samego kodu bym przeoczył.

- Udział AI w kodzie: jakieś 85% generowane, 15% pisane albo poprawiane ręcznie (kierunek researchu, decyzje o Kroku 3, oba fixy, dostrojenie progów i promptu klasyfikatora).

## Weryfikacja

Przetestowałem całość end-to-end. Nie kupowałem kredytów OpenAI tylko na to zadanie, więc puściłem to przez darmowy endpoint Gemini, który jest kompatybilny z OpenAI (ten sam SDK, tylko inny baseURL). Kod i tak celuje w gpt-4o-mini zgodnie z wymogiem, request wygląda identycznie. Sprawdziłem 4 kategorie plus przypadki brzegowe: wiadomość dwuznaczną (zamówienie i reklamacja naraz, bierze reklamację/high), mieszany PL/EN (odpowiada po polsku), bardzo krótką i bardzo długą. Do tego walidacja 400 (puste pola, zły JSON), tsc i next build na zielono oraz UI w przeglądarce (triaż, skróty, edycja, undo, mobile, stany puste i błędu). Jak model zwróci coś nie tak, endpoint oddaje czysty błąd zamiast się wywalać.
