## Krok 3 - co zrobiłem i dlaczego

Zamiast wrzucać losowy gadżet, zrobiłem kolejkę, która sama układa wiadomości według ważności. Najpierw poczytałem, jak takie panele robi się w praktyce (Mavik Labs, Cobbai, StackAI) i wyszło, że chodzi w nich o jedną rzecz: człowiek ma patrzeć tam, gdzie AI jest najmniej pewne swojej odpowiedzi. Reszta to strata jego czasu. Dlatego pewność AI (to pole confidence z danych) u mnie coś robi, a nie tylko się wyświetla: wypycha na górę to, co pilne i niepewne (wysoki priorytet, niska pewność), a karty dzieli na trzy poziomy - poniżej 70% leci "wymaga uwagi", powyżej 90% "AI pewny".

Reszta to drobiazgi, żeby operator szybciej przemielił kolejkę. Skróty z klawiatury (J/K do skakania po liście, A/R/E na zatwierdź/odrzuć/edytuj, Ctrl+Enter zapis i Esc anuluj), żeby dało się czyścić kolejkę bez ruszania myszki. Toast "Cofnij", bo jak coś zatwierdzisz, to leci prosto do klienta i trzeba móc się wycofać. Formularz, który na żywo woła /api/classify i dorzuca wynik do kolejki. No i licznik, ile odpowiedzi trzeba było poprawić przed wysłaniem - bo to akurat fajnie pokazuje, jak dobrze AI sobie radzi.

## AI - jak używałem narzędzi

- Narzędzia: Claude Code (Opus). Po kolei: research, plan, kodzenie, klikanie po UI w Playwright, poprawki.

- Prompt, który najlepiej zadziałał (wklejam jak leciało, popchnął mnie w research zamiast od razu w klepanie kodu):

  "Hmmmm, no ogólnie co myślisz dałoby najciekawszy efekt? zrób research właściwy oraz przeanalizuj dokładnie potrzeby kryjące się za takim programem, to zrobimy to porządnie"

  Dzięki temu nie wziąłem pierwszej lepszej funkcji z listy w README, tylko najpierw obczaiłem produkt MyCliqy i to, czego ludzie faktycznie potrzebują od takiej kolejki. Krok 3 wyszedł dopiero z tego.

- Gdzie AI się wyłożyło i co poprawiałem ręcznie (dwa konkretne bugi, oba wyszły dopiero przy testach):

  1. Build się sypał. Klient new OpenAI({...}) siedział na górze pliku route.ts, a Next przy buildzie odpala ten plik i wyrzucał błąd "OPENAI_API_KEY is missing". Przeniosłem tworzenie klienta do środka funkcji, po sprawdzeniu klucza. Złapało się na npm run build.

  2. Klawisz E wskakiwał do pola edycji. Po wejściu w edycję przez E w polu robiło się "ePrzepraszamy...". React montuje to pole z autofocusem jeszcze w trakcie wciśnięcia klawisza, więc litera wpadała do środka. Dorzuciłem e.preventDefault() na skrótach. Tego akurat nie widać w kodzie, wyłapałem dopiero na screenie z Playwright.

- Ile z tego to AI: jakieś 85% generowane, 15% pisane albo poprawiane ręcznie (kierunek researchu, decyzje o Kroku 3, oba fixy, dłubanie przy progach i promptcie).

## Weryfikacja

Sprawdziłem wszystko od początku do końca. Nie chciałem kupować kredytów OpenAI na jedno zadanie, więc puściłem to przez darmowe Gemini, które gada tym samym protokołem co OpenAI (ten sam SDK, tylko inny adres). Kod i tak jest pod gpt-4o-mini zgodnie z wymogiem, request wygląda tak samo. Przeszły 4 kategorie plus trudniejsze przypadki: wiadomość i o zamówieniu, i o reklamacji naraz (bierze reklamację/high), miks polskiego z angielskim (i tak odpowiada po polsku), bardzo krótka i bardzo długa. Do tego sprawdzanie pustych pól i złego JSON-a (zwraca 400), tsc i build na zielono, no i samo UI w przeglądarce (sortowanie, skróty, edycja, cofanie, mobilka, puste ekrany i błędy). Jak model zwróci coś nie tak, to wychodzi czysty błąd, a nie wywalenie całej strony.
