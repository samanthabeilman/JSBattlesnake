// Welcome to
// __________         __    __  .__                               __
// \______   \_____ _/  |__/  |_|  |   ____   ______ ____ _____  |  | __ ____
//  |    |  _/\__  \\   __\   __\  | _/ __ \ /  ___//    \\__  \ |  |/ // __ \
//  |    |   \ / __ \|  |  |  | |  |_\  ___/ \___ \|   |  \/ __ \|    <\  ___/
//  |________/(______/__|  |__| |____/\_____>______>___|__(______/__|__\\_____>
//
// This file can be a nice home for your Battlesnake logic and helper functions.
//
// To get you started we've included code to prevent your Battlesnake from moving backwards.
// For more info see docs.battlesnake.com

import runServer from './server.js';

// info is called when you create your Battlesnake on play.battlesnake.com
// and controls your Battlesnake's appearance
// TIP: If you open your Battlesnake URL in a browser you should see this data
function info() {
    console.log("INFO");

    return {
        apiversion: "1",
        author: "hexxily",       // TODO: Your Battlesnake Username
        color: "#888888", // TODO: Choose color
        head: "default",  // TODO: Choose head
        tail: "default",  // TODO: Choose tail
    };
}

// start is called when your Battlesnake begins a game
function start(gameState) {
    console.log("GAME START");
}

// end is called when your Battlesnake finishes a game
function end(gameState) {
    console.log("GAME OVER\n");
}

// move is called on every turn and returns your next move
// Valid moves are "up", "down", "left", or "right"
// See https://docs.battlesnake.com/api/example-move for available data
function move(gameState) {

    let isMoveSafe = {
        up: true,
        down: true,
        left: true,
        right: true
    };

    // We've included code to prevent your Battlesnake from moving backwards
    const myHead = gameState.you.body[0];
    const myNeck = gameState.you.body[1];
    const myTail = gameState.you.body[gameState.you.length - 1];

    if (myNeck.x < myHead.x) {        // Neck is left of head, don't move left
        isMoveSafe.left = false;
    } else if (myNeck.x > myHead.x) { // Neck is right of head, don't move right
        isMoveSafe.right = false;
    } else if (myNeck.y < myHead.y) { // Neck is below head, don't move down
        isMoveSafe.down = false;
    } else if (myNeck.y > myHead.y) { // Neck is above head, don't move up
        isMoveSafe.up = false;
    }

    // TODO: Step 1 - Prevent your Battlesnake from moving out of bounds
    let boardWidth = gameState.board.width;
    let boardHeight = gameState.board.height;

    if(myHead.x < 0) { isMoveSafe.left = false; }
    else if(myHead.x > (boardWidth-1)) { isMoveSafe.right = false; }
    else if(myHead.y < 0) { isMoveSafe.down = false; }
    else if(myHead.y > (boardHeight-1)) { isMoveSafe.up = false }

    
    // TODO: Step 2 - Prevent your Battlesnake from colliding with itself
    let myBody = gameState.you.body;
    for(let b in myBody ){
        if(b == myTail) { break; }
        //body piece to the current immediate right
        if(myHead.x + 1 == b.x && myHead.y == b.y){
            isMoveSafe.right = false;
        }
        //body piece to the current immediate left
        else if (myHead.x - 1 == b.x && myHead.y == b.y){
            isMoveSafe.left = false;
        }
        //body piece to the current immediate up
        else if(myHead.y + 1 == b.y && myHead.x == b.x){
            isMoveSafe.up = false;
        }
        //body piece to the current immediate down
        else if(myHead.y - 1 == b.y && myHead.x == b.x){
            isMoveSafe.down = false;
        }
    }
    //avoid bounding yourself in following turns
    avoidBoundingSelf(gameState.you, isMoveSafe);
    
    //find how many safe moves will be available after making any move
    // let safeLeft = 0;
    // let safeRight = 0;
    // let safeUp = 0;
    // let safeDown = 0;

    // if (isMoveSafe.left){
    //     let left = myHead;
    //     left.x -= 1;
    //     recursiveFlood(left, safeLeft, gameState);
    // }
    // if (isMoveSafe.right){
    //     let right = myHead;
    //     right.x += 1;
    //     recursiveFlood(right, safeRight, gameState);
    // }
    // if (isMoveSafe.down){
    //     let down = myHead;
    //     down.y -= 1;
    //     recursiveFlood(down, safeDown, gameState);
    // }
    // if (isMoveSafe.up){
    //     let up = myHead;
    //     up.y += 1;
    //     recursiveFlood(up, safeUp, gameState);
    // }
    
    // TODO: Step 3 - Prevent your Battlesnake from colliding with other Battlesnakes
    let opponents = gameState.board.snakes;
    for( let snake in opponents) {
        
        //excludes ourselves
        if(snake.id == gameState.you.id) { continue; }

        for( let piece in snake.body ) {
            //enemy body piece to the current immediate right
            if((myHead.x + 1) == piece.x && myHead.y == piece.y) {
                isMoveSafe.right = false;
            }
            //enemy body piece to the currect immediat left
            else if((myHead.x - 1) == piece.x && myHead.y == piece.y) {
                isMoveSafe.left = false;
            }
            //enemy body piece to the current immediate up
            else if((myHead.y + 1) == piece.y && myHead.x == piece.x) {
                isMoveSafe.up = false;
            }
            //enemy body piece to teh current immediate down 
            else if((myHead.y - 1) == piece.y && myHead.x == piece.x) {
                isMoveSafe.down = false;
            }
        }
    }

    // Are there any safe moves left?
    const safeMoves = Object.keys(isMoveSafe).filter(key => isMoveSafe[key]);
    if (safeMoves.length == 0) {
        console.log(`MOVE ${gameState.turn}: No safe moves detected! Moving down`);
        return { move: "down" };
    }

    // Choose a random move from the safe moves
    const nextMove = safeMoves[Math.floor(Math.random() * safeMoves.length)];

    // Step 4 - Move towards food instead of random, to regain health and survive longer
    // Very primitive design - Chooses the move based on the closest food objcet regardless of safety
    let food = gameState.board.food;
    let min_dist = 100; //placeholder value 
    let x_dist;
    let y_dist;
    let total_dist;
    for(let piece in food) {
        x_dist = Math.abs(myHead.x - piece.x);
        y_dist = Math.abs(myHead.y - piece.y);
        total_dist = x_dist + y_dist;

        //Closest piece thus far
        if(total_dist < min_dist) {
            min_dist = total_dist;
            
            //Closer in horizontal direction
            if(x_dist < y_dist) {
                //Closest piece to the left and left is safe 
                if((piece.x < myHead.x) && ("left" in safeMoves)) { nextMove = "left"; }

                //Closest piece to the right and right is safe 
                else if((piece.x > myHead.x) && ("right" in safeMoves)) { nextMove = "right"; }

                //Edge cases: 
                //1. x = 0
                //2. No safe move on horizontal axis
                else{
                    if((piece.y < myHead.y) && ("down" in safeMoves)) { nextMove = "down"; }
                    else if((piece.y > myHead.y) && ("up" in safeMoves)) { nextMove = "up"; }
                }
            }
            //Closer in vertical direction
            else{
                //Closest piece is down and down is safe
                if((piece.y < myHead.y) && ("down" in safeMoves)) { nextMove = "down"; }

                //Closest piece is up and up is safe
                else if((piece.y > myHead.y) && ("up" in safeMoves)) { nextMove = "up"; }

                //Edge cases:
                //1. y = 0
                //2. No safe move on vertical axis
                else{
                    if((piece.x < myHead.x) && ("left" in safeMoves)) { nextMove = "left"; }
                    else if((piece.x > myHead.x) && ("right" in safeMoves)) { nextMove = "right"; }
                }
            }
                
        }
    }

    console.log(`MOVE ${gameState.turn}: ${nextMove}`)
    return { move: nextMove };
}

runServer({
    info: info,
    start: start,
    move: move,
    end: end
});

//checks to make sure snake won't bound itself
//parameter should be gamestate.you
function avoidBoundingSelf(self, isMoveSafe){
    let myBody = self.body;
    for(let b = 1; b < myBody.length - 1;  b++){
        //okay SO this check relies on the idea that a true bounding region is only 3 long by 2 wide, or 2 long by 3 wide
        if(b + 5 <= myBody.length - 1) break; // the remaining length needs to be greater than 5 for it to be dangerous. 
        if(b + 4 < myBody.length - 1){
            if(myBody[b].x == myBody[b+4].x){
                if(myHead.y == myBody[b+2].y){ // the bounding box is only an issue if the head is in line with the center bound
                    //we have a bounding region to the right or left
                    //the b+2 square has the x coordinate to avoid moving into (so do b+1 and b+3 tbf)
                    if(myBody[b+2].x < myHead.x) isMoveSafe.left = false;
                    else isMoveSafe.right = false;
                }
            }
            if(myBody[b].y == myBody[b+4].y){
                if(myHead.x == myBody[b+2].x){ // the bounding box is only an issue if the head is in line with the center bound
                    //we have a bounding region above or below
                    //the b+2 square has the x coordinate to avoid moving into
                    if(myBody[b+2].y < myHead.y) isMoveSafe.down = false;
                    else {isMoveSafe.down = true;} //do nothing
                }
            }
        }
    }
}

function recursiveFlood(node, total, gameState){ // we will pass each possible safe node seperately
    /* Flood-fill (node):
    Flood-fill (node):
    1. If node is not Inside return.
    2. Set the node
    3. Perform Flood-fill one step to the south of node.
    4. Perform Flood-fill one step to the north of node
    5. Perform Flood-fill one step to the west of node
    6. Perform Flood-fill one step to the east of node
    7. Return.*/ 
    if(node.x > 11 || node.y > 11 || node.x < 0 || node.y < 0) return;
    opponents = gameState.board.snakes;
    pieces = [];
    for( let snake in opponents) {
        for( let piece in snake.body ) {
            pieces.push(piece);
        }
    }
    if(pieces.includes(node)) return;
    else {total += 1;}
    let temp = node;
    temp.y -= 1; //south
    recursiveFlood(temp, total, gameState);
    temp = node;
    temp.y += 1; //north
    recursiveFlood(temp, total, gameState);
    temp = node;
    temp.x -= 1; //west
    recursiveFlood(temp, total, gameState);
    temp = node;
    temp.x += 1; //east
    recursiveFlood(temp, total, gameState);
    return;
}