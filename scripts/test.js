//Referencias a los mensajes o alertas del DOM
let userTurnMessage = document.getElementById('user');
let botTurnMessage = document.getElementById('bot');
let alertUserWon = document.getElementById('userwon');
let alertBotWon = document.getElementById('botwon');

//Anadiendo clases de bootstrap para desaparecer los mensajes y alertas del DOM
botTurnMessage.classList.add("d-none")
userTurnMessage.classList.add("d-none")
alertUserWon.classList.add("d-none")
alertBotWon.classList.add("d-none")

//Funcion que permite crear una nueva partida reiniciando los valores
function createBoard(){
    let someoneWon = false; 
    const canvas = document.getElementById('canvas');
    let ctx = canvas.getContext('2d');
    let boardSize = document.getElementById('boardSize').value * 100; //Tamano del tablero, 900x900 es el max
    let squaresSize = 10;   //Tamano relativo (no en px) de cada celda (no del circulo como tal)
    let distance = 100; //Tamano en px de cada celda
    let started = false; //Senala si una linea ha sido iniciada (solo aplica para el usuario y es para saber donde comienzan y terminan las lineas)
    let [x_start,y_start] = [0,0] //Coordenadas del punto que se tocó de primero
    let [x_end,y_end] = [0,0]   //Coordenadas del segundo punto que se tocó
    let squaresPerLine = boardSize/distance //Determina cuantos cuadros hay por lado 900/100 = 9 cuadros por lado (luego cuando se trata como arreglo se le resta 1)
    let botPlaying = document.getElementById('firstToPlay').checked //Determina cual es el jugador actual (global) y su primer valor es el del checkbox del DOM
    let invalidForBot = []; //Senala los movimientos invalidos para la ia
    let invalidForUser = []; //Senala los movimientos invalidos para el usuario
    let onlyLines =[]; //Senala las casillas donde solo pueden haber lineas 
    let availableLines = []; //Senala las casillas con lineas disponibles para ser jugadas
    let boardAsGrid = Array.from(Array(squaresPerLine), () => new Array(squaresPerLine)) //Tablero del juego en array
    let iteracion = 0
    let choice
    ctx.clearRect(0, 0, canvas.width, canvas.height); //Limpia el canvas cuando se inicia una nueva partida

    //Se vuelven a anadir las clases para desaparecer los elementos por si se hace reinicio
    //en el classlist no se repiten clases
    botTurnMessage.classList.add("d-none")
    userTurnMessage.classList.add("d-none")
    alertUserWon.classList.add("d-none")
    alertBotWon.classList.add("d-none")

    //Bucle que crea los circulos, y agrega los vertices correspondientes a cada lista
    for(let i=0; i<squaresPerLine; i++){
        ctx.fillStyle = 'green';
        ctx.fillRect(i*distance,0,squaresSize,boardSize);
        ctx.fillRect(0,i*distance,boardSize,squaresSize);
        let y = distance*(i+1)/2 + distance*(i)/2

        for(let j=0; j<squaresPerLine; j++){
            let v = (i * (squaresPerLine-1) ) + (j + i)
            boardAsGrid[i][j] = v //Cada vertice se agrega en el tablero

            if((squaresPerLine-1)%2==0 && v%2==0){
                onlyLines.push(v)   
            }

            if((squaresPerLine-1)%2!=0){
                if(i%2==0 && v%2==0){
                    onlyLines.push(v)
                }
                if(i%2!=0 && v%2!=0){
                    onlyLines.push(v)
                }
            }

            if(j%2==0) invalidForBot.push(v)
            if(i%2==0) invalidForUser.push(v)


            if(i%2==j%2){
                ctx.fillStyle = 'green'
                ctx.beginPath();
                let x = distance*(j+1)/2 + distance*(j)/2
                ctx.arc(x,y,distance/4,0,Math.PI*2,true);
                ctx.fill();
                continue
            }

            //Sin importar si la cantidad por lado es par las casillas del jugador siempre serán las de las filas pares
            if(i%2){
                ctx.fillStyle = 'blue'
                boardAsGrid[i][j] = 'O' //Almacena las casillas del jugador como O (esto al final incluirá tanto lineas como circulos)
                invalidForBot.push(v)
            }
            else{ 
                ctx.fillStyle = 'red'
                boardAsGrid[i][j] = 'X'  
                invalidForUser.push(v)
            }
            ctx.beginPath();
            let x = distance*(j+1)/2 + distance*(j)/2
            ctx.arc(x,y,distance/4,0,Math.PI*2,true);
            ctx.fill();
        }
    }

    //Esto se hace para no tener elementos repetidos en los arrays
    onlyLines =  Array.from(new Set(onlyLines));
    availableLines = Array.from(onlyLines);

    //Se eliminan de los arrays invalidos las casillas que solo sean para lineas
    invalidForBot = Array.from(new Set(invalidForBot.filter(x => !onlyLines.includes(x))));
    invalidForUser = Array.from(new Set(invalidForUser.filter(x => !onlyLines.includes(x))));

    botPlaying? botPlay() : userTurnMessage.classList.remove("d-none")

    //Funcion que invoca a minimax
    function botPlay(){
        botTurnMessage.classList.remove("d-none")
        const bestPlayInfo = minimax(boardAsGrid, 'X'); //Se le pasa el tablero actual porque es un metodo recursivo y la marca del bot (X)
        let lineEnds = lineToEnds(choice) //De la linea obtenida por el minimax se obtiene los vertices que producen dicha linea
        let x_start = vertToCoord(lineEnds[0])[1]
        let y_start = vertToCoord(lineEnds[0])[0]
        let x_end = vertToCoord(lineEnds[1])[1] //Tener en cuenta que la forma en la que está hecha la funcion linetoends devuelve los valores al opuesto del sentido comun aqui
        let y_end = vertToCoord(lineEnds[1])[0]
        console.log(`jugando en el v: ${choice}`)
        console.log(`jugada: [${lineEnds}]`)
        botPlaying = true
        iteracion = 0
        makeMove(choice || -1, x_start, y_start, x_end, y_end) //Si por alguna razón bestplayinfo no tiene un index se le pasa -1 para que devuelva movimiento invalido y no de error
    }

    //Proceso inverso de aquel para obtener la linea entre dos vertices
    function lineToEnds(line){
        let linem = line-squaresPerLine
        let lineM = line+squaresPerLine

        let lineIzq = line-1;
        let lineDer = line+1;

        //Las lineas compartidas (como las del medio) deben tambien pertenecer a la lista opuesta
        //es decir si busco una posible linea jugada por el bot esta debe aparecer en invalidforuser
        if(invalidForUser.includes(linem)&&invalidForUser.includes(lineM)){
            return [linem, lineM]
        }

        if(invalidForUser.includes(lineIzq)&&invalidForUser.includes(lineDer)){
            return [lineIzq, lineDer]
        }

        return[0,0]
    }

    //Convierte un vertice a sus coordenadas ej. vert = 1 -> [0,1]
    function vertToCoord(vert){
        let i = Math.floor(vert/squaresPerLine)
        let j = vert - (i*squaresPerLine)
        return [i, j]
    }

    //Determina si una linea es jugable viendo si se permite para el jugador actual y está disponible para ser jugada (no ha sido jugada antes)
    function lineIsAlowed(line){
        if(botPlaying){
            return !invalidForBot.includes(line) && availableLines.includes(line)
        }
        return !invalidForUser.includes(line) && availableLines.includes(line)
    }

    //Determina las lineas disponibles para ser jugadas (esta funcion es necesaria para el metodo minimax)
    function availableLinesFun(isPlayingBot){
        let nonPlayed = []
        for(let i=0; i<squaresPerLine; i++){
            for(let j=0; j<squaresPerLine ; j++){
                if(boardAsGrid[i][j] != 'X' && boardAsGrid[i][j] != 'O'){
                    let pushLine = false
                    if(isPlayingBot){
                        switch ((squaresPerLine-1)%2==0) {
                            case true:
                                if(j!=0 && j!=squaresPerLine-1) pushLine = true
                                break;
                            case false:
                                if(j!=0 && i!=squaresPerLine-1) pushLine = true
                                break;
                            default:
                                pushLine = false
                                break;
                        }
                    }

                    else switch ((squaresPerLine-1)%2==0) {
                        case true:
                            if(i!=0 && i!=squaresPerLine-1) pushLine = true
                            break;
                        case false:
                            if(i!=0 && j!=squaresPerLine-1) pushLine = true
                            break;
                        default:
                            pushLine = false
                            break;
                    }
                    pushLine?  nonPlayed.push((i * (squaresPerLine-1) ) + (i + j)) : null
                    //nonPlayed.push([i,j])
                }
            }
        }
        return nonPlayed
    }

    //Las funciones isPath, isSafe y Checkpath son implementadas de un algoritmo para buscar
    //si existe un camino en un laberinto
    function isPath(matrix,n)
    {
        
        // Defining visited array to keep
            // track of already visited indexes
            let visited = new Array(n);
                for(let i=0;i<n;i++)
                {
                    visited[i]=new Array(n);
                    for(let j=0;j<n;j++)
                    {
                        visited[i][j]=false;
                    }
                }
    
            // Flag to indicate whether the
            // path exists or not
            let flag = false;
    
            for (let i = 0; i < n; i++) {
                for (let j = 0; j < n; j++) {
                    // if matrix[i][j] is source
                    // and it is not visited
                    if (matrix[i][j] == 1 && !visited[i][j])
    
                        // Starting from i, j and
                        // then finding the path
                        if (checkPath(matrix, i, j, visited)) {
                            // if path exists
                            flag = true;
                            break;
                        }
                }
            }
            return flag
    }
    
    // Method for checking boundaries
    function isSafe(i,j,matrix)
    {
        if (
                i >= 0 && i < matrix.length
                && j >= 0
                && j < matrix[0].length)
                return true;
            return false;
    }
    
    // Returns true if there is a
        // path from a source (a
        // cell with value 1) to a
        // destination (a cell with
        // value 2)
    function checkPath(matrix,i,j,visited)
    {
        // Checking the boundaries, walls and
            // whether the cell is unvisited
            if (
                isSafe(i, j, matrix)
                && matrix[i][j] != 0
                && !visited[i][j]) {
                // Make the cell visited
                visited[i][j] = true;
    
                // if the cell is the required
                // destination then return true
                if (matrix[i][j] == 2)
                    return true;
    
                // traverse up
                let up = checkPath(
                    matrix, i - 1,
                    j, visited);
    
                // if path is found in up
                // direction return true
                if (up)
                    return true;
    
                // traverse left
                let left
                    = checkPath(
                        matrix, i, j - 1, visited);
    
                // if path is found in left
                // direction return true
                if (left)
                    return true;
    
                // traverse down
                let down = checkPath(
                    matrix, i + 1, j, visited);
    
                // if path is found in down
                // direction return true
                if (down)
                    return true;
    
                // traverse right
                let right
                    = checkPath(
                        matrix, i, j + 1,
                        visited);
    
                // if path is found in right
                // direction return true
                if (right)
                    return true;
            }
            // no path has been found
            return false;
    }

    //Funcion que retorna un tablero de jugador
    //es decir, un tablero donde solo se muestran las jugadas del jugador
    //y las demás jugadas se hacen 0
    function prepareBoard(playerisBot){
        let arr = JSON.parse(JSON.stringify(boardAsGrid));
        let currMark = playerisBot? 'X':'O'
        for (let i = 0; i < squaresPerLine; i++) {
            for (let j = 0; j < squaresPerLine; j++) {
                if (arr[i][j] === currMark){
                    if(playerisBot){
                        if (i==0) {
                            arr[i][j] = 1; 
                            continue;
                        }
                        
                        if(((squaresPerLine-1)%2==0 && i === (squaresPerLine-1)) 
                        || (squaresPerLine-1)%2!=0 && (i === (squaresPerLine-1-1))){
                            arr[i][j] = 2 
                            continue
                        }
                    }

                    else{
                        if (j==0) {
                            arr[i][j] = 1; 
                            continue;
                        }

                        if(((squaresPerLine-1)%2==0 && j === (squaresPerLine-1)) 
                        || (squaresPerLine-1)%2!=0 && (j === (squaresPerLine-1-1))){
                            arr[i][j] = 2 
                            continue
                        }
                    }

                    arr[i][j] = 3
                }
                else arr[i][j] = 0
            }
        }
        return arr
    }

    //El valor de retorno de esta funcion es muy necesario para el minimax puesto que es la condicion
    //que detiene la recursividad
    function checkWin2d(playerisBot){
        let flag = 0
        if (isPath(prepareBoard(playerisBot), squaresPerLine)){
            flag = playerisBot?  1 : -1
        }
        return flag
    }

    // Step 6 - Create the minimax algorithm:
    function minimax(currBdSt, currMark) {
        // Step 8 - Store the indexes of all empty cells: 
        //eliminando las esquinas problematicas (en el caso que la cantidad por lado sea impar hay una esquina menos a tener en cuenta)
        const availCellsIndexes = availableLinesFun(currMark==='X')
        //Marcas que se utilizarán en el tablero (boardAsGrid)
        let humanMark = 'O'
        let aiMark = 'X'

        iteracion++
        if(iteracion>10000) return {score: 0, index: choice};
        
        // Step 9 - Check if there is a terminal state:
        if (checkWin2d(false) === -1) {
            return {score: -1}; //Se le resta un numero para que valore la perdida
        } else if (checkWin2d(true) === 1) {
            return {score: 1};
        }
        
        // Step 10 - Create a place to record the outcome of each test drive:
        const allTestPlayInfos = [];
        
        // Step 10 - Create a for-loop statement that will loop through each of the empty cells:
        for (let i = 0; i < availCellsIndexes.length; i++) {
            // Step 11 - Create a place to store this test-play’s terminal score:
            const currentTestPlayInfo = {};
            
            // Step 11 - Save the index number of the cell this for-loop is currently processing:
            let currInx = vertToCoord(availCellsIndexes[i])
            currentTestPlayInfo.index = currBdSt[currInx[0]][currInx[1]];
            choice = currBdSt[currInx[0]][currInx[1]];
            
            // Step 11 - Place the current player’s mark on the cell for-loop is currently processing:
            currBdSt[currInx[0]][currInx[1]] = currMark;
            
            if (currMark === aiMark) {
                // Step 11 - Recursively run the minimax function for the new board:
                const result = minimax(currBdSt, humanMark);
                
                // Step 12 - Save the result variable’s score into the currentTestPlayInfo object:
                currentTestPlayInfo.score = result.score;
            } else {
                // Step 11 - Recursively run the minimax function for the new board:
                const result = minimax(currBdSt, aiMark);
                
                // Step 12 - Save the result variable’s score into the currentTestPlayInfo object:
                currentTestPlayInfo.score = result.score;
            }
            
            // Step 12 - Reset the current board back to the state it was before the current player made its move:
            currBdSt[currInx[0]][currInx[1]] = currentTestPlayInfo.index;
            
            // Step 12 - Save the result of the current player’s test-play for future use:
            allTestPlayInfos.push(currentTestPlayInfo);
        }
        
        // Step 15 - Create a store for the best test-play’s reference:
        let bestTestPlay = null;
        
        // Step 16 - Get the reference to the current player’s best test-play:
        if (currMark === aiMark) {
            let bestScore = -Infinity;
            for (let i = 0; i < allTestPlayInfos.length; i++) {
                if (allTestPlayInfos[i].score > bestScore) {
                    bestScore = allTestPlayInfos[i].score;
                    bestTestPlay = i;
                }
            }
        } else {
            let bestScore = Infinity;
            for (let i = 0; i < allTestPlayInfos.length; i++) {
                if (allTestPlayInfos[i].score < bestScore) {
                    bestScore = allTestPlayInfos[i].score;
                    bestTestPlay = i;
                }
            }
        }
        
        // Step 17 - Get the object with the best test-play score for the current player:
        return allTestPlayInfos[bestTestPlay];
    }

    //Determina si el lugar donde se hizo click es valido para el jugador actual 
    //(el bot no hace uso de esta funcion pero igual se tiene en cuenta desde que se hizo el juego para 2 jugadores)
    function clickIsValid(v){
        return !((botPlaying && invalidForBot.includes(v))
        || (!botPlaying && invalidForUser.includes(v))
        || onlyLines.includes(v))
    }

    //Recibe la linea que será jugada y las coordenadas de los puntos que conecta dicha linea
    function makeMove(line, x_start, y_start, x_end, y_end){
        const x_start_aux = (x_start+1)*distance/2 + distance*(x_start)/2
        const y_start_aux = (y_start+1)*distance/2 + distance*(y_start)/2
        const x_end_aux = (x_end+1)*distance/2 + distance*(x_end)/2
        const y_end_aux = (y_end+1)*distance/2 + distance*(y_end)/2

        if(someoneWon) return

        if (!lineIsAlowed(line)){
            console.log("You can't play here")
            if(botPlaying) {
                botTurnMessage.classList.add('d-none');
                botPlaying = false
            }
            return
        }
        ctx.strokeStyle = botPlaying ? 'red' : 'blue'; 
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(x_start_aux, y_start_aux);
        ctx.lineTo(x_end_aux, y_end_aux);
        ctx.stroke();
        
        //Si el bot es quien juega quiere decir que la linea jugada será ahora invalida para el jugador y viceversa
        if(botPlaying){
            invalidForUser.push(line)
        }
        else invalidForBot.push(line)

        //Se elimina la linea jugada de las lineas disponibles
        availableLines = availableLines.filter(i=> i!=line)

        let lineAsCoord = vertToCoord(line)
        boardAsGrid[lineAsCoord[0]][lineAsCoord[1]] = botPlaying ? 'X':'O'
        switch (checkWin2d(botPlaying)) {
            case -1:
                console.log("player wins")
                win = someoneWon = true
                alertUserWon.classList.remove('d-none');
                break;

            case 1:
                console.log("bot wins")
                win = someoneWon = true
                alertBotWon.classList.remove('d-none');
                break;
        
            default:
                break;
        }

        userTurnMessage.classList.toggle('d-none');
        //Cuando el jugador entra en la funcion se llama automaticamente a botplay para que haga su jugada
        //que llamará a esta misma funcion y se desactivará cuando llegue al else siguiente
        if(!botPlaying){
            botPlay()
        }
        else{
            botTurnMessage.classList.add('d-none');
            botPlaying = false
        }
        
        if(someoneWon){
            userTurnMessage.classList.add('d-none');
            botTurnMessage.classList.add('d-none');
        }
    }

    //Función para hacer un movimiento como jugador
    function drawinposition(event){
        if(someoneWon) return
        const rect = canvas.getBoundingClientRect()
        console.log(`clicked in: ${event.clientX-rect.left} , ${event.clientY-rect.top}`)
        console.log(rect)

        x_square = Math.ceil((event.clientX-rect.left)/distance) - 1
        y_square = Math.ceil((event.clientY-rect.top)/distance) - 1
        let v = ((y_square) * (squaresPerLine-1) ) + ((x_square) + (y_square))

        if(!clickIsValid(v)){
            console.log("you can't play here!")
            return false
        }

        if(!started)
        {
            x_start = event.clientX-rect.left
            y_start = event.clientY-rect.top
        }

        else 
        {
            x_end = event.clientX-rect.left
            y_end = event.clientY-rect.top
            
            let mov_x = Math.abs(Math.ceil(x_start/distance) - Math.ceil(x_end/distance))
            let mov_y = Math.abs(Math.ceil(y_start/distance) - Math.ceil(y_end/distance))

            if((mov_x>2||mov_y>2) || (mov_x==1||mov_y==1) || mov_x==mov_y)
            {
                console.log("invalid move")
            }
            else{
                const x_start_aux = Math.ceil(x_start/distance)*distance/2 + distance*(Math.ceil(x_start/distance)-1)/2
                const y_start_aux = Math.ceil(y_start/distance)*distance/2 + distance*(Math.ceil(y_start/distance)-1)/2
                const x_end_aux = Math.ceil(x_end/distance)*distance/2 + distance*(Math.ceil(x_end/distance)-1)/2
                const y_end_aux = Math.ceil(y_end/distance)*distance/2 + distance*(Math.ceil(y_end/distance)-1)/2
                
                let x1 = Math.ceil(x_start/distance) - 1 
                let y1 = Math.ceil(y_start/distance) - 1 
                let x2 = Math.ceil(x_end/distance) - 1 
                let y2 = Math.ceil(y_end/distance) - 1
                let v1 = (y1 * (squaresPerLine-1) ) + (x1 + y1)
                let v2 = (y2 * (squaresPerLine-1) ) + (x2 + y2)
                let line = Math.max(v1, v2)
                
                if(x1 === x2){
                    line-=squaresPerLine;
                }
                else if(y1===y2){
                    line--;
                }
                makeMove(line, x1, y1, x2, y2)
            }
        }
        started=!started;
    }
    document.getElementById("canvas").addEventListener("click",(e)=>{drawinposition(e)});
}