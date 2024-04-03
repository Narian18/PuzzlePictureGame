/** Represents the whole puzzle game window, manages the state of the board
 * and the "response" to dragging a puzzle-piece onto the board 
 * @constructor
 * @param {string} image: base64 of the uploaded image
 * @param {number} nSqaures: width/height of the grid (n=3 means 3x3)
 */
export class PuzzleGame {
	_nSquares;
	_image;
	_boardElement;
	_pieceAreaElement;
	_boardWidth;
	_boardHeight;
	_pieceAreaWidth;
	_activePiece;
	_piecesRemaining;
	
	_gameElementID = 'puzzle-game';
	_boardElementID = 'game-board';
	_pieceAreaElementID = 'piece-area';
	_boardSquareClass = 'board-square';
	_pieceClass = 'puzzle-piece';
	_defaultPieceWidthPer = 40;
	
	constructor(image, nSquares=3) {
		this._image = image;
		this._nSquares = nSquares;
		this._piecesRemaining = nSquares * nSquares;
	}
	
	/** computes the hieght and width of the board, and the width of the puzzle pieces area */
	_refreshBoardDimensions() {
		const boardStyles = getComputedStyle(this._boardElement);
		
		this._boardWidth = this._boardElement.clientWidth - parseInt(boardStyles.paddingLeft, 0) - parseInt(boardStyles.paddingRight, 0);
		this._boardHeight = this._boardElement.clientHeight - parseInt(boardStyles.paddingTop, 0) - parseInt(boardStyles.paddingBottom, 0);

		const pieceStyles = getComputedStyle(this._pieceAreaElement);
		this._pieceAreaWidth = this._pieceAreaElement.clientWidth - parseInt(pieceStyles.paddingLeft, 0) - parseInt(pieceStyles.paddingRight, 0);;
	}
	
	/** @return {number} width of the puzzle piece in the puzzle piece area */
	get _pieceWidth() {
		return pieceAreaWidth / 3;
	}
	
	/** @return {number} height of the puzzle piece in the puzzle piece area, matching aspect ratio to the board's */
	get _pieceHeight() {
		return this._pieceWidth * (this._boardHeight / this._boardWidth);
	}

	get _pieceAspectRatio() {
		return this._pieceAreaElement.clientHeight / this._pieceAreaWidth;
	}


	/** Mutable function implementing Fisher-Yates shuffle
     */
    _arrayRandomShuffle(inputArray) {
		for (let i = 0; i < inputArray.length; i++) {
			const numChoices = inputArray.length - i;
			const randomChoice = Math.floor(i + (Math.random() * numChoices));
			// swap the value at i with the value at `randomChoice`
			const oldVal = inputArray[i];
			inputArray[i] = inputArray[randomChoice];
			inputArray[randomChoice] = oldVal;
		}
    }

	
	/**
	 * @param {number} boardX: number of squares right on the board (think "units")
 	 * @param {number} boardY: number of squares down on the board
 	 * @returns {HTMLElement} the board square where the piece is being placed
	 */
	_getBoardSquareFromCoords(boardX, boardY) {
		const elementID = `board-${boardX}-${boardY}`;
		return document.getElementById(elementID);
	}
	
	/** Gets the board square div underneath the pointer. This is simpler than this._getPiece... because we know the board is a grid
	 * @param {number} pointerX: x position in px of the pointer
 	 * @param {number} pointerY: y position in px of the pointer
 	 * @returns {HTMLElement} the board square where the piece is being placed
	 */
	_getBoardSquareFromPosition(pointerX, pointerY) {
		const boardStartX = this._boardElement.getBoundingClientRect().x + parseInt(getComputedStyle(this._boardElement).paddingLeft);
		const boardStartY = this._boardElement.getBoundingClientRect().y + parseInt(getComputedStyle(this._boardElement).paddingTop);

		const pointerXAdjusted = pointerX - boardStartX;
		const pointerYAdjusted = pointerY - boardStartY;

		const squareWidth = (this._boardWidth / this._nSquares);
		const squareHeight = (this._boardHeight / this._nSquares);
		const boardX = Math.floor(pointerXAdjusted / squareWidth);
		const boardY = Math.floor(pointerYAdjusted / squareHeight);
		
		return this._getBoardSquareFromCoords(boardX, boardY);
	}

	/** Find the puzzle piece being clicked - the piece where the pointer is between its minX and maxX, and minY and maxY (ie
	 * drawing a box around the pointer)
	 * @param {number} pointerX: x position in px of the pointer
 	 * @param {number} pointerY: y position in px of the pointer
 	 * @returns {HTMLElement} the board square where the piece is being placed
	 */
	_getPieceFromCoords(pointerX, pointerY) {
		const allPieces = document.getElementsByClassName(this._pieceClass);
		return Object.values(allPieces).find(piece => 
			(piece.getBoundingClientRect().x < pointerX && (piece.getBoundingClientRect().x + piece.clientWidth) > pointerX) && 
			(piece.getBoundingClientRect().y < pointerY && (piece.getBoundingClientRect().y + piece.clientHeight) > pointerY)
		)
	}

	// /** Scale-up the piece to the board's size, and reposition background after scaling */
	// _resizeRepositionActivePieceBackground() {
	// 	const pieceX = this._activePiece.id.split('-')[1];
	// 	const pieceY = this._activePiece.id.split('-')[2];

	// 	this._activePiece.style.backgroundSize = `${this._nSquares * 100}% ${this._nSquares * 100}%`;
	// 	this._activePiece.style.backgroundPositionX = `${100 * pieceX / this._nSquares}%`;
	// 	this._activePiece.style.backgroundPositionY = `${100 * pieceY / this._nSquares}%`;
	// }

	/** Checks if the coordinates in the piece's ID match those of the board square's ID
	 * @param {HTMLElement} boardSquare: div element representing the board square where the piece is being placed
	 * @returns {boolean} true if the piece and square have the same coordinates
	 */
	_activePieceMatchesBoardSquare(boardSquare) {
		const pieceCoords = this._activePiece.id.slice(this._activePiece.id.indexOf('-') + 1)
		const boardSquareCoords = boardSquare.id.slice(boardSquare.id.indexOf('-') + 1);
		return pieceCoords === boardSquareCoords;
	}
	
	/** Adds piece to board on the given square (as a child) and fixes the background size and position
	 * @param {HTMLElement} boardSquare: div element representing the board square where the piece is being placed
	 * @returns {void}
	 */
	_placeActivePieceOnBoard(boardSquare) {
		boardSquare.appendChild(this._activePiece);
		
		this._activePiece.style.width = '100%';
		this._activePiece.style.height = '100%';

		if (this._activePieceMatchesBoardSquare(boardSquare)) {
			this._activePiece.draggable = false;
			if (this._piecesRemaining <= 1) {
				this._winGame();
			}
			this._piecesRemaining -= 1;
		}
	}

	_returnPieceToPicker() {
		this._pieceAreaElement.appendChild(this._activePiece);

		this._activePiece.style.width = `${this._defaultPieceWidthPer}%`;
		this._activePiece.style.height = `${this._defaultPieceWidthPer / this._pieceAspectRatio}%`;
	}

	/** Check pointer is hovering over the given element 
	 * @param {number} pointerX: x position in px of the pointer
 	 * @param {number} pointerY: y position in px of the pointer
	 * @returns {boolean} true if pointer is within the element
	 * */
	_isWithinElement(pointerX, pointerY, element) {
		const styles = getComputedStyle(element);
		
		const paddingLeft = parseInt(styles.paddingLeft, 0);
		const paddingRight = parseInt(styles.paddingRight, 0);
		const paddingTop = parseInt(styles.paddingTop, 0);
		const paddingBottom = parseInt(styles.paddingBottom, 0);
		
		const checkX = pointerX > (element.getBoundingClientRect().x + paddingLeft) && 
				pointerX < (element.getBoundingClientRect().x + element.clientWidth - paddingRight);
		const checkY = pointerY > (element.getBoundingClientRect().y + paddingTop) && 
				pointerY < (element.getBoundingClientRect().y + element.clientHeight - paddingBottom);
		return checkX && checkY;
	}

	_createBoardSquare(boardX, boardY) {
		const boardSquare = document.createElement('div');
		boardSquare.className = this._boardSquareClass;
		boardSquare.id = `board-${boardX}-${boardY}`;
		boardSquare.style.width = `${100 / this._nSquares}%`;
		boardSquare.style.height = `${100 / this._nSquares}%`;
		this._boardElement.appendChild(boardSquare);
	}

	_createPuzzlePiece(boardX, boardY) {
		const puzzlePiece = document.createElement('div');
		puzzlePiece.className = this._pieceClass;
		puzzlePiece.id = `piece-${boardX}-${boardY}`;
		puzzlePiece.style.backgroundImage = `url(${this._image})`;

		// These pieces will be in the "piece area", so that is what the percentage applies to
		const pieceHeightPer = this._defaultPieceWidthPer / this._pieceAspectRatio;	// Problem: the aspect ratio can change on resize. But screw resizing
		puzzlePiece.style.width = `${this._defaultPieceWidthPer}%`;
		puzzlePiece.style.height = `${pieceHeightPer}%`;

		const backgroundWidthPer = 100 * this._nSquares;
		const backgroundHeightPer = 100 * this._nSquares;
		puzzlePiece.style.backgroundSize = `${backgroundWidthPer}% ${backgroundHeightPer}%`;

		const backgroundXPosition = backgroundWidthPer * (boardX / this._nSquares);
		const backgroundYPosition = backgroundHeightPer * (boardY / this._nSquares);
		puzzlePiece.style.backgroundPosition = `-${backgroundXPosition}% -${backgroundYPosition}%`;

		// Draggable is also used for whether the piece is movable. Gives a visual cue that the piece is fixed in place
		puzzlePiece.draggable = true;
		return puzzlePiece;
	}

	_winGame() {
		setTimeout(() => {
			alert('You Won!!');
			this.reset();
			this.start();
		}, 100)
	}

	/** Check whether a piece is being clicked, if yes set as the active piece */
	onMouseDown(event) {
		const clickedPiece = this._getPieceFromCoords(event.clientX, event.clientY);
		if (clickedPiece && clickedPiece.draggable) {
			this._activePiece = clickedPiece;
		}
	}

	/** Place puzzle piece on the select board square. If no piece was clicked on (`this._activePiece`) do nothing. If the
	 * piece was dropped somewhere not on the board then reset */
	onDragEnd(event) {
		if (this._activePiece) {
			if (this._isWithinElement(event.clientX, event.clientY, this._boardElement)) {
				const boardSquare = this._getBoardSquareFromPosition(event.clientX, event.clientY);
				if (!boardSquare.querySelector(`.${this._pieceClass}`)) {
					// Check that the square doesn't already have a piece in it
					this._placeActivePieceOnBoard(boardSquare);
				}
			} else if (this._isWithinElement(event.clientX, event.clientY, this._pieceAreaElement)) {
				this._returnPieceToPicker()
			}
		}
		this._activePiece = undefined;
	}

	onWindowResize() {
		this._refreshBoardDimensions();
	}
	
	/**
	 * Responsible for drawing the entire game once the user has filled in the
	 * form (upload the image for the puzzle and chosen the number of pieces)
	 * 
	 * `start` is supposed to do:
	 * - Get rid of the form view on submitting
	 * - Make the board and "pieces" sections
	 *   - Honestly, I feel like here is a place to try out Vue? I want a router to 
	 *     clear the view for me, and then render the game view (the board and the
	 *     puzzle pieces section), but still let me instantiate the PuzzleGame 
	 *     given the image (I *don't* want to store temp files it must stay base64)
	 *   - Might do some hacky shit myself. This is starting to sound fun so I'm actually just going to do it
	 *     - I'll write index.html to have a "game-target" element for me. I'll
	 *       store a "game.html" file in the app and have this function read that
	 *       file and write its contents into the game-target's innerHTML
	 *     - Likewise, I'll have a game-form tag which I can write the form into
	 *       as a modal
	 *     - When you 
	 * - Create all the divs for the board programatically based on this._nSquares
	 * - Create all the puzzle pieces and place them in the "pieces" section in a 
	 *   random order. This includes calculating a size for them (width, height) and
	 *   setting the background on the pieces from that
	 */
	start() {
		document.getElementById(this._gameElementID).innerHTML = `
		<div id="game-board"></div>
		<div id="puzzle-pieces" class="column">
			<div>Piece Picker</div>
			<div id="piece-area"></div>
		</div>
		`;

		this._boardElement = document.getElementById(this._boardElementID);
		this._pieceAreaElement = document.getElementById(this._pieceAreaElementID);

		this._refreshBoardDimensions();
		
		const puzzlePieces = [];
		for (let y = 0; y < this._nSquares; y++) {
			for (let x = 0; x < this._nSquares; x++) {
				this._createBoardSquare(x, y);
				puzzlePieces.push(this._createPuzzlePiece(x, y));
			}
		};
		
		this._arrayRandomShuffle(puzzlePieces);
		puzzlePieces.forEach(puzzlePiece => {this._pieceAreaElement.appendChild(puzzlePiece); });
	}
	
	/** Empty the game element for a new game to start. Resetting keeps the image and the number of elements */
	reset() {
		this._boardElement = undefined;
		this._pieceAreaElement = undefined;
		this._boardWidth = undefined;
		this._boardHeight = undefined;
		this._pieceAreaWidth = undefined;
		this._activePiece = undefined;
		this._piecesRemaining = undefined;

		this.start();
	}
}
