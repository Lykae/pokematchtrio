import { ref } from 'vue'
//import { ceil, floor, forEach, random, randomSeeded.shuffle } from 'lodash-es'
import { ceil, floor, forEach, isNaN } from 'lodash-es'
import * as fs from 'fs';
import {random, XORShift} from 'random-seedable';
//import { StatusBar, Style } from '@capacitor/status-bar';

//import abilities from '../assets/data/abilities_output.json';
import pokemonList from '../assets/data/poke_output.json';
//import moves from '../assets/data/moves_output.json';
import types from '../assets/data/types_output.json';
import { notDeepStrictEqual } from 'assert';

const defaultGameConfig: GameConfig = {
  cardNum: 4,
  layerNum: 2,
  trap: true,
  delNode: false,
}

export function useGame(this: any, config: GameConfig): Game {
  const { container, delNode, events = {}, ...initConfig } = { ...defaultGameConfig, ...config }
  const histroyList = ref<CardNode[]>([])
  const backFlag = ref(false)
  const removeFlag = ref(false)
  const removeList = ref<CardNode[]>([])
  const preNode = ref<CardNode | null>(null)
  const nodes = ref<CardNode[]>([])
  const indexSet = new Set()
  let perFloorNodes: CardNode[] = []
  const selectedNodes = ref<CardNode[]>([])
  const size = 40
  const scale = 1.5
  let pokeTypes = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17];
  let floorList: number[][] = []

  let seed = random.randRange(0, 2147483647);;
  let randomSeeded = new XORShift(seed);
  
  const score = ref(0);
  const oldScore = ref(0);
  const curLevel = ref(0);
  const undoHistoryList = ref<HistoryGame[]>([]);

  //custom
  const isHint = ref(false);
  const isDropping = ref(false);

  function updateState() {
    nodes.value.forEach((o) => {
      o.state = o.parents.every(p => p.state > 0) ? 1 : 0
    })
  }

  function handleUndo() {
    //console.log("handleUndo");
    if (undoHistoryList.value.length <= 0) return;

    // containerBox doesnt get updated
    // maybe teh backup right at the start fucks things

    var gameBefore = undoHistoryList.value.pop();
    //console.log("gameBefore", gameBefore);
    //console.log("handleUndo-undoHistoryList", undoHistoryList);
    if (!gameBefore) return;
    var selectedNodesDeepCopy: CardNode[] = [];
    gameBefore.selectedNodes.forEach(element => {
      selectedNodesDeepCopy.push(getNodeDeepCopy(element));
    });

    var nodesDeepCopy: CardNode[] = [];
    gameBefore.nodes.forEach(element => {
      nodesDeepCopy.push(getNodeDeepCopy(element));
    });

    //console.log("nodes.value-before", nodes.value);
    nodes.value.splice(0, nodes.value.length);
    nodes.value.push(...nodesDeepCopy);
    //console.log("nodes.value-after", nodes.value);
    //console.log("selectedNodes.value-before", selectedNodes.value);
    //console.log("backupGame gameBefore.selectedNodes", selectedNodes.value);
    selectedNodes.value.splice(0, selectedNodes.value.length);
    selectedNodes.value.push(...selectedNodesDeepCopy);
    //console.log("selectedNodes.value-after", selectedNodes.value);
    removeList.value= gameBefore.removeList;
    removeFlag.value= gameBefore.removeFlag;
    score.value= gameBefore.score;

  }

function getPokeGameDeepCopy(game: PokeGame): PokeGame {
  return {
    game_index: game.game_index,
    version: game.version
  };
}

function getAbilityDeepCopy(ability: Ability): Ability {
  return {
    name: ability.name,
    is_hidden: ability.is_hidden
  };
}

function getPokemonDeepCopy(pokemon: Pokemon): Pokemon {
  var abilitiesDeepCopy: Ability[] = [];
  pokemon.abilities?.forEach((ability) => {
    abilitiesDeepCopy.push(getAbilityDeepCopy(ability));
  })
  
  var typesDeepCopy: string[] = [];
  pokemon.types.forEach((type) => {
    typesDeepCopy.push(type);
  });
  
  var movesDeepCopy: string[] = [];
  pokemon.types.forEach((move) => {
    movesDeepCopy.push(move);
  });

  var gamesDeepCopy: PokeGame[] = [];
  pokemon.games?.forEach((game) => {
    gamesDeepCopy.push(getPokeGameDeepCopy(game));
  })

  return {
    abilities: abilitiesDeepCopy,
    types: typesDeepCopy,
    species: pokemon.species,
    moves: movesDeepCopy,
    games: gamesDeepCopy,
    name: pokemon.name,
    id: pokemon.id,
    imageSource: pokemon.imageSource
  };
}

function getNodeDeepCopy(node: CardNode): CardNode {
  var parentsDeepCopy: CardNode[] = [];
  node.parents.forEach((element) => {
    parentsDeepCopy.push(getNodeDeepCopy(element));
  })
  return {
    id: node.id,
    type: node.type,
    zIndex: node.zIndex,
    index: node.index,
    parents: parentsDeepCopy,
    row: node.row,
    column: node.column,
    top: node.top,
    left: node.left,
    state: node.state,
    pokemon: getPokemonDeepCopy(node.pokemon),
    imageLoaded: node.imageLoaded,
    hintHighlight: node.hintHighlight,
  };
}


  function backupGame() {
    //var selectedNodesDeepCopy: CardNode[] = [];
    //selectedNodes.value.forEach(element => {
    //  selectedNodesDeepCopy.push(getNodeDeepCopy(element));
    //});
//
    //var nodesDeepCopy: CardNode[] = [];
    //nodes.value.forEach(element => {
    //  nodesDeepCopy.push(getNodeDeepCopy(element));
    //});
//
    //var removeListDeepCopy: CardNode[] = [];
    //removeList.value.forEach(element => {
    //  removeListDeepCopy.push(getNodeDeepCopy(element));
    //});
    //
    //const gameNow: HistoryGame = {
    //  nodes: nodesDeepCopy,
    //  selectedNodes: selectedNodesDeepCopy,
    //  removeList: removeListDeepCopy, // maybe need to create new var
    //  removeFlag: removeFlag.value,
    //  score: score.value
    //};
    //undoHistoryList.value.push(gameNow);

    // TOO SLOW
  }

  function handleHint() {
    isHint.value = true;
  }

  function handleSeed() {
    let customSeed = prompt("Set custom seed here. Your seed is: " + seed);
    if (customSeed) {
      if (!isNaN(customSeed)) {
        let newSeed = Number(customSeed);
        if (newSeed > 2147483647 || newSeed < 1) {
          alert("Given seed \"" + customSeed + "\" is out of range (1 - 2147483647)")
          return; 
        }
        seed = newSeed;
        randomSeeded = new XORShift(seed);
        events.resetCallback && events.resetCallback();
      } else {
        alert("Given seed \"" + customSeed + "\" is not a number");
      }
    }
  }

  function generateSeed() {
    let newSeed = random.randRange(0, 2147483647);;
    if (newSeed === seed) {
      generateSeed();
    } else {
      seed = newSeed;
      randomSeeded = new XORShift(seed);
    }
  }

  function handleReset() {
    if (confirm("Are you sure you want to reset the game?")) {
      generateSeed();
      events.resetCallback && events.resetCallback()
    }
  }

  function handleSelect(node: CardNode) {
    if (isDropping.value) {
      return;
    }
    //console.log("isHint", isHint.value);
    if (isHint.value) {
      isHint.value = false;
      var pokeTypesString = node.pokemon.types[0];
      if (node.pokemon.types.length > 1) {
        pokeTypesString = pokeTypesString +  " - " + node.pokemon.types[1];
      }
      var hintAlertString = `Name: ${node.pokemon.name}\n\n Types: ${pokeTypesString}`;
      alert(hintAlertString);

      //nodes.value.forEach(element => {
      //  if (element.type === node.type) {
      //    element.hintHighlight = true;
      //    setTimeout(() => {
      //      element.hintHighlight = false;
      //    }, 10000);
      //  }
      //});
      return;
    }
    if (node.state === 2) return;
    if (selectedNodes.value.length === 7)
      return

    
    backupGame();

    // NODE SELECTED
    node.state = 2
    //histroyList.value.push(node)
    preNode.value = node
    const index = nodes.value.findIndex(o => o.id === node.id)
    if (index > -1)
      delNode && nodes.value.splice(index, 1)

    // Determine if there are nodes that can be eliminated
    const selectedSomeNode = selectedNodes.value.filter(s => s.type === node.type)

    //example
    //selectedNodes.value
    //Grass
    //Poison Grass
    //Poison

    //node
    //Poison Grass

    //const selectedSomeNode = selectedNodes.value.filter(s => node.pokemon.types.map((x) => s.pokemon.types.includes(x))); // DOUBLE TYPES INCLUED (NOT WORKING)
    if (selectedSomeNode.length === 2) {
      // Second node  
      //dont group them together
      //const secondIndex = selectedNodes.value.findIndex(o => o.id === selectedSomeNode[1].id)
      //selectedNodes.value.splice(secondIndex + 1, 0, node)

      
      events.clickCallback && events.clickCallback()
      selectedNodes.value.push(node);
      selectedSomeNode.push(node);
      
      for (let i = 0; i < selectedSomeNode.length; i++) {
        const element = selectedSomeNode[i];
        //aboutToBeDroppedIds.push(element.id);
        element.state = 3;
      }

      isDropping.value = true;

      // Adding delays for animation effects
      setTimeout(() => {
        
      isDropping.value = false;
        //for (let i = 0; i < 3; i++) {
          // const index = selectedNodes.value.findIndex(o => o.type === node.type)
          //selectedNodes.value.splice(secondIndex - 1, 1)
        //}
        for (var i = selectedNodes.value.length -1; i >= 0; i--) {
          const element = selectedNodes.value[i];
          if (element.state === 3) {
            selectedNodes.value.splice(i, 1);
          }
        }
        preNode.value = null
        events.dropCallback && events.dropCallback()
        // Determine if the node has been cleared, i.e., if it is winning
        if (delNode ? nodes.value.length === 0 : nodes.value.every(o => o.state > 0) && removeList.value.length === 0 && selectedNodes.value.length === 0) {
          removeFlag.value = true
          backFlag.value = true
          events.winCallback && events.winCallback()
        }
      }, 2000 )
    }
    else {
      events.clickCallback && events.clickCallback()
      //const index = selectedNodes.value.findIndex(o => o.type === node.type)
      // this grouped the types together but seemed random
      //if (index > -1)
      //  selectedNodes.value.splice(index + 1, 0, node)
      //else
      //  selectedNodes.value.push(node)
      // Determine if the card slot is full, i.e. fail
      //console.log("nodepush", node)
      selectedNodes.value.push(node)
      if (selectedNodes.value.length === 7) {
        removeFlag.value = true
        backFlag.value = true
        events.loseCallback && events.loseCallback()
      }
    }
  }

  function handleSelectRemove(node: CardNode) {
    if (isDropping.value) {
      return;
    }
    const index = removeList.value.findIndex(o => o.id === node.id)
    if (index > -1)
      if(!isHint.value) removeList.value.splice(index, 1)
    //console.log("node", node)
    handleSelect(node)
  }

  function handleBack() {
    const node = preNode.value
    if (!node)
      return
    preNode.value = null
    backFlag.value = true
    node.state = 0
    delNode && nodes.value.push(node)
    const index = selectedNodes.value.findIndex(o => o.id === node.id)
    selectedNodes.value.splice(index, 1)
  }

  function handleRemove() {
  // 从selectedNodes.value中取出3个 到 removeList.value中

    if (selectedNodes.value.length < 3 || removeList.value.length + 3 >= 10)
      return
    removeFlag.value = true
    preNode.value = null
    for (let i = 0; i < 3; i++) {
      const node = selectedNodes.value.shift()
      if (!node)
        return
      removeList.value.push(node)
      node.state = 4
    }
  }

  function readJsonFile(path: string): any {
    const jsonData = require(path);
    return JSON.parse(jsonData);

    //fs.readFile('data.json', 'utf8', (err, data) => {
    //  if (err) {
    //    console.error('Error reading file:', err);
    //    return "error";
    //  }
    //
    //  try {
    //    const jsonData = JSON.parse(data);
    //    return jsonData;
    //  } catch (parseError) {
    //    console.error('Error parsing JSON:', parseError);
    //  }
    //});
    //return "error";
  }

  function pickPokeImage(pokeId: number): string {
    //const globPattern = getPathFromPokeId(pokeId);
    var indentedPokeId = pokeId.toString().padStart(4, "0");
    var imagePaths = getPokeImagePath(pokeId);

    const images: Record<string, string> = {};

    for (const key in imagePaths) {
      if (Object.prototype.hasOwnProperty.call(imagePaths, key)) {
        const imageName = key.split('/').pop() as string;
        images[imageName] = key;
      }
    }

    var imageKeys: string[] = Object.keys(images);
    
    if (imageKeys.length == 0) {
      console.error("No portrait found for id #" + pokeId);
      return "";
    }

    //console.log("images for " + pokeId, images);
//
    //let randPick = randomSeeded.randRange(0, imageKeys.length - 1);
    //console.log("imagekeys.lenght-1", imageKeys.length - 1);
    //let keyPick = imageKeys[randPick];
    //if (!keyPick) {
    //  console.log("randomSeeded", randomSeeded);
    //}
    //console.log("randPick, keypick:", randPick + ", " + keyPick);
    
    return images[randomSeeded.choice(imageKeys)];
  }

  function initData(config?: GameConfig | null) {
    //console.log("initData initiated");
    const { cardNum, layerNum, trap } = { ...initConfig, ...config }
    histroyList.value = []
    backFlag.value = false
    removeFlag.value = false
    removeList.value = []
    preNode.value = null
    nodes.value = []
    indexSet.clear()
    perFloorNodes = []
    selectedNodes.value = []
    floorList = []
    const isTrap = trap && floor(randomSeeded.randRange(0, 100)) !== 50
    undoHistoryList.value = [];
    // Generating a pool of nodes
    //console.log("Generating a pool of nodes");
    const selectedTypes: number[] = [];
    for (let index = 0; index < cardNum; index++) {
      if (selectedTypes.length >= types.length) {
        break;
      }
      
      pokeTypes = randomSeeded.shuffle(randomSeeded.shuffle(pokeTypes));
      var randomNumber = pokeTypes[0];
      while (true) {
          if (selectedTypes.includes(randomNumber)) {
            pokeTypes = randomSeeded.shuffle(randomSeeded.shuffle(pokeTypes));
            var randomNumber = pokeTypes[0];
          } else {
            break;
          }
      }
      console.log("typeNumber", randomNumber);
      selectedTypes.push(randomNumber);
    } 

    // const itemTypes = (new Array(cardNum).fill(0)).map((_, index) => index + 1);
    const itemTypes = selectedTypes;
    //console.log("itemTypes", itemTypes);
    let itemList: number[] = []
    for (let i = 0; i < 3 * layerNum; i++)
      itemList = [...itemList, ...itemTypes]
      //console.log("itemList", itemList);

    if (isTrap) {
      const len = itemList.length
      itemList.splice(len - cardNum, len)
    }
    // disrupt a node
    itemList = randomSeeded.shuffle(randomSeeded.shuffle(itemList))

    //console.log("Initialize individual hierarchical nodes");

    // Initialize individual hierarchical nodes
    let len = 0
    let floorIndex = 1
    const itemLength = itemList.length
    while (len <= itemLength) {
      const maxFloorNum = floorIndex * floorIndex
      const floorNum = ceil(randomSeeded.randRange(maxFloorNum / 2, maxFloorNum))
      floorList.push(itemList.splice(0, floorNum))
      len += floorNum
      floorIndex++
    }
    const containerWidth = container.value!.clientWidth
    const containerHeight = container.value!.clientHeight
    const width = containerWidth / 2
    const height = containerHeight / 2 - 60

    var tempIndex = 0;

    //console.log("floorListforeach");
    floorList.forEach((o, index) => {
      indexSet.clear()
      let i = 0
      const floorNodes: CardNode[] = []
      //console.log("types", types);
      var typesRecord: Record<string, Pokemon[]> =  {};
      var selectedPokemon: number[] = [];
      o.forEach((k) => {
        if (!typesRecord[k]) {
          typesRecord[k] = pokemonList.filter( (x) => x.types.includes(types[k])) as Pokemon[];
        }
      });
      o.forEach((k) => {

        //console.log("k", k);

        // Get random pokemon where type = k
        //var pokeListOneType = pokemonList.filter( (x) => x.types.includes(types[k]));
        var pokeListOneType = typesRecord[k];
        var pokeListOneTypeCopy = [...pokeListOneType]; //TODO MAYBE NEEDS A DEEP COPY?
        //console.log("pokeListOneType.length", pokeListOneType.length);
        var pokemonObject: Pokemon = pokemonList[0];
        
       //while (true) {
       //  var pokeId = randomSeeded.randRange(0, pokeListOneType.length - 1)
       //  if (selectedPokemon.includes(pokeId)) continue;
       //  pokemonObject = pokeListOneType[pokeId] as Pokemon;
       //  selectedPokemon.push(pokeId);
       //  break;
       //}

       if (pokeListOneType.length === 0) {
        pokeListOneType.push(...pokeListOneTypeCopy);  //TODO MAYBE NEEDS A DEEP COPY?
       }
        
        var pokeIndex = randomSeeded.randRange(0, pokeListOneType.length - 1)
        pokemonObject = pokeListOneType[pokeIndex] as Pokemon;
        selectedPokemon.push(pokeIndex);
        pokeListOneType.splice(pokeIndex, 1);
        

        pokemonObject.imageSource = new URL(pickPokeImage(pokemonObject.id), import.meta.url);
        //console.log("pokemonObject", pokemonObject);

        //pickPokeImage(pokemonObject.id).then((data) => {
        //  pokemonObject.imageSource = data;
        //});
        //
        //console.log("pokemon", pokemonObject);

        //console.log("here comes a while loop")

        i = floor(randomSeeded.randRange(0, (index + 1) ** 2))
        while (indexSet.has(i))
          i = floor(randomSeeded.randRange(0, (index + 1) ** 2))
        
        //console.log("it finished")
        const row = floor(i / (index + 1))
        const column = index ? i % index : 0
        const node: CardNode = {
          id: `${index}-${i}`,
          type: k,
          zIndex:
        tempIndex,
          index: i,
          row,
          column,
          top: height + (size * scale * row - (size / 2) * index),
          left: width + (size * scale * column - (size / 2) * index),
          parents: [],
          state: 0,
          pokemon: pokemonObject
        }
        const xy = [node.top, node.left]
        perFloorNodes.forEach((e) => {
          if (Math.abs(e.top - xy[0]) <= size && Math.abs(e.left - xy[1]) <= size)
            e.parents.push(node)
        })
        floorNodes.push(node)
        indexSet.add(i)
        tempIndex++;
      })
      nodes.value = nodes.value.concat(floorNodes)
      perFloorNodes = floorNodes
    })

    updateState()
    
    //backupGame();
    
    //console.log("initData finished");
  }

  return {
    nodes,
    selectedNodes,
    removeFlag,
    removeList,
    backFlag,
    undoHistoryList,
    score,
    curLevel,
    handleSelect,
    handleBack,
    handleHint,
    handleRemove,
    handleUndo,
    handleSelectRemove,
    initData,
    handleReset,
    handleSeed
  }
  
}

function getPokeImagePath(pokeId: number): Record<string, () => Promise<string>> | undefined {
  var imagePaths = undefined;
    switch(pokeId) {
      case 1: imagePaths = import.meta.glob('../assets/portrait/0001/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 2: imagePaths = import.meta.glob('../assets/portrait/0002/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 3: imagePaths = import.meta.glob('../assets/portrait/0003/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 4: imagePaths = import.meta.glob('../assets/portrait/0004/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 5: imagePaths = import.meta.glob('../assets/portrait/0005/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 6: imagePaths = import.meta.glob('../assets/portrait/0006/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 7: imagePaths = import.meta.glob('../assets/portrait/0007/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 8: imagePaths = import.meta.glob('../assets/portrait/0008/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 9: imagePaths = import.meta.glob('../assets/portrait/0009/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 10: imagePaths = import.meta.glob('../assets/portrait/0010/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 11: imagePaths = import.meta.glob('../assets/portrait/0011/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 12: imagePaths = import.meta.glob('../assets/portrait/0012/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 13: imagePaths = import.meta.glob('../assets/portrait/0013/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 14: imagePaths = import.meta.glob('../assets/portrait/0014/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 15: imagePaths = import.meta.glob('../assets/portrait/0015/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 16: imagePaths = import.meta.glob('../assets/portrait/0016/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 17: imagePaths = import.meta.glob('../assets/portrait/0017/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 18: imagePaths = import.meta.glob('../assets/portrait/0018/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 19: imagePaths = import.meta.glob('../assets/portrait/0019/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 20: imagePaths = import.meta.glob('../assets/portrait/0020/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 21: imagePaths = import.meta.glob('../assets/portrait/0021/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 22: imagePaths = import.meta.glob('../assets/portrait/0022/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 23: imagePaths = import.meta.glob('../assets/portrait/0023/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 24: imagePaths = import.meta.glob('../assets/portrait/0024/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 25: imagePaths = import.meta.glob('../assets/portrait/0025/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 26: imagePaths = import.meta.glob('../assets/portrait/0026/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 27: imagePaths = import.meta.glob('../assets/portrait/0027/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 28: imagePaths = import.meta.glob('../assets/portrait/0028/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 29: imagePaths = import.meta.glob('../assets/portrait/0029/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 30: imagePaths = import.meta.glob('../assets/portrait/0030/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 31: imagePaths = import.meta.glob('../assets/portrait/0031/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 32: imagePaths = import.meta.glob('../assets/portrait/0032/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 33: imagePaths = import.meta.glob('../assets/portrait/0033/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 34: imagePaths = import.meta.glob('../assets/portrait/0034/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 35: imagePaths = import.meta.glob('../assets/portrait/0035/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 36: imagePaths = import.meta.glob('../assets/portrait/0036/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 37: imagePaths = import.meta.glob('../assets/portrait/0037/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 38: imagePaths = import.meta.glob('../assets/portrait/0038/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 39: imagePaths = import.meta.glob('../assets/portrait/0039/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 40: imagePaths = import.meta.glob('../assets/portrait/0040/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 41: imagePaths = import.meta.glob('../assets/portrait/0041/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 42: imagePaths = import.meta.glob('../assets/portrait/0042/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 43: imagePaths = import.meta.glob('../assets/portrait/0043/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 44: imagePaths = import.meta.glob('../assets/portrait/0044/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 45: imagePaths = import.meta.glob('../assets/portrait/0045/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 46: imagePaths = import.meta.glob('../assets/portrait/0046/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 47: imagePaths = import.meta.glob('../assets/portrait/0047/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 48: imagePaths = import.meta.glob('../assets/portrait/0048/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 49: imagePaths = import.meta.glob('../assets/portrait/0049/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 50: imagePaths = import.meta.glob('../assets/portrait/0050/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 51: imagePaths = import.meta.glob('../assets/portrait/0051/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 52: imagePaths = import.meta.glob('../assets/portrait/0052/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 53: imagePaths = import.meta.glob('../assets/portrait/0053/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 54: imagePaths = import.meta.glob('../assets/portrait/0054/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 55: imagePaths = import.meta.glob('../assets/portrait/0055/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 56: imagePaths = import.meta.glob('../assets/portrait/0056/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 57: imagePaths = import.meta.glob('../assets/portrait/0057/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 58: imagePaths = import.meta.glob('../assets/portrait/0058/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 59: imagePaths = import.meta.glob('../assets/portrait/0059/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 60: imagePaths = import.meta.glob('../assets/portrait/0060/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 61: imagePaths = import.meta.glob('../assets/portrait/0061/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 62: imagePaths = import.meta.glob('../assets/portrait/0062/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 63: imagePaths = import.meta.glob('../assets/portrait/0063/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 64: imagePaths = import.meta.glob('../assets/portrait/0064/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 65: imagePaths = import.meta.glob('../assets/portrait/0065/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 66: imagePaths = import.meta.glob('../assets/portrait/0066/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 67: imagePaths = import.meta.glob('../assets/portrait/0067/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 68: imagePaths = import.meta.glob('../assets/portrait/0068/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 69: imagePaths = import.meta.glob('../assets/portrait/0069/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 70: imagePaths = import.meta.glob('../assets/portrait/0070/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 71: imagePaths = import.meta.glob('../assets/portrait/0071/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 72: imagePaths = import.meta.glob('../assets/portrait/0072/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 73: imagePaths = import.meta.glob('../assets/portrait/0073/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 74: imagePaths = import.meta.glob('../assets/portrait/0074/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 75: imagePaths = import.meta.glob('../assets/portrait/0075/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 76: imagePaths = import.meta.glob('../assets/portrait/0076/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 77: imagePaths = import.meta.glob('../assets/portrait/0077/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 78: imagePaths = import.meta.glob('../assets/portrait/0078/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 79: imagePaths = import.meta.glob('../assets/portrait/0079/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 80: imagePaths = import.meta.glob('../assets/portrait/0080/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 81: imagePaths = import.meta.glob('../assets/portrait/0081/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 82: imagePaths = import.meta.glob('../assets/portrait/0082/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 83: imagePaths = import.meta.glob('../assets/portrait/0083/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 84: imagePaths = import.meta.glob('../assets/portrait/0084/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 85: imagePaths = import.meta.glob('../assets/portrait/0085/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 86: imagePaths = import.meta.glob('../assets/portrait/0086/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 87: imagePaths = import.meta.glob('../assets/portrait/0087/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 88: imagePaths = import.meta.glob('../assets/portrait/0088/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 89: imagePaths = import.meta.glob('../assets/portrait/0089/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 90: imagePaths = import.meta.glob('../assets/portrait/0090/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 91: imagePaths = import.meta.glob('../assets/portrait/0091/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 92: imagePaths = import.meta.glob('../assets/portrait/0092/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 93: imagePaths = import.meta.glob('../assets/portrait/0093/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 94: imagePaths = import.meta.glob('../assets/portrait/0094/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 95: imagePaths = import.meta.glob('../assets/portrait/0095/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 96: imagePaths = import.meta.glob('../assets/portrait/0096/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 97: imagePaths = import.meta.glob('../assets/portrait/0097/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 98: imagePaths = import.meta.glob('../assets/portrait/0098/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 99: imagePaths = import.meta.glob('../assets/portrait/0099/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 100: imagePaths = import.meta.glob('../assets/portrait/0100/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 101: imagePaths = import.meta.glob('../assets/portrait/0101/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 102: imagePaths = import.meta.glob('../assets/portrait/0102/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 103: imagePaths = import.meta.glob('../assets/portrait/0103/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 104: imagePaths = import.meta.glob('../assets/portrait/0104/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 105: imagePaths = import.meta.glob('../assets/portrait/0105/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 106: imagePaths = import.meta.glob('../assets/portrait/0106/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 107: imagePaths = import.meta.glob('../assets/portrait/0107/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 108: imagePaths = import.meta.glob('../assets/portrait/0108/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 109: imagePaths = import.meta.glob('../assets/portrait/0109/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 110: imagePaths = import.meta.glob('../assets/portrait/0110/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 111: imagePaths = import.meta.glob('../assets/portrait/0111/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 112: imagePaths = import.meta.glob('../assets/portrait/0112/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 113: imagePaths = import.meta.glob('../assets/portrait/0113/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 114: imagePaths = import.meta.glob('../assets/portrait/0114/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 115: imagePaths = import.meta.glob('../assets/portrait/0115/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 116: imagePaths = import.meta.glob('../assets/portrait/0116/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 117: imagePaths = import.meta.glob('../assets/portrait/0117/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 118: imagePaths = import.meta.glob('../assets/portrait/0118/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 119: imagePaths = import.meta.glob('../assets/portrait/0119/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 120: imagePaths = import.meta.glob('../assets/portrait/0120/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 121: imagePaths = import.meta.glob('../assets/portrait/0121/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 122: imagePaths = import.meta.glob('../assets/portrait/0122/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 123: imagePaths = import.meta.glob('../assets/portrait/0123/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 124: imagePaths = import.meta.glob('../assets/portrait/0124/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 125: imagePaths = import.meta.glob('../assets/portrait/0125/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 126: imagePaths = import.meta.glob('../assets/portrait/0126/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 127: imagePaths = import.meta.glob('../assets/portrait/0127/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 128: imagePaths = import.meta.glob('../assets/portrait/0128/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 129: imagePaths = import.meta.glob('../assets/portrait/0129/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 130: imagePaths = import.meta.glob('../assets/portrait/0130/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 131: imagePaths = import.meta.glob('../assets/portrait/0131/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 132: imagePaths = import.meta.glob('../assets/portrait/0132/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 133: imagePaths = import.meta.glob('../assets/portrait/0133/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 134: imagePaths = import.meta.glob('../assets/portrait/0134/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 135: imagePaths = import.meta.glob('../assets/portrait/0135/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 136: imagePaths = import.meta.glob('../assets/portrait/0136/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 137: imagePaths = import.meta.glob('../assets/portrait/0137/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 138: imagePaths = import.meta.glob('../assets/portrait/0138/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 139: imagePaths = import.meta.glob('../assets/portrait/0139/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 140: imagePaths = import.meta.glob('../assets/portrait/0140/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 141: imagePaths = import.meta.glob('../assets/portrait/0141/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 142: imagePaths = import.meta.glob('../assets/portrait/0142/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 143: imagePaths = import.meta.glob('../assets/portrait/0143/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 144: imagePaths = import.meta.glob('../assets/portrait/0144/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 145: imagePaths = import.meta.glob('../assets/portrait/0145/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 146: imagePaths = import.meta.glob('../assets/portrait/0146/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 147: imagePaths = import.meta.glob('../assets/portrait/0147/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 148: imagePaths = import.meta.glob('../assets/portrait/0148/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 149: imagePaths = import.meta.glob('../assets/portrait/0149/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 150: imagePaths = import.meta.glob('../assets/portrait/0150/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 151: imagePaths = import.meta.glob('../assets/portrait/0151/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 152: imagePaths = import.meta.glob('../assets/portrait/0152/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 153: imagePaths = import.meta.glob('../assets/portrait/0153/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 154: imagePaths = import.meta.glob('../assets/portrait/0154/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 155: imagePaths = import.meta.glob('../assets/portrait/0155/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 156: imagePaths = import.meta.glob('../assets/portrait/0156/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 157: imagePaths = import.meta.glob('../assets/portrait/0157/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 158: imagePaths = import.meta.glob('../assets/portrait/0158/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 159: imagePaths = import.meta.glob('../assets/portrait/0159/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 160: imagePaths = import.meta.glob('../assets/portrait/0160/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 161: imagePaths = import.meta.glob('../assets/portrait/0161/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 162: imagePaths = import.meta.glob('../assets/portrait/0162/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 163: imagePaths = import.meta.glob('../assets/portrait/0163/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 164: imagePaths = import.meta.glob('../assets/portrait/0164/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 165: imagePaths = import.meta.glob('../assets/portrait/0165/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 166: imagePaths = import.meta.glob('../assets/portrait/0166/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 167: imagePaths = import.meta.glob('../assets/portrait/0167/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 168: imagePaths = import.meta.glob('../assets/portrait/0168/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 169: imagePaths = import.meta.glob('../assets/portrait/0169/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 170: imagePaths = import.meta.glob('../assets/portrait/0170/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 171: imagePaths = import.meta.glob('../assets/portrait/0171/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 172: imagePaths = import.meta.glob('../assets/portrait/0172/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 173: imagePaths = import.meta.glob('../assets/portrait/0173/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 174: imagePaths = import.meta.glob('../assets/portrait/0174/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 175: imagePaths = import.meta.glob('../assets/portrait/0175/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 176: imagePaths = import.meta.glob('../assets/portrait/0176/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 177: imagePaths = import.meta.glob('../assets/portrait/0177/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 178: imagePaths = import.meta.glob('../assets/portrait/0178/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 179: imagePaths = import.meta.glob('../assets/portrait/0179/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 180: imagePaths = import.meta.glob('../assets/portrait/0180/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 181: imagePaths = import.meta.glob('../assets/portrait/0181/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 182: imagePaths = import.meta.glob('../assets/portrait/0182/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 183: imagePaths = import.meta.glob('../assets/portrait/0183/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 184: imagePaths = import.meta.glob('../assets/portrait/0184/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 185: imagePaths = import.meta.glob('../assets/portrait/0185/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 186: imagePaths = import.meta.glob('../assets/portrait/0186/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 187: imagePaths = import.meta.glob('../assets/portrait/0187/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 188: imagePaths = import.meta.glob('../assets/portrait/0188/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 189: imagePaths = import.meta.glob('../assets/portrait/0189/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 190: imagePaths = import.meta.glob('../assets/portrait/0190/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 191: imagePaths = import.meta.glob('../assets/portrait/0191/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 192: imagePaths = import.meta.glob('../assets/portrait/0192/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 193: imagePaths = import.meta.glob('../assets/portrait/0193/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 194: imagePaths = import.meta.glob('../assets/portrait/0194/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 195: imagePaths = import.meta.glob('../assets/portrait/0195/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 196: imagePaths = import.meta.glob('../assets/portrait/0196/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 197: imagePaths = import.meta.glob('../assets/portrait/0197/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 198: imagePaths = import.meta.glob('../assets/portrait/0198/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 199: imagePaths = import.meta.glob('../assets/portrait/0199/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 200: imagePaths = import.meta.glob('../assets/portrait/0200/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 201: imagePaths = import.meta.glob('../assets/portrait/0201/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 202: imagePaths = import.meta.glob('../assets/portrait/0202/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 203: imagePaths = import.meta.glob('../assets/portrait/0203/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 204: imagePaths = import.meta.glob('../assets/portrait/0204/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 205: imagePaths = import.meta.glob('../assets/portrait/0205/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 206: imagePaths = import.meta.glob('../assets/portrait/0206/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 207: imagePaths = import.meta.glob('../assets/portrait/0207/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 208: imagePaths = import.meta.glob('../assets/portrait/0208/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 209: imagePaths = import.meta.glob('../assets/portrait/0209/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 210: imagePaths = import.meta.glob('../assets/portrait/0210/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 211: imagePaths = import.meta.glob('../assets/portrait/0211/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 212: imagePaths = import.meta.glob('../assets/portrait/0212/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 213: imagePaths = import.meta.glob('../assets/portrait/0213/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 214: imagePaths = import.meta.glob('../assets/portrait/0214/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 215: imagePaths = import.meta.glob('../assets/portrait/0215/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 216: imagePaths = import.meta.glob('../assets/portrait/0216/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 217: imagePaths = import.meta.glob('../assets/portrait/0217/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 218: imagePaths = import.meta.glob('../assets/portrait/0218/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 219: imagePaths = import.meta.glob('../assets/portrait/0219/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 220: imagePaths = import.meta.glob('../assets/portrait/0220/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 221: imagePaths = import.meta.glob('../assets/portrait/0221/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 222: imagePaths = import.meta.glob('../assets/portrait/0222/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 223: imagePaths = import.meta.glob('../assets/portrait/0223/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 224: imagePaths = import.meta.glob('../assets/portrait/0224/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 225: imagePaths = import.meta.glob('../assets/portrait/0225/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 226: imagePaths = import.meta.glob('../assets/portrait/0226/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 227: imagePaths = import.meta.glob('../assets/portrait/0227/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 228: imagePaths = import.meta.glob('../assets/portrait/0228/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 229: imagePaths = import.meta.glob('../assets/portrait/0229/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 230: imagePaths = import.meta.glob('../assets/portrait/0230/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 231: imagePaths = import.meta.glob('../assets/portrait/0231/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 232: imagePaths = import.meta.glob('../assets/portrait/0232/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 233: imagePaths = import.meta.glob('../assets/portrait/0233/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 234: imagePaths = import.meta.glob('../assets/portrait/0234/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 235: imagePaths = import.meta.glob('../assets/portrait/0235/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 236: imagePaths = import.meta.glob('../assets/portrait/0236/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 237: imagePaths = import.meta.glob('../assets/portrait/0237/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 238: imagePaths = import.meta.glob('../assets/portrait/0238/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 239: imagePaths = import.meta.glob('../assets/portrait/0239/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 240: imagePaths = import.meta.glob('../assets/portrait/0240/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 241: imagePaths = import.meta.glob('../assets/portrait/0241/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 242: imagePaths = import.meta.glob('../assets/portrait/0242/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 243: imagePaths = import.meta.glob('../assets/portrait/0243/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 244: imagePaths = import.meta.glob('../assets/portrait/0244/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 245: imagePaths = import.meta.glob('../assets/portrait/0245/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 246: imagePaths = import.meta.glob('../assets/portrait/0246/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 247: imagePaths = import.meta.glob('../assets/portrait/0247/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 248: imagePaths = import.meta.glob('../assets/portrait/0248/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 249: imagePaths = import.meta.glob('../assets/portrait/0249/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 250: imagePaths = import.meta.glob('../assets/portrait/0250/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 251: imagePaths = import.meta.glob('../assets/portrait/0251/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 252: imagePaths = import.meta.glob('../assets/portrait/0252/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 253: imagePaths = import.meta.glob('../assets/portrait/0253/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 254: imagePaths = import.meta.glob('../assets/portrait/0254/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 255: imagePaths = import.meta.glob('../assets/portrait/0255/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 256: imagePaths = import.meta.glob('../assets/portrait/0256/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 257: imagePaths = import.meta.glob('../assets/portrait/0257/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 258: imagePaths = import.meta.glob('../assets/portrait/0258/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 259: imagePaths = import.meta.glob('../assets/portrait/0259/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 260: imagePaths = import.meta.glob('../assets/portrait/0260/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 261: imagePaths = import.meta.glob('../assets/portrait/0261/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 262: imagePaths = import.meta.glob('../assets/portrait/0262/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 263: imagePaths = import.meta.glob('../assets/portrait/0263/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 264: imagePaths = import.meta.glob('../assets/portrait/0264/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 265: imagePaths = import.meta.glob('../assets/portrait/0265/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 266: imagePaths = import.meta.glob('../assets/portrait/0266/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 267: imagePaths = import.meta.glob('../assets/portrait/0267/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 268: imagePaths = import.meta.glob('../assets/portrait/0268/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 269: imagePaths = import.meta.glob('../assets/portrait/0269/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 270: imagePaths = import.meta.glob('../assets/portrait/0270/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 271: imagePaths = import.meta.glob('../assets/portrait/0271/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 272: imagePaths = import.meta.glob('../assets/portrait/0272/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 273: imagePaths = import.meta.glob('../assets/portrait/0273/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 274: imagePaths = import.meta.glob('../assets/portrait/0274/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 275: imagePaths = import.meta.glob('../assets/portrait/0275/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 276: imagePaths = import.meta.glob('../assets/portrait/0276/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 277: imagePaths = import.meta.glob('../assets/portrait/0277/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 278: imagePaths = import.meta.glob('../assets/portrait/0278/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 279: imagePaths = import.meta.glob('../assets/portrait/0279/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 280: imagePaths = import.meta.glob('../assets/portrait/0280/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 281: imagePaths = import.meta.glob('../assets/portrait/0281/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 282: imagePaths = import.meta.glob('../assets/portrait/0282/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 283: imagePaths = import.meta.glob('../assets/portrait/0283/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 284: imagePaths = import.meta.glob('../assets/portrait/0284/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 285: imagePaths = import.meta.glob('../assets/portrait/0285/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 286: imagePaths = import.meta.glob('../assets/portrait/0286/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 287: imagePaths = import.meta.glob('../assets/portrait/0287/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 288: imagePaths = import.meta.glob('../assets/portrait/0288/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 289: imagePaths = import.meta.glob('../assets/portrait/0289/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 290: imagePaths = import.meta.glob('../assets/portrait/0290/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 291: imagePaths = import.meta.glob('../assets/portrait/0291/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 292: imagePaths = import.meta.glob('../assets/portrait/0292/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 293: imagePaths = import.meta.glob('../assets/portrait/0293/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 294: imagePaths = import.meta.glob('../assets/portrait/0294/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 295: imagePaths = import.meta.glob('../assets/portrait/0295/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 296: imagePaths = import.meta.glob('../assets/portrait/0296/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 297: imagePaths = import.meta.glob('../assets/portrait/0297/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 298: imagePaths = import.meta.glob('../assets/portrait/0298/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 299: imagePaths = import.meta.glob('../assets/portrait/0299/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 300: imagePaths = import.meta.glob('../assets/portrait/0300/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 301: imagePaths = import.meta.glob('../assets/portrait/0301/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 302: imagePaths = import.meta.glob('../assets/portrait/0302/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 303: imagePaths = import.meta.glob('../assets/portrait/0303/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 304: imagePaths = import.meta.glob('../assets/portrait/0304/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 305: imagePaths = import.meta.glob('../assets/portrait/0305/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 306: imagePaths = import.meta.glob('../assets/portrait/0306/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 307: imagePaths = import.meta.glob('../assets/portrait/0307/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 308: imagePaths = import.meta.glob('../assets/portrait/0308/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 309: imagePaths = import.meta.glob('../assets/portrait/0309/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 310: imagePaths = import.meta.glob('../assets/portrait/0310/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 311: imagePaths = import.meta.glob('../assets/portrait/0311/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 312: imagePaths = import.meta.glob('../assets/portrait/0312/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 313: imagePaths = import.meta.glob('../assets/portrait/0313/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 314: imagePaths = import.meta.glob('../assets/portrait/0314/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 315: imagePaths = import.meta.glob('../assets/portrait/0315/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 316: imagePaths = import.meta.glob('../assets/portrait/0316/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 317: imagePaths = import.meta.glob('../assets/portrait/0317/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 318: imagePaths = import.meta.glob('../assets/portrait/0318/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 319: imagePaths = import.meta.glob('../assets/portrait/0319/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 320: imagePaths = import.meta.glob('../assets/portrait/0320/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 321: imagePaths = import.meta.glob('../assets/portrait/0321/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 322: imagePaths = import.meta.glob('../assets/portrait/0322/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 323: imagePaths = import.meta.glob('../assets/portrait/0323/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 324: imagePaths = import.meta.glob('../assets/portrait/0324/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 325: imagePaths = import.meta.glob('../assets/portrait/0325/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 326: imagePaths = import.meta.glob('../assets/portrait/0326/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 327: imagePaths = import.meta.glob('../assets/portrait/0327/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 328: imagePaths = import.meta.glob('../assets/portrait/0328/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 329: imagePaths = import.meta.glob('../assets/portrait/0329/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 330: imagePaths = import.meta.glob('../assets/portrait/0330/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 331: imagePaths = import.meta.glob('../assets/portrait/0331/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 332: imagePaths = import.meta.glob('../assets/portrait/0332/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 333: imagePaths = import.meta.glob('../assets/portrait/0333/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 334: imagePaths = import.meta.glob('../assets/portrait/0334/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 335: imagePaths = import.meta.glob('../assets/portrait/0335/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 336: imagePaths = import.meta.glob('../assets/portrait/0336/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 337: imagePaths = import.meta.glob('../assets/portrait/0337/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 338: imagePaths = import.meta.glob('../assets/portrait/0338/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 339: imagePaths = import.meta.glob('../assets/portrait/0339/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 340: imagePaths = import.meta.glob('../assets/portrait/0340/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 341: imagePaths = import.meta.glob('../assets/portrait/0341/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 342: imagePaths = import.meta.glob('../assets/portrait/0342/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 343: imagePaths = import.meta.glob('../assets/portrait/0343/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 344: imagePaths = import.meta.glob('../assets/portrait/0344/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 345: imagePaths = import.meta.glob('../assets/portrait/0345/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 346: imagePaths = import.meta.glob('../assets/portrait/0346/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 347: imagePaths = import.meta.glob('../assets/portrait/0347/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 348: imagePaths = import.meta.glob('../assets/portrait/0348/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 349: imagePaths = import.meta.glob('../assets/portrait/0349/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 350: imagePaths = import.meta.glob('../assets/portrait/0350/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 351: imagePaths = import.meta.glob('../assets/portrait/0351/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 352: imagePaths = import.meta.glob('../assets/portrait/0352/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 353: imagePaths = import.meta.glob('../assets/portrait/0353/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 354: imagePaths = import.meta.glob('../assets/portrait/0354/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 355: imagePaths = import.meta.glob('../assets/portrait/0355/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 356: imagePaths = import.meta.glob('../assets/portrait/0356/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 357: imagePaths = import.meta.glob('../assets/portrait/0357/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 358: imagePaths = import.meta.glob('../assets/portrait/0358/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 359: imagePaths = import.meta.glob('../assets/portrait/0359/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 360: imagePaths = import.meta.glob('../assets/portrait/0360/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 361: imagePaths = import.meta.glob('../assets/portrait/0361/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 362: imagePaths = import.meta.glob('../assets/portrait/0362/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 363: imagePaths = import.meta.glob('../assets/portrait/0363/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 364: imagePaths = import.meta.glob('../assets/portrait/0364/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 365: imagePaths = import.meta.glob('../assets/portrait/0365/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 366: imagePaths = import.meta.glob('../assets/portrait/0366/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 367: imagePaths = import.meta.glob('../assets/portrait/0367/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 368: imagePaths = import.meta.glob('../assets/portrait/0368/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 369: imagePaths = import.meta.glob('../assets/portrait/0369/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 370: imagePaths = import.meta.glob('../assets/portrait/0370/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 371: imagePaths = import.meta.glob('../assets/portrait/0371/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 372: imagePaths = import.meta.glob('../assets/portrait/0372/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 373: imagePaths = import.meta.glob('../assets/portrait/0373/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 374: imagePaths = import.meta.glob('../assets/portrait/0374/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 375: imagePaths = import.meta.glob('../assets/portrait/0375/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 376: imagePaths = import.meta.glob('../assets/portrait/0376/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 377: imagePaths = import.meta.glob('../assets/portrait/0377/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 378: imagePaths = import.meta.glob('../assets/portrait/0378/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 379: imagePaths = import.meta.glob('../assets/portrait/0379/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 380: imagePaths = import.meta.glob('../assets/portrait/0380/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 381: imagePaths = import.meta.glob('../assets/portrait/0381/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 382: imagePaths = import.meta.glob('../assets/portrait/0382/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 383: imagePaths = import.meta.glob('../assets/portrait/0383/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 384: imagePaths = import.meta.glob('../assets/portrait/0384/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 385: imagePaths = import.meta.glob('../assets/portrait/0385/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 386: imagePaths = import.meta.glob('../assets/portrait/0386/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 387: imagePaths = import.meta.glob('../assets/portrait/0387/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 388: imagePaths = import.meta.glob('../assets/portrait/0388/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 389: imagePaths = import.meta.glob('../assets/portrait/0389/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 390: imagePaths = import.meta.glob('../assets/portrait/0390/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 391: imagePaths = import.meta.glob('../assets/portrait/0391/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 392: imagePaths = import.meta.glob('../assets/portrait/0392/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 393: imagePaths = import.meta.glob('../assets/portrait/0393/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 394: imagePaths = import.meta.glob('../assets/portrait/0394/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 395: imagePaths = import.meta.glob('../assets/portrait/0395/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 396: imagePaths = import.meta.glob('../assets/portrait/0396/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 397: imagePaths = import.meta.glob('../assets/portrait/0397/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 398: imagePaths = import.meta.glob('../assets/portrait/0398/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 399: imagePaths = import.meta.glob('../assets/portrait/0399/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 400: imagePaths = import.meta.glob('../assets/portrait/0400/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 401: imagePaths = import.meta.glob('../assets/portrait/0401/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 402: imagePaths = import.meta.glob('../assets/portrait/0402/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 403: imagePaths = import.meta.glob('../assets/portrait/0403/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 404: imagePaths = import.meta.glob('../assets/portrait/0404/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 405: imagePaths = import.meta.glob('../assets/portrait/0405/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 406: imagePaths = import.meta.glob('../assets/portrait/0406/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 407: imagePaths = import.meta.glob('../assets/portrait/0407/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 408: imagePaths = import.meta.glob('../assets/portrait/0408/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 409: imagePaths = import.meta.glob('../assets/portrait/0409/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 410: imagePaths = import.meta.glob('../assets/portrait/0410/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 411: imagePaths = import.meta.glob('../assets/portrait/0411/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 412: imagePaths = import.meta.glob('../assets/portrait/0412/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 413: imagePaths = import.meta.glob('../assets/portrait/0413/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 414: imagePaths = import.meta.glob('../assets/portrait/0414/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 415: imagePaths = import.meta.glob('../assets/portrait/0415/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 416: imagePaths = import.meta.glob('../assets/portrait/0416/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 417: imagePaths = import.meta.glob('../assets/portrait/0417/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 418: imagePaths = import.meta.glob('../assets/portrait/0418/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 419: imagePaths = import.meta.glob('../assets/portrait/0419/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 420: imagePaths = import.meta.glob('../assets/portrait/0420/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 421: imagePaths = import.meta.glob('../assets/portrait/0421/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 422: imagePaths = import.meta.glob('../assets/portrait/0422/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 423: imagePaths = import.meta.glob('../assets/portrait/0423/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 424: imagePaths = import.meta.glob('../assets/portrait/0424/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 425: imagePaths = import.meta.glob('../assets/portrait/0425/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 426: imagePaths = import.meta.glob('../assets/portrait/0426/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 427: imagePaths = import.meta.glob('../assets/portrait/0427/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 428: imagePaths = import.meta.glob('../assets/portrait/0428/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 429: imagePaths = import.meta.glob('../assets/portrait/0429/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 430: imagePaths = import.meta.glob('../assets/portrait/0430/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 431: imagePaths = import.meta.glob('../assets/portrait/0431/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 432: imagePaths = import.meta.glob('../assets/portrait/0432/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 433: imagePaths = import.meta.glob('../assets/portrait/0433/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 434: imagePaths = import.meta.glob('../assets/portrait/0434/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 435: imagePaths = import.meta.glob('../assets/portrait/0435/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 436: imagePaths = import.meta.glob('../assets/portrait/0436/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 437: imagePaths = import.meta.glob('../assets/portrait/0437/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 438: imagePaths = import.meta.glob('../assets/portrait/0438/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 439: imagePaths = import.meta.glob('../assets/portrait/0439/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 440: imagePaths = import.meta.glob('../assets/portrait/0440/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 441: imagePaths = import.meta.glob('../assets/portrait/0441/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 442: imagePaths = import.meta.glob('../assets/portrait/0442/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 443: imagePaths = import.meta.glob('../assets/portrait/0443/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 444: imagePaths = import.meta.glob('../assets/portrait/0444/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 445: imagePaths = import.meta.glob('../assets/portrait/0445/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 446: imagePaths = import.meta.glob('../assets/portrait/0446/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 447: imagePaths = import.meta.glob('../assets/portrait/0447/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 448: imagePaths = import.meta.glob('../assets/portrait/0448/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 449: imagePaths = import.meta.glob('../assets/portrait/0449/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 450: imagePaths = import.meta.glob('../assets/portrait/0450/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 451: imagePaths = import.meta.glob('../assets/portrait/0451/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 452: imagePaths = import.meta.glob('../assets/portrait/0452/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 453: imagePaths = import.meta.glob('../assets/portrait/0453/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 454: imagePaths = import.meta.glob('../assets/portrait/0454/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 455: imagePaths = import.meta.glob('../assets/portrait/0455/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 456: imagePaths = import.meta.glob('../assets/portrait/0456/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 457: imagePaths = import.meta.glob('../assets/portrait/0457/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 458: imagePaths = import.meta.glob('../assets/portrait/0458/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 459: imagePaths = import.meta.glob('../assets/portrait/0459/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 460: imagePaths = import.meta.glob('../assets/portrait/0460/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 461: imagePaths = import.meta.glob('../assets/portrait/0461/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 462: imagePaths = import.meta.glob('../assets/portrait/0462/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 463: imagePaths = import.meta.glob('../assets/portrait/0463/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 464: imagePaths = import.meta.glob('../assets/portrait/0464/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 465: imagePaths = import.meta.glob('../assets/portrait/0465/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 466: imagePaths = import.meta.glob('../assets/portrait/0466/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 467: imagePaths = import.meta.glob('../assets/portrait/0467/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 468: imagePaths = import.meta.glob('../assets/portrait/0468/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 469: imagePaths = import.meta.glob('../assets/portrait/0469/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 470: imagePaths = import.meta.glob('../assets/portrait/0470/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 471: imagePaths = import.meta.glob('../assets/portrait/0471/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 472: imagePaths = import.meta.glob('../assets/portrait/0472/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 473: imagePaths = import.meta.glob('../assets/portrait/0473/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 474: imagePaths = import.meta.glob('../assets/portrait/0474/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 475: imagePaths = import.meta.glob('../assets/portrait/0475/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 476: imagePaths = import.meta.glob('../assets/portrait/0476/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 477: imagePaths = import.meta.glob('../assets/portrait/0477/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 478: imagePaths = import.meta.glob('../assets/portrait/0478/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 479: imagePaths = import.meta.glob('../assets/portrait/0479/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 480: imagePaths = import.meta.glob('../assets/portrait/0480/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 481: imagePaths = import.meta.glob('../assets/portrait/0481/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 482: imagePaths = import.meta.glob('../assets/portrait/0482/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 483: imagePaths = import.meta.glob('../assets/portrait/0483/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 484: imagePaths = import.meta.glob('../assets/portrait/0484/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 485: imagePaths = import.meta.glob('../assets/portrait/0485/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 486: imagePaths = import.meta.glob('../assets/portrait/0486/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 487: imagePaths = import.meta.glob('../assets/portrait/0487/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 488: imagePaths = import.meta.glob('../assets/portrait/0488/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 489: imagePaths = import.meta.glob('../assets/portrait/0489/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 490: imagePaths = import.meta.glob('../assets/portrait/0490/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 491: imagePaths = import.meta.glob('../assets/portrait/0491/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 492: imagePaths = import.meta.glob('../assets/portrait/0492/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 493: imagePaths = import.meta.glob('../assets/portrait/0493/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 494: imagePaths = import.meta.glob('../assets/portrait/0494/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 495: imagePaths = import.meta.glob('../assets/portrait/0495/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 496: imagePaths = import.meta.glob('../assets/portrait/0496/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 497: imagePaths = import.meta.glob('../assets/portrait/0497/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 498: imagePaths = import.meta.glob('../assets/portrait/0498/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 499: imagePaths = import.meta.glob('../assets/portrait/0499/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 500: imagePaths = import.meta.glob('../assets/portrait/0500/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 501: imagePaths = import.meta.glob('../assets/portrait/0501/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 502: imagePaths = import.meta.glob('../assets/portrait/0502/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 503: imagePaths = import.meta.glob('../assets/portrait/0503/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 504: imagePaths = import.meta.glob('../assets/portrait/0504/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 505: imagePaths = import.meta.glob('../assets/portrait/0505/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 506: imagePaths = import.meta.glob('../assets/portrait/0506/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 507: imagePaths = import.meta.glob('../assets/portrait/0507/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 508: imagePaths = import.meta.glob('../assets/portrait/0508/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 509: imagePaths = import.meta.glob('../assets/portrait/0509/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 510: imagePaths = import.meta.glob('../assets/portrait/0510/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 511: imagePaths = import.meta.glob('../assets/portrait/0511/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 512: imagePaths = import.meta.glob('../assets/portrait/0512/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 513: imagePaths = import.meta.glob('../assets/portrait/0513/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 514: imagePaths = import.meta.glob('../assets/portrait/0514/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 515: imagePaths = import.meta.glob('../assets/portrait/0515/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 516: imagePaths = import.meta.glob('../assets/portrait/0516/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 517: imagePaths = import.meta.glob('../assets/portrait/0517/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 518: imagePaths = import.meta.glob('../assets/portrait/0518/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 519: imagePaths = import.meta.glob('../assets/portrait/0519/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 520: imagePaths = import.meta.glob('../assets/portrait/0520/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 521: imagePaths = import.meta.glob('../assets/portrait/0521/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 522: imagePaths = import.meta.glob('../assets/portrait/0522/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 523: imagePaths = import.meta.glob('../assets/portrait/0523/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 524: imagePaths = import.meta.glob('../assets/portrait/0524/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 525: imagePaths = import.meta.glob('../assets/portrait/0525/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 526: imagePaths = import.meta.glob('../assets/portrait/0526/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 527: imagePaths = import.meta.glob('../assets/portrait/0527/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 528: imagePaths = import.meta.glob('../assets/portrait/0528/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 529: imagePaths = import.meta.glob('../assets/portrait/0529/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 530: imagePaths = import.meta.glob('../assets/portrait/0530/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 531: imagePaths = import.meta.glob('../assets/portrait/0531/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 532: imagePaths = import.meta.glob('../assets/portrait/0532/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 533: imagePaths = import.meta.glob('../assets/portrait/0533/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 534: imagePaths = import.meta.glob('../assets/portrait/0534/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 535: imagePaths = import.meta.glob('../assets/portrait/0535/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 536: imagePaths = import.meta.glob('../assets/portrait/0536/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 537: imagePaths = import.meta.glob('../assets/portrait/0537/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 538: imagePaths = import.meta.glob('../assets/portrait/0538/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 539: imagePaths = import.meta.glob('../assets/portrait/0539/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 540: imagePaths = import.meta.glob('../assets/portrait/0540/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 541: imagePaths = import.meta.glob('../assets/portrait/0541/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 542: imagePaths = import.meta.glob('../assets/portrait/0542/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 543: imagePaths = import.meta.glob('../assets/portrait/0543/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 544: imagePaths = import.meta.glob('../assets/portrait/0544/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 545: imagePaths = import.meta.glob('../assets/portrait/0545/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 546: imagePaths = import.meta.glob('../assets/portrait/0546/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 547: imagePaths = import.meta.glob('../assets/portrait/0547/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 548: imagePaths = import.meta.glob('../assets/portrait/0548/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 549: imagePaths = import.meta.glob('../assets/portrait/0549/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 550: imagePaths = import.meta.glob('../assets/portrait/0550/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 551: imagePaths = import.meta.glob('../assets/portrait/0551/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 552: imagePaths = import.meta.glob('../assets/portrait/0552/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 553: imagePaths = import.meta.glob('../assets/portrait/0553/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 554: imagePaths = import.meta.glob('../assets/portrait/0554/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 555: imagePaths = import.meta.glob('../assets/portrait/0555/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 556: imagePaths = import.meta.glob('../assets/portrait/0556/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 557: imagePaths = import.meta.glob('../assets/portrait/0557/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 558: imagePaths = import.meta.glob('../assets/portrait/0558/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 559: imagePaths = import.meta.glob('../assets/portrait/0559/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 560: imagePaths = import.meta.glob('../assets/portrait/0560/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 561: imagePaths = import.meta.glob('../assets/portrait/0561/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 562: imagePaths = import.meta.glob('../assets/portrait/0562/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 563: imagePaths = import.meta.glob('../assets/portrait/0563/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 564: imagePaths = import.meta.glob('../assets/portrait/0564/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 565: imagePaths = import.meta.glob('../assets/portrait/0565/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 566: imagePaths = import.meta.glob('../assets/portrait/0566/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 567: imagePaths = import.meta.glob('../assets/portrait/0567/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 568: imagePaths = import.meta.glob('../assets/portrait/0568/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 569: imagePaths = import.meta.glob('../assets/portrait/0569/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 570: imagePaths = import.meta.glob('../assets/portrait/0570/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 571: imagePaths = import.meta.glob('../assets/portrait/0571/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 572: imagePaths = import.meta.glob('../assets/portrait/0572/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 573: imagePaths = import.meta.glob('../assets/portrait/0573/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 574: imagePaths = import.meta.glob('../assets/portrait/0574/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 575: imagePaths = import.meta.glob('../assets/portrait/0575/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 576: imagePaths = import.meta.glob('../assets/portrait/0576/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 577: imagePaths = import.meta.glob('../assets/portrait/0577/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 578: imagePaths = import.meta.glob('../assets/portrait/0578/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 579: imagePaths = import.meta.glob('../assets/portrait/0579/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 580: imagePaths = import.meta.glob('../assets/portrait/0580/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 581: imagePaths = import.meta.glob('../assets/portrait/0581/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 582: imagePaths = import.meta.glob('../assets/portrait/0582/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 583: imagePaths = import.meta.glob('../assets/portrait/0583/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 584: imagePaths = import.meta.glob('../assets/portrait/0584/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 585: imagePaths = import.meta.glob('../assets/portrait/0585/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 586: imagePaths = import.meta.glob('../assets/portrait/0586/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 587: imagePaths = import.meta.glob('../assets/portrait/0587/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 588: imagePaths = import.meta.glob('../assets/portrait/0588/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 589: imagePaths = import.meta.glob('../assets/portrait/0589/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 590: imagePaths = import.meta.glob('../assets/portrait/0590/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 591: imagePaths = import.meta.glob('../assets/portrait/0591/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 592: imagePaths = import.meta.glob('../assets/portrait/0592/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 593: imagePaths = import.meta.glob('../assets/portrait/0593/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 594: imagePaths = import.meta.glob('../assets/portrait/0594/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 595: imagePaths = import.meta.glob('../assets/portrait/0595/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 596: imagePaths = import.meta.glob('../assets/portrait/0596/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 597: imagePaths = import.meta.glob('../assets/portrait/0597/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 598: imagePaths = import.meta.glob('../assets/portrait/0598/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 599: imagePaths = import.meta.glob('../assets/portrait/0599/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 600: imagePaths = import.meta.glob('../assets/portrait/0600/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 601: imagePaths = import.meta.glob('../assets/portrait/0601/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 602: imagePaths = import.meta.glob('../assets/portrait/0602/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 603: imagePaths = import.meta.glob('../assets/portrait/0603/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 604: imagePaths = import.meta.glob('../assets/portrait/0604/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 605: imagePaths = import.meta.glob('../assets/portrait/0605/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 606: imagePaths = import.meta.glob('../assets/portrait/0606/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 607: imagePaths = import.meta.glob('../assets/portrait/0607/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 608: imagePaths = import.meta.glob('../assets/portrait/0608/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 609: imagePaths = import.meta.glob('../assets/portrait/0609/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 610: imagePaths = import.meta.glob('../assets/portrait/0610/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 611: imagePaths = import.meta.glob('../assets/portrait/0611/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 612: imagePaths = import.meta.glob('../assets/portrait/0612/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 613: imagePaths = import.meta.glob('../assets/portrait/0613/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 614: imagePaths = import.meta.glob('../assets/portrait/0614/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 615: imagePaths = import.meta.glob('../assets/portrait/0615/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 616: imagePaths = import.meta.glob('../assets/portrait/0616/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 617: imagePaths = import.meta.glob('../assets/portrait/0617/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 618: imagePaths = import.meta.glob('../assets/portrait/0618/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 619: imagePaths = import.meta.glob('../assets/portrait/0619/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 620: imagePaths = import.meta.glob('../assets/portrait/0620/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 621: imagePaths = import.meta.glob('../assets/portrait/0621/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 622: imagePaths = import.meta.glob('../assets/portrait/0622/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 623: imagePaths = import.meta.glob('../assets/portrait/0623/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 624: imagePaths = import.meta.glob('../assets/portrait/0624/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 625: imagePaths = import.meta.glob('../assets/portrait/0625/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 626: imagePaths = import.meta.glob('../assets/portrait/0626/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 627: imagePaths = import.meta.glob('../assets/portrait/0627/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 628: imagePaths = import.meta.glob('../assets/portrait/0628/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 629: imagePaths = import.meta.glob('../assets/portrait/0629/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 630: imagePaths = import.meta.glob('../assets/portrait/0630/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 631: imagePaths = import.meta.glob('../assets/portrait/0631/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 632: imagePaths = import.meta.glob('../assets/portrait/0632/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 633: imagePaths = import.meta.glob('../assets/portrait/0633/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 634: imagePaths = import.meta.glob('../assets/portrait/0634/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 635: imagePaths = import.meta.glob('../assets/portrait/0635/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 636: imagePaths = import.meta.glob('../assets/portrait/0636/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 637: imagePaths = import.meta.glob('../assets/portrait/0637/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 638: imagePaths = import.meta.glob('../assets/portrait/0638/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 639: imagePaths = import.meta.glob('../assets/portrait/0639/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 640: imagePaths = import.meta.glob('../assets/portrait/0640/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 641: imagePaths = import.meta.glob('../assets/portrait/0641/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 642: imagePaths = import.meta.glob('../assets/portrait/0642/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 643: imagePaths = import.meta.glob('../assets/portrait/0643/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 644: imagePaths = import.meta.glob('../assets/portrait/0644/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 645: imagePaths = import.meta.glob('../assets/portrait/0645/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 646: imagePaths = import.meta.glob('../assets/portrait/0646/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 647: imagePaths = import.meta.glob('../assets/portrait/0647/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 648: imagePaths = import.meta.glob('../assets/portrait/0648/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 649: imagePaths = import.meta.glob('../assets/portrait/0649/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 650: imagePaths = import.meta.glob('../assets/portrait/0650/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 651: imagePaths = import.meta.glob('../assets/portrait/0651/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 652: imagePaths = import.meta.glob('../assets/portrait/0652/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 653: imagePaths = import.meta.glob('../assets/portrait/0653/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 654: imagePaths = import.meta.glob('../assets/portrait/0654/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 655: imagePaths = import.meta.glob('../assets/portrait/0655/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 656: imagePaths = import.meta.glob('../assets/portrait/0656/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 657: imagePaths = import.meta.glob('../assets/portrait/0657/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 658: imagePaths = import.meta.glob('../assets/portrait/0658/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 659: imagePaths = import.meta.glob('../assets/portrait/0659/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 660: imagePaths = import.meta.glob('../assets/portrait/0660/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 661: imagePaths = import.meta.glob('../assets/portrait/0661/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 662: imagePaths = import.meta.glob('../assets/portrait/0662/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 663: imagePaths = import.meta.glob('../assets/portrait/0663/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 664: imagePaths = import.meta.glob('../assets/portrait/0664/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 665: imagePaths = import.meta.glob('../assets/portrait/0665/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 666: imagePaths = import.meta.glob('../assets/portrait/0666/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 667: imagePaths = import.meta.glob('../assets/portrait/0667/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 668: imagePaths = import.meta.glob('../assets/portrait/0668/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 669: imagePaths = import.meta.glob('../assets/portrait/0669/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 670: imagePaths = import.meta.glob('../assets/portrait/0670/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 671: imagePaths = import.meta.glob('../assets/portrait/0671/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 672: imagePaths = import.meta.glob('../assets/portrait/0672/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 673: imagePaths = import.meta.glob('../assets/portrait/0673/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 674: imagePaths = import.meta.glob('../assets/portrait/0674/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 675: imagePaths = import.meta.glob('../assets/portrait/0675/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 676: imagePaths = import.meta.glob('../assets/portrait/0676/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 677: imagePaths = import.meta.glob('../assets/portrait/0677/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 678: imagePaths = import.meta.glob('../assets/portrait/0678/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 679: imagePaths = import.meta.glob('../assets/portrait/0679/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 680: imagePaths = import.meta.glob('../assets/portrait/0680/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 681: imagePaths = import.meta.glob('../assets/portrait/0681/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 682: imagePaths = import.meta.glob('../assets/portrait/0682/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 683: imagePaths = import.meta.glob('../assets/portrait/0683/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 684: imagePaths = import.meta.glob('../assets/portrait/0684/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 685: imagePaths = import.meta.glob('../assets/portrait/0685/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 686: imagePaths = import.meta.glob('../assets/portrait/0686/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 687: imagePaths = import.meta.glob('../assets/portrait/0687/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 688: imagePaths = import.meta.glob('../assets/portrait/0688/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 689: imagePaths = import.meta.glob('../assets/portrait/0689/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 690: imagePaths = import.meta.glob('../assets/portrait/0690/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 691: imagePaths = import.meta.glob('../assets/portrait/0691/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 692: imagePaths = import.meta.glob('../assets/portrait/0692/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 693: imagePaths = import.meta.glob('../assets/portrait/0693/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 694: imagePaths = import.meta.glob('../assets/portrait/0694/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 695: imagePaths = import.meta.glob('../assets/portrait/0695/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 696: imagePaths = import.meta.glob('../assets/portrait/0696/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 697: imagePaths = import.meta.glob('../assets/portrait/0697/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 698: imagePaths = import.meta.glob('../assets/portrait/0698/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 699: imagePaths = import.meta.glob('../assets/portrait/0699/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 700: imagePaths = import.meta.glob('../assets/portrait/0700/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 701: imagePaths = import.meta.glob('../assets/portrait/0701/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 702: imagePaths = import.meta.glob('../assets/portrait/0702/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 703: imagePaths = import.meta.glob('../assets/portrait/0703/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 704: imagePaths = import.meta.glob('../assets/portrait/0704/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 705: imagePaths = import.meta.glob('../assets/portrait/0705/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 706: imagePaths = import.meta.glob('../assets/portrait/0706/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 707: imagePaths = import.meta.glob('../assets/portrait/0707/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 708: imagePaths = import.meta.glob('../assets/portrait/0708/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 709: imagePaths = import.meta.glob('../assets/portrait/0709/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 710: imagePaths = import.meta.glob('../assets/portrait/0710/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 711: imagePaths = import.meta.glob('../assets/portrait/0711/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 712: imagePaths = import.meta.glob('../assets/portrait/0712/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 713: imagePaths = import.meta.glob('../assets/portrait/0713/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 714: imagePaths = import.meta.glob('../assets/portrait/0714/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 715: imagePaths = import.meta.glob('../assets/portrait/0715/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 716: imagePaths = import.meta.glob('../assets/portrait/0716/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 717: imagePaths = import.meta.glob('../assets/portrait/0717/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 718: imagePaths = import.meta.glob('../assets/portrait/0718/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 719: imagePaths = import.meta.glob('../assets/portrait/0719/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 720: imagePaths = import.meta.glob('../assets/portrait/0720/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 721: imagePaths = import.meta.glob('../assets/portrait/0721/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 722: imagePaths = import.meta.glob('../assets/portrait/0722/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 723: imagePaths = import.meta.glob('../assets/portrait/0723/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 724: imagePaths = import.meta.glob('../assets/portrait/0724/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 725: imagePaths = import.meta.glob('../assets/portrait/0725/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 726: imagePaths = import.meta.glob('../assets/portrait/0726/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 727: imagePaths = import.meta.glob('../assets/portrait/0727/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 728: imagePaths = import.meta.glob('../assets/portrait/0728/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 729: imagePaths = import.meta.glob('../assets/portrait/0729/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 730: imagePaths = import.meta.glob('../assets/portrait/0730/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 731: imagePaths = import.meta.glob('../assets/portrait/0731/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 732: imagePaths = import.meta.glob('../assets/portrait/0732/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 733: imagePaths = import.meta.glob('../assets/portrait/0733/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 734: imagePaths = import.meta.glob('../assets/portrait/0734/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 735: imagePaths = import.meta.glob('../assets/portrait/0735/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 736: imagePaths = import.meta.glob('../assets/portrait/0736/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 737: imagePaths = import.meta.glob('../assets/portrait/0737/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 738: imagePaths = import.meta.glob('../assets/portrait/0738/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 739: imagePaths = import.meta.glob('../assets/portrait/0739/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 740: imagePaths = import.meta.glob('../assets/portrait/0740/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 741: imagePaths = import.meta.glob('../assets/portrait/0741/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 742: imagePaths = import.meta.glob('../assets/portrait/0742/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 743: imagePaths = import.meta.glob('../assets/portrait/0743/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 744: imagePaths = import.meta.glob('../assets/portrait/0744/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 745: imagePaths = import.meta.glob('../assets/portrait/0745/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 746: imagePaths = import.meta.glob('../assets/portrait/0746/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 747: imagePaths = import.meta.glob('../assets/portrait/0747/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 748: imagePaths = import.meta.glob('../assets/portrait/0748/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 749: imagePaths = import.meta.glob('../assets/portrait/0749/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 750: imagePaths = import.meta.glob('../assets/portrait/0750/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 751: imagePaths = import.meta.glob('../assets/portrait/0751/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 752: imagePaths = import.meta.glob('../assets/portrait/0752/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 753: imagePaths = import.meta.glob('../assets/portrait/0753/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 754: imagePaths = import.meta.glob('../assets/portrait/0754/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 755: imagePaths = import.meta.glob('../assets/portrait/0755/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 756: imagePaths = import.meta.glob('../assets/portrait/0756/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 757: imagePaths = import.meta.glob('../assets/portrait/0757/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 758: imagePaths = import.meta.glob('../assets/portrait/0758/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 759: imagePaths = import.meta.glob('../assets/portrait/0759/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 760: imagePaths = import.meta.glob('../assets/portrait/0760/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 761: imagePaths = import.meta.glob('../assets/portrait/0761/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 762: imagePaths = import.meta.glob('../assets/portrait/0762/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 763: imagePaths = import.meta.glob('../assets/portrait/0763/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 764: imagePaths = import.meta.glob('../assets/portrait/0764/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 765: imagePaths = import.meta.glob('../assets/portrait/0765/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 766: imagePaths = import.meta.glob('../assets/portrait/0766/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 767: imagePaths = import.meta.glob('../assets/portrait/0767/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 768: imagePaths = import.meta.glob('../assets/portrait/0768/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 769: imagePaths = import.meta.glob('../assets/portrait/0769/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 770: imagePaths = import.meta.glob('../assets/portrait/0770/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 771: imagePaths = import.meta.glob('../assets/portrait/0771/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 772: imagePaths = import.meta.glob('../assets/portrait/0772/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 773: imagePaths = import.meta.glob('../assets/portrait/0773/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 774: imagePaths = import.meta.glob('../assets/portrait/0774/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 775: imagePaths = import.meta.glob('../assets/portrait/0775/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 776: imagePaths = import.meta.glob('../assets/portrait/0776/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 777: imagePaths = import.meta.glob('../assets/portrait/0777/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 778: imagePaths = import.meta.glob('../assets/portrait/0778/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 779: imagePaths = import.meta.glob('../assets/portrait/0779/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 780: imagePaths = import.meta.glob('../assets/portrait/0780/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 781: imagePaths = import.meta.glob('../assets/portrait/0781/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 782: imagePaths = import.meta.glob('../assets/portrait/0782/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 783: imagePaths = import.meta.glob('../assets/portrait/0783/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 784: imagePaths = import.meta.glob('../assets/portrait/0784/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 785: imagePaths = import.meta.glob('../assets/portrait/0785/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 786: imagePaths = import.meta.glob('../assets/portrait/0786/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 787: imagePaths = import.meta.glob('../assets/portrait/0787/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 788: imagePaths = import.meta.glob('../assets/portrait/0788/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 789: imagePaths = import.meta.glob('../assets/portrait/0789/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 790: imagePaths = import.meta.glob('../assets/portrait/0790/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 791: imagePaths = import.meta.glob('../assets/portrait/0791/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 792: imagePaths = import.meta.glob('../assets/portrait/0792/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 793: imagePaths = import.meta.glob('../assets/portrait/0793/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 794: imagePaths = import.meta.glob('../assets/portrait/0794/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 795: imagePaths = import.meta.glob('../assets/portrait/0795/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 796: imagePaths = import.meta.glob('../assets/portrait/0796/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 797: imagePaths = import.meta.glob('../assets/portrait/0797/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 798: imagePaths = import.meta.glob('../assets/portrait/0798/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 799: imagePaths = import.meta.glob('../assets/portrait/0799/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 800: imagePaths = import.meta.glob('../assets/portrait/0800/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 801: imagePaths = import.meta.glob('../assets/portrait/0801/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 802: imagePaths = import.meta.glob('../assets/portrait/0802/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 803: imagePaths = import.meta.glob('../assets/portrait/0803/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 804: imagePaths = import.meta.glob('../assets/portrait/0804/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 805: imagePaths = import.meta.glob('../assets/portrait/0805/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 806: imagePaths = import.meta.glob('../assets/portrait/0806/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 807: imagePaths = import.meta.glob('../assets/portrait/0807/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 808: imagePaths = import.meta.glob('../assets/portrait/0808/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 809: imagePaths = import.meta.glob('../assets/portrait/0809/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 810: imagePaths = import.meta.glob('../assets/portrait/0810/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 811: imagePaths = import.meta.glob('../assets/portrait/0811/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 812: imagePaths = import.meta.glob('../assets/portrait/0812/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 813: imagePaths = import.meta.glob('../assets/portrait/0813/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 814: imagePaths = import.meta.glob('../assets/portrait/0814/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 815: imagePaths = import.meta.glob('../assets/portrait/0815/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 816: imagePaths = import.meta.glob('../assets/portrait/0816/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 817: imagePaths = import.meta.glob('../assets/portrait/0817/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 818: imagePaths = import.meta.glob('../assets/portrait/0818/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 819: imagePaths = import.meta.glob('../assets/portrait/0819/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 820: imagePaths = import.meta.glob('../assets/portrait/0820/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 821: imagePaths = import.meta.glob('../assets/portrait/0821/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 822: imagePaths = import.meta.glob('../assets/portrait/0822/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 823: imagePaths = import.meta.glob('../assets/portrait/0823/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 824: imagePaths = import.meta.glob('../assets/portrait/0824/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 825: imagePaths = import.meta.glob('../assets/portrait/0825/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 826: imagePaths = import.meta.glob('../assets/portrait/0826/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 827: imagePaths = import.meta.glob('../assets/portrait/0827/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 828: imagePaths = import.meta.glob('../assets/portrait/0828/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 829: imagePaths = import.meta.glob('../assets/portrait/0829/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 830: imagePaths = import.meta.glob('../assets/portrait/0830/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 831: imagePaths = import.meta.glob('../assets/portrait/0831/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 832: imagePaths = import.meta.glob('../assets/portrait/0832/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 833: imagePaths = import.meta.glob('../assets/portrait/0833/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 834: imagePaths = import.meta.glob('../assets/portrait/0834/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 835: imagePaths = import.meta.glob('../assets/portrait/0835/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 836: imagePaths = import.meta.glob('../assets/portrait/0836/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 837: imagePaths = import.meta.glob('../assets/portrait/0837/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 838: imagePaths = import.meta.glob('../assets/portrait/0838/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 839: imagePaths = import.meta.glob('../assets/portrait/0839/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 840: imagePaths = import.meta.glob('../assets/portrait/0840/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 841: imagePaths = import.meta.glob('../assets/portrait/0841/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 842: imagePaths = import.meta.glob('../assets/portrait/0842/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 843: imagePaths = import.meta.glob('../assets/portrait/0843/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 844: imagePaths = import.meta.glob('../assets/portrait/0844/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 845: imagePaths = import.meta.glob('../assets/portrait/0845/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 846: imagePaths = import.meta.glob('../assets/portrait/0846/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 847: imagePaths = import.meta.glob('../assets/portrait/0847/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 848: imagePaths = import.meta.glob('../assets/portrait/0848/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 849: imagePaths = import.meta.glob('../assets/portrait/0849/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 850: imagePaths = import.meta.glob('../assets/portrait/0850/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 851: imagePaths = import.meta.glob('../assets/portrait/0851/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 852: imagePaths = import.meta.glob('../assets/portrait/0852/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 853: imagePaths = import.meta.glob('../assets/portrait/0853/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 854: imagePaths = import.meta.glob('../assets/portrait/0854/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 855: imagePaths = import.meta.glob('../assets/portrait/0855/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 856: imagePaths = import.meta.glob('../assets/portrait/0856/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 857: imagePaths = import.meta.glob('../assets/portrait/0857/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 858: imagePaths = import.meta.glob('../assets/portrait/0858/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 859: imagePaths = import.meta.glob('../assets/portrait/0859/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 860: imagePaths = import.meta.glob('../assets/portrait/0860/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 861: imagePaths = import.meta.glob('../assets/portrait/0861/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 862: imagePaths = import.meta.glob('../assets/portrait/0862/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 863: imagePaths = import.meta.glob('../assets/portrait/0863/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 864: imagePaths = import.meta.glob('../assets/portrait/0864/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 865: imagePaths = import.meta.glob('../assets/portrait/0865/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 866: imagePaths = import.meta.glob('../assets/portrait/0866/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 867: imagePaths = import.meta.glob('../assets/portrait/0867/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 868: imagePaths = import.meta.glob('../assets/portrait/0868/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 869: imagePaths = import.meta.glob('../assets/portrait/0869/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 870: imagePaths = import.meta.glob('../assets/portrait/0870/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 871: imagePaths = import.meta.glob('../assets/portrait/0871/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 872: imagePaths = import.meta.glob('../assets/portrait/0872/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 873: imagePaths = import.meta.glob('../assets/portrait/0873/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 874: imagePaths = import.meta.glob('../assets/portrait/0874/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 875: imagePaths = import.meta.glob('../assets/portrait/0875/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 876: imagePaths = import.meta.glob('../assets/portrait/0876/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 877: imagePaths = import.meta.glob('../assets/portrait/0877/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 878: imagePaths = import.meta.glob('../assets/portrait/0878/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 879: imagePaths = import.meta.glob('../assets/portrait/0879/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 880: imagePaths = import.meta.glob('../assets/portrait/0880/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 881: imagePaths = import.meta.glob('../assets/portrait/0881/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 882: imagePaths = import.meta.glob('../assets/portrait/0882/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 883: imagePaths = import.meta.glob('../assets/portrait/0883/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 884: imagePaths = import.meta.glob('../assets/portrait/0884/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 885: imagePaths = import.meta.glob('../assets/portrait/0885/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 886: imagePaths = import.meta.glob('../assets/portrait/0886/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 887: imagePaths = import.meta.glob('../assets/portrait/0887/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 888: imagePaths = import.meta.glob('../assets/portrait/0888/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 889: imagePaths = import.meta.glob('../assets/portrait/0889/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 890: imagePaths = import.meta.glob('../assets/portrait/0890/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 891: imagePaths = import.meta.glob('../assets/portrait/0891/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 892: imagePaths = import.meta.glob('../assets/portrait/0892/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 893: imagePaths = import.meta.glob('../assets/portrait/0893/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 894: imagePaths = import.meta.glob('../assets/portrait/0894/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 895: imagePaths = import.meta.glob('../assets/portrait/0895/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 896: imagePaths = import.meta.glob('../assets/portrait/0896/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 897: imagePaths = import.meta.glob('../assets/portrait/0897/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 898: imagePaths = import.meta.glob('../assets/portrait/0898/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 899: imagePaths = import.meta.glob('../assets/portrait/0899/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 900: imagePaths = import.meta.glob('../assets/portrait/0900/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 901: imagePaths = import.meta.glob('../assets/portrait/0901/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 902: imagePaths = import.meta.glob('../assets/portrait/0902/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 903: imagePaths = import.meta.glob('../assets/portrait/0903/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 904: imagePaths = import.meta.glob('../assets/portrait/0904/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 905: imagePaths = import.meta.glob('../assets/portrait/0905/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 906: imagePaths = import.meta.glob('../assets/portrait/0906/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 907: imagePaths = import.meta.glob('../assets/portrait/0907/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 908: imagePaths = import.meta.glob('../assets/portrait/0908/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 909: imagePaths = import.meta.glob('../assets/portrait/0909/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 910: imagePaths = import.meta.glob('../assets/portrait/0910/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 911: imagePaths = import.meta.glob('../assets/portrait/0911/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 912: imagePaths = import.meta.glob('../assets/portrait/0912/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 913: imagePaths = import.meta.glob('../assets/portrait/0913/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 914: imagePaths = import.meta.glob('../assets/portrait/0914/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 915: imagePaths = import.meta.glob('../assets/portrait/0915/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 916: imagePaths = import.meta.glob('../assets/portrait/0916/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 917: imagePaths = import.meta.glob('../assets/portrait/0917/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 918: imagePaths = import.meta.glob('../assets/portrait/0918/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 919: imagePaths = import.meta.glob('../assets/portrait/0919/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 920: imagePaths = import.meta.glob('../assets/portrait/0920/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 921: imagePaths = import.meta.glob('../assets/portrait/0921/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 922: imagePaths = import.meta.glob('../assets/portrait/0922/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 923: imagePaths = import.meta.glob('../assets/portrait/0923/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 924: imagePaths = import.meta.glob('../assets/portrait/0924/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 925: imagePaths = import.meta.glob('../assets/portrait/0925/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 926: imagePaths = import.meta.glob('../assets/portrait/0926/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 927: imagePaths = import.meta.glob('../assets/portrait/0927/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 928: imagePaths = import.meta.glob('../assets/portrait/0928/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 929: imagePaths = import.meta.glob('../assets/portrait/0929/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 930: imagePaths = import.meta.glob('../assets/portrait/0930/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 931: imagePaths = import.meta.glob('../assets/portrait/0931/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 932: imagePaths = import.meta.glob('../assets/portrait/0932/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 933: imagePaths = import.meta.glob('../assets/portrait/0933/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 934: imagePaths = import.meta.glob('../assets/portrait/0934/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 935: imagePaths = import.meta.glob('../assets/portrait/0935/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 936: imagePaths = import.meta.glob('../assets/portrait/0936/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 937: imagePaths = import.meta.glob('../assets/portrait/0937/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 938: imagePaths = import.meta.glob('../assets/portrait/0938/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 939: imagePaths = import.meta.glob('../assets/portrait/0939/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 940: imagePaths = import.meta.glob('../assets/portrait/0940/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 941: imagePaths = import.meta.glob('../assets/portrait/0941/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 942: imagePaths = import.meta.glob('../assets/portrait/0942/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 943: imagePaths = import.meta.glob('../assets/portrait/0943/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 944: imagePaths = import.meta.glob('../assets/portrait/0944/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 945: imagePaths = import.meta.glob('../assets/portrait/0945/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 946: imagePaths = import.meta.glob('../assets/portrait/0946/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 947: imagePaths = import.meta.glob('../assets/portrait/0947/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 948: imagePaths = import.meta.glob('../assets/portrait/0948/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 949: imagePaths = import.meta.glob('../assets/portrait/0949/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 950: imagePaths = import.meta.glob('../assets/portrait/0950/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 951: imagePaths = import.meta.glob('../assets/portrait/0951/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 952: imagePaths = import.meta.glob('../assets/portrait/0952/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 953: imagePaths = import.meta.glob('../assets/portrait/0953/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 954: imagePaths = import.meta.glob('../assets/portrait/0954/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 955: imagePaths = import.meta.glob('../assets/portrait/0955/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 956: imagePaths = import.meta.glob('../assets/portrait/0956/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 957: imagePaths = import.meta.glob('../assets/portrait/0957/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 958: imagePaths = import.meta.glob('../assets/portrait/0958/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 959: imagePaths = import.meta.glob('../assets/portrait/0959/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 960: imagePaths = import.meta.glob('../assets/portrait/0960/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 961: imagePaths = import.meta.glob('../assets/portrait/0961/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 962: imagePaths = import.meta.glob('../assets/portrait/0962/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 963: imagePaths = import.meta.glob('../assets/portrait/0963/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 964: imagePaths = import.meta.glob('../assets/portrait/0964/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 965: imagePaths = import.meta.glob('../assets/portrait/0965/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 966: imagePaths = import.meta.glob('../assets/portrait/0966/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 967: imagePaths = import.meta.glob('../assets/portrait/0967/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 968: imagePaths = import.meta.glob('../assets/portrait/0968/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 969: imagePaths = import.meta.glob('../assets/portrait/0969/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 970: imagePaths = import.meta.glob('../assets/portrait/0970/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 971: imagePaths = import.meta.glob('../assets/portrait/0971/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 972: imagePaths = import.meta.glob('../assets/portrait/0972/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 973: imagePaths = import.meta.glob('../assets/portrait/0973/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 974: imagePaths = import.meta.glob('../assets/portrait/0974/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 975: imagePaths = import.meta.glob('../assets/portrait/0975/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 976: imagePaths = import.meta.glob('../assets/portrait/0976/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 977: imagePaths = import.meta.glob('../assets/portrait/0977/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 978: imagePaths = import.meta.glob('../assets/portrait/0978/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 979: imagePaths = import.meta.glob('../assets/portrait/0979/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 980: imagePaths = import.meta.glob('../assets/portrait/0980/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 981: imagePaths = import.meta.glob('../assets/portrait/0981/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 982: imagePaths = import.meta.glob('../assets/portrait/0982/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 983: imagePaths = import.meta.glob('../assets/portrait/0983/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 984: imagePaths = import.meta.glob('../assets/portrait/0984/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 985: imagePaths = import.meta.glob('../assets/portrait/0985/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 986: imagePaths = import.meta.glob('../assets/portrait/0986/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 987: imagePaths = import.meta.glob('../assets/portrait/0987/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 988: imagePaths = import.meta.glob('../assets/portrait/0988/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 989: imagePaths = import.meta.glob('../assets/portrait/0989/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 990: imagePaths = import.meta.glob('../assets/portrait/0990/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 991: imagePaths = import.meta.glob('../assets/portrait/0991/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 992: imagePaths = import.meta.glob('../assets/portrait/0992/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 993: imagePaths = import.meta.glob('../assets/portrait/0993/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 994: imagePaths = import.meta.glob('../assets/portrait/0994/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 995: imagePaths = import.meta.glob('../assets/portrait/0995/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 996: imagePaths = import.meta.glob('../assets/portrait/0996/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 997: imagePaths = import.meta.glob('../assets/portrait/0997/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 998: imagePaths = import.meta.glob('../assets/portrait/0998/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 999: imagePaths = import.meta.glob('../assets/portrait/0999/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 1000: imagePaths = import.meta.glob('../assets/portrait/1000/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 1001: imagePaths = import.meta.glob('../assets/portrait/1001/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 1002: imagePaths = import.meta.glob('../assets/portrait/1002/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 1003: imagePaths = import.meta.glob('../assets/portrait/1003/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 1004: imagePaths = import.meta.glob('../assets/portrait/1004/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 1005: imagePaths = import.meta.glob('../assets/portrait/1005/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 1006: imagePaths = import.meta.glob('../assets/portrait/1006/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 1007: imagePaths = import.meta.glob('../assets/portrait/1007/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 1008: imagePaths = import.meta.glob('../assets/portrait/1008/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 1009: imagePaths = import.meta.glob('../assets/portrait/1009/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 1010: imagePaths = import.meta.glob('../assets/portrait/1010/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 1011: imagePaths = import.meta.glob('../assets/portrait/1011/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 1012: imagePaths = import.meta.glob('../assets/portrait/1012/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 1013: imagePaths = import.meta.glob('../assets/portrait/1013/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 1014: imagePaths = import.meta.glob('../assets/portrait/1014/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 1015: imagePaths = import.meta.glob('../assets/portrait/1015/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 1016: imagePaths = import.meta.glob('../assets/portrait/1016/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 1017: imagePaths = import.meta.glob('../assets/portrait/1017/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 1018: imagePaths = import.meta.glob('../assets/portrait/1018/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 1019: imagePaths = import.meta.glob('../assets/portrait/1019/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 1020: imagePaths = import.meta.glob('../assets/portrait/1020/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 1021: imagePaths = import.meta.glob('../assets/portrait/1021/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 1022: imagePaths = import.meta.glob('../assets/portrait/1022/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 1023: imagePaths = import.meta.glob('../assets/portrait/1023/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 1024: imagePaths = import.meta.glob('../assets/portrait/1024/*.png', {as: 'url', import: 'default', eager: false}); break;
      case 1025: imagePaths = import.meta.glob('../assets/portrait/1025/*.png', {as: 'url', import: 'default', eager: false}); break;
    }
  
  return imagePaths;
}