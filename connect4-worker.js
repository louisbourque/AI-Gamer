/**
This is the worker. It is used by connect4.html to perform all the CPU-intensive
processing, so the GUI will remain responsive. This worker maintains the state
of the grid, position of the elements on the grid, and performs the computations
that are used to find the best move.

The worker is initialized and given instructions by connect4.html.
The worker sends the state information back to connect4.html to be drawn on the screen
  so the user can see what the current state is.
**/

//Point class, used to refer to a specific location on the grid
function Point(pos_x,pos_y){
	this.x = pos_x;
	this.y = pos_y;
}
//Node class, used nodes in a tree.
function Node(parent,grid,move,player,children){
	this.parent = parent;
	this.grid = grid;
	this.move = move;
	this.player = player;
	this.children = children;
}

//some local variables used by the worker to track it's state.
var config = new Object();
var grid;

//this is the function that is called whenever the worker receives a message.
//based on the content of the message (event.data.do), do the appropriate action.
onmessage = function(event) {
	switch(event.data.do){
		case 'move':
			grid = event.data.grid;
			move();
			break;
		case 'init':
			config = event.data.config;
			break;
	}
}

//initialize the decision tree, call max_value() on each child, and return the best move.
function alpha_beta_search(){
	var node = new Node(null,grid,0,config.player,new Array());
	var bestMove = 0;
	var bestAlpha = -99999;
	for(var col = 0;col<config.grid_x;col++){
		if(node.grid[col][0] == 0){
			//create a copy of the game's state space
			//have to create a whole new array
			var nextPlayer = config.player;
			var newGrid = new Array();	
			for(var i=0;i<config.grid_x;i++){
				newGrid[i] = new Array();
			}
			for(var i=0;i<config.grid_x;i++){	
				for(var j=0;j<config.grid_y;j++){
					newGrid[i][j] = node.grid[i][j];
				}
			}
			//update the game with the new move
			for(var j = config.grid_y-1;j>=0;j--){
				if(newGrid[col][j] == 0){
					newGrid[col][j] = nextPlayer;
					break;
				}
			}
			//add the node to the tree
			node.children.push(new Node(node,newGrid,col,nextPlayer,new Array()));
		}
	}
	
	var outBest = "";
	for(var i = 0;i<node.children.length;i++){
		var current_value = max_value(node.children[i], config.depth, -99999, 99999);
		if(current_value > bestAlpha){
			bestAlpha = current_value;
			bestMove = node.children[i].move;
		}
		//debugging
		outBest+="("+node.children[i].move+":"+current_value+")";
	}
	postMessage(outBest);
	return bestMove;
}

function max_value(node, depth, alpha, beta){
	for(var col = 0;col<config.grid_x;col++){
		if(node.grid[col][0] == 0){
			//create a copy of the game's state space
			//have to create a whole new array
			var nextPlayer;
			if(node.player == 1)
				nextPlayer = 2;
			else
				nextPlayer = 1;
			var newGrid = new Array();	
			for(var i=0;i<config.grid_x;i++){
				newGrid[i] = new Array();
			}
			for(var i=0;i<config.grid_x;i++){	
				for(var j=0;j<config.grid_y;j++){
					newGrid[i][j] = node.grid[i][j];
				}
			}
			//update the game with the new move
			for(var j = config.grid_y-1;j>=0;j--){
				if(newGrid[col][j] == 0){
					newGrid[col][j] = nextPlayer;
					break;
				}
			}
			//add the node to the tree
			node.children.push(new Node(node,newGrid,col,nextPlayer,new Array()));
		}
	}
	if(node.children.length == 0 || depth == 0)
		return heuristic_estimate(node);
	while(node.children.length > 0){
		alpha = Math.max(alpha,min_value(node.children[node.children.length-1],depth-1,alpha,beta));
		node.children.pop();
		if(alpha >= beta)
			return alpha;
	}
	return alpha;
}

function min_value(node, depth, alpha, beta){
	//open the node and build the tree.
	for(var col = 0;col<config.grid_x;col++){
		if(node.grid[col][0] == 0){
			//create a copy of the game's state space
			//have to create a whole new array
			var nextPlayer;
			if(node.player == 1)
				nextPlayer = 2;
			else
				nextPlayer = 1;
			var newGrid = new Array();	
			for(var i=0;i<config.grid_x;i++){
				newGrid[i] = new Array();
			}
			for(var i=0;i<config.grid_x;i++){	
				for(var j=0;j<config.grid_y;j++){
					newGrid[i][j] = node.grid[i][j];
				}
			}
			//update the game with the new move
			for(var j = config.grid_y-1;j>=0;j--){
				if(newGrid[col][j] == 0){
					newGrid[col][j] = nextPlayer;
					break;
				}
			}
			//add the node to the tree
			node.children.push(new Node(node,newGrid,col,nextPlayer,new Array()));
		}
	}
	if(node.children.length == 0 || depth == 0)
		return heuristic_estimate(node);
	while(node.children.length > 0){
		beta = Math.min(beta,max_value(node.children[node.children.length-1],depth-1,alpha,beta));
		node.children.pop();
		if(beta <= alpha)
			return beta;
	}
	return beta;
}

//heuristic_estimate
function heuristic_estimate(node){
	//check for a win or a loss
	var score = 0;
	for(var i = 0;i < config.fourinarow.length;i++){
		if(node.grid[config.fourinarow[i][0].x][config.fourinarow[i][0].y] != 0  &&
			node.grid[config.fourinarow[i][0].x][config.fourinarow[i][0].y] == node.grid[config.fourinarow[i][1].x][config.fourinarow[i][1].y] &&
			node.grid[config.fourinarow[i][1].x][config.fourinarow[i][1].y] == node.grid[config.fourinarow[i][2].x][config.fourinarow[i][2].y] &&
			node.grid[config.fourinarow[i][2].x][config.fourinarow[i][2].y] == node.grid[config.fourinarow[i][3].x][config.fourinarow[i][3].y]){
				if(node.grid[config.fourinarow[i][0].x][config.fourinarow[i][0].y] == node.player)
					return 8000;
				else
					return -8000;
		}
	}
	//no winner, give points for near-wins:
	for(var i = 0;i < config.threeinarow.length;i++){
		//I lose
		if(node.grid[config.threeinarow[i][0].x][config.threeinarow[i][0].y] != 0 &&
			node.grid[config.threeinarow[i][0].x][config.threeinarow[i][0].y] == node.grid[config.threeinarow[i][1].x][config.threeinarow[i][1].y] &&
			node.grid[config.threeinarow[i][1].x][config.threeinarow[i][1].y] == node.grid[config.threeinarow[i][2].x][config.threeinarow[i][2].y]){
				if(node.grid[config.threeinarow[i][0].x][config.threeinarow[i][0].y] == node.player)
					score += 32;
				else
					score -= 32;
		}
	}
	for(var i = 0;i < config.twoinarow.length;i++){
		if(node.grid[config.twoinarow[i][0].x][config.twoinarow[i][0].y] != 0 &&
			node.grid[config.twoinarow[i][0].x][config.twoinarow[i][0].y] == node.grid[config.twoinarow[i][1].x][config.twoinarow[i][1].y]){
				if(node.grid[config.twoinarow[i][0].x][config.twoinarow[i][0].y] == node.player)
					score += 4;
				else	
					score -= 4;
		}
	}
	for(var i=0;i<config.grid_x;i++){	
		for(var j=0;j<config.grid_y;j++){
			if(node.grid[i][j] != 0){
				if(node.grid[i][j] == node.player)
					score++;
				else
					score--;
			}
		}
	}
	return score;
}

//decide on a move based on type of player
function move(){
	//find a move
	var column = 0; //which column to drop the token into
	switch(config.playertype){
		case "random":
			//choose a move at random, but make sure it's a legal move:
			do{
				column = Math.floor(Math.random()*config.grid_x);
			}while(grid[column][0] != 0)
			break;
		case "minimax":
			column = alpha_beta_search();
			break;
	}
	
	//send the move to browser
	var message = new Object();
	message.type = 'move';
	message.column = column;
	message.player = config.player;
	postMessage(message);
}