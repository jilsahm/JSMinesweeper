"use strict";

var currentGame = null;

window.onload = function(){    
    newGame();
    document.getElementById( "restart" ).onclick = newGame;
};

var Options = {
    "columns"    : 8,
    "rows"       : 10,
    "bombs"      : 12
}

function GameFactory(){
    if ( currentGame !== null ){
        currentGame.stop( true );
    }
    return new Game( Options.columns, Options.rows, Options.bombs );
}

class Game{
    constructor( columns, rows, bombs ){
        this.columns       = columns;
        this.rows          = rows;
        this.bombs         = bombs;
        this.totalcells    = columns * rows;
        this.remainigBombs = bombs;
        this.starttime     = 0;
        this.timer         = null;
        this.firstclick    = true;
        this.over          = false;
        this.cells         = [];
    }
    start(){
        this.starttime = Date.now();        
        this.totalcells = this.columns * this.rows;
        this.leftBombs = this.bombs;
        this.timer = setInterval( refreshTime, 1000 );
        document.getElementById( "currentMines" ).innerHTML = this.leftBombs;
    }
    stop( force = false ){       
        if( this.timer !== null ){
            clearInterval( this.timer );
        }
        if ( !force ){
            for ( let row of this.cells ){
                for ( let cell of row ){
                    if ( !cell.revealed ) {
                        cell.reveal();
                    }
                }
            }
            if ( this.over ){
                document.getElementById( "message" ).innerHTML = "Game Over";
            } else {
                document.getElementById( "message" ).innerHTML = "Victory";
            } 
        }
    }
    tryWinning(){
        this.totalcells -= 1;
        if ( this.totalcells === this.bombs && !this.over ){
            this.stop();
        }
        console.log( this.totalcells );
    }
}

function refreshTime(){
    let millis  = Date.now() - currentGame.starttime;
    let hours   = Math.floor( millis / 3600000 );
    let minutes = Math.floor( ( millis % 3600000 ) / 60000 );
    let seconds = Math.floor( ( millis % 3600000 % 60000 ) / 1000 );
    hours   = ( hours < 10 ) ? `0${hours}` : hours;
    minutes = ( minutes < 10 ) ? `0${minutes}` : minutes;
    seconds = ( seconds < 10 ) ? `0${seconds}` : seconds;
    document.getElementById( "time" ).innerHTML = `${hours}:${minutes}:${seconds}`;
}

function buildFontAwesomeIcon( name ){
    let icon = document.createElement( "i" );
    icon.classList.add( "fas", `fa-${name}` );
    return icon;
}

class Cell{
    
    constructor( x, y ){
        var  me        = this;
        this.bomb      = false;
        this.locked    = false;
        this.revealed  = false;
        this.proximity = 0;
        this.x         = x;
        this.y         = y;
        this.div       = document.createElement( "div" );
        this.div.classList.add( "cell" );
        this.div.onclick = function(){
            me.onLeftClick( me );
        };
        this.div.oncontextmenu = function(){
            return me.onRightClick( me );
        };
    }
    
    onLeftClick( me ){
        if ( currentGame.firstclick === true ){
            setupBombs( me );
            setupProximity();
            currentGame.firstclick = false;
        } else if ( me.locked ){
            return;
        }   
        me.reveal();
        if( me.bomb ){ 
            currentGame.over = true;
            currentGame.stop();
        } else if ( 0 === me.proximity ){
            checkAllNeighbours( me, this.revealNeighbour );
        }              
    }
    
    reveal(){
        if ( this.bomb ){
            if ( 0 < this.div.childNodes.length ){
                this.div.replaceChild( buildFontAwesomeIcon( "bomb" ), this.div.childNodes[0] );
            } else {
                this.div.appendChild( buildFontAwesomeIcon( "bomb" ) );
            }
            
        } else if ( 0 < this.proximity ){
            this.div.innerHTML = this.proximity;
        }        
        currentGame.tryWinning();
        this.revealed = true;
        this.div.onclick = null;
        this.div.oncontextmenu = null;
        this.div.classList.add( "revealed" ); 
    }
    
    revealNeighbour( me, x, y ){
        let target = currentGame.cells[y][x];
        if ( !target.revealed ){
            target.reveal();
            if ( 0 === target.proximity && !target.bomb ){
                checkAllNeighbours( target, target.revealNeighbour );
            }            
        }
    }
    
    onRightClick( me ){
        if ( me.locked ){
            me.div.removeChild( me.div.childNodes[0] );
            updateFlagCount( 1 );
        } else {
            me.div.appendChild( buildFontAwesomeIcon( "flag" ) );
            updateFlagCount( -1 );
        }
        me.locked = !me.locked;
        return false;
    }
    
    empty(){
        return !this.bomb;
    }
    
    debug(){
        console.log( `Im at x=${this.x} y=${this.y}` );
    }
}

function newGame(){
    let minefield = document.getElementById( "minefield" );
    
    while ( minefield.hasChildNodes() ) {  
        minefield.removeChild( minefield.firstChild );
    } 
    
    currentGame = GameFactory();
    createMinefield();
    document.getElementById( "currentMines" ).innerHTML = Options.bombs;
    document.getElementById( "time" ).innerHTML = "00:00:00";  
    document.getElementById( "message" ).innerHTML = "";
}

function updateFlagCount( mod ){
    currentGame.leftBombs += mod;
    document.getElementById( "currentMines" ).innerHTML = currentGame.leftBombs;
}

function createMinefield(){
    let minefield = document.getElementById( "minefield" );
    for( let row = 0; row < currentGame.rows; row++ ){
        let currentRow = document.createElement( "div" );
        let cellRow    = [];
        currentRow.classList.add( "row" );
        
        for( let column = 0; column < currentGame.columns; column++ ){
            let cell = new Cell( column, row );
            cellRow.push( cell );
            currentRow.appendChild( cell.div );
        }
        currentGame.cells.push( cellRow );
        minefield.appendChild( currentRow );
    }
}

function setupBombs( clickedCell ){
    let availableBombs = currentGame.bombs;
    while ( 0 < availableBombs ){
        let randomX = Math.floor( Math.random() * currentGame.columns );
        let randomY = Math.floor( Math.random() * currentGame.rows );
        if ( currentGame.cells[randomY][randomX].empty() &&
             randomX !== clickedCell.x &&
             randomY !== clickedCell.y ){
                currentGame.cells[randomY][randomX].bomb = true ;
                availableBombs -= 1;
        }        
    }
}

function setupProximity(){
    for ( let row of currentGame.cells ){
        for ( let cell of row ){
            if ( cell.bomb === true ){
                continue;
            }
            checkAllNeighbours( cell, tryCheckingNeighbour );
        }
    }    
    currentGame.start();
}

function checkAllNeighbours( cell, callback ){
    for( let y = cell.y - 1; y <= cell.y + 1; y++ ){
        for( let x = cell.x - 1; x <= cell.x + 1; x++ ){
            if ( x < 0 ||
                 y < 0 ||
                 y >= currentGame.cells.length ||
                 x >= currentGame.cells[y].length ||
                 ( x === cell.x && y === cell.y ) ){
                    continue;
            }
            callback( cell, x, y );
        }
    }
}

function tryCheckingNeighbour( cell, x, y ){
    if ( currentGame.cells[y][x].bomb === true ){
        cell.proximity += 1;
    }
}