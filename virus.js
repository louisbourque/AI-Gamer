/**
This is the worker. It is used by virus.html to perform all the CPU-intensive
processing, so the GUI will remain responsive. This worker is given the state of the grid,
and performs the computations that are used to find the best move.

The worker is initialized and given instructions by virus.html.
The worker sends the state information back to virus.html to be drawn on the screen
  so the user can see what the new state is.
**/

//Virus class, used to track which player has control of a square, and how much life is left.
function Virus(player){
	this.player = player;
	this.life = 5;
}
//Node class, used nodes in a tree.
function Node(parent,grid,player,children){
	this.parent = parent;
	this.grid = grid;
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

//this function generates a node based on the input given
//move is from x,y to new_x,new_y. Generate a new state based on this move.
function generate_node(node,nextPlayer,x,y,new_x,new_y,jump){
	//create a new board
	var newGrid = new Array();
	for(var i=0;i<config.grid_size;i++){
		newGrid[i] = new Array();
	}
	for(var i=0;i<config.grid_size;i++){
		for(var j=0;j<config.grid_size;j++){
			if(node.grid[i][j] != undefined){
				//create a new Virus instance, because objects are pass by reference.
				newGrid[i][j] = new Virus(node.grid[i][j].player);
				//set life to one less than last turn.
				newGrid[i][j].life = node.grid[i][j].life-1;
				//if no life left, virus dies.
				if(newGrid[i][j].life <= 0)
					newGrid[i][j] = undefined;
			}							
		}
	}
	//update the game with the new move
	newGrid[new_x][new_y] = new Virus(config.player);
	if(jump){
		newGrid[x][y] = undefined;
	}
	//as name suggests, infect ajacent blocks
	claim_adjacent_blocks(newGrid,new_x,new_y,config.player);
	
	return new Node(undefined,newGrid,nextPlayer,new Array());
}

//given a state, generate all possible next states.
function generate_children(node){
	var children = new Array();
	for(var x=0;x<config.grid_size;x++){
		for(var y=0;y<config.grid_size;y++){
			if(node.grid[x][y] != undefined && node.grid[x][y].player == node.player){
				var nextPlayer;
				if(node.player == 1)
					nextPlayer = 2;
				else
					nextPlayer = 1;
				//Single Moves
				
				//N
				if(y-1 >= 0 && grid[x][y-1] == undefined){
					children.push(generate_node(node,nextPlayer,x,y,x,y-1));
				}
				//E
				if(x+1 < config.grid_size && grid[x+1][y] == undefined){
					children.push(generate_node(node,nextPlayer,x,y,x+1,y));
				}
				//S
				if(y+1 < config.grid_size && grid[x][y+1] == undefined){
					children.push(generate_node(node,nextPlayer,x,y,x,y+1));
				}
				//W
				if(x-1 >= 0 && grid[x-1][y] == undefined){
					children.push(generate_node(node,nextPlayer,x,y,x-1,y));
				}
				//NE
				if(x+1 < config.grid_size && y-1 >= 0 && grid[x+1][y-1] == undefined){
					children.push(generate_node(node,nextPlayer,x,y,x+1,y-1));
				}
				//SE
				if(x+1 < config.grid_size && y+1 < config.grid_size && grid[x+1][y+1] == undefined){
					children.push(generate_node(node,nextPlayer,x,y,x+1,y+1));
				}
				//SW
				if(x-1 >= 0 && y+1 < config.grid_size && grid[x-1][y+1] == undefined){
					children.push(generate_node(node,nextPlayer,x,y,x-1,y+1));
				}
				//NW
				if(x-1 >= 0 && y-1 >= 0 && grid[x-1][y-1] == undefined){
					children.push(generate_node(node,nextPlayer,x,y,x-1,y-1));
				}
				
				
				//Double Moves, Removes the original block
				
				//N
				if(y-2 >= 0 && grid[x][y-2] == undefined){
					children.push(generate_node(node,nextPlayer,x,y,x,y-2,true));
				}
				//NNE
				if(x+1 < config.grid_size && y-2 >= 0 && grid[x+1][y-2] == undefined){
					children.push(generate_node(node,nextPlayer,x,y,x+1,y-2,true));
				}
				//NE
				if(x+2 < config.grid_size && y-2 >= 0 && grid[x+2][y-2] == undefined){
					children.push(generate_node(node,nextPlayer,x,y,x+2,y-2,true));
				}
				//ENE
				if(x+2 < config.grid_size && y-1 >= 0 && grid[x+2][y-1] == undefined){
					children.push(generate_node(node,nextPlayer,x,y,x+2,y-1,true));
				}
				//E
				if(x+2 < config.grid_size && grid[x+2][y] == undefined){
					children.push(generate_node(node,nextPlayer,x,y,x+2,y,true));
				}
				//ESE
				if(x+2 < config.grid_size && y+1 < config.grid_size && grid[x+2][y+1] == undefined){
					children.push(generate_node(node,nextPlayer,x,y,x+2,y+1,true));
				}
				//SE
				if(x+2 < config.grid_size && y+2 < config.grid_size && grid[x+2][y+2] == undefined){
					children.push(generate_node(node,nextPlayer,x,y,x+2,y+2,true));
				}
				//SSE
				if(x+1 < config.grid_size && y+2 < config.grid_size && grid[x+1][y+2] == undefined){
					children.push(generate_node(node,nextPlayer,x,y,x+1,y+2,true));
				}
				//S
				if(y+2 < config.grid_size && grid[x][y+2] == undefined){
					children.push(generate_node(node,nextPlayer,x,y,x,y+2,true));
				}
				//SSW
				if(x-1 >= 0 && y+2 < config.grid_size && grid[x-1][y+2] == undefined){
					children.push(generate_node(node,nextPlayer,x,y,x-1,y+2,true));
				}
				//SW
				if(x-2 >= 0 && y+2 < config.grid_size && grid[x-2][y+2] == undefined){
					children.push(generate_node(node,nextPlayer,x,y,x-2,y+2,true));
				}
				//WSW
				if(x-2 >= 0 && y+1 < config.grid_size && grid[x-2][y+1] == undefined){
					children.push(generate_node(node,nextPlayer,x,y,x-2,y+1,true));
				}
				//W
				if(x-2 >= 0 && grid[x-2][y] == undefined){
					children.push(generate_node(node,nextPlayer,x,y,x-2,y,true));
				}
				//WNW
				if(x-2 >= 0 && y-1 >= 0 && grid[x-2][y-1] == undefined){
					children.push(generate_node(node,nextPlayer,x,y,x-2,y-1,true));
				}
				//NW
				if(x-2 >= 0 && y-2 >= 0 && grid[x-2][y-2] == undefined){
					children.push(generate_node(node,nextPlayer,x,y,x-2,y-2,true));
				}
				//NNW
				if(x-2 >= 0 && y-1 >= 0 && grid[x-2][y-1] == undefined){
					children.push(generate_node(node,nextPlayer,x,y,x-2,y-1,true));
				}
			}
		}
	}
	//Check Children for duplicates
	var temp = new Array();
	for(var i=0;i<children.length;i++){
		if(!contains(temp, children[i])){
			temp.length+=1;
			temp[temp.length-1]=children[i];
		}
	}
	
	return children;
}

//check if array a contains element e
function contains(a, e) {
	for(var j=0;j<a.length;j++)
		if(same_state(a[j].grid,e.grid))
			return true;
	return false;
}

//check if the two grids have the exact same state.
function same_state(grid1,grid2){
	for(var i=0;i<config.grid_size;i++){
		for(var j=0;j<config.grid_size;j++){
			if(grid1[i][j] != grid2[i][j])
				return false;
		}
	}
	return true;
}

//infect adjacent blocks - check if they are owned by opponent, if they are, infect.
function claim_adjacent_blocks(grid,x,y,player){
	//N
	if(y-1 >= 0 && grid[x][y-1] != undefined){
		if(grid[x][y-1].player != player)
			grid[x][y-1] = new Virus(player);
	}
	//E
	if(x+1 < config.grid_size && grid[x+1][y] != undefined){
		if(grid[x+1][y].player != player)
			grid[x+1][y] = new Virus(player);
	}
	//S
	if(y+1 < config.grid_size && grid[x][y+1] != undefined){
		if(grid[x][y+1].player != player)
			grid[x][y+1] = new Virus(player);
	}
	//W
	if(x-1 >= 0 && grid[x-1][y] != undefined){
		if(grid[x-1][y].player != player)
			grid[x-1][y] = new Virus(player);
	}
	//NE
	if(x+1 < config.grid_size && y-1 >= 0 && grid[x+1][y-1] != undefined){
		if(grid[x+1][y-1].player != player)
			grid[x+1][y-1] = new Virus(player);
	}
	//SE
	if(x+1 < config.grid_size && y+1 < config.grid_size && grid[x+1][y+1] != undefined){
		if(grid[x+1][y+1].player != player)
			grid[x+1][y+1] = new Virus(player);
	}
	//SW
	if(x-1 >= 0 && y+1 < config.grid_size && grid[x-1][y+1] != undefined){
		if(grid[x-1][y+1].player != player)
			grid[x-1][y+1] = new Virus(player);
	}
	//NW
	if(x-1 >= 0 && y-1 >= 0 && grid[x-1][y-1] != undefined){
		if(grid[x-1][y-1].player != player)
			grid[x-1][y-1] = new Virus(player);
	}
}

//initialize the decision tree, call max_value() on each child, and return the best state that has the best move.
function alpha_beta_search(){
	var node = new Node(null,grid,config.player,new Array());
	
	var bestMove = undefined;
	var bestAlpha = -99999;
	
	node.children = generate_children(node);
	
	//var outBest = "";
	for(var i = 0;i<node.children.length;i++){
		var current_value = max_value(node.children[i], config.depth, -99999, 99999);
		if(current_value > bestAlpha){
			bestAlpha = current_value;
			bestMove = node.children[i].grid;
		}
		//debugging
		//outBest+="(:"+current_value+")";
	}
	//postMessage(outBest);
	
	return bestMove;
}


function max_value(node, depth, alpha, beta){
	node.children = generate_children(node);
	if(node.children.length == 0 || depth == 0)
		return heuristic_estimate(node);
	for(var i = 0;i<node.children.length;i++){
		alpha = Math.max(alpha,min_value(node.children[i],depth-1,alpha,beta));
		if(alpha >= beta){
			return alpha;
		}
	}
	return alpha;
}

function min_value(node, depth, alpha, beta){
	node.children = generate_children(node);
	if(node.children.length == 0 || depth == 0)
		return heuristic_estimate(node);
	for(var i = 0;i<node.children.length;i++){
		beta = Math.min(beta,max_value(node.children[i],depth-1,alpha,beta));
		if(beta <= alpha){
			return beta;
		}
	}
	return beta;
}

//heuristic_estimate interface, calls the heuristic function appropriate for the playertype
function heuristic_estimate(node){
	switch(config.playertype){
		case "H1":
			return heuristic_estimate_h1(node);
		case "H2":
			return heuristic_estimate_h2(node);
	}
}

//Heuristic 1 - count the number of squares owned, minus number of squares owned by opponent.
function heuristic_estimate_h1(node){
	var me = 0;
	var opp = 0
	for(var i=0;i<config.grid_size;i++){
		for(var j=0;j<config.grid_size;j++){
			if(node.grid[i][j] != undefined){
				if(node.grid[i][j].player == config.player)
					me++;
				else
					opp++;
			}
		}
	}
	return me - opp; 
}

//Heuristic 2 - count the number of squares owned, minus number of squares owned by opponent.
//Give each count the weight of the amount of life left instead of just 1.
function heuristic_estimate_h2(node){
	var me = 0;
	var opp = 0
	for(var i=0;i<config.grid_size;i++){
		for(var j=0;j<config.grid_size;j++){
			if(node.grid[i][j] != undefined){
				if(node.grid[i][j].player == config.player)
					me = me+node.grid[i][j].life;
				else
					opp+node.grid[i][j].life;
			}
		}
	}
	return me - opp; 
}

//find a move, and send the new state to the browser
function move(){
	//find a move
	var grid = alpha_beta_search();
	
	//send the new state to browser
	var message = new Object();
	message.type = 'move';
	message.grid = grid;
	message.player = config.player;
	postMessage(message);
}