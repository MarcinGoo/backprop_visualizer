# Backprop Visualizer

Aplikacja edukacyjna służąca do wizualizacji działania propagacji w przód (Forward Pass) oraz wstecz (Backward Pass / Chain Rule) w grafach obliczeniowych (sieciach neuronowych).

Projekt został stworzony z użyciem **React**, **TypeScript** oraz **Vite**. Wykorzystuje bibliotekę **KaTeX** do profesjonalnego renderowania wzorów matematycznych oraz **React Flow** do interaktywnych wizualizacji grafu.

## 🚀 Jak uruchomić projekt lokalnie?

Aby uruchomić aplikację na własnym komputerze, upewnij się, że masz zainstalowanego **Node.js** (zalecana wersja 18+).

### Krok 1: Klonowanie repozytorium
Skopiuj repozytorium na swój komputer przy użyciu Gita:
```bash
git clone https://github.com/MarcinGoo/backprop_visualizer.git
cd backprop_visualizer
```

### Krok 2: Instalacja zależności
Zainstaluj wszystkie wymagane pakiety używając NPM:
```bash
npm install
```

### Krok 3: Uruchomienie serwera deweloperskiego
Odpal aplikację w trybie deweloperskim:
```bash
npm run dev
```
Domyślnie aplikacja będzie dostępna pod adresem: **http://localhost:5173**.

---

## 🛠 Jak zbudować wersję produkcyjną?
Jeśli chcesz wygenerować zoptymalizowane pliki do wdrożenia (np. na zewnętrznym serwerze lub na GitHub Pages), uruchom polecenie:
```bash
npm run build
```
Zbudowane pliki frontendu (wraz z zoptymalizowanymi fontami KaTeX) znajdą się w folderze `dist/`.
