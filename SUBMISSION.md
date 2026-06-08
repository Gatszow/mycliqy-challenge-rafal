## Krok 3 - co zrobiłem i dlaczego

Zamiast pojedynczego gadżetu zbudowałem tryb triażu sterowany pewnością AI. Po researchu (Mavik Labs, Cobbai, StackAI) zobaczyłem, że sercem każdego panelu HITL jest double-threshold policy: człowiek ma patrzeć tam, gdzie model jest najmniej pewny. Dlatego confidence nie jest u mnie ozdobą. Sortuje kolejkę (priorytet, a potem najniższa pewność na górze) i dzieli karty na pasma (poniżej 70% to "wymaga uwagi", powyżej 90% to "AI pewny").

Do tego dołożyłem rzeczy, które realnie podnoszą przepustowość operatora. Skróty klawiszowe (J/K nawigacja, A/R/E akcje, Ctrl+Enter zapis i Esc anuluj w edycji), więc cały przepływ idzie bez odrywania rąk od klawiatury. Toast "Cofnij", bo zatwierdzenie to wysyłka do klienta i akcja musi być odwracalna. Formularz na żywo wołający /api/classify, czyli widać, że endpoint działa end-to-end. Pasek metryk z overturn rate, czyli ile draftów operator poprawił przed wysyłką (to rynkowa miara jakości AI). Wszystko pod jedną tezą: panel ma maksymalizować bezpieczną przepustowość operatora.

## AI - jak używałem narzędzi

- Narzędzia: Claude Code (model Opus). Cały flow: research domenowy, plan, implementacja, weryfikacja w przeglądarce (Playwright), poprawki.

- Prompt, który zadziałał najlepiej (wklejony dosłownie, wymusił research zamiast skoku do kodu):

  "Hmmmm, no ogólnie co myślisz dałoby najciekawszy efekt? zrób research właściwy oraz przeanalizuj dokładnie potrzeby kryjące się za takim programem, to zrobimy to porządnie"

  Efekt: zamiast losowo wybrać funkcję z listy w README, najpierw przeanalizowałem produkt MyCliqy i sprawdziłem w sieci, czego realnie oczekują operatorzy od kolejki HITL. Dopiero z tego wyszedł Krok 3.

- Gdzie AI się pomyliło i co poprawiłem ręcznie (dwa realne bugi, oba złapane przy weryfikacji):

  1. Build się wywalał. Klient new OpenAI({...}) był tworzony na poziomie modułu w route.ts, a Next przy next build wykonuje moduł podczas zbierania danych stron i rzucał "OPENAI_API_KEY is missing". Poprawka: leniwa inicjalizacja klienta wewnątrz handlera, po sprawdzeniu klucza. Złapane przez npm run build.

  2. Klawisz E wciekał do pola edycji. Po wejściu w edycję skrótem E textarea pokazywała "ePrzepraszamy...". React montuje textarea z autoFocus jeszcze w trakcie zdarzenia keydown, więc kolejny input wpisywał literę. Poprawka: e.preventDefault() na obsługiwanych skrótach. Złapane wizualnie na screenshocie w Playwright.

- Szacowany udział AI w kodzie: jakieś 85% wygenerowane, 15% napisane lub poprawione ręcznie (kierunek researchu, decyzje produktowe, oba fixy, dostrojenie progów i promptu klasyfikatora).

## Weryfikacja

Cały przepływ przetestowany end-to-end. Żeby nie kupować kredytów OpenAI na jedno zadanie, puściłem to przez darmowy endpoint Gemini kompatybilny z OpenAI (ten sam SDK, inny baseURL). Kod celuje w gpt-4o-mini zgodnie z wymogiem, kształt żądania jest identyczny. Sprawdziłem 4 kategorie i przypadki brzegowe: wiadomość dwuznaczną (zamówienie plus reklamacja, klasyfikuje jako reklamację/high), mieszany PL/EN (odpowiada po polsku), bardzo krótką i bardzo długą. Do tego walidacja 400 (puste pola, zły JSON), tsc --noEmit i next build bez błędów oraz UI w przeglądarce (triaż, skróty, edycja, undo, responsywność, stany puste i błędu). Przy błędnej odpowiedzi modelu endpoint zwraca czysty błąd, nie wywala się.
