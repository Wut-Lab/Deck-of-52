# Deck-of-52

A simple card game in progress, starting with a 3D deck of 52 playing cards with a dragon on the back (the "Dragon Deck"), made with [three.js](https://threejs.org).

![Dealing five cards](previews/deal.png)

## Try it

Open `index.html` in a browser (it needs an internet connection to load three.js).

- **Shuffle** – split the deck and riffle it back together in a random order
- **Deal 5** – deal the top five cards and turn them over
- **Fan** – spread the whole deck face up in an arc
- **Show all** – lay out all 52 cards by suit
- **Gather** – stack the deck again
- Tap any card to flip it; drag to look around, pinch or scroll to zoom

`art-preview.html` shows every card picture flat, for checking the artwork.

## How it's made

| File | What it does |
| --- | --- |
| `cardArt.js` | Paints each card face and the dragon back onto a 2D canvas, using code only (no image files) |
| `index.html` | The 3D table: turns those pictures into textures on thin rounded card models and animates them |
| `art-preview.html` | A flat sheet of all the card art |
| `previews/` | Screenshots |
