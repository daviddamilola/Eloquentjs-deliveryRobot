const roads = [
    "Alice's House-Bob's House", "Alice's House-Cabin", "Alice's House-Posts Office", "Bobs's House-Town Hall",
    "Daria's House-Ernie's House", "Daria's House-Town Hall",
    "Ernies House-Grete's House", "Grete's House-Farm", 
    "Grete's House-Shop", "MarketPlace-Farm", "Marketplace-Post Office", "Marketplace-Farm", 
    "Marketplace-Town Hall", "Shop-Town Hall"
];

// convert the list of roads into data structure that for each place tells us what can be reached from there
// we build a graph from the list of addresses
function buildGraph(edges){
    let graph = Object.create(null); //dosent inherit any property from object.prototype
    function addEdge(from, to) {
        if (graph[from]== null){
            graph[from] = [to];
        } else {
            graph[from].push(to);
        }
    }
    //destructure from, to from array of edges
    // split roads by "-" and use [0] as from and [1] as to
    for (let [ from, to] of edges.map(r => r.split("-"))){ //returns an array of two items the from and to string
        addEdge(from, to);
        addEdge(to, from);
    }
    return graph
}

const roadGraph = buildGraph(roads);

// TASK
// Define a virtual world that describes where the parcels are
// when the robot decides to move some where the model should be updated to reflect the new situation
// we condense the village's state down to the minimal set of values that define it
// i.e the robots current location, the collection of undelivered parcels, each of which has a current location and destination address
// when the robot moves we dont change this state, instead we compute a new state for the situation after the move

class VillageState{
    constructor(place, parcels){
        this.place = place;
        this.parcels = parcels;
    }
    move(destination){
        if(!roadGraph[this.place].includes(destination)){ //first checks wether there is a road going from the current place to the destination  
        //this.place is referring to [from] in roadGraph and destination is referring to [to] in roadGraph
            return this;
        } else {
            let parcels = this.parcels.map(p=>{
                if(p.place != this.place) return p;
                return {place: destination, address:p.address};
            }).filter(p=> p.place != p.address);
            return new VillageState(destination, parcels);
        }
    }
}

let first = new VillageState(
    "Post Office",
    [{place:"Post Office", address:"Alice's House"}]
);
let next = first.move("Bob's House");

console.log(next.place);
console.log(next.parcels);
console.log(first.place);

let object = Object.freeze({value:5});
object.value =10;
console.log(object.value);

function runRobot(state, robot, memory){
    for (let turn=0;;turn++){
        if(state.parcels.length == 0){
            console.log(`done in ${turn} turns`);
            break;
        }
        let action = robot(state, memory);
        state = state.move(action.direction);
        memory = action.memory;
        console.log(`moved to ${action.direction}`)
    }
}

function randomPick(array){
    let choice = Math.floor(Math.random()*array.length);
    return array[choice];
}

function randomRobot(state){
    return {direction:randomPick(roadGraph[state.place])};
}

VillageState.random = function(parcelCount = 5){
    let parcels = [];
    for(let i = 0; i<parcelCount; i++){
        let address = randomPick(Object.keys(roadGraph));
        let place;
        do{
            place = randomPick(Object.keys(roadGraph));
        } while (place == address);
        parcels.push({place, address});
    }
    return new VillageState("Post Office", parcels);
};

runRobot(VillageState.random(), randomRobot);

const mailRoute = [
    "Alice's House", "Cabin", "Alice's House", "Bob's House",
    "Town Hall", "Daria's House", "Ernie's House","Grete's House", "Shop", "Grete's House", "Farm", "Marketplace","Post Office"
];

function routeRobot(state, memory){
    if(memory.length == 0){
        memory = mailRoute;
    }
    return{ direction:memory[0], memory: memory.slice(1)};
}

// PATHFINDING
function findRoute(graph, from, to){
    let work = [{at: from, route:[]}];
    for (let i=0; i<work.length; i++){
        let {at, route} = work[i];
        for (let place of graph[at]){
            if(place == to) return route.concat(place);
            if(!work.some(w=>w.at==place)){
                work.push({at:place, route:route.concat(place)});
            }
        }
    }
}

function goalOrientedRobot({place, parcels}, route){
    if(route.length == 0){
        let parcel = parcels[0];
        if(parcel.place != place){
            route = findRoute(roadGraph, place, parcel.place);
        }else{
            route = findRoute(roadGraph, place, parcel.address);
        }
    }
    return{direction: route[0], memory: route.slice(1)};
}