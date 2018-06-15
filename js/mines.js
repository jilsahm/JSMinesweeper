window.onload = function(){
    createMinefield();
};

var Game = {
    "columns"    : 10,
    "rows"       : 10,
    "bombs"      : 12,
    "firstclick" : true,
    "cells"      : []
};

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
        if ( Game.firstclick === true ){
            setupBombs( me );
            setupProximity();
            Game.firstclick = false;
        } else if ( me.locked ){
            return;
        }
        
        if ( me.bomb ){
            me.div.appendChild( buildFontAwesomeIcon( "bomb" ) );
        } else if ( 0 === me.proximity ){
            if( me.div.onclick === null ){
                return;
            }
            me.reveal();
            checkAllNeighbours( me, this.revealNeighbour );
        } else {
            me.div.innerHTML = me.proximity;
        }
        me.reveal();      
    }
    
    reveal(){
        this.div.onclick = null;
        this.div.oncontextmenu = null;
        this.div.classList.add( "revealed" ); 
    }
    
    revealNeighbour( me, x, y ){
        Game.cells[y][x].onLeftClick( Game.cells[y][x] );
    }
    
    onRightClick( me ){
        if ( me.locked ){
            me.div.removeChild( me.div.childNodes[0] );
        } else {
            me.div.appendChild( buildFontAwesomeIcon( "flag" ) );
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

function createMinefield(){
    let minefield = document.getElementById( "minefield" );
    for( let row = 0; row < Game.rows; row++ ){
        let currentRow = document.createElement( "div" );
        let cellRow    = [];
        currentRow.classList.add( "row" );
        
        for( let column = 0; column < Game.columns; column++ ){
            let cell = new Cell( column, row );
            cellRow.push( cell );
            currentRow.appendChild( cell.div );
        }
        Game.cells.push( cellRow );
        minefield.appendChild( currentRow );
    }
}

function setupBombs( clickedCell ){
    let availableBombs = Game.bombs;
    while ( 0 < availableBombs ){
        let randomX = Math.floor( Math.random() * Game.columns );
        let randomY = Math.floor( Math.random() * Game.rows );
        if ( Game.cells[randomY][randomX].empty() &&
             randomX !== clickedCell.x &&
             randomY !== clickedCell.y ){
                Game.cells[randomY][randomX].bomb = true ;
                availableBombs -= 1;
        }        
    }
}

function setupProximity(){
    for ( let row of Game.cells ){
        for ( let cell of row ){
            if ( cell.bomb === true ){
                continue;
            }
            checkAllNeighbours( cell, tryCheckingNeighbour );
        }
    }
}

function checkAllNeighbours( cell, callback ){
    for( let y = cell.y - 1; y <= cell.y + 1; y++ ){
        for( let x = cell.x - 1; x <= cell.x + 1; x++ ){
            if ( x < 0 ||
                 y < 0 ||
                 y >= Game.cells.length ||
                 x >= Game.cells[y].length ||
                 ( x === cell.x && y === cell.y ) ){
                    continue;
            }
            callback( cell, x, y );
        }
    }
}

function tryCheckingNeighbour( cell, x, y ){
    if ( Game.cells[y][x].bomb === true ){
        cell.proximity += 1;
    }
}