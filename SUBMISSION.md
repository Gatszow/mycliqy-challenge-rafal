## Krok 3 — co zrobiłem i dlaczego

Zbudowałem **tryb triażu sterowany pewnością AI** zamiast pojedynczego gadżetu — bo po researchu (Mavik Labs, Cobbai, StackAI) zobaczyłem, że sercem każdego panelu HITL jest *double-threshold policy*: człowiek ma patrzeć tam, gdzie model jest najmniej pewny. Dlatego `confidence` nie jest u mnie ozdobą, tylko **sortuje kolejkę** (priorytet → najniższa pewność na górze) i dzieli karty na pasma (`<70%` = „⚠ wymaga uwagi", `>90%` = „AI pewny"). Do tego dołożyłem rzeczy, które realnie podnoszą bezpieczną przepustowość operatora: **skróty klawiszowe** (J/K nawigacja, A/R/E akcje, Ctrl+Enter zapis / Esc anuluj w edycji — cały przepływ bez odrywania rąk od klawiatury), **toast „Cofnij"** (bo zatwierdzenie = wysyłka do klienta — akcja musi być odwracalna), **formularz na żywo** wołający `/api/classify` (dowód, że endpoint działa end-to-end) oraz **pasek metryk** z *overturn rate* (% draftów poprawionych przed wysyłką — rynkowa miara jakości AI). Całość spięta jedną tezą: panel istnieje, by maksymalizować bezpieczną przepustowość operatora.

## AI — jak używałem narzędzi

- **Narzędzia:** Claude Code (model Opus). Cały flow: research domenowy → plan → implementacja → weryfikacja w przeglądarce (Playwright) → poprawki.

- **Prompt który zadziałał najlepiej** (wklejony dosłownie — wymusił research-first zamiast skoku do kodu):

  > „Hmmmm, no ogólnie co myślisz dałoby najciekawszy efekt? zrób research właściwy oraz przeanalizuj dokładnie potrzeby kryjące się za takim programem, to zrobimy to porządnie"

  Efekt: zamiast losowo wybrać funkcję z listy w README, AI najpierw przeanalizowało produkt MyCliqy i przeszukało sieć pod kątem tego, *czego realnie oczekują operatorzy od kolejki HITL* — i dopiero z tego wyprowadziło Krok 3. To przesunęło projekt z „działa" na „rozumie po co to jest".

- **Gdzie AI się pomyliło i co poprawiłem ręcznie** (dwa realne bugi, oba złapane podczas weryfikacji, nie w teorii):

  1. **Build się wywalał** — klient `new OpenAI({...})` był tworzony na poziomie modułu w `route.ts`. Next przy `next build` zbiera dane stron i wykonuje moduł → rzucał `OPENAI_API_KEY is missing`, mimo że na runtime klucz by był. Poprawka: leniwa inicjalizacja klienta **wewnątrz** handlera, dopiero po sprawdzeniu klucza (dzięki temu guard `500` ma sens). Wyłapane przez `npm run build`.

  2. **Klawisz `E` wciekał do pola edycji** — po wejściu w edycję skrótem `E` textarea pokazywała „**e**Przepraszamy…". React synchronicznie montuje `<textarea autoFocus>` jeszcze w trakcie zdarzenia `keydown`, więc następujący `input` wpisywał literę. Poprawka: `e.preventDefault()` na obsługiwanych skrótach. Wyłapane wizualnie przez screenshot w Playwright — czysto logicznie bym to przeoczył.

- **Szacowany udział AI w kodzie:** ~85% wygenerowane, ~15% napisane/poprawione ręcznie (kierunek researchu, decyzje produktowe o Kroku 3, oba powyższe fixy, dostrojenie progów i promptu klasyfikatora).
