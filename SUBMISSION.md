## Krok 3 - co zrobiłem i dlaczego

Zamiast pojedynczego gadżetu zrobiłem kolejkę, która sama układa wiadomości według ważności. Najpierw sprawdziłem, jak takie panele projektuje się w praktyce (Mavik Labs, Cobbai, StackAI) i wyszło, że chodzi w nich o jedno: człowiek ma patrzeć tam, gdzie AI jest najmniej pewne swojej odpowiedzi. Wszystko inne to dla niego strata czasu. Dlatego pewność AI (pole confidence z danych) u mnie steruje kolejką, a nie tylko się wyświetla: wypycha na górę to, co pilne i niepewne (wysoki priorytet, niska pewność), a karty dzieli na trzy poziomy - poniżej 70% to "wymaga uwagi", powyżej 90% "AI pewny".

Reszta to drobiazgi, które przyspieszają pracę operatora. Skróty z klawiatury (J/K do nawigacji, A/R/E na zatwierdź/odrzuć/edytuj, Ctrl+Enter zapis i Esc anuluj), żeby dało się przejść kolejkę bez ruszania myszki. Toast "Cofnij", bo zatwierdzona odpowiedź leci prosto do klienta i trzeba móc się wycofać. Formularz, który na żywo woła /api/classify i dorzuca wynik do kolejki. No i licznik, ile odpowiedzi trzeba było poprawić przed wysłaniem - to dobrze pokazuje, jak radzi sobie model.

## AI - jak używałem narzędzi

- Narzędzia: Claude Code (Opus). Po kolei: research, plan, implementacja, klikanie po UI w Playwright, poprawki.

- Prompt, który zadziałał najlepiej (wklejam dosłownie, skierował mnie najpierw na research zamiast od razu na kod):

  "Hmmmm, no ogólnie co myślisz dałoby najciekawszy efekt? zrób research właściwy oraz przeanalizuj dokładnie potrzeby kryjące się za takim programem, to zrobimy to porządnie"

  Dzięki temu nie wziąłem pierwszej lepszej funkcji z listy w README, tylko najpierw przyjrzałem się produktowi MyCliqy i temu, czego ludzie faktycznie potrzebują od takiej kolejki. Krok 3 wyszedł dopiero z tego.

- Gdzie AI się pomyliło i co poprawiałem ręcznie (dwa konkretne bugi, oba wyszły dopiero przy testach):

  1. Build się wywalał. Klient new OpenAI({...}) siedział na górze pliku route.ts, a Next przy buildzie odpala ten plik i rzucał błąd "OPENAI_API_KEY is missing". Przeniosłem tworzenie klienta do środka funkcji, po sprawdzeniu klucza. Wyłapane przez npm run build.

  2. Klawisz E wchodził do pola edycji. Po wejściu w edycję przez E w polu pojawiało się "ePrzepraszamy...". React montuje to pole z autofocusem jeszcze w trakcie wciśnięcia klawisza, więc litera wpadała do środka. Dodałem e.preventDefault() na skrótach. Tego nie widać w samym kodzie, wyłapałem dopiero na zrzucie z Playwright.

- Udział AI w kodzie: jakieś 85% generowane, 15% pisane albo poprawiane ręcznie (kierunek researchu, decyzje o Kroku 3, oba fixy, dostrojenie progów i promptu).

## Weryfikacja

Sprawdziłem wszystko od początku do końca. Nie chciałem kupować kredytów OpenAI na jedno zadanie, więc przetestowałem to przez darmowe Gemini, które jest kompatybilne z OpenAI (ten sam SDK, tylko inny adres). Kod i tak jest pod gpt-4o-mini zgodnie z wymogiem, request wygląda tak samo. Przeszły 4 kategorie plus trudniejsze przypadki: wiadomość i o zamówieniu, i o reklamacji naraz (bierze reklamację/high), miks polskiego z angielskim (i tak odpowiada po polsku), bardzo krótka i bardzo długa. Do tego sprawdzanie pustych pól i złego JSON-a (zwraca 400), tsc i build bez błędów oraz UI w przeglądarce (sortowanie, skróty, edycja, cofanie, widok mobilny, puste ekrany i błędy). Jak model zwróci coś nie tak, endpoint zwraca czysty błąd, a nie wywala całej strony.
