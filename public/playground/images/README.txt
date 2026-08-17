Playground — cover image directory

Put cover images here, then add an entry in src/data/playground.ts:

  {
    id: 'my-piece',
    title: 'My Piece',
    cover: 'playground/images/my-piece.png',
  }

Tile aspect ratio follows the cover automatically; wide images span more columns. Rows may leave whitespace — tiles do not need to pack tightly.
